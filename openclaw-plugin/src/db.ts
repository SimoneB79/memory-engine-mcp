/**
 * Memory Engine TS — F1: data layer.
 * Opens the SAME SQLite database used by the Python Memory Engine.
 * Parity is the exit criterion: identical counts, identical schema.
 */
import { DatabaseSync } from "node:sqlite";

export interface ParityReport {
  db_path: string;
  tables: string[];
  atoms_total: number;
  atoms_active: number;
  atoms_by_status: Record<string, number>;
  atoms_by_type: Record<string, number>;
  atoms_by_tier: Record<string, number>;
  bonds: number;
  contradictions: number;
  retrieval_events: number;
  columns_atoms: string[];
}

export function openMemoryDb(path: string): DatabaseSync {
  return new DatabaseSync(path, { readOnly: true });
}

export function parityReport(path: string): ParityReport {
  const db = openMemoryDb(path);
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
    .all()
    .map((r: any) => r.name as string);
  const cols = db
    .prepare("PRAGMA table_info(atoms)")
    .all()
    .map((r: any) => r.name as string);
  const group = (sql: string): Record<string, number> => {
    const out: Record<string, number> = {};
    for (const row of db.prepare(sql).all() as any[]) out[row.k] = row.n;
    return out;
  };
  const report: ParityReport = {
    db_path: path,
    tables,
    columns_atoms: cols,
    atoms_total: (db.prepare("SELECT COUNT(*) n FROM atoms").get() as any).n,
    atoms_active: (db.prepare("SELECT COUNT(*) n FROM atoms WHERE status = 'active'").get() as any).n,
    atoms_by_status: group("SELECT status k, COUNT(*) n FROM atoms GROUP BY status"),
    atoms_by_type: group("SELECT type k, COUNT(*) n FROM atoms GROUP BY type"),
    atoms_by_tier: group("SELECT memory_tier k, COUNT(*) n FROM atoms GROUP BY memory_tier"),
    bonds: (db.prepare("SELECT COUNT(*) n FROM bonds").get() as any).n,
    contradictions: (db.prepare("SELECT COUNT(*) n FROM memory_contradictions").get() as any).n,
    retrieval_events: (db.prepare("SELECT COUNT(*) n FROM retrieval_events").get() as any).n,
  };
  db.close();
  return report;
}
