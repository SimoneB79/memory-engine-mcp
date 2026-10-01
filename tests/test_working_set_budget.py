import pytest

from curator import CognitiveCurator


@pytest.fixture
def curator_with_atoms(engine, db):
    from learning import Learning
    from auto_bond import AutoBondEngine

    learning = Learning(db, engine, {})
    bonds = AutoBondEngine(db, {})
    curator = CognitiveCurator(db, engine, learning, bonds, {})
    for i, (ty, title) in enumerate([
        ("fact", "Fatto configurazione %d"),
        ("decision", "Decisione architetturale %d"),
        ("procedure", "Procedura ripristino %d"),
        ("preference", "Preferenza stile %d"),
    ]):
        db.create_atom(
            title % i,
            "Contenuto di prova abbastanza lungo " * 4,
            type=ty,
            domain="test",
            confidence=0.9,
        )
    return curator


def test_working_set_token_budget(curator_with_atoms):
    pack = curator_with_atoms.working_set(
        "configurazione ripristino", token_budget=800
    )
    report = pack["token_budget"]
    assert report["requested"] == 800
    assert report["used"] <= 800
    assert report["used"] == sum(report["tokens_by_section"].values())
    assert report["candidates_seen"] >= report["selected"]
    # per-item metadata for the future retrieval-event log
    for section in ("focus_atoms", "key_procedures_decisions", "context_atoms"):
        for atom in pack[section]:
            assert "category" in atom and "reason" in atom


def test_working_set_budget_borrowing(curator_with_atoms):
    # small budget: sections must borrow from each other, never exceed total
    pack = curator_with_atoms.working_set("configurazione", token_budget=400)
    report = pack["token_budget"]
    assert report["used"] <= 400


def test_working_set_without_budget(curator_with_atoms):
    pack = curator_with_atoms.working_set("configurazione", token_budget=None)
    assert "token_budget" not in pack
    assert len(pack["focus_atoms"]) >= 0
