"""
Memory Engine — Cognitive Curator
Nightly/periodic maintenance primitives for a more efficient, dynamic memory.

The curator is conservative by default: dry_run=True only proposes actions.
When auto_apply=True it performs only safe, reversible metadata/bond updates.
It does not delete durable facts or rewrite markdown sources.
"""
from __future__ import annotations

import json
import re
import time
from collections import Counter, defaultdict
from typing import Any


DURABLE_TYPES = {"fact", "decision", "procedure", "preference", "project", "note"}
NOISE_DOMAIN_PREFIXES = ("daily/", "session/")


class CognitiveCurator:
    def __init__(self, db, engine, learning, auto_bond_engine, config: dict):
        self.db = db
        self.engine = engine
        self.learning = learning
        self.auto_bond_engine = auto_bond_engine
        self.config = config or {}
        self.curator_cfg = self.config.get("curator", {})

    # ─── STATUS ─────────────────────────────────────────────

    def status(self) -> dict[str, Any]:
        """Return compact cognitive health metrics for the memory graph."""
        now = int(time.time())
        with self.db.conn() as c:
            atom_total = c.execute("SELECT COUNT(*) n FROM atoms WHERE status='active'").fetchone()["n"]
            durable_total = c.execute(
                f"SELECT COUNT(*) n FROM atoms WHERE status='active' AND type IN ({','.join('?' for _ in DURABLE_TYPES)})",
                tuple(sorted(DURABLE_TYPES)),
            ).fetchone()["n"]
            bond_total = c.execute("SELECT COUNT(*) n FROM bonds").fetchone()["n"]
            pending = c.execute("SELECT COUNT(*) n FROM human_questions WHERE status='pending'").fetchone()["n"]
            answered = c.execute("SELECT COUNT(*) n FROM human_questions WHERE status='answered'").fetchone()["n"]
            missing_compact = c.execute(
                """SELECT COUNT(*) n FROM atoms
                   WHERE status='active' AND length(COALESCE(body,'')) >= ?
                     AND COALESCE(body_compact,'') = ''""",
                (self.curator_cfg.get("compact_min_body_chars", 1200),),
            ).fetchone()["n"]
            stale = c.execute(
                """SELECT COUNT(*) n FROM atoms
                   WHERE status='active' AND ? - accessed_at > ?""",
                (now, self.curator_cfg.get("stale_after_days", 180) * 86400),
            ).fetchone()["n"]
            isolated = c.execute(
                f"""SELECT COUNT(*) n
                    FROM atoms a
                    LEFT JOIN bonds b ON b.from_id=a.id OR b.to_id=a.id
                    WHERE a.status='active'
                      AND a.type IN ({','.join('?' for _ in DURABLE_TYPES)})
                      AND b.from_id IS NULL
                      AND a.domain NOT LIKE 'daily/%'
                      AND a.domain NOT LIKE 'session/%'""",
                tuple(sorted(DURABLE_TYPES)),
            ).fetchone()["n"]
            by_type = {
                r["type"]: r["n"]
                for r in c.execute(
                    "SELECT type, COUNT(*) n FROM atoms WHERE status='active' GROUP BY type ORDER BY n DESC"
                ).fetchall()
            }
            by_domain = [
                {"domain": r["domain"], "count": r["n"]}
                for r in c.execute(
                    """SELECT domain, COUNT(*) n FROM atoms WHERE status='active'
                       GROUP BY domain ORDER BY n DESC LIMIT 12"""
                ).fetchall()
            ]

        graph_density = round(bond_total / durable_total, 3) if durable_total else 0.0
        return {
            "atoms_active": atom_total,
            "durable_atoms": durable_total,
            "bonds": bond_total,
            "graph_density_bonds_per_durable_atom": graph_density,
            "isolated_durable_atoms": isolated,
            "pending_questions": pending,
            "answered_questions": answered,
            "long_atoms_missing_compact": missing_compact,
            "stale_atoms": stale,
            "by_type": by_type,
            "top_domains": by_domain,
            "recommendations": self._recommendations(
                isolated=isolated,
                pending=pending,
                missing_compact=missing_compact,
                graph_density=graph_density,
            ),
        }

    def _recommendations(self, isolated: int, pending: int, missing_compact: int, graph_density: float) -> list[str]:
        recs = []
        if pending:
            recs.append("Review/dismiss pending human questions before enabling scheduled learning.")
        if isolated > 20 or graph_density < 0.8:
            recs.append("Run curator_run(auto_apply=true) or suggest_bonds_all(auto_apply=true) to enrich the graph.")
        if missing_compact:
            recs.append("Generate body_compact for long atoms to speed future recall and summaries.")
        if not recs:
            recs.append("Memory graph looks healthy enough for scheduled curator runs.")
        return recs

    # ─── WORKING SET ────────────────────────────────────────

    def working_set(
        self,
        query: str,
        domain: str | None = None,
        limit: int = 8,
        graph_depth: int = 1,
    ) -> dict[str, Any]:
        """
        Build a task-oriented context pack: direct recall hits + graph neighbors
        + known error/preference/procedure hints.
        """
        focus = self.engine.recall(query, limit=limit, domain=domain, semantic=True)
        focus_ids = [a["id"] for a in focus]

        context_by_id: dict[str, dict] = {}
        edges = []
        for atom_id in focus_ids[: min(5, len(focus_ids))]:
            graph = self.db.search_graph(atom_id, depth=graph_depth)
            for node in graph.get("nodes", []):
                if node["id"] not in focus_ids:
                    context_by_id[node["id"]] = self._slim_atom(node)
            edges.extend(graph.get("edges", []))

        procedures = [a for a in focus if a.get("type") in ("procedure", "preference", "decision")]
        if len(procedures) < 3:
            extra = self.engine.recall(
                f"{query} procedure preference decision error",
                limit=5,
                domain=domain,
                semantic=True,
            )
            for a in extra:
                if a.get("type") in ("procedure", "preference", "decision") and a["id"] not in focus_ids:
                    procedures.append(a)

        return {
            "query": query,
            "domain": domain,
            "focus_atoms": [self._slim_atom(a) for a in focus],
            "context_atoms": list(context_by_id.values())[:limit],
            "key_procedures_decisions": [self._slim_atom(a) for a in procedures[:5]],
            "graph_edges": edges[:30],
            "usage_hint": "Use focus_atoms first; use context_atoms for adjacent facts; inspect full atom only when needed.",
        }

    # ─── CURATION ───────────────────────────────────────────

    def run(self, dry_run: bool = True, auto_apply: bool = False, max_atoms: int | None = None) -> dict[str, Any]:
        """
        Run one conservative curation pass.

        dry_run=True: only report proposed actions.
        auto_apply=True: apply safe body_compact and high-confidence rule bonds.
        """
        max_atoms = max_atoms or self.curator_cfg.get("max_atoms_per_run", 80)
        report = {
            "dry_run": dry_run,
            "auto_apply": auto_apply,
            "started_at": int(time.time()),
            "actions": [],
            "proof": {},
        }

        report["actions"].extend(self._compact_long_atoms(dry_run=dry_run or not auto_apply, max_atoms=max_atoms))
        report["actions"].append(self._bond_pass(dry_run=dry_run or not auto_apply, max_atoms=max_atoms))
        report["actions"].append(self._classify_isolated_atoms(dry_run=dry_run or not auto_apply, max_atoms=max_atoms))
        report["actions"].extend(self._propose_promotions(max_atoms=max_atoms))
        report["actions"].extend(self._propose_merges(max_atoms=max_atoms))

        # Learning is allowed to create pending questions only when not dry-run.
        if dry_run:
            report["actions"].append({"kind": "learning", "status": "skipped", "reason": "dry_run"})
        else:
            questions = self.learning.run_all_checks()
            report["actions"].append({
                "kind": "learning",
                "status": "ok",
                "new_questions": len(questions),
                "questions": [
                    {"id": q["id"], "type": q["question_type"], "question": q["question"][:160]}
                    for q in questions[:10]
                ],
            })

        report["finished_at"] = int(time.time())
        report["status_after"] = self.status()
        return report

    def _compact_long_atoms(self, dry_run: bool, max_atoms: int) -> list[dict[str, Any]]:
        min_chars = self.curator_cfg.get("compact_min_body_chars", 1200)
        actions = []
        with self.db.conn() as c:
            rows = c.execute(
                """SELECT * FROM atoms
                   WHERE status='active'
                     AND length(COALESCE(body,'')) >= ?
                     AND COALESCE(body_compact,'') = ''
                   ORDER BY weight DESC, access_count DESC
                   LIMIT ?""",
                (min_chars, max_atoms),
            ).fetchall()

        for row in rows:
            atom = dict(row)
            compact = self._extractive_compact(atom.get("body") or "")
            action = {
                "kind": "compact",
                "atom_id": atom["id"],
                "title": atom["title"],
                "chars_before": len(atom.get("body") or ""),
                "body_compact": compact,
                "applied": False,
            }
            if not dry_run and compact:
                self.db.update_atom(
                    atom["id"],
                    body_compact=compact,
                    changed_by="curator",
                    change_reason="Generated extractive body_compact",
                )
                action["applied"] = True
            actions.append(action)
        return actions

    def _bond_pass(self, dry_run: bool, max_atoms: int) -> dict[str, Any]:
        result = self.auto_bond_engine.suggest_bonds_all(
            auto_apply=not dry_run,
            limit_per_atom=self.curator_cfg.get("bond_limit_per_atom", 2),
            max_atoms=max_atoms,
        )
        result["kind"] = "bond_pass"
        result["applied"] = not dry_run
        return result

    def _classify_isolated_atoms(self, dry_run: bool, max_atoms: int) -> dict[str, Any]:
        """
        Classify isolated atoms without creating human pending questions.

        States:
        - needs_link: durable/important, worth connecting later
        - standalone_ok: explicitly allowed or naturally standalone
        - volatile_candidate: session/chat-like material, let TTL/digest handle it
        - archive_candidate: old, unaccessed isolated material
        """
        now = int(time.time())
        limit = min(max_atoms, self.curator_cfg.get("isolated_limit", 40))
        min_age = self.curator_cfg.get("isolated_min_age_days", 7) * 86400
        archive_after = self.curator_cfg.get("isolated_archive_after_days", 90) * 86400
        high_access = self.curator_cfg.get("isolated_high_access_threshold", 3)
        high_weight = self.curator_cfg.get("isolated_high_weight_threshold", 0.9)
        volatile_prefixes = tuple(self.curator_cfg.get("volatile_domain_prefixes", ["session/"]))
        standalone_types = set(self.curator_cfg.get("standalone_ok_types", ["preference"]))

        with self.db.conn() as c:
            rows = c.execute(
                """SELECT a.*
                   FROM atoms a
                   LEFT JOIN bonds b ON b.from_id = a.id OR b.to_id = a.id
                   WHERE a.status='active'
                     AND b.from_id IS NULL
                   ORDER BY a.weight DESC, a.access_count DESC, a.created_at ASC
                   LIMIT ?""",
                (limit * 3,),
            ).fetchall()

        buckets: dict[str, list[dict[str, Any]]] = {
            "needs_link": [],
            "standalone_ok": [],
            "volatile_candidate": [],
            "archive_candidate": [],
        }
        applied = 0

        for row in rows:
            atom = dict(row)
            state, reason = self._classify_one_isolated(
                atom,
                now=now,
                min_age=min_age,
                archive_after=archive_after,
                high_access=high_access,
                high_weight=high_weight,
                volatile_prefixes=volatile_prefixes,
                standalone_types=standalone_types,
            )
            item = {
                "id": atom["id"],
                "title": atom.get("title"),
                "domain": atom.get("domain"),
                "type": atom.get("type"),
                "weight": atom.get("weight"),
                "access_count": atom.get("access_count"),
                "reason": reason,
            }
            buckets[state].append(item)
            if not dry_run:
                self._set_isolated_meta(atom["id"], state, reason, now)
                applied += 1
            if sum(len(v) for v in buckets.values()) >= limit:
                break

        return {
            "kind": "isolated_classification",
            "applied": not dry_run,
            "updated_atoms": applied,
            "counts": {k: len(v) for k, v in buckets.items()},
            "samples": {k: v[:5] for k, v in buckets.items() if v},
            "policy": "No pending questions are created; curator observes, tags meta, and only later suggests links/archive candidates.",
        }

    def _classify_one_isolated(
        self,
        atom: dict,
        *,
        now: int,
        min_age: int,
        archive_after: int,
        high_access: int,
        high_weight: float,
        volatile_prefixes: tuple[str, ...],
        standalone_types: set[str],
    ) -> tuple[str, str]:
        domain = atom.get("domain") or ""
        atom_type = atom.get("type") or ""
        created_at = atom.get("created_at") or now
        accessed_at = atom.get("accessed_at") or created_at
        access_count = atom.get("access_count") or 0
        weight = atom.get("weight") or 0.0
        try:
            meta = json.loads(atom.get("meta") or "{}")
        except (TypeError, json.JSONDecodeError):
            meta = {}

        if meta.get("allow_isolated"):
            return "standalone_ok", "Human/previous review marked allow_isolated"
        if domain.startswith(volatile_prefixes) or atom_type == "session_msg":
            return "volatile_candidate", "Session/chat atom: let TTL/digest or promotion logic handle it"
        if atom_type in standalone_types:
            return "standalone_ok", f"Type '{atom_type}' can be naturally standalone"
        if now - accessed_at > archive_after and access_count == 0:
            return "archive_candidate", "Old isolated atom with no access"
        if now - created_at < min_age and access_count < high_access:
            return "volatile_candidate", "Too new and not reused yet; observe before asking"
        if weight >= high_weight or access_count >= high_access:
            return "needs_link", "Durable/high-signal isolated atom; curator should suggest bonds"
        return "standalone_ok", "Low-signal durable atom; keep as standalone unless it becomes reused"

    def _set_isolated_meta(self, atom_id: str, state: str, reason: str, now: int) -> None:
        with self.db.conn() as c:
            row = c.execute("SELECT meta FROM atoms WHERE id = ?", (atom_id,)).fetchone()
            if not row:
                return
            try:
                meta = json.loads(row["meta"] or "{}")
            except (TypeError, json.JSONDecodeError):
                meta = {}
            meta["isolated_state"] = state
            meta["isolated_reason"] = reason
            meta["isolated_reviewed_at"] = now
            c.execute(
                "UPDATE atoms SET meta = ?, updated_at = ? WHERE id = ?",
                (json.dumps(meta, ensure_ascii=False), now, atom_id),
            )

    def _propose_promotions(self, max_atoms: int) -> list[dict[str, Any]]:
        """Find recurring session/daily concepts worth promoting to durable facts."""
        token_counts: Counter[str] = Counter()
        examples: dict[str, list[str]] = defaultdict(list)
        with self.db.conn() as c:
            rows = c.execute(
                """SELECT id, title, domain FROM atoms
                   WHERE status='active'
                     AND (domain LIKE 'session/%' OR domain LIKE 'daily/%')
                   ORDER BY accessed_at DESC
                   LIMIT ?""",
                (max_atoms * 4,),
            ).fetchall()
        for r in rows:
            title = r["title"] or ""
            for phrase in self._candidate_phrases(title):
                token_counts[phrase] += 1
                if len(examples[phrase]) < 3:
                    examples[phrase].append(r["id"])
        actions = []
        threshold = self.curator_cfg.get("promotion_min_occurrences", 3)
        for phrase, count in token_counts.most_common(10):
            if count >= threshold:
                actions.append({
                    "kind": "promotion_candidate",
                    "phrase": phrase,
                    "occurrences": count,
                    "example_atom_ids": examples[phrase],
                    "recommendation": "Create or update a durable fact/procedure if this concept is still operationally useful.",
                    "applied": False,
                })
        return actions

    def _propose_merges(self, max_atoms: int) -> list[dict[str, Any]]:
        """Cheap duplicate detector by normalized title within durable atoms."""
        buckets: dict[str, list[dict]] = defaultdict(list)
        with self.db.conn() as c:
            rows = c.execute(
                f"""SELECT id, title, domain, type FROM atoms
                    WHERE status='active'
                      AND type IN ({','.join('?' for _ in DURABLE_TYPES)})
                    ORDER BY updated_at DESC
                    LIMIT ?""",
                (*tuple(sorted(DURABLE_TYPES)), max_atoms * 3),
            ).fetchall()
        for r in rows:
            key = self._norm_title(r["title"] or "")
            if len(key) >= 8:
                buckets[key].append(dict(r))
        actions = []
        for key, atoms in buckets.items():
            if len(atoms) > 1:
                actions.append({
                    "kind": "merge_candidate",
                    "normalized_title": key,
                    "atoms": atoms[:5],
                    "recommendation": "Review before merge; curator does not merge automatically.",
                    "applied": False,
                })
        return actions[:10]

    # ─── HELPERS ────────────────────────────────────────────

    def _extractive_compact(self, body: str, max_chars: int | None = None) -> str:
        max_chars = max_chars or self.curator_cfg.get("compact_max_chars", 600)
        lines = [ln.strip() for ln in body.splitlines() if ln.strip()]
        useful = []
        for ln in lines:
            if ln.startswith(("#", "-", "*")) or ":" in ln or len(ln) > 60:
                useful.append(re.sub(r"\s+", " ", ln))
            if len("\n".join(useful)) >= max_chars:
                break
        if not useful:
            useful = [re.sub(r"\s+", " ", body[:max_chars]).strip()]
        compact = "\n".join(useful)
        return compact[:max_chars].rstrip()

    def _candidate_phrases(self, title: str) -> list[str]:
        text = re.sub(r"\[[^\]]+\]", " ", title.lower())
        words = [w for w in re.findall(r"[a-z0-9_àèéìòù]+", text) if len(w) >= 4]
        stop = {"assistant", "user", "fatto", "questo", "quello", "sono", "come", "della", "degli", "nelle"}
        words = [w for w in words if w not in stop]
        phrases = []
        for n in (2, 3):
            for i in range(0, max(0, len(words) - n + 1)):
                phrases.append(" ".join(words[i:i+n]))
        return phrases[:8]

    def _norm_title(self, title: str) -> str:
        text = re.sub(r"\([^)]*\)", " ", title.lower())
        text = re.sub(r"20\d{2}[-_/]?\d{0,2}[-_/]?\d{0,2}", " ", text)
        words = re.findall(r"[a-z0-9_àèéìòù]+", text)
        return " ".join(words[:8])

    def _slim_atom(self, atom: dict) -> dict[str, Any]:
        body = atom.get("body_compact") or atom.get("body") or ""
        return {
            "id": atom.get("id"),
            "title": atom.get("title"),
            "domain": atom.get("domain"),
            "type": atom.get("type"),
            "confidence": atom.get("confidence"),
            "weight": atom.get("weight"),
            "match_kind": atom.get("match_kind"),
            "rank_score": atom.get("rank_score"),
            "snippet": body[:500],
        }
