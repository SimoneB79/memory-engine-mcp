<!-- mcp-name: io.github.simoneb79/memory-engine-mcp -->

<p align="center">
  <a href="#"><img alt="Version" src="https://img.shields.io/badge/version-1.5.2-blue" /></a>
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-green" /></a>
  <a href="#"><img alt="Python" src="https://img.shields.io/badge/python-3.12+-blue" /></a>
  <a href="server.json"><img alt="MCP Registry Ready" src="https://img.shields.io/badge/MCP%20Registry-ready-purple" /></a>
  <a href="Dockerfile"><img alt="Docker" src="https://img.shields.io/badge/docker-ready-2496ED" /></a>
</p>

<p align="center">
  <img src="docs/logo.jpg" width="128" height="128" alt="Memory Engine Logo" />
</p>

<h1 align="center">🧠 Memory Engine MCP</h1>

<p align="center">
  <strong>Local-first, graph-aware long-term memory for AI assistants.</strong><br>
  SQLite + semantic search + knowledge graph + MCP tools for agents that need continuity.
</p>

<p align="center">
  Works with Claude Desktop · Claude Code · Cursor · Cline · Windsurf · OpenClaw · any MCP client
</p>

---

## Why Memory Engine?

Most MCP memory servers are either simple key-value stores or plain text search wrappers.

Memory Engine is different: it models memory as **typed atoms** connected by **typed bonds**, then retrieves context with a hybrid ranking pipeline that combines:

- full-text search (SQLite FTS5)
- semantic similarity via local Ollama embeddings
- confidence, recency, and weight
- graph expansion from related memories

The goal is not just storage. The goal is a memory system that can **recall, connect, decay, curate, and learn** over time.

## Highlights

- **Local-first** — SQLite database, optional local embeddings via Ollama, no required cloud API.
- **MCP-native** — exposes 31 tools through FastMCP.
- **Graph-aware recall** — expands top hits through bidirectional bonds for richer context.
- **Semantic search** — meaning-based retrieval with `nomic-embed-text`.
- **Markdown coexistence** — import existing notes one-way without replacing your human-readable memory.
- **Error memory** — remembers mistakes and corrections, with auto-promotion to preferences after repeated failures.
- **Cognitive curator** — non-destructive maintenance pass for compaction, bond suggestions, duplicate detection, and isolated atom classification.
- **Session watcher** — optional OpenClaw JSONL ingestion with short-lived raw messages and permanent session digests.

## Architecture

```text
AI assistant / MCP client
        │
        ▼
FastMCP server — 31 tools
        │
        ▼
Memory engine — hybrid ranking, graph recall, decay, learning
        │
        ├── SQLite — atoms, bonds, FTS5, JSON metadata, versions
        ├── Ollama — optional local embeddings
        ├── Curator — conservative maintenance
        └── Session watcher — optional OpenClaw session ingestion
```

## MCP Tools

### Memory

| Tool | Purpose |
|---|---|
| `remember` | Create or update an atom |
| `recall` | Smart hybrid recall with graph expansion |
| `working_set` | Build a task-oriented context pack |
| `semantic_search` | Pure semantic search |
| `get_atom` | Read one atom with bonds |
| `list_atoms` | Browse atoms by domain/type/status |
| `merge_atoms` | Merge duplicate atoms |
| `export_atom` | Export one atom as markdown |

### Knowledge graph

| Tool | Purpose |
|---|---|
| `link` / `unlink` | Create or remove typed bonds |
| `search_graph` | Traverse the graph from one atom |
| `suggest_bonds` | Suggest bonds for one atom |
| `suggest_bonds_all` | Suggest or create bonds in bulk |

### Learning and maintenance

| Tool | Purpose |
|---|---|
| `curator_run` | Conservative curation pass |
| `cognitive_status` | Graph and memory health metrics |
| `learning_run` | Detect contradictions, weak atoms, merge candidates, gaps |
| `ask_pending` / `answer_human` | Human-in-the-loop clarification |
| `decay_run` | Run decay cycle |
| `cleanup_sessions` | Remove expired session atoms |
| `cleanup_duplicates` | Remove duplicate session atoms |
| `reindex_embeddings` | Rebuild embeddings |

