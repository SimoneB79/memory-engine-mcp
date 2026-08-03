"""
Backup, restore, and data portability for Memory Engine.

Backup strategies:
1. Full SQLite snapshot (using VACUUM INTO or backup API)
2. JSON export/import (portable, human-readable, cross-instance)
3. Markdown export (for external tools / git versioning)

All functions are safe to call on a running instance (SQLite handles concurrency).
"""
import json
import os
import time
import sqlite3
import shutil
from pathlib import Path


def create_backup(db_path: str, dest_dir: str | None = None) -> dict:
    """
    Create a full SQLite backup using the online backup API.
    This is safe to run while the DB is in use (uses SQLite backup API).

    Returns dict with backup path and metadata.
    """
    db_path = Path(db_path)
    if not db_path.exists():
        raise FileNotFoundError(f"Database not found: {db_path}")

    dest_dir = Path(dest_dir) if dest_dir else db_path.parent / "backups"
    dest_dir.mkdir(parents=True, exist_ok=True)

    timestamp = time.strftime("%Y%m%d_%H%M%S")
    backup_path = dest_dir / f"memory_backup_{timestamp}.db"

    # Checkpoint WAL into main DB file before backup
    # so the snapshot includes all committed transactions
    try:
        chk = sqlite3.connect(str(db_path))
        chk.execute("PRAGMA wal_checkpoint(TRUNCATE)")
        chk.close()
    except Exception:
        pass

    # Use SQLite online backup API (safe during concurrent access)
    src = sqlite3.connect(str(db_path))
    dst = sqlite3.connect(str(backup_path))
    try:
        src.backup(dst)
    finally:
        dst.close()
        src.close()

    size = backup_path.stat().st_size

    return {
        "path": str(backup_path),
        "size_bytes": size,
        "size_mb": round(size / (1024 * 1024), 2),
        "timestamp": timestamp,
        "epoch": int(time.time()),
    }


def restore_backup(db_path: str, backup_path: str, verify: bool = True) -> dict:
    """
    Restore a SQLite backup file to the DB path.
    
    WARNING: This overwrites the current database.
    The caller should create a safety backup first.
    
    Args:
        db_path: Path to the active database file
        backup_path: Path to the backup file to restore
        verify: If True, verify the backup has required tables before restoring
    """
    backup_path = Path(backup_path)
    if not backup_path.exists():
        raise FileNotFoundError(f"Backup not found: {backup_path}")

    if verify:
        issues = verify_backup(str(backup_path))
        if issues["missing_tables"]:
            raise ValueError(
                f"Backup verification failed — missing tables: {issues['missing_tables']}"
            )

    # Create safety backup of current DB in a dedicated safety dir
    safety = None
    if Path(db_path).exists():
        safety_dir = Path(db_path).parent / "safety_backups"
        safety = create_backup(db_path, dest_dir=str(safety_dir))
    
    # Flush WAL and checkpoint before copying
    try:
        conn = sqlite3.connect(str(db_path))
        conn.execute("PRAGMA wal_checkpoint(TRUNCATE)")
        conn.close()
    except Exception:
        pass
    
    # Remove WAL and SHM files before replacing the main DB
    for suffix in ("-wal", "-shm"):
        sidecar = Path(str(db_path) + suffix)
        if sidecar.exists():
            sidecar.unlink()

    # Copy the backup over the current DB
    shutil.copy2(str(backup_path), str(db_path))
    # Also remove WAL/SHM that may remain from the copied backup name
    for suffix in ("-wal", "-shm"):
        sidecar = Path(str(db_path) + suffix)
        if sidecar.exists():
            sidecar.unlink()

    return {
        "restored_from": str(backup_path),
        "db_path": str(db_path),
        "safety_backup": safety,
    }


def verify_backup(backup_path: str) -> dict:
    """
    Verify that a backup file contains the expected Memory Engine schema.
    Returns dict with table list, missing tables, and row counts.
    """
    expected_tables = {
        "atoms", "bonds", "atom_versions", "human_questions",
        "memory_contradictions", "error_memory", "atom_embeddings",
    }

    conn = sqlite3.connect(backup_path)
    conn.row_factory = sqlite3.Row
    try:
        all_tables = {
            r[0] for r in conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            ).fetchall()
        }
        missing = expected_tables - all_tables

        counts = {}
        for t in sorted(expected_tables & all_tables):
            try:
                counts[t] = conn.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
            except Exception:
                counts[t] = -1

        # Check FTS
        fts_exists = "atoms_fts" in all_tables
    finally:
        conn.close()

    return {
        "valid": len(missing) == 0 and fts_exists,
        "tables": sorted(all_tables),
        "missing_tables": sorted(missing),
        "row_counts": counts,
        "has_fts": fts_exists,
    }


