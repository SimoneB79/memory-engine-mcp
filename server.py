"""
Memory Engine — MCP Server
Exposes memory tools to LLMs via Model Context Protocol.
"""
import json
import os
import sys
import time
from pathlib import Path
from mcp.server.fastmcp import FastMCP

# Add project dir to path
sys.path.insert(0, str(Path(__file__).parent))

from db import DB
from engine import Engine
from learning import Learning
from importer import MarkdownImporter

# ─── Config ──────────────────────────────────────────────────

CONFIG_PATH = Path(__file__).parent / "config.json"
config = json.loads(CONFIG_PATH.read_text())

DB_PATH = os.environ.get("MEMORY_DB_PATH", config.get("db_path", "/data/memory.db"))
MD_SOURCE = os.environ.get("MARKDOWN_SOURCE", config.get("markdown_source", "/workspace/memory"))
HOST = os.environ.get("MEMORY_HOST", config.get("server", {}).get("host", "0.0.0.0"))
PORT = int(os.environ.get("MEMORY_PORT", config.get("server", {}).get("port", 8085)))

# ─── Init ────────────────────────────────────────────────────

# Ensure data dir exists
Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)

db = DB(DB_PATH)
engine = Engine(db, config)
learning = Learning(db, engine, config)
importer = MarkdownImporter(db, MD_SOURCE)

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
    
    Returns:
        JSON string with created atom info
    """
    ttl = int(time.time()) + (ttl_days * 86400) if ttl_days else None
    atom = db.create_atom(
        title=title,
        body=body,
        type=type,
        domain=domain,
        confidence=confidence,
        tags=tags,
        source="ai",
        ttl=ttl,
    )
    return json.dumps({
        "status": "created",
        "id": atom["id"],
        "title": atom["title"],
        "domain": atom["domain"],
        "type": atom["type"],
    }, ensure_ascii=False)


@mcp.tool()
def recall(
    query: str,
    limit: int = 5,
    min_weight: float = 0.0,
    domain: str | None = None,
) -> str:
    """
    Smart recall: search memory with multi-factor ranking.
    Combines FTS relevance, confidence, recency, and weight.
    
    Args:
        query: Natural language query
        limit: Max results (default 5)
        min_weight: Filter out low-weight atoms
        domain: Filter by domain
    
    Returns:
        JSON string with ranked results
    """
    results = engine.recall(query, limit=limit, min_weight=min_weight, domain=domain)
    return json.dumps(results, ensure_ascii=False, indent=2)


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
    candidates, decay, and gaps. Creates human questions for findings.
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
) -> str:
    """
    List atoms with optional filters. Useful for browsing the memory.
    """
    atoms = db.list_atoms(domain=domain, type=type, status=status, limit=limit)
    # Slim down for listing
    slim = [{
        "id": a["id"],
        "title": a["title"],
        "domain": a["domain"],
        "type": a["type"],
        "confidence": a["confidence"],
        "weight": round(a["weight"], 3),
        "access_count": a["access_count"],
    } for a in atoms]
    return json.dumps(slim, ensure_ascii=False, indent=2)


# ─── Main ────────────────────────────────────────────────────

if __name__ == "__main__":
    print(f"🧠 Memory Engine starting on {HOST}:{PORT}")
    print(f"   DB: {DB_PATH}")
    print(f"   Markdown source: {MD_SOURCE}")
    mcp.run(transport="sse")
