export declare function createFeatureHandlers(): {
    status: () => {
        atoms_active: any;
        durable_atoms: any;
        bonds: any;
        isolated: any;
        pending: any;
        missing_compact: any;
        by_type: any;
        recommendations: any;
    };
    search: ({ query, limit, type, domain }: any) => {
        results: any[];
    };
    atom: ({ id }: any) => {
        atom?: undefined;
        bonds?: undefined;
        error: string;
    } | {
        error?: undefined;
        atom: any;
        bonds: any[];
    };
    domains: () => {
        domains: any[];
    };
    curator_dry: ({ max_atoms }: any) => {
        compact: any;
        bonds_suggested: any;
        bonds_applied: any;
        isolated_classified: number;
        promotions: any;
        merges: any;
        status_after: any;
    };
    curator_apply: ({ max_atoms }: any) => {
        compact: any;
        bonds_suggested: any;
        bonds_applied: any;
        isolated_classified: number;
        promotions: any;
        merges: any;
        status_after: any;
    };
    backups_list: () => {
        backups: {
            file: string;
            size_bytes: number;
            created: string;
        }[];
    };
    backup_now: () => {
        reason?: undefined;
        ok: boolean;
        path: string;
        size_bytes: number;
    } | {
        path?: undefined;
        size_bytes?: undefined;
        ok: boolean;
        reason: string;
    };
    questions_list: ({ limit }: any) => {
        questions: any[];
    };
    question_answer: ({ question_id, answer, action }: any) => {
        ok: boolean;
        reason: string;
    } | {
        reason?: undefined;
        ok: boolean;
    };
    atom_soft_delete: ({ id }: any) => {
        ok: boolean;
    };
    atom_update_domain: ({ id, new_domain }: any) => {
        ok: boolean;
    };
    db_stats: () => {
        by_status: any;
        db_path: string;
        db_size_bytes: number;
        retention_days: any;
        ingest_enabled: boolean;
    };
    set_retention: ({ retention_days }: any) => {
        ok: boolean;
        retention_days: number;
        note: string;
    };
    db_cleanup: ({ max_age_days, dry_run }: any) => {
        purged: number;
        max_age_days: any;
        dry_run: boolean;
    };
    db_purge: ({ confirm }: any) => {
        ok: boolean;
        reason: string;
        purged?: undefined;
    } | {
        reason?: undefined;
        ok: boolean;
        purged: number;
    };
};
