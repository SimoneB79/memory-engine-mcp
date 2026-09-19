"""
Memory Engine — MCP Server
Exposes memory tools to LLMs via Model Context Protocol.
"""
import json
import os
import sys
import time
import threading
from pathlib import Path
from mcp.server.fastmcp import FastMCP

# Add project dir to path
sys.path.insert(0, str(Path(__file__).parent))

# ─── Version ────────────────────────────────────────────────

__version__ = "1.8.2"

from db import DB
from engine import Engine
from learning import Learning
from importer import MarkdownImporter
from session_watcher import SessionWatcher
from embeddings import EmbeddingEngine
from auto_bond import AutoBondEngine
from curator import CognitiveCurator
from auth import get_api_token, is_auth_enabled, get_bind_address

# ─── Config ──────────────────────────────────────────────────

CONFIG_PATH = Path(__file__).parent / "config.json"
config = json.loads(CONFIG_PATH.read_text())

DB_PATH = os.environ.get("MEMORY_DB_PATH", config.get("db_path", "/data/memory.db"))
MD_SOURCE = os.environ.get("MARKDOWN_SOURCE", config.get("markdown_source", "/workspace/memory"))
# Security: default to localhost-only unless explicitly allowed
_sec_cfg = config.get("security", {})
HOST = os.environ.get("MEMORY_HOST", config.get("server", {}).get("host", "0.0.0.0"))
PORT = int(os.environ.get("MEMORY_PORT", config.get("server", {}).get("port", 8087)))
# Override bind address based on security config
if not os.environ.get("MEMORY_HOST"):
    HOST = get_bind_address(config)

# Input limits
MAX_TITLE_CHARS = int(_sec_cfg.get("max_title_chars", 500))
MAX_BODY_CHARS = int(_sec_cfg.get("max_body_chars", 100000))
RATE_LIMIT_PER_MIN = int(_sec_cfg.get("rate_limit_per_minute", 120))

# Session watcher config
SESSIONS_DIR = os.environ.get(
    "OPENCLAW_SESSIONS_DIR",
    config.get("sessions_dir", "/home/node/.openclaw/agents/main/sessions"),
)
OPENCLAW_AGENT_DB = os.environ.get(
    "OPENCLAW_AGENT_DB",
    config.get("openclaw_agent_db", ""),
)
SESSION_TTL_DAYS = int(os.environ.get(
    "SESSION_TTL_DAYS",
    config.get("session_ttl_days", 30),
))
SESSION_POLL_INTERVAL = int(os.environ.get(
    "SESSION_POLL_INTERVAL",
    config.get("session_poll_interval", 30),
))
SESSION_DIGEST_DIR = os.environ.get(
    "SESSION_DIGEST_DIR",
    config.get("session_digest_dir", "/data/session_digests"),
)
SESSION_EXCLUDE_PATTERNS = config.get("session_exclude_patterns", ["cron:", "mqtt", "heartbeat"])
SESSION_MAX_CONTENT = int(os.environ.get(
    "SESSION_MAX_CONTENT_CHARS",
    config.get("session_max_content_chars", 2000),
))
SESSION_CLEANUP_INTERVAL = int(os.environ.get(
    "SESSION_CLEANUP_INTERVAL_MINUTES",
    config.get("session_cleanup_interval_minutes", 60),
))
SESSION_INACTIVE_THRESHOLD = int(os.environ.get(
    "SESSION_INACTIVE_THRESHOLD_MINUTES",
    config.get("session_inactive_threshold_minutes", 30),
))

# ─── Init ────────────────────────────────────────────────────

# Ensure data dir exists
Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)

db = DB(DB_PATH)
engine = Engine(db, config)
learning = Learning(db, engine, config)
importer = MarkdownImporter(db, MD_SOURCE)
embeddings = EmbeddingEngine(db, config)
auto_bond_engine = AutoBondEngine(db, embeddings, config)
curator = CognitiveCurator(db, engine, learning, auto_bond_engine, config)

# Start session watcher (background, watchdog + polling)
session_watcher = SessionWatcher(
    db=db,
    sessions_dir=SESSIONS_DIR,
    ttl_days=SESSION_TTL_DAYS,
    poll_interval=SESSION_POLL_INTERVAL,
    digest_dir=SESSION_DIGEST_DIR,
    exclude_patterns=SESSION_EXCLUDE_PATTERNS,
    max_content_chars=SESSION_MAX_CONTENT,
    inactive_threshold_minutes=SESSION_INACTIVE_THRESHOLD,
    agent_db_path=OPENCLAW_AGENT_DB or None,
)
session_watcher.start()

# ─── Periodic TTL cleanup thread ─────────────────────────────

def _ttl_cleanup_loop():
    """Background thread: run session atom + digest cleanup periodically."""
    interval = SESSION_CLEANUP_INTERVAL * 60
    while True:
        time.sleep(interval)
        try:
            session_watcher.cleanup_expired()
        except Exception as e:
            print(f"[ttl_cleanup] error: {e}", file=sys.stderr)

_cleanup_thread = threading.Thread(target=_ttl_cleanup_loop, daemon=True)
_cleanup_thread.start()

# ─── Background embedding indexer ───────────────────────────

