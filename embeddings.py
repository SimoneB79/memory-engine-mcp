"""
Memory Engine — Embedding Layer
Semantic search via Ollama (nomic-embed-text).
"""
import json
import struct
import time
import logging

logger = logging.getLogger("embeddings")

# Lazy import requests
try:
    import requests
except ImportError:
    requests = None
    logger.warning("requests not installed — embeddings disabled")


class EmbeddingEngine:
    """Manage atom embeddings via Ollama and provide semantic search."""

    def __init__(self, db, config: dict):
        self.db = db
        self.cfg = config.get("ollama", {})
        self.enabled = self.cfg.get("enabled", True) and requests is not None
        self.host = self.cfg.get("host", "http://ollama:11434")
        self.model = self.cfg.get("model", "nomic-embed-text")
        self.dim = self.cfg.get("dim", 768)
        # In-memory cache: atom_id -> list[float]
        self._cache: dict[str, list[float]] = {}
        self._cache_loaded = False

    # ─── OLLAMA CLIENT ───────────────────────────────────────

    def _ollama_embed(self, text: str) -> list[float] | None:
        """Call Ollama /api/embeddings endpoint."""
        if not self.enabled:
            return None
        # Truncate to ~2000 chars (model context limit)
        text = text[:2000]
        try:
            resp = requests.post(
                f"{self.host}/api/embeddings",
                json={"model": self.model, "prompt": text},
                timeout=10,
            )
            resp.raise_for_status()
            data = resp.json()
            emb = data.get("embedding")
            if emb and len(emb) == self.dim:
                return emb
            logger.warning("Embedding dim mismatch: got %d, expected %d",
                           len(emb) if emb else 0, self.dim)
            return None
        except Exception as e:
            logger.error("Ollama embedding error: %s", e)
            return None

    # ─── PACK / UNPACK ───────────────────────────────────────

    @staticmethod
    def _pack(emb: list[float]) -> bytes:
        """Pack float list to compact bytes (float32 LE)."""
        return struct.pack(f"{len(emb)}f", *emb)

    @staticmethod
    def _unpack(data: bytes) -> list[float]:
        """Unpack bytes back to float list."""
        n = len(data) // 4
        return list(struct.unpack(f"{n}f", data))

    # ─── ATOM EMBEDDING ──────────────────────────────────────

    def embed_atom(self, atom: dict) -> list[float] | None:
        """Generate embedding for an atom (title + body)."""
        text = atom.get("title", "")
        body = atom.get("body", "")
        if body:
            text += "\n\n" + body
        return self._ollama_embed(text)

    def store_embedding(self, atom_id: str, embedding: list[float]):
        """Store embedding in DB + update cache."""
        blob = self._pack(embedding)
        now = int(time.time())
        with self.db.conn() as c:
            c.execute(
                """INSERT OR REPLACE INTO atom_embeddings
                   (atom_id, embedding, model, dim, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (atom_id, blob, self.model, len(embedding), now, now),
            )
        self._cache[atom_id] = embedding

    def ensure_embedding(self, atom_id: str, atom: dict | None = None) -> list[float] | None:
        """Get embedding from cache/DB, or generate if missing."""
        # Check cache
        if atom_id in self._cache:
            return self._cache[atom_id]
        # Check DB
        emb = self._get_from_db(atom_id)
        if emb:
            self._cache[atom_id] = emb
            return emb
        # Generate
        if atom is None:
            atom = self.db.get_atom(atom_id)
        if not atom:
            return None
        emb = self.embed_atom(atom)
        if emb:
            self.store_embedding(atom_id, emb)
        return emb

    def _get_from_db(self, atom_id: str) -> list[float] | None:
        with self.db.conn() as c:
            row = c.execute(
                "SELECT embedding FROM atom_embeddings WHERE atom_id = ?",
                (atom_id,),
            ).fetchone()
            if row:
                return self._unpack(row["embedding"])
            return None

    # ─── CACHE LOADING ───────────────────────────────────────

    def _load_cache(self):
        """Load all embeddings into memory for fast cosine similarity."""
        if self._cache_loaded:
            return
        with self.db.conn() as c:
            rows = c.execute(
                """SELECT e.atom_id, e.embedding, a.status
                   FROM atom_embeddings e
                   JOIN atoms a ON e.atom_id = a.id
                   WHERE a.status = 'active'"""
            ).fetchall()
            self._cache = {r["atom_id"]: self._unpack(r["embedding"]) for r in rows}
            self._cache_loaded = True
            logger.info("Loaded %d embeddings into cache", len(self._cache))

    def invalidate_cache(self):
        """Force reload on next search."""
        self._cache_loaded = False
        self._cache.clear()

    # ─── SEMANTIC SEARCH ─────────────────────────────────────

    def semantic_search(
        self,
        query: str,
        limit: int = 5,
        domain: str | None = None,
        min_weight: float = 0.0,
    ) -> list[dict]:
        """
        Semantic search: embed query, cosine similarity against all atoms.
        Returns ranked list with scores.
        """
        if not self.enabled:
            return []

        query_emb = self._ollama_embed(query)
        if not query_emb:
            return []

        self._load_cache()
        if not self._cache:
            return []

        # Get atom metadata for filtering
        with self.db.conn() as c:
            rows = c.execute(
                "SELECT id, title, domain, type, confidence, weight, status FROM atoms WHERE status = 'active'"
            ).fetchall()
            atom_meta = {r["id"]: dict(r) for r in rows}

        # Cosine similarity
        scored = []
        for atom_id, emb in self._cache.items():
            meta = atom_meta.get(atom_id)
            if not meta:
                continue
            if domain and meta["domain"] != domain:
                continue
            if meta["weight"] < min_weight:
                continue
            sim = self._cosine(query_emb, emb)
            scored.append({
                "id": atom_id,
                "title": meta["title"],
                "domain": meta["domain"],
                "type": meta["type"],
                "confidence": meta["confidence"],
                "weight": meta["weight"],
                "semantic_score": round(sim, 4),
            })

        scored.sort(key=lambda x: x["semantic_score"], reverse=True)
        return scored[:limit]

    # ─── SIMILARITY ──────────────────────────────────────────

    @staticmethod
    def _cosine(a: list[float], b: list[float]) -> float:
        """Cosine similarity between two vectors."""
        dot = sum(x * y for x, y in zip(a, b))
        norm_a = sum(x * x for x in a) ** 0.5
        norm_b = sum(x * x for x in b) ** 0.5
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot / (norm_a * norm_b)

    def find_similar_atoms(
        self,
        atom_id: str,
        limit: int = 5,
        threshold: float = 0.5,
    ) -> list[dict]:
        """Find atoms semantically similar to a given atom."""
        emb = self.ensure_embedding(atom_id)
        if not emb:
            return []

        self._load_cache()
        scored = []
        for aid, other_emb in self._cache.items():
            if aid == atom_id:
                continue
            sim = self._cosine(emb, other_emb)
            if sim >= threshold:
                scored.append({"atom_id": aid, "similarity": round(sim, 4)})

        scored.sort(key=lambda x: x["similarity"], reverse=True)
        return scored[:limit]

    # ─── BULK INDEX ──────────────────────────────────────────

    def reindex_all(self, force: bool = False) -> dict:
        """Generate embeddings for all active atoms missing one (or all if force)."""
        if not self.enabled:
            return {"error": "Embeddings disabled (Ollama not reachable)"}

        with self.db.conn() as c:
            if force:
                rows = c.execute(
                    "SELECT id FROM atoms WHERE status = 'active'"
                ).fetchall()
            else:
                rows = c.execute(
                    """SELECT a.id FROM atoms a
                       LEFT JOIN atom_embeddings e ON a.id = e.atom_id
                       WHERE a.status = 'active' AND e.atom_id IS NULL"""
                ).fetchall()

        total = len(rows)
        created = 0
        errors = 0
        for r in rows:
            atom = self.db.get_atom(r["id"])
            if not atom:
                continue
            emb = self.embed_atom(atom)
            if emb:
                self.store_embedding(r["id"], emb)
                created += 1
            else:
                errors += 1

        self.invalidate_cache()
        return {"total": total, "created": created, "errors": errors}

    def reindex_batch(self, force: bool = False, batch_size: int = 50) -> dict:
        """Reindex atoms in batches, returns progress immediately."""
        if not self.enabled:
            return {"error": "Embeddings disabled (Ollama not reachable)"}

        with self.db.conn() as c:
            if force:
                rows = c.execute(
                    "SELECT id FROM atoms WHERE status = 'active'"
                ).fetchall()
            else:
                rows = c.execute(
                    """SELECT a.id FROM atoms a
                       LEFT JOIN atom_embeddings e ON a.id = e.atom_id
                       WHERE a.status = 'active' AND e.atom_id IS NULL"""
                ).fetchall()

        total = len(rows)
        batch = rows[:batch_size]
        created = 0
        errors = 0

        for r in batch:
            atom = self.db.get_atom(r["id"])
            if not atom:
                continue
            emb = self.embed_atom(atom)
            if emb:
                self.store_embedding(r["id"], emb)
                created += 1
            else:
                errors += 1

        remaining = total - len(batch)
        self.invalidate_cache()
        return {
            "total_pending": total,
            "batch_size": len(batch),
            "created": created,
            "errors": errors,
            "remaining": remaining,
            "done": remaining == 0,
        }

    # ─── DELETE ──────────────────────────────────────────────

    def delete_embedding(self, atom_id: str):
        with self.db.conn() as c:
            c.execute("DELETE FROM atom_embeddings WHERE atom_id = ?", (atom_id,))
        self._cache.pop(atom_id, None)

    # ─── STATS ───────────────────────────────────────────────

    def stats(self) -> dict:
        with self.db.conn() as c:
            total = c.execute("SELECT COUNT(*) as n FROM atom_embeddings").fetchone()["n"]
            active = c.execute(
                """SELECT COUNT(*) as n FROM atom_embeddings e
                   JOIN atoms a ON e.atom_id = a.id WHERE a.status = 'active'"""
            ).fetchone()["n"]
        return {
            "enabled": self.enabled,
            "model": self.model,
            "dim": self.dim,
            "total_embeddings": total,
            "active_embeddings": active,
            "cache_size": len(self._cache),
        }
