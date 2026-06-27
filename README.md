<p align="center">
  <img src="docs/logo.jpg" width="128" height="128" alt="Memory Engine Logo" />
</p>

<h1 align="center">🧠 Memory Engine</h1>

<p align="center">
  A living memory system for AI assistants — built on SQLite + MCP (Model Context Protocol).<br>
  Not just a key-value store. Not just a knowledge graph. A <strong>living memory</strong> that decays, learns, and evolves with your AI.
</p>

---

## ✨ Features

- **Atomic memory model** — knowledge stored as atoms (facts, decisions, events, preferences, logs, procedures, notes, session messages)
- **Multi-factor ranking** — recall combines FTS relevance × confidence × recency × weight (not just BM25)
- **Organic decay** — atoms lose weight over time if not accessed; critical ones get flagged for review
- **Learning engine** — generates questions for the human when it detects contradictions, gaps, weak atoms, or merge candidates
- **Session watcher** — automatically ingests OpenClaw session messages as atoms with TTL (event-driven via inotify/watchdog)
- **Auto-bonding** — creates relationship links between atoms automatically during import
- **Graph traversal** — navigate the knowledge graph with depth control and relation filtering
- **Markdown import** — one-way sync from your existing markdown notes (coexistence, not replacement)
- **Merge & deduplicate** — consolidate similar atoms intelligently
- **TTL support** — atoms that expire automatically
- **Versioning** — automatic atom history tracking

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│           Your AI Assistant              │
│         (via MCP Protocol)              │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         MCP Server (FastMCP)            │
│     18 tools (recall, remember, ...)    │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│            Engine Layer                  │
│  ranking · decay · learning · merge     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│     Session Watcher (watchdog/inotify)  │
│  monitors OpenClaw session JSONL files  │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│          SQLite (FTS5 + JSON1)          │
│     atoms · bonds · versions · Q&A      │
└─────────────────────────────────────────┘
```

### Files

| File | Purpose |
|---|---|
| `server.py` | MCP server — exposes 18 tools via FastMCP |
| `db.py` | SQLite layer — CRUD, FTS, bonds, versions |
| `engine.py` | Ranking, decay, similarity, gap detection |
| `learning.py` | Question generation (5 trigger types) |
| `importer.py` | Markdown → SQLite one-way importer |
| `session_watcher.py` | Watchdog-based session JSONL monitor |
| `schema.sql` | Database schema (atoms, bonds, FTS, versions) |

**~1,800 lines of Python.** Dependencies: `mcp` SDK + `watchdog`.

## 🔧 MCP Tools (18)

### Memory Operations

| Tool | Description |
|---|---|
| `remember` | Create or update an atom |
| `recall` | Smart query (FTS × confidence × recency × weight) |
| `get_atom` | Get full atom details with all bonds |
| `list_atoms` | List atoms with filters (domain, type, status) |
| `merge_atoms` | Merge two atoms (secondary → primary) |
| `export_atom` | Export an atom as markdown |

### Knowledge Graph

| Tool | Description |
|---|---|
| `link` | Create a typed bond between atoms |
| `unlink` | Remove a bond |
| `search_graph` | Traverse the knowledge graph from an atom |

### Session Management

| Tool | Description |
|---|---|
| `recall_session` | Search messages within a specific session |
| `session_summary` | Get session overview (message count, time range) |
| `cleanup_sessions` | Delete expired session atoms (TTL cleanup) |

### System & Learning

| Tool | Description |
|---|---|
| `stats` | Memory statistics (counts, domains, types) |
| `decay_run` | Execute decay cycle (reduce unused atom weights) |
| `learning_run` | Run learning engine (detect gaps, contradictions) |
| `ask_pending` | Get pending human questions |
| `answer_human` | Answer a pending question |
| `import_markdown` | Import markdown files (bulk or single) |

## 📖 Usage Examples

### Remember a decision

```python
remember(
    title="Switched from npm to pnpm",
    body="Faster installs, better monorepo support. Migration completed 2026-06-15.",
    type="decision",
    domain="project:frontend",
    confidence=0.9,
    tags=["tooling", "npm", "pnpm"]
)
```

### Recall relevant context

```python
recall(query="frontend build tool choice", limit=5)
# Returns ranked results combining FTS match, confidence, recency, and weight
```

### Link related concepts

```python
link(
    from_id="switched_from_npm_to_pnpm",
    to_id="monorepo_setup",
    relation="depends_on",
    strength=0.8
)
```

### Search within a session

```python
recall_session(
    session_id="abc123-def456",
    query="database schema design",
    limit=10
)
```

### Get a session summary

```python
session_summary(session_id="abc123-def456")
# Returns: message count, user/assistant breakdown, time range, first topics
```

### Import existing markdown notes

```python
import_markdown()  # Bulk import all markdown files
import_markdown(filepath="/notes/project-decisions.md")  # Single file
```

### Run the learning engine

```python
learning_run()
# Detects: contradictions, weak atoms, merge candidates, decay-critical, gaps
# Generates human questions for findings

