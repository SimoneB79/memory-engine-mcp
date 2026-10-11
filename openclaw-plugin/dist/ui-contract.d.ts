import { Type } from "typebox";
export declare const contract: {
    readonly pluginId: "memory-engine";
    readonly operations: {
        readonly status: {
            readonly kind: "query";
            readonly description: "Cognitive health metrics for the memory graph.";
            readonly input: Type.TObject<{}>;
            readonly output: Type.TObject<{}>;
        };
        readonly search: {
            readonly kind: "query";
            readonly description: "FTS search over memory atoms with optional type/domain filters.";
            readonly input: Type.TObject<{
                query: Type.TString;
                limit: Type.TOptional<Type.TInteger>;
                type: Type.TOptional<Type.TString>;
                domain: Type.TOptional<Type.TString>;
            }>;
            readonly output: Type.TObject<{}>;
        };
        readonly atom: {
            readonly kind: "query";
            readonly description: "Full atom detail with bonds.";
            readonly input: Type.TObject<{
                id: Type.TString;
            }>;
            readonly output: Type.TObject<{}>;
        };
        readonly domains: {
            readonly kind: "query";
            readonly description: "List distinct domains with atom counts.";
            readonly input: Type.TObject<{}>;
            readonly output: Type.TObject<{}>;
        };
        readonly curator_dry: {
            readonly kind: "action";
            readonly description: "Run curator in dry-run mode.";
            readonly input: Type.TObject<{
                max_atoms: Type.TOptional<Type.TInteger>;
            }>;
            readonly output: Type.TObject<{}>;
        };
        readonly curator_apply: {
            readonly kind: "action";
            readonly description: "Run curator with auto_apply (safe actions only).";
            readonly input: Type.TObject<{
                max_atoms: Type.TOptional<Type.TInteger>;
            }>;
            readonly output: Type.TObject<{}>;
        };
        readonly backups_list: {
            readonly kind: "query";
            readonly description: "List available backups.";
            readonly input: Type.TObject<{}>;
            readonly output: Type.TObject<{}>;
        };
        readonly backup_now: {
            readonly kind: "action";
            readonly description: "Create a database backup now.";
            readonly input: Type.TObject<{}>;
            readonly output: Type.TObject<{}>;
        };
        readonly questions_list: {
            readonly kind: "query";
            readonly description: "List pending human questions.";
            readonly input: Type.TObject<{
                limit: Type.TOptional<Type.TInteger>;
            }>;
            readonly output: Type.TObject<{}>;
        };
        readonly question_answer: {
            readonly kind: "action";
            readonly description: "Answer a pending question.";
            readonly input: Type.TObject<{
                question_id: Type.TString;
                answer: Type.TString;
                action: Type.TOptional<Type.TString>;
            }>;
            readonly output: Type.TObject<{}>;
        };
        readonly atom_soft_delete: {
            readonly kind: "action";
            readonly description: "Soft-delete an atom.";
            readonly input: Type.TObject<{
                id: Type.TString;
            }>;
            readonly output: Type.TObject<{}>;
        };
        readonly atom_update_domain: {
            readonly kind: "action";
            readonly description: "Move an atom to a different domain.";
            readonly input: Type.TObject<{
                id: Type.TString;
                new_domain: Type.TString;
            }>;
            readonly output: Type.TObject<{}>;
        };
        readonly db_stats: {
            readonly kind: "query";
            readonly description: "Database management stats: counts by status, db file size, retention setting.";
            readonly input: Type.TObject<{}>;
            readonly output: Type.TObject<{}>;
        };
        readonly set_retention: {
            readonly kind: "action";
            readonly description: "Set session retention days (TTL). Takes effect on new ingested atoms and cleanup.";
            readonly input: Type.TObject<{
                retention_days: Type.TInteger;
            }>;
            readonly output: Type.TObject<{}>;
        };
        readonly db_cleanup: {
            readonly kind: "action";
            readonly description: "Expire session atoms older than max_age_days (or retention default). dry_run optional.";
            readonly input: Type.TObject<{
                max_age_days: Type.TOptional<Type.TInteger>;
                dry_run: Type.TOptional<Type.TBoolean>;
            }>;
            readonly output: Type.TObject<{}>;
        };
        readonly db_purge: {
            readonly kind: "action";
            readonly description: "Hard-delete atoms with status deleted/expired/merged. Requires confirm=true.";
            readonly input: Type.TObject<{
                confirm: Type.TOptional<Type.TBoolean>;
            }>;
            readonly output: Type.TObject<{}>;
        };
    };
    readonly events: {};
};
