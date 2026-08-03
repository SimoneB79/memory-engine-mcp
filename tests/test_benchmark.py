"""
Tests for benchmark.py — metric computation and query generation.
"""
import pytest
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from db import DB
from engine import Engine
from benchmark import (
    compute_metrics,
    generate_queries_from_atoms,
    benchmark_recall,
    format_report_md,
)


CONFIG = {
    "ranking": {"fts_weight": 0.3, "semantic_weight": 0.3, "confidence_weight": 0.2,
                 "recency_weight": 0.1, "weight_factor": 0.1},
    "graph_recall": {"enabled": True, "seed_limit": 3, "neighbors_per_seed": 4,
                      "graph_weight": 0.55, "min_strength": 0.35},
}


@pytest.fixture
def bench_db():
    """DB with realistic-ish atoms for benchmarking."""
    import tempfile, os
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    db = DB(path)

    # Create atoms across domains with some overlap
    db.create_atom("Python web framework Django", body="Django is a Python web framework", domain="tech", tags=["python", "web"])
    db.create_atom("Python web framework Flask", body="Flask is a lightweight Python web framework", domain="tech", tags=["python", "web"])
    db.create_atom("Python data analysis pandas", body="pandas is a Python data analysis library", domain="tech", tags=["python", "data"])
    db.create_atom("Rust systems programming memory safety", body="Rust provides memory safety without garbage collection", domain="tech", tags=["rust", "systems"])
    db.create_atom("Docker container deployment", body="Docker packages applications into containers", domain="devops", tags=["docker", "deploy"])
    db.create_atom("Kubernetes orchestration clusters", body="Kubernetes orchestrates containerized applications", domain="devops", tags=["k8s", "deploy"])
    db.create_atom("Home Assistant smart home automation", body="Home Assistant is an open source home automation platform", domain="smarthome", tags=["ha", "automation"])

    # Bonds for graph expansion
    db.create_bond("python_web_framework_django", "python_web_framework_flask", "related_to", 0.8)
    db.create_bond("docker_container_deployment", "kubernetes_orchestration_clusters", "related_to", 0.7)

    yield path
    os.unlink(path)


# ════════════════════════════════════════════════════════════
# METRIC COMPUTATION
# ════════════════════════════════════════════════════════════

class TestComputeMetrics:
    def test_perfect_match(self):
        results = [{"id": "a"}, {"id": "b"}, {"id": "c"}]
        expected = ["a", "b", "c"]
        m = compute_metrics(results, expected, limit=3)
        assert m["precision_at_k"] == 1.0
        assert m["recall"] == 1.0
        assert m["mrr"] == 1.0
        assert m["hits"] == 3

    def test_no_match(self):
        results = [{"id": "x"}, {"id": "y"}]
        expected = ["a", "b"]
        m = compute_metrics(results, expected, limit=2)
        assert m["precision_at_k"] == 0.0
        assert m["recall"] == 0.0
        assert m["mrr"] == 0.0
        assert m["hits"] == 0

    def test_partial_match(self):
        results = [{"id": "a"}, {"id": "x"}, {"id": "b"}]
        expected = ["a", "b", "c"]
        m = compute_metrics(results, expected, limit=3)
        assert m["precision_at_k"] == pytest.approx(2/3, abs=0.01)
        assert m["recall"] == pytest.approx(2/3, abs=0.01)
        assert m["mrr"] == 1.0  # first result is relevant

    def test_mrr_second_position(self):
        results = [{"id": "x"}, {"id": "a"}]
        expected = ["a"]
        m = compute_metrics(results, expected, limit=2)
        assert m["mrr"] == 0.5

    def test_empty_results(self):
        m = compute_metrics([], ["a"], limit=5)
        assert m["precision_at_k"] == 0.0
        assert m["mrr"] == 0.0

    def test_empty_expected(self):
        m = compute_metrics([{"id": "a"}], [], limit=5)
        assert m["recall"] == 0.0  # can't divide by zero → 0


# ════════════════════════════════════════════════════════════
# QUERY GENERATION
# ════════════════════════════════════════════════════════════

class TestQueryGeneration:
    def test_generates_queries(self, bench_db):
        db = DB(bench_db)
        queries = generate_queries_from_atoms(db, n=5)
        assert len(queries) > 0
        for q in queries:
            assert "query" in q
            assert "expected_ids" in q
            assert len(q["expected_ids"]) > 0
            assert "domain" in q

    def test_queries_have_realistic_text(self, bench_db):
        db = DB(bench_db)
        queries = generate_queries_from_atoms(db, n=5)
        for q in queries:
            # Query should not be empty and should have meaningful words
            assert len(q["query"]) > 3
            assert len(q["query"].split()) >= 1


# ════════════════════════════════════════════════════════════
# BENCHMARK RECALL
# ════════════════════════════════════════════════════════════

class TestBenchmarkRecall:
    def test_benchmark_runs(self, bench_db):
        db = DB(bench_db)
        engine = Engine(db, CONFIG)
        queries = [
            {"query": "Python framework", "expected_ids": ["python_web_framework_django", "python_web_framework_flask"], "domain": "tech"},
            {"query": "container deployment", "expected_ids": ["docker_container_deployment", "kubernetes_orchestration_clusters"], "domain": "devops"},
        ]
        results = benchmark_recall(db, engine, queries, limit=5)
        assert "aggregate" in results
        assert results["aggregate"]["query_count"] == 2
        assert "avg_precision" in results["aggregate"]
        assert "avg_latency_ms" in results["aggregate"]
        assert len(results["per_query"]) == 2

    def test_benchmark_records_latency(self, bench_db):
        db = DB(bench_db)
        engine = Engine(db, CONFIG)
        queries = [{"query": "Python", "expected_ids": ["python_web_framework_django"], "domain": "tech"}]
        results = benchmark_recall(db, engine, queries, limit=5)
        assert results["per_query"][0]["latency_ms"] > 0
        assert results["aggregate"]["avg_latency_ms"] > 0


# ════════════════════════════════════════════════════════════
# REPORT FORMATTING
# ════════════════════════════════════════════════════════════

class TestReportFormatting:
    def test_markdown_output(self):
        results = {
            "recall": {
                "aggregate": {"query_count": 10, "avg_precision": 0.75, "avg_recall": 0.6,
                              "avg_mrr": 0.8, "zero_hit_queries": 1,
                              "avg_latency_ms": 5.2, "p50_latency_ms": 4.0,
                              "p95_latency_ms": 12.0, "min_latency_ms": 2.0,
                              "max_latency_ms": 15.0},
                "per_query": [{"query": "test query", "domain": "tech", "expected_count": 3,
                                "hits": 2, "precision": 0.67, "mrr": 1.0, "latency_ms": 5.0}],
            },
            "graph_expansion": {"queries_tested": 10, "relevant_atoms_added_by_graph": 5,
                                 "queries_benefited": 3, "avg_relevant_added_per_query": 0.5},
        }
        md = format_report_md(results)
        assert "Benchmark Report" in md
        assert "Precision" in md
        assert "Latency" in md
        assert "Graph Expansion" in md
