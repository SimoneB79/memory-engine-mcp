"""
Benchmark suite for Memory Engine recall quality.

Measures:
1. Recall precision: are the top results actually relevant?
2. Recall coverage: how many relevant atoms are found?
3. Ranking quality: are the most relevant results ranked highest?
4. Latency: how fast is recall?
5. Graph expansion value: do graph neighbors add useful context?

Usage:
    python3 benchmark.py --db /data/memory.db --queries queries.json
    python3 benchmark.py --db /data/memory.db --auto  # auto-generate queries from existing atoms

Output: JSON report + optional markdown summary.
"""
import json
import time
import argparse
import random
import sys
import statistics
from pathlib import Path

# Add project dir for imports
sys.path.insert(0, str(Path(__file__).parent))

from db import DB
from engine import Engine


def load_config() -> dict:
    p = Path(__file__).parent / "config.json"
    try:
        return json.loads(p.read_text())
    except Exception:
        return {}


# ════════════════════════════════════════════════════════════
# Query generation
# ════════════════════════════════════════════════════════════

def generate_queries_from_atoms(db: DB, n: int = 20) -> list[dict]:
    """
    Auto-generate test queries from existing atoms.
    Uses atom titles/body to create realistic queries.
    
    Each query has:
    - query: the search string
    - expected_ids: atom IDs that should match (ground truth)
    - domain: expected domain
    """
    atoms = db.list_atoms(status="active", limit=500)
    if not atoms:
        return []

    queries = []
    seen_domains = set()

    # Strategy 1: Use title keywords as queries (high precision expected)
    random.shuffle(atoms)
    for a in atoms[:n]:
        title = a["title"]
        # Extract 2-3 significant words from title
        words = [w for w in title.split() if len(w) > 3]
        if len(words) < 2:
            query = title
        else:
            # Use 2-3 random significant words
            k = min(3, len(words))
            query = " ".join(random.sample(words, k))

        # Find all atoms in the same domain with overlapping words (ground truth)
        expected = []
        title_words = set(title.lower().split())
        for other in atoms:
            if other["domain"] != a["domain"]:
                continue
            other_words = set(other["title"].lower().split())
            if len(title_words & other_words) >= 1:
                expected.append(other["id"])

        if expected:
            queries.append({
                "query": query,
                "expected_ids": list(set(expected)),
                "domain": a["domain"],
                "source_atom": a["id"],
            })
            seen_domains.add(a["domain"])

    # Strategy 2: Domain-only queries (broader, tests recall coverage)
    for domain in list(seen_domains)[:5]:
        domain_atoms = [a for a in atoms if a["domain"] == domain]
        if len(domain_atoms) < 2:
            continue
        # Use the domain name itself as query
        domain_label = domain.split("/")[-1].replace("_", " ").replace("-", " ")
        queries.append({
            "query": domain_label,
            "expected_ids": [a["id"] for a in domain_atoms[:10]],
            "domain": domain,
            "source_atom": None,
        })

    return queries


# ════════════════════════════════════════════════════════════
# Metrics
# ════════════════════════════════════════════════════════════

def compute_metrics(results: list[dict], expected_ids: list[str], limit: int = 5) -> dict:
    """
    Compute precision, recall, and ranking metrics.
    
    Args:
        results: Ranked recall results (list of dicts with "id")
        expected_ids: Ground truth IDs that should match
        limit: Number of top results to consider for precision
    """
    result_ids = [r["id"] for r in results[:limit]]
    expected_set = set(expected_ids)
    result_set = set(result_ids)

    # Precision@K: fraction of top-K results that are relevant
    hits = len(result_set & expected_set)
    precision_at_k = hits / len(result_ids) if result_ids else 0.0

    # Recall: fraction of relevant items found in top-K
    recall = hits / len(expected_set) if expected_set else 0.0

    # MRR (Mean Reciprocal Rank): position of first relevant result
    mrr = 0.0
    for i, rid in enumerate(result_ids, 1):
        if rid in expected_set:
            mrr = 1.0 / i
            break

    return {
        "precision_at_k": round(precision_at_k, 4),
        "recall": round(recall, 4),
        "mrr": round(mrr, 4),
        "hits": hits,
        "expected_count": len(expected_set),
        "returned_count": len(result_ids),
    }


