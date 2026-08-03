"""
Tests for db.py — CRUD, bonds, merge, decay, errors, contradictions, migrations.
"""
import pytest
import time
import json
from db import DB


# ════════════════════════════════════════════════════════════
# ATOM CRUD
# ════════════════════════════════════════════════════════════

class TestCreateAtom:
    def test_basic_create(self, db):
        a = db.create_atom("Test fact", "Some body text", type="fact", domain="test")
        assert a is not None
        assert a["title"] == "Test fact"
        assert a["body"] == "Some body text"
        assert a["type"] == "fact"
        assert a["domain"] == "test"
        assert a["confidence"] == 0.5
        assert a["status"] == "active"
        assert a["weight"] == 1.0

    def test_slug_id(self, db):
        a = db.create_atom("Hello World Example")
        assert a["id"] == "hello_world_example"

    def test_custom_id(self, db):
        a = db.create_atom("Custom", atom_id="my_custom_id")
        assert a["id"] == "my_custom_id"

    def test_confidence_bounds(self, db):
        a = db.create_atom("High conf", confidence=1.0)
        assert a["confidence"] == 1.0
        a2 = db.create_atom("Low conf", confidence=0.0)
        assert a2["confidence"] == 0.0

    def test_tags_stored_as_json(self, db):
        a = db.create_atom("Tagged", tags=["alpha", "beta"])
        fetched = db.get_atom(a["id"])
        # get_atom returns tags already parsed as list
        assert fetched["tags"] == ["alpha", "beta"]

    def test_meta_stored_as_json(self, db):
        a = db.create_atom("Meta'd", meta={"key": "value", "num": 42})
        fetched = db.get_atom(a["id"])
        # get_atom returns meta already parsed as dict
        assert fetched["meta"]["key"] == "value"

    def test_memory_tier_inferred(self, db):
        a = db.create_atom("A fact", type="fact")
        assert a["memory_tier"] == "semantic"
        e = db.create_atom("An event", type="event")
        assert e["memory_tier"] == "episodic"
        p = db.create_atom("A procedure", type="procedure")
        assert p["memory_tier"] == "procedural"

    def test_memory_tier_explicit(self, db):
        a = db.create_atom("Override tier", type="fact", memory_tier="episodic")
        assert a["memory_tier"] == "episodic"

    def test_duplicate_id_does_not_crash(self, db):
        """Creating with same slug should not crash (may create variant id)."""
        a1 = db.create_atom("Same Title", "v1")
        a2 = db.create_atom("Same Title", "v2")
        # Both should exist as separate atoms
        assert db.get_atom(a1["id"]) is not None
        assert db.get_atom(a2["id"]) is not None


class TestGetAtom:
    def test_get_existing(self, db):
        a = db.create_atom("Find me")
        fetched = db.get_atom(a["id"])
        assert fetched["title"] == "Find me"

    def test_get_nonexistent(self, db):
        assert db.get_atom("does_not_exist") is None

    def test_get_bumps_access_count(self, db):
        a = db.create_atom("Accessed")
        db.get_atom(a["id"])
        db.get_atom(a["id"])
        fetched = db.get_atom(a["id"])
        assert fetched["access_count"] >= 2


class TestDeleteAtom:
    def test_delete_existing(self, db):
        a = db.create_atom("Delete me")
        assert db.delete_atom(a["id"]) is True
        assert db.get_atom(a["id"]) is None

    def test_delete_nonexistent(self, db):
        assert db.delete_atom("ghost") is False

    def test_delete_cascades_bonds(self, db):
        a = db.create_atom("A")
        b = db.create_atom("B")
        db.create_bond(a["id"], b["id"], "related_to")
        db.delete_atom(a["id"])
        bonds = db.get_bonds(b["id"])
        assert len(bonds) == 0


class TestListAtoms:
    def test_list_by_domain(self, db):
        db.create_atom("D1", domain="alpha")
        db.create_atom("D2", domain="beta")
        db.create_atom("D3", domain="alpha")
        result = db.list_atoms(domain="alpha")
        assert len(result) == 2

    def test_list_by_type(self, db):
        db.create_atom("F1", type="fact")
        db.create_atom("D1", type="decision")
        result = db.list_atoms(type="decision")
        assert len(result) == 1

    def test_list_limit(self, db):
        for i in range(10):
            db.create_atom(f"Item {i}")
        result = db.list_atoms(limit=5)
        assert len(result) == 5


# ════════════════════════════════════════════════════════════
# BONDS
# ════════════════════════════════════════════════════════════

