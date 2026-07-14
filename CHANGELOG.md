# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.2] — 2026-07-14

### Graph-Gap Moved to Curator

The `learning_run` no longer generates `graph_gap` pending questions by
default. Isolated-atom review is now handled entirely by the cognitive
curator, which classifies atoms without bonds silently — no pending
questions, no human noise.

#### Changes

- **`learning.graph_gap_enabled`** config flag (default: `false`) — set to
  `true` to restore the old behavior where `learning_run` creates
  `graph_gap` questions for isolated atoms.
- **`curator_run`** now includes an `isolated_classification` pass that
  categorizes atoms into four states:
  - `needs_link` — durable, high-weight, or frequently accessed
  - `standalone_ok` — naturally standalone (preferences, explicitly allowed)
  - `volatile_candidate` — session/chat material or too new
  - `archive_candidate` — old and never accessed
- With `auto_apply=True`, the curator writes **non-destructive metadata**
  only (`isolated_state`, `isolated_reason`, `isolated_reviewed_at`). It
  never archives or deletes atoms.
- New config fields: `isolated_min_age_days`, `isolated_high_access_threshold`,
  `isolated_high_weight_threshold`, `isolated_archive_after_days`,
  `isolated_limit`, `volatile_domain_prefixes`, `standalone_ok_types`.

#### Bug Fixes

- **Anti-repeat fix (v1.5.1):** `learning_run` no longer regenerates
  already-answered questions. The dedup key set now includes pending,
  answered, and dismissed questions with canonicalized atom ID lists.

---

## [1.5.0] — 2026-07-14

### Cognitive Curator + Graph-Aware Recall

Major cognitive features: a conservative maintenance engine and
bidirectional graph expansion in recall.

#### New Tools (7)

- **`cognitive_status`** — graph health metrics (isolated atoms, bonds,
  gaps, stale atoms, pending questions, missing compacts)
- **`working_set`** — task-oriented context pack combining recall,
  graph neighbors, and key procedures/decisions
- **`curator_run`** — conservative curation pass (body compaction,
  bond suggestions, promotion/merge detection)
- **`memory_summary`** — hierarchical 3-level summary (global → domain → detail)
- **`error_log`** — record mistakes and corrections
- **`error_check`** — check if a task has failed before
- **`error_list`** — list errors by resolution status

#### Graph-Aware Recall

- `recall()` now expands top direct/semantic hits bidirectionally via bonds
- Output includes `match_kind` (`direct`, `semantic`, `graph`, or combined)
- `graph_reason` explains how a graph-discovered atom was found
- `search_graph()` follows bonds both in and out

#### Error Memory

- New `error_memory` table in SQLite
- Auto-promotion: errors with 3+ occurrences become permanent preference
  atoms
- `error_check` retrieves past unresolved errors before attempting a task

#### Structured Preferences

- `preference_search` tool with JSON1-powered filtering by category, scope,
  and free-text query

#### Auto-Bonding on Remember

- `remember()` now triggers rule-based auto-bonding immediately when
  `auto_bond.auto_apply_on_remember` is enabled in config

---

## [1.4.0] — 2026-07-14

### Graph Recall Engine

- `recall()` performs bidirectional graph expansion from top hits
- `search_graph()` traverses bonds in both directions (in/out)
- `suggest_bonds_all()` bulk bond creation with auto-apply
- Auto-bonding on `remember()` via `auto_apply_on_remember` config

---

## [1.3.0] — 2026-07-10

### Error Memory + Preferences + Hierarchical Summaries

Three feature additions inspired by community research:

- **Error Memory** — `error_memory` table, auto-promotion logic,
  3 MCP tools (`error_log`, `error_check`, `error_list`)
- **Structured Preferences** — `search_preferences` in db.py with JSON1,
  1 MCP tool (`preference_search`)
- **Hierarchical Summaries** — `hierarchical_summary()` in engine.py
  (L0 global, L1 per-domain, L2 detail), 1 MCP tool (`memory_summary`)

---

## [1.2.0] — 2026-07-09

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