# Global state for the background reindex
_reindex_state = {
    "running": False,
    "total": 0,
    "processed": 0,
    "created": 0,
    "errors": 0,
    "started_at": None,
    "finished_at": None,
    "current_atom": None,
}

def _reindex_loop():
    """Background thread: index all atoms missing embeddings, then keep running for new ones."""
    batch_delay = config.get("ollama", {}).get("reindex_delay_sec", 0.1)
    poll_interval = config.get("ollama", {}).get("reindex_poll_sec", 30)
    
    while True:
        try:
            # Count atoms missing embeddings
            with db.conn() as c:
                row = c.execute(
                    """SELECT COUNT(*) as n FROM atoms a
                       LEFT JOIN atom_embeddings e ON a.id = e.atom_id
                       WHERE a.status = 'active' AND e.atom_id IS NULL"""
                ).fetchone()
                pending = row["n"]
            
            if pending == 0:
                _reindex_state["running"] = False
                _reindex_state["current_atom"] = None
                time.sleep(poll_interval)
                continue
            
            if not _reindex_state["running"]:
                _reindex_state["running"] = True
                _reindex_state["started_at"] = int(time.time())
                _reindex_state["total"] = pending
                _reindex_state["processed"] = 0
                _reindex_state["created"] = 0
                _reindex_state["errors"] = 0
                _reindex_state["finished_at"] = None
                print(f"[reindex] Starting: {pending} atoms pending", file=sys.stderr)
            
            # Process one atom
            with db.conn() as c:
                row = c.execute(
                    """SELECT a.id FROM atoms a
                       LEFT JOIN atom_embeddings e ON a.id = e.atom_id
                       WHERE a.status = 'active' AND e.atom_id IS NULL
                       LIMIT 1"""
                ).fetchone()
            
            if not row:
                _reindex_state["running"] = False
                _reindex_state["finished_at"] = int(time.time())
                print(f"[reindex] Done: {_reindex_state['created']} created, {_reindex_state['errors']} errors", file=sys.stderr)
                continue
            
            atom_id = row["id"]
            _reindex_state["current_atom"] = atom_id
            atom = db.get_atom(atom_id)
            
            if atom:
                emb = embeddings.embed_atom(atom)
                if emb:
                    embeddings.store_embedding(atom_id, emb)
                    _reindex_state["created"] += 1
                else:
                    _reindex_state["errors"] += 1
            else:
                _reindex_state["errors"] += 1
            
            _reindex_state["processed"] += 1
            
            # Update total (new atoms may have been added)
            _reindex_state["total"] = _reindex_state["processed"] + pending - 1
            
            time.sleep(batch_delay)
            
        except Exception as e:
            print(f"[reindex] error: {e}", file=sys.stderr)
            time.sleep(5)

_reindex_thread = threading.Thread(target=_reindex_loop, daemon=True)
_reindex_thread.start()

# ─── Input validation ─────────────────────────────

_rate_bucket = {"count": 0, "window": int(time.time())}
_rate_lock = threading.Lock()


def _check_rate_limit() -> bool:
    """Simple in-process rate limiter (sliding window)."""
    with _rate_lock:
        now = int(time.time())
        if now - _rate_bucket["window"] >= 60:
            _rate_bucket["count"] = 0
            _rate_bucket["window"] = now
        _rate_bucket["count"] += 1
        return _rate_bucket["count"] <= RATE_LIMIT_PER_MIN


def _validate_input(title: str, body: str = "") -> str | None:
    """Validate atom input. Returns error message or None if valid."""
    if not title or not title.strip():
        return "Title is required and cannot be empty"
    if len(title) > MAX_TITLE_CHARS:
        return f"Title exceeds max length ({MAX_TITLE_CHARS} chars)"
    if len(body) > MAX_BODY_CHARS:
        return f"Body exceeds max length ({MAX_BODY_CHARS} chars)"
    # Basic null-byte injection guard
    if "\x00" in title or "\x00" in body:
        return "Null bytes are not allowed"
    return None


# ─── MCP Server ──────────────────────────────────────────────

mcp = FastMCP(
    "memory-engine",
    host=HOST,
    port=PORT,
)


