"""
Tests for backup.py — backup, restore, export, import, verify.
"""
import pytest
import json
import os
import time
import sqlite3
import tempfile
from pathlib import Path
from db import DB
from backup import (
    create_backup,
    restore_backup,
    verify_backup,
    export_json,
    import_json,
    list_backups,
    cleanup_old_backups,
)


@pytest.fixture
def populated_db():
    """DB with some atoms, bonds, and errors for backup testing."""
    import tempfile, os, shutil
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    db = DB(path)
    
    # Create atoms
    a1 = db.create_atom("Alpha", body="First atom", domain="test", tags=["x"])
    a2 = db.create_atom("Beta", body="Second atom", domain="test", tags=["y"])
    a3 = db.create_atom("Gamma", body="Third atom", domain="other")
    
    # Create bond
    db.create_bond(a1["id"], a2["id"], "related_to", strength=0.8)
    
    # Log an error
    db.log_error("deploy", "omission", "Forgot step", "Add step")
    
    # Create a contradiction
    db.create_contradiction(a3["id"], title="Gamma corrected", body="New info")
    
    yield path
    
    # Cleanup DB and any backups created during tests
    os.unlink(path)
    bdir = Path(path).parent / "backups"
    if bdir.exists():
        shutil.rmtree(bdir)
    sdir = Path(path).parent / "safety_backups"
    if sdir.exists():
        shutil.rmtree(sdir)


# ════════════════════════════════════════════════════════════
# BACKUP
# ════════════════════════════════════════════════════════════

class TestCreateBackup:
    def test_creates_backup_file(self, populated_db):
        result = create_backup(populated_db)
        assert os.path.exists(result["path"])
        assert result["size_bytes"] > 0
        assert "timestamp" in result
        os.unlink(result["path"])

    def test_backup_in_custom_dir(self, populated_db, tmp_path):
        dest = str(tmp_path / "custom_backups")
        result = create_backup(populated_db, dest_dir=dest)
        assert os.path.exists(result["path"])
        assert "custom_backups" in result["path"]
        os.unlink(result["path"])

    def test_backup_is_valid_sqlite(self, populated_db):
        result = create_backup(populated_db)
        # Should be openable as SQLite
        conn = sqlite3.connect(result["path"])
        tables = [r[0] for r in conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table'"
        ).fetchall()]
        conn.close()
        assert "atoms" in tables
        os.unlink(result["path"])

    def test_backup_nonexistent_db(self):
        with pytest.raises(FileNotFoundError):
            create_backup("/nonexistent/path.db")


# ════════════════════════════════════════════════════════════
# VERIFY
# ════════════════════════════════════════════════════════════

class TestVerifyBackup:
    def test_verify_valid_backup(self, populated_db):
        bkp = create_backup(populated_db)
        result = verify_backup(bkp["path"])
        assert result["valid"] is True
        assert result["missing_tables"] == []
        assert result["has_fts"] is True
        assert "atoms" in result["row_counts"]
        assert result["row_counts"]["atoms"] >= 3
        os.unlink(bkp["path"])

    def test_verify_incomplete_db(self, tmp_path):
        """A DB missing tables should fail verification."""
        bad = str(tmp_path / "bad.db")
        conn = sqlite3.connect(bad)
        conn.execute("CREATE TABLE atoms (id TEXT)")
        conn.commit()
        conn.close()
        result = verify_backup(bad)
        assert result["valid"] is False
        assert len(result["missing_tables"]) > 0


# ════════════════════════════════════════════════════════════
# RESTORE
# ════════════════════════════════════════════════════════════

class TestRestoreBackup:
    def test_restore_overwrites_db(self, populated_db):
        bkp = create_backup(populated_db)
        
        # Modify the DB after backup
        db = DB(populated_db)
        db.create_atom("Extra", body="After backup")
        
        # Restore
        result = restore_backup(populated_db, bkp["path"])
        assert "restored_from" in result
        
        # The extra atom should be gone
        restored_db = DB(populated_db)
        atoms = restored_db.list_atoms(limit=100)
        titles = [a["title"] for a in atoms]
        assert "Extra" not in titles
        assert "Alpha" in titles
        
        # Cleanup
        os.unlink(bkp["path"])
        if result.get("safety_backup"):
            os.unlink(result["safety_backup"]["path"])

    def test_restore_creates_safety_backup(self, populated_db):
        bkp = create_backup(populated_db)
        result = restore_backup(populated_db, bkp["path"])
        assert result["safety_backup"] is not None
        safety_path = result["safety_backup"]["path"]
        assert os.path.exists(safety_path)
        # Cleanup safety backup
        if os.path.exists(safety_path):
            os.unlink(safety_path)

    def test_restore_rejects_invalid_backup(self, populated_db, tmp_path):
        bad = str(tmp_path / "bad.db")
        conn = sqlite3.connect(bad)
        conn.execute("CREATE TABLE foo (id TEXT)")
        conn.commit()
        conn.close()
        with pytest.raises(ValueError, match="missing tables"):
            restore_backup(populated_db, bad)

    def test_restore_nonexistent_backup(self, populated_db):
        with pytest.raises(FileNotFoundError):
            restore_backup(populated_db, "/nonexistent/backup.db")


# ════════════════════════════════════════════════════════════
# EXPORT JSON
# ════════════════════════════════════════════════════════════

