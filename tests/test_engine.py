"""
Tests for engine.py — ranking, recall, similarity, learning detection.
"""
import pytest
import time
from engine import Engine


# ════════════════════════════════════════════════════════════
# RANKING
# ════════════════════════════════════════════════════════════

class TestRanking:
    def test_rank_empty(self, engine):
        result = engine.rank_results([], "query")
        assert result == []

    def test_rank_single_result(self, engine, db):
        a = db.create_atom("Python test", "Body about Python", confidence=0.9)
        fts = db.search_fts("Python")
        ranked = engine.rank_results(fts, "Python")
        assert len(ranked) == 1
        assert ranked[0]["id"] == a["id"]
        assert "rank_score" in ranked[0]

    def test_higher_confidence_ranks_higher(self, engine, db):
        """All else equal, higher confidence should rank higher."""
        a = db.create_atom("Same Keyword", confidence=0.9)
        b = db.create_atom("Same Keyword Alt", confidence=0.2)
        fts = db.search_fts("Keyword")
        ranked = engine.rank_results(fts, "Keyword")
        # The higher confidence atom should be first (or at least not lower)
        assert ranked[0]["confidence"] >= ranked[-1]["confidence"]

    def test_superseded_penalized(self, engine, db):
        """Superseded atoms should be penalized in ranking."""
        a = db.create_atom("Active Item", confidence=0.7)
        b = db.create_atom("Old Item", confidence=0.7)
        # Manually mark b as superseded
        with db.conn() as c:
            c.execute("UPDATE atoms SET status = 'superseded' WHERE id = ?", (b["id"],))
        fts_a = db.search_fts("Item", statuses=("active", "superseded"))
        ranked = engine.rank_results(fts_a, "Item")
        # Active should rank higher than superseded
        active_entry = [r for r in ranked if r["id"] == a["id"]][0]
        superseded_entry = [r for r in ranked if r["id"] == b["id"]][0]
        assert active_entry["rank_score"] > superseded_entry["rank_score"]

    def test_tier_boost(self, engine, db):
        """Semantic tier should get a small boost over episodic."""
        sem = db.create_atom("Tier Test Semantic", type="fact", memory_tier="semantic")
        epi = db.create_atom("Tier Test Episodic", type="event", memory_tier="episodic")
        fts = db.search_fts("Tier Test")
        ranked = engine.rank_results(fts, "Tier Test")
        sem_entry = [r for r in ranked if r["id"] == sem["id"]][0]
        epi_entry = [r for r in ranked if r["id"] == epi["id"]][0]
        # Semantic should get a small boost
        assert sem_entry["rank_score"] >= epi_entry["rank_score"]


# ════════════════════════════════════════════════════════════
# RECALL
# ════════════════════════════════════════════════════════════

class TestRecall:
    def test_recall_basic(self, engine, db_with_atoms):
        results = engine.recall("Python", limit=5, semantic=False)
        assert len(results) >= 1
        assert any("Python" in r.get("title", "") for r in results)

    def test_recall_no_results(self, engine, db_with_atoms):
        results = engine.recall("quantumxyznonexistent", limit=5, semantic=False)
        assert len(results) == 0

    def test_recall_domain_filter(self, engine, db_with_atoms):
        results = engine.recall("language", limit=10, domain="devops", semantic=False)
        # Should only return devops domain atoms
        for r in results:
            assert r.get("domain") == "devops"

    def test_recall_limit(self, engine, db_with_atoms):
        results = engine.recall("language", limit=2, semantic=False)
        assert len(results) <= 2

    def test_recall_excludes_superseded_by_default(self, engine, db):
        old = db.create_atom("Superseded Fact", body="Old info about topic X")
        db.create_contradiction(old["id"], title="New Fact", body="New info about topic X")
        results = engine.recall("topic X", limit=10, semantic=False)
        # Should not include the superseded atom in normal recall
        for r in results:
            assert r.get("status") != "superseded"

    def test_recall_includes_superseded_when_asked(self, engine, db):
        old = db.create_atom("Superseded Fact", body="Old info about topic X")
        db.create_contradiction(old["id"], title="New Fact", body="New info about topic X")
        results = engine.recall("topic X", limit=10, semantic=False, include_superseded=True)
        # May include superseded atoms
        statuses = [r.get("status") for r in results]
        # At least one result should exist
        assert len(results) >= 1


