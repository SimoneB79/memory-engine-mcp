"""
Memory Engine — Auto-Bonding Engine
Suggests and creates bonds between atoms using rules + semantic similarity.
"""
import json
import re
import logging

logger = logging.getLogger("auto_bond")


def _tags_to_set(tags) -> set:
    """Safely convert tags (list or JSON string) to a set."""
    if isinstance(tags, list):
        return set(tags)
    if isinstance(tags, str):
        try:
            return set(json.loads(tags))
        except (json.JSONDecodeError, TypeError):
            return set()
    return set()

# Valid relations
RELATIONS = {
    "is_a", "part_of", "depends_on", "contradicts",
    "refines", "derived_from", "detail_of", "related_to",
}


class AutoBondEngine:
    """Auto-bond atoms using heuristic rules + optional semantic similarity."""

    def __init__(self, db, embeddings=None, config: dict | None = None):
        self.db = db
        self.embeddings = embeddings
        self.config = config or {}
        ab_cfg = self.config.get("auto_bond", {})
        self.semantic_threshold = ab_cfg.get("semantic_threshold", 0.65)
        self.domain_cluster_threshold = ab_cfg.get("domain_cluster_threshold", 0.5)
        self.max_suggestions = ab_cfg.get("max_suggestions", 10)

    # ─── PUBLIC API ──────────────────────────────────────────

    def suggest_bonds_for_atom(
        self,
        atom_id: str,
        auto_apply: bool = False,
        skip_semantic: bool = False,
    ) -> list[dict]:
        """
        Suggest bonds for a single atom using all strategies.
        Returns list of suggestions with confidence and reason.
        """
        atom = self.db.get_atom(atom_id)
        if not atom:
            return []

        suggestions: list[dict] = []
        seen_pairs: set[tuple[str, str, str]] = set()

        # Get existing bonds to avoid duplicates
        existing = self._get_existing_bonds(atom_id)
        seen_pairs.update(existing)

        # Strategy 1: Domain cluster
        suggestions.extend(self._domain_cluster(atom, seen_pairs))
        # Strategy 2: Keyword/tag overlap
        suggestions.extend(self._keyword_overlap(atom, seen_pairs))
        # Strategy 3: Pattern detection (shared prefixes)
        suggestions.extend(self._pattern_detection(atom, seen_pairs))
        # Strategy 4: Semantic similarity (if embeddings available)
        if not skip_semantic:
            suggestions.extend(self._semantic_similarity(atom, seen_pairs))

        # Deduplicate and sort by confidence
        unique = self._deduplicate(suggestions)
        unique.sort(key=lambda x: x["confidence"], reverse=True)
        unique = unique[:self.max_suggestions]

        if auto_apply:
            for s in unique:
                try:
                    self.db.create_bond(
                        s["from_id"], s["to_id"],
                        s["relation"], s["confidence"],
                        s["reason"],
                    )
                except KeyError:
                    pass

        return unique

    def suggest_bonds_all(
        self,
        auto_apply: bool = False,
        limit_per_atom: int = 3,
        max_atoms: int = 200,
    ) -> dict:
        """
        Scan active atoms and suggest bonds.
        Returns summary statistics.
        """
        atoms = self.db.list_atoms(status="active", limit=max_atoms)
        all_suggestions = []
        applied = 0

        for atom in atoms:
            # Use only fast strategies (skip semantic for bulk scan)
            suggestions = self.suggest_bonds_for_atom(
                atom["id"], auto_apply=auto_apply, skip_semantic=True,
            )
            # Keep only top N per atom
            all_suggestions.extend(suggestions[:limit_per_atom])
            if auto_apply:
                applied += len(suggestions[:limit_per_atom])

        return {
            "atoms_scanned": len(atoms),
            "suggestions": len(all_suggestions),
            "applied": applied if auto_apply else 0,
            "top_suggestions": [
                {
                    "from": s["from_id"],
                    "to": s["to_id"],
                    "relation": s["relation"],
                    "confidence": s["confidence"],
                    "reason": s["reason"][:80],
                }
                for s in sorted(all_suggestions, key=lambda x: x["confidence"], reverse=True)[:20]
            ],
        }

    # ─── STRATEGIES ──────────────────────────────────────────

    def _domain_cluster(self, atom: dict, seen: set) -> list[dict]:
        """
        Atoms in the same domain are likely related.
        Suggest 'related_to' bonds within the same domain.
        """
        domain = atom.get("domain", "general")
        if domain in ("general", "session"):
            return []

        siblings = self.db.list_atoms(domain=domain, status="active", limit=50)
        suggestions = []
        atom_tags = _tags_to_set(atom.get("tags"))

        for sib in siblings:
            sib_id = sib["id"]
            if sib_id == atom["id"]:
                continue
            key = (atom["id"], sib_id, "related_to")
            rev_key = (sib_id, atom["id"], "related_to")
            if key in seen or rev_key in seen:
                continue

            # Confidence based on tag overlap
            sib_tags = _tags_to_set(sib.get("tags"))
            tag_overlap = (
                len(atom_tags & sib_tags) / len(atom_tags | sib_tags)
                if atom_tags or sib_tags else 0.3
            )
            conf = 0.3 + tag_overlap * 0.3
            if conf >= self.domain_cluster_threshold - 0.1:
                suggestions.append({
                    "from_id": atom["id"],
                    "to_id": sib_id,
                    "relation": "related_to",
                    "confidence": round(conf, 3),
                    "reason": f"Same domain '{domain}', tag overlap {tag_overlap:.0%}",
                    "strategy": "domain_cluster",
                })
                seen.add(key)
        return suggestions

    def _keyword_overlap(self, atom: dict, seen: set) -> list[dict]:
        """
        Atoms sharing significant title keywords are related.
        """
        title_words = set(
            w.lower() for w in re.findall(r"\w+", atom.get("title", ""))
            if len(w) > 2 and w.lower() not in STOP_WORDS
        )
        if not title_words:
            return []

        # Search FTS for matching keywords
        query = " ".join(title_words)
        fts_results = self.db.search_fts(query, limit=15)
        suggestions = []

        for r in fts_results:
            r_id = r["id"]
            if r_id == atom["id"]:
                continue
            key = (atom["id"], r_id, "related_to")
            if key in seen:
                continue

            r_title_words = set(
                w.lower() for w in re.findall(r"\w+", r.get("title", ""))
                if len(w) > 2
            )
            overlap = len(title_words & r_title_words)
            if overlap >= 2:
                conf = min(0.8, 0.3 + overlap * 0.15)
                suggestions.append({
                    "from_id": atom["id"],
                    "to_id": r_id,
                    "relation": "related_to",
                    "confidence": round(conf, 3),
                    "reason": f"Title keyword overlap: {overlap} words",
                    "strategy": "keyword_overlap",
                })
                seen.add(key)
        return suggestions

    def _pattern_detection(self, atom: dict, seen: set) -> list[dict]:
        """
        Detect atoms with shared prefixes (e.g. 'prostructures_*', 'tenda_*').
        Suggest 'part_of' or 'detail_of' bonds.
        """
        atom_id = atom["id"]
        # Extract prefix (first 2-3 underscore-separated tokens)
        parts = atom_id.split("_")
        if len(parts) < 2:
            return []

        # Try prefixes of decreasing length
        suggestions = []
        for prefix_len in (min(3, len(parts) - 1), 2):
            if prefix_len < 2:
                break
            prefix = "_".join(parts[:prefix_len])

            with self.db.conn() as c:
                rows = c.execute(
                    """SELECT id, title FROM atoms
                       WHERE id LIKE ? AND id != ? AND status = 'active'
                       LIMIT 20""",
                    (f"{prefix}%", atom_id),
                ).fetchall()

            for r in rows:
                key = (atom_id, r["id"], "detail_of")
                rev_key = (r["id"], atom_id, "detail_of")
                if key in seen or rev_key in seen:
                    continue

                # Determine relation type
                # If this atom is a "workspace" or "overview", others are details
                is_parent = any(kw in atom_id.lower() for kw in ("workspace", "overview", "setup", "status"))
                relation = "part_of" if is_parent else "detail_of"
                from_id, to_id = (atom_id, r["id"]) if is_parent else (r["id"], atom_id)
                key = (from_id, to_id, relation)
                if key in seen:
                    continue

                suggestions.append({
                    "from_id": from_id,
                    "to_id": to_id,
                    "relation": relation,
                    "confidence": 0.7,
                    "reason": f"Shared ID prefix '{prefix}'",
                    "strategy": "pattern_detection",
                })
                seen.add(key)
            if suggestions:
                break
        return suggestions

    def _semantic_similarity(self, atom: dict, seen: set) -> list[dict]:
        """
        Use Ollama embeddings to find semantically similar atoms.
        """
        if not self.embeddings or not self.embeddings.enabled:
            return []

        similar = self.embeddings.find_similar_atoms(
            atom["id"],
            limit=8,
            threshold=self.semantic_threshold,
        )
        suggestions = []
        for s in similar:
            s_id = s["atom_id"]
            sim = s["similarity"]
            key = (atom["id"], s_id, "related_to")
            if key in seen:
                continue
            # High similarity → maybe stronger relation
            relation = "related_to"
            if sim > 0.85:
                relation = "refines"
            suggestions.append({
                "from_id": atom["id"],
                "to_id": s_id,
                "relation": relation,
                "confidence": round(sim, 3),
                "reason": f"Semantic similarity {sim:.1%}",
                "strategy": "semantic",
            })
            seen.add(key)
        return suggestions

    # ─── HELPERS ─────────────────────────────────────────────

    def _get_existing_bonds(self, atom_id: str) -> set[tuple[str, str, str]]:
        existing = set()
        with self.db.conn() as c:
            rows = c.execute(
                """SELECT from_id, to_id, relation FROM bonds
                   WHERE from_id = ? OR to_id = ?""",
                (atom_id, atom_id),
            ).fetchall()
            for r in rows:
                existing.add((r["from_id"], r["to_id"], r["relation"]))
                # Also add reverse to prevent bidirectional duplicates
                existing.add((r["to_id"], r["from_id"], r["relation"]))
        return existing

    @staticmethod
    def _deduplicate(suggestions: list[dict]) -> list[dict]:
        """Remove duplicate suggestions (same from/to/relation)."""
        seen = set()
        unique = []
        for s in suggestions:
            key = (s["from_id"], s["to_id"], s["relation"])
            if key not in seen:
                seen.add(key)
                unique.append(s)
        return unique


# Common stop words to ignore in keyword matching
STOP_WORDS = {
    "the", "a", "an", "is", "are", "was", "were", "be", "been",
    "and", "or", "but", "in", "on", "at", "to", "for", "of",
    "with", "by", "from", "as", "this", "that", "these", "those",
    "il", "la", "lo", "di", "da", "in", "con", "per", "che",
    "una", "uno", "del", "della", "dei", "degli", "delle",
}
