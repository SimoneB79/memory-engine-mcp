/**
 * Memory Engine TS — F2: engine port (faithful translation of engine.py).
 * Ranking formula, recall merge/filter and graph expansion are IDENTICAL
 * to the Python implementation; parity tests are the spec.
 */
import { DatabaseSync } from "node:sqlite";

export interface Row { [k: string]: any }

const DEFAULT_CONFIG: any = {
  ranking: {},
  graph_recall: {},
};

function escRe(s: string): string { return s; }

export class Engine {
  db: DatabaseSync;
  config: any;

  constructor(db: DatabaseSync, config: any = {}) {
    this.db = db;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  static INTENT_RULES: Array<[string, string[]]> = [
    ["preference", ["preferisci", "preferenza", "preferenze", "mi piace", "voglio che", "come devo rispondere", "style", "tone"]],
    ["decision", ["perche", "perché", "deciso", "scelto", "scelta", "decisione", "motivo", "ramificata", "trade-off"]],
    ["procedure", ["come si fa", "procedura", "passi", "installare", "configurare", "ripristinare", "deploy", "workflow", "istruzioni"]],
    ["error", ["errore", "error", "fallito", "fallisce", "problema", "rompe", "bug"]],
  ];

  static classifyIntent(query: string): Record<string, number> {
    const q = (query || "").toLowerCase();
    const boosts: Record<string, number> = {};
    for (const [type, kws] of Engine.INTENT_RULES) {
      const hits = kws.reduce((n, k) => (q.includes(k) ? n + 1 : n), 0);
      if (hits) boosts[type] = Math.min(0.15, 0.05 * hits);
    }
    return boosts;
  }

  searchFts(query: string, limit = 10, statuses: string[] = ["active"], memoryTier?: string): Row[] {
    const clean = query.replace(/["'*:()\-^]/g, " ").trim();
    if (!clean) return [];
    const ftsQuery = clean.split(/\s+/).filter((w) => w.length > 1).map((w) => '"' + w + '"*').join(" OR ");
    if (!ftsQuery) return [];
    const ph = statuses.map(() => "?").join(",");
    const params: any[] = [ftsQuery, ...statuses];
    let tier = "";
    if (memoryTier) { tier = " AND a.memory_tier = ?"; params.push(memoryTier); }
    params.push(limit);
    const sql =
      "SELECT a.*, bm25(atoms_fts) as fts_score FROM atoms_fts JOIN atoms a ON atoms_fts.rowid = a.rowid " +
      "WHERE atoms_fts MATCH ? AND a.status IN (" + ph + ")" + tier +
      " ORDER BY CASE a.status WHEN 'active' THEN 0 ELSE 1 END, fts_score LIMIT ?";
    return this.db.prepare(sql).all(...params) as Row[];
  }

  getRelatedAtoms(atomId: string, limit = 10, minStrength = 0.0): Row[] {
    const sql =
      "SELECT a.*, b.relation, b.strength, b.evidence, b.from_id, b.to_id, " +
      "CASE WHEN b.from_id = ? THEN 'out' ELSE 'in' END as direction " +
      "FROM bonds b JOIN atoms a ON a.id = CASE WHEN b.from_id = ? THEN b.to_id ELSE b.from_id END " +
      "WHERE (b.from_id = ? OR b.to_id = ?) AND b.strength >= ? AND a.status = 'active' " +
      "ORDER BY b.strength DESC, a.weight DESC, a.access_count DESC LIMIT ?";
    return this.db.prepare(sql).all(atomId, atomId, atomId, atomId, minStrength, limit) as Row[];
  }

  rankResults(ftsResults: Row[], query: string): Row[] {
    const cfg = this.config.ranking || {};
    const wFts = cfg.fts_weight ?? 0.30;
    const wSem = cfg.semantic_weight ?? 0.30;
    const wConf = cfg.confidence_weight ?? 0.20;
    const wRecency = cfg.recency_weight ?? 0.10;
    const wWeight = cfg.weight_factor ?? 0.10;
    const tierBoosts = cfg.tier_boosts ?? { semantic: 0.04, procedural: 0.03, episodic: 0.0 };
    const statusPenalties = cfg.status_penalties ?? { superseded: -0.25, archived: -0.15, stale: -0.10, merged: -0.35 };
    const expiredPenalty = cfg.expired_penalty ?? -0.30;
    const intentBoosts = Engine.classifyIntent(query);

    const now = Math.floor(Date.now() / 1000);
    const scored: Row[] = [];
    for (const row of ftsResults) {
      const rawFts = row.fts_score;
      const ftsNorm = rawFts !== null && rawFts !== undefined ? (rawFts ? 1.0 / (1.0 + Math.abs(rawFts)) : 0.5) : 0.0;
      const semNorm = row.semantic_score ?? 0.0;
      const conf = row.confidence ?? 0.5;
      const ageDays = Math.max(0, (now - (row.accessed_at ?? now)) / 86400);
      const recency = Math.exp(-ageDays / 90.0);
      const weightNorm = Math.min(1.0, (row.weight ?? 1.0) / 2.0);
      let tierBoost = tierBoosts[row.memory_tier ?? "semantic"] ?? 0.0;
      let statusPenalty = statusPenalties[row.status ?? "active"] ?? 0.0;
      const vuntil = row.valid_until;
      if (vuntil && now > vuntil) statusPenalty += expiredPenalty;
      const intentBoost = intentBoosts[row.type ?? ""] ?? 0.0;
      let score =
        wFts * ftsNorm + wSem * semNorm + wConf * conf + wRecency * recency +
        wWeight * weightNorm + tierBoost + statusPenalty + intentBoost;
      score = Math.max(0.0, Math.min(1.0, score));
      row.rank_score = Math.round(score * 10000) / 10000;
      row.rank_breakdown = { final: row.rank_score, intent_boost: Math.round(intentBoost * 1000) / 1000 };
      scored.push(row);
    }
    scored.sort((a, b) => (b.rank_score as number) - (a.rank_score as number));
    return scored;
  }

  recall(query: string, limit = 5, opts: { domain?: string | null; semantic?: boolean; memoryTier?: string; includeSuperseded?: boolean; minWeight?: number } = {}): Row[] {
    const { domain, semantic = false, memoryTier, includeSuperseded = false, minWeight = 0.0 } = opts;
    const g = this.config.graph_recall || {};
    const graphEnabled = g.enabled ?? true;
    const seedLimit = Math.max(1, g.seed_limit ?? 3);
    const neighborLimit = Math.max(0, g.neighbors_per_seed ?? 4);
    const graphWeight = g.graph_weight ?? 0.55;
    const minStrength = g.min_strength ?? 0.35;

    const statuses = includeSuperseded ? ["active", "superseded"] : ["active"];
    const ftsResults = this.searchFts(query, limit * 3, statuses, memoryTier);

    const merged: Record<string, Row> = {};
    for (const r of ftsResults) { r.semantic_score = null; r.match_kind = "direct"; merged[r.id] = r; }

    const filtered = Object.values(merged).filter((r) => {
      if ((r.weight ?? 1.0) < minWeight) return false;
      if (domain && r.domain !== domain) return false;
      if (memoryTier && r.memory_tier !== memoryTier) return false;
      if (!includeSuperseded && (r.status ?? "active") !== "active") return false;
      return true;
    });

    let ranked = this.rankResults(filtered, query);
    ranked = this.expandGraphContext(ranked, limit, domain, minWeight, seedLimit, neighborLimit, graphWeight, minStrength);
    return ranked.slice(0, limit);
  }

  expandGraphContext(ranked: Row[], limit: number, domain: string | null | undefined, minWeight: number, seedLimit: number, neighborLimit: number, graphWeight: number, minStrength: number): Row[] {
    if (neighborLimit <= 0 || ranked.length === 0) return ranked;
    const byId: Record<string, Row> = {};
    for (const r of ranked) byId[r.id] = r;
    const expanded = [...ranked];
    for (const seed of ranked.slice(0, seedLimit)) {
      const neighbors = this.getRelatedAtoms(seed.id, neighborLimit, minStrength);
      for (const n of neighbors) {
        if ((n.weight ?? 1.0) < minWeight) continue;
        if (domain && n.domain !== domain) continue;
        if ((n.status ?? "active") !== "active") continue;
        let rel = (seed.rank_score as number) * (n.strength ?? 0.5) * graphWeight;
        rel *= Math.min(1.0, (n.weight ?? 1.0) / 2.0);
        rel = Math.round(rel * 10000) / 10000;
        if (byId[n.id]) {
          const ex = byId[n.id];
          if (rel > (ex.graph_score ?? 0)) ex.graph_score = rel;
          ex.rank_score = Math.round(Math.min(1.0, (ex.rank_score as number) + rel * 0.25) * 10000) / 10000;
          ex.match_kind = (ex.match_kind ?? "direct") + "+graph";
        } else {
          n.fts_score = null; n.semantic_score = null;
          n.rank_score = rel; n.match_kind = "graph"; n.graph_score = rel;
          expanded.push(n); byId[n.id] = n;
        }
      }
    }
    expanded.sort((a, b) => (b.rank_score as number) - (a.rank_score as number));
    return expanded;
  }
}
