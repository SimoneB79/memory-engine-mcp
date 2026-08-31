"""Read canonical OpenClaw transcripts from a per-agent SQLite database."""

from __future__ import annotations

import hashlib
import json
import sqlite3
import time
from pathlib import Path
from urllib.parse import quote

from transcript_parser import build_batches, decode_archive

SUPPORTED_SCHEMA_VERSIONS = {17, 19}
REQUIRED_TABLES = {
    "schema_meta",
    "session_transcript_active_events",
    "session_transcript_archives",
    "session_windows",
    "transcript_event_identities",
    "transcript_events",
}


class OpenClawTranscriptError(RuntimeError):
    """Base error for transcript source failures."""


class UnsupportedOpenClawSchema(OpenClawTranscriptError):
    """The OpenClaw agent DB schema is not supported."""


class OpenClawSQLiteSource:
    """Read active and archived transcripts without mutating OpenClaw state."""

    def __init__(
        self,
        db_path: str,
        exclude_patterns: list[str] | None = None,
        max_content_chars: int = 2000,
        busy_timeout_ms: int = 5000,
        busy_retries: int = 3,
    ):
        self.db_path = Path(db_path)
        self.exclude_patterns = [p.lower() for p in (exclude_patterns or [])]
        self.max_content_chars = max_content_chars
        self.busy_timeout_ms = busy_timeout_ms
        self.busy_retries = max(1, busy_retries)

    def scan(self):
        if not self.db_path.is_file():
            raise OpenClawTranscriptError(
                f"OpenClaw agent DB not found: {self.db_path}"
            )
        return self._with_retry(self._scan_once)

    def _connect(self):
        uri = f"file:{quote(str(self.db_path))}?mode=ro"
        conn = sqlite3.connect(
            uri, uri=True, timeout=self.busy_timeout_ms / 1000
        )
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA query_only = ON")
        conn.execute(f"PRAGMA busy_timeout = {self.busy_timeout_ms}")
        return conn

    def _with_retry(self, operation):
        delay = 0.05
        for attempt in range(self.busy_retries):
            try:
                return operation()
            except sqlite3.OperationalError as exc:
                if not any(word in str(exc).lower() for word in ("locked", "busy")):
                    raise
                if attempt + 1 == self.busy_retries:
                    raise OpenClawTranscriptError(
                        "OpenClaw transcript DB remained busy after retries"
                    ) from exc
                time.sleep(delay)
                delay *= 2

    def _scan_once(self):
        conn = self._connect()
        try:
            agent_id = self._validate_schema(conn)
            batches = self._read_active(conn, agent_id)
            batches.extend(self._read_archives(conn, agent_id))
            return batches
        finally:
            conn.close()

    def _validate_schema(self, conn):
        tables = {
            row["name"]
            for row in conn.execute(
                "SELECT name FROM sqlite_master WHERE type = 'table'"
            )
        }
        missing = sorted(REQUIRED_TABLES - tables)
        if missing:
            raise UnsupportedOpenClawSchema(
                "OpenClaw transcript schema missing tables: " + ", ".join(missing)
            )
        row = conn.execute(
            """SELECT schema_version, agent_id FROM schema_meta
               WHERE meta_key = 'primary' AND role = 'agent'"""
        ).fetchone()
        if row is None or row["schema_version"] not in SUPPORTED_SCHEMA_VERSIONS:
            found = row["schema_version"] if row else "unknown"
            raise UnsupportedOpenClawSchema(
                f"Unsupported OpenClaw agent schema {found}; "
                f"supported: {sorted(SUPPORTED_SCHEMA_VERSIONS)}"
            )
        return row["agent_id"] or "unknown"

    def _excluded(self, row):
        haystack = " ".join(
            str(row[key] or "")
            for key in ("session_key", "channel", "chat_type", "session_scope")
        ).lower()
        return any(pattern in haystack for pattern in self.exclude_patterns)

    def _read_active(self, conn, agent_id):
        rows = conn.execute(
            """SELECT e.session_id, e.seq, e.event_json, i.event_id,
                      w.session_key, w.channel, w.chat_type, w.session_scope,
                      COALESCE(w.transcript_updated_at, w.updated_at) AS activity
               FROM session_transcript_active_events a
               JOIN transcript_events e
                 ON e.session_id = a.session_id AND e.seq = a.event_seq
               LEFT JOIN transcript_event_identities i
                 ON i.session_id = e.session_id AND i.seq = e.seq
               JOIN session_windows w ON w.session_id = e.session_id
               ORDER BY e.session_id, a.active_position"""
        ).fetchall()
        grouped = {}
        metadata = {}
        for row in rows:
            if self._excluded(row):
                continue
            grouped.setdefault(row["session_id"], []).append(dict(row))
            metadata[row["session_id"]] = row
        batches = []
        for session_id, events in grouped.items():
            activity = int(metadata[session_id]["activity"] or time.time())
            batches.extend(
                build_batches(
                    agent_id=agent_id,
                    session_id=session_id,
                    generation="active",
                    rows=events,
                    last_activity=activity,
                    max_chars=self.max_content_chars,
                )
            )
        return batches

    def _read_archives(self, conn, agent_id):
        batches = []
        for row in conn.execute(
            """SELECT session_id, generation, session_key, encoding,
                      archive_blob, archive_sha256, created_at
               FROM session_transcript_archives ORDER BY created_at"""
        ):
            if any(p in row["session_key"].lower() for p in self.exclude_patterns):
                continue
            blob = bytes(row["archive_blob"])
            if hashlib.sha256(blob).hexdigest() != row["archive_sha256"]:
                raise OpenClawTranscriptError(
                    f"Transcript archive checksum mismatch for {row['session_id']}"
                )
            payload = decode_archive(blob, row["encoding"])
            events = []
            for seq, line in enumerate(payload.decode("utf-8").splitlines()):
                try:
                    event = json.loads(line)
                except json.JSONDecodeError:
                    continue
                events.append(
                    {
                        "seq": event.get("seq", seq),
                        "event_id": event.get("id"),
                        "event_json": event,
                    }
                )
            batches.extend(
                build_batches(
                    agent_id=agent_id,
                    session_id=row["session_id"],
                    generation=row["generation"],
                    rows=events,
                    last_activity=int(row["created_at"]),
                    max_chars=self.max_content_chars,
                )
            )
        return batches