@mcp.tool()
def remember(
    title: str,
    body: str = "",
    type: str = "fact",
    domain: str = "general",
    confidence: float = 0.5,
    tags: list[str] | None = None,
    ttl_days: int | None = None,
    memory_tier: str | None = None,
) -> str:
    """
    Create or update a memory atom.
    
    Args:
        title: Short, clear title for this memory
        body: Full content (can be markdown)
        type: One of: fact, decision, event, preference, log, procedure, note
        domain: Categorization (e.g. 'infrastructure', 'personal', 'project:xxx')
        confidence: 0.0 (hypothesis) to 1.0 (verified)
        tags: List of tags for categorization
        ttl_days: Optional TTL in days (None = permanent)
        memory_tier: Optional 3-tier class: episodic, semantic, procedural
    
    Returns:
        JSON string with created atom info
    """
    # Input validation
    err = _validate_input(title, body)
    if err:
        return json.dumps({"error": err})
    if not _check_rate_limit():
        return json.dumps({"error": "Rate limit exceeded. Try again later."})
    ttl = int(time.time()) + (ttl_days * 86400) if ttl_days else None
    atom = db.create_atom(
        title=title,
        body=body,
        type=type,
        domain=domain,
        confidence=confidence,
        tags=tags,
        source="ai",
        memory_tier=memory_tier,
        ttl=ttl,
    )
    # Async embedding (non-blocking — background thread)
    if embeddings.enabled:
        def _bg_embed():
            try:
                emb = embeddings.embed_atom(atom)
                if emb:
                    embeddings.store_embedding(atom["id"], emb)
            except Exception as e:
                print(f"[embed_bg] error for {atom['id']}: {e}", file=sys.stderr)
        threading.Thread(target=_bg_embed, daemon=True).start()

    # Immediate rule-based auto-bonding. Semantic bonds are still available via
    # suggest_bonds after the embedding is indexed; remember stays low-latency.
    auto_bonds = []
    ab_cfg = config.get("auto_bond", {})
    if ab_cfg.get("auto_apply_on_remember", True):
        try:
            min_conf = ab_cfg.get("auto_apply_min_confidence", 0.65)
            max_apply = ab_cfg.get("max_auto_apply", 5)
            suggestions = auto_bond_engine.suggest_bonds_for_atom(
                atom["id"], auto_apply=False, skip_semantic=True,
            )
            auto_bonds = [s for s in suggestions if s.get("confidence", 0) >= min_conf][:max_apply]
            for b in auto_bonds:
                db.create_bond(
                    b["from_id"], b["to_id"], b["relation"],
                    b["confidence"], b["reason"],
                )
        except Exception as e:
            print(f"[auto_bond] error for {atom['id']}: {e}", file=sys.stderr)
            auto_bonds = []

    return json.dumps({
        "status": "created",
        "id": atom["id"],
        "title": atom["title"],
        "domain": atom["domain"],
        "type": atom["type"],
        "memory_tier": atom.get("memory_tier"),
        "embedding_queued": embeddings.enabled,
        "auto_bonds_created": len(auto_bonds),
        "auto_bonds": auto_bonds,
    }, ensure_ascii=False)


@mcp.tool()
def recall(
    query: str,
    limit: int = 5,
    min_weight: float = 0.0,
    domain: str | None = None,
    semantic: bool = True,
    memory_tier: str | None = None,
    include_superseded: bool = False,
) -> str:
    """
    Smart recall: search memory with multi-factor ranking.
    Combines FTS relevance, semantic similarity, confidence, recency, and weight.
    
    Args:
        query: Natural language query
        limit: Max results (default 5)
        min_weight: Filter out low-weight atoms
        domain: Filter by domain
        semantic: If True (default), also use semantic search via Ollama
        memory_tier: Optional filter: episodic, semantic, procedural
        include_superseded: Include historical superseded atoms (default False)
    
    Returns:
        JSON string with ranked results
    """
    results = engine.recall(
        query, limit=limit, min_weight=min_weight, domain=domain,
        semantic=semantic, embeddings=embeddings if semantic else None,
        memory_tier=memory_tier, include_superseded=include_superseded,
    )
    return json.dumps(results, ensure_ascii=False, indent=2)


@mcp.tool()
def memory_contradict(
    old_atom_id: str,
    title: str,
    body: str = "",
    reason: str = "",
    type: str | None = None,
    domain: str | None = None,
    confidence: float = 0.8,
    tags: list[str] | None = None,
    memory_tier: str | None = None,
) -> str:
    """
    Supersede an existing atom with a newer contradictory memory.

    The old atom is kept with status='superseded' and linked to the new atom via
    'contradicts' and 'supersedes' bonds. Normal recall prefers the new active
    atom; pass include_superseded=True to recall when you need history.
    """
    try:
        result = db.create_contradiction(
            old_atom_id=old_atom_id,
            title=title,
            body=body,
            reason=reason,
            type=type,
            domain=domain,
            confidence=confidence,
            tags=tags,
            memory_tier=memory_tier,
            created_by="ai",
        )
        # Queue embedding for the new atom only.
        new_atom = result.get("new_atom") if isinstance(result, dict) else None
        if embeddings.enabled and new_atom:
            def _bg_embed_contradiction():
                try:
                    emb = embeddings.embed_atom(new_atom)
                    if emb:
                        embeddings.store_embedding(new_atom["id"], emb)
                        embeddings.invalidate_cache()
                except Exception as e:
                    print(f"[embed_bg] error for contradiction {new_atom.get('id')}: {e}", file=sys.stderr)
            threading.Thread(target=_bg_embed_contradiction, daemon=True).start()
        return json.dumps({"status": "contradiction_created", **result}, ensure_ascii=False, indent=2)
    except KeyError as e:
        return json.dumps({"error": str(e)}, ensure_ascii=False)


@mcp.tool()
def list_contradictions(atom_id: str | None = None, limit: int = 20) -> str:
    """
    List explicit contradiction/supersession records.

    Args:
        atom_id: Optional atom id to filter old/new side of contradictions.
        limit: Max records to return.
    """
    return json.dumps(db.list_contradictions(atom_id=atom_id, limit=limit), ensure_ascii=False, indent=2)


