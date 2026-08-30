"""
Tests for DB migrations — old schema → new schema, idempotency.
Simulates upgrading from pre-1.6.0 databases.
"""
import pytest
import sqlite3
import json
import time
from pathlib import Path
from db import DB


def _make_old_schema_v1(db_path):
    """Create a pre-1.6.0 schema (no memory_tier, no contradictions table, old FTS trigger)."""
    c = sqlite3.connect(db_path)
    c.executescript("""
        CREATE TABLE atoms (
            id            TEXT PRIMARY KEY,
            type          TEXT NOT NULL DEFAULT 'fact',
            domain        TEXT NOT NULL DEFAULT 'general',
            title         TEXT NOT NULL,
            body          TEXT,
            body_compact  TEXT,
            confidence    REAL NOT NULL DEFAULT 0.5,
            weight        REAL NOT NULL DEFAULT 1.0,
            status        TEXT NOT NULL DEFAULT 'active',
            source        TEXT DEFAULT 'ai',
            source_path   TEXT,
            created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
            updated_at    INTEGER NOT NULL DEFAULT (unixepoch()),
            accessed_at   INTEGER NOT NULL DEFAULT (unixepoch()),
            access_count  INTEGER NOT NULL DEFAULT 0,
            ttl           INTEGER,
            tags          TEXT DEFAULT '[]',
            meta          TEXT DEFAULT '{}'
        );
        CREATE TABLE bonds (
            from_id TEXT NOT NULL, to_id TEXT NOT NULL, relation TEXT NOT NULL,
            strength REAL DEFAULT 0.5, evidence TEXT,
            created_at INTEGER NOT NULL DEFAULT (unixepoch()),
            PRIMARY KEY (from_id, to_id, relation)
        );
        CREATE TABLE atom_versions (
            atom_id TEXT NOT NULL, version INTEGER NOT NULL,
            title TEXT, body TEXT,
            changed_at INTEGER NOT NULL DEFAULT (unixepoch()),
            changed_by TEXT DEFAULT 'ai', change_reason TEXT,
            PRIMARY KEY (atom_id, version)
        );
        CREATE TABLE human_questions (
            id TEXT PRIMARY KEY, atom_ids TEXT NOT NULL,
            question_type TEXT NOT NULL, question TEXT NOT NULL,
            options TEXT, status TEXT DEFAULT 'pending', answer TEXT,
            created_at INTEGER NOT NULL DEFAULT (unixepoch()),
            answered_at INTEGER, meta TEXT DEFAULT '{}'
        );
        CREATE VIRTUAL TABLE atoms_fts USING fts5(
            title, body, tags, content='atoms', content_rowid='rowid',
            tokenize='porter unicode61'
        );
        -- OLD trigger (updates FTS on ANY column change, not just title/body/tags)
        CREATE TRIGGER atoms_fts_au AFTER UPDATE ON atoms BEGIN
            INSERT INTO atoms_fts(atoms_fts, rowid, title, body, tags)
            VALUES ('delete', old.rowid, old.title, COALESCE(old.body, ''), old.tags);
            INSERT INTO atoms_fts(rowid, title, body, tags)
            VALUES (new.rowid, new.title, COALESCE(new.body, ''), new.tags);
        END;
        CREATE TRIGGER atoms_fts_ai AFTER INSERT ON atoms BEGIN
            INSERT INTO atoms_fts(rowid, title, body, tags)
            VALUES (new.rowid, new.title, COALESCE(new.body, ''), new.tags);
        END;
        CREATE TRIGGER atoms_fts_ad AFTER DELETE ON atoms BEGIN
            INSERT INTO atoms_fts(atoms_fts, rowid, title, body, tags)
            VALUES ('delete', old.rowid, old.title, COALESCE(old.body, ''), old.tags);
        END;
    """)
    # Insert some old data
    now = int(time.time())
    c.execute(
        "INSERT INTO atoms (id, type, domain, title, body, confidence, weight, "
        "tags, meta, created_at, updated_at, accessed_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ("old_atom_1", "fact", "test", "Old Fact", "Pre-migration data", 0.8, 1.0,
         json.dumps(["legacy"]), json.dumps({}), now, now, now)
    )
    c.execute(
        "INSERT INTO atom_versions (atom_id, version, title, body) VALUES (?, ?, ?, ?)",
        ("old_atom_1", 1, "Old Fact", "Pre-migration data")
    )
    c.commit()
    c.close()


