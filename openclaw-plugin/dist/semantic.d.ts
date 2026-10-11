/**
 * Memory Engine TS — semantic tools (Step 2 parity port).
 * semantic_search, reindex_embeddings, suggest_bonds(+all) via Ollama embeddings.
 */
import { DatabaseSync } from "node:sqlite";
import { Curator } from "./curator.js";
export interface SemanticToolDef {
    name: string;
    description: string;
    parameters: any;
    execute: (a: any) => any;
}
export declare function buildSemanticDefs(db: DatabaseSync, curator: Curator): SemanticToolDef[];
