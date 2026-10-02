# Memory Engine TS — OpenClaw Plugin

Native memory engine for OpenClaw: 19 agent tools, event-driven session ingest,
and a conservative night curator — all in one plugin, no external MCP server.

## Features

- **17 memory tools**: recall (FTS + ranking), working_set (token-budgeted context pack),
  remember, get_atom, list_atoms, link/search_graph (knowledge graph), contradict,
  impact, preference_search, error_check/error_log (error memory), stats,
  session_summary/generate_session_digest
- **Curator (v3.1)**: `memory_curator_run` — conservative maintenance pass
  (extractive body_compact, auto-bonds by domain/keyword/pattern, isolated atom
  classification, promotion and merge candidates). Dry-run by default.
- **Cognitive status**: `memory_cognitive_status` — graph health metrics + recommendations
- **Event hooks**: buffers chat messages and periodically (60s, only when changed)
  ingests `session_msg` atoms and generates/refreshes `session_digest` atoms (7-day TTL)

## Install

```bash
openclaw plugins install memory-engine-ts
```

Or from a local package:

```bash
openclaw plugins install ./openclaw-plugin-memory-engine-ts-3.1.0.tgz
```

## Configuration

The database path is read from the `MEMORY_DB_PATH` environment variable
(default `/data/memory.db`). The SQLite database is created with the expected
schema on first use.

Curator tuning (optional) via plugin config `curator`: max_atoms_per_run,
compact_min_body_chars, bond_limit_per_atom, stale_after_days and more —
sensible defaults apply.

## Session hooks

- `message_received` / `agent_end`: buffer chat content per session
- every 60s: ingest new messages as episodic `session_msg` atoms (7-day TTL)
  and refresh the session digest atom

## License

MIT