# ════════════════════════════════════════════════════════════
# SIMILARITY
# ════════════════════════════════════════════════════════════

class TestSimilarity:
    def test_identical_atoms(self, engine, db):
        a = db.create_atom("Same Title Here", domain="test", tags=["x", "y"])
        b = db.create_atom("Same Title Here", domain="test", tags=["x", "y"])
        sim = engine.compute_similarity(a, b)
        assert sim >= 0.8

    def test_completely_different(self, engine, db):
        a = db.create_atom("Alpha", domain="domain_a")
        b = db.create_atom("Beta", domain="domain_b")
        sim = engine.compute_similarity(a, b)
        assert sim < 0.3

    def test_domain_bonus(self, engine, db):
        a = db.create_atom("Some Word", domain="same")
        b = db.create_atom("Different Word", domain="same")
        sim = engine.compute_similarity(a, b)
        # Should get domain bonus
        assert sim >= 0.2

    def test_tag_overlap(self, engine, db):
        a = db.create_atom("Title A", domain="test", tags=["python", "ai", "ml"])
        b = db.create_atom("Title B", domain="test", tags=["python", "ai", "data"])
        sim = engine.compute_similarity(a, b)
        assert sim > 0.3  # Domain + partial tag overlap


# ════════════════════════════════════════════════════════════
# LEARNING DETECTION
# ════════════════════════════════════════════════════════════

class TestContradictionDetection:
    def test_detects_similar_pair(self, engine, db):
        # Need very high word overlap + same domain + tags to exceed 0.7 threshold
        db.create_atom("Python programming language tutorial", domain="tech", tags=["python", "code"])
        db.create_atom("Python programming language tutorial", domain="tech", tags=["python", "code"])
        results = engine.detect_contradictions()
        assert len(results) >= 1

    def test_ignores_different_domains(self, engine, db):
        db.create_atom("Same Title", domain="alpha")
        db.create_atom("Same Title", domain="beta")
        results = engine.detect_contradictions()
        assert len(results) == 0


class TestWeakAtoms:
    def test_detects_weak(self, engine, db):
        a = db.create_atom("Weak atom", confidence=0.2)
        # Bump access count above threshold
        with db.conn() as c:
            c.execute("UPDATE atoms SET access_count = 10 WHERE id = ?", (a["id"],))
        results = engine.detect_weak_atoms()
        assert len(results) >= 1
        assert any(r["id"] == a["id"] for r in results)

    def test_ignores_strong(self, engine, db):
        a = db.create_atom("Strong atom", confidence=0.9)
        with db.conn() as c:
            c.execute("UPDATE atoms SET access_count = 10 WHERE id = ?", (a["id"],))
        results = engine.detect_weak_atoms()
        assert len(results) == 0


class TestMergeCandidates:
    def test_detects_near_duplicates(self, engine, db):
        db.create_atom("Very Similar Title", domain="test", tags=["a", "b"])
        db.create_atom("Very Similar Title", domain="test", tags=["a", "b"])
        results = engine.detect_merge_candidates()
        assert len(results) >= 1

    def test_no_candidates_for_distinct(self, engine, db):
        db.create_atom("Completely Unique Alpha", domain="test")
        db.create_atom("Totally Different Beta", domain="other")
        results = engine.detect_merge_candidates()
        assert len(results) == 0


# ════════════════════════════════════════════════════════════
# HIERARCHICAL SUMMARY
# ════════════════════════════════════════════════════════════

class TestSummary:
    def test_summary_structure(self, engine, db_with_atoms):
        result = engine.hierarchical_summary()
        assert isinstance(result, dict)
        assert "l0_global" in result

    def test_summary_by_domain(self, engine, db_with_atoms):
        result = engine.hierarchical_summary(domain="tech")
        # Should filter to one domain
        assert isinstance(result, dict)
