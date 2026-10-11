/**
 * Memory Engine TS — embeddings via Ollama (nomic-embed-text).
 * Reads/writes the same atom_embeddings table used by the Python engine.
 */
import { DatabaseSync } from "node:sqlite";
export declare function embed(text: string): Promise<Float32Array | null>;
export declare function semanticSearch(db: DatabaseSync, query: string, limit?: number, domain?: string): Promise<Array<{
    id: string;
    title: string;
    domain: string;
    type: string;
    semantic_score: number;
}>>;
export declare function embedAtom(db: DatabaseSync, atomId: string, text: string): Promise<boolean>;
