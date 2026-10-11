/**
 * Memory Engine TS — Step 3 (backup/import/export) + Step 4 (learning).
 * Parity port of Python backup.py + learning.py; no Python residue.
 */
import { DatabaseSync } from "node:sqlite";
export interface MaintToolDef {
    name: string;
    description: string;
    parameters: any;
    execute: (a: any) => any;
}
export declare function buildMaintenanceDefs(db: DatabaseSync, dbPath: string): MaintToolDef[];