@mcp.tool()
def memory_impact(atom_id: str, depth: int = 2) -> str:
    """
    Impact analysis: find all atoms that depend on or are related to this atom.
    Traverses bonds up to `depth` hops and collects contradictions.

    Useful before updating or deleting an atom — shows what will be affected.

    Args:
        atom_id: The atom to analyze
        depth: Graph traversal depth (default 2, max 5)
    """
    result = db.get_impact(atom_id, depth=min(depth, 5))
    if result is None:
        return json.dumps({"error": f"Atom '{atom_id}' not found"}, ensure_ascii=False)
    return json.dumps(result, ensure_ascii=False, indent=2)


@mcp.tool()
def classify_memory_tier(type: str = "fact", domain: str = "general", meta: dict | None = None) -> str:
    """
    Infer the 3-tier memory class for a prospective atom.

    Tiers: episodic (events/logs/session traces), semantic (facts/decisions),
    procedural (preferences/procedures/standing rules).
    """
    return json.dumps({
        "type": type,
        "domain": domain,
        "memory_tier": db.infer_memory_tier(type=type, domain=domain, meta=meta),
    }, ensure_ascii=False)


@mcp.tool()
def link(
    from_id: str,
    to_id: str,
    relation: str = "related_to",
    strength: float = 0.5,
    evidence: str = "",
) -> str:
    """
    Create a typed bond between two atoms.
    
    Relations: is_a, part_of, depends_on, contradicts, refines, derived_from, detail_of, related_to
    """
    try:
        db.create_bond(from_id, to_id, relation, strength, evidence or None)
        return json.dumps({"status": "linked", "from": from_id, "to": to_id, "relation": relation})
    except KeyError as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def unlink(from_id: str, to_id: str, relation: str) -> str:
    """Remove a bond between two atoms."""
    ok = db.delete_bond(from_id, to_id, relation)
    return json.dumps({"status": "unlinked" if ok else "not_found"})


@mcp.tool()
def delete_atom(atom_id: str) -> str:
    """
    Delete an atom from the Memory Engine.
    
    This permanently removes the atom and all bonds connected to it.
    """
    ok = db.delete_atom(atom_id)
    return json.dumps({
        "status": "deleted" if ok else "not_found",
        "atom_id": atom_id
    })


@mcp.tool()
def get_atom(atom_id: str) -> str:
    """
    Get full atom details including all bonds (incoming and outgoing).
    Bumps access count.
    """
    atom = db.get_atom(atom_id)
    if not atom:
        return json.dumps({"error": f"Atom '{atom_id}' not found"})
    return json.dumps(atom, ensure_ascii=False, indent=2)


@mcp.tool()
def merge_atoms(primary_id: str, secondary_id: str) -> str:
    """
    Merge two atoms. Secondary is marked as 'merged', all bonds move to primary.
    Primary gets a confidence boost.
    """
    try:
        result = db.merge_atoms(primary_id, secondary_id)
        return json.dumps({
            "status": "merged",
            "primary": primary_id,
            "merged_into": secondary_id,
            "new_confidence": result["confidence"],
        }, ensure_ascii=False)
    except KeyError as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def decay_run() -> str:
    """
    Run decay cycle: reduce weight of atoms not accessed recently.
    """
    interval = config.get("decay", {}).get("interval_days", 30)
    factor = config.get("decay", {}).get("factor", 0.95)
    count = db.run_decay(interval_days=interval, factor=factor)
    return json.dumps({"status": "ok", "atoms_decayed": count, "factor": factor, "interval_days": interval})


@mcp.tool()
def ask_pending(limit: int = 10) -> str:
    """
    Get pending questions generated by the learning engine.
    These are things the system needs human input on.
    """
    questions = learning.get_pending(limit=limit)
    return json.dumps(questions, ensure_ascii=False, indent=2)


@mcp.tool()
def answer_human(qid: str, answer: str) -> str:
    """
    Answer a pending question. The system applies side effects based on 
    question type and answer content.
    """
    try:
        result = learning.process_answer(qid, answer)
        return json.dumps({"status": "processed", "result": result}, ensure_ascii=False)
    except KeyError as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def import_markdown(filepath: str | None = None) -> str:
    """
    Import markdown file(s) into the memory engine.
    
    Args:
        filepath: Specific file to import, or None to import all markdown files
    
    Returns:
        JSON string with import statistics
    """
    if filepath:
        result = importer.import_file(filepath)
    else:
        result = importer.import_all(verbose=True)
        # After bulk import, try auto-bonding
        bonds = importer.auto_bond()
        result["auto_bonds_created"] = bonds
    return json.dumps(result, ensure_ascii=False, indent=2)


@mcp.tool()
def export_atom(atom_id: str) -> str:
    """
    Export an atom as markdown (for coexistence with markdown system).
    Returns markdown text that can be saved to a .md file.
    """
    atom = db.get_atom(atom_id)
    if not atom:
        return json.dumps({"error": f"Atom '{atom_id}' not found"})

    tags = atom.get("tags", [])
    tags_str = " ".join(f"#{t}" for t in tags)
    
    md = f"""# {atom['title']}

> **ID:** {atom['id']} | **Domain:** {atom['domain']} | **Type:** {atom['type']}
> **Confidence:** {atom['confidence']} | **Weight:** {atom['weight']:.3f}
> **Source:** {atom.get('source', 'unknown')}
> **Created:** {time.strftime('%Y-%m-%d', time.localtime(atom['created_at']))}
> **Updated:** {time.strftime('%Y-%m-%d', time.localtime(atom['updated_at']))}

{tags_str}

---

{atom.get('body', '(empty)')}
"""
    return md


