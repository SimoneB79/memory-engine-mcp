# Memory Engine — OpenClaw Plugin

Native memory engine for OpenClaw: **45 agent tools**, event-driven session ingest,
semantic search, backup/import/export, learning, a conservative curator, and a
native Control UI page — all in one plugin, no external MCP server.

Successor of the Python `memory-engine` MCP server (same versioning lineage).

## Features

**45 memory tools:**
- **Core**: recall (FTS + ranking, optional semantic merge), working_set (token-budgeted context pack), remember, get_atom, list_atoms, stats, memory_summary
- **Knowledge graph**: link, search_graph, contradict, impact, suggest_bonds(+all), find_similar
- **Curator**: memory_curator_run — conservative maintenance (extractive body_compact, auto-bonds by domain/keyword/pattern, isolated atom classification, promotion and merge candidates). Dry-run by default. memory_cognitive_status for graph health metrics
- **Semantic** (Ollama): semantic_search with FTS fallback, reindex_embeddings, optional `semantic:true` on recall
- **Maintenance**: decay_run, cleanup_sessions, cleanup_duplicates, merge_atoms, delete_atom (soft by default), unlink, update_domain, classify_memory_tier
- **Backup**: backup_database, restore_database (confirm required), list_backups, export_all, export_atom, import_data, import_markdown
- **Learning**: learning_run, ask_pending, answer_human (human_questions flow)
- **Errors**: error_check, error_log, error_list, list_contradictions, preference_search

**Native Control UI page** (5 tabs): live cognitive stats, FTS atom search with type/domain filters, atom detail with bonds, curator dry-run/apply, backup management, pending human questions with inline answers.

**Event hooks**: buffers chat messages and periodically (60s, only when changed) ingests `session_msg` atoms and refreshes `session_digest` atoms (7-day TTL).

## Install

```bash
openclaw plugins install clawhub:openclaw-plugin-memory-engine
# or from npm
openclaw plugins install npm:openclaw-plugin-memory-engine
```

## Configuration

- `MEMORY_DB_PATH` — SQLite database path (default `/data/memory.db`, schema created on first use)
- `OLLAMA_HOST` — Ollama base URL for embeddings (default `http://ollama:11434`)
- `ME_EMBED_MODEL` — embedding model (default `nomic-embed-text`)

Enable the plugin UI page once via **Control UI → Settings → Labs → Custom plugin UI**.

## Privacy & Data

- **What is stored**: with session ingest enabled, OpenClaw chat messages are stored as session_msg atoms in the configured SQLite database, and a per-session digest is refreshed periodically.
- **Opt out**: set ingest.enabled false in the plugin config to stop capturing chats entirely; existing captured data stays until cleaned.
- **Automatic cleanup**: session_msg and session_digest atoms carry a TTL (default 7 days, configurable via ingest.retention_days) and are expired automatically by the periodic flush.
- **Manual cleanup**: use memory_cleanup_sessions, memory_delete_atom, memory_export_all to review or purge stored contents.
- **Embeddings**: semantic search sends atom text to the configured Ollama endpoint (OLLAMA_HOST). Disable by not using semantic tools, or point OLLAMA_HOST to a local instance.
- **Database location**: check MEMORY_DB_PATH to know exactly where your data lives.

## License

MIT