class TestBonds:
    def test_create_and_get(self, db):
        a = db.create_atom("A")
        b = db.create_atom("B")
        db.create_bond(a["id"], b["id"], "related_to", strength=0.8)
        bonds = db.get_bonds(a["id"])
        assert len(bonds) == 1
        assert bonds[0]["relation"] == "related_to"
        assert bonds[0]["strength"] == 0.8

    def test_delete_bond(self, db):
        a = db.create_atom("A")
        b = db.create_atom("B")
        db.create_bond(a["id"], b["id"], "depends_on")
        assert db.delete_bond(a["id"], b["id"], "depends_on") is True
        assert len(db.get_bonds(a["id"])) == 0

    def test_duplicate_bond_replaces(self, db):
        """Insert OR REPLACE — same (from, to, relation) updates strength."""
        a = db.create_atom("A")
        b = db.create_atom("B")
        db.create_bond(a["id"], b["id"], "related_to", strength=0.3)
        db.create_bond(a["id"], b["id"], "related_to", strength=0.9)
        bonds = db.get_bonds(a["id"])
        assert len(bonds) == 1
        assert bonds[0]["strength"] == 0.9

    def test_bidirectional(self, db):
        a = db.create_atom("Parent")
        b = db.create_atom("Child")
        db.create_bond(a["id"], b["id"], "is_a")
        outgoing = db.get_bonds(a["id"], direction="out")
        incoming = db.get_bonds(b["id"], direction="in")
        assert len(outgoing) == 1
        assert len(incoming) == 1


class TestSearchGraph:
    def test_graph_traversal(self, db):
        a = db.create_atom("Root")
        b = db.create_atom("Level1")
        c = db.create_atom("Level2")
        db.create_bond(a["id"], b["id"], "related_to")
        db.create_bond(b["id"], c["id"], "related_to")
        result = db.search_graph(a["id"], depth=2)
        assert "nodes" in result
        ids = [n["id"] for n in result["nodes"]]
        assert a["id"] in ids
        assert b["id"] in ids
        assert c["id"] in ids

    def test_graph_nonexistent_root(self, db):
        result = db.search_graph("ghost", depth=2)
        assert "nodes" in result
        assert len(result["nodes"]) == 0


# ════════════════════════════════════════════════════════════
# MERGE
# ════════════════════════════════════════════════════════════

class TestMerge:
    def test_merge_basic(self, db):
        primary = db.create_atom("Primary", body="Keep this")
        secondary = db.create_atom("Secondary", body="Merge this")
        db.create_bond(secondary["id"], primary["id"], "related_to")
        result = db.merge_atoms(primary["id"], secondary["id"])
        # merge_atoms returns the updated primary atom
        assert result["id"] == primary["id"]
        # Secondary should be marked merged
        sec = db.get_atom(secondary["id"])
        assert sec["status"] == "merged"
        # Primary should still be active
        pri = db.get_atom(primary["id"])
        assert pri["status"] == "active"

    def test_merge_nonexistent(self, db):
        with pytest.raises(KeyError):
            db.merge_atoms("ghost1", "ghost2")


# ════════════════════════════════════════════════════════════
# DECAY
# ════════════════════════════════════════════════════════════

class TestDecay:
    def test_decay_recent_noop(self, db):
        """Recently accessed atoms should not decay."""
        a = db.create_atom("Recent")
        # accessed_at is set to now in create_atom
        count = db.run_decay(interval_days=30, factor=0.95)
        assert count == 0
        fetched = db.get_atom(a["id"])
        assert fetched["weight"] == 1.0

    def test_decay_old_atoms(self, db):
        """Atoms not accessed in N days should have reduced weight."""
        a = db.create_atom("Old atom")
        # Manually backdate accessed_at to simulate old access
        old_time = int(time.time()) - (60 * 86400)  # 60 days ago
        with db.conn() as c:
            c.execute("UPDATE atoms SET accessed_at = ? WHERE id = ?", (old_time, a["id"]))
        count = db.run_decay(interval_days=30, factor=0.5)
        assert count == 1
        fetched = db.get_atom(a["id"])
        assert fetched["weight"] == 0.5

    def test_decay_respects_min_weight(self, db):
        """Atoms below 0.01 weight should not decay further."""
        a = db.create_atom("Tiny weight")
        old_time = int(time.time()) - (60 * 86400)
        with db.conn() as c:
            c.execute("UPDATE atoms SET accessed_at = ?, weight = ? WHERE id = ?",
                      (old_time, 0.005, a["id"]))
        count = db.run_decay(interval_days=30, factor=0.5)
        assert count == 0

    def test_decay_skips_non_active(self, db):
        """Archived/superseded atoms should not decay."""
        a = db.create_atom("Archived")
        old_time = int(time.time()) - (60 * 86400)
        with db.conn() as c:
            c.execute("UPDATE atoms SET accessed_at = ?, status = 'archived' WHERE id = ?",
                      (old_time, a["id"]))
        count = db.run_decay(interval_days=30, factor=0.5)
        assert count == 0


