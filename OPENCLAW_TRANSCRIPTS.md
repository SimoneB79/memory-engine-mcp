# OpenClaw transcript ingestion

Memory Engine 1.8 reads OpenClaw 2026.9.1-beta.1 transcripts from the
per-agent SQLite database (schema 17). Legacy JSONL remains available when
`OPENCLAW_AGENT_DB` is not configured.

## Docker mount

Mount the **entire agent directory** read-only, not only the database file.
SQLite needs the live `-wal` and `-shm` sidecars to read a consistent
snapshot.

```yaml
volumes:
  - /home/sb/stacks/moltbot-simone/config/agents/main/agent:/openclaw-agent:ro
environment:
  - OPENCLAW_AGENT_DB=/openclaw-agent/openclaw-agent.sqlite
  - SESSION_DIGEST_DIR=/data/session_digests
```

Do not set `OPENCLAW_SESSIONS_DIR` for the SQLite backend. It is retained
only for installations that still produce `*.jsonl` transcripts.

## Data selection

The watcher reads only:

- `schema_meta`
- `session_windows`
- `session_transcript_active_events`
- `transcript_events`
- `transcript_event_identities`
- `session_transcript_archives`

Only canonical user and assistant text is ingested. Tool calls, tool results,
thinking blocks, heartbeat/cron sessions, and OpenClaw delivery mirrors are
discarded. Reset events create separate logical digest segments. Deleted
session archives are supported in both `identity` and `zstd` encoding.

The connection uses SQLite URI `mode=ro`, `PRAGMA query_only=ON`, busy
timeouts, and bounded retries. Schema versions other than 17 fail explicitly
instead of silently ingesting an unknown layout.

## Security boundary

SQLite cannot grant table-level access. The read-only mount exposes all tables
in the per-agent database to the Memory Engine container even though the
watcher queries only transcript tables and never logs raw event JSON. Keep the
service local and trusted.

A future sanitized exporter could narrow this boundary by publishing only
role, text, timestamp, stable event identity, and logical-session metadata.
