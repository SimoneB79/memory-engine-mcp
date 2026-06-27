# 🧠 Memory Engine

A living memory system for AI assistants — built on SQLite + MCP (Model Context Protocol).

Not just a key-value store. Not just a knowledge graph. A **living memory** that decays, learns, and evolves with your AI.

## ✨ Features

- **_atomic memory model** — knowledge stored as atoms (facts, decisions, events, preferences, logs, procedures, notes)
- **multi-factor ranking** — recall combines FTS relevance × confidence × recency × weight (not just BM25)
- **organic decay** — atoms lose weight over time if not accessed; critical ones get flagged for review
- **learning engine** — generates questions for the human when it detects contradictions, gaps, weak atoms, or merge candidates
- **auto-bonding** — creates relationship links between atoms automatically during import
- **graph traversal** — navigate the knowledge graph with depth control and relation filtering
- **markdown import** — one-way sync from your existing markdown notes (coexistence, not replacement)
- **merge & deduplicate** — consolidate similar atoms intelligently
- **TTL support** — atoms that expire automatically
- **versioning** — automatic atom history tracking

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│           Your AI Assistant              │
│         (via MCP Protocol)              │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         MCP Server (FastMCP)            │
│     15 tools (recall, remember, ...)    │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│            Engine Layer                  │
│  ranking · decay · learning · merge     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│          SQLite (FTS5 + JSON1)          │
│     atoms · bonds · versions · Q&A      │
└─────────────────────────────────────────┘
```

### Files

| File | Purpose | Lines |
|---|---|---|
| `server.py` | MCP server — exposes 15 tools via FastMCP | ~330 |
| `db.py` | SQLite layer — CRUD, FTS, bonds, versions | ~460 |
| `engine.py` | Ranking, decay, similarity, gap detection | ~230 |
| `learning.py` | Question generation (5 trigger types) | ~210 |
| `importer.py` | Markdown → SQLite one-way importer | ~185 |
| `schema.sql` | Database schema (atoms, bonds, FTS, versions) | ~120 |

Total: **~1,600 lines of Python**. No external dependencies beyond `mcp` SDK.

## 🔧 MCP Tools

| Tool | Description |
|---|---|
| `remember` | Create or update an atom |
| `recall` | Smart query (FTS × confidence × recency × weight) |
| `link` | Create a typed bond between atoms |
| `unlink` | Remove a bond |
| `get_atom` | Get full atom details with all bonds |
| `merge_atoms` | Merge two atoms (secondary → primary) |
| `list_atoms` | List atoms with filters (domain, type, status) |
| `search_graph` | Traverse the knowledge graph from an atom |
| `stats` | Memory statistics (counts, domains, types) |
| `decay_run` | Execute decay cycle (reduce unused atom weights) |
| `learning_run` | Run learning engine (detect gaps, contradictions) |
| `ask_pending` | Get pending human questions |
| `answer_human` | Answer a pending question |
| `import_markdown` | Import markdown files (bulk or single) |
| `export_atom` | Export an atom as markdown |

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
    environment:
      - MEMORY_DB_PATH=/data/memory.db
      - MARKDOWN_SOURCE=/workspace/memory
      - MEMORY_HOST=0.0.0.0
      - MEMORY_PORT=8085

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

Add to your MCP client config (e.g., Claude Desktop, OpenClaw, etc.):

```json
{
  "memory-engine": {
    "url": "http://localhost:8085/sse",
    "transport": "sse"
  }
}
```

## 📊 Use Cases

- **Personal AI assistant memory** — remember preferences, decisions, project context across sessions
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

## 🧬 How It Differs

| Feature | memory-graph | sqlite-memory-mcp | **Memory Engine** |
|---|---|---|---|
| Storage | SQLite | SQLite | SQLite |
| FTS search | ❌ | ✅ (BM25) | ✅ (multi-factor) |
| Decay | ❌ | ❌ | ✅ |
| Learning/Q&A | ❌ | ❌ | ✅ |
| Markdown import | ❌ | ❌ | ✅ |
| Auto-bonding | ❌ | ❌ | ✅ |
| Graph traversal | Basic | ❌ | ✅ (depth + relation filter) |
| Merge atoms | ❌ | ❌ | ✅ |
| TTL | ❌ | ❌ | ✅ |
| Versioning | ❌ | ❌ | ✅ |

## 📝 License

MIT — see [LICENSE](LICENSE).

## 🤝 Contributing

Contributions welcome! Open an issue or PR.
