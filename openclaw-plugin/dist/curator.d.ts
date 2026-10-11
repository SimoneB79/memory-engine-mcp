/**
 * Memory Engine TS — Curator port (from Python CognitiveCurator + AutoBondEngine).
 * Conservative maintenance: dry-run by default, safe reversible actions only.
 */
import { DatabaseSync } from "node:sqlite";
import { Engine, Row } from "./engine.js";
export declare const DURABLE_TYPES: readonly ["decision", "fact", "note", "preference", "procedure", "project"];
export interface CuratorConfig {
    max_atoms_per_run?: number;
    compact_min_body_chars?: number;
    compact_max_chars?: number;
    bond_limit_per_atom?: number;
    isolated_limit?: number;
    isolated_min_age_days?: number;
    isolated_archive_after_days?: number;
    isolated_high_access_threshold?: number;
    isolated_high_weight_threshold?: number;
    stale_after_days?: number;
    promotion_min_occurrences?: number;
    domain_cluster_threshold?: number;
}
export declare class Curator {
    private db;
    private engine;
    private cfg;
    constructor(db: DatabaseSync, engine: Engine, config?: CuratorConfig);
    private q;
    private q1;
    private exec;
    status(): any;
    private recommendations;
    run(dryRun?: boolean, autoApply?: boolean, maxAtoms?: number): any;
    private compactLongAtoms;
    extractiveCompact(body: string, maxChars?: number): string;
    private bondPass;
    suggestBondsForAtom(atom: Row, seen: Set<string>): any[];
    private domainCluster;
    private keywordOverlap;
    private patternDetection;
    private tagsToSet;
    private classifyIsolatedAtoms;
    private classifyOne;
    private setIsolatedMeta;
    private proposePromotions;
    private candidatePhrases;
    private proposeMerges;
    private normTitle;
}
