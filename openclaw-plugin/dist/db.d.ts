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
export declare function openMemoryDb(path: string): DatabaseSync;
export declare function parityReport(path: string): ParityReport;
