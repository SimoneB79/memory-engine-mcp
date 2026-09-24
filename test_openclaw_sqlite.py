import sqlite3

import pytest

from openclaw_sqlite import (
    OpenClawSQLiteSource,
    OpenClawTranscriptError,
    UnsupportedOpenClawSchema,
)
import json
import time

from openclaw_db_factory import (
    add_active_event,
    add_archive,
    add_session,
    create_openclaw_db,
    message_event,
)


def test_reads_wal_and_splits_resets_without_noise(tmp_path):
    path = tmp_path / "openclaw.sqlite"
    writer = create_openclaw_db(path, wal=True)
    add_session(writer)
    add_active_event(writer, message_event("u1", "user", "same text"), 1)
    add_active_event(
        writer,
        message_event(
            "mirror",
            "assistant",
            [{"type": "text", "text": "delivery copy"}],
            meta={"mirrorOrigin": "codex-app-server"},
        ),
        2,
    )
    add_active_event(
        writer,
        message_event("tool", "toolResult", [{"type": "text", "text": "tool output"}]),
        3,
    )
    add_active_event(writer, {"type": "reset", "id": "reset-1"}, 4)
    add_active_event(writer, message_event("u2", "user", "same text"), 5)
    add_active_event(writer, message_event("u3", "user", "same text"), 6)
    writer.commit()

    batches = OpenClawSQLiteSource(str(path)).scan()
    writer.close()

    assert [batch.segment for batch in batches] == [0, 1]
    assert [len(batch.messages) for batch in batches] == [1, 2]
    assert {msg["event_id"] for batch in batches for msg in batch.messages} == {
        "u1",
        "u2",
        "u3",
    }


@pytest.mark.parametrize("encoding", ["identity", "zstd"])
def test_reads_archives(tmp_path, encoding):
    path = tmp_path / "openclaw.sqlite"
    conn = create_openclaw_db(path)
    events = [
        message_event("a1", "user", "archived"),
        message_event("a2", "assistant", [{"type": "text", "text": "reply"}]),
    ]
    add_archive(conn, events, encoding=encoding)
    conn.commit()
    conn.close()

    batches = OpenClawSQLiteSource(str(path)).scan()

    assert len(batches) == 1
    assert batches[0].generation == "generation-1"
    assert [m["content"] for m in batches[0].messages] == ["archived", "reply"]


def test_rewrite_changes_projection_hash(tmp_path):
    path = tmp_path / "openclaw.sqlite"
    conn = create_openclaw_db(path)
    add_session(conn)
    add_active_event(conn, message_event("old", "user", "before"), 1)
    conn.commit()
    source = OpenClawSQLiteSource(str(path))
    old_hash = source.scan()[0].projection_hash

    conn.execute("DELETE FROM session_transcript_active_events")
    add_active_event(
        conn,
        message_event("new", "user", "after"),
        2,
        active_position=1,
    )
    conn.commit()
    new_batch = source.scan()[0]
    conn.close()

    assert new_batch.projection_hash != old_hash
    assert new_batch.messages[0]["content"] == "after"


def test_schema_21_supported(tmp_path):
    path = tmp_path / "openclaw.sqlite"
    conn = create_openclaw_db(path, schema_version=21)
    conn.commit()
    conn.close()

    batches = OpenClawSQLiteSource(str(path)).scan()
    assert isinstance(batches, list)


def test_schema_incompatibility_is_explicit(tmp_path):
    path = tmp_path / "openclaw.sqlite"
    conn = create_openclaw_db(path, schema_version=18)
    conn.commit()
    conn.close()

    with pytest.raises(UnsupportedOpenClawSchema, match="schema 18"):
        OpenClawSQLiteSource(str(path)).scan()


def test_busy_retry_and_terminal_error(tmp_path):
    source = OpenClawSQLiteSource(str(tmp_path / "missing"), busy_retries=3)
    attempts = 0

    def eventually_succeeds():
        nonlocal attempts
        attempts += 1
        if attempts < 3:
            raise sqlite3.OperationalError("database is locked")
        return "ok"

    assert source._with_retry(eventually_succeeds) == "ok"
    with pytest.raises(OpenClawTranscriptError, match="remained busy"):
        source._with_retry(
            lambda: (_ for _ in ()).throw(sqlite3.OperationalError("busy"))
        )


def test_schema_23_supported_with_zstd_events(tmp_path):
    """Schema 23: identity TEXT rows plus zstd-compressed BLOB rows both scan."""
    zstandard = pytest.importorskip("zstandard")
    from openclaw_db_factory import (
        add_compressed_event,
        add_session,
        create_openclaw_db,
        make_schema_23,
        message_event,
    )

    db_path = tmp_path / "agent.db"
    conn = create_openclaw_db(str(db_path), schema_version=23)
    make_schema_23(conn)
    add_session(conn, "session-s23", "agent:main:s23")
    conn.execute(
        "INSERT INTO transcript_events (session_id, seq, event_json, created_at) "
        "VALUES ('session-s23', 0, ?, ?)",
        (json.dumps(message_event("e0", "user", "plain hello")), int(time.time())),
    )
    add_compressed_event(
        conn, "session-s23", 1, message_event("e1", "assistant", "compressed hello")
    )
    conn.execute(
        "INSERT INTO transcript_event_identities VALUES ('session-s23', 'e0', 0)"
    )
    conn.execute(
        "INSERT INTO transcript_event_identities VALUES ('session-s23', 'e1', 1)"
    )
    for seq in (0, 1):
        conn.execute(
            "INSERT INTO session_transcript_active_events "
            "VALUES ('session-s23', ?, ?, ?)",
            (seq, seq, seq),
        )
    conn.commit()
    conn.close()

    batches = OpenClawSQLiteSource(str(db_path)).scan()
    assert batches, "expected batches from schema 23 db"
    assert {msg["event_id"] for b in batches for msg in b.messages} == {
        "e0",
        "e1",
    }
    blob_text = json.dumps([msg for b in batches for msg in b.messages])
    assert "plain hello" in blob_text
    assert "compressed hello" in blob_text