@mcp.tool()
def stats() -> str:
    """
    Get memory engine statistics: atom counts, bonds, pending questions,
    breakdown by domain and type, average weight, low-confidence count.
    """
    s = db.stats()
    s["version"] = __version__
    return json.dumps(s, ensure_ascii=False, indent=2)


@mcp.tool()
def search_graph(atom_id: str, depth: int = 2, relation: str | None = None) -> str:
    """
    Traverse the knowledge graph starting from an atom.
    
    Args:
        atom_id: Starting atom
        depth: How many hops to traverse (default 2)
        relation: Filter by specific relation type
    
    Returns:
        JSON with nodes and edges discovered.
    """
    graph = db.search_graph(atom_id, depth=depth, relation=relation)
    return json.dumps(graph, ensure_ascii=False, indent=2)


@mcp.tool()
def learning_run() -> str:
    """
    Run the learning engine: detect contradictions, weak atoms, merge 
    candidates, decay, and content gaps. Creates human questions for findings.
    Graph-gap/isolation review is handled by curator_run by default.
    """
    new_questions = learning.run_all_checks()
    return json.dumps({
        "status": "ok",
        "new_questions": len(new_questions),
        "questions": [{"id": q["id"], "type": q["question_type"], 
                       "question": q["question"]} for q in new_questions],
    }, ensure_ascii=False, indent=2)


@mcp.tool()
def list_atoms(
    domain: str | None = None,
    type: str | None = None,
    status: str = "active",
    limit: int = 20,
    memory_tier: str | None = None,
) -> str:
    """
    List atoms with optional filters. Useful for browsing the memory.
    """
    atoms = db.list_atoms(
        domain=domain, type=type, status=status, limit=limit, memory_tier=memory_tier,
    )
    # Slim down for listing
    slim = [{
        "id": a["id"],
        "title": a["title"],
        "domain": a["domain"],
        "type": a["type"],
        "memory_tier": a.get("memory_tier", "semantic"),
        "status": a.get("status", "active"),
        "confidence": a["confidence"],
        "weight": round(a["weight"], 3),
        "access_count": a["access_count"],
    } for a in atoms]
    return json.dumps(slim, ensure_ascii=False, indent=2)


@mcp.tool()
def recall_session(session_id: str, query: str, limit: int = 10) -> str:
    """
    Recall messages from a specific OpenClaw session.
    Searches within session_msg atoms for the given session.
    
    Args:
        session_id: Session ID (filename without .jsonl)
        query: Search query to filter messages
        limit: Max results
    """
    results = engine.recall(
        query,
        limit=limit,
        domain=f"session/{session_id}",
    )
    return json.dumps(results, ensure_ascii=False, indent=2)


@mcp.tool()
def cleanup_sessions() -> str:
    """
    Delete expired session atoms (TTL passed).
    Safe to call anytime — only removes atoms past their TTL.
    """
    count = session_watcher.cleanup_expired()
    return json.dumps({"status": "ok", "expired_atoms_removed": count})


@mcp.tool()
def session_summary(session_id: str) -> str:
    """
    Get a summary of a session: message count, time range, topics.
    Useful for quickly understanding what was discussed.
    
    Args:
        session_id: Session ID (filename without .jsonl)
    """
    atoms = db.list_atoms(
        domain=f"session/{session_id}",
        type="session_msg",
        status="active",
        limit=500,
        order_by="created_at",
    )
    if not atoms:
        return json.dumps({"error": f"No session atoms found for '{session_id}'"})
    
    user_msgs = [a for a in atoms if "[user]" in a["title"]]
    asst_msgs = [a for a in atoms if "[assistant]" in a["title"]]
    
    first_ts = atoms[0].get("created_at", 0)
    last_ts = atoms[-1].get("created_at", 0)
    
    return json.dumps({
        "session_id": session_id,
        "total_messages": len(atoms),
        "user_messages": len(user_msgs),
        "assistant_messages": len(asst_msgs),
        "time_range": {
            "start": time.strftime("%Y-%m-%d %H:%M", time.localtime(first_ts)),
            "end": time.strftime("%Y-%m-%d %H:%M", time.localtime(last_ts)),
        },
        "first_messages": [
            a["title"] for a in atoms[:5]
        ],
    }, ensure_ascii=False, indent=2)


