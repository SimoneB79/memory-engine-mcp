/**
 * Memory Engine TS — F3: complete tool registry.
 * Agent-facing tools with full logic; heavy admin jobs stay on the
 * Python server and are exposed as explicit pointers.
 */
import { DatabaseSync } from "node:sqlite";
import { Engine, Row } from "./engine.js";
import { buildSessionDigest } from "./digest.js";

export const VERSION = "4.2.2";

export function createTools(dbPath: string) {
  const db = new DatabaseSync(dbPath);
  const engine = new Engine(db, {});

  const q = (sql: string, ...p: any[]) => db.prepare(sql).all(...p) as any[];
  const q1 = (sql: string, ...p: any[]) => db.prepare(sql).get(...p) as any;

  const slim = (a: Row) => ({ id: a.id, title: a.title, domain: a.domain, type: a.type, confidence: a.confidence, snippet: String(a.body_compact || a.body || "").slice(0, 500) });
  const tokens = (a: any) => Math.max(16, Math.floor((String(a.title || "").length + String(a.snippet || "").length) / 4));

  return {
    __db: db,
    version: () => ({ version: VERSION, note: "Native Memory Engine plugin: 19 tools + session ingest/digest + curator." }),

    recall: async (query: string, limit = 5, domain?: string, semantic = false) => {
      const base = engine.recall(query, limit, { domain: domain ?? undefined, semantic: false });
      if (!semantic) return base.map(slim);
      const { semanticSearch } = await import("./embeddings.js");
      const sem = await semanticSearch(db, query, limit, domain);
      const seen = new Set(base.map((r: any) => r.id));
      const merged = base.map(slim);
      for (const s of sem) { if (!seen.has(s.id)) merged.push(slim(s as any)); }
      return merged;
    },

    semantic_search: async (query: string, limit = 10, domain?: string) => {
      const { semanticSearch } = await import("./embeddings.js");
      const results = await semanticSearch(db, query, limit, domain);
      if (results.length) return results;
      // fallback FTS se ollama non raggiungibile
      return engine.searchFts(query, limit, ["active"]).map((r) => ({ id: r.id, title: r.title, semantic_score: null, note: "fts-fallback (ollama non raggiungibile)" }));
    },

    remember: (title: string, content: string, type = "fact", domain = "general", confidence = 0.8, tags: string[] = []) => {
      const now = Math.floor(Date.now() / 1000);
      const id = title.toLowerCase().replace(/[^a-z0-9_\\s]/g, "").trim().replace(/[\\s_]+/g, "_").slice(0, 60) || "atom_" + now;
      const tier = ["preference", "procedure"].includes(type) ? "procedural" : ["log", "event", "session_msg", "session_digest"].includes(type) ? "episodic" : "semantic";
      db.prepare(
        "INSERT OR REPLACE INTO atoms (id, type, memory_tier, domain, title, body, confidence, status, source, weight, tags, meta, created_at, updated_at, accessed_at) " +
        "VALUES (?,?,?,?,?,?,?,'active','ai',1.0,?,?,?,?,?)"
      ).run(id, type, tier, domain, title, content, confidence, JSON.stringify(tags), "{}", now, now, now);
      return { id, title, type, domain };
    },

    get_atom: (id: string) => q1("SELECT * FROM atoms WHERE id = ?", id) ?? null,
    list_atoms: (domain?: string, type?: string, limit = 50) => {
      let sql = "SELECT id, title, type, domain, status, memory_tier FROM atoms WHERE status = 'active'";
      const p: any[] = [];
      if (domain) { sql += " AND domain = ?"; p.push(domain); }
      if (type) { sql += " AND type = ?"; p.push(type); }
      return q(sql + " ORDER BY weight DESC LIMIT ?", ...p, limit);
    },
    delete_atom: (id: string) => {
      db.prepare("DELETE FROM bonds WHERE from_id = ? OR to_id = ?").run(id, id);
      const r = db.prepare("DELETE FROM atoms WHERE id = ?").run(id);
      return { deleted: Number(r.changes) > 0, id };
    },

    link: (fromId: string, toId: string, relation: string, strength = 0.5, evidence?: string) => {
      db.prepare("INSERT OR REPLACE INTO bonds (from_id, to_id, relation, strength, evidence) VALUES (?,?,?,?,?)").run(fromId, toId, relation, strength, evidence ?? null);
      return { linked: true, from: fromId, to: toId, relation };
    },
    unlink: (fromId: string, toId: string, relation: string) => {
      const r = db.prepare("DELETE FROM bonds WHERE from_id = ? AND to_id = ? AND relation = ?").run(fromId, toId, relation);
      return { unlinked: Number(r.changes) > 0 };
    },
    search_graph: (atomId: string, depth = 2) => {
      const visited = new Set<string>(); const nodes: any[] = []; const edges: any[] = [];
      const queue: Array<[string, number]> = [[atomId, 0]];
      while (queue.length) {
        const [cur, d] = queue.shift()!;
        if (visited.has(cur) || d > depth) continue;
        visited.add(cur);
        const a = q1("SELECT id, title, type, domain, status FROM atoms WHERE id = ?", cur);
        if (a) nodes.push(a);
        if (d < depth) {
          for (const b of q("SELECT * FROM bonds WHERE from_id = ? OR to_id = ?", cur, cur)) {
            edges.push(b);
            const next = b.from_id === cur ? b.to_id : b.from_id;
            if (!visited.has(next)) queue.push([next, d + 1]);
          }
        }
      }
      return { nodes, edges };
    },

    working_set: (query: string, domain?: string, limit = 8, tokenBudget: number | null = 2000) => {
      const focus = engine.recall(query, limit, { domain: domain ?? undefined, semantic: false });
      const focusIds = new Set(focus.map((r) => r.id));
      const procedures = focus.filter((r) => ["procedure", "preference", "decision"].includes(r.type));
      const context: any[] = [];
      for (const seed of focus.slice(0, 5)) {
        for (const n of engine.getRelatedAtoms(seed.id, 4, 0.35)) if (!focusIds.has(n.id)) { context.push(slim(n)); focusIds.add(n.id); }
      }
      const pack: any = {
        query, domain,
        focus_atoms: focus.map(slim),
        key_procedures_decisions: procedures.slice(0, 5).map(slim),
        context_atoms: context.slice(0, limit),
        usage_hint: "Use focus_atoms first; context for adjacent facts.",
      };
      if (tokenBudget !== null) {
        const sections: Array<[string, number]> = [["focus_atoms", 0.5], ["key_procedures_decisions", 0.25], ["context_atoms", 0.25]];
        let remaining = tokenBudget; const tbs: any = {};
        for (const pass of ["capped", "borrow"]) {
          for (const [name, share] of sections) {
            const cap = pass === "capped" ? Math.max(0, Math.floor(tokenBudget * share)) : remaining;
            if (cap <= 0) continue;
            let spent = 0; const kept: any[] = [];
            for (const a of pack[name]) {
              const c = tokens(a);
              if (spent + c > cap || c > remaining) break;
              kept.push(a); spent += c; remaining -= c;
              a.category = a.type ?? "episodic"; a.reason = name;
            }
            tbs[name] = { atoms: kept.length, tokens: spent };
            pack[name] = pass === "capped" ? kept : [...pack[name], ...kept.filter((k) => !pack[name].includes(k))];
            if (remaining <= 0) break;
          }
          if (remaining <= 0) break;
        }
        pack.token_budget = { requested: tokenBudget, used: tokenBudget - remaining, tokens_by_section: tbs };
      }
      return pack;
    },

    memory_contradict: (oldAtomId: string, title: string, body = "", reason = "") => {
      const now = Math.floor(Date.now() / 1000);
      const old = q1("SELECT * FROM atoms WHERE id = ?", oldAtomId);
      if (!old) throw new Error("Atom '" + oldAtomId + "' not found");
      const newId = title.toLowerCase().replace(/[^a-z0-9_\s]/g, "").trim().replace(/[\s_]+/g, "_").slice(0, 60);
      const cid = "contradiction_" + oldAtomId + "_" + now;
      db.prepare("INSERT INTO atoms (id, type, memory_tier, domain, title, body, confidence, status, source, weight, tags, meta, created_at, updated_at, accessed_at, valid_from) VALUES (?,?,?,?,?,?,'ai',0.8,'active',1.0,?,?,?,?)")
        .run(newId, old.type, old.memory_tier, old.domain, title, body, JSON.stringify(["contradiction", "supersedes"]), JSON.stringify({ supersedes_atom_id: oldAtomId, contradiction_id: cid }), now, now, now, now);
      db.prepare("UPDATE atoms SET status = 'superseded', valid_until = COALESCE(valid_until, ?), updated_at = ? WHERE id = ?").run(now, now, oldAtomId);
      db.prepare("INSERT INTO memory_contradictions (id, old_atom_id, new_atom_id, reason, resolution, created_at, created_by, meta) VALUES (?,?,?,?,?,?,?,?)").run(cid, oldAtomId, newId, reason, "superseded", now, "ai", "{}");
      db.prepare("INSERT OR REPLACE INTO bonds (from_id, to_id, relation, strength, evidence) VALUES (?,?,'supersedes',1.0,?)").run(newId, oldAtomId, reason || "Newer memory supersedes older atom");
      return { contradiction_id: cid, old_atom_id: oldAtomId, new_atom_id: newId };
    },
    list_contradictions: (atomId?: string, limit = 20) => {
      if (atomId) return q("SELECT * FROM memory_contradictions WHERE old_atom_id = ? OR new_atom_id = ? ORDER BY created_at DESC LIMIT ?", atomId, atomId, limit);
      return q("SELECT * FROM memory_contradictions ORDER BY created_at DESC LIMIT ?", limit);
    },

    memory_impact: (atomId: string, depth = 2) => {
      const res = { nodes: [] as any[], edges: [] as any[], relation_breakdown: {} as Record<string, number> };
      const visited = new Set<string>(); const frontier = new Set<string>([atomId]);
      for (let hop = 0; hop < depth && frontier.size; hop++) {
        const ph = [...frontier].map(() => "?").join(",");
        const rows = q("SELECT from_id, to_id, relation FROM bonds WHERE from_id IN (" + ph + ") OR to_id IN (" + ph + ")", ...frontier, ...frontier);
        const next = new Set<string>();
        for (const e of rows) {
          res.edges.push(e);
          res.relation_breakdown[e.relation] = (res.relation_breakdown[e.relation] ?? 0) + 1;
          const nb = e.from_id === atomId || visited.has(e.from_id) ? e.to_id : e.from_id;
          if (!visited.has(nb) && nb !== atomId) next.add(nb);
        }
        for (const id of next) { visited.add(id); const a = q1("SELECT id, title, type, domain FROM atoms WHERE id = ?", id); if (a) res.nodes.push(a); }
        frontier.clear(); for (const n of next) frontier.add(n);
      }
      return res;
    },

    preference_search: (query?: string, category?: string, limit = 20) => {
      let sql = "SELECT id, title, body, meta FROM atoms WHERE type = 'preference' AND status = 'active'";
      const p: any[] = [];
      if (query) { sql += " AND (title LIKE ? OR body LIKE ?)"; p.push("%" + query + "%", "%" + query + "%"); }
      return q(sql + " ORDER BY confidence DESC LIMIT ?", ...p, limit);
    },

    error_check: (taskDescription: string, limit = 5) => {
      const words = taskDescription.toLowerCase().split(/\s+/).filter((w) => w.length >= 3);
      const conds = words.map(() => "(task_type LIKE ? OR mistake_description LIKE ?)").join(" OR ");
      const params: any[] = []; for (const w of words) { const pat = "%" + w + "%"; params.push(pat, pat); }
      return q("SELECT * FROM error_memory WHERE is_resolved = 0 AND (" + conds + ") ORDER BY occurrence_count DESC LIMIT ?", ...params, limit);
    },
    error_log: (taskType: string, mistake: string, correction: string, severity = "minor") => {
      const now = Math.floor(Date.now() / 1000);
      const crypto = globalThis.crypto;
      const id = Array.from(new TextEncoder().encode(taskType + "|" + mistake)).slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 12);
      db.prepare("INSERT OR REPLACE INTO error_memory (id, task_type, error_category, mistake_description, correction, severity, occurrence_count, last_occurrence, is_resolved, created_at, updated_at) VALUES (?,?,?,?,?,?,1,?,0,?,?)")
        .run(id, taskType, "general", mistake, correction, severity, now, now, now);
      return { id, logged: true };
    },
    error_list: (resolved = false, limit = 20) =>
      q("SELECT * FROM error_memory WHERE is_resolved = ? ORDER BY occurrence_count DESC LIMIT ?", resolved ? 1 : 0, limit),

    stats: () => ({
      total_atoms: q1("SELECT COUNT(*) n FROM atoms").n,
      active: q1("SELECT COUNT(*) n FROM atoms WHERE status='active'").n,
      bonds: q1("SELECT COUNT(*) n FROM bonds").n,
      contradictions: q1("SELECT COUNT(*) n FROM memory_contradictions").n,
      by_domain: Object.fromEntries(q("SELECT domain k, COUNT(*) n FROM atoms WHERE status='active' GROUP BY domain").map((r) => [r.k, r.n])),
      by_type: Object.fromEntries(q("SELECT type k, COUNT(*) n FROM atoms WHERE status='active' GROUP BY type").map((r) => [r.k, r.n])),
    }),

    update_domain: (atomIds: string[], newDomain: string) => {
      const now = Math.floor(Date.now() / 1000); const updated: string[] = [];
      for (const id of atomIds) {
        const r = db.prepare("UPDATE atoms SET domain = ?, updated_at = ? WHERE id = ? AND status = 'active'").run(newDomain, now, id);
        if (Number(r.changes) > 0) updated.push(id);
      }
      return { updated, new_domain: newDomain };
    },

    session_summary: (sessionId: string) => {
      const d = q1("SELECT * FROM atoms WHERE type='session_digest' AND domain = ? AND status='active' ORDER BY created_at DESC", "session/" + sessionId);
      return d ?? { note: "no digest for session" };
    },
    generate_session_digest: (sessionId: string) => {
      const draft = buildSessionDigest(db, sessionId);
      if (!draft) return { created: false, note: "no user messages for session" };
      const now = Math.floor(Date.now() / 1000);
      db.prepare("INSERT INTO atoms (id, type, memory_tier, domain, title, body, confidence, status, source, weight, tags, meta, created_at, updated_at, accessed_at) VALUES (?,?,?,?,?,?,0.7,'active','ai',1.0,'[]','{}',?,?,?)")
        .run(draft.id, "session_digest", "episodic", "session/" + sessionId, draft.title, draft.body, now, now, now);
      return { created: true, ...draft };
    },

    // ── Admin jobs: puntano al server Python ──
    _admin_note: () => "curator_run, learning_run, decay_run, backup/restore, import/export, cleanup_*, reindex_embeddings, find_similar, suggest_bonds: disponibili sul server MCP Python.",
  };
}