ask_pending(limit=5)
# Returns questions that need human input
```

## 🔍 Session Watcher

The session watcher monitors OpenClaw session JSONL files in real-time:

- **Event-driven** — uses `watchdog`/inotify, near-zero overhead (not polling)
- **Incremental reads** — tracks file offsets, only processes new lines
- **Smart filtering** — only captures user/assistant text, skips tool results, system messages, and heartbeat noise
- **Auto-expiring** — session atoms have a configurable TTL (default 30 days)
- **Automatic** — starts on server boot, no manual intervention needed

### Configuration

Mount the sessions directory and set the env var:

```yaml
volumes:
  - /path/to/openclaw/sessions:/sessions:ro
environment:
  - OPENCLAW_SESSIONS_DIR=/sessions
  - SESSION_TTL_DAYS=30
```

## 🚀 Quick Start

### Docker (recommended)

```yaml
# docker-compose.yml
services:
  memory-engine:
    build: .
    restart: unless-stopped
    expose:
      - "8085"
    volumes:
      - memory-data:/data
      - ./your-markdown-notes:/workspace/memory:ro
      # Optional: OpenClaw sessions for session watcher
      - /path/to/openclaw/sessions:/sessions:ro
    environment:
      - MEMORY_DB_PATH=/data/memory.db
      - MARKDOWN_SOURCE=/workspace/memory
      - MEMORY_HOST=0.0.0.0
      - MEMORY_PORT=8085
      # Optional: session watcher
      - OPENCLAW_SESSIONS_DIR=/sessions
      - SESSION_TTL_DAYS=30

volumes:
  memory-data:
```

```bash
docker compose up -d
```

### Local (Python ≥3.11)

```bash
pip install -r requirements.txt
python server.py
```

### Connect to your MCP client

Add to your MCP client config (e.g., Claude Desktop, OpenClaw, Cline, etc.):

```json
{
  "mcpServers": {
    "memory-engine": {
      "url": "http://localhost:8085/sse",
      "transport": "sse"
    }
  }
}
```

See [`mcp.json`](mcp.json) for a ready-to-use example.

## 📊 Use Cases

- **Personal AI assistant memory** — remember preferences, decisions, project context across sessions
- **Session continuity** — automatically capture conversation context, never lose where you left off
- **Team knowledge base** — shared memory accessible to AI agents
- **Project documentation** — import existing markdown docs, query them naturally
- **Learning journal** — track decisions and their rationale over time

## ⚙️ Configuration

Edit `config.json` to tune:

| Section | What it controls |
|---|---|
| `decay` | Interval, decay factor, critical threshold, archive timeout |
| `ranking` | Weight of FTS score, confidence, recency, and atom weight |
| `learning` | Thresholds for contradiction, merge similarity, gap detection |
| `sessions_dir` | Path to OpenClaw sessions directory |
| `session_ttl_days` | TTL for session message atoms (default 30) |

## 🧬 How It Differs

| Feature | memory-graph | sqlite-memory | **Memory Engine** |
|---|---|---|---|
| Storage | SQLite | SQLite | SQLite |
| FTS search | ❌ | ✅ (BM25) | ✅ (multi-factor) |
| Decay | ❌ | ❌ | ✅ |
| Learning/Q&A | ❌ | ❌ | ✅ |
| Session watcher | ❌ | ❌ | ✅ |
| Markdown import | ❌ | ❌ | ✅ |
| Auto-bonding | ❌ | ❌ | ✅ |
| Graph traversal | Basic | ❌ | ✅ (depth + relation) |
| Merge atoms | ❌ | ❌ | ✅ |
| TTL | ❌ | ❌ | ✅ |
| Versioning | ❌ | ❌ | ✅ |

## 📝 License

MIT — see [LICENSE](LICENSE).

## 🤝 Contributing

Contributions welcome! Open an issue or PR.

---

<p align="center">
  Made with 🧠 by <a href="https://github.com/SimoneB79">SimoneB79</a>
</p>
