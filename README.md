<p align="center">
  <a href="#"><img alt="Version" src="https://img.shields.io/badge/version-1.5.2-blue" /></a>
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-green" /></a>
  <a href="#"><img alt="Python" src="https://img.shields.io/badge/python-3.12+-blue" /></a>
</p>

<p align="center">
  <img src="docs/logo.jpg" width="128" height="128" alt="Memory Engine Logo" />
</p>

<h1 align="center">🧠 Memory Engine</h1>

<p align="center">
  A living memory system for AI assistants — built on SQLite + MCP (Model Context Protocol).<br>
  Not just a key-value store. Not just a knowledge graph. A <strong>living memory</strong> that decays, learns, and evolves with your AI.
</p>

<p align="center">
  <strong>Works with:</strong> Claude Code · Claude Desktop · Cursor · Cline · Windsurf · OpenClaw · Any MCP client
</p>

---

## ✨ Features

### Core Memory
- **Atomic memory model** — knowledge stored as atoms (facts, decisions, events, preferences, logs, procedures, notes, session messages, session digests)
- **Hybrid ranking** — recall combines FTS relevance × **semantic similarity** × confidence × recency × weight
- **Graph-aware recall** — top results are expanded bidirectionally via bonds, enriching context with related atoms
- **Semantic search** — local embeddings via Ollama (`nomic-embed-text`) for meaning-based recall, not just keyword match
- **Organic decay** — atoms lose weight over time if not accessed; critical ones get flagged for review
- **Learning engine** — generates questions for the human when it detects contradictions, gaps, weak atoms, or merge candidates
- **Cognitive curator** — conservative maintenance pass: body compaction, bond suggestions, duplicate detection, promotion candidates, and isolated-atom classification — all without creating pending questions by default
- **Isolated atom classification** — atoms without bonds are classified as `needs_link`, `standalone_ok`, `volatile_candidate`, or `archive_candidate`, with metadata tagging (no destructive actions)
- **Error memory** — tracks mistakes and corrections; auto-promotes recurring errors (3+ occurrences) to permanent preference rules
- **Structured preferences** — searchable preference atoms with category, scope, and condition metadata
- **Graph traversal** — navigate the knowledge graph with depth control and relation filtering
- **Hierarchical summaries** — 3-level memory overview (global → per-domain → detail) for quick orientation
- **Markdown import** — one-way sync from your existing markdown notes (coexistence, not replacement)
- **Merge & deduplicate** — consolidate similar atoms intelligently
- **TTL support** — atoms that expire automatically
- **Versioning** — automatic atom history tracking

### Auto-Bonding
- **Rule-based bonding** — automatically creates relationships between atoms using domain clustering, keyword overlap, and pattern detection
- **Semantic suggestions** — uses embeddings to find non-obvious connections between atoms
- **Bulk operations** — scan all atoms and suggest/create bonds in batch
- **8 relation types** — `is_a`, `part_of`, `depends_on`, `contradicts`, `refines`, `derived_from`, `detail_of`, `related_to`

