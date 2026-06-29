# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] — 2026-06-29

### Session Watcher v2 — Complete Rewrite

Major reliability overhaul of the session ingestion pipeline. The previous
version had critical data-loss scenarios that could silently drop messages
or create duplicate atoms.

#### 🔴 Critical Fixes

- **Persistent read offsets** — Offsets are now stored in a SQLite table
  (`session_offsets`) instead of an in-memory dict. Container restarts no
  longer lose read positions or trigger full re-imports.
  ```sql
  CREATE TABLE session_offsets (
      filename TEXT PRIMARY KEY,
      offset   INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
  ```

- **Atom deduplication** — A `content_hash` column (MD5 of
  `session_id:role:content[:500]`) is now stored on every atom. Before
  creating a new session atom, the watcher checks if an atom with the same
  hash already exists. Eliminates duplicates caused by rescans or restarts.

- **Collision-free atom IDs** — Replaced `f"sess_{id}_{ms % 1000000}"`
  with UUID-based IDs (`f"sess_{id[:8]}_{uuid4().hex[:8]}"`). Two messages
  in the same millisecond no longer collide.

- **File truncation/rotation detection** — If a JSONL file shrinks
  (`size < stored_offset`), the offset resets to 0 instead of silently
  skipping all new content.

- **Automatic TTL cleanup** — A background thread runs every 60 minutes
  (configurable) to delete expired `session_msg` atoms, old markdown
  digests, and stale offset records for deleted session files. Previously
  `cleanup_expired()` existed but was never called automatically.

#### 🟡 Improvements

- **Markdown session digests** — For each session, a lightweight markdown
  file is maintained at `/data/session_digests/<session_id>.md` containing
  only the user/assistant messages. This survives JSONL deletion and
  provides quick session context without the heavy JSONL payload.

- **System session filtering** — Sessions matching patterns in
  `session_exclude_patterns` (default: `cron:`, `mqtt`, `heartbeat`,
  `isolated`) are skipped entirely. Reduces noise from automated jobs.

- **Polling fallback** — In addition to watchdog/inotify, a polling thread
  scans all session files every 30 seconds. Catches missed events on Docker
  overlayfs where inotify can be unreliable.

- **SQLite concurrency hardening** — Added `PRAGMA busy_timeout = 5000`
  and explicit WAL mode on every connection. Prevents `database is locked`
  errors when the watcher thread and MCP server write concurrently.

- **Configurable max content length** — `session_max_content_chars`
  (default: 2000) controls truncation of long messages. Previously
  hardcoded.

#### 📦 Docker Compose

- Added volume mount for OpenClaw sessions directory (`:ro`)
- Added environment variables: `OPENCLAW_SESSIONS_DIR`, `SESSION_DIGEST_DIR`

#### ⚙️ Configuration

New config fields in `config.json`:

```json
{
  "sessions_dir": "/sessions",
  "session_poll_interval": 30,
  "session_digest_dir": "/data/session_digests",
  "session_exclude_patterns": ["cron:", "mqtt", "heartbeat", "isolated"],
  "session_max_content_chars": 2000,
  "session_cleanup_interval_minutes": 60
}
```

#### 📊 Migration

Automatic and non-destructive:
- The `session_offsets` table is created on first run
- The `content_hash` column is added to `atoms` via `ALTER TABLE` (idempotent)
- An index on `content_hash` is created for fast dedup lookups
- Existing atoms without `content_hash` remain functional (NULL = no dedup)

---

## [1.0.0] — 2026-06-27

### Initial Release

- SQLite-backed memory engine with FTS5 full-text search
- 14 MCP tools: remember, recall, link, unlink, get_atom, merge_atoms,
  decay_run, ask_pending, answer_human, import_markdown, export_atom,
  stats, search_graph, list_atoms, recall_session, cleanup_sessions,
  session_summary, learning_run
- Knowledge graph with typed bonds (is_a, part_of, depends_on, contradicts,
  refines, derived_from, detail_of, related_to)
- Atom versioning (every change is tracked)
- Multi-factor ranking: FTS relevance + confidence + recency + weight
- Learning engine: contradiction detection, weak atom identification,
  merge candidates, decay, gap analysis, human questions
- Markdown importer (one-way sync from markdown workspace)
- Session watcher (watchdog/inotify-based JSONL ingestion)
- Docker-ready with healthcheck
