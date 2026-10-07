/**
 * Memory Engine TS — Step 3 (backup/import/export) + Step 4 (learning).
 * Parity port of Python backup.py + learning.py; no Python residue.
 */
import { DatabaseSync } from "node:sqlite";
import { Type } from "typebox";
import * as fs from "node:fs";
import * as path from "node:path";
import { Learning } from "./learning.js";

const T = Type;

export interface MaintToolDef { name: string; description: string; parameters: any; execute: (a: any) => any }

export function buildMaintenanceDefs(db: DatabaseSync, dbPath: string): MaintToolDef[] {
  const q = (sql: string, ...p: any[]) => db.prepare(sql).all(...p) as any[];
  const q1 = (sql: string, ...p: any[]) => db.prepare(sql).get(...p) as any;
  const x = (sql: string, ...p: any[]) => db.prepare(sql).run(...p);
  const backupDir = path.join(path.dirname(dbPath), "backups");

  return [
    // ── STEP 3: BACKUP ────────────────────────────────
    {
      name: "memory_backup_database",
      description: "Create a SQLite backup (VACUUM INTO) with timestamp. Returns backup path and size.",
      parameters: T.Object({ label: T.Optional(T.String()) }),
      execute: (a: any) => {
        fs.mkdirSync(backupDir, { recursive: true });
        const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
        const dest = path.join(backupDir, "memory-backup-" + ts + (a.label ? "-" + a.label : "") + ".db");
        x("VACUUM INTO ?", dest);
        const stat = fs.statSync(dest);
        return { ok: true, path: dest, size_bytes: stat.size };
      },
    },
    {
      name: "memory_restore_database",
      description: "Restore from a backup file. DANGEROUS: overwrites current DB. Requires confirm=true.",
      parameters: T.Object({ backup_path: T.String(), confirm: T.Optional(T.Boolean()) }),
      execute: (a: any) => {
        if (!a.confirm) return { ok: false, reason: "confirm=true required for restore" };
        if (!fs.existsSync(a.backup_path)) return { ok: false, reason: "backup file not found" };
        fs.copyFileSync(a.backup_path, dbPath);
        return { ok: true, restored_from: a.backup_path, note: "Gateway restart required to reload the DB." };
      },
    },
    {
      name: "memory_list_backups",
      description: "List available backup files with sizes and dates.",
      parameters: T.Object({}),
      execute: () => {
        if (!fs.existsSync(backupDir)) return { backups: [] };
        return {
          backups: fs.readdirSync(backupDir).filter((f: string) => f.endsWith(".db")).map((f: string) => {
            const st = fs.statSync(path.join(backupDir, f));
            return { file: f, path: path.join(backupDir, f), size_bytes: st.size, created: st.mtime.toISOString() };
          }).sort((a: any, b: any) => b.created.localeCompare(a.created)),
        };
      },
    },
    {
      name: "memory_export_all",
      description: "Export all atoms + bonds to a JSON file. Returns file path and counts.",
      parameters: T.Object({ output_path: T.Optional(T.String()), include_deleted: T.Optional(T.Boolean()) }),
      execute: (a: any) => {
        const status = a.include_deleted ? "all" : "active";
        const atoms = status === "active" ? q("SELECT * FROM atoms WHERE status='active'") : q("SELECT * FROM atoms");
        const bonds = q("SELECT * FROM bonds");
        const data = { exported_at: new Date().toISOString(), version: "3.3.0", atoms, bonds };
        const out = a.output_path || path.join(path.dirname(dbPath), "memory-export-" + Date.now() + ".json");
        fs.writeFileSync(out, JSON.stringify(data, null, 2));
        return { ok: true, path: out, atoms: atoms.length, bonds: bonds.length };
      },
    },
    {
      name: "memory_export_atom",
      description: "Export a single atom (with bonds) to JSON. Returns the data.",
      parameters: T.Object({ atom_id: T.String() }),
      execute: (a: any) => {
        const atom = q1("SELECT * FROM atoms WHERE id=?", a.atom_id);
        if (!atom) return { error: "atom not found" };
        const bonds = q("SELECT * FROM bonds WHERE from_id=? OR to_id=?", a.atom_id, a.atom_id);
        return { atom, bonds };
      },
    },
    {
      name: "memory_import_data",
      description: "Import atoms from a JSON export file (merge mode: skip existing IDs). Returns import counts.",
      parameters: T.Object({ json_path: T.String() }),
      execute: (a: any) => {
        if (!fs.existsSync(a.json_path)) return { ok: false, reason: "file not found" };
        const data = JSON.parse(fs.readFileSync(a.json_path, "utf8"));
        if (!data.atoms) return { ok: false, reason: "no atoms in file" };
        let imported = 0, skipped = 0;
        for (const at of data.atoms) {
          const exists = q1("SELECT id FROM atoms WHERE id=?", at.id);
          if (exists) { skipped++; continue; }
          x("INSERT INTO atoms (id, type, memory_tier, domain, title, body, body_compact, confidence, status, source, weight, tags, meta, created_at, updated_at, accessed_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            at.id, at.type || "fact", at.memory_tier || "semantic", at.domain || "general", at.title || at.id, at.body || "", at.body_compact || "", at.confidence ?? 0.7, at.status || "active", at.source || "import", at.weight ?? 1.0, at.tags || "[]", at.meta || "{}", at.created_at || Math.floor(Date.now()/1000), Math.floor(Date.now()/1000), Math.floor(Date.now()/1000));
          imported++;
        }
        let bondsAdded = 0;
        if (data.bonds) for (const b of data.bonds) {
          x("INSERT OR IGNORE INTO bonds (from_id, to_id, relation, strength, evidence, created_at) VALUES (?,?,?,?,?,unixepoch())", b.from_id, b.to_id, b.relation, b.strength ?? 0.5, b.evidence || '{}');
          bondsAdded++;
        }
        return { ok: true, atoms_imported: imported, atoms_skipped: skipped, bonds_added: bondsAdded };
      },
    },
    {
      name: "memory_import_markdown",
      description: "Import atoms from a markdown file: each heading (##/###) becomes an atom, body is the content.",
      parameters: T.Object({ md_path: T.String(), domain: T.Optional(T.String()), default_type: T.Optional(T.String()) }),
      execute: (a: any) => {
        if (!fs.existsSync(a.md_path)) return { ok: false, reason: "file not found" };
        const text = fs.readFileSync(a.md_path, "utf8");
        const lines = text.split(chr(10));
        const domain = a.domain || "import/markdown";
        const defType = a.default_type || "fact";
        let imported = 0, currentTitle = "", currentBody: string[] = [];
        const flush = () => {
          if (!currentTitle) return;
          const id = currentTitle.toLowerCase().replace(/[^a-z0-9_]+/g, "_").slice(0, 50) + "_" + Date.now() + "_" + imported;
          x("INSERT INTO atoms (id, type, memory_tier, domain, title, body, confidence, status, source, weight, tags, meta, created_at, updated_at, accessed_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            id, defType, "semantic", domain, currentTitle, currentBody.join(chr(10)).trim(), 0.7, "active", "import:markdown", 1.0, "[]", JSON.stringify({ source_file: a.md_path }), Math.floor(Date.now()/1000), Math.floor(Date.now()/1000), Math.floor(Date.now()/1000));
          imported++;
        };
        for (const ln of lines) {
          const m = ln.match(/^(#{2,3}) (.+)/);
          if (m) { flush(); currentTitle = m[2].trim(); currentBody = []; }
          else if (currentTitle) currentBody.push(ln);
        }
        flush();
        return { ok: true, atoms_imported: imported, domain };
      },
    },
    // ── STEP 4: LEARNING (parità Python: 7 tipi + extras TS) ─────
    {
      name: "memory_learning_run",
      description: "Run learning checks (full Python parity): contradictions, weak atoms, merge candidates, decay critical, gaps (body vuoti), graph gaps (opt-in) + stale_fact/needs_link. Creates deduped human_questions; answers apply side effects.",
      parameters: T.Object({ dry_run: T.Optional(T.Boolean()) }),
      execute: (a: any) => {
        const learning = new Learning(db, ((globalThis as any).__meLearningCfg ?? {}));
        const created = a.dry_run ? [] : learning.runAllChecks();
        const now = Math.floor(Date.now() / 1000);
        const dupKey = (t: string, ids: string[]) => t + "|" + JSON.stringify([...ids].sort());
        const existing = new Set(q("SELECT question_type, atom_ids FROM human_questions WHERE status IN ('pending','answered','dismissed')").map((r: any) => { let ids: string[]; try { ids = JSON.parse(r.atom_ids || "[]"); } catch { ids = [r.atom_ids]; } return dupKey(r.question_type, ids); }));
        const extra: any[] = [];
        const stale = q("SELECT id, title FROM atoms WHERE status='active' AND type IN ('fact','decision','procedure') AND ? - accessed_at > ? LIMIT 5", now, 180 * 86400);
        for (const s of stale) { const k = dupKey("stale_fact", [s.id]); if (!existing.has(k)) { existing.add(k); extra.push({ question_type: "stale_fact", atom_id: s.id, question: "Is '" + s.title.slice(0, 60) + "' still accurate and needed?" }); } }
        const isolated = q("SELECT a.id, a.title FROM atoms a LEFT JOIN bonds b ON b.from_id=a.id OR b.to_id=a.id WHERE a.status='active' AND a.type IN ('fact','decision','procedure') AND b.from_id IS NULL AND a.domain NOT LIKE 'session/%' AND a.domain NOT LIKE 'daily/%' ORDER BY a.weight DESC LIMIT 5");
        for (const s of isolated) { const k = dupKey("needs_link", [s.id]); if (!existing.has(k)) { existing.add(k); extra.push({ question_type: "needs_link", atom_id: s.id, question: "Should '" + s.title.slice(0, 60) + "' be linked to related atoms?" }); } }
        let extraCreated = 0;
        if (!a.dry_run) {
          for (const qq of extra) {
            const id = "q_" + qq.question_type + "_" + qq.atom_id.slice(0, 30) + "_" + now;
            x("INSERT OR IGNORE INTO human_questions (id, atom_ids, question_type, question, status, created_at) VALUES (?,?,?,?,?,?)", id, JSON.stringify([qq.atom_id]), qq.question_type, qq.question, "pending", now);
            extraCreated++;
          }
        }
        return { dry_run: !!a.dry_run, questions_created: created.length + extraCreated, by_type: { python_parity: created.length, extras: extraCreated }, questions: [...created, ...extra].slice(0, 15) };
      },
    },
    {
      name: "memory_ask_pending",
      description: "List pending human questions for review.",
      parameters: T.Object({ limit: T.Optional(T.Number()) }),
      execute: (a: any) => q("SELECT * FROM human_questions WHERE status='pending' ORDER BY created_at DESC LIMIT ?", a.limit ?? 10),
    },
    {
      name: "memory_answer_human",
      description: "Answer a pending question: resolves it and optionally updates the linked atom status.",
      parameters: T.Object({ question_id: T.String(), answer: T.String(), action: T.Optional(T.String()) }),
      execute: (a: any) => {
        const row = q1("SELECT * FROM human_questions WHERE id=? AND status='pending'", a.question_id);
        if (!row) return { ok: false, reason: "question not found or not pending" };
        x("UPDATE human_questions SET status='answered', answer=?, answered_at=unixepoch() WHERE id=?", a.answer, a.question_id);
        // side-effects per tipo (parità Python learning.process_answer)
        let effects: string[] = [];
        try { effects = new Learning(db).applyAnswerSideEffects(row, a.answer); } catch (err: any) { effects = ["side-effect error: " + String(err?.message || err).slice(0, 120)]; }
        if (a.action === "archive_atom" && JSON.parse(row.atom_ids || "[]")[0]) x("UPDATE atoms SET status='archived', updated_at=unixepoch() WHERE id=?", JSON.parse(row.atom_ids || "[]")[0]);
        if (a.action === "delete_atom" && JSON.parse(row.atom_ids || "[]")[0]) x("UPDATE atoms SET status='deleted', updated_at=unixepoch() WHERE id=?", JSON.parse(row.atom_ids || "[]")[0]);
        return { ok: true, question_id: a.question_id, answer: a.answer, action: a.action || "resolve_only", side_effects: effects };
      },
    },
  ];
}

const chr = (c: number) => String.fromCharCode(c);
