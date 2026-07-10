"""
Memory Engine — Database Layer
SQLite CRUD, FTS search, graph operations.
"""
import sqlite3
import json
import uuid
import time
import re
from pathlib import Path
from typing import Optional
from contextlib import contextmanager


SCHEMA_PATH = Path(__file__).parent / "schema.sql"


class DB:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._init_db()

    @contextmanager
    def conn(self):
        c = sqlite3.connect(self.db_path, timeout=10)
        c.row_factory = sqlite3.Row
        c.execute("PRAGMA foreign_keys = ON")
        c.execute("PRAGMA journal_mode = WAL")
        c.execute("PRAGMA busy_timeout = 5000")
        try:
            yield c
            c.commit()
        except Exception:
            c.rollback()
            raise
        finally:
            c.close()

    def _init_db(self):
        schema = SCHEMA_PATH.read_text()
        with self.conn() as c:
            c.executescript(schema)
        # Migrations: add columns introduced after initial release
        self._migrate()

    # ─── MIGRATIONS ──────────────────────────────────────────

    def _migrate(self):
        """Add columns introduced after the initial release (idempotent)."""
        migrations = [
            ("content_hash", "TEXT"),
        ]
        with self.conn() as c:
            for col, coltype in migrations:
                # Check if column exists
                cols = [r[1] for r in c.execute("PRAGMA table_info(atoms)").fetchall()]
                if col not in cols:
                    c.execute(f"ALTER TABLE atoms ADD COLUMN {col} {coltype}")
                    logger_obj = __import__('logging').getLogger('db')
                    logger_obj.info("Migration: added column atoms.%s", col)
            # Index on content_hash for fast dedup
            c.execute(
                "CREATE INDEX IF NOT EXISTS idx_atoms_content_hash ON atoms(content_hash)"
            )

    # ─── ATOMS ───────────────────────────────────────────────

    def create_atom(
        self,
        title: str,
        body: str = "",
        type: str = "fact",
        domain: str = "general",
        confidence: float = 0.5,
        tags: list[str] | None = None,
        source: str = "ai",
        source_path: str | None = None,
        ttl: int | None = None,
        meta: dict | None = None,
        atom_id: str | None = None,
        content_hash: str | None = None,
    ) -> dict:
        atom_id = atom_id or self._slug(title) or str(uuid.uuid4())[:8]
        tags_json = json.dumps(tags or [])
        meta_json = json.dumps(meta or {})
        now = int(time.time())

        with self.conn() as c:
            # Version existing atom if update
            existing = c.execute("SELECT * FROM atoms WHERE id = ?", (atom_id,)).fetchone()
            if existing:
                return self.update_atom(atom_id, title=title, body=body, confidence=confidence)

            c.execute(
                """INSERT INTO atoms 
                   (id, type, domain, title, body, confidence, source, source_path, 
                    ttl, tags, meta, created_at, updated_at, accessed_at, content_hash)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (atom_id, type, domain, title, body, confidence, source, source_path,
                 ttl, tags_json, meta_json, now, now, now, content_hash),
            )
            # Save initial version
            c.execute(
                "INSERT INTO atom_versions (atom_id, version, title, body, changed_by) VALUES (?, ?, ?, ?, ?)",
                (atom_id, 1, title, body, source),
            )
        return self.get_atom(atom_id)

    def update_atom(
        self,
        atom_id: str,
        title: str | None = None,
        body: str | None = None,
        body_compact: str | None = None,
        confidence: float | None = None,
        weight: float | None = None,
        status: str | None = None,
        type: str | None = None,
        domain: str | None = None,
        tags: list[str] | None = None,
        meta: dict | None = None,
        changed_by: str = "ai",
        change_reason: str | None = None,
    ) -> dict | None:
        now = int(time.time())

        with self.conn() as c:
            row = c.execute("SELECT * FROM atoms WHERE id = ?", (atom_id,)).fetchone()
            if not row:
                raise KeyError(f"Atom '{atom_id}' not found")

            # Save version before update
            ver_row = c.execute(
                "SELECT MAX(version) as v FROM atom_versions WHERE atom_id = ?", (atom_id,)
            ).fetchone()
            next_ver = (ver_row["v"] or 0) + 1
            c.execute(
                "INSERT INTO atom_versions (atom_id, version, title, body, changed_by, change_reason) VALUES (?, ?, ?, ?, ?, ?)",
                (atom_id, next_ver, row["title"], row["body"], changed_by, change_reason),
            )

            updates = []
            params = []
            for field, val in [
                ("title", title), ("body", body), ("body_compact", body_compact),
                ("confidence", confidence), ("weight", weight), ("status", status),
                ("type", type), ("domain", domain),
            ]:
                if val is not None:
                    updates.append(f"{field} = ?")
                    params.append(val)
            if tags is not None:
                updates.append("tags = ?")
                params.append(json.dumps(tags))
            if meta is not None:
                updates.append("meta = ?")
                params.append(json.dumps(meta))
            updates.append("updated_at = ?")
            params.append(now)
            params.append(atom_id)

            c.execute(f"UPDATE atoms SET {', '.join(updates)} WHERE id = ?", params)

        return self.get_atom(atom_id)

    def get_atom(self, atom_id: str) -> dict | None:
        with self.conn() as c:
            row = c.execute("SELECT * FROM atoms WHERE id = ?", (atom_id,)).fetchone()
            if not row:
                return None
            atom = dict(row)
            atom["tags"] = json.loads(atom.get("tags") or "[]")
            atom["meta"] = json.loads(atom.get("meta") or "{}")
            # Bump access
            c.execute(
                "UPDATE atoms SET accessed_at = ?, access_count = access_count + 1 WHERE id = ?",
                (int(time.time()), atom_id),
            )
            # Get bonds
            bonds_out = c.execute(
                "SELECT to_id, relation, strength, evidence FROM bonds WHERE from_id = ?", (atom_id,)
            ).fetchall()
            bonds_in = c.execute(
                "SELECT from_id, relation, strength, evidence FROM bonds WHERE to_id = ?", (atom_id,)
            ).fetchall()
            atom["bonds_out"] = [dict(b) for b in bonds_out]
            atom["bonds_in"] = [dict(b) for b in bonds_in]
            return atom

    def delete_atom(self, atom_id: str) -> bool:
        with self.conn() as c:
            cur = c.execute("DELETE FROM atoms WHERE id = ?", (atom_id,))
            return cur.rowcount > 0

    def list_atoms(
        self,
        domain: str | None = None,
        type: str | None = None,
        status: str = "active",
        limit: int = 50,
        order_by: str = "weight",
    ) -> list[dict]:
        query = "SELECT * FROM atoms WHERE status = ?"
        params: list = [status]
        if domain:
            query += " AND domain = ?"
            params.append(domain)
        if type:
            query += " AND type = ?"
            params.append(type)
        query += f" ORDER BY {order_by} DESC LIMIT ?"
        params.append(limit)
        with self.conn() as c:
            rows = c.execute(query, params).fetchall()
            return [dict(r) for r in rows]

    # ─── SEARCH ──────────────────────────────────────────────

    def search_fts(self, query: str, limit: int = 10) -> list[dict]:
        """Full-text search with BM25 ranking."""
        # Escape FTS special chars
        clean = re.sub(r'["\'\*\:\(\)\-\^]', " ", query).strip()
        if not clean:
            return []
        fts_query = " OR ".join(f'"{w}"*' for w in clean.split() if len(w) > 1)
        if not fts_query:
            return []

        with self.conn() as c:
            rows = c.execute(
                """SELECT a.*, bm25(atoms_fts) as fts_score
                   FROM atoms_fts 
                   JOIN atoms a ON atoms_fts.rowid = a.rowid
                   WHERE atoms_fts MATCH ? AND a.status = 'active'
                   ORDER BY fts_score
                   LIMIT ?""",
                (fts_query, limit),
            ).fetchall()
            return [dict(r) for r in rows]

    # ─── BONDS ───────────────────────────────────────────────

    def create_bond(
        self,
        from_id: str,
        to_id: str,
        relation: str,
        strength: float = 0.5,
        evidence: str | None = None,
    ) -> bool:
        with self.conn() as c:
            # Verify both atoms exist
            for aid in (from_id, to_id):
                if not c.execute("SELECT 1 FROM atoms WHERE id = ?", (aid,)).fetchone():
                    raise KeyError(f"Atom '{aid}' not found")
            c.execute(
                """INSERT OR REPLACE INTO bonds (from_id, to_id, relation, strength, evidence)
                   VALUES (?, ?, ?, ?, ?)""",
                (from_id, to_id, relation, strength, evidence),
            )
            return True

    def delete_bond(self, from_id: str, to_id: str, relation: str) -> bool:
        with self.conn() as c:
            cur = c.execute(
                "DELETE FROM bonds WHERE from_id = ? AND to_id = ? AND relation = ?",
                (from_id, to_id, relation),
            )
            return cur.rowcount > 0

    def get_bonds(self, atom_id: str, direction: str = "both") -> list[dict]:
        with self.conn() as c:
            results = []
            if direction in ("out", "both"):
                rows = c.execute(
                    """SELECT to_id as target, relation, strength, evidence 
                       FROM bonds WHERE from_id = ?""", (atom_id,)
                ).fetchall()
                results.extend(dict(r) for r in rows)
            if direction in ("in", "both"):
                rows = c.execute(
                    """SELECT from_id as target, relation, strength, evidence 
                       FROM bonds WHERE to_id = ?""", (atom_id,)
                ).fetchall()
                results.extend(dict(r) for r in rows)
            return results

    def search_graph(self, atom_id: str, depth: int = 2, relation: str | None = None) -> dict:
        """BFS traversal of the knowledge graph."""
        visited = set()
        result_nodes = []
        result_edges = []
        queue = [(atom_id, 0)]

        with self.conn() as c:
            while queue:
                current_id, current_depth = queue.pop(0)
                if current_id in visited or current_depth > depth:
                    continue
                visited.add(current_id)

                atom = c.execute("SELECT * FROM atoms WHERE id = ?", (current_id,)).fetchone()
                if atom:
                    result_nodes.append(dict(atom))

                if current_depth < depth:
                    if relation:
                        rows = c.execute(
                            "SELECT * FROM bonds WHERE from_id = ? AND relation = ?",
                            (current_id, relation),
                        ).fetchall()
                    else:
                        rows = c.execute(
                            "SELECT * FROM bonds WHERE from_id = ?", (current_id,)
                        ).fetchall()
                    for b in rows:
                        bd = dict(b)
                        result_edges.append(bd)
                        if b["to_id"] not in visited:
                            queue.append((b["to_id"], current_depth + 1))
        return {"nodes": result_nodes, "edges": result_edges}

    # ─── MERGE ───────────────────────────────────────────────

    def merge_atoms(self, primary_id: str, secondary_id: str, merged_by: str = "ai") -> dict:
        """Merge secondary into primary. Secondary gets status='merged'."""
        with self.conn() as c:
            primary = c.execute("SELECT * FROM atoms WHERE id = ?", (primary_id,)).fetchone()
            secondary = c.execute("SELECT * FROM atoms WHERE id = ?", (secondary_id,)).fetchone()
            if not primary or not secondary:
                raise KeyError("Both atoms must exist")

            # Rebond: move all bonds from secondary to primary
            for b in c.execute("SELECT * FROM bonds WHERE from_id = ?", (secondary_id,)).fetchall():
                if b["to_id"] != primary_id:
                    c.execute(
                        """INSERT OR IGNORE INTO bonds (from_id, to_id, relation, strength, evidence)
                           VALUES (?, ?, ?, ?, ?)""",
                        (primary_id, b["to_id"], b["relation"], b["strength"], b["evidence"]),
                    )
            for b in c.execute("SELECT * FROM bonds WHERE to_id = ?", (secondary_id,)).fetchall():
                if b["from_id"] != primary_id:
                    c.execute(
                        """INSERT OR IGNORE INTO bonds (from_id, to_id, relation, strength, evidence)
                           VALUES (?, ?, ?, ?, ?)""",
                        (b["from_id"], primary_id, b["relation"], b["strength"], b["evidence"]),
                    )

            # Bond them
            c.execute(
                """INSERT OR IGNORE INTO bonds (from_id, to_id, relation, strength, evidence)
                   VALUES (?, ?, 'derived_from', 1.0, 'Merged atom')""",
                (primary_id, secondary_id),
            )

            # Mark secondary as merged
            c.execute(
                "UPDATE atoms SET status = 'merged', updated_at = ? WHERE id = ?",
                (int(time.time()), secondary_id),
            )
            # Bump primary confidence
            new_conf = min(1.0, primary["confidence"] + 0.1)
            c.execute(
                "UPDATE atoms SET confidence = ?, updated_at = ? WHERE id = ?",
                (new_conf, int(time.time()), primary_id),
            )

        return self.get_atom(primary_id)

    # ─── DECAY ───────────────────────────────────────────────

    def run_decay(self, interval_days: int = 30, factor: float = 0.95) -> int:
        """Reduce weight of atoms not accessed in interval_days. Returns count affected."""
        cutoff = int(time.time()) - (interval_days * 86400)
        with self.conn() as c:
            rows = c.execute(
                "SELECT id, weight FROM atoms WHERE status = 'active' AND accessed_at < ? AND weight > 0.01",
                (cutoff,),
            ).fetchall()
            count = 0
            for r in rows:
                new_weight = round(r["weight"] * factor, 4)
                c.execute(
                    "UPDATE atoms SET weight = ?, updated_at = ? WHERE id = ?",
                    (new_weight, int(time.time()), r["id"]),
                )
                count += 1
            return count

    # ─── ERROR MEMORY ────────────────────────────────────────

    def log_error(
        self,
        task_type: str,
        error_category: str,
        mistake_description: str,
        correction: str,
        severity: str = "minor",
        conversation_id: str | None = None,
        meta: dict | None = None,
    ) -> dict:
        """Log an error or increment occurrence if same error exists."""
        import hashlib
        # Dedup key: task_type + error_category + mistake (normalized)
        dedup_key = hashlib.md5(
            f"{task_type}|{error_category}|{mistake_description.lower().strip()}".encode()
        ).hexdigest()[:12]

        now = int(time.time())
        with self.conn() as c:
            existing = c.execute(
                "SELECT * FROM error_memory WHERE id = ?", (dedup_key,)
            ).fetchone()

            if existing:
                new_count = existing["occurrence_count"] + 1
                c.execute(
                    """UPDATE error_memory 
                       SET occurrence_count = ?, last_occurrence = ?, updated_at = ?,
                           correction = ?, severity = ?, is_resolved = 0
                       WHERE id = ?""",
                    (new_count, now, now, correction, severity, dedup_key),
                )
                row = c.execute(
                    "SELECT * FROM error_memory WHERE id = ?", (dedup_key,)
                ).fetchone()
                result = dict(row)
                result["upgraded_to_preference"] = new_count >= 3
                return result

            c.execute(
                """INSERT INTO error_memory 
                   (id, task_type, error_category, mistake_description, correction,
                    severity, occurrence_count, last_occurrence, conversation_id, meta,
                    created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)""",
                (dedup_key, task_type, error_category, mistake_description,
                 correction, severity, now, conversation_id,
                 json.dumps(meta or {}), now, now),
            )
            row = c.execute(
                "SELECT * FROM error_memory WHERE id = ?", (dedup_key,)
            ).fetchone()
            return dict(row)

    def check_errors(self, task_description: str, limit: int = 5) -> list[dict]:
        """Search unresolved errors matching a task description.
        Splits the query into words and matches any combination."""
        words = [w for w in task_description.lower().split() if len(w) >= 3]
        if not words:
            words = [task_description.lower()]
        with self.conn() as c:
            conditions = []
            params = []
            for w in words:
                conditions.append(
                    "(task_type LIKE ? OR mistake_description LIKE ? OR error_category LIKE ? OR correction LIKE ?)"
                )
                pat = f"%{w}%"
                params.extend([pat, pat, pat, pat])
            where_clause = " OR ".join(conditions) if len(conditions) > 1 else conditions[0]
            rows = c.execute(
                f"""SELECT * FROM error_memory 
                   WHERE is_resolved = 0 
                   AND ({where_clause})
                   ORDER BY occurrence_count DESC, last_occurrence DESC 
                   LIMIT ?""",
                (*params, limit),
            ).fetchall()
            return [dict(r) for r in rows]

    def list_errors(self, resolved: bool = False, limit: int = 20) -> list[dict]:
        """List errors, optionally filtered by resolution status."""
        with self.conn() as c:
            rows = c.execute(
                """SELECT * FROM error_memory 
                   WHERE is_resolved = ? 
                   ORDER BY occurrence_count DESC, last_occurrence DESC 
                   LIMIT ?""",
                (1 if resolved else 0, limit),
            ).fetchall()
            return [dict(r) for r in rows]

    def resolve_error(self, error_id: str, atom_id: str | None = None) -> dict | None:
        """Mark an error as resolved, optionally linking to a preference atom."""
        now = int(time.time())
        with self.conn() as c:
            row = c.execute(
                "SELECT * FROM error_memory WHERE id = ?", (error_id,)
            ).fetchone()
            if not row:
                return None
            c.execute(
                """UPDATE error_memory 
                   SET is_resolved = 1, resolved_to_atom_id = ?, updated_at = ?
                   WHERE id = ?""",
                (atom_id, now, error_id),
            )
            return dict(c.execute(
                "SELECT * FROM error_memory WHERE id = ?", (error_id,)
            ).fetchone())

    # ─── PREFERENCES ─────────────────────────────────────────

    def search_preferences(
        self,
        category: str | None = None,
        query: str | None = None,
        scope: str | None = None,
        limit: int = 20,
    ) -> list[dict]:
        """
        Search preference atoms by structured metadata.
        Uses JSON1 functions on the meta column.
        """
        sql = """SELECT * FROM atoms WHERE type = 'preference' AND status = 'active'"""
        params = []

        if category:
            sql += " AND json_extract(meta, '$.category') = ?"
            params.append(category)

        if scope:
            sql += " AND json_extract(meta, '$.scope') = ?"
            params.append(scope)

        if query:
            sql += " AND (title LIKE ? OR body LIKE ? OR json_extract(meta, '$.rule') LIKE ? OR json_extract(meta, '$.condition') LIKE ?)"
            q = f"%{query}%"
            params.extend([q, q, q, q])

        sql += " ORDER BY confidence DESC, weight DESC LIMIT ?"
        params.append(limit)

        with self.conn() as c:
            rows = c.execute(sql, params).fetchall()
            return [dict(r) for r in rows]

    # ─── STATS ───────────────────────────────────────────────

    def stats(self) -> dict:
        with self.conn() as c:
            total = c.execute("SELECT COUNT(*) as n FROM atoms").fetchone()["n"]
            active = c.execute("SELECT COUNT(*) as n FROM atoms WHERE status = 'active'").fetchone()["n"]
            merged = c.execute("SELECT COUNT(*) as n FROM atoms WHERE status = 'merged'").fetchone()["n"]
            archived = c.execute("SELECT COUNT(*) as n FROM atoms WHERE status = 'archived'").fetchone()["n"]
            bonds = c.execute("SELECT COUNT(*) as n FROM bonds").fetchone()["n"]
            pending_q = c.execute("SELECT COUNT(*) as n FROM human_questions WHERE status = 'pending'").fetchone()["n"]
            domains = c.execute(
                "SELECT domain, COUNT(*) as n FROM atoms WHERE status = 'active' GROUP BY domain ORDER BY n DESC"
            ).fetchall()
            types = c.execute(
                "SELECT type, COUNT(*) as n FROM atoms WHERE status = 'active' GROUP BY type ORDER BY n DESC"
            ).fetchall()
            avg_weight = c.execute(
                "SELECT ROUND(AVG(weight), 3) as w FROM atoms WHERE status = 'active'"
            ).fetchone()["w"]
            low_conf = c.execute(
                "SELECT COUNT(*) as n FROM atoms WHERE status = 'active' AND confidence < 0.4"
            ).fetchone()["n"]
            return {
                "total_atoms": total,
                "active": active,
                "merged": merged,
                "archived": archived,
                "bonds": bonds,
                "pending_questions": pending_q,
                "avg_weight": avg_weight or 0,
                "low_confidence_count": low_conf,
                "by_domain": {r["domain"]: r["n"] for r in domains},
                "by_type": {r["type"]: r["n"] for r in types},
            }

    # ─── QUESTIONS ───────────────────────────────────────────

    def add_question(
        self,
        atom_ids: list[str],
        question_type: str,
        question: str,
        options: list[str] | None = None,
        meta: dict | None = None,
    ) -> dict:
        qid = str(uuid.uuid4())[:8]
        with self.conn() as c:
            c.execute(
                """INSERT INTO human_questions (id, atom_ids, question_type, question, options, meta)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (qid, json.dumps(atom_ids), question_type, question,
                 json.dumps(options or []), json.dumps(meta or {})),
            )
        with self.conn() as c:
            return dict(c.execute("SELECT * FROM human_questions WHERE id = ?", (qid,)).fetchone())

    def get_pending_questions(self, limit: int = 10) -> list[dict]:
        with self.conn() as c:
            rows = c.execute(
                """SELECT * FROM human_questions WHERE status = 'pending' 
                   ORDER BY created_at DESC LIMIT ?""",
                (limit,),
            ).fetchall()
            return [dict(r) for r in rows]

    def answer_question(self, qid: str, answer: str) -> dict | None:
        now = int(time.time())
        with self.conn() as c:
            row = c.execute("SELECT * FROM human_questions WHERE id = ?", (qid,)).fetchone()
            if not row:
                return None
            c.execute(
                "UPDATE human_questions SET status = 'answered', answer = ?, answered_at = ? WHERE id = ?",
                (answer, now, qid),
            )
            return dict(c.execute("SELECT * FROM human_questions WHERE id = ?", (qid,)).fetchone())

    def dismiss_question(self, qid: str) -> bool:
        with self.conn() as c:
            cur = c.execute(
                "UPDATE human_questions SET status = 'dismissed', answered_at = ? WHERE id = ?",
                (int(time.time()), qid),
            )
            return cur.rowcount > 0

    # ─── UTILS ───────────────────────────────────────────────

    def _slug(self, text: str) -> str:
        """Create a readable slug from title."""
        slug = re.sub(r"[^a-zA-Z0-9_\s]", "", text.lower()).strip()
        slug = re.sub(r"[\s_]+", "_", slug)[:60]
        if not slug:
            return ""
        # Ensure uniqueness
        with self.conn() as c:
            existing = c.execute("SELECT id FROM atoms WHERE id = ?", (slug,)).fetchone()
            if existing:
                slug = f"{slug}_{str(uuid.uuid4())[:4]}"
        return slug
