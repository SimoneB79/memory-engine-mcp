/**
 * Memory Engine TS — admin & maintenance tools (Step 1 parity port).
 * Pure SQL + logic port from the Python MCP server; no Python residue.
 */
import { DatabaseSync } from "node:sqlite";
import { embed } from "./embeddings.js";
import { Type } from "typebox";
const T = Type;
import { Row } from "./engine.js";

export interface AdminToolDef { name: string; description: string; parameters: any; execute: (a: any) => any }

const NL = String.fromCharCode(10);

export function buildAdminDefs(db: DatabaseSync): AdminToolDef[] {
  const q = (sql: string, ...p: any[]) => db.prepare(sql).all(...p) as any[];
  const q1 = (sql: string, ...p: any[]) => db.prepare(sql).get(...p) as any;
  const x = (sql: string, ...p: any[]) => db.prepare(sql).run(...p);

  return [
    {
      name: "memory_summary",
      description: "Hierarchical 3-level memory summary: L0 global counts, L1 per-domain top atoms, L2 pointer to detail.",
      parameters: T.Object({ domain: T.Optional(T.String()) }),
      execute: (a: any) => {
        const dom = a.domain || null;
        const l0 = {
          atoms_total: q1("SELECT COUNT(*) n FROM atoms").n,
          atoms_active: q1("SELECT COUNT(*) n FROM atoms WHERE status='active'").n,
          bonds: q1("SELECT COUNT(*) n FROM bonds").n,
          errors: q1("SELECT COUNT(*) n FROM error_memory").n,
          by_type: Object.fromEntries(q("SELECT type k, COUNT(*) n FROM atoms WHERE status='active' GROUP BY type").map((r: Row) => [r.k, r.n])),
        };
        const domains = dom ? [dom] : q("SELECT domain k, COUNT(*) n FROM atoms WHERE status='active' GROUP BY domain ORDER BY n DESC LIMIT 15").map((r: Row) => r.k);
        const l1: any = {};
        for (const d of domains) {
          l1[d] = q("SELECT id, title, weight, type FROM atoms WHERE status='active' AND domain=? ORDER BY weight DESC LIMIT 5", d).map((r: Row) => ({ id: r.id, title: r.title, weight: r.weight, type: r.type }));
        }
        return { level0: l0, level1_domains: l1, level2_note: "Use memory_list_atoms / memory_get_atom for full content." };
      },
    },
    {
      name: "memory_delete_atom",
      description: "Delete an atom: soft (status='deleted', default) or hard (remove row + bonds + versions). Hard delete is irreversible.",
      parameters: T.Object({ id: T.String(), hard: T.Optional(T.Boolean()) }),
      execute: (a: any) => {
        const row = q1("SELECT id, title FROM atoms WHERE id=?", a.id);
        if (!row) return { deleted: false, reason: "not found" };
        if (a.hard) {
          x("DELETE FROM bonds WHERE from_id=? OR to_id=?", a.id, a.id);
          x("DELETE FROM atom_versions WHERE atom_id=?", a.id);
          x("DELETE FROM atom_embeddings WHERE atom_id=?", a.id);
          x("DELETE FROM atoms WHERE id=?", a.id);
        } else {
          x("UPDATE atoms SET status='deleted', updated_at=unixepoch() WHERE id=?", a.id);
        }
        return { deleted: true, atom_id: a.id, title: row.title, mode: a.hard ? "hard" : "soft" };
      },
    },
    {
      name: "memory_unlink",
      description: "Remove a bond between two atoms.",
      parameters: T.Object({ from_id: T.String(), to_id: T.String(), relation: T.Optional(T.String()) }),
      execute: (a: any) => {
        const before = q1("SELECT COUNT(*) n FROM bonds").n;
        if (a.relation) x("DELETE FROM bonds WHERE from_id=? AND to_id=? AND relation=?", a.from_id, a.to_id, a.relation);
        else x("DELETE FROM bonds WHERE (from_id=? AND to_id=?) OR (from_id=? AND to_id=?)", a.from_id, a.to_id, a.to_id, a.from_id);
        const removed = before - q1("SELECT COUNT(*) n FROM bonds").n;
        return { removed };
      },
    },
    {
      name: "memory_error_list",
      description: "List recorded error memories.",
      parameters: T.Object({ limit: T.Optional(T.Number()) }),
      execute: (a: any) => q("SELECT * FROM error_memory ORDER BY rowid DESC LIMIT ?", a.limit ?? 20),
    },
    {
      name: "memory_list_contradictions",
      description: "List contradiction records (superseded atoms).",
      parameters: T.Object({ limit: T.Optional(T.Number()) }),
      execute: (a: any) => q("SELECT * FROM memory_contradictions ORDER BY rowid DESC LIMIT ?", a.limit ?? 20),
    },
    {
      name: "memory_decay_run",
      description: "Decay cycle: reduce weight of atoms not accessed within interval_days by factor (default 0.95). Returns decayed count.",
      parameters: T.Object({ interval_days: T.Optional(T.Number()), factor: T.Optional(T.Number()), dry_run: T.Optional(T.Boolean()) }),
      execute: (a: any) => {
        const interval = a.interval_days ?? 30;
        const factor = a.factor ?? 0.95;
        const stale = q("SELECT id, weight FROM atoms WHERE status='active' AND unixepoch() - accessed_at > ? AND weight > 0.05", interval * 86400);
        if (!a.dry_run) {
          for (const r of stale) x("UPDATE atoms SET weight=round(weight*?,4), updated_at=unixepoch() WHERE id=?", factor, r.id);
        }
        return { decayed: stale.length, interval_days: interval, factor, dry_run: !!a.dry_run };
      },
    },
    {
      name: "memory_update_domain",
      description: "Bulk update the domain of one or more atoms.",
      parameters: T.Object({ atom_ids: T.Array(T.String()), new_domain: T.String() }),
      execute: (a: any) => {
        let updated = 0;
        for (const id of a.atom_ids) {
          const r = x("UPDATE atoms SET domain=?, updated_at=unixepoch() WHERE id=? AND status='active'", a.new_domain, id);
          updated += (r as any).changes ?? 0;
        }
        return { updated, new_domain: a.new_domain };
      },
    },
    {
      name: "memory_classify_memory_tier",
      description: "Infer the 3-tier memory class (episodic/semantic/procedural) for a prospective atom.",
      parameters: T.Object({ type: T.Optional(T.String()), domain: T.Optional(T.String()), meta: T.Optional(T.Any()) }),
      execute: (a: any) => {
        const t = a.type || "fact";
        if (["log", "event", "session_msg", "session_digest"].includes(t)) return { tier: "episodic" };
        if (["preference", "procedure"].includes(t)) return { tier: "procedural" };
        const d = a.domain || "";
        if (d.startsWith("session/") || d.startsWith("daily/")) return { tier: "episodic" };
        return { tier: "semantic" };
      },
    },
    {
      name: "memory_cleanup_sessions",
      description: "Purge expired session_msg/session_digest atoms (TTL passed). Returns purged count.",
      parameters: T.Object({ max_age_days: T.Optional(T.Number()), dry_run: T.Optional(T.Boolean()) }),
      execute: (a: any) => {
        const maxAge = a.max_age_days ?? 7;
        const expired = q("SELECT id FROM atoms WHERE type IN ('session_msg','session_digest') AND status='active' AND unixepoch() - created_at > ?", maxAge * 86400);
        if (!a.dry_run) {
          for (const r of expired) x("UPDATE atoms SET status='expired', updated_at=unixepoch() WHERE id=?", r.id);
        }
        return { purged: expired.length, max_age_days: maxAge, dry_run: !!a.dry_run };
      },
    },
    {
      name: "memory_find_similar",
      description: "Find atoms similar to a reference atom. Semantic via embeddings (cosine) with FTS fallback.",
      parameters: T.Object({ atom_id: T.String(), limit: T.Optional(T.Number()) }),
      execute: async (a: any) => {
        const ref = q1("SELECT id, title, COALESCE(body_compact, body, '') body, domain FROM atoms WHERE id=?", a.atom_id);
        if (!ref) return { error: "atom not found" };
        // 1) semantica: embedding del riferimento + coseno su atom_embeddings (parita' Python find_similar_atoms)
        const refEmb = await embed(String(ref.title) + ". " + String(ref.body || "").slice(0, 1500));
        if (refEmb) {
          const rows = db.prepare("SELECT e.atom_id id, e.embedding, a.title, a.status, a.domain FROM atom_embeddings e JOIN atoms a ON a.id = e.atom_id WHERE a.status='active' AND e.atom_id != ?").all(ref.id) as any[];
          const scored: any[] = [];
          let skippedCorrupt = 0;
          for (const r of rows) {
            const buf = Buffer.isBuffer(r.embedding) ? r.embedding : Buffer.from(r.embedding?.buffer ?? r.embedding);
            if (!buf || !buf.length || buf.length % 4 !== 0 || buf.length / 4 !== refEmb.length) { skippedCorrupt++; continue; }
            const v = new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
            let dot = 0, na = 0, nb = 0;
            for (let i = 0; i < v.length; i++) { dot += refEmb[i] * v[i]; na += refEmb[i] * refEmb[i]; nb += v[i] * v[i]; }
            const cos = na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
            if (cos > 0.55) scored.push({ id: r.id, title: r.title, domain: r.domain, score: Math.round(cos * 10000) / 10000 });
          }
          scored.sort((p2, c) => c.score - p2.score);
          if (scored.length) return { reference: ref.id, mode: "semantic", skipped_corrupt: skippedCorrupt, similar: scored.slice(0, a.limit ?? 5) };
        }
        // 2) fallback FTS (ollama down o nessun embedding sopra soglia)
        const words = String(ref.title || "").toLowerCase().split(/[^a-z0-9_]+/).filter((w: string) => w.length > 3);
        const out: any[] = [];
        const seen = new Set([ref.id]);
        for (const w of words.length ? [words.join(" ")] : []) {
          let hits: any[] = [];
          try { hits = db.prepare("SELECT a.id, a.title, bm25(atoms_fts) score FROM atoms_fts JOIN atoms a ON atoms_fts.rowid=a.rowid WHERE atoms_fts MATCH ? AND a.status='active' LIMIT 20").all('"' + w + '"'); } catch { hits = []; }
          for (const h of hits) { if (seen.has(h.id)) continue; seen.add(h.id); out.push({ id: h.id, title: h.title, score: h.score }); }
        }
        return { reference: ref.id, mode: refEmb ? "fts (no embeddings above threshold)" : "fts-fallback (ollama non raggiungibile)", similar: out.slice(0, a.limit ?? 5) };
      },
    },
    {
      name: "memory_merge_atoms",
      description: "Merge duplicate atoms into a primary: move bonds, mark duplicates merged (soft). Returns merge report.",
      parameters: T.Object({ primary_id: T.String(), duplicate_ids: T.Array(T.String()) }),
      execute: (a: any) => {
        const prim = q1("SELECT id, title FROM atoms WHERE id=?", a.primary_id);
        if (!prim) return { error: "primary not found" };
        let bondsMoved = 0;
        for (const dup of a.duplicate_ids) {
          if (dup === a.primary_id) continue;
          for (const b of q("SELECT * FROM bonds WHERE from_id=? OR to_id=?", dup, dup)) {
            const nf = b.from_id === dup ? a.primary_id : b.from_id;
            const nt = b.to_id === dup ? a.primary_id : b.to_id;
            if (nf === nt) continue;
            x("INSERT OR IGNORE INTO bonds (from_id, to_id, relation, strength, evidence, created_at) VALUES (?,?,?,?,?,unixepoch())", nf, nt, b.relation, b.strength, b.evidence);
            bondsMoved++;
          }
          x("UPDATE atoms SET status='merged', meta=json_set(COALESCE(meta,'{}'), '$.merged_into', ?), updated_at=unixepoch() WHERE id=?", a.primary_id, dup);
        }
        return { primary: a.primary_id, duplicates: a.duplicate_ids.length, bonds_moved: bondsMoved };
      },
    },
    {
      name: "memory_cleanup_duplicates",
      description: "Detect duplicate durable atoms by normalized title (report only, or auto-merge with auto_apply).",
      parameters: T.Object({ dry_run: T.Optional(T.Boolean()), limit: T.Optional(T.Number()) }),
      execute: (a: any) => {
        const rows = q("SELECT id, title, type FROM atoms WHERE status='active' AND type IN ('fact','decision','procedure','preference','project') ORDER BY updated_at DESC LIMIT ?", (a.limit ?? 60) * 3);
        const norm = (t: string) => String(t || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/20[0-9][0-9][0-9 ]*/g, " ").split(" ").filter((w: string) => w.length > 2).slice(0, 6).join(" ");
        const buckets = new Map<string, any[]>();
        for (const r of rows) {
          const k = norm(r.title);
          if (k.length < 8) continue;
          const b = buckets.get(k) || [];
          b.push(r);
          buckets.set(k, b);
        }
        const dupGroups = [...buckets.entries()].filter(([, v]) => v.length > 1);
        let merged = 0;
        if (!a.dry_run) {
          for (const [, g] of dupGroups) {
            const prim = g.sort((p: any, d: any) => (d.updated_at || 0) - (p.updated_at || 0))[0];
            x("UPDATE atoms SET status='merged', meta=json_set(COALESCE(meta,'{}'), '$.merged_into', ?), updated_at=unixepoch() WHERE id=?", prim.id, g.filter((z: any) => z.id !== prim.id)[0].id);
            merged++;
          }
        }
        return { duplicate_groups: dupGroups.length, groups: dupGroups.slice(0, 10).map(([, v]) => v.map((r: any) => r.id)), merged, dry_run: !!a.dry_run };
      },
    },
  ];
}
