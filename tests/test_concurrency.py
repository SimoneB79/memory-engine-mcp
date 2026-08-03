"""
Tests for SQLite concurrency — WAL mode, retry on busy, PRAGMA settings.
"""
import pytest
import threading
import time
import sqlite3
import tempfile
import os
from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from db import DB


class TestPragmas:
    """Verify that the PRAGMA settings are correctly applied."""

    def test_wal_mode(self):
        import tempfile, os
        fd, p = tempfile.mkstemp(suffix=".db")
        os.close(fd)
        db = DB(p)
        with db.conn() as c:
            mode = c.execute("PRAGMA journal_mode").fetchone()[0]
        assert mode.lower() == "wal"
        os.unlink(p)
        # Clean WAL/SHM
        for suffix in ("-wal", "-shm"):
            sidecar = p + suffix
            if os.path.exists(sidecar):
                os.unlink(sidecar)

    def test_synchronous_normal(self):
        import tempfile, os
        fd, p = tempfile.mkstemp(suffix=".db")
        os.close(fd)
        db = DB(p)
        with db.conn() as c:
            sync = c.execute("PRAGMA synchronous").fetchone()[0]
        # NORMAL = 1 in WAL mode
        assert sync == 1
        os.unlink(p)

    def test_busy_timeout_set(self):
        import tempfile, os
        fd, p = tempfile.mkstemp(suffix=".db")
        os.close(fd)
        db = DB(p)
        with db.conn() as c:
            timeout = c.execute("PRAGMA busy_timeout").fetchone()[0]
        assert timeout >= 5000
        os.unlink(p)

    def test_foreign_keys_on(self):
        import tempfile, os
        fd, p = tempfile.mkstemp(suffix=".db")
        os.close(fd)
        db = DB(p)
        with db.conn() as c:
            fk = c.execute("PRAGMA foreign_keys").fetchone()[0]
        assert fk == 1
        os.unlink(p)


class TestConcurrentReads:
    """Multiple threads reading concurrently should not block each other."""

    def test_concurrent_reads(self):
        import tempfile, os
        fd, p = tempfile.mkstemp(suffix=".db")
        os.close(fd)
        db = DB(p)
        for i in range(10):
            db.create_atom(f"Concurrent atom {i}", domain="test")

        errors = []
        results = {}

        def read_thread(thread_id):
            try:
                local_db = DB(p)
                atoms = local_db.list_atoms(domain="test", limit=100)
                results[thread_id] = len(atoms)
            except Exception as e:
                errors.append((thread_id, str(e)))

        threads = [threading.Thread(target=read_thread, args=(i,)) for i in range(5)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        assert len(errors) == 0, f"Errors: {errors}"
        for tid, count in results.items():
            assert count == 10

        os.unlink(p)
        for suffix in ("-wal", "-shm"):
            sidecar = p + suffix
            if os.path.exists(sidecar):
                os.unlink(sidecar)

    def test_concurrent_read_while_write(self):
        """Reads should work even while a write is in progress (WAL advantage)."""
        import tempfile, os
        fd, p = tempfile.mkstemp(suffix=".db")
        os.close(fd)
        db = DB(p)
        db.create_atom("Pre-existing", domain="test")

        errors = []
        write_done = threading.Event()

        def write_thread():
            try:
                for i in range(5):
                    db.create_atom(f"Batch {i}", domain="test")
                    time.sleep(0.05)
                write_done.set()
            except Exception as e:
                errors.append(("write", str(e)))

        def read_thread():
            try:
                time.sleep(0.1)  # let writer start
                local_db = DB(p)
                atoms = local_db.list_atoms(domain="test", limit=100)
                assert len(atoms) >= 1
            except Exception as e:
                errors.append(("read", str(e)))

        w = threading.Thread(target=write_thread)
        r = threading.Thread(target=read_thread)
        w.start()
        r.start()
        w.join(timeout=10)
        r.join(timeout=10)

        assert len(errors) == 0, f"Errors: {errors}"
        assert write_done.is_set()

        os.unlink(p)
        for suffix in ("-wal", "-shm"):
            sidecar = p + suffix
            if os.path.exists(sidecar):
                os.unlink(sidecar)


class TestConcurrentWrites:
    """Multiple writers should not corrupt data, retry on busy."""

    def test_concurrent_writes_different_atoms(self):
        import tempfile, os
        fd, p = tempfile.mkstemp(suffix=".db")
        os.close(fd)
        db = DB(p)

        errors = []
        written = []

        def write_thread(thread_id):
            try:
                local_db = DB(p)
                for i in range(3):
                    atom = local_db.create_atom(
                        f"Thread {thread_id} atom {i}",
                        domain="concurrent",
                    )
                    written.append(atom["id"])
            except Exception as e:
                errors.append((thread_id, str(e)))

        threads = [threading.Thread(target=write_thread, args=(i,)) for i in range(3)]
        for t in threads:
            t.start()
        for t in threads:
            t.join(timeout=15)

        assert len(errors) == 0, f"Write errors: {errors}"
        assert len(written) == 9  # 3 threads × 3 atoms each

        # Verify all atoms exist
        atoms = db.list_atoms(domain="concurrent", limit=100)
        assert len(atoms) == 9

        os.unlink(p)
        for suffix in ("-wal", "-shm"):
            sidecar = p + suffix
            if os.path.exists(sidecar):
                os.unlink(sidecar)
