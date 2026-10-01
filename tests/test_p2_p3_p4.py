import time

import pytest


def test_temporal_validity_expired_penalty(engine, db):
    now = int(time.time())
    db.create_atom("Config vecchia scaduta", "IP tunnel zic 10.6.0.2", type="fact", domain="test", valid_until=now - 3600)
    db.create_atom("Config nuova valida", "IP tunnel zic 10.6.0.3", type="fact", domain="test", valid_from=now)
    results = engine.recall("IP tunnel zic", limit=5)
    assert results, "recall deve trovare atomi"
    # la versione scaduta non deve battere quella valida
    scores = {r["title"]: r["rank_score"] for r in results}
    if "Config vecchia scaduta" in scores and "Config nuova valida" in scores:
        assert scores["Config nuova valida"] > scores["Config vecchia scaduta"]


def test_create_atom_persist_validity(db):
    now = int(time.time())
    a = db.create_atom("Fatto con finestra", "body", type="fact", domain="t", valid_from=now - 10, valid_until=now + 9999)
    assert a["valid_from"] == now - 10
    assert a["valid_until"] == now + 9999


def test_contradiction_sets_valid_until(db):
    a = db.create_atom("Vecchia verita", "v1", type="fact", domain="t")
    db.create_contradiction(a["id"], "Nuova verita", "v2", reason="update")
    old = db.get_atom(a["id"])
    assert old["valid_until"] is not None and old["status"] == "superseded"


def test_classify_intent(engine):
    b1 = engine.classify_intent("come si fa il ripristino del deploy")
    assert b1.get("procedure", 0) > 0
    b2 = engine.classify_intent("che preferenze ho sui messaggi")
    assert b2.get("preference", 0) > 0
    b3 = engine.classify_intent("lista cose a caso")
    assert b3 == {}


def test_retrieval_event_log(engine, db):
    db.create_atom("Evento retrieval test", "body contenuto unico xyzqwe", type="fact", domain="t")
    engine.recall("evento retrieval xyzqwe", limit=3)
    with db.conn() as c:
        rows = c.execute("SELECT * FROM retrieval_events WHERE query LIKE ?", ("%xyzqwe%",)).fetchall()
    assert rows, "recall deve loggare su retrieval_events"
    assert rows[0]["tool"] == "recall"
