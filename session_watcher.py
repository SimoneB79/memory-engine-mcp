"""
Memory Engine — Session Watcher
Monitors OpenClaw session JSONL files and ingests messages as atoms.

Uses watchdog (inotify) for near-zero overhead file watching.
Only reads new lines (append-mode with offset tracking).
Atoms auto-expire via TTL (default 30 days).
"""
import json
import os
import time
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
    """

    def __init__(self, db, sessions_dir: str, ttl_days: int = 30,
                 poll_interval: int = 0):
        """
        Args:
            db: DB instance from db.py
            sessions_dir: Path to OpenClaw sessions directory
            ttl_days: Atom TTL in days (default 30)
            poll_interval: Reserved for future polling fallback (0 = disabled)
        """
        self.db = db
        self.sessions_dir = Path(sessions_dir)
        self.ttl_days = ttl_days
        self.poll_interval = poll_interval
        self._offsets: dict[str, int] = {}  # filename -> last byte offset
        self._observer: Observer | None = None
        self._thread: threading.Thread | None = None
        self._running = False

    # ─── LIFECYCLE ───────────────────────────────────────────

    def start(self):
        """Start watching session files in a background thread."""
        if self._running:
            return

        self._running = True

        # Initial scan: ingest existing files
        self._initial_scan()

        # Start watchdog observer
        self._observer = Observer()
        self._observer.schedule(
            _SessionEventHandler(self),
            str(self.sessions_dir),
            recursive=False,
        )
        self._observer.daemon = True
        self._observer.start()

        logger.info(
            "SessionWatcher started on %s (TTL=%dd)",
            self.sessions_dir,
            self.ttl_days,
        )

    def stop(self):
        """Stop watching."""
        self._running = False
        if self._observer:
            self._observer.stop()
            self._observer.join(timeout=5)
            self._observer = None

    # ─── FILE READING ────────────────────────────────────────

    def _initial_scan(self):
        """Read all existing session files from last known offset (or from start)."""
        if not self.sessions_dir.exists():
            logger.warning("Sessions dir not found: %s", self.sessions_dir)
            return

        for f in self.sessions_dir.glob("*.jsonl"):
            if f.name.endswith(".trajectory.jsonl"):
                continue  # Skip trajectory files, only main session files
            self._process_file(f)

    def _process_file(self, filepath: Path):
        """
        Read new lines from a session JSONL file since last offset.
        Only processes messages with meaningful content (user/assistant text).
        """
        try:
            file_key = filepath.name
            offset = self._offsets.get(file_key, 0)

            # Check file size
            file_size = filepath.stat().st_size
            if file_size <= offset:
                return  # Nothing new

            # Extract session_id from filename (strip .jsonl)
            session_id = filepath.stem

            with open(filepath, "r", encoding="utf-8") as f:
                f.seek(offset)
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        event = json.loads(line)
                        self._handle_event(session_id, event)
                    except (json.JSONDecodeError, KeyError):
                        continue

                # Update offset to current position
                self._offsets[file_key] = f.tell()

        except Exception as e:
            logger.error("Error processing %s: %s", filepath, e)

    def _handle_event(self, session_id: str, event: dict):
        """
        Parse a JSONL event and create an atom if it's a meaningful message.
        """
        event_type = event.get("type", "")

        # Only process actual messages (user or assistant text)
        # OpenClaw session events have various types; we want content messages
        role = None
        content = None
        timestamp = None

        # OpenClaw format: {"type": "message", "message": {"role": "user", "content": "..."}}
        if event_type == "message":
            msg = event.get("message", {})
            role = msg.get("role")
            content = msg.get("content", "")
            timestamp = event.get("timestamp")

            # Handle content that's a list (multimodal) — extract text only
            if isinstance(content, list):
                text_parts = []
                for part in content:
                    if isinstance(part, dict) and part.get("type") == "text":
                        text_parts.append(part.get("text", ""))
                    elif isinstance(part, str):
                        text_parts.append(part)
                content = " ".join(text_parts)

            if not isinstance(content, str):
                return
            content = content.strip()
            if not content:
                return

        else:
            # Skip metadata events (session, model_change, thinking_level_change, custom, etc.)
            return

        # Skip system/tool messages and heartbeat noise
        if role in ("system", "tool", "developer", "toolResult"):
            return
        # Skip heartbeat and internal polls
        if isinstance(content, str):
            if content.strip().startswith("[OpenClaw heartbeat"):
                return
            if content.strip() == "[OpenClaw heartbeat poll]":
                return

        # Truncate very long messages to keep atoms manageable
        max_len = 2000
        if len(content) > max_len:
            content = content[:max_len] + "... [truncated]"

        # Create atom
        ttl = int(time.time()) + (self.ttl_days * 86400)
        atom_id = f"sess_{session_id}_{int(time.time() * 1000) % 1000000}"

        # Build a meaningful title (first ~80 chars)
        title_preview = content[:80].replace("\n", " ")
        if len(content) > 80:
            title_preview += "..."

        try:
            self.db.create_atom(
                atom_id=atom_id,
                title=f"[{role}] {title_preview}",
                body=json.dumps({
                    "session_id": session_id,
                    "role": role,
                    "content": content,
                    "timestamp": timestamp,
                }, ensure_ascii=False),
                type="session_msg",
                domain=f"session/{session_id}",
                confidence=0.6,
                tags=[role, "session", session_id[:8]],
                source="session_watcher",
                ttl=ttl,
            )
        except Exception as e:
            logger.error("Failed to create atom for session %s: %s", session_id, e)

    # ─── TTL CLEANUP ─────────────────────────────────────────

    def cleanup_expired(self):
        """Delete atoms whose TTL has expired. Called periodically."""
        now = int(time.time())
        with self.db.conn() as c:
            rows = c.execute(
                """SELECT id FROM atoms
                   WHERE type = 'session_msg' AND ttl IS NOT NULL AND ttl < ?
                   AND status = 'active'""",
                (now,),
            ).fetchall()
            count = 0
            for r in rows:
                c.execute("DELETE FROM atoms WHERE id = ?", (r["id"],))
                count += 1
            if count:
                logger.info("Cleaned up %d expired session atoms", count)
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
            # Reset offset for new files
            self.watcher._offsets.pop(filepath.name, None)
            self.watcher._process_file(filepath)