# ════════════════════════════════════════════════════════════
# ERROR MEMORY
# ════════════════════════════════════════════════════════════

class TestErrorMemory:
    def test_log_new_error(self, db):
        result = db.log_error("compilation", "logic_error", "Wrong import", "Use correct import")
        assert result["task_type"] == "compilation"
        assert result["occurrence_count"] == 1

    def test_log_duplicate_increments(self, db):
        db.log_error("compilation", "logic_error", "Wrong import", "Use correct import")
        result = db.log_error("compilation", "logic_error", "Wrong import", "Use correct import")
        assert result["occurrence_count"] == 2

    def test_log_triple_promotes(self, db):
        for _ in range(3):
            result = db.log_error("deploy", "omission", "Forgot env var", "Set ENV")
        assert result["upgraded_to_preference"] is True

    def test_check_errors_finds_match(self, db):
        db.log_error("compilation", "logic_error", "Missing semicolon", "Add semicolon")
        results = db.check_errors("compilation problem")
        assert len(results) >= 1

    def test_check_errors_no_match(self, db):
        db.log_error("compilation", "logic_error", "Missing semicolon", "Add semicolon")
        results = db.check_errors("cooking recipe")
        assert len(results) == 0

    def test_list_errors_filter(self, db):
        db.log_error("task1", "error1", "Mistake 1", "Fix 1")
        db.log_error("task2", "error2", "Mistake 2", "Fix 2")
        db.resolve_error(db.log_error("task3", "error3", "Mistake 3", "Fix 3")["id"])
        unresolved = db.list_errors(resolved=False)
        resolved = db.list_errors(resolved=True)
        assert len(unresolved) == 2
        assert len(resolved) == 1

    def test_resolve_error(self, db):
        err = db.log_error("deploy", "omission", "Forgot step", "Add step")
        result = db.resolve_error(err["id"])
        assert result["is_resolved"] == 1


# ════════════════════════════════════════════════════════════
# CONTRADICTIONS
# ════════════════════════════════════════════════════════════

class TestContradictions:
    def test_create_contradiction(self, db):
        old = db.create_atom("Old fact", body="The Earth is flat")
        result = db.create_contradiction(
            old["id"],
            title="New fact: Earth is round",
            body="The Earth is an oblate spheroid",
            reason="Scientific correction",
        )
        assert result is not None
        assert result["old_atom_id"] == old["id"]
        # Old atom should be superseded
        old_fetched = db.get_atom(old["id"])
        assert old_fetched["status"] == "superseded"
        # New atom should be active
        new_fetched = db.get_atom(result["new_atom_id"])
        assert new_fetched["status"] == "active"

    def test_contradiction_creates_bonds(self, db):
        old = db.create_atom("Old")
        result = db.create_contradiction(old["id"], title="New")
        bonds = db.get_bonds(result["new_atom_id"])
        relations = [b["relation"] for b in bonds]
        assert "contradicts" in relations
        assert "supersedes" in relations

    def test_contradiction_nonexistent_old(self, db):
        with pytest.raises(KeyError):
            db.create_contradiction("ghost", title="New")

    def test_list_contradictions(self, db):
        old = db.create_atom("Old1")
        db.create_contradiction(old["id"], title="New1")
        result = db.list_contradictions()
        assert len(result) >= 1


# ════════════════════════════════════════════════════════════
# FTS SEARCH
# ════════════════════════════════════════════════════════════

class TestFTS:
    def test_search_finds_match(self, db_with_atoms):
        results = db_with_atoms.search_fts("Python")
        assert len(results) >= 1
        titles = [r["title"] for r in results]
        assert any("Python" in t for t in titles)

    def test_search_no_match(self, db_with_atoms):
        results = db_with_atoms.search_fts("quantumxyz")
        assert len(results) == 0

    def test_search_body_content(self, db_with_atoms):
        results = db_with_atoms.search_fts("containers")
        assert len(results) >= 1
