"""Reindex robustness: failed detail reporting (v2.1.0).
Simula embed fallimentari e verifica che niente venga scartato in silenzio."""

import sys, os, types
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class _FakeConn:
    def __enter__(self): return self
    def __exit__(self, *a): return False
    def execute(self, sql, p=()):
        class _R:
            def __init__(self, rows): self.rows = rows
            def fetchall(self): return self.rows
        if "FROM atoms" in sql:
            return _R([{"id": "a-good"}, {"id": "a-bad"}, {"id": "a-null"}, {"id": "a-gone"}])
        return _R([])


class _FakeDB:
    def conn(self): return _FakeConn()
    _atoms = {"a-good": {"id": "a-good", "title": "ok"}, "a-bad": {"id": "a-bad", "title": "boom"}, "a-null": {"id": "a-null", "title": "none"}}
    def get_atom(self, aid): return self._atoms.get(aid)


class _Embeddings:
    enabled = True
    def __init__(self): self.stored = []
    def embed_atom(self, atom):
        if atom["id"] == "a-bad": raise RuntimeError("ollama exploded")
        if atom["id"] == "a-null": return None
        return [0.1, 0.2]
    def store_embedding(self, aid, emb): self.stored.append(aid)
    def invalidate_cache(self): pass


def _make():
    import embeddings as emb_mod
    emb = _Embeddings()
    emb.db = _FakeDB()
    # usa i metodi del modulo con l'istanza finta
    emb.reindex_batch = emb_mod.EmbeddingEngine.reindex_batch.__get__(emb)
    emb.reindex_all = emb_mod.EmbeddingEngine.reindex_all.__get__(emb)
    return emb


def test_reindex_batch_reports_failed_detail():
    emb = _make()
    res = emb.reindex_batch(batch_size=10)
    assert res["created"] == 1 and res["errors"] == 2
    assert res["skipped_missing"] == 1, "atomo inesistente deve essere contato, non saltato in silenzio"
    ids = {f["id"] for f in res["failed_detail"]}
    assert ids == {"a-bad", "a-null"}
    reasons = {f["id"]: f["reason"] for f in res["failed_detail"]}
    assert "ollama exploded" in reasons["a-bad"]


def test_reindex_all_reports_failed_detail():
    emb = _make()
    res = emb.reindex_all()
    assert res["created"] == 1 and res["errors"] == 2 and res["skipped_missing"] == 1
    assert len(res["failed_detail"]) == 2
