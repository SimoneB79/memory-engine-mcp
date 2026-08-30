# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.8.0] — 2026-08-30

### OpenClaw SQLite transcript ingestion

- Added canonical transcript ingestion for OpenClaw 2026.9.1-beta.1 agent
  databases (schema 17), using read-only SQLite connections with busy retry.
- Active projections are read through `session_transcript_active_events`;
  stable identities come from `transcript_event_identities`.
- Reset events create separate logical digest segments.
- Tool calls/results, thinking, heartbeats, cron sessions, and delivery mirrors
  are excluded before ingestion.
- Added deleted-session archive support for `identity` and `zstd` payloads.
- Added projection cursors and stable event deduplication; canonical rewrites
  update/archive affected atoms.
- Permanent session digests are now deterministic and regenerated when a
  canonical projection changes.
- JSONL session ingestion remains available as a legacy fallback.
- Added deployment documentation for mounting the full agent directory
  read-only so SQLite can access DB, WAL, and SHM.
- Test suite expanded to 144 passing tests.

## [1.7.0] — 2026-08-03

### Test Suite, Auth/Hardening, Backup/Restore, Benchmark, SQLite Concurrency

Major engineering hardening release. The model-audit identified key gaps;
this version closes them with 135 tests, token auth, full backup/restore,
recall benchmarking, and SQLite concurrency improvements.

#### Testing (P1)

- **Full test suite** — 135 tests across 9 files, all passing in ~14 s:
  - `test_db.py` (42) — CRUD, bonds, graph traversal, merge, decay, error
    memory, contradictions, FTS.
  - `test_engine.py` (19) — ranking multivariate, recall with filters,
    similarity, contradiction detection, weak atoms, merge candidates.
  - `test_migrations.py` (8) — old schema → new, idempotency, FTS trigger
    rebuild, data preservation.
  - `test_auth.py` (13) — token verification, constant-time comparison,
    Bearer extraction, bind address resolution.
  - `test_server_security.py` (7) — input validation, null-byte guard,
    rate limiter sliding window.
  - `test_backup.py` (22) — snapshot, restore, verify, JSON export/import,
    round-trip, list, cleanup.
  - `test_benchmark.py` (11) — metric computation, query generation, report.
  - `test_concurrency.py` (7) — PRAGMA verification, concurrent reads,
    read-during-write, concurrent writes.

- **Bugs found during testing**:
  - `get_bonds(direction=...)` accepted `"out"`/`"in"` but docs implied
    `"outgoing"`/`"incoming"` — clarified.
  - `create_atom` with duplicate slug creates a variant ID (not an upsert).

#### Auth & Hardening (P2)

- **`auth.py`** — new module:
  - API token via `MEMORY_API_TOKEN` env or `config.json → security.api_token`.
  - Constant-time verification (`hmac.compare_digest`).
  - Auth disabled by default (open mode for stdio/trusted environments).

- **Secure bind** — `127.0.0.1` by default; `0.0.0.0` only if
  `security.allow_remote: true`.

- **Input validation** — title (500 chars), body (100 KB), null-byte guard
  on all `remember()` calls.

- **Rate limiting** — sliding-window limiter (120 req/min default) in
  `server.py`.

- **Web UI auth** — all `/api/*` endpoints require Bearer token (or
  `?token=...` for browser) when auth is enabled.

- **`config_loader.py`** — shared single-source-of-truth for config.

- `config.json` gains a `security` section:
  `api_token`, `allow_remote`, `rate_limit_per_minute`, `max_body_chars`,
  `max_title_chars`.

#### Backup / Restore / Export (P3)

- **`backup.py`** — new module:
  - `create_backup()` — SQLite online backup API + WAL checkpoint.
  - `restore_backup()` — verify, safety backup, WAL flush, sidecar cleanup.
  - `verify_backup()` — checks expected tables, FTS, row counts.
  - `export_json()` / `import_json()` — portable JSON format, merge or
    replace mode, FTS rebuild after import.
  - `list_backups()` / `cleanup_old_backups()`.

- **4 new MCP tools**:
  - `backup_database(action=create|list|verify|cleanup)`
  - `restore_database(backup_path)`
  - `export_all(include_embeddings=False)`
  - `import_data(json_data, mode=merge|replace)`

#### Benchmark (P4)

- **`benchmark.py`** — CLI recall quality suite:
  - Auto-generates queries from existing atoms.
  - Metrics: Precision@K, Recall, MRR, latency p50/p95.
  - Graph expansion impact analysis (with vs without graph).
  - JSON + Markdown report output.

#### SQLite Concurrency (P5)

- **New PRAGMAs** — `synchronous=NORMAL`, `temp_store=MEMORY`,
  `mmap_size=256 MB` for better WAL performance.
- **Retry on SQLITE_BUSY** — exponential backoff (3 retries, 100→200→400 ms).

#### Docker

- `.dockerignore` excludes `tests/`, `__pycache__/`, `benchmark.py` from
  the production image.
- Dockerfile copies new modules (`auth.py`, `config_loader.py`, `backup.py`).

#### Backward Compatibility

- No breaking changes. Auth is disabled by default — existing deployments
  work unchanged. All new `security` config keys are optional.

---

## [1.6.0] — 2026-07-29

### Contradiction Management & 3-Tier Memory

This release introduces explicit contradiction/supersession handling and a
3-tier memory classification system, plus a new impact analysis tool and an
optional web UI for graph exploration.

#### New Features

- **`memory_tier` column** — every atom is classified as:
  - `episodic` — logs, events, session messages, daily entries
  - `semantic` — facts, decisions, consolidated knowledge
  - `procedural` — preferences, procedures, standing rules
  - Inferred automatically from `type`/`domain`; overridable via `remember(memory_tier=...)`.
  - Migration backfills existing atoms idempotently.

- **Contradiction management** — new `memory_contradictions` table:
  - `memory_contradict(old_atom_id, ...)` — creates a new active atom, marks
    the old one as `status='superseded'`, links both with `contradicts` and
    `supersedes` bonds.
  - `list_contradictions(atom_id)` — lists contradiction records.
  - Recall excludes superseded atoms by default;
    `include_superseded=True` recovers history.

- **`memory_impact(atom_id, depth)`** — traverses bonds up to N hops, returns
  connected nodes, edges, direct dependents, contradiction chains, and a
  relation-type breakdown. Useful before updating or deleting an atom.

- **`classify_memory_tier(type, domain, meta)`** — infers tier without
  creating an atom.

- **Web UI (`web_ui.py`)** — optional HTTP server (default port 6000) with:
  - Interactive graph visualization (circle layout, status/tier colors)
  - Atom detail panel with impact analysis
  - Contradiction browser
  - Stats dashboard (atoms, bonds, tiers, domains)
  - Full-text search

#### Ranking Improvements

- `tier_boosts` and `status_penalties` in ranking config.
- Superseded atoms receive a -0.25 score penalty.
- Semantic tier gets +0.04, procedural +0.03 boost.

#### Infrastructure

- **Pin `mcp>=1.3.0,<2.0.0`** — MCP 2.x removes `mcp.server.fastmcp`.
- **FTS trigger fix** — migration recreates the `atoms_fts_au` trigger to fire
  only on `title/body/tags` changes, not on status/meta/tier updates.
- Dockerfile supports dual process (MCP server + optional UI).
- `docker-compose.yml` updated with correct ports.

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
