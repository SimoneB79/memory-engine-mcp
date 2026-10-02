import { Type } from "typebox";
import { defineFeatureContract } from "openclaw/plugin-sdk/feature-contract";

export const contract = defineFeatureContract({
  pluginId: "memory-engine",
  operations: {
    status: {
      kind: "query",
      description: "Cognitive health metrics for the memory graph.",
      input: Type.Object({}, { additionalProperties: false }),
      output: Type.Object({ atoms_active: Type.Integer(), durable_atoms: Type.Integer(), bonds: Type.Integer(), isolated: Type.Integer(), pending: Type.Integer(), missing_compact: Type.Integer(), by_type: Type.Record(Type.String(), Type.Integer()), recommendations: Type.Array(Type.String()) }, { additionalProperties: true }),
    },
    search: {
      kind: "query",
      description: "FTS search over memory atoms with optional type/domain filters.",
      input: Type.Object({ query: Type.String({ maxLength: 500, minLength: 1 }), limit: Type.Optional(Type.Integer({ maximum: 100 })), type: Type.Optional(Type.String({ maxLength: 40 })), domain: Type.Optional(Type.String({ maxLength: 200 })) }, { additionalProperties: false }),
      output: Type.Object({ results: Type.Array(Type.Object({ id: Type.String(), title: Type.String(), domain: Type.Optional(Type.String()), type: Type.Optional(Type.String()) })) }, { additionalProperties: true }),
    },
    atom: {
      kind: "query",
      description: "Full atom detail with bonds.",
      input: Type.Object({ id: Type.String({ maxLength: 200 }) }, { additionalProperties: false }),
      output: Type.Object({}, { additionalProperties: true }),
    },
    domains: {
      kind: "query",
      description: "List distinct domains with atom counts.",
      input: Type.Object({}, { additionalProperties: false }),
      output: Type.Object({ domains: Type.Array(Type.Object({ domain: Type.String(), count: Type.Integer() })) }, { additionalProperties: true }),
    },
    curator_dry: {
      kind: "action",
      description: "Run curator in dry-run mode.",
      input: Type.Object({ max_atoms: Type.Optional(Type.Integer({ maximum: 200 })) }, { additionalProperties: false }),
      output: Type.Object({}, { additionalProperties: true }),
    },
    curator_apply: {
      kind: "action",
      description: "Run curator with auto_apply (safe actions only).",
      input: Type.Object({ max_atoms: Type.Optional(Type.Integer({ maximum: 200 })) }, { additionalProperties: false }),
      output: Type.Object({}, { additionalProperties: true }),
    },
    backups_list: {
      kind: "query",
      description: "List available backups.",
      input: Type.Object({}, { additionalProperties: false }),
      output: Type.Object({ backups: Type.Array(Type.Object({ file: Type.String(), size_bytes: Type.Integer(), created: Type.String() })) }, { additionalProperties: true }),
    },
    backup_now: {
      kind: "action",
      description: "Create a database backup now.",
      input: Type.Object({}, { additionalProperties: false }),
      output: Type.Object({}, { additionalProperties: true }),
    },
    questions_list: {
      kind: "query",
      description: "List pending human questions.",
      input: Type.Object({ limit: Type.Optional(Type.Integer({ maximum: 50 })) }, { additionalProperties: false }),
      output: Type.Object({ questions: Type.Array(Type.Object({ id: Type.String(), question: Type.String(), question_type: Type.Optional(Type.String()), status: Type.String() })) }, { additionalProperties: true }),
    },
    question_answer: {
      kind: "action",
      description: "Answer a pending question (resolve, optionally archive atom).",
      input: Type.Object({ question_id: Type.String({ maxLength: 200 }), answer: Type.String({ maxLength: 2000 }), action: Type.Optional(Type.String({ maxLength: 40 })) }, { additionalProperties: false }),
      output: Type.Object({}, { additionalProperties: true }),
    },
    atom_soft_delete: {
      kind: "action",
      description: "Soft-delete an atom (status='deleted', reversible).",
      input: Type.Object({ id: Type.String({ maxLength: 200 }) }, { additionalProperties: false }),
      output: Type.Object({}, { additionalProperties: true }),
    },
    atom_update_domain: {
      kind: "action",
      description: "Move an atom to a different domain.",
      input: Type.Object({ id: Type.String({ maxLength: 200 }), new_domain: Type.String({ maxLength: 200 }) }, { additionalProperties: false }),
      output: Type.Object({}, { additionalProperties: true }),
    },
  },
  events: {},
});
