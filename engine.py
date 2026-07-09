"""
Memory Engine — Intelligence Layer
Ranking, similarity, merge detection, gap detection.
"""
import time
import math
from db import DB


class Engine:
    def __init__(self, db: DB, config: dict):
        self.db = db
        self.config = config

    # ─── RANKING ─────────────────────────────────────────────

    def rank_results(self, fts_results: list[dict], query: str) -> list[dict]:
        """
        Multi-factor ranking: FTS score × semantic × confidence × recency × weight.
        Returns sorted list with combined score and explanation.
        """
        cfg = self.config.get("ranking", {})
        w_fts = cfg.get("fts_weight", 0.30)
        w_sem = cfg.get("semantic_weight", 0.30)
        w_conf = cfg.get("confidence_weight", 0.20)
        w_recency = cfg.get("recency_weight", 0.10)
        w_weight = cfg.get("weight_factor", 0.10)

        now = int(time.time())
        scored = []

        for row in fts_results:
            # FTS score: bm25 returns negative (more negative = better), normalize
            raw_fts = row.get("fts_score")
            if raw_fts is not None:
                fts_norm = 1.0 / (1.0 + abs(raw_fts)) if raw_fts else 0.5
            else:
                fts_norm = 0.0  # No FTS match (semantic-only result)

            # Semantic score (0-1 or None)
            sem_raw = row.get("semantic_score")
            sem_norm = sem_raw if sem_raw is not None else 0.0

            # Confidence: already 0-1
            conf = row.get("confidence", 0.5)

            # Recency: exponential decay based on last access
            age_days = max(0, (now - row.get("accessed_at", now)) / 86400)
            recency = math.exp(-age_days / 90.0)  # half-life ~90 days

            # Weight: normalize 0-2 to 0-1
            weight_norm = min(1.0, row.get("weight", 1.0) / 2.0)

            # Combined score
            score = (
                w_fts * fts_norm
                + w_sem * sem_norm
                + w_conf * conf
                + w_recency * recency
                + w_weight * weight_norm
            )

            row["rank_score"] = round(score, 4)
            row["rank_breakdown"] = {
                "fts": round(fts_norm, 3),
                "semantic": round(sem_norm, 3),
                "confidence": round(conf, 3),
                "recency": round(recency, 3),
                "weight": round(weight_norm, 3),
                "final": round(score, 4),
            }
            scored.append(row)

        scored.sort(key=lambda x: x["rank_score"], reverse=True)
        return scored

    # ─── RECALL (smart query) ────────────────────────────────

    def recall(self, query: str, limit: int = 5, min_weight: float = 0.0,
               domain: str | None = None, semantic: bool = True,
               embeddings=None) -> list[dict]:
        """
        Smart recall: FTS search + optional semantic search + multi-factor ranking.
        """
        # Get FTS results (fetch more, then filter)
        fts_results = self.db.search_fts(query, limit=limit * 3)

        # Semantic search (optional)
        sem_results = []
        if semantic and embeddings and embeddings.enabled:
            sem_raw = embeddings.semantic_search(
                query, limit=limit * 3, domain=domain, min_weight=min_weight,
            )
            # Normalize to same format as fts_results
            for r in sem_raw:
                r["fts_score"] = None
                r["semantic_score"] = r.pop("semantic_score")
                sem_results.append(r)

        # Merge FTS + semantic, deduplicate by atom_id
        merged = {}
        for r in fts_results:
            merged[r["id"]] = r
            merged[r["id"]]["semantic_score"] = None
        for r in sem_results:
            if r["id"] in merged:
                merged[r["id"]]["semantic_score"] = r.get("semantic_score")
            else:
                merged[r["id"]] = r

        # Filter by weight and domain
        filtered = []
        for r in merged.values():
            if r.get("weight", 1.0) < min_weight:
                continue
            if domain and r.get("domain") != domain:
                continue
            filtered.append(r)

        # Rank
        ranked = self.rank_results(filtered, query)

        # Return top N with compact body
        results = []
        for r in ranked[:limit]:
            results.append({
                "id": r["id"],
                "title": r["title"],
                "body": r.get("body_compact") or r.get("body", ""),
                "domain": r["domain"],
                "type": r["type"],
                "confidence": r["confidence"],
                "weight": r["weight"],
                "rank_score": r["rank_score"],
                "semantic_score": r.get("semantic_score"),
                "tags": __import__("json").loads(r.get("tags") or "[]"),
            })
        return results

    # ─── SIMILARITY ──────────────────────────────────────────

    def compute_similarity(self, atom_a: dict, atom_b: dict) -> float:
        """
        Heuristic similarity between two atoms (0-1).
        Uses title word overlap + domain match + tag overlap.
        """
        # Title word overlap (Jaccard)
        words_a = set(atom_a.get("title", "").lower().split())
        words_b = set(atom_b.get("title", "").lower().split())
        if words_a and words_b:
            jaccard = len(words_a & words_b) / len(words_a | words_b)
        else:
            jaccard = 0

        # Domain match
        domain_bonus = 0.2 if atom_a.get("domain") == atom_b.get("domain") else 0

        # Tag overlap
        import json
        tags_a = set(atom_a.get("tags")) if isinstance(atom_a.get("tags"), list) else set(json.loads(atom_a.get("tags") or "[]"))
        tags_b = set(atom_b.get("tags")) if isinstance(atom_b.get("tags"), list) else set(json.loads(atom_b.get("tags") or "[]"))
        if tags_a and tags_b:
            tag_sim = len(tags_a & tags_b) / len(tags_a | tags_b)
        else:
            tag_sim = 0

        return min(1.0, jaccard * 0.5 + tag_sim * 0.3 + domain_bonus)

    # ─── LEARNING TRIGGERS ───────────────────────────────────

    def detect_contradictions(self) -> list[dict]:
        """
        Find atom pairs that might contradict each other:
        same domain, high title similarity, potentially conflicting info.
        """
        threshold = self.config.get("learning", {}).get("contradiction_threshold", 0.7)
        atoms = self.db.list_atoms(status="active", limit=500)
        candidates = []

        for i, a in enumerate(atoms):
            for b in atoms[i + 1:]:
                if a["domain"] != b["domain"]:
                    continue
                sim = self.compute_similarity(a, b)
                if sim >= threshold:
                    candidates.append({
                        "atom_a": a["id"],
                        "atom_b": b["id"],
                        "title_a": a["title"],
                        "title_b": b["title"],
                        "similarity": round(sim, 3),
                    })
        return candidates

    def detect_weak_atoms(self) -> list[dict]:
        """
        Find atoms that are accessed often but have low confidence.
        These need human verification.
        """
        conf_thresh = self.config.get("learning", {}).get("weak_confidence_threshold", 0.4)
        access_thresh = self.config.get("learning", {}).get("weak_access_threshold", 5)

        with self.db.conn() as c:
            rows = c.execute(
                """SELECT * FROM atoms 
                   WHERE status = 'active' 
                     AND confidence < ? 
                     AND access_count >= ?
                   ORDER BY access_count DESC""",
                (conf_thresh, access_thresh),
            ).fetchall()
            return [dict(r) for r in rows]

    def detect_merge_candidates(self) -> list[dict]:
        """
        Find atom pairs that are very similar and could be merged.
        """
        sim_thresh = self.config.get("learning", {}).get("merge_similarity_threshold", 0.85)
        atoms = self.db.list_atoms(status="active", limit=500)
        candidates = []

        for i, a in enumerate(atoms):
            for b in atoms[i + 1:]:
                sim = self.compute_similarity(a, b)
                if sim >= sim_thresh:
                    candidates.append({
                        "atom_a": a["id"],
                        "atom_b": b["id"],
                        "title_a": a["title"],
                        "title_b": b["title"],
                        "similarity": round(sim, 3),
                    })
        return candidates

    def detect_decay_critical(self) -> list[dict]:
        """
        Find atoms whose weight has decayed below critical threshold.
        """
        threshold = self.config.get("learning", {}).get("decay_critical_threshold", 0.15)
        with self.db.conn() as c:
            rows = c.execute(
                """SELECT * FROM atoms 
                   WHERE status = 'active' AND weight < ?
                   ORDER BY weight ASC""",
                (threshold,),
            ).fetchall()
            return [dict(r) for r in rows]

    def detect_gaps(self) -> list[dict]:
        """
        Find active atoms with very short or empty bodies — likely incomplete.
        """
        min_chars = self.config.get("learning", {}).get("gap_body_min_chars", 50)
        with self.db.conn() as c:
            rows = c.execute(
                """SELECT * FROM atoms 
                   WHERE status = 'active' 
                     AND (body IS NULL OR LENGTH(body) < ?)
                   ORDER BY access_count DESC""",
                (min_chars,),
            ).fetchall()
            return [dict(r) for r in rows]
