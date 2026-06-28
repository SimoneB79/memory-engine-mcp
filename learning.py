"""
Memory Engine — Learning Module
Generates human-facing questions from detected patterns.
"""
import json
from db import DB
from engine import Engine


class Learning:
    def __init__(self, db: DB, engine: Engine, config: dict):
        self.db = db
        self.engine = engine
        self.config = config
        self.max_pending = config.get("learning", {}).get("max_pending_questions", 20)

    def run_all_checks(self) -> list[dict]:
        """
        Run all learning triggers and create questions for new findings.
        Returns list of newly created questions.
        """
        # Don't spam questions
        pending = self.db.get_pending_questions(limit=100)
        if len(pending) >= self.max_pending:
            return []

        existing_keys = set()
        for q in pending:
            key = (q["question_type"], q["atom_ids"])
            existing_keys.add(key)

        new_questions = []

        # 1. Contradictions
        for c in self.engine.detect_contradictions():
            atom_ids = json.dumps(sorted([c["atom_a"], c["atom_b"]]))
            key = ("contradiction", atom_ids)
            if key not in existing_keys:
                q = self.db.add_question(
                    atom_ids=[c["atom_a"], c["atom_b"]],
                    question_type="contradiction",
                    question=(
                        f"I found two potentially conflicting pieces of information:\n"
                        f"• {c['title_a']}\n"
                        f"• {c['title_b']}\n"
                        f"Similarity: {c['similarity']}. Which one is correct, or should they be unified?"
                    ),
                    options=[c["title_a"], c["title_b"], "Both correct (different contexts)"],
                    meta={"similarity": c["similarity"]},
                )
                new_questions.append(q)
                existing_keys.add(key)

        # 2. Weak atoms (low confidence, high access)
        for w in self.engine.detect_weak_atoms():
            key = ("weak", json.dumps([w["id"]]))
            if key not in existing_keys:
                q = self.db.add_question(
                    atom_ids=[w["id"]],
                    question_type="weak",
                    question=(
                        f"'{w['title']}' is accessed frequently ({w['access_count']} times) "
                        f"but has low confidence ({w['confidence']}). "
                        f"Can you confirm this is correct?"
                    ),
                    options=["Yes, correct", "No, needs correction", "Not sure"],
                    meta={"confidence": w["confidence"], "access_count": w["access_count"]},
                )
                new_questions.append(q)
                existing_keys.add(key)

        # 3. Merge candidates
        for m in self.engine.detect_merge_candidates():
            atom_ids = json.dumps(sorted([m["atom_a"], m["atom_b"]]))
            key = ("merge_candidate", atom_ids)
            if key not in existing_keys:
                q = self.db.add_question(
                    atom_ids=[m["atom_a"], m["atom_b"]],
                    question_type="merge_candidate",
                    question=(
                        f"These two atoms appear to be duplicates (similarity {m['similarity']}):\n"
                        f"• {m['title_a']}\n"
                        f"• {m['title_b']}\n"
                        f"Should I merge them?"
                    ),
                    options=["Yes, merge", "No, they are different"],
                    meta={"similarity": m["similarity"]},
                )
                new_questions.append(q)
                existing_keys.add(key)

        # 4. Decay critical
        for d in self.engine.detect_decay_critical():
            key = ("decay_critical", json.dumps([d["id"]]))
            if key not in existing_keys:
                q = self.db.add_question(
                    atom_ids=[d["id"]],
                    question_type="decay_critical",
                    question=(
                        f"'{d['title']}' hasn't been accessed in a while "
                        f"(weight: {d['weight']:.3f}). Should I archive it, or is it still relevant?"
                    ),
                    options=["Archive", "Still relevant, boost weight", "Delete"],
                    meta={"weight": d["weight"]},
                )
                new_questions.append(q)
                existing_keys.add(key)

        # 5. Gaps
        for g in self.engine.detect_gaps():
            key = ("gap", json.dumps([g["id"]]))
            if key not in existing_keys:
                q = self.db.add_question(
                    atom_ids=[g["id"]],
                    question_type="gap",
                    question=(
                        f"'{g['title']}' has incomplete information. "
                        f"Can you provide more details?"
                    ),
                    options=[],
                    meta={"body_length": len(g.get("body") or "")},
                )
                new_questions.append(q)
                existing_keys.add(key)

        return new_questions

    def get_pending(self, limit: int = 10) -> list[dict]:
        """Get pending human questions, formatted for display."""
        questions = self.db.get_pending_questions(limit=limit)
        result = []
        for q in questions:
            result.append({
                "id": q["id"],
                "type": q["question_type"],
                "question": q["question"],
                "options": json.loads(q.get("options") or "[]"),
                "atom_ids": json.loads(q.get("atom_ids") or "[]"),
                "created_at": q["created_at"],
            })
        return result

    def process_answer(self, qid: str, answer: str) -> dict:
        """
        Process human answer: update the question AND apply side effects
        on atoms based on the question type and answer.
        """
        with self.db.conn() as c:
            q = c.execute("SELECT * FROM human_questions WHERE id = ?", (qid,)).fetchone()
            if not q:
                raise KeyError(f"Question '{qid}' not found")
            q = dict(q)

        result = self.db.answer_question(qid, answer)

        atom_ids = json.loads(q.get("atom_ids") or "[]")
        answer_lower = answer.lower()

        if q["question_type"] == "weak":
            if "correct" in answer_lower or "yes" in answer_lower:
                # Boost confidence
                for aid in atom_ids:
                    self.db.update_atom(aid, confidence=0.9, changed_by="human",
                                        change_reason=f"Confirmed: {answer}")
            elif "correction" in answer_lower or "no" in answer_lower:
                for aid in atom_ids:
                    self.db.update_atom(aid, confidence=0.2, changed_by="human",
                                        change_reason=f"Rejected: {answer}")

        elif q["question_type"] == "decay_critical":
            if "archive" in answer_lower:
                for aid in atom_ids:
                    self.db.update_atom(aid, status="archived", changed_by="human",
                                        change_reason="Archived by user")
            elif "relevant" in answer_lower or "boost" in answer_lower:
                for aid in atom_ids:
                    self.db.update_atom(aid, weight=1.0, changed_by="human",
                                        change_reason="Marked relevant by user")
            elif "delete" in answer_lower:
                for aid in atom_ids:
                    self.db.update_atom(aid, status="archived", changed_by="human",
                                        change_reason="Deleted by user (marked archived)")

        elif q["question_type"] == "merge_candidate":
            if "merge" in answer_lower or "yes" in answer_lower:
                if len(atom_ids) >= 2:
                    self.db.merge_atoms(atom_ids[0], atom_ids[1], merged_by="human")

        elif q["question_type"] == "contradiction":
            # Human resolved contradiction — update confidence accordingly
            if len(atom_ids) >= 2:
                if atom_ids[0] in answer or "both" in answer_lower:
                    pass  # Both correct, no change needed
                # Store answer as meta on both atoms
                for aid in atom_ids:
                    with self.db.conn() as c:
                        atom = c.execute("SELECT meta FROM atoms WHERE id = ?", (aid,)).fetchone()
                        if atom:
                            meta = json.loads(atom["meta"] or "{}")
                            meta["contradiction_resolution"] = answer
                            c.execute("UPDATE atoms SET meta = ? WHERE id = ?",
                                      (json.dumps(meta), aid))

        elif q["question_type"] == "gap":
            # Human provided more info — append to body
            for aid in atom_ids:
                with self.db.conn() as c:
                    atom = c.execute("SELECT body FROM atoms WHERE id = ?", (aid,)).fetchone()
                    if atom:
                        new_body = (atom["body"] or "") + f"\n\n[Human补充]: {answer}"
                        c.execute("UPDATE atoms SET body = ?, updated_at = ? WHERE id = ?",
                                  (new_body, int(__import__("time").time()), aid))

        return result or {"status": "answered", "qid": qid, "answer": answer}
