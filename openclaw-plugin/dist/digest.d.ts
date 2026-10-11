/**
 * Memory Engine TS — F4/F5: session digest generator.
 * Aligned with session_watcher._upsert_sqlite_digest (2.0 format).
 */
import { DatabaseSync } from "node:sqlite";
export interface DigestDraft {
    id: string;
    title: string;
    body: string;
}
export declare function buildSessionDigest(db: DatabaseSync, sessionId: string, meta?: {
    ocSessionId?: string;
    generation?: string;
    segment?: number;
    sourceKey?: string;
}): DigestDraft | null;
