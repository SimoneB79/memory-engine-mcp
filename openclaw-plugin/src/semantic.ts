/**
 * Memory Engine TS — semantic tools (Step 2 parity port).
 * semantic_search, reindex_embeddings, suggest_bonds(+all) via Ollama embeddings.
 */
import { DatabaseSync } from "node:sqlite";
import { Type } from "typebox";
const T = Type;
import { semanticSearch, embedAtom, embed } from "./embeddings.js";
import { Curator } from "./curator.js";

export interface SemanticToolDef { name: string; description: string; parameters: any; execute: (a: any) => any }

export function buildSemanticDefs(db: DatabaseSync, curator: Curator): SemanticToolDef[] {
  const q = (sql: string, ...p: any[]) => db.prepare(sql).all(...p) as any[];
  const q1 = (sql: string, ...p: any[]) => db.prepare(sql).get(...p) as any;
  const x = (sql: string, ...p: any[]) => db.prepare(sql).run(...p);

  return [
    {
      name: "memory_semantic_search",
      description: "Semantic search over atom embeddings (Ollama). Falls back to FTS with a note when embeddings/Ollama are unavailable.",
      parameters: T.Object({ query: T.String(), limit: T.Optional(T.Number()), domain: T.Optional(T.String()) }),
      execute: async (a: any) => {
        const embedded = q1("SELECT COUNT(*) n FROM atom_embeddings").n;
        const res = await semanticSearch(db, a.query, a.limit ?? 10, a.domain);
        if (res.length) return { mode: "semantic", embeddings_available: embedded, results: res };
        const fts = q("SELECT id, title, domain FROM atoms_fts JOIN atoms a ON atoms_fts.rowid = a.rowid WHERE atoms_fts MATCH ? AND a.status='active' LIMIT ?", '"' + String(a.query).replace(/[^a-zA-Z0-9 ]/g, " ").trim() + '"', a.limit ?? 10);
        return { mode: "fts-fallback", note: "ollama non raggiungibile o nessun embedding", embeddings_available: embedded, results: fts };
      },
    },
    {
      name: "memory_reindex_embeddings",
      description: "(Re)generate embeddings for active durable atoms missing one. Batch with max_atoms; returns indexed/failed counts.",
      parameters: T.Object({ max_atoms: T.Optional(T.Number()) }),
      execute: async (a: any) => {
        const probe = await embed("probe");
        if (!probe) return { ok: false, reason: "ollama non raggiungibile (OLLAMA_HOST / ME_EMBED_MODEL)" };
        const rows = q("SELECT id, title, COALESCE(body_compact, body, '') body FROM atoms a WHERE a.status='active' AND a.type IN ('fact','decision','procedure','preference','project','note') AND NOT EXISTS (SELECT 1 FROM atom_embeddings e WHERE e.atom_id = a.id) LIMIT ?", a.max_atoms ?? 100);
        let indexed = 0, failed = 0;
        for (const r of rows) {
          const ok = await embedAtom(db, r.id, r.title + ". " + String(r.body || "").slice(0, 1500));
          if (ok) indexed++; else failed++;
        }
        const total = q1("SELECT COUNT(*) n FROM atom_embeddings").n;
        return { ok: true, indexed, failed, scanned: rows.length, embeddings_total: total };
      },
    },
    {
      name: "memory_suggest_bonds",
      description: "Suggest bonds for one atom (domain cluster, keyword overlap, id patterns). auto_apply=false by default.",
      parameters: T.Object({ atom_id: T.String(), auto_apply: T.Optional(T.Boolean()), limit: T.Optional(T.Number()) }),
      execute: (a: any) => {
        const atom = q1("SELECT * FROM atoms WHERE id=?", a.atom_id);
        if (!atom) return { error: "atom not found" };
        const seen = new Set<string>();
        const suggestions = curator.suggestBondsForAtom(atom, seen).slice(0, a.limit ?? 5);
        let applied = 0;
        if (a.auto_apply) {
          for (const s of suggestions) {
            x("INSERT OR IGNORE INTO bonds (from_id, to_id, relation, strength, evidence, created_at) VALUES (?,?,?,?,?,unixepoch())", s.from_id, s.to_id, s.relation, s.confidence, JSON.stringify({ strategy: s.strategy, reason: s.reason }));
            applied++;
          }
        }
        return { atom_id: a.atom_id, suggestions: suggestions.length, applied, detail: suggestions };
      },
    },
    {
      name: "memory_suggest_bonds_all",
      description: "Bulk bond suggestion across active atoms (fast strategies only). auto_apply=false by default.",
      parameters: T.Object({ auto_apply: T.Optional(T.Boolean()), max_atoms: T.Optional(T.Number()), limit_per_atom: T.Optional(T.Number()) }),
      execute: (a: any) => {
        const maxAtoms = a.max_atoms ?? 200;
        const perAtom = a.limit_per_atom ?? 3;
        const atoms = q("SELECT * FROM atoms WHERE status='active' ORDER BY weight DESC, access_count DESC LIMIT ?", maxAtoms);
        const seen = new Set<string>();
        const all: any[] = [];
        let appliedCount = 0;
        for (const atom of atoms) {
          const sug = curator.suggestBondsForAtom(atom, seen).slice(0, perAtom);
          for (const s of sug) {
            all.push(s);
            if (a.auto_apply) {
              x("INSERT OR IGNORE INTO bonds (from_id, to_id, relation, strength, evidence, created_at) VALUES (?,?,?,?,?,unixepoch())", s.from_id, s.to_id, s.relation, s.confidence, JSON.stringify({ strategy: s.strategy, reason: s.reason }));
              appliedCount++;
            }
          }
        }
        return {
          atoms_scanned: atoms.length, suggestions: all.length, applied: appliedCount,
          top_suggestions: all.sort((p, c) => c.confidence - p.confidence).slice(0, 15).map((s: any) => ({ from: s.from_id, to: s.to_id, relation: s.relation, confidence: s.confidence, reason: s.reason.slice(0, 80) })),
        };
      },
    },
  ];
}