class TestMigrations:
    def test_migrate_adds_memory_tier(self, tmp_path):
        """Migration should add memory_tier column to old atoms table."""
        db_path = str(tmp_path / "old.db")
        _make_old_schema_v1(db_path)
        # Open with DB class — triggers _init_db + _migrate
        db = DB(db_path)
        atom = db.get_atom("old_atom_1")
        assert atom is not None
        assert atom["memory_tier"] == "semantic"  # default backfill

    def test_migrate_adds_contradictions_table(self, tmp_path):
        """Migration should create memory_contradictions table."""
        db_path = str(tmp_path / "old.db")
        _make_old_schema_v1(db_path)
        db = DB(db_path)
        with db.conn() as c:
            tables = [r[0] for r in c.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            ).fetchall()]
        assert "memory_contradictions" in tables

    def test_migrate_recreates_fts_trigger(self, tmp_path):
        """Migration should recreate the FTS update trigger to only fire on title/body/tags."""
        db_path = str(tmp_path / "old.db")
        _make_old_schema_v1(db_path)
        db = DB(db_path)
        with db.conn() as c:
            sql = c.execute(
                "SELECT sql FROM sqlite_master WHERE type='trigger' AND name='atoms_fts_au'"
            ).fetchone()
        assert sql is not None
        trigger_sql = sql[0]
        # New trigger should be "AFTER UPDATE OF title, body, tags"
        assert "OF title, body, tags" in trigger_sql

    def test_migration_preserves_data(self, tmp_path):
        """Migration should not lose existing atoms."""
        db_path = str(tmp_path / "old.db")
        _make_old_schema_v1(db_path)
        db = DB(db_path)
        atom = db.get_atom("old_atom_1")
        assert atom["title"] == "Old Fact"
        assert atom["body"] == "Pre-migration data"
        assert atom["confidence"] == 0.8
        # get_atom returns tags already parsed as list
        assert atom["tags"] == ["legacy"]

    def test_migration_preserves_fts(self, tmp_path):
        """FTS should still work after migration."""
        db_path = str(tmp_path / "old.db")
        _make_old_schema_v1(db_path)
        db = DB(db_path)
        results = db.search_fts("Pre-migration")
        assert len(results) >= 1
        assert results[0]["id"] == "old_atom_1"

    def test_migration_idempotent(self, tmp_path):
        """Running migration twice should not error."""
        db_path = str(tmp_path / "old.db")
        _make_old_schema_v1(db_path)
        db1 = DB(db_path)
        db1._migrate()  # Run again — should be no-op
        atom = db1.get_atom("old_atom_1")
        assert atom is not None

    def test_fresh_db_has_all_tables(self, tmp_path):
        """A brand-new DB should have all tables from schema.sql."""
        db_path = str(tmp_path / "fresh.db")
        db = DB(db_path)
        with db.conn() as c:
            tables = [r[0] for r in c.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            ).fetchall()]
        for expected in ["atoms", "bonds", "atom_versions", "human_questions",
                         "memory_contradictions", "error_memory", "atom_embeddings",
                         "session_offsets", "session_cursors"]:
            assert expected in tables, f"Missing table: {expected}"

    def test_fresh_db_has_fts(self, tmp_path):
        db_path = str(tmp_path / "fresh.db")
        db = DB(db_path)
        with db.conn() as c:
            tables = [r[0] for r in c.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            ).fetchall()]
        assert "atoms_fts" in tables