### Session Watcher v2.1
- **Real-time ingestion** — monitors OpenClaw session JSONL files via watchdog/inotify + polling fallback
- **Session digests** — automatically creates permanent summary atoms when sessions go inactive (after 30 min)
- **Two-tier lifecycle** — raw session messages (7-day TTL) → permanent session digests → human daily logs
- **Persistent offsets** — read positions stored in SQLite, survive container restarts
- **Deduplication** — `content_hash` prevents duplicates on rescan or restart
- **Smart filtering** — skips tool results, system messages, heartbeat noise, and system sessions

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│            Your AI Assistant                 │
│          (via MCP Protocol)                 │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│          MCP Server (FastMCP)               │
│      31 tools (recall, remember, ...)       │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│             Engine Layer                     │
│  hybrid ranking · graph recall · decay      │
│  auto-bond · embeddings (Ollama)            │
│  error memory · preferences · learning      │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│       Cognitive Curator (curator.py)         │
│  compact · bond pass · promotion detection   │
│  merge detection · isolated classification   │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│    Session Watcher v2.1 (watchdog/inotify)  │
│  session JSONL → atoms + auto-digests       │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│          SQLite (FTS5 + JSON1)              │
│  atoms · bonds · versions · embeddings · Q&A│
│  error_memory · session_offsets              │
└─────────────────────────────────────────────┘
```

### Files

| File | Purpose |
|---|---|
| `server.py` | MCP server — exposes 31 tools via FastMCP |
| `db.py` | SQLite layer — CRUD, FTS, bonds, versions, embeddings, error memory |
| `engine.py` | Hybrid ranking (BM25 + semantic), graph recall, decay, similarity, gap detection |
| `curator.py` | Cognitive curator — compact, bonds, promotions, merges, isolated classification |
| `embeddings.py` | Local embedding generation via Ollama (`nomic-embed-text`) |
| `auto_bond.py` | Rule-based + semantic auto-bonding engine |
| `learning.py` | Question generation (5 trigger types, graph_gap opt-in) |
| `session_watcher.py` | Watchdog-based session JSONL monitor with auto-digest |
| `importer.py` | Markdown → SQLite one-way importer |
| `schema.sql` | Database schema (atoms, bonds, FTS, versions, embeddings, offsets, error_memory) |

**~5,000 lines of Python.** Dependencies: `mcp` SDK, `watchdog`, `requests`.

## 🔧 MCP Tools (31)

### Memory Operations

| Tool | Description |
|---|---|
| `remember` | Create or update an atom |
| `recall` | Smart query (FTS × semantic × confidence × recency × weight) |
| `semantic_search` | Pure semantic search via Ollama embeddings |
| `get_atom` | Get full atom details with all bonds |
| `list_atoms` | List atoms with filters (domain, type, status) |
| `merge_atoms` | Merge two atoms (secondary → primary) |
| `export_atom` | Export an atom as markdown |
| `find_similar` | Find atoms semantically similar to a given atom |

### Knowledge Graph

| Tool | Description |
|---|---|
| `link` | Create a typed bond between atoms |
| `unlink` | Remove a bond |
| `search_graph` | Traverse the knowledge graph from an atom |
| `suggest_bonds` | Suggest bonds for an atom (rule-based + semantic) |
| `suggest_bonds_all` | Scan all atoms and suggest/create bonds in bulk |

### Session Management

| Tool | Description |
|---|---|
| `recall_session` | Search messages within a specific session |
| `session_summary` | Get session overview (message count, time range) |
| `cleanup_sessions` | Delete expired session atoms (TTL cleanup) |
| `cleanup_duplicates` | Remove duplicate session_msg atoms |
| `reindex_embeddings` | Regenerate embeddings for all atoms |

### System & Learning

| Tool | Description |
|---|---|
| `stats` | Memory statistics (counts, domains, types) |
| `memory_summary` | Hierarchical 3-level summary (global → domain → detail) |
| `cognitive_status` | Graph health metrics (isolated atoms, bonds, gaps, stale) |
| `working_set` | Task-oriented context pack (recall + graph + procedures) |
| `curator_run` | Conservative curation pass (compact, bonds, classification) |
| `version` | Get server version |
| `decay_run` | Execute decay cycle (reduce unused atom weights) |
| `learning_run` | Run learning engine (detect gaps, contradictions) |
| `ask_pending` | Get pending human questions |
| `answer_human` | Answer a pending question |
| `import_markdown` | Import markdown files (bulk or single) |

### Error Memory & Preferences

| Tool | Description |
|---|---|
| `error_log` | Log a mistake and its correction (auto-promotes after 3+ occurrences) |
| `error_check` | Check if a task has failed before (retrieve past errors) |
| `error_list` | List recorded errors filtered by resolution status |
| `preference_search` | Search preference atoms by category, scope, or free text |

## 📖 Usage Examples

### Remember a decision

```python
remember(
    title="Switched from npm to pnpm",
    body="Faster installs, better monorepo support.",
    type="decision",
    domain="project:frontend",
    confidence=0.9,
    tags=["tooling", "npm", "pnpm"]
)
```

### Recall with hybrid ranking

```python
recall(query="frontend build tool choice", limit=5)
# Combines FTS match, semantic similarity, confidence, recency, and weight
```

### Pure semantic search

```python
semantic_search(query="how to deploy the app", limit=5)
# Uses Ollama embeddings — finds by meaning, not just keywords
```

### Auto-suggest bonds

```python
suggest_bonds(atom_id="my_atom_id", auto_apply=False)
# Returns rule-based + semantic bond suggestions

