/**
 * Memory Engine TS — F1: data layer.
 * Opens the SAME SQLite database used by the Python Memory Engine.
 * Parity is the exit criterion: identical counts, identical schema.
 */
import { DatabaseSync } from "node:sqlite";
export function openMemoryDb(path) {
    return new DatabaseSync(path, { readOnly: true });
}
export function parityReport(path) {
    const db = openMemoryDb(path);
    const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
        .all()
        .map((r) => r.name);
    const cols = db
        .prepare("PRAGMA table_info(atoms)")
        .all()
        .map((r) => r.name);
    const group = (sql) => {
        const out = {};
        for (const row of db.prepare(sql).all())
            out[row.k] = row.n;
        return out;
    };
    const report = {
        db_path: path,
        tables,
        columns_atoms: cols,
        atoms_total: db.prepare("SELECT COUNT(*) n FROM atoms").get().n,
        atoms_active: db.prepare("SELECT COUNT(*) n FROM atoms WHERE status = 'active'").get().n,
        atoms_by_status: group("SELECT status k, COUNT(*) n FROM atoms GROUP BY status"),
        atoms_by_type: group("SELECT type k, COUNT(*) n FROM atoms GROUP BY type"),
        atoms_by_tier: group("SELECT memory_tier k, COUNT(*) n FROM atoms GROUP BY memory_tier"),
        bonds: db.prepare("SELECT COUNT(*) n FROM bonds").get().n,
        contradictions: db.prepare("SELECT COUNT(*) n FROM memory_contradictions").get().n,
        retrieval_events: db.prepare("SELECT COUNT(*) n FROM retrieval_events").get().n,
    };
    db.close();
    return report;
}