class TestExportJSON:
    def test_export_returns_dict(self, populated_db):
        data = export_json(populated_db)
        assert data["format"] == "memory-engine-backup"
        assert data["version"] == "1.0"
        assert data["stats"]["atoms"] >= 3
        assert data["stats"]["bonds"] >= 1

    def test_export_to_file(self, populated_db, tmp_path):
        out = str(tmp_path / "export.json")
        result = export_json(populated_db, output_path=out)
        assert result["path"] == out
        assert os.path.exists(out)
        # Verify file is valid JSON
        data = json.loads(Path(out).read_text())
        assert data["format"] == "memory-engine-backup"

    def test_export_atoms_have_parsed_tags(self, populated_db):
        data = export_json(populated_db)
        for a in data["atoms"]:
            if a.get("tags"):
                assert isinstance(a["tags"], list)

    def test_export_without_embeddings(self, populated_db):
        data = export_json(populated_db, include_embeddings=False)
        assert "atom_embeddings" not in data

    def test_export_with_embeddings(self, populated_db):
        data = export_json(populated_db, include_embeddings=True)
        assert "atom_embeddings" in data


# ════════════════════════════════════════════════════════════
# IMPORT JSON (round-trip)
# ════════════════════════════════════════════════════════════

class TestImportJSON:
    def test_round_trip_export_import(self, populated_db, tmp_path):
        """Export → Import into fresh DB → data should match."""
        # Export
        data = export_json(populated_db)
        
        # Create fresh DB
        fd, fresh_path = tempfile.mkstemp(suffix=".db")
        os.close(fd)
        fresh_db = DB(fresh_path)
        
        # Write export to file
        json_path = str(tmp_path / "export.json")
        Path(json_path).write_text(json.dumps(data, ensure_ascii=False))
        
        # Import
        result = import_json(fresh_path, json_path, mode="replace")
        assert result["imported"]["atoms"] >= 3
        assert result["imported"]["bonds"] >= 1
        
        # Verify data
        new_db = DB(fresh_path)
        atoms = new_db.list_atoms(limit=100)
        titles = sorted(a["title"] for a in atoms)
        assert "Alpha" in titles
        assert "Beta" in titles
        
        os.unlink(fresh_path)

    def test_import_merge_mode(self, populated_db, tmp_path):
        """Merge import adds to existing data without wiping."""
        # Export source DB
        data = export_json(populated_db)
        json_path = str(tmp_path / "export.json")
        Path(json_path).write_text(json.dumps(data, ensure_ascii=False))
        
        # Create target with an extra atom
        fd, target_path = tempfile.mkstemp(suffix=".db")
        os.close(fd)
        target_db = DB(target_path)
        extra = target_db.create_atom("Extra Unique", body="Pre-existing")
        
        # Import in merge mode
        result = import_json(target_path, json_path, mode="merge")
        assert result["imported"]["atoms"] >= 3
        
        # Both pre-existing and imported atoms should be present
        atoms = target_db.list_atoms(limit=100)
        titles = [a["title"] for a in atoms]
        assert "Extra Unique" in titles
        assert "Alpha" in titles
        
        os.unlink(target_path)

    def test_import_rejects_bad_format(self, tmp_path):
        fd, db_path = tempfile.mkstemp(suffix=".db")
        os.close(fd)
        DB(db_path)  # init schema
        
        bad_json = str(tmp_path / "bad.json")
        Path(bad_json).write_text(json.dumps({"format": "something-else"}))
        
        with pytest.raises(ValueError, match="Not a Memory Engine"):
            import_json(db_path, bad_json)
        
        os.unlink(db_path)


# ════════════════════════════════════════════════════════════
# LIST & CLEANUP BACKUPS
# ════════════════════════════════════════════════════════════

class TestListBackups:
    def test_list_empty(self, populated_db):
        """No backups → empty list."""
        result = list_backups(populated_db)
        assert result == []

    def test_list_multiple(self, populated_db):
        """Create several backups and list them."""
        b1 = create_backup(populated_db)
        time.sleep(1.1)  # ensure different timestamp
        b2 = create_backup(populated_db)
        
        result = list_backups(populated_db)
        # Filter only the ones we created (backups dir may have leftovers)
        ours = [b for b in result if b["filename"] in (b1["path"].split("/")[-1], b2["path"].split("/")[-1])]
        assert len(ours) >= 2
        # Filename format
        assert "memory_backup_" in ours[0]["filename"]
        
        for b in result:
            os.unlink(b["path"])


class TestCleanupBackups:
    def test_cleanup_keeps_n(self, populated_db):
        """Cleanup should keep only the N most recent backups."""
        # Create 5 backups with distinct timestamps
        for _ in range(5):
            create_backup(populated_db)
            time.sleep(1.1)  # ensure distinct timestamp filenames
        
        result = cleanup_old_backups(populated_db, keep=2)
        assert result["removed"] == 3
        assert result["kept"] == 2
        
        remaining = list_backups(populated_db)
        assert len(remaining) == 2
        for b in remaining:
            os.unlink(b["path"])

    def test_cleanup_when_under_limit(self, populated_db):
        """If backups < keep, nothing is removed."""
        create_backup(populated_db)
        result = cleanup_old_backups(populated_db, keep=10)
        assert result["removed"] == 0
        for b in list_backups(populated_db):
            os.unlink(b["path"])
        # Also clean any leftover backups from other tests
        import shutil
        bdir = Path(populated_db).parent / "backups"
        if bdir.exists():
            shutil.rmtree(bdir)
