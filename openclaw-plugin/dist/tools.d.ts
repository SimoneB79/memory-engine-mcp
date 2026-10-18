/**
 * Memory Engine TS — F3: complete tool registry.
 * Agent-facing tools with full logic; heavy admin jobs stay on the
 * Python server and are exposed as explicit pointers.
 */
import { DatabaseSync } from "node:sqlite";
import { Row } from "./engine.js";
export declare const VERSION = "4.6.6";
export declare function createTools(dbPath: string): {
    __db: DatabaseSync;
    version: () => {
        version: string;
        note: string;
    };
    recall: (query: string, limit?: number, domain?: string, semantic?: boolean) => Promise<{
        id: any;
        title: any;
        domain: any;
        type: any;
        confidence: any;
        snippet: string;
    }[]>;
    semantic_search: (query: string, limit?: number, domain?: string) => Promise<{
        id: string;
        title: string;
        domain: string;
        type: string;
        semantic_score: number;
    }[] | {
        id: any;
        title: any;
        semantic_score: null;
        note: string;
    }[]>;
    recall_session: (session_id: string, query: string, limit?: number) => Promise<Row[]>;
    remember: (title: string, content: string, type?: string, domain?: string, confidence?: number, tags?: string[]) => {
        id: string;
        title: string;
        type: string;
        domain: string;
    };
    get_atom: (id: string) => any;
    list_atoms: (domain?: string, type?: string, limit?: number) => any[];
    delete_atom: (id: string) => {
        deleted: boolean;
        id: string;
    };
    link: (fromId: string, toId: string, relation: string, strength?: number, evidence?: string) => {
        linked: boolean;
        from: string;
        to: string;
        relation: string;
    };
    unlink: (fromId: string, toId: string, relation: string) => {
        unlinked: boolean;
    };
    search_graph: (atomId: string, depth?: number) => {
        nodes: any[];
        edges: any[];
    };
    working_set: (query: string, domain?: string, limit?: number, tokenBudget?: number | null) => any;
    memory_contradict: (oldAtomId: string, title: string, body?: string, reason?: string) => {
        contradiction_id: string;
        old_atom_id: string;
        new_atom_id: string;
    };
    list_contradictions: (atomId?: string, limit?: number) => any[];
    memory_impact: (atomId: string, depth?: number) => {
        nodes: any[];
        edges: any[];
        relation_breakdown: Record<string, number>;
    };
    preference_search: (query?: string, category?: string, limit?: number) => any[];
    error_check: (taskDescription: string, limit?: number) => any[];
    error_log: (taskType: string, mistake: string, correction: string, severity?: string) => {
        id: string;
        logged: boolean;
    };
    error_list: (resolved?: boolean, limit?: number) => any[];
    stats: () => {
        total_atoms: any;
        active: any;
        bonds: any;
        contradictions: any;
        by_domain: any;
        by_type: any;
    };
    update_domain: (atomIds: string[], newDomain: string) => {
        updated: string[];
        new_domain: string;
    };
    session_summary: (sessionId: string) => any;
    generate_session_digest: (sessionId: string) => {
        created: boolean;
        note: string;
    } | {
        id: string;
        title: string;
        body: string;
        note?: undefined;
        created: boolean;
    };
    rules_get_binding: () => {
        rules: any[];
        count: number;
        note: string;
    };
    rules_add: (rule_text: string, category?: string, priority?: number) => {
        ok: boolean;
        rule_text: string;
        category: string;
        priority: number;
    };
    rules_remove: (id: number) => {
        ok: boolean;
        id: number;
        deactivated: boolean;
    };
    rules_list_all: () => any[];
    _admin_note: () => string;
};
