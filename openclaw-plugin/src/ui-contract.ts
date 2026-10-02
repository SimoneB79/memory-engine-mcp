import { Type } from "typebox";
import { defineFeatureContract } from "openclaw/plugin-sdk/feature-contract";

export const contract = defineFeatureContract({
  pluginId: "memory-engine",
  operations: {
    status: {
      kind: "query", description: "Cognitive health metrics for the memory graph.",
      input: Type.Object({}, { additionalProperties: false }),
      output: Type.Object({}, { additionalProperties: true }),
    },
    search: {
      kind: "query", description: "FTS search over memory atoms with optional type/domain filters.",
      input: Type.Object({ query: Type.String({ maxLength: 500, minLength: 1 }), limit: Type.Optional(Type.Integer({ maximum: 100 })), type: Type.Optional(Type.String({ maxLength: 40 })), domain: Type.Optional(Type.String({ maxLength: 200 })) }, { additionalProperties: false }),
      output: Type.Object({}, { additionalProperties: true }),
    },
    atom: {
      kind: "query", description: "Full atom detail with bonds.",
      input: Type.Object({ id: Type.String({ maxLength: 200 }) }, { additionalProperties: false }),
      output: Type.Object({}, { additionalProperties: true }),
    },
    domains: {
      kind: "query", description: "List distinct domains with atom counts.",
      input: Type.Object({}, { additionalProperties: false }),
      output: Type.Object({}, { additionalProperties: true }),
    },
    curator_dry: {
      kind: "action", description: "Run curator in dry-run mode.",
      input: Type.Object({ max_atoms: Type.Optional(Type.Integer({ maximum: 200 })) }, { additionalProperties: false }),
      output: Type.Object({}, { additionalProperties: true }),
    },
    curator_apply: {
      kind: "action", description: "Run curator with auto_apply (safe actions only).",
      input: Type.Object({ max_atoms: Type.Optional(Type.Integer({ maximum: 200 })) }, { additionalProperties: false }),
      output: Type.Object({}, { additionalProperties: true }),
    },
    backups_list: {
      kind: "query", description: "List available backups.",
      input: Type.Object({}, { additionalProperties: false }),
      output: Type.Object({}, { additionalProperties: true }),
    },
    backup_now: {
      kind: "action", description: "Create a database backup now.",
      input: Type.Object({}, { additionalProperties: false }),
      output: Type.Object({}, { additionalProperties: true }),
    },
    questions_list: {
      kind: "query", description: "List pending human questions.",
      input: Type.Object({ limit: Type.Optional(Type.Integer({ maximum: 50 })) }, { additionalProperties: false }),
      output: Type.Object({}, { additionalProperties: true }),
    },
    question_answer: {
      kind: "action", description: "Answer a pending question.",
      input: Type.Object({ question_id: Type.String({ maxLength: 200 }), answer: Type.String({ maxLength: 2000 }), action: Type.Optional(Type.String({ maxLength: 40 })) }, { additionalProperties: false }),
      output: Type.Object({}, { additionalProperties: true }),
    },
    atom_soft_delete: {
      kind: "action", description: "Soft-delete an atom.",
      input: Type.Object({ id: Type.String({ maxLength: 200 }) }, { additionalProperties: false }),
      output: Type.Object({}, { additionalProperties: true }),
    },
    atom_update_domain: {
      kind: "action", description: "Move an atom to a different domain.",
      input: Type.Object({ id: Type.String({ maxLength: 200 }), new_domain: Type.String({ maxLength: 200 }) }, { additionalProperties: false }),
      output: Type.Object({}, { additionalProperties: true }),
    },
    db_stats: {
      kind: "query", description: "Database management stats: counts by status, db file size, retention setting.",
      input: Type.Object({}, { additionalProperties: false }),
      output: Type.Object({}, { additionalProperties: true }),
    },
    set_retention: {
      kind: "action", description: "Set session retention days (TTL). Takes effect on new ingested atoms and cleanup.",
      input: Type.Object({ retention_days: Type.Integer({ minimum: 1, maximum: 365 }) }, { additionalProperties: false }),
      output: Type.Object({}, { additionalProperties: true }),
    },
    db_cleanup: {
      kind: "action", description: "Expire session atoms older than max_age_days (or retention default). dry_run optional.",
      input: Type.Object({ max_age_days: Type.Optional(Type.Integer({ minimum: 1, maximum: 3650 })), dry_run: Type.Optional(Type.Boolean()) }, { additionalProperties: false }),
      output: Type.Object({}, { additionalProperties: true }),
    },
    db_purge: {
      kind: "action", description: "Hard-delete atoms with status deleted/expired/merged. Requires confirm=true.",
      input: Type.Object({ confirm: Type.Optional(Type.Boolean()) }, { additionalProperties: false }),
      output: Type.Object({}, { additionalProperties: true }),
    },
  },
  events: {},
});
