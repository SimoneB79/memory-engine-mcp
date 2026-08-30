"""
Memory Engine — Session Watcher v3
Ingests canonical OpenClaw SQLite transcripts with JSONL legacy fallback.

Fixes over v1:
- Persistent offsets in SQLite (survives container restart)
- Markdown digest per session (survives JSONL deletion)
- File truncation/rotation detection
- System session filtering (cron, MQTT, heartbeats)
- UUID-based atom IDs (no collisions)
- Dedup via content_hash (no duplicate atoms on rescan)
- Polling fallback every 30s (Docker overlayfs inotify safety)
- Automatic TTL cleanup (digests + atoms)
"""
import json
import time
import uuid
import hashlib
import threading
import logging
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

from openclaw_sqlite import OpenClawSQLiteSource

logger = logging.getLogger("session_watcher")


class SessionWatcher:
    """
    Watches OpenClaw session .jsonl files and creates memory atoms
    for each meaningful message (user/assistant text).

    Atoms: type='session_msg', domain='session/<session_id>', ttl=7 days (raw messages)
           type='session_digest', domain='session/<session_id>', ttl=None (1 per session, permanent)
    Digests: /data/session_digests/<session_id>.md (markdown mirror)
    """

    def __init__(
        self,
        db,
        sessions_dir: str,
        ttl_days: int = 7,
        poll_interval: int = 30,
        digest_dir: str | None = None,
        exclude_patterns: list[str] | None = None,
        max_content_chars: int = 2000,
        inactive_threshold_minutes: int = 30,
        agent_db_path: str | None = None,
    ):
        self.db = db
        self.sessions_dir = Path(sessions_dir)
        self.agent_db_path = Path(agent_db_path) if agent_db_path else None
        self.ttl_days = ttl_days
        self.poll_interval = poll_interval
        self.digest_dir = Path(digest_dir) if digest_dir else None
        self.exclude_patterns = exclude_patterns or []
        self.max_content_chars = max_content_chars
        self.inactive_threshold = inactive_threshold_minutes * 60  # seconds
        self._observer: Observer | None = None
        self._poll_thread: threading.Thread | None = None
        self._running = False
        # Track last activity per legacy JSONL session.
        self._last_activity: dict[str, float] = {}
        self._sqlite_source = (
            OpenClawSQLiteSource(
                str(self.agent_db_path),
                exclude_patterns=self.exclude_patterns,
                max_content_chars=self.max_content_chars,
            )
            if self.agent_db_path
            else None
        )

    # ─── LIFECYCLE ───────────────────────────────────────────

    def start(self):
        """Start watching session files (watchdog + polling fallback)."""
        if self._running:
            return
        self._running = True

        # Ensure digest dir
        if self.digest_dir:
            self.digest_dir.mkdir(parents=True, exist_ok=True)

        # SQLite is authoritative when configured; JSONL remains a fallback.
        if self._sqlite_source:
            self._scan_sqlite()
        else:
            self._initial_scan()
            if self.sessions_dir.exists():
                self._observer = Observer()
                self._observer.schedule(
                    _SessionEventHandler(self),
                    str(self.sessions_dir),
                    recursive=False,
                )
                self._observer.daemon = True
                self._observer.start()

        # Polling fallback (catches missed inotify events on overlayfs)
        if self.poll_interval > 0:
            self._poll_thread = threading.Thread(target=self._poll_loop, daemon=True)
            self._poll_thread.start()

        logger.info(
            "SessionWatcher v3 started (source=%s, TTL=%dd, poll=%ds, inactive=%dm, digest=%s, exclude=%s)",
            self.agent_db_path or self.sessions_dir, self.ttl_days, self.poll_interval,
            self.inactive_threshold // 60, self.digest_dir, self.exclude_patterns,
        )

    def stop(self):
        """Stop watching."""
        self._running = False
        if self._observer:
            self._observer.stop()
            self._observer.join(timeout=5)
            self._observer = None

    # ─── OFFSET MANAGEMENT (persistent in SQLite) ────────────

    def _get_offset(self, filename: str) -> int:
        """Get persisted read offset from DB."""
        with self.db.conn() as c:
            row = c.execute(
                "SELECT offset FROM session_offsets WHERE filename = ?", (filename,)
            ).fetchone()
            return row["offset"] if row else 0

    def _set_offset(self, filename: str, offset: int):
        """Persist read offset to DB."""
        now = int(time.time())
        with self.db.conn() as c:
            c.execute(
                """INSERT INTO session_offsets (filename, offset, updated_at)
                   VALUES (?, ?, ?)
                   ON CONFLICT(filename) DO UPDATE SET offset = excluded.offset, updated_at = excluded.updated_at""",
                (filename, offset, now),
            )

    # ─── SESSION FILTERING ───────────────────────────────────

    def _is_excluded_session(self, session_id: str) -> bool:
        """Check if a session should be skipped (cron, MQTT, heartbeats, etc.)."""
        for pattern in self.exclude_patterns:
            if pattern in session_id:
                return True
        return False

    # ─── FILE PROCESSING ─────────────────────────────────────

    def _initial_scan(self):
        """Read all existing session files using persisted offsets."""
        if not self.sessions_dir.exists():
            logger.warning("Sessions dir not found: %s", self.sessions_dir)
            return

        files = sorted(self.sessions_dir.glob("*.jsonl"))
        for f in files:
            if f.name.endswith(".trajectory.jsonl"):
                continue
            if self._is_excluded_session(f.stem):
                continue
            self._process_file(f)

    def _process_file(self, filepath: Path):
        """
        Read new lines from a session JSONL file since last persisted offset.
        Handles truncation/rotation by resetting offset if file shrank.
        """
        try:
            file_key = filepath.name
            session_id = filepath.stem

            if self._is_excluded_session(session_id):
                return

            offset = self._get_offset(file_key)
            file_size = filepath.stat().st_size

            # Detect truncation/rotation: file shrank → reset
            if file_size < offset:
                logger.info(
                    "File %s truncated (size=%d < offset=%d), resetting to 0",
                    file_key, file_size, offset,
                )
                offset = 0

            if file_size <= offset:
                return  # Nothing new

            new_messages = []

            with open(filepath, "r", encoding="utf-8") as f:
                f.seek(offset)
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        event = json.loads(line)
                        msg = self._parse_event(session_id, event)
                        if msg:
                            new_messages.append(msg)
                    except (json.JSONDecodeError, KeyError):
                        continue

                new_offset = f.tell()

            # Create atoms (with dedup)
            for msg in new_messages:
                self._create_session_atom(session_id, msg)

            # Write/update markdown digest
            if new_messages and self.digest_dir:
                self._update_digest(session_id, new_messages)

            # Persist offset
            self._set_offset(file_key, new_offset)

        except Exception as e:
            logger.error("Error processing %s: %s", filepath, e)

    def _parse_event(self, session_id: str, event: dict) -> dict | None:
        """
        Extract a meaningful message from a JSONL event.
        Returns dict with role/content/timestamp, or None to skip.
        """
        if event.get("type") != "message":
            return None

        msg = event.get("message", {})
        role = msg.get("role")
        content = msg.get("content", "")
        timestamp = event.get("timestamp")

        # Handle multimodal content (list of parts)
        if isinstance(content, list):
            text_parts = []
            for part in content:
                if isinstance(part, dict) and part.get("type") == "text":
                    text_parts.append(part.get("text", ""))
                elif isinstance(part, str):
                    text_parts.append(part)
            content = " ".join(text_parts)

        if not isinstance(content, str):
            return None
        content = content.strip()
        if not content:
            return None

        # Skip non-conversational roles
        if role in ("system", "tool", "developer", "toolResult"):
            return None

        # Skip heartbeat noise
        stripped = content.strip()
        if stripped.startswith("[OpenClaw heartbeat"):
            return None
        if stripped == "[OpenClaw heartbeat poll]":
            return None

        # Truncate long messages
        if len(content) > self.max_content_chars:
            content = content[:self.max_content_chars] + "... [truncated]"

        return {
            "role": role,
            "content": content,
            "timestamp": timestamp,
        }

    def _create_session_atom(self, session_id: str, msg: dict):
        """Create a session_msg atom with dedup via content_hash."""
        # Track last activity for digest generation
        self._last_activity[session_id] = int(time.time())

        # Compute hash for dedup
        hash_input = f"{session_id}:{msg['role']}:{msg['content'][:500]}"
        content_hash = hashlib.md5(hash_input.encode()).hexdigest()

        # Dedup check: skip if atom with same hash already exists
        with self.db.conn() as c:
            existing = c.execute(
                "SELECT 1 FROM atoms WHERE content_hash = ? AND status = 'active'",
                (content_hash,),
            ).fetchone()
            if existing:
                return  # Already ingested

        # UUID-based atom ID — no collisions possible
        atom_id = f"sess_{session_id[:8]}_{uuid.uuid4().hex[:8]}"
        ttl = int(time.time()) + (self.ttl_days * 86400)

        # Build title preview
        title_preview = msg["content"][:80].replace("\n", " ")
        if len(msg["content"]) > 80:
            title_preview += "..."

        try:
            self.db.create_atom(
                atom_id=atom_id,
                title=f"[{msg['role']}] {title_preview}",
                body=json.dumps({
                    "session_id": session_id,
                    "role": msg["role"],
                    "content": msg["content"],
                    "timestamp": msg["timestamp"],
                }, ensure_ascii=False),
                type="session_msg",
                domain=f"session/{session_id}",
                confidence=0.6,
                tags=[msg["role"], "session", session_id[:8]],
                source="session_watcher",
                ttl=ttl,
                content_hash=content_hash,
            )
        except Exception as e:
            logger.error("Failed to create session atom: %s", e)

    # ─── OPENCLAW SQLITE PROCESSING ──────────────────────────

    def _get_cursor_hash(self, source_key: str) -> str | None:
        with self.db.conn() as c:
            row = c.execute(
                "SELECT projection_hash FROM session_cursors WHERE source_key = ?",
                (source_key,),
            ).fetchone()
        return row["projection_hash"] if row else None

    def _set_cursor(self, batch):
        with self.db.conn() as c:
            c.execute(
                """INSERT INTO session_cursors
                       (source_key, session_id, generation, segment, last_seq,
                        projection_hash, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?)
                   ON CONFLICT(source_key) DO UPDATE SET
                       last_seq = excluded.last_seq,
                       projection_hash = excluded.projection_hash,
                       updated_at = excluded.updated_at""",
                (
                    batch.source_key,
                    batch.session_id,
                    batch.generation,
                    batch.segment,
                    batch.last_seq,
                    batch.projection_hash,
                    int(time.time()),
                ),
            )

    def _scan_sqlite(self):
        batches = self._sqlite_source.scan()
        current_keys = {batch.source_key for batch in batches}
        for batch in batches:
            if self._get_cursor_hash(batch.source_key) == batch.projection_hash:
                continue
            self._sync_sqlite_batch(batch)
        self._archive_missing_sqlite_batches(current_keys)

    def _archive_missing_sqlite_batches(self, current_keys: set[str]):
        with self.db.conn() as c:
            known_keys = {
                row["source_key"]
                for row in c.execute("SELECT source_key FROM session_cursors")
            }
        for source_key in known_keys - current_keys:
            logical_id = "oc_" + hashlib.sha256(source_key.encode()).hexdigest()[:24]
            domain = f"session/{logical_id}"
            with self.db.conn() as c:
                rows = c.execute(
                    """SELECT id FROM atoms WHERE domain = ? AND status = 'active'
                       AND type IN ('session_msg', 'session_digest')
                       AND source = 'session_watcher'""",
                    (domain,),
                ).fetchall()
            for row in rows:
                self.db.update_atom(
                    row["id"],
                    status="archived",
                    changed_by="session_watcher",
                    change_reason="OpenClaw canonical segment no longer active",
                )
            with self.db.conn() as c:
                c.execute(
                    "DELETE FROM session_cursors WHERE source_key = ?",
                    (source_key,),
                )

    def _sync_sqlite_batch(self, batch):
        domain = f"session/{batch.logical_id}"
        incoming_ids = {msg["event_id"] for msg in batch.messages}
        with self.db.conn() as c:
            existing_rows = c.execute(
                """SELECT id, title, body, status, content_hash, meta
                   FROM atoms WHERE type = 'session_msg' AND domain = ?
                   AND source = 'session_watcher'""",
                (domain,),
            ).fetchall()

        existing_by_hash = {row["content_hash"]: row for row in existing_rows}
        for msg in batch.messages:
            content_hash = hashlib.sha256(
                f"openclaw:{batch.agent_id}:{batch.session_id}:{msg['event_id']}".encode()
            ).hexdigest()
            title_text = msg["content"][:80].replace("\n", " ")
            if len(msg["content"]) > 80:
                title_text += "..."
            title = f"[{msg['role']}] {title_text}"
            body = json.dumps(
                {
                    "session_id": batch.session_id,
                    "logical_session_id": batch.logical_id,
                    "generation": batch.generation,
                    "segment": batch.segment,
                    "event_id": msg["event_id"],
                    "seq": msg["seq"],
                    "role": msg["role"],
                    "content": msg["content"],
                    "timestamp": msg["timestamp"],
                },
                ensure_ascii=False,
            )
            meta = {
                "agent_id": batch.agent_id,
                "source_key": batch.source_key,
                "event_id": msg["event_id"],
            }
            current = existing_by_hash.get(content_hash)
            if current:
                if (
                    current["title"] != title
                    or current["body"] != body
                    or current["status"] != "active"
                ):
                    self.db.update_atom(
                        current["id"],
                        title=title,
                        body=body,
                        status="active",
                        meta=meta,
                        changed_by="session_watcher",
                        change_reason="OpenClaw canonical projection changed",
                    )
                continue

            atom_id = "sess_" + content_hash[:24]
            self.db.create_atom(
                atom_id=atom_id,
                title=title,
                body=body,
                type="session_msg",
                domain=domain,
                confidence=0.6,
                tags=[msg["role"], "session", "openclaw-sqlite"],
                source="session_watcher",
                ttl=int(time.time()) + (self.ttl_days * 86400),
                content_hash=content_hash,
                meta=meta,
            )

        for row in existing_rows:
            try:
                event_id = json.loads(row["meta"] or "{}").get("event_id")
            except (json.JSONDecodeError, TypeError):
                event_id = None
            if event_id and event_id not in incoming_ids and row["status"] == "active":
                self.db.update_atom(
                    row["id"],
                    status="archived",
                    changed_by="session_watcher",
                    change_reason="Removed from OpenClaw canonical projection",
                )

        self._write_sqlite_digest(batch)
        self._upsert_sqlite_digest(batch, domain)
        self._set_cursor(batch)

    def _write_sqlite_digest(self, batch):
        if not self.digest_dir:
            return
        lines = [f"# Session Digest — {batch.logical_id}"]
        for msg in batch.messages:
            lines.append(
                f"\n---\n\n**[{msg['role']}]** _{msg.get('timestamp') or ''}_"
                f"\n\n{msg['content']}\n"
            )
        target = self.digest_dir / f"{batch.logical_id}.md"
        target.write_text("\n".join(lines), encoding="utf-8")

    def _upsert_sqlite_digest(self, batch, domain: str):
        user_messages = [m for m in batch.messages if m["role"] == "user"]
        if not user_messages:
            return
        selected = user_messages
        if len(selected) > 30:
            selected = selected[:15] + selected[-15:]
        user_lines = []
        for msg in selected:
            content = msg["content"]
            user_lines.append("- " + (content[:200] + "..." if len(content) > 200 else content))
        first_ts = user_messages[0].get("timestamp") or ""
        last_ts = user_messages[-1].get("timestamp") or ""
        body = (
            f"Session: {batch.logical_id}\n"
            f"OpenClaw session: {batch.session_id}\n"
            f"Generation: {batch.generation}; segment: {batch.segment}\n"
            f"Period: {first_ts} → {last_ts}\n"
            f"Messages: {len(batch.messages)}\n\nUser messages:\n"
            + "\n".join(user_lines)
        )
        title = "Digest: " + user_lines[0][2:62]
        atom_id = "digest_" + hashlib.sha256(batch.source_key.encode()).hexdigest()[:24]
        with self.db.conn() as c:
            current = c.execute(
                "SELECT title, body, status FROM atoms WHERE id = ?", (atom_id,)
            ).fetchone()
        if current:
            if current["title"] != title or current["body"] != body or current["status"] != "active":
                self.db.update_atom(
                    atom_id,
                    title=title,
                    body=body,
                    status="active",
                    changed_by="session_watcher",
                    change_reason="OpenClaw digest regenerated",
                )
            return
        self.db.create_atom(
            atom_id=atom_id,
            title=title,
            body=body,
            type="session_digest",
            domain=domain,
            confidence=0.7,
            tags=["session_digest", "openclaw-sqlite"],
            source="session_watcher",
            ttl=None,
            content_hash=None,
        )

    # ─── MARKDOWN DIGEST ─────────────────────────────────────

    def _update_digest(self, session_id: str, new_messages: list[dict]):
        """
        Append new messages to a lightweight markdown digest file.
        This survives JSONL deletion and provides quick session context.
        """
        digest_path = self.digest_dir / f"{session_id}.md"

        # Read existing content or create header
        if digest_path.exists():
            existing = digest_path.read_text(encoding="utf-8")
        else:
            existing = f"# Session Digest — {session_id}\n"

        # Append new messages
        lines = [existing.rstrip()]
        for msg in new_messages:
            ts = msg.get("timestamp") or ""
            role = msg["role"]
            content = msg["content"]
            lines.append(f"\n---\n\n**[{role}]** _{ts}_\n\n{content}\n")

        digest_path.write_text("\n".join(lines), encoding="utf-8")

    # ─── SESSION DIGEST ATOM (auto-summary on inactive) ────

    def _create_session_digest_atom(self, session_id: str):
        """
        Create a permanent 'session_digest' atom summarizing the session.
        Extracts user messages (concise by nature) + assistant first lines.
        Called when a session goes inactive (no new messages for threshold minutes).
        """
        digest_atom_id = f"digest_{session_id[:8]}_{uuid.uuid4().hex[:6]}"

        # Check if digest atom already exists for this session
        with self.db.conn() as c:
            existing = c.execute(
                "SELECT 1 FROM atoms WHERE type = 'session_digest' AND domain = ? AND status = 'active'",
                (f"session/{session_id}",),
            ).fetchone()
            if existing:
                return  # Already has a digest atom

            # Fetch all user messages for this session (concise summary)
            rows = c.execute(
                """SELECT body, created_at FROM atoms
                   WHERE type = 'session_msg' AND domain = ? AND status = 'active'
                   ORDER BY created_at ASC""",
                (f"session/{session_id}",),
            ).fetchall()

        if not rows:
            return

        # Build compact summary from user messages
        user_lines = []
        first_ts = None
        last_ts = None
        for r in rows:
            try:
                body = json.loads(r["body"])
                if body.get("role") == "user":
                    content = body.get("content", "")
                    # Truncate each user msg to 200 chars for the summary
                    if len(content) > 200:
                        content = content[:200] + "..."
                    user_lines.append(f"- {content}")
                    if first_ts is None:
                        first_ts = body.get("timestamp", "")
                    last_ts = body.get("timestamp", "")
            except (json.JSONDecodeError, TypeError):
                continue

        if not user_lines:
            return

        # Limit summary size (max 30 user messages)
        if len(user_lines) > 30:
            user_lines = user_lines[:15] + ["..."] + user_lines[-15:]

        summary_body = f"Session: {session_id}\nPeriod: {first_ts} → {last_ts}\nMessages: {len(rows)}\n\nUser messages:\n" + "\n".join(user_lines)

        # Title: date + first user message as hint
        first_user = user_lines[0].replace("- ", "", 1)[:60]
        title = f"Digest: {first_user}"

        try:
            self.db.create_atom(
                atom_id=digest_atom_id,
                title=title,
                body=summary_body,
                type="session_digest",
                domain=f"session/{session_id}",
                confidence=0.7,
                tags=["session_digest", session_id[:8]],
                source="session_watcher",
                ttl=None,  # Permanent
                content_hash=None,
            )
            logger.info("Created session_digest atom for %s (%d user msgs)", session_id, len(user_lines))
        except Exception as e:
            logger.error("Failed to create session digest atom: %s", e)

    def _check_inactive_sessions(self):
        """
        Check all tracked sessions; create digest atom for those inactive
        past the threshold. Called from poll loop.
        """
        if not self._last_activity:
            return

        now = int(time.time())
        checked = []

        for session_id, last_ts in list(self._last_activity.items()):
            if now - last_ts >= self.inactive_threshold:
                # Session is inactive → create digest if not already done
                self._create_session_digest_atom(session_id)
                checked.append(session_id)

        # Remove checked sessions from tracking (digest created, no need to recheck)
        for sid in checked:
            self._last_activity.pop(sid, None)

    # ─── POLLING FALLBACK ────────────────────────────────────

    def _poll_loop(self):
        """Periodic scan to catch missed inotify events (Docker overlayfs)."""
        while self._running:
            time.sleep(self.poll_interval)
            try:
                self._scan_all()
                self._check_inactive_sessions()
            except Exception as e:
                logger.error("Polling scan error: %s", e)

    def _scan_all(self):
        """Scan the authoritative SQLite source or the legacy JSONL fallback."""
        if self._sqlite_source:
            self._scan_sqlite()
            return
        if not self.sessions_dir.exists():
            return
        for f in self.sessions_dir.glob("*.jsonl"):
            if f.name.endswith(".trajectory.jsonl"):
                continue
            if self._is_excluded_session(f.stem):
                continue
            self._process_file(f)

    # ─── TTL CLEANUP ─────────────────────────────────────────

    def cleanup_expired(self) -> int:
        """
        Delete session_msg atoms whose TTL has expired.
        session_digest atoms are permanent (ttl=NULL) and never cleaned.
        Also cleans up old markdown digest files.
        """
        now = int(time.time())
        count = 0

        with self.db.conn() as c:
            rows = c.execute(
                """SELECT id FROM atoms
                   WHERE type = 'session_msg' AND ttl IS NOT NULL AND ttl < ?
                   AND status = 'active'""",
                (now,),
            ).fetchall()
            for r in rows:
                c.execute("DELETE FROM atoms WHERE id = ?", (r["id"],))
                count += 1

        # Clean up old digest files
        if self.digest_dir and self.digest_dir.exists():
            cutoff = now - (self.ttl_days * 86400)
            for f in self.digest_dir.glob("*.md"):
                try:
                    if f.stat().st_mtime < cutoff:
                        f.unlink()
                except OSError:
                    pass

        # Clean up offsets for deleted session files
        if self.sessions_dir.exists():
            with self.db.conn() as c:
                offsets = c.execute("SELECT filename FROM session_offsets").fetchall()
                for row in offsets:
                    fname = row["filename"]
                    if not (self.sessions_dir / fname).exists():
                        # File gone → also check if digest still exists
                        digest = self.digest_dir / fname.replace(".jsonl", ".md") if self.digest_dir else None
                        if not digest or not digest.exists():
                            c.execute("DELETE FROM session_offsets WHERE filename = ?", (fname,))

        if count:
            logger.info("Cleaned up %d expired session atoms (+ old digests/offsets)", count)
        return count


class _SessionEventHandler(FileSystemEventHandler):
    """Watchdog handler that delegates to SessionWatcher."""

    def __init__(self, watcher: SessionWatcher):
        self.watcher = watcher

    def on_modified(self, event):
        if event.is_directory:
            return
        filepath = Path(event.src_path)
        if filepath.suffix == ".jsonl" and not filepath.name.endswith(".trajectory.jsonl"):
            self.watcher._process_file(filepath)

    def on_created(self, event):
        if event.is_directory:
            return
        filepath = Path(event.src_path)
        if filepath.suffix == ".jsonl" and not filepath.name.endswith(".trajectory.jsonl"):
            self.watcher._process_file(filepath)