def export_json(db_path: str, output_path: str | None = None,
                include_embeddings: bool = False) -> dict:
    """
    Export all memory data as JSON.
    Portable format that can be imported into another instance.

    Args:
        db_path: Path to the SQLite database
        output_path: Where to write JSON (default: stdout return)
        include_embeddings: Include embedding vectors (large)
    
    Returns dict with the exported data (or writes to file if output_path given).
    """
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        # Core tables
        atoms = [dict(r) for r in conn.execute("SELECT * FROM atoms").fetchall()]
        bonds = [dict(r) for r in conn.execute("SELECT * FROM bonds").fetchall()]
        versions = [dict(r) for r in conn.execute("SELECT * FROM atom_versions").fetchall()]
        questions = [dict(r) for r in conn.execute("SELECT * FROM human_questions").fetchall()]
        contradictions = [dict(r) for r in conn.execute("SELECT * FROM memory_contradictions").fetchall()]
        errors = [dict(r) for r in conn.execute("SELECT * FROM error_memory").fetchall()]
        
        embeddings = []
        if include_embeddings:
            embeddings = [dict(r) for r in conn.execute("SELECT * FROM atom_embeddings").fetchall()]

        # Parse JSON fields in atoms
        for a in atoms:
            for field in ("tags", "meta"):
                if isinstance(a.get(field), str):
                    try:
                        a[field] = json.loads(a[field])
                    except (json.JSONDecodeError, TypeError):
                        pass

        data = {
            "format": "memory-engine-backup",
            "version": "1.0",
            "exported_at": int(time.time()),
            "stats": {
                "atoms": len(atoms),
                "bonds": len(bonds),
                "versions": len(versions),
                "questions": len(questions),
                "contradictions": len(contradictions),
                "errors": len(errors),
                "embeddings": len(embeddings),
            },
            "atoms": atoms,
            "bonds": bonds,
            "atom_versions": versions,
            "human_questions": questions,
            "memory_contradictions": contradictions,
            "error_memory": errors,
        }
        if include_embeddings:
            data["atom_embeddings"] = embeddings

        if output_path:
            Path(output_path).write_text(
                json.dumps(data, ensure_ascii=False, indent=2, default=str)
            )
            return {
                "path": output_path,
                "stats": data["stats"],
            }
        return data
    finally:
        conn.close()