suggest_bonds_all(auto_apply=True, max_atoms=30)
# Scans all active atoms and creates bonds automatically
```

### Search within a session

```python
recall_session(
    session_id="abc123-def456",
    query="database schema design",
    limit=10
)
```

## 🔍 Session Watcher v2.1

The session watcher monitors OpenClaw session JSONL files with a **two-tier lifecycle**:

1. **Raw messages** (`session_msg` atoms, TTL 7 days) — ingested in real-time with dedup
2. **Session digests** (`session_digest` atoms, permanent) — auto-created after 30 min of inactivity, extracting user messages
3. **Daily logs** (human-written markdown) — primary high-quality summary

This ensures continuity: if a session is lost, the digest provides context without searching thousands of raw messages.

### Features

- **Event-driven** — watchdog/inotify + polling fallback (30s) for Docker overlayfs
- **Persistent offsets** — survive container restarts
- **Deduplication** — content_hash on every atom
- **Markdown digests** — lightweight `.md` mirror per session
- **Smart filtering** — skips tool results, system messages, heartbeats, cron/mqtt/isolated sessions
- **Truncation detection** — auto-resets offset on file rotation
- **Auto-expiring** — TTL cleanup every 60 minutes

### Configuration

```yaml
volumes:
  - /path/to/openclaw/sessions:/sessions:ro
environment:
  - OPENCLAW_SESSIONS_DIR=/sessions
  - SESSION_TTL_DAYS=7
  - SESSION_INACTIVE_THRESHOLD_MINUTES=30
  - SESSION_DIGEST_DIR=/data/session_digests
```

## 🧠 Embeddings & Semantic Search

Local embeddings via [Ollama](https://ollama.ai) (`nomic-embed-text`, 768-dim):

- **Automatic** — embeddings generated on atom creation (async)
- **Hybrid ranking** — `recall()` combines BM25 + cosine similarity
- **Configurable weights** — tune FTS vs semantic balance
- **Reindexable** — `reindex_embeddings` tool for batch regeneration
- **Local & private** — no external API calls

```json
{
  "ollama": { "enabled": true, "host": "http://ollama:11434", "model": "nomic-embed-text", "dim": 768 },
  "ranking": { "fts_weight": 0.30, "semantic_weight": 0.30, "confidence_weight": 0.20, "recency_weight": 0.10, "weight_factor": 0.10 }
}
```

## 🔗 Auto-Bonding

Automatically discovers relationships between atoms:

- **Domain clustering** — same domain → `related_to` bonds
- **Keyword overlap** — shared tags trigger connections
- **Pattern detection** — naming conventions matched
- **Semantic similarity** — embeddings find non-obvious links

```json
{
  "auto_bond": { "semantic_threshold": 0.65, "domain_cluster_threshold": 0.4, "max_suggestions": 10 }
}
```

## 🧠 Cognitive Curator

The curator is a **conservative maintenance engine** that runs in dry-run mode by default. It never deletes durable atoms or rewrites markdown source.

### Passes

| Pass | What it does |
|---|---|
| **body_compact** | Generates extractive summaries for long atoms (>1200 chars) |
| **bond_pass** | Suggests/creates rule-based bonds across active atoms |
| **promotion** | Detects recurring session/daily concepts worth promoting to durable facts |
| **merge** | Flags potential duplicates by normalized title |
| **isolated_classification** | Classifies atoms without bonds into actionable states |

### Isolated Atom States

When `curator_run` runs, atoms without bonds are classified:

| State | Meaning |
|---|---|
| `needs_link` | Durable, high-weight or frequently accessed — should be connected |
| `standalone_ok` | Naturally standalone (preferences, explicitly allowed) |
| `volatile_candidate` | Session/chat material or too new — let TTL/digest handle it |
| `archive_candidate` | Old, never accessed — consider archiving |

With `auto_apply=True`, the curator writes only **non-destructive metadata** (`isolated_state`, `isolated_reason`, `isolated_reviewed_at`). It never archives or deletes atoms automatically.

> **v1.5.2 change:** `learning_run` no longer generates `graph_gap` pending questions by default. Isolated-atom review is handled entirely by the curator. Set `learning.graph_gap_enabled=true` in config to re-enable the old behavior.

### Error Memory

The error memory subsystem tracks mistakes and corrections:

- **error_log** — record what went wrong and the fix
- **error_check** — check before attempting a task if it has failed before
- **error_list** — review resolved/unresolved errors
- **Auto-promotion** — after 3+ occurrences, an error is promoted to a permanent preference rule automatically

```python
error_log(
    mistake="Used dotnet build without --framework",
    correction="Always use: dotnet build -f net48",
    task_type="compilation",
    error_category="logic_error",
    severity="minor"
)
```

## 🚀 Quick Start

### Docker (recommended)

```yaml
services:
  memory-engine:
    build: .
    restart: unless-stopped
    expose:
      - "8085"
    volumes:
      - memory-data:/data
      - ./your-markdown-notes:/workspace/memory:ro
      - /path/to/openclaw/sessions:/sessions:ro
    environment:
      - MEMORY_DB_PATH=/data/memory.db
      - MARKDOWN_SOURCE=/workspace/memory
      - MEMORY_HOST=0.0.0.0
      - MEMORY_PORT=8085
      - OPENCLAW_SESSIONS_DIR=/sessions
      - SESSION_TTL_DAYS=7
      - SESSION_INACTIVE_THRESHOLD_MINUTES=30
