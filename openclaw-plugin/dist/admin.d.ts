/**
 * Memory Engine TS — admin & maintenance tools (Step 1 parity port).
 * Pure SQL + logic port from the Python MCP server; no Python residue.
 */
import { DatabaseSync } from "node:sqlite";
export interface AdminToolDef {
    name: string;
    description: string;
    parameters: any;
    execute: (a: any) => any;
}
export declare function buildAdminDefs(db: DatabaseSync): AdminToolDef[];
