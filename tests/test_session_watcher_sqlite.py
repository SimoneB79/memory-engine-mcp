import json

from openclaw_db_factory import (
    add_active_event,
    add_session,
    create_openclaw_db,
    message_event,
)
from session_watcher import SessionWatcher


def make_watcher(db, source_path, digest_dir, sessions_dir):
    return SessionWatcher(
        db=db,
        sessions_dir=str(sessions_dir),
        agent_db_path=str(source_path),
        digest_dir=str(digest_dir),
        poll_interval=0,
    )


def test_sqlite_atoms_are_event_deduped_and_digest_is_upserted(
    db, tmp_path
):
    source_path = tmp_path / "openclaw.sqlite"
    conn = create_openclaw_db(source_path)
    add_session(conn)
    add_active_event(conn, message_event("u1", "user", "same"), 1)
    add_active_event(conn, message_event("u2", "user", "same"), 2)
    conn.commit()

    watcher = make_watcher(db, source_path, tmp_path / "digests", tmp_path)
    watcher.digest_dir.mkdir()
    watcher._scan_sqlite()

    with db.conn() as memory:
        messages = memory.execute(
            "SELECT id, body FROM atoms WHERE type='session_msg' AND status='active'"
        ).fetchall()
        digest = memory.execute(
            "SELECT id, body FROM atoms WHERE type='session_digest'"
        ).fetchone()
        cursor_count = memory.execute(
            "SELECT count(*) FROM session_cursors"
        ).fetchone()[0]
    assert len(messages) == 2
    assert digest is not None
    assert "Messages: 2" in digest["body"]
    assert cursor_count == 1

    versions_before = _version_count(db)
    watcher._scan_sqlite()
    assert _version_count(db) == versions_before
    conn.close()


def test_projection_rewrite_updates_and_archives_stale_atoms(db, tmp_path):
    source_path = tmp_path / "openclaw.sqlite"
    conn = create_openclaw_db(source_path)
    add_session(conn)
    add_active_event(conn, message_event("old", "user", "before"), 1)
    conn.commit()

    watcher = make_watcher(db, source_path, tmp_path / "digests", tmp_path)
    watcher.digest_dir.mkdir()
    watcher._scan_sqlite()

    conn.execute("DELETE FROM session_transcript_active_events")
    add_active_event(
        conn,
        message_event("new", "user", "after"),
        2,
        active_position=1,
    )
    conn.commit()
    watcher._scan_sqlite()

    with db.conn() as memory:
        rows = memory.execute(
            """SELECT status, body FROM atoms WHERE type='session_msg'
               ORDER BY created_at, id"""
        ).fetchall()
        digest = memory.execute(
            "SELECT body FROM atoms WHERE type='session_digest'"
        ).fetchone()
    assert sorted(row["status"] for row in rows) == ["active", "archived"]
    active = next(row for row in rows if row["status"] == "active")
    assert json.loads(active["body"])["content"] == "after"
    assert "- after" in digest["body"]
    assert "- before" not in digest["body"]

    conn.execute("DELETE FROM session_transcript_active_events")
    conn.commit()
    watcher._scan_sqlite()
    conn.close()
    with db.conn() as memory:
        assert memory.execute(
            "SELECT count(*) FROM atoms WHERE status='active' AND domain LIKE 'session/oc_%'"
        ).fetchone()[0] == 0
        assert memory.execute("SELECT count(*) FROM session_cursors").fetchone()[0] == 0


def test_jsonl_legacy_fallback_remains_available(db, tmp_path):
    sessions = tmp_path / "sessions"
    sessions.mkdir()
    path = sessions / "legacy.jsonl"
    path.write_text(
        json.dumps(
            {
                "type": "message",
                "timestamp": "2026-08-30T12:00:00Z",
                "message": {"role": "user", "content": "legacy"},
            }
        )
        + "\n"
    )
    watcher = SessionWatcher(
        db=db,
        sessions_dir=str(sessions),
        digest_dir=str(tmp_path / "digests"),
        poll_interval=0,
    )
    watcher._initial_scan()

    with db.conn() as memory:
        count = memory.execute(
            "SELECT count(*) FROM atoms WHERE type='session_msg'"
        ).fetchone()[0]
    assert count == 1


def _version_count(db):
    with db.conn() as memory:
        return memory.execute("SELECT count(*) FROM atom_versions").fetchone()[0]