```

### Local (Python ≥3.12)

```bash
pip install -r requirements.txt
python server.py
```

### Connect to your MCP client

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

## ⚙️ Configuration

| Section | What it controls |
|---|---|
| `decay` | Interval, decay factor, critical threshold, archive timeout |
| `ranking` | FTS, semantic, confidence, recency, and weight balance |
| `ollama` | Embedding model, host, dimensions, reindex settings |
| `auto_bond` | Semantic threshold, domain cluster threshold, max suggestions |
| `learning` | Contradiction, merge similarity, gap detection thresholds |
| `session_ttl_days` | TTL for session message atoms (default 7) |
| `session_inactive_threshold_minutes` | Inactivity before session digest (default 30) |

## 🧬 How It Differs

| Feature | memory-graph | sqlite-memory | **Memory Engine** |
|---|---|---|---|
| Storage | SQLite | SQLite | SQLite |
| FTS search | ❌ | ✅ (BM25) | ✅ (multi-factor) |
| Semantic search | ❌ | ❌ | ✅ (Ollama) |
| Hybrid ranking | ❌ | ❌ | ✅ (BM25 + semantic) |
| Graph-aware recall | ❌ | ❌ | ✅ (bidirectional) |
| Decay | ❌ | ❌ | ✅ |
| Learning/Q&A | ❌ | ❌ | ✅ |
| Auto-bonding | ❌ | ❌ | ✅ (rules + semantic) |
| Cognitive curator | ❌ | ❌ | ✅ |
| Isolated classification | ❌ | ❌ | ✅ |
| Error memory | ❌ | ❌ | ✅ |
| Structured preferences | ❌ | ❌ | ✅ |
| Hierarchical summaries | ❌ | ❌ | ✅ |
| Session watcher | ❌ | ❌ | ✅ (v2.1 + digests) |
| Session digests | ❌ | ❌ | ✅ (auto-summary) |
| Markdown import | ❌ | ❌ | ✅ |
| Graph traversal | Basic | ❌ | ✅ (depth + relation) |
| Merge atoms | ❌ | ❌ | ✅ |
| TTL | ❌ | ❌ | ✅ |
| Versioning | ❌ | ❌ | ✅ |

## 📝 License

MIT — see [LICENSE](LICENSE).

---

<p align="center">
  Made with 🧠 by <a href="https://github.com/SimoneB79">SimoneB79</a>
</p>
