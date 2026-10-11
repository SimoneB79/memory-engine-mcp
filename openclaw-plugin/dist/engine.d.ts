/**
 * Memory Engine TS — F2: engine port (faithful translation of engine.py).
 * Ranking formula, recall merge/filter and graph expansion are IDENTICAL
 * to the Python implementation; parity tests are the spec.
 */
import { DatabaseSync } from "node:sqlite";
export interface Row {
    [k: string]: any;
}
export declare class Engine {
    db: DatabaseSync;
    config: any;
    constructor(db: DatabaseSync, config?: any);
    static INTENT_RULES: Array<[string, string[]]>;
    static classifyIntent(query: string): Record<string, number>;
    searchFts(query: string, limit?: number, statuses?: string[], memoryTier?: string): Row[];
    getRelatedAtoms(atomId: string, limit?: number, minStrength?: number): Row[];
    rankResults(ftsResults: Row[], query: string): Row[];
    recall(query: string, limit?: number, opts?: {
        domain?: string | null;
        semantic?: boolean;
        memoryTier?: string;
        includeSuperseded?: boolean;
        minWeight?: number;
    }): Row[];
    expandGraphContext(ranked: Row[], limit: number, domain: string | null | undefined, minWeight: number, seedLimit: number, neighborLimit: number, graphWeight: number, minStrength: number): Row[];
}