def benchmark_recall(db: DB, engine: Engine, queries: list[dict],
                     limit: int = 5, semantic: bool = False) -> dict:
    """
    Run benchmark on a set of queries.
    
    Returns aggregate metrics + per-query details.
    """
    all_metrics = []
    latencies = []
    per_query = []

    for q in queries:
        query_text = q["query"]
        expected = q["expected_ids"]

        # Measure latency
        t0 = time.perf_counter()
        results = engine.recall(
            query_text, limit=limit, semantic=semantic,
            domain=q.get("domain"),
        )
        t1 = time.perf_counter()
        latency_ms = (t1 - t0) * 1000

        metrics = compute_metrics(results, expected, limit=limit)
        metrics["latency_ms"] = round(latency_ms, 2)
        metrics["query"] = query_text

        all_metrics.append(metrics)
        latencies.append(latency_ms)

        per_query.append({
            "query": query_text,
            "domain": q.get("domain"),
            "expected_count": len(expected),
            "hits": metrics["hits"],
            "precision": metrics["precision_at_k"],
            "recall": metrics["recall"],
            "mrr": metrics["mrr"],
            "latency_ms": round(latency_ms, 2),
            "result_titles": [r.get("title", r.get("id", "?"))[:60] for r in results[:limit]],
        })

    # Aggregate
    n = len(all_metrics)
    if n == 0:
        return {"error": "no queries"}

    aggregate = {
        "query_count": n,
        "avg_precision": round(statistics.mean(m["precision_at_k"] for m in all_metrics), 4),
        "avg_recall": round(statistics.mean(m["recall"] for m in all_metrics), 4),
        "avg_mrr": round(statistics.mean(m["mrr"] for m in all_metrics), 4),
        "avg_latency_ms": round(statistics.mean(latencies), 2),
        "p50_latency_ms": round(statistics.median(latencies), 2),
        "p95_latency_ms": round(sorted(latencies)[int(len(latencies) * 0.95)] if len(latencies) > 1 else latencies[0], 2),
        "max_latency_ms": round(max(latencies), 2),
        "min_latency_ms": round(min(latencies), 2),
        "zero_hit_queries": sum(1 for m in all_metrics if m["hits"] == 0),
    }

    return {
        "aggregate": aggregate,
        "per_query": per_query,
    }


def benchmark_graph_expansion(db: DB, engine: Engine, queries: list[dict],
                               limit: int = 5) -> dict:
    """
    Measure the value of graph expansion: does it surface relevant atoms
    that FTS alone would miss?
    """
    results_comparison = []

    for q in queries[:10]:  # subset for speed
        query_text = q["query"]
        expected = set(q["expected_ids"])

        # Recall with graph (default)
        with_graph = engine.recall(query_text, limit=limit, semantic=False,
                                    domain=q.get("domain"))
        with_graph_ids = {r["id"] for r in with_graph}

        # Recall without graph (temporarily disable)
        graph_cfg = engine.config.get("graph_recall", {})
        old_enabled = graph_cfg.get("enabled", True)
        graph_cfg["enabled"] = False
        without_graph = engine.recall(query_text, limit=limit, semantic=False,
                                       domain=q.get("domain"))
        graph_cfg["enabled"] = old_enabled
        without_graph_ids = {r["id"] for r in without_graph}

        # Atoms found only with graph
        graph_only = with_graph_ids - without_graph_ids
        graph_only_relevant = graph_only & expected

        results_comparison.append({
            "query": query_text,
            "with_graph_hits": len(with_graph_ids & expected),
            "without_graph_hits": len(without_graph_ids & expected),
            "graph_added_relevant": len(graph_only_relevant),
            "graph_added_total": len(graph_only),
        })

    added_relevant = sum(r["graph_added_relevant"] for r in results_comparison)
    total_queries = len(results_comparison)

    return {
        "queries_tested": total_queries,
        "relevant_atoms_added_by_graph": added_relevant,
        "avg_relevant_added_per_query": round(added_relevant / total_queries, 2) if total_queries else 0,
        "queries_benefited": sum(1 for r in results_comparison if r["graph_added_relevant"] > 0),
        "details": results_comparison,
    }


# ════════════════════════════════════════════════════════════
# Report formatting
# ════════════════════════════════════════════════════════════