@mcp.tool()
def cleanup_duplicates() -> str:
    """
    Remove duplicate session_msg atoms.

    Keeps atoms with a content_hash (v2 watcher) and removes older
    duplicates without one (v1 watcher artifacts). Also removes any
    remaining exact-duplicate pairs by content_hash, keeping the oldest.

    Returns a summary of what was removed.
    """
    removed = {"no_hash": 0, "exact_dupes": 0}

    with db.conn() as c:
        # 1. Remove session_msg atoms without content_hash (v1 leftovers)
        cur = c.execute(
            "DELETE FROM atoms WHERE type = 'session_msg' AND content_hash IS NULL"
        )
        removed["no_hash"] = cur.rowcount

        # 2. Remove exact duplicates by content_hash — keep the oldest (min rowid)
        dupes = c.execute(
            """SELECT content_hash, COUNT(*) as n, MIN(rowid) as keep_rowid
               FROM atoms
               WHERE type = 'session_msg' AND content_hash IS NOT NULL
               GROUP BY content_hash
               HAVING n > 1"""
        ).fetchall()

        for row in dupes:
            c.execute(
                """DELETE FROM atoms
                   WHERE content_hash = ? AND rowid != ?
                     AND type = 'session_msg'""",
                (row["content_hash"], row["keep_rowid"]),
            )
            removed["exact_dupes"] += (row["n"] - 1)

    total = removed["no_hash"] + removed["exact_dupes"]
    return json.dumps({
        "status": "ok",
        "removed_no_hash": removed["no_hash"],
        "removed_exact_dupes": removed["exact_dupes"],
        "total_removed": total,
    }, ensure_ascii=False, indent=2)


@mcp.tool()
def version() -> str:
    """
    Get the Memory Engine server version.
    """
    return json.dumps({
        "version": __version__,
        "python": sys.version.split()[0],
        "db_path": DB_PATH,
    }, ensure_ascii=False, indent=2)


@mcp.tool()
def semantic_search(
    query: str,
    limit: int = 5,
    domain: str | None = None,
    min_weight: float = 0.0,
) -> str:
    """
    Semantic search using Ollama embeddings (nomic-embed-text).
    Finds atoms by meaning, not just keyword match.
    
    Args:
        query: Natural language query
        limit: Max results (default 5)
        domain: Filter by domain
        min_weight: Filter by minimum weight
    
    Returns:
        JSON string with ranked semantic results
    """
    results = embeddings.semantic_search(
        query, limit=limit, domain=domain, min_weight=min_weight,
    )
    return json.dumps(results, ensure_ascii=False, indent=2)


@mcp.tool()
def suggest_bonds(
    atom_id: str,
    auto_apply: bool = False,
) -> str:
    """
    Suggest bonds for an atom using rules + semantic similarity.
    Strategies: domain cluster, keyword overlap, pattern detection, semantic.
    
    Args:
        atom_id: The atom to find bonds for
        auto_apply: If True, create the bonds directly
    
    Returns:
        JSON string with bond suggestions
    """
    suggestions = auto_bond_engine.suggest_bonds_for_atom(
        atom_id, auto_apply=auto_apply,
    )
    return json.dumps({
        "atom_id": atom_id,
        "suggestions": len(suggestions),
        "applied": auto_apply,
        "bonds": suggestions,
    }, ensure_ascii=False, indent=2)


@mcp.tool()
def suggest_bonds_all(
    auto_apply: bool = False,
    limit_per_atom: int = 2,
    max_atoms: int = 30,
) -> str:
    """
    Scan active atoms and suggest/create bonds.
    Useful for initial graph population or periodic maintenance.
    
    Args:
        auto_apply: If True, create bonds directly
        limit_per_atom: Max suggestions per atom
        max_atoms: Max atoms to scan (default 30)
    
    Returns:
        JSON string with summary statistics and top suggestions
    """
    try:
        result = auto_bond_engine.suggest_bonds_all(
            auto_apply=auto_apply, limit_per_atom=limit_per_atom,
            max_atoms=max_atoms,
        )
        return json.dumps(result, ensure_ascii=False, indent=2)
    except Exception as e:
        import traceback
        return json.dumps({"error": str(e), "trace": traceback.format_exc()[-500:]})


@mcp.tool()
def reindex_embeddings(force: bool = False) -> str:
    """
    Check the status of the background embedding indexer.
    The indexer runs automatically at startup and processes all atoms missing embeddings.
    
    Args:
        force: If True, delete all existing embeddings and restart from scratch
    
    Returns:
        JSON string with current indexing progress
    """
    if force:
        with db.conn() as c:
            c.execute("DELETE FROM atom_embeddings")
        embeddings.invalidate_cache()
        _reindex_state["running"] = False
        _reindex_state["finished_at"] = None
        return json.dumps({"status": "force_restart", "message": "All embeddings cleared, background indexer will rebuild"}, ensure_ascii=False)
    
    # Current stats
    with db.conn() as c:
        total_atoms = c.execute("SELECT COUNT(*) as n FROM atoms WHERE status = 'active'").fetchone()["n"]
        total_emb = c.execute("SELECT COUNT(*) as n FROM atom_embeddings").fetchone()["n"]
    
    elapsed = None
    if _reindex_state["started_at"]:
        end = _reindex_state["finished_at"] or int(time.time())
        elapsed = end - _reindex_state["started_at"]
    
    return json.dumps({
        "status": "running" if _reindex_state["running"] else ("done" if _reindex_state["finished_at"] else "idle"),
        "total_atoms": total_atoms,
        "total_embeddings": total_emb,
        "missing": total_atoms - total_emb,
        "progress": {
            "processed": _reindex_state["processed"],
            "created": _reindex_state["created"],
            "errors": _reindex_state["errors"],
            "current_atom": _reindex_state["current_atom"],
        },
        "started_at": _reindex_state["started_at"],
        "finished_at": _reindex_state["finished_at"],
        "elapsed_sec": elapsed,
    }, ensure_ascii=False, indent=2)


