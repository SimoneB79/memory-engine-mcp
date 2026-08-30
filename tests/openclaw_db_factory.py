"""Minimal OpenClaw schema v17 fixture used by transcript tests."""

import hashlib
import json
import sqlite3
import time


def create_openclaw_db(path, schema_version=17, wal=False):
    conn = sqlite3.connect(path)
    if wal:
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA wal_autocheckpoint=0")
    conn.executescript(
        """
        CREATE TABLE schema_meta (
            meta_key TEXT PRIMARY KEY, role TEXT, schema_version INTEGER,
            agent_id TEXT, app_version TEXT
        );
        CREATE TABLE session_windows (
            session_id TEXT PRIMARY KEY, session_key TEXT,
            session_scope TEXT, updated_at INTEGER,
            transcript_updated_at INTEGER, channel TEXT, chat_type TEXT
        );
        CREATE TABLE transcript_events (
            session_id TEXT, seq INTEGER, event_json TEXT,
            created_at INTEGER, PRIMARY KEY(session_id, seq)
        );
        CREATE TABLE transcript_event_identities (
            session_id TEXT, event_id TEXT, seq INTEGER,
            PRIMARY KEY(session_id, event_id)
        );
        CREATE TABLE session_transcript_active_events (
            session_id TEXT, active_position INTEGER, event_seq INTEGER,
            message_position INTEGER, PRIMARY KEY(session_id, active_position)
        );
        CREATE TABLE session_transcript_archives (
            session_id TEXT, generation TEXT, session_key TEXT,
            reason TEXT, encoding TEXT, archive_blob BLOB,
            archive_sha256 TEXT, created_at INTEGER
        );
        """
    )
    conn.execute(
        "INSERT INTO schema_meta VALUES ('primary','agent',?,'main','test')",
        (schema_version,),
    )
    return conn


def add_session(conn, session_id="session-a", session_key="agent:main:test"):
    now = int(time.time())
    conn.execute(
        """INSERT INTO session_windows
           VALUES (?, ?, 'conversation', ?, ?, 'whatsapp', 'direct')""",
        (session_id, session_key, now, now),
    )


def message_event(event_id, role, content, timestamp="2026-08-30T12:00:00Z", meta=None):
    message = {"role": role, "content": content}
    if meta:
        message["__openclaw"] = meta
    return {
        "type": "message",
        "id": event_id,
        "timestamp": timestamp,
        "message": message,
    }


def add_active_event(conn, event, seq, session_id="session-a", active_position=None):
    event_id = event.get("id", f"event-{seq}")
    position = seq if active_position is None else active_position
    conn.execute(
        "INSERT INTO transcript_events VALUES (?, ?, ?, ?)",
        (session_id, seq, json.dumps(event), int(time.time())),
    )
    conn.execute(
        "INSERT INTO transcript_event_identities VALUES (?, ?, ?)",
        (session_id, event_id, seq),
    )
    conn.execute(
        "INSERT INTO session_transcript_active_events VALUES (?, ?, ?, ?)",
        (session_id, position, seq, position),
    )


def add_archive(
    conn,
    events,
    *,
    session_id="archived-session",
    generation="generation-1",
    encoding="identity",
):
    payload = "\n".join(json.dumps(event) for event in events).encode()
    if encoding == "zstd":
        import zstandard

        payload = zstandard.ZstdCompressor().compress(payload)
    conn.execute(
        """INSERT INTO session_transcript_archives
           VALUES (?, ?, 'agent:main:archive', 'deleted', ?, ?, ?, ?)""",
        (
            session_id,
            generation,
            encoding,
            payload,
            hashlib.sha256(payload).hexdigest(),
            int(time.time()),
        ),
    )
