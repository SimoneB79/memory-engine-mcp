"""
Memory Engine — Session Watcher v2
Monitors OpenClaw session JSONL files and ingests messages as atoms.

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

logger = logging.getLogger("session_watcher")


class SessionWatcher:
    """
    Watches OpenClaw session .jsonl files and creates memory atoms
    for each meaningful message (user/assistant text).

    Atoms: type='session_msg', domain='session/<session_id>', ttl=30 days
    Digests: /data/session_digests/<session_id>.md
    """

    def __init__(
        self,
        db,
        sessions_dir: str,
        ttl_days: int = 30,
        poll_interval: int = 30,
        digest_dir: str | None = None,
        exclude_patterns: list[str] | None = None,
        max_content_chars: int = 2000,
    ):
        self.db = db
        self.sessions_dir = Path(sessions_dir)
        self.ttl_days = ttl_days
        self.poll_interval = poll_interval
        self.digest_dir = Path(digest_dir) if digest_dir else None
        self.exclude_patterns = exclude_patterns or []
        self.max_content_chars = max_content_chars
        self._observer: Observer | None = None
        self._poll_thread: threading.Thread | None = None
        self._running = False

    # ─── LIFECYCLE ───────────────────────────────────────────

    def start(self):
        """Start watching session files (watchdog + polling fallback)."""
        if self._running:
            return
        self._running = True

        # Ensure digest dir
        if self.digest_dir:
            self.digest_dir.mkdir(parents=True, exist_ok=True)

        # Initial scan of existing files
        self._initial_scan()

        # Watchdog observer for real-time events
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
            "SessionWatcher v2 started on %s (TTL=%dd, poll=%ds, digest=%s, exclude=%s)",
            self.sessions_dir, self.ttl_days, self.poll_interval,
            self.digest_dir, self.exclude_patterns,
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

    # ─── POLLING FALLBACK ────────────────────────────────────

    def _poll_loop(self):
        """Periodic scan to catch missed inotify events (Docker overlayfs)."""
        while self._running:
            time.sleep(self.poll_interval)
            try:
                self._scan_all()
            except Exception as e:
                logger.error("Polling scan error: %s", e)

    def _scan_all(self):
        """Check all session files for new content."""
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
        Also cleans up old markdown digests.
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