@mcp.tool()
def find_similar(atom_id: str, limit: int = 5, threshold: float = 0.5) -> str:
    """
    Find atoms semantically similar to a given atom.
    Uses cosine similarity on embeddings.
    
    Args:
        atom_id: The reference atom
        limit: Max results
        threshold: Minimum similarity score (0-1)
    
    Returns:
        JSON string with similar atoms and scores
    """
    results = embeddings.find_similar_atoms(
        atom_id, limit=limit, threshold=threshold,
    )
    return json.dumps({
        "atom_id": atom_id,
        "similar_count": len(results),
        "results": results,
    }, ensure_ascii=False, indent=2)


# ─── Error Memory Tools ─────────────────────────────────────

@mcp.tool()
def error_check(task_description: str, limit: int = 5) -> str:
    """
    Check if a task has failed before. Call BEFORE executing a task
    to retrieve past errors and corrections.
    
    Args:
        task_description: What you're about to do (e.g. 'compile ProStructures DLL')
        limit: Max results
    
    Returns:
        JSON string with matching unresolved errors
    """
    results = db.check_errors(task_description, limit=limit)
    return json.dumps({
        "query": task_description,
        "found": len(results),
        "errors": results,
        "has_known_errors": len(results) > 0,
    }, ensure_ascii=False, indent=2)


@mcp.tool()
def error_log(
    mistake: str,
    correction: str,
    task_type: str = "general",
    error_category: str = "logic_error",
    severity: str = "minor",
) -> str:
    """
    Log an error and its correction. If the same error has occurred
    3+ times, it auto-promotes to a permanent preference rule.
    
    Args:
        mistake: What went wrong
        correction: What should have been done
        task_type: Category of task (e.g. 'compilation', 'deploy', 'config')
        error_category: field_selection, logic_error, scope_error, omission, tool_misuse
        severity: minor, major, critical
    
    Returns:
        JSON string with logged error and promotion status
    """
    result = db.log_error(
        task_type=task_type,
        error_category=error_category,
        mistake_description=mistake,
        correction=correction,
        severity=severity,
    )
    
    promoted = []
    if result.get("upgraded_to_preference"):
        promoted = engine.check_and_promote_errors()
    
    return json.dumps({
        "status": "logged",
        "error": result,
        "promoted_to_preferences": promoted,
        "message": (
            f"Error logged. Occurrence #{result.get('occurrence_count', 1)}."
            + (" Auto-promoted to permanent rule!" if promoted else "")
        ),
    }, ensure_ascii=False, indent=2)


@mcp.tool()
def error_list(resolved: bool = False, limit: int = 20) -> str:
    """
    List recorded errors, filtered by resolution status.
    
    Args:
        resolved: True to show resolved errors, False for unresolved (default)
        limit: Max results
    
    Returns:
        JSON string with error list
    """
    results = db.list_errors(resolved=resolved, limit=limit)
    return json.dumps({
        "resolved": resolved,
        "count": len(results),
        "errors": results,
    }, ensure_ascii=False, indent=2)


# ─── Preference Search Tool ─────────────────────────────────

@mcp.tool()
def preference_search(
    category: str | None = None,
    query: str | None = None,
    scope: str | None = None,
    limit: int = 20,
) -> str:
    """
    Search preference atoms by structured metadata.
    Preferences are atoms with type='preference' and metadata like:
    {"category": "tooling", "condition": "when compiling PS", "rule": "dotnet build net48"}
    
    Args:
        category: Filter by category (e.g. 'tooling', 'naming', 'format', 'policy')
        query: Free-text search in title, body, and meta fields
        scope: Filter by scope (e.g. 'personal', 'project')
        limit: Max results
    
    Returns:
        JSON string with matching preferences
    """
    results = db.search_preferences(
        category=category, query=query, scope=scope, limit=limit,
    )
    return json.dumps({
        "count": len(results),
        "preferences": results,
    }, ensure_ascii=False, indent=2)



# ─── Cognitive Curator Tools ────────────────────────────────

@mcp.tool()
def cognitive_status() -> str:
    """
    Get cognitive health metrics for the memory graph.

    Returns counts for active/durable atoms, bonds, isolated durable atoms,
    pending questions, missing compact summaries, stale atoms, and recommendations.
    """
    return json.dumps(curator.status(), ensure_ascii=False, indent=2)


@mcp.tool()
def working_set(
    query: str,
    domain: str | None = None,
    limit: int = 8,
    graph_depth: int = 1,
) -> str:
    """
    Build a task-oriented context pack before doing work.

    Combines smart recall, graph neighbors, and key procedures/decisions into
    a compact working set so the agent starts with the right operational memory.
    """
    result = curator.working_set(
        query=query, domain=domain, limit=limit, graph_depth=graph_depth,
    )
    return json.dumps(result, ensure_ascii=False, indent=2)


@mcp.tool()
def curator_run(
    dry_run: bool = True,
    auto_apply: bool = False,
    max_atoms: int = 80,
) -> str:
    """
    Run one cognitive curator pass.

    dry_run=True only proposes actions. With auto_apply=True and dry_run=False,
    applies safe body_compact generation and high-confidence rule-based bonds.
    It never deletes durable atoms or rewrites markdown source files.
    """
    result = curator.run(
        dry_run=dry_run, auto_apply=auto_apply, max_atoms=max_atoms,
    )
    return json.dumps(result, ensure_ascii=False, indent=2)