def format_report_md(results: dict) -> str:
    """Format benchmark results as markdown."""
    agg = results.get("recall", {}).get("aggregate", {})
    graph = results.get("graph_expansion", {})

    md = f"""# Memory Engine — Benchmark Report

Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}

## Recall Quality

| Metric | Value |
|---|---|
| Queries | {agg.get('query_count', 0)} |
| Avg Precision@{agg.get('limit', 5)} | {agg.get('avg_precision', 0):.2%} |
| Avg Recall | {agg.get('avg_recall', 0):.2%} |
| Avg MRR | {agg.get('avg_mrr', 0):.4f} |
| Zero-hit queries | {agg.get('zero_hit_queries', 0)} |

## Latency

| Metric | Value |
|---|---|
| Average | {agg.get('avg_latency_ms', 0):.1f} ms |
| p50 (median) | {agg.get('p50_latency_ms', 0):.1f} ms |
| p95 | {agg.get('p95_latency_ms', 0):.1f} ms |
| Min | {agg.get('min_latency_ms', 0):.1f} ms |
| Max | {agg.get('max_latency_ms', 0):.1f} ms |

## Graph Expansion Impact

| Metric | Value |
|---|---|
| Queries tested | {graph.get('queries_tested', 0)} |
| Relevant atoms added by graph | {graph.get('relevant_atoms_added_by_graph', 0)} |
| Queries that benefited | {graph.get('queries_benefited', 0)} |
| Avg relevant added per query | {graph.get('avg_relevant_added_per_query', 0)} |

## Per-Query Details

| Query | Domain | Expected | Hits | Precision | MRR | Latency |
|---|---|---|---|---|---|---|
"""
    for q in results.get("recall", {}).get("per_query", []):
        md += f"| {q['query'][:30]} | {q.get('domain', '')[:15]} | {q['expected_count']} | {q['hits']} | {q['precision']:.0%} | {q['mrr']:.2f} | {q['latency_ms']:.0f}ms |\n"

    return md


# ════════════════════════════════════════════════════════════
# CLI
# ════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description="Memory Engine benchmark")
    parser.add_argument("--db", default="/data/memory.db", help="Database path")
    parser.add_argument("--queries", default=None, help="JSON file with queries (auto-generate if omitted)")
    parser.add_argument("--auto", action="store_true", help="Auto-generate queries from atoms")
    parser.add_argument("--limit", type=int, default=5, help="Results per query")
    parser.add_argument("--output", default=None, help="Output JSON report path")
    parser.add_argument("--markdown", default=None, help="Output markdown report path")
    parser.add_argument("--n-queries", type=int, default=20, help="Number of auto-generated queries")
    args = parser.parse_args()

    config = load_config()
    db = DB(args.db)
    engine = Engine(db, config)

    # Load or generate queries
    if args.queries:
        queries = json.loads(Path(args.queries).read_text())
    elif args.auto:
        print(f"Generating {args.n_queries} queries from existing atoms...", file=sys.stderr)
        queries = generate_queries_from_atoms(db, n=args.n_queries)
    else:
        print("Specify --auto or --queries <file>", file=sys.stderr)
        sys.exit(1)

    print(f"Running benchmark with {len(queries)} queries (limit={args.limit})...", file=sys.stderr)

    # Run recall benchmark
    recall_results = benchmark_recall(db, engine, queries, limit=args.limit, semantic=False)

    # Run graph expansion benchmark
    print("Testing graph expansion impact...", file=sys.stderr)
    graph_results = benchmark_graph_expansion(db, engine, queries, limit=args.limit)

    results = {
        "timestamp": int(time.time()),
        "db_path": args.db,
        "limit": args.limit,
        "recall": recall_results,
        "graph_expansion": graph_results,
    }

    # Print summary to stdout
    agg = recall_results["aggregate"]
    print(f"\n{'='*50}")
    print(f"Benchmark Results ({agg['query_count']} queries, limit={args.limit})")
    print(f"{'='*50}")
    print(f"Precision@{args.limit}: {agg['avg_precision']:.2%}")
    print(f"Recall:           {agg['avg_recall']:.2%}")
    print(f"MRR:              {agg['avg_mrr']:.4f}")
    print(f"Avg latency:      {agg['avg_latency_ms']:.1f}ms (p95: {agg['p95_latency_ms']:.1f}ms)")
    print(f"Zero-hit queries: {agg['zero_hit_queries']}")
    print(f"Graph added {graph_results['relevant_atoms_added_by_graph']} relevant atoms across {graph_results['queries_tested']} queries")

    # Save JSON report
    if args.output:
        Path(args.output).write_text(json.dumps(results, ensure_ascii=False, indent=2))
        print(f"\nJSON report: {args.output}", file=sys.stderr)

    # Save markdown report
    if args.markdown:
        Path(args.markdown).write_text(format_report_md(results))
        print(f"Markdown report: {args.markdown}", file=sys.stderr)


if __name__ == "__main__":
    main()