### Error memory and preferences

| Tool | Purpose |
|---|---|
| `error_check` | Check past failures before doing a task |
| `error_log` | Record a mistake and the correction |
| `error_list` | Browse unresolved/resolved errors |
| `preference_search` | Search structured preferences |

### Import and introspection

| Tool | Purpose |
|---|---|
| `import_markdown` | Import markdown notes into atoms |
| `memory_summary` | 3-level summary: global → domain → detail |
| `stats` | Database statistics |
| `version` | Server version |
| `recall_session` | Search one OpenClaw session |
| `session_summary` | Summarize one OpenClaw session |

## Quick start with Docker

```bash
git clone https://github.com/SimoneB79/memory-engine-mcp.git
cd memory-engine-mcp
cp docker-compose.yml docker-compose.local.yml
# Edit volume paths in docker-compose.local.yml if needed
docker compose -f docker-compose.local.yml up -d --build
```

Default endpoint:

```text
http://localhost:8085/sse
```

Example MCP client config:

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

See [`docs/INSTALL.md`](docs/INSTALL.md) for Docker, local Python, Claude Desktop, Cursor, and OpenClaw examples.

## Local Python

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python server.py
```

## Configuration

Main configuration file: [`config.json`](config.json)

Important environment variables:

| Variable | Default | Purpose |
|---|---:|---|
| `MEMORY_DB_PATH` | `/data/memory.db` | SQLite database path |
| `MARKDOWN_SOURCE` | `/workspace/memory` | Markdown directory for import |
| `MEMORY_HOST` | `0.0.0.0` | Server bind address |
| `MEMORY_PORT` | `8085` | SSE port |
| `OPENCLAW_SESSIONS_DIR` | `/sessions` | Optional OpenClaw sessions directory |
| `SESSION_DIGEST_DIR` | `/data/session_digests` | Optional session digest output |

Semantic search requires Ollama reachable from the container or host. Default:

```json
{
  "ollama": {
    "enabled": true,
    "host": "http://ollama:11434",
    "model": "nomic-embed-text"
  }
}
```

If you do not use Ollama, set `ollama.enabled` to `false`; FTS recall still works.

## Memory model

Atoms have:

- `title`
- `body`
- `type`: `fact`, `decision`, `event`, `preference`, `log`, `procedure`, `note`, etc.
- `domain`: project or topic namespace
- `confidence`
- `weight`
- `tags`
- optional TTL

Bonds connect atoms with relation types:

```text
is_a · part_of · depends_on · contradicts · refines · derived_from · detail_of · related_to
```

## Example usage

```python
remember(
    title="Use PostgreSQL for analytics",
    body="SQLite is kept for local memory, PostgreSQL is used for multi-user analytics.",
    type="decision",
    domain="project:analytics",
    confidence=0.9,
    tags=["database", "architecture"]
)
```

```python
recall(query="what database did we choose for analytics?", limit=5)
```

```python
working_set(
    query="continue the analytics backend work",
    domain="project:analytics",
    limit=8,
    graph_depth=1
)
```

## Publishing and registries

This repository is prepared for MCP discovery:

- MCP Registry name: `io.github.simoneb79/memory-engine-mcp`
- Registry metadata: [`server.json`](server.json)
- Docker/OCI verification label: included in [`Dockerfile`](Dockerfile)
- Client config example: [`mcp.json`](mcp.json)

See [`docs/PUBLISHING.md`](docs/PUBLISHING.md) for the publication checklist.

## Repository status

- Public GitHub repository: https://github.com/SimoneB79/memory-engine-mcp
- Existing listing: https://mcpmarket.com/server/memory-engine
- License: MIT

## License

MIT — see [`LICENSE`](LICENSE).

---

<p align="center">
  Made with 🧠 by <a href="https://github.com/SimoneB79">SimoneB79</a>
</p>