# ─── Hierarchical Summary Tool ──────────────────────────────

@mcp.tool()
def memory_summary(domain: str | None = None) -> str:
    """
    Generate a hierarchical 3-level summary of the memory database.
    
    L0: Global counts (total atoms, bonds, errors, by type/domain)
    L1: Per-domain breakdown with top 5 atoms by weight
    L2: Detail note (use list_atoms/get_atom for full content)
    
    Args:
        domain: Optional filter to summarize a single domain
    
    Returns:
        JSON string with hierarchical summary
    """
    result = engine.hierarchical_summary(domain=domain)
    return json.dumps(result, ensure_ascii=False, indent=2)


from backup import (
    create_backup as _do_backup,
    restore_backup as _do_restore,
    verify_backup as _verify_backup,
    export_json as _export_json,
    import_json as _import_json,
    list_backups as _list_backups,
    cleanup_old_backups as _cleanup_backups,
)


@mcp.tool()
def backup_database(action: str = "create", backup_path: str | None = None,
                    keep: int = 10) -> str:
    """
    Create, list, verify, or clean up database backups.
    
    Args:
        action: One of: create, list, verify, cleanup
        backup_path: Path to backup (for verify). If None, uses default location.
        keep: Number of backups to keep for cleanup (default 10)
    
    Returns:
        JSON string with backup information
    """
    try:
        if action == "create":
            result = _do_backup(DB_PATH)
            return json.dumps(result, ensure_ascii=False, indent=2)
        elif action == "list":
            result = _list_backups(DB_PATH)
            return json.dumps(result, ensure_ascii=False, indent=2)
        elif action == "verify":
            if not backup_path:
                return json.dumps({"error": "backup_path required for verify"})
            result = _verify_backup(backup_path)
            return json.dumps(result, ensure_ascii=False, indent=2)
        elif action == "cleanup":
            result = _cleanup_backups(DB_PATH, keep=keep)
            return json.dumps(result, ensure_ascii=False, indent=2)
        else:
            return json.dumps({"error": f"Unknown action: {action}. Use: create, list, verify, cleanup"})
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def restore_database(backup_path: str) -> str:
    """
    Restore database from a backup file.
    
    WARNING: This overwrites the current database.
    A safety backup of the current state is created automatically before restore.
    
    Args:
        backup_path: Path to the backup file to restore from
    
    Returns:
        JSON string with restore result
    """
    try:
        result = _do_restore(DB_PATH, backup_path, verify=True)
        return json.dumps(result, ensure_ascii=False, indent=2)
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def export_all(include_embeddings: bool = False) -> str:
    """
    Export all memory data as JSON.
    Portable format for migration, versioning, or external analysis.
    
    Args:
        include_embeddings: Include embedding vectors (default False — they are large)
    
    Returns:
        JSON string with all memory data
    """
    try:
        data = _export_json(DB_PATH, include_embeddings=include_embeddings)
        return json.dumps(data, ensure_ascii=False, indent=2, default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def import_data(json_data: str, mode: str = "merge") -> str:
    """
    Import memory data from a JSON export.
    
    Args:
        json_data: JSON string from export_all, or path to a .json file
        mode: "merge" (upsert by ID) or "replace" (wipe + insert)
    
    Returns:
        JSON string with import statistics
    """
    import tempfile
    try:
        # Accept both raw JSON and file path
        if json_data.strip().startswith("{"):
            # Raw JSON — write to temp file for import_json
            fd, tmp = tempfile.mkstemp(suffix=".json")
            os.write(fd, json_data.encode())
            os.close(fd)
            result = _import_json(DB_PATH, tmp, mode=mode)
            os.unlink(tmp)
        else:
            # Treat as file path
            result = _import_json(DB_PATH, json_data.strip(), mode=mode)
        return json.dumps(result, ensure_ascii=False, indent=2)
    except Exception as e:
        return json.dumps({"error": str(e)})


# ─── Main ────────────────────────────────────────────────────

if __name__ == "__main__":
    print(f"🧠 Memory Engine v{__version__} starting on {HOST}:{PORT}")
    print(f"   DB: {DB_PATH}")
    print(f"   Markdown source: {MD_SOURCE}")
    transcript_source = OPENCLAW_AGENT_DB or f"{SESSIONS_DIR} (legacy JSONL)"
    print(f"   Transcript source: {transcript_source} (TTL={SESSION_TTL_DAYS}d)")
    print(f"   Embeddings: {'✅ ' + embeddings.model if embeddings.enabled else '❌ disabled'}")
    # Security info
    if is_auth_enabled():
        print(f"   🔒 Auth: ENABLED (token-based)")
    else:
        print(f"   ⚠️  Auth: DISABLED (open mode — not for network exposure)")
    print(f"   Bind: {HOST} ({'remote OK' if HOST == '0.0.0.0' else 'localhost only'})")
    print(f"   Rate limit: {RATE_LIMIT_PER_MIN}/min")
    try:
        mcp.run(transport="sse")
    finally:
        session_watcher.stop()