def import_json(db_path: str, json_path: str, mode: str = "merge") -> dict:
    """
    Import memory data from a JSON export.
    
    Args:
        db_path: Path to the SQLite database
        json_path: Path to the JSON file
        mode: "merge" (insert or replace by ID) or "replace" (wipe + insert)
    
    Returns dict with import statistics.
    """
    data = json.loads(Path(json_path).read_text())
    
    if data.get("format") != "memory-engine-backup":
        raise ValueError(f"Not a Memory Engine backup file (format={data.get('format')})")

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    
    stats = {"atoms": 0, "bonds": 0, "versions": 0, "questions": 0,
             "contradictions": 0, "errors": 0, "embeddings": 0, "skipped": 0}
    
    try:
        if mode == "replace":
            for table in ["bonds", "atoms", "atom_versions", "human_questions",
                          "memory_contradictions", "error_memory", "atom_embeddings"]:
                conn.execute(f"DELETE FROM {table}")

        # Import atoms
        for a in data.get("atoms", []):
            tags = a.get("tags", [])
            if isinstance(tags, list):
                tags = json.dumps(tags)
            meta = a.get("meta", {})
            if isinstance(meta, dict):
                meta = json.dumps(meta)
            
            try:
                conn.execute(
                    """INSERT OR REPLACE INTO atoms 
                       (id, type, memory_tier, domain, title, body, body_compact,
                        confidence, weight, status, source, source_path,
                        created_at, updated_at, accessed_at, access_count,
                        ttl, tags, meta, content_hash)
                       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                    (a["id"], a.get("type", "fact"), a.get("memory_tier", "semantic"),
                     a.get("domain", "general"), a["title"], a.get("body"),
                     a.get("body_compact"), a.get("confidence", 0.5),
                     a.get("weight", 1.0), a.get("status", "active"),
                     a.get("source", "import"), a.get("source_path"),
                     a.get("created_at", int(time.time())),
                     a.get("updated_at", int(time.time())),
                     a.get("accessed_at", int(time.time())),
                     a.get("access_count", 0), a.get("ttl"),
                     tags, meta, a.get("content_hash")),
                )
                stats["atoms"] += 1
            except Exception as e:
                stats["skipped"] += 1

        # Import bonds
        for b in data.get("bonds", []):
            try:
                conn.execute(
                    """INSERT OR REPLACE INTO bonds 
                       (from_id, to_id, relation, strength, evidence, created_at)
                       VALUES (?,?,?,?,?,?)""",
                    (b["from_id"], b["to_id"], b["relation"],
                     b.get("strength", 0.5), b.get("evidence"),
                     b.get("created_at", int(time.time()))),
                )
                stats["bonds"] += 1
            except Exception:
                stats["skipped"] += 1

        # Import versions
        for v in data.get("atom_versions", []):
            try:
                conn.execute(
                    """INSERT OR REPLACE INTO atom_versions
                       (atom_id, version, title, body, changed_at, changed_by, change_reason)
                       VALUES (?,?,?,?,?,?,?)""",
                    (v["atom_id"], v["version"], v.get("title"), v.get("body"),
                     v.get("changed_at", int(time.time())),
                     v.get("changed_by", "import"), v.get("change_reason")),
                )
                stats["versions"] += 1
            except Exception:
                stats["skipped"] += 1

        # Import questions
        for q in data.get("human_questions", []):
            try:
                conn.execute(
                    """INSERT OR REPLACE INTO human_questions
                       (id, atom_ids, question_type, question, options, status,
                        answer, created_at, answered_at, meta)
                       VALUES (?,?,?,?,?,?,?,?,?,?)""",
                    (q["id"], q.get("atom_ids"), q.get("question_type"),
                     q.get("question"), q.get("options"), q.get("status", "pending"),
                     q.get("answer"), q.get("created_at", int(time.time())),
                     q.get("answered_at"), q.get("meta", "{}")),
                )
                stats["questions"] += 1
            except Exception:
                stats["skipped"] += 1

        # Import contradictions
        for ct in data.get("memory_contradictions", []):
            try:
                conn.execute(
                    """INSERT OR REPLACE INTO memory_contradictions
                       (id, old_atom_id, new_atom_id, reason, created_at)
                       VALUES (?,?,?,?,?)""",
                    (ct["id"], ct["old_atom_id"], ct["new_atom_id"],
                     ct.get("reason"), ct.get("created_at", int(time.time()))),
                )
                stats["contradictions"] += 1
            except Exception:
                stats["skipped"] += 1

        # Import errors
        for e in data.get("error_memory", []):
            try:
                conn.execute(
                    """INSERT OR REPLACE INTO error_memory
                       (id, task_type, error_category, mistake, correction,
                        occurrence_count, first_seen, last_seen, is_resolved,
                        upgraded_to_preference, task_hash)
                       VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
                    (e["id"], e.get("task_type"), e.get("error_category"),
                     e.get("mistake"), e.get("correction"),
                     e.get("occurrence_count", 1), e.get("first_seen", int(time.time())),
                     e.get("last_seen", int(time.time())), e.get("is_resolved", 0),
                     e.get("upgraded_to_preference", 0), e.get("task_hash")),
                )
                stats["errors"] += 1
            except Exception:
                stats["skipped"] += 1

        conn.commit()
        
        # Rebuild FTS index
        conn.execute("INSERT INTO atoms_fts(atoms_fts) VALUES('rebuild')")
        conn.commit()
        
        return {"mode": mode, "imported": stats}
    finally:
        conn.close()


def list_backups(db_path: str, backup_dir: str | None = None) -> list[dict]:
    """List available backup files with metadata."""
    db_path = Path(db_path)
    bdir = Path(backup_dir) if backup_dir else db_path.parent / "backups"
    if not bdir.exists():
        return []

    backups = []
    for f in sorted(bdir.glob("memory_backup_*.db"), reverse=True):
        stat = f.stat()
        backups.append({
            "filename": f.name,
            "path": str(f),
            "size_mb": round(stat.st_size / (1024 * 1024), 2),
            "created": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(stat.st_mtime)),
            "epoch": int(stat.st_mtime),
        })
    return backups


def cleanup_old_backups(db_path: str, keep: int = 10, backup_dir: str | None = None) -> dict:
    """Remove old backups, keeping the N most recent."""
    backups = list_backups(db_path, backup_dir)
    if len(backups) <= keep:
        return {"removed": 0, "kept": len(backups)}

    to_remove = backups[keep:]
    for b in to_remove:
        try:
            Path(b["path"]).unlink()
        except OSError:
            pass

    return {"removed": len(to_remove), "kept": keep}
