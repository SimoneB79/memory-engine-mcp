"""
Memory Engine — Intelligence Layer
Ranking, similarity, merge detection, gap detection.
"""
import time
import math
import json
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
        tier_boosts = cfg.get("tier_boosts", {
            "semantic": 0.04,
            "procedural": 0.03,
            "episodic": 0.0,
        })
        status_penalties = cfg.get("status_penalties", {
            "superseded": -0.25,
            "archived": -0.15,
            "stale": -0.10,
            "merged": -0.35,
        })

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

            tier_boost = tier_boosts.get(row.get("memory_tier", "semantic"), 0.0)
            status_penalty = status_penalties.get(row.get("status", "active"), 0.0)

            # Combined score
            score = (
                w_fts * fts_norm
                + w_sem * sem_norm
                + w_conf * conf
                + w_recency * recency
                + w_weight * weight_norm
                + tier_boost
                + status_penalty
            )
            score = max(0.0, min(1.0, score))

            row["rank_score"] = round(score, 4)
            row["rank_breakdown"] = {
                "fts": round(fts_norm, 3),
                "semantic": round(sem_norm, 3),
                "confidence": round(conf, 3),
                "recency": round(recency, 3),
                "weight": round(weight_norm, 3),
                "tier_boost": round(tier_boost, 3),
                "status_penalty": round(status_penalty, 3),
                "final": round(score, 4),
            }
            scored.append(row)

        scored.sort(key=lambda x: x["rank_score"], reverse=True)
        return scored

    # ─── RECALL (smart query) ────────────────────────────────

    def recall(self, query: str, limit: int = 5, min_weight: float = 0.0,
               domain: str | None = None, semantic: bool = True,
               embeddings=None, memory_tier: str | None = None,
               include_superseded: bool = False) -> list[dict]:
        """
        Smart recall: FTS + semantic search + graph expansion.

        Direct hits are ranked first, then the graph is traversed from the best
        hits so connected facts/procedures/decisions can surface even when they
        do not directly match the query text.
        """
        graph_cfg = self.config.get("graph_recall", {})
        graph_enabled = graph_cfg.get("enabled", True)
        graph_seed_limit = max(1, graph_cfg.get("seed_limit", 3))
        graph_neighbor_limit = max(0, graph_cfg.get("neighbors_per_seed", 4))
        graph_weight = graph_cfg.get("graph_weight", 0.55)
        graph_min_strength = graph_cfg.get("min_strength", 0.35)

        # Get FTS results (fetch more, then filter). Superseded atoms are
        # opt-in: they remain recoverable as history without crowding normal recall.
        statuses = ("active", "superseded") if include_superseded else ("active",)
        fts_results = self.db.search_fts(
            query, limit=limit * 3, statuses=statuses, memory_tier=memory_tier,
        )

        # Semantic search (optional)
        sem_results = []
        if semantic and embeddings and embeddings.enabled:
            sem_raw = embeddings.semantic_search(
                query, limit=limit * 3, domain=domain, min_weight=min_weight,
            )
            for r in sem_raw:
                if memory_tier and r.get("memory_tier") != memory_tier:
                    continue
                if not include_superseded and r.get("status", "active") != "active":
                    continue
                r["fts_score"] = None
                r["semantic_score"] = r.pop("semantic_score")
                sem_results.append(r)

        # Merge FTS + semantic, deduplicate by atom_id
        merged = {}
        for r in fts_results:
            merged[r["id"]] = r
            merged[r["id"]]["semantic_score"] = None
            merged[r["id"]]["match_kind"] = "direct"
        for r in sem_results:
            if r["id"] in merged:
                merged[r["id"]]["semantic_score"] = r.get("semantic_score")
                merged[r["id"]]["match_kind"] = "direct+semantic"
            else:
                r["match_kind"] = "semantic"
                merged[r["id"]] = r

        # Filter by weight and domain
        filtered = []
        for r in merged.values():
            if r.get("weight", 1.0) < min_weight:
                continue
            if domain and r.get("domain") != domain:
                continue
            if memory_tier and r.get("memory_tier") != memory_tier:
                continue
            if not include_superseded and r.get("status", "active") != "active":
                continue
            filtered.append(r)

        # Rank direct hits
        ranked = self.rank_results(filtered, query)

        # Reason over graph neighbors from top direct hits
        if graph_enabled and graph_neighbor_limit > 0 and ranked:
            ranked = self._expand_graph_context(
                ranked=ranked,
                limit=limit,
                domain=domain,
                min_weight=min_weight,
                seed_limit=graph_seed_limit,
                neighbor_limit=graph_neighbor_limit,
                graph_weight=graph_weight,
                min_strength=graph_min_strength,
            )

        return [self._format_recall_result(r) for r in ranked[:limit]]

    def _expand_graph_context(
        self,
        ranked: list[dict],
        limit: int,
        domain: str | None,
        min_weight: float,
        seed_limit: int,
        neighbor_limit: int,
        graph_weight: float,
        min_strength: float,
    ) -> list[dict]:
        """Add/boost graph neighbors connected to the best direct recall hits."""
        by_id = {r["id"]: r for r in ranked}
        expanded = list(ranked)

        for seed in ranked[:seed_limit]:
            neighbors = self.db.get_related_atoms(
                seed["id"], limit=neighbor_limit, min_strength=min_strength,
            )
            for n in neighbors:
                if n.get("weight", 1.0) < min_weight:
                    continue
                if domain and n.get("domain") != domain:
                    continue
                if n.get("status", "active") != "active":
                    continue

                relation_score = seed["rank_score"] * n.get("strength", 0.5) * graph_weight
                relation_score *= min(1.0, n.get("weight", 1.0) / 2.0)
                relation_score = round(relation_score, 4)
                reason = {
                    "via_atom": seed["id"],
                    "via_title": seed.get("title"),
                    "relation": n.get("relation"),
                    "direction": n.get("direction"),
                    "strength": n.get("strength"),
                    "evidence": n.get("evidence"),
                }

                if n["id"] in by_id:
                    existing = by_id[n["id"]]
                    if relation_score > existing.get("graph_score", 0):
                        existing["graph_score"] = relation_score
                        existing["graph_reason"] = reason
                    existing["rank_score"] = round(
                        min(1.0, existing["rank_score"] + relation_score * 0.25), 4,
                    )
                    existing["match_kind"] = existing.get("match_kind", "direct") + "+graph"
                else:
                    n["fts_score"] = None
                    n["semantic_score"] = None
                    n["rank_score"] = relation_score
                    n["rank_breakdown"] = {
                        "direct": 0.0,
                        "graph": relation_score,
                        "final": relation_score,
                    }
                    n["match_kind"] = "graph"
                    n["graph_score"] = relation_score
                    n["graph_reason"] = reason
                    by_id[n["id"]] = n
                    expanded.append(n)

        expanded.sort(key=lambda x: x["rank_score"], reverse=True)
        return expanded[: max(limit, len(ranked))]

    @staticmethod
    def _safe_tags(raw_tags) -> list:
        if isinstance(raw_tags, list):
            return raw_tags
        try:
            return json.loads(raw_tags or "[]")
        except (TypeError, json.JSONDecodeError):
            return []

    def _format_recall_result(self, r: dict) -> dict:
        result = {
            "id": r["id"],
            "title": r["title"],
            "body": r.get("body_compact") or r.get("body", ""),
            "domain": r["domain"],
            "type": r["type"],
            "memory_tier": r.get("memory_tier", "semantic"),
            "status": r.get("status", "active"),
            "confidence": r["confidence"],
            "weight": r["weight"],
            "rank_score": r["rank_score"],
            "semantic_score": r.get("semantic_score"),
            "match_kind": r.get("match_kind", "direct"),
            "tags": self._safe_tags(r.get("tags")),
        }
        meta = r.get("meta")
        if isinstance(meta, str):
            try:
                meta = json.loads(meta or "{}")
            except json.JSONDecodeError:
                meta = {}
        if isinstance(meta, dict):
            if meta.get("superseded_by"):
                result["superseded_by"] = meta["superseded_by"]
            if meta.get("supersedes_atom_id"):
                result["supersedes_atom_id"] = meta["supersedes_atom_id"]
        if r.get("graph_reason"):
            result["graph_reason"] = r["graph_reason"]
            result["graph_score"] = r.get("graph_score")
        return result

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

    def detect_graph_gaps(self) -> list[dict]:
        """Find important durable atoms that are isolated in the knowledge graph."""
        cfg = self.config.get("learning", {})
        min_weight = cfg.get("graph_gap_min_weight", 0.6)
        limit = cfg.get("graph_gap_limit", 20)
        allowed_types = tuple(cfg.get(
            "graph_gap_types",
            ["fact", "decision", "procedure", "preference", "project", "note"],
        ))
        excluded_domain_prefixes = tuple(cfg.get(
            "graph_gap_excluded_domain_prefixes",
            ["daily/", "session/"],
        ))

        placeholders = ",".join("?" for _ in allowed_types)
        with self.db.conn() as c:
            rows = c.execute(
                f"""SELECT a.*
                    FROM atoms a
                    LEFT JOIN bonds bo ON bo.from_id = a.id OR bo.to_id = a.id
                    WHERE a.status = 'active'
                      AND a.weight >= ?
                      AND a.type IN ({placeholders})
                      AND bo.from_id IS NULL
                    ORDER BY a.weight DESC, a.access_count DESC
                    LIMIT ?""",
                (min_weight, *allowed_types, limit * 3),
            ).fetchall()

        result = []
        for r in rows:
            atom = dict(r)
            domain = atom.get("domain") or ""
            title = atom.get("title") or ""
            if domain.startswith(excluded_domain_prefixes):
                continue
            if title.lower().startswith(("diario", "daily ")):
                continue
            if __import__("re").fullmatch(r"20\d{2}-\d{2}-\d{2}", title.strip()):
                continue
            try:
                meta = json.loads(atom.get("meta") or "{}")
            except (TypeError, json.JSONDecodeError):
                meta = {}
            if meta.get("allow_isolated"):
                continue
            result.append(atom)
            if len(result) >= limit:
                break
        return result

    # ─── ERROR AUTO-PROMOTION ────────────────────────────────

    def check_and_promote_errors(self) -> list[dict]:
        """
        Find unresolved errors with occurrence_count >= 3 and promote them
        to permanent preference atoms. Returns list of promoted atoms.
        """
        promoted = []
        with self.db.conn() as c:
            candidates = c.execute(
                """SELECT * FROM error_memory 
                   WHERE is_resolved = 0 AND occurrence_count >= 3
                   ORDER BY occurrence_count DESC"""
            ).fetchall()

        for err in candidates:
            err = dict(err)
            # Check if preference atom already exists for this error
            existing = self.db.search_fts(err["correction"], limit=1)
            if existing:
                # Already has a matching preference, just resolve
                self.db.resolve_error(err["id"], existing[0]["id"])
                continue

            # Create prevention rule text
            rule_text = err["correction"]
            prevention_rule = (
                f"When doing {err['task_type']}: {rule_text}. "
                f"(Learned from {err['occurrence_count']} occurrences)"
            )

            # Create preference atom
            atom = self.db.create_atom(
                title=f"Rule: {err['task_type']} — {err['error_category']}",
                body=prevention_rule,
                type="preference",
                domain="learned_rules",
                confidence=0.85,
                tags=["auto_learned", "error_prevention", err["severity"]],
                source="error_promotion",
                meta={
                    "category": "error_prevention",
                    "condition": err["task_type"],
                    "rule": rule_text,
                    "source_error_id": err["id"],
                    "occurrence_count": err["occurrence_count"],
                    "auto_learned": True,
                },
            )

            # Mark error as resolved
            self.db.resolve_error(err["id"], atom["id"])

            # Update the error record with prevention_rule
            with self.db.conn() as c:
                c.execute(
                    "UPDATE error_memory SET prevention_rule = ? WHERE id = ?",
                    (prevention_rule, err["id"]),
                )

            promoted.append({
                "error_id": err["id"],
                "atom_id": atom["id"],
                "prevention_rule": prevention_rule,
                "occurrence_count": err["occurrence_count"],
            })

        return promoted

    # ─── HIERARCHICAL SUMMARY ────────────────────────────────

    def hierarchical_summary(self, domain: str | None = None) -> dict:
        """
        Generate a 3-level summary of the memory database.
        L0: Global counts (total, by type, by domain, by status)
        L1: Per-domain top atoms by weight
        L2: Detail omitted (available via list_atoms/get_atom)
        """
        with self.db.conn() as c:
            # L0 — Global stats
            total = c.execute(
                "SELECT COUNT(*) as n FROM atoms WHERE status = 'active'"
            ).fetchone()["n"]

            by_type = c.execute(
                "SELECT type, COUNT(*) as n FROM atoms WHERE status = 'active' "
                "GROUP BY type ORDER BY n DESC"
            ).fetchall()

            domain_filter = "AND domain = ?" if domain else ""
            domain_params = [domain] if domain else []

            by_domain = c.execute(
                f"SELECT domain, COUNT(*) as n FROM atoms WHERE status = 'active' "
                f"{domain_filter} GROUP BY domain ORDER BY n DESC",
                domain_params,
            ).fetchall()

            bonds_count = c.execute("SELECT COUNT(*) as n FROM bonds").fetchone()["n"]
            errors_unresolved = c.execute(
                "SELECT COUNT(*) as n FROM error_memory WHERE is_resolved = 0"
            ).fetchone()["n"]
            pending_q = c.execute(
                "SELECT COUNT(*) as n FROM human_questions WHERE status = 'pending'"
            ).fetchone()["n"]

            # L1 — Per-domain top atoms
            domains_data = []
            for d in by_domain:
                top_atoms = c.execute(
                    """SELECT id, title, type, weight, confidence, accessed_at,
                              access_count
                       FROM atoms 
                       WHERE status = 'active' AND domain = ?
                       ORDER BY weight DESC, access_count DESC
                       LIMIT 5""",
                    (d["domain"],),
                ).fetchall()

                # Type breakdown for this domain
                type_breakdown = c.execute(
                    """SELECT type, COUNT(*) as n FROM atoms 
                       WHERE status = 'active' AND domain = ?
                       GROUP BY type ORDER BY n DESC""",
                    (d["domain"],),
                ).fetchall()

                domains_data.append({
                    "domain": d["domain"],
                    "total_atoms": d["n"],
                    "types": {r["type"]: r["n"] for r in type_breakdown},
                    "top_atoms": [
                        {
                            "id": r["id"],
                            "title": r["title"],
                            "type": r["type"],
                            "weight": r["weight"],
                            "confidence": r["confidence"],
                            "access_count": r["access_count"],
                        }
                        for r in top_atoms
                    ],
                })

            return {
                "l0_global": {
                    "total_active_atoms": total,
                    "total_bonds": bonds_count,
                    "unresolved_errors": errors_unresolved,
                    "pending_questions": pending_q,
                    "by_type": {r["type"]: r["n"] for r in by_type},
                    "by_domain": {r["domain"]: r["n"] for r in by_domain},
                },
                "l1_domains": domains_data,
                "l2_note": "Use list_atoms() or get_atom() for full details",
                "domain_filter": domain,
            }
