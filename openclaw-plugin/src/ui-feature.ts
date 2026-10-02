import { DatabaseSync } from "node:sqlite";
import { contract } from "./ui-contract.js";
import { Curator } from "./curator.js";
import { Engine } from "./engine.js";
import * as fs from "node:fs";
import * as path from "node:path";

export function createFeatureHandlers() {
    const dbPath = process.env.MEMORY_DB_PATH ?? "/data/memory.db";
    const db = new DatabaseSync(dbPath);
    const engine = new Engine(db, {});
    const curator = new Curator(db, engine, {});
    const q = (sql: string, ...p: any[]) => db.prepare(sql).all(...p) as any[];
    const q1 = (sql: string, ...p: any[]) => db.prepare(sql).get(...p) as any;
    const x = (sql: string, ...p: any[]) => db.prepare(sql).run(...p);

    function getSettings() {
        try {
            db.prepare("CREATE TABLE IF NOT EXISTS plugin_settings (key TEXT PRIMARY KEY, value TEXT)").run();
            const rows: any = {};
            for (const r of q("SELECT key, value FROM plugin_settings")) rows[r.key] = r.value;
            return rows;
        } catch { return {} as any; }
    }
    const curatorReport = (report: any) => ({
        compact: report.actions.filter((a: any) => a.kind === "compact").length,
        bonds_suggested: report.actions.find((a: any) => a.kind === "bond_pass")?.suggestions ?? 0,
        bonds_applied: report.actions.find((a: any) => a.kind === "bond_pass")?.bonds_applied ?? 0,
        isolated_classified: (() => { const iso = report.actions.find((a: any) => a.kind === "isolated_classification"); return iso ? Number(Object.values(iso.counts).reduce((n: any, v: any) => Number(n) + Number(v), 0)) : 0; })(),
        promotions: report.actions.filter((a: any) => a.kind === "promotion_candidate").length,
        merges: report.actions.filter((a: any) => a.kind === "merge_candidate").length,
        status_after: report.status_after,
    });
    return {
        status: () => {
            const st = curator.status();
            return { atoms_active: st.atoms_active, durable_atoms: st.durable_atoms, bonds: st.bonds, isolated: st.isolated_durable_atoms, pending: st.pending_questions, missing_compact: st.long_atoms_missing_compact, by_type: st.by_type, recommendations: st.recommendations };
        },
        search: ({ query, limit, type, domain }: any) => {
            const clean = String(query).replace(/[^a-zA-Z0-9àèéìòù ]/g, " ").trim();
            if (!clean) return { results: [] };
            const words = clean.split(/\s+/).filter((w: string) => w.length > 1).map((w: string) => '"' + w + '"');
            if (!words.length) return { results: [] };
            let rows: any[] = [];
            try {
                rows = db.prepare("SELECT a.id, a.title, a.domain, a.type FROM atoms_fts JOIN atoms a ON atoms_fts.rowid = a.rowid WHERE atoms_fts MATCH ? AND a.status='active' LIMIT 200").all(words.join(" OR "));
            } catch { rows = []; }
            if (type) rows = rows.filter((r: any) => r.type === type);
            if (domain) rows = rows.filter((r: any) => String(r.domain || "").startsWith(domain));
            return { results: rows.slice(0, limit ?? 30) };
        },
        atom: ({ id }: any) => {
            const atom = q1("SELECT * FROM atoms WHERE id=?", id);
            if (!atom) return { error: "not found" };
            const bonds = q("SELECT * FROM bonds WHERE from_id=? OR to_id=?", id, id);
            return { atom, bonds };
        },
        domains: () => ({
            domains: q("SELECT domain, COUNT(*) as count FROM atoms WHERE status='active' GROUP BY domain ORDER BY count DESC LIMIT 50"),
        }),
        curator_dry: ({ max_atoms }: any) => curatorReport(curator.run(true, false, max_atoms ?? 40)),
        curator_apply: ({ max_atoms }: any) => curatorReport(curator.run(false, true, max_atoms ?? 40)),
        backups_list: () => {
            const backupDir = path.join(path.dirname(dbPath), "backups");
            if (!fs.existsSync(backupDir)) return { backups: [] };
            const backups = fs.readdirSync(backupDir).filter((f: string) => f.endsWith(".db")).map((f: string) => {
                const st = fs.statSync(path.join(backupDir, f));
                return { file: f, size_bytes: st.size, created: st.mtime.toISOString() };
            }).sort((a: any, b: any) => b.created.localeCompare(a.created)).slice(0, 20);
            return { backups };
        },
        backup_now: () => {
            try {
                const backupDir = path.join(path.dirname(dbPath), "backups");
                fs.mkdirSync(backupDir, { recursive: true });
                const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
                const dest = path.join(backupDir, "memory-backup-" + ts + ".db");
                db.prepare("VACUUM INTO ?").run(dest);
                return { ok: true, path: dest, size_bytes: fs.statSync(dest).size };
            } catch (e: any) { return { ok: false, reason: String(e) }; }
        },
        questions_list: ({ limit }: any) => ({
            questions: q("SELECT id, question, question_type, status, atom_ids FROM human_questions WHERE status='pending' ORDER BY created_at DESC LIMIT ?", limit ?? 20),
        }),
        question_answer: ({ question_id, answer, action }: any) => {
            const row = q1("SELECT * FROM human_questions WHERE id=? AND status='pending'", question_id);
            if (!row) return { ok: false, reason: "question not found or not pending" };
            x("UPDATE human_questions SET status='answered', answer=?, answered_at=unixepoch() WHERE id=?", answer, question_id);
            if (action === "archive_atom" && row.atom_ids) {
                try { const ids = JSON.parse(row.atom_ids); for (const aid of ids) x("UPDATE atoms SET status='archived', updated_at=unixepoch() WHERE id=?", aid); } catch {}
            }
            return { ok: true };
        },
        atom_soft_delete: ({ id }: any) => {
            const r = x("UPDATE atoms SET status='deleted', updated_at=unixepoch() WHERE id=? AND status='active'", id);
            return { ok: (r as any).changes > 0 };
        },
        atom_update_domain: ({ id, new_domain }: any) => {
            const r = x("UPDATE atoms SET domain=?, updated_at=unixepoch() WHERE id=?", new_domain, id);
            return { ok: (r as any).changes > 0 };
        },
        db_stats: () => {
            const settings = getSettings();
            const byStatus: any = {};
            for (const r of q("SELECT status k, COUNT(*) n FROM atoms GROUP BY status")) byStatus[r.k] = r.n;
            let size = 0;
            try { size = fs.statSync(dbPath).size; } catch {}
            return { by_status: byStatus, db_path: dbPath, db_size_bytes: size, retention_days: settings.retention_days ?? 7, ingest_enabled: settings.ingest_enabled !== false };
        },
        set_retention: ({ retention_days }: any) => {
            db.prepare("CREATE TABLE IF NOT EXISTS plugin_settings (key TEXT PRIMARY KEY, value TEXT)").run();
            db.prepare("INSERT OR REPLACE INTO plugin_settings (key, value) VALUES ('retention_days', ?)").run(String(Number(retention_days)));
            return { ok: true, retention_days: Number(retention_days), note: 'Applicato a nuovi atomi e alle pulizie automatiche.' };
        },
        db_cleanup: ({ max_age_days, dry_run }: any) => {
            const settings = getSettings();
            const maxAge = max_age_days ?? settings.retention_days ?? 7;
            const expired = q("SELECT id FROM atoms WHERE type IN ('session_msg','session_digest') AND status='active' AND unixepoch() - created_at > ?", maxAge * 86400);
            if (!dry_run) {
                for (const r of expired) x("UPDATE atoms SET status='expired', updated_at=unixepoch() WHERE id=?", r.id);
            }
            return { purged: expired.length, max_age_days: maxAge, dry_run: !!dry_run };
        },
        db_purge: ({ confirm }: any) => {
            if (!confirm) return { ok: false, reason: 'confirm=true richiesto per eliminare definitivamente' };
            const victims = q("SELECT id FROM atoms WHERE status IN ('deleted','expired','merged')");
            for (const r of victims) {
                x("DELETE FROM bonds WHERE from_id=? OR to_id=?", r.id, r.id);
                x("DELETE FROM atom_versions WHERE atom_id=?", r.id);
                x("DELETE FROM atom_embeddings WHERE atom_id=?", r.id);
                x("DELETE FROM atoms WHERE id=?", r.id);
            }
            return { ok: true, purged: victims.length };
        },    };
}
