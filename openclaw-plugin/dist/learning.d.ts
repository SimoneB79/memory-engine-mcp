/**
 * Memory Engine TS — Learning module (full Python parity port, v4.5.0).
 * 7 detector + dedup + capacity + answer side-effects, port fedele di learning.py/engine.py.
 */
import type { DatabaseSync } from "node:sqlite";
export interface LearningConfig {
    max_pending_questions?: number;
    contradiction_threshold?: number;
    weak_confidence_threshold?: number;
    weak_access_threshold?: number;
    merge_similarity_threshold?: number;
    decay_critical_threshold?: number;
    gap_body_min_chars?: number;
    graph_gap_enabled?: boolean;
    graph_gap_min_weight?: number;
    graph_gap_limit?: number;
    graph_gap_types?: string[];
    graph_gap_excluded_domain_prefixes?: string[];
}
export declare function computeSimilarity(a: any, b: any): number;
export declare class Learning {
    private db;
    config: LearningConfig;
    constructor(db: DatabaseSync, config?: LearningConfig);
    private q;
    private q1;
    private x;
    /** Garantisce le colonne options/meta (migration idempotente). */
    ensureSchema(): void;
    detectContradictions(): any[];
    detectWeakAtoms(): any[];
    detectMergeCandidates(): any[];
    detectDecayCritical(): any[];
    detectGaps(): any[];
    detectGraphGaps(): any[];
    addQuestion(atomIds: string[], questionType: string, question: string, options: string[], meta: any): any;
    runAllChecks(): any[];
    applyAnswerSideEffects(qrow: any, answer: string): string[];
}
