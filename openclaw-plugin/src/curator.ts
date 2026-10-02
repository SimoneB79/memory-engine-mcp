/**
 * Memory Engine TS — Curator port (from Python CognitiveCurator + AutoBondEngine).
 * Conservative maintenance: dry-run by default, safe reversible actions only.
 */
import { DatabaseSync } from "node:sqlite";
import { Engine, Row } from "./engine.js";

export const DURABLE_TYPES = ["decision", "fact", "note", "preference", "procedure", "project"] as const;

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

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "and", "or", "but",
  "in", "on", "at", "to", "for", "of", "with", "by", "from", "as", "this", "that",
  "these", "those", "il", "lo", "la", "i", "gli", "le", "un", "una", "di", "del",
  "della", "dei", "delle", "dello", "degli", "che", "non", "con", "per", "su",
  "come", "dove", "questo", "questa", "quello", "quella",
]);

const IT_WORD = /[a-z0-9_àèéìòù]+/g;

export class Curator {
  private db: DatabaseSync;
  private engine: Engine;
  private cfg: Required<CuratorConfig>;

  constructor(db: DatabaseSync, engine: Engine, config: CuratorConfig = {}) {
    this.db = db;
    this.engine = engine;
    this.cfg = {
      max_atoms_per_run: config.max_atoms_per_run ?? 80,
      compact_min_body_chars: config.compact_min_body_chars ?? 1200,
      compact_max_chars: config.compact_max_chars ?? 600,
      bond_limit_per_atom: config.bond_limit_per_atom ?? 2,
      isolated_limit: config.isolated_limit ?? 40,
      isolated_min_age_days: config.isolated_min_age_days ?? 7,
      isolated_archive_after_days: config.isolated_archive_after_days ?? 90,
      isolated_high_access_threshold: config.isolated_high_access_threshold ?? 3,
      isolated_high_weight_threshold: config.isolated_high_weight_threshold ?? 0.9,
      stale_after_days: config.stale_after_days ?? 180,
      promotion_min_occurrences: config.promotion_min_occurrences ?? 3,
      domain_cluster_threshold: config.domain_cluster_threshold ?? 0.5,
    };
  }

  private q(sql: string, ...p: any[]): Row[] { return this.db.prepare(sql).all(...p) as any[]; }
  private q1(sql: string, ...p: any[]): any { return this.db.prepare(sql).get(...p) as any; }
  private exec(sql: string, ...p: any[]): void { this.db.prepare(sql).run(...p); }

  // ─── STATUS ─────────────────────────────────────────────
  status(): any {
    const now = Math.floor(Date.now() / 1000);
    const ph = DURABLE_TYPES.map(() => "?").join(",");
    const atomTotal = this.q1("SELECT COUNT(*) n FROM atoms WHERE status='active'").n;
    const durableTotal = this.q1(
      "SELECT COUNT(*) n FROM atoms WHERE status='active' AND type IN (" + ph + ")", ...DURABLE_TYPES).n;
    const bondTotal = this.q1("SELECT COUNT(*) n FROM bonds").n;
    const pending = this.q1("SELECT COUNT(*) n FROM human_questions WHERE status='pending'").n;
    const answered = this.q1("SELECT COUNT(*) n FROM human_questions WHERE status='answered'").n;
    const missingCompact = this.q1(
      "SELECT COUNT(*) n FROM atoms WHERE status='active' AND length(COALESCE(body,'')) >= ? AND COALESCE(body_compact,'')=''",
      this.cfg.compact_min_body_chars).n;
    const stale = this.q1(
      "SELECT COUNT(*) n FROM atoms WHERE status='active' AND ? - accessed_at > ?",
      now, this.cfg.stale_after_days * 86400).n;
    const isolated = this.q1(
      "SELECT COUNT(*) n FROM atoms a LEFT JOIN bonds b ON b.from_id=a.id OR b.to_id=a.id " +
      "WHERE a.status='active' AND a.type IN (" + ph + ") AND b.from_id IS NULL " +
      "AND a.domain NOT LIKE 'daily/%' AND a.domain NOT LIKE 'session/%'", ...DURABLE_TYPES).n;
    const byType: Record<string, number> = {};
    for (const r of this.q("SELECT type k, COUNT(*) n FROM atoms WHERE status='active' GROUP BY type ORDER BY n DESC")) byType[r.k] = r.n;
    const topDomains = this.q(
      "SELECT domain k, COUNT(*) n FROM atoms WHERE status='active' GROUP BY domain ORDER BY n DESC LIMIT 12")
      .map((r: any) => ({ domain: r.k, count: r.n }));
    const density = durableTotal ? Math.round((bondTotal / durableTotal) * 1000) / 1000 : 0;
    return {
      atoms_active: atomTotal,
      durable_atoms: durableTotal,
      bonds: bondTotal,
      graph_density_bonds_per_durable_atom: density,
      isolated_durable_atoms: isolated,
      pending_questions: pending,
      answered_questions: answered,
      long_atoms_missing_compact: missingCompact,
      stale_atoms: stale,
      by_type: byType,
      top_domains: topDomains,
      recommendations: this.recommendations(isolated, pending, missingCompact, density),
    };
  }

  private recommendations(isolated: number, pending: number, missingCompact: number, density: number): string[] {
    const recs: string[] = [];
    if (pending) recs.push("Review/dismiss pending human questions before enabling scheduled learning.");
    if (isolated > 20 || density < 0.8) recs.push("Run curator_run(auto_apply=true) to enrich the graph.");
    if (missingCompact) recs.push("Generate body_compact for long atoms to speed recall.");
    if (!recs.length) recs.push("Memory graph looks healthy enough for scheduled curator runs.");
    return recs;
  }

  // ─── RUN ────────────────────────────────────────────────
  run(dryRun = true, autoApply = false, maxAtoms?: number): any {
    const max = maxAtoms ?? this.cfg.max_atoms_per_run;
    const report: any = {
      dry_run: dryRun,
      auto_apply: autoApply,
      started_at: Math.floor(Date.now() / 1000),
      actions: [] as any[],
    };
    const apply = !dryRun && autoApply;
    report.actions.push(...this.compactLongAtoms(apply, max));
    report.actions.push(this.bondPass(apply, max));
    report.actions.push(this.classifyIsolatedAtoms(apply, max));
    report.actions.push(...this.proposePromotions(max));
    report.actions.push(...this.proposeMerges(max));
    report.actions.push({ kind: "learning", status: "skipped", reason: "learning checks not ported to TS plugin yet" });
    report.finished_at = Math.floor(Date.now() / 1000);
    report.status_after = this.status();
    return report;
  }

  // ─── COMPACT ────────────────────────────────────────────
  private compactLongAtoms(apply: boolean, maxAtoms: number): any[] {
    const rows = this.q(
      "SELECT * FROM atoms WHERE status='active' AND length(COALESCE(body,'')) >= ? " +
      "AND COALESCE(body_compact,'')='' ORDER BY weight DESC, access_count DESC LIMIT ?",
      this.cfg.compact_min_body_chars, maxAtoms);
    const actions: any[] = [];
    for (const atom of rows) {
      const compact = this.extractiveCompact(String(atom.body || ""));
      const action: any = {
        kind: "compact", atom_id: atom.id, title: atom.title,
        chars_before: String(atom.body || "").length, body_compact: compact, applied: false,
      };
      if (apply && compact) {
        this.exec("UPDATE atoms SET body_compact=?, updated_at=unixepoch() WHERE id=?", compact, atom.id);
        action.applied = true;
      }
      actions.push(action);
    }
    return actions;
  }

  extractiveCompact(body: string, maxChars?: number): string {
    const max = maxChars ?? this.cfg.compact_max_chars;
    const useful: string[] = [];
    for (const raw of body.split("\n")) {
      const ln = raw.trim();
      if (!ln) continue;
      if (ln.startsWith("#") || ln.startsWith("-") || ln.startsWith("*") || ln.includes(":") || ln.length > 60) {
        useful.push(ln.replace(/\s+/g, " "));
      }
      if (useful.join("\n").length >= max) break;
    }
    if (!useful.length) useful.push(body.slice(0, max).replace(/\s+/g, " ").trim());
    return useful.join("\n").slice(0, max).replace(/\s+$/, "");
  }

  // ─── BOND PASS (AutoBondEngine port, skip semantic) ──────
  private bondPass(apply: boolean, maxAtoms: number): any {
    const atoms = this.q(
      "SELECT * FROM atoms WHERE status='active' ORDER BY weight DESC, access_count DESC LIMIT ?", maxAtoms);
    const seen = new Set<string>();
    const all: any[] = [];
    let applied = 0;
    for (const atom of atoms) {
      const sug = this.suggestBondsForAtom(atom, seen);
      const top = sug.slice(0, this.cfg.bond_limit_per_atom);
      for (const s of top) {
        all.push(s);
        if (apply) {
          this.exec(
            "INSERT OR IGNORE INTO bonds (from_id, to_id, relation, strength, evidence, created_at) VALUES (?,?,?,?,?,unixepoch())",
            s.from_id, s.to_id, s.relation, s.confidence, JSON.stringify({ strategy: s.strategy, reason: s.reason }));
          applied++;
        }
      }
    }
    return {
      kind: "bond_pass", applied: apply, atoms_scanned: atoms.length,
      suggestions: all.length, bonds_applied: applied,
      top_suggestions: all.sort((a, b) => b.confidence - a.confidence).slice(0, 20)
        .map(s => ({ from: s.from_id, to: s.to_id, relation: s.relation, confidence: s.confidence, reason: s.reason.slice(0, 80) })),
    };
  }

  suggestBondsForAtom(atom: Row, seen: Set<string>): any[] {
    return [
      ...this.domainCluster(atom, seen),
      ...this.keywordOverlap(atom, seen),
      ...this.patternDetection(atom, seen),
    ];
  }

  private domainCluster(atom: Row, seen: Set<string>): any[] {
    const domain = String(atom.domain || "general");
    if (domain === "general" || domain === "session") return [];
    const siblings = this.q(
      "SELECT * FROM atoms WHERE domain=? AND status='active' ORDER BY weight DESC LIMIT 50", domain);
    const out: any[] = [];
    const atomTags = this.tagsToSet(atom.tags);
    for (const sib of siblings) {
      if (sib.id === atom.id) continue;
      const key = atom.id + "|" + sib.id + "|related_to";
      if (seen.has(key) || seen.has(sib.id + "|" + atom.id + "|related_to")) continue;
      const sibTags = this.tagsToSet(sib.tags);
      let overlap = 0.3;
      const union = new Set([...atomTags, ...sibTags]);
      if (union.size) {
        let inter = 0;
        for (const t of atomTags) if (sibTags.has(t)) inter++;
        overlap = inter / union.size;
      }
      const conf = 0.3 + overlap * 0.3;
      if (conf >= this.cfg.domain_cluster_threshold - 0.1) {
        out.push({ from_id: atom.id, to_id: sib.id, relation: "related_to",
          confidence: Math.round(conf * 1000) / 1000,
          reason: "Same domain '" + domain + "', tag overlap " + Math.round(overlap * 100) + "%",
          strategy: "domain_cluster" });
        seen.add(key);
      }
    }
    return out;
  }

  private keywordOverlap(atom: Row, seen: Set<string>): any[] {
    const words = (String(atom.title || "").toLowerCase().match(IT_WORD) || [])
      .filter(w => w.length > 2 && !STOP_WORDS.has(w));
    if (!words.length) return [];
    const titleWords = new Set(words);
    let ftsResults: any[] = [];
    try { ftsResults = this.engine.searchFts(words.join(" "), 15, ["active"]); } catch { /* fts optional */ }
    const out: any[] = [];
    for (const r of ftsResults) {
      if (r.id === atom.id) continue;
      const key = atom.id + "|" + r.id + "|related_to";
      if (seen.has(key)) continue;
      const rWords = new Set((String(r.title || "").toLowerCase().match(IT_WORD) || []).filter(w => w.length > 2));
      let overlap = 0;
      for (const w of titleWords) if (rWords.has(w)) overlap++;
      if (overlap >= 2) {
        out.push({ from_id: atom.id, to_id: r.id, relation: "related_to",
          confidence: Math.min(0.8, 0.3 + overlap * 0.15),
          reason: "Title keyword overlap: " + overlap + " words", strategy: "keyword_overlap" });
        seen.add(key);
      }
    }
    return out;
  }

  private patternDetection(atom: Row, seen: Set<string>): any[] {
    const atomId = String(atom.id);
    const parts = atomId.split("_");
    if (parts.length < 2) return [];
    const out: any[] = [];
    for (const prefixLen of [Math.min(3, parts.length - 1), 2]) {
      if (prefixLen < 2) break;
      const prefix = parts.slice(0, prefixLen).join("_");
      const rows = this.q(
        "SELECT id FROM atoms WHERE id LIKE ? AND id != ? AND status='active' LIMIT 20", prefix + "%", atomId);
      for (const r of rows) {
        const isParent = /workspace|overview|setup|status/.test(atomId.toLowerCase());
        const relation = isParent ? "part_of" : "detail_of";
        const [fromId, toId] = isParent ? [atomId, r.id] : [r.id, atomId];
        const key = fromId + "|" + toId + "|" + relation;
        if (seen.has(key) || seen.has(toId + "|" + fromId + "|" + relation)) continue;
        out.push({ from_id: fromId, to_id: toId, relation,
          confidence: 0.7, reason: "Shared ID prefix '" + prefix + "'", strategy: "pattern_detection" });
        seen.add(key);
      }
      if (out.length) break;
    }
    return out;
  }

  private tagsToSet(tags: any): Set<string> {
    if (Array.isArray(tags)) return new Set(tags);
    if (typeof tags === "string") { try { return new Set(JSON.parse(tags)); } catch { return new Set(); } }
    return new Set();
  }

  // ─── ISOLATED CLASSIFICATION ────────────────────────────
  private classifyIsolatedAtoms(apply: boolean, maxAtoms: number): any {
    const now = Math.floor(Date.now() / 1000);
    const limit = Math.min(maxAtoms, this.cfg.isolated_limit);
    const rows = this.q(
      "SELECT a.* FROM atoms a LEFT JOIN bonds b ON b.from_id=a.id OR b.to_id=a.id " +
      "WHERE a.status='active' AND b.from_id IS NULL ORDER BY a.weight DESC, a.access_count DESC, a.created_at ASC LIMIT ?",
      limit * 3);
    const buckets: Record<string, any[]> = { needs_link: [], standalone_ok: [], volatile_candidate: [], archive_candidate: [] };
    let applied = 0;
    for (const atom of rows) {
      const [state, reason] = this.classifyOne(atom, now);
      buckets[state].push({ id: atom.id, title: atom.title, domain: atom.domain, type: atom.type,
        weight: atom.weight, access_count: atom.access_count, reason });
      if (apply) { this.setIsolatedMeta(atom.id, state, reason, now); applied++; }
      if (Object.values(buckets).reduce((n, v) => n + v.length, 0) >= limit) break;
    }
    return {
      kind: "isolated_classification", applied: apply, updated_atoms: applied,
      counts: Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, v.length])),
      samples: Object.fromEntries(Object.entries(buckets).filter(([, v]) => v.length).map(([k, v]) => [k, v.slice(0, 5)])),
      policy: "No pending questions created; curator tags meta and suggests links/archive candidates only.",
    };
  }

  private classifyOne(atom: Row, now: number): [string, string] {
    const domain = String(atom.domain || "");
    const type = String(atom.type || "");
    const createdAt = atom.created_at || now;
    const accessedAt = atom.accessed_at || createdAt;
    const accessCount = atom.access_count || 0;
    const weight = atom.weight || 0;
    let meta: any = {};
    try { meta = JSON.parse(atom.meta || "{}"); } catch { meta = {}; }
    if (meta.allow_isolated) return ["standalone_ok", "Human/previous review marked allow_isolated"];
    if (domain.startsWith("session/") || type === "session_msg") return ["volatile_candidate", "Session/chat atom: let TTL/digest handle it"];
    if (type === "preference") return ["standalone_ok", "Type 'preference' can be naturally standalone"];
    if (now - accessedAt > this.cfg.isolated_archive_after_days * 86400 && accessCount === 0)
      return ["archive_candidate", "Old isolated atom with no access"];
    if (now - createdAt < this.cfg.isolated_min_age_days * 86400 && accessCount < this.cfg.isolated_high_access_threshold)
      return ["volatile_candidate", "Too new and not reused yet; observe"];
    if (weight >= this.cfg.isolated_high_weight_threshold || accessCount >= this.cfg.isolated_high_access_threshold)
      return ["needs_link", "Durable/high-signal isolated atom; suggest bonds"];
    return ["standalone_ok", "Low-signal durable atom; keep standalone"];
  }

  private setIsolatedMeta(atomId: string, state: string, reason: string, now: number): void {
    const row = this.q1("SELECT meta FROM atoms WHERE id=?", atomId);
    if (!row) return;
    let meta: any = {};
    try { meta = JSON.parse(row.meta || "{}"); } catch { meta = {}; }
    meta.isolated_state = state;
    meta.isolated_reason = reason;
    meta.isolated_reviewed_at = now;
    this.exec("UPDATE atoms SET meta=?, updated_at=? WHERE id=?", JSON.stringify(meta), now, atomId);
  }

  // ─── PROMOTIONS / MERGES ────────────────────────────────
  private proposePromotions(maxAtoms: number): any[] {
    const rows = this.q(
      "SELECT id, title FROM atoms WHERE status='active' AND (domain LIKE 'session/%' OR domain LIKE 'daily/%') " +
      "ORDER BY accessed_at DESC LIMIT ?", maxAtoms * 4);
    const counts = new Map<string, number>();
    const examples = new Map<string, string[]>();
    for (const r of rows) for (const phrase of this.candidatePhrases(String(r.title || ""))) {
      counts.set(phrase, (counts.get(phrase) || 0) + 1);
      const ex = examples.get(phrase) || [];
      if (ex.length < 3) ex.push(r.id);
      examples.set(phrase, ex);
    }
    const actions: any[] = [];
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    for (const [phrase, count] of sorted) {
      if (count >= this.cfg.promotion_min_occurrences) {
        actions.push({ kind: "promotion_candidate", phrase, occurrences: count,
          example_atom_ids: examples.get(phrase), applied: false,
          recommendation: "Create/update a durable fact/procedure if this concept is still useful." });
      }
    }
    return actions;
  }

  private candidatePhrases(title: string): string[] {
    const text = title.toLowerCase().replace(/[[^]]+]/g, " ");
    const words = (text.match(IT_WORD) || []).filter(w => w.length >= 4 &&
      !["assistant", "user", "fatto", "questo", "quello", "sono", "come", "della", "degli", "nelle"].includes(w));
    const phrases: string[] = [];
    for (const n of [2, 3]) for (let i = 0; i <= words.length - n; i++) phrases.push(words.slice(i, i + n).join(" "));
    return phrases.slice(0, 8);
  }

  private proposeMerges(maxAtoms: number): any[] {
    const ph = DURABLE_TYPES.map(() => "?").join(",");
    const rows = this.q(
      "SELECT id, title, domain, type FROM atoms WHERE status='active' AND type IN (" + ph + ") " +
      "ORDER BY updated_at DESC LIMIT ?", ...DURABLE_TYPES, maxAtoms * 3);
    const buckets = new Map<string, any[]>();
    for (const r of rows) {
      const key = this.normTitle(String(r.title || ""));
      if (key.length >= 8) {
        const b = buckets.get(key) || [];
        b.push(r);
        buckets.set(key, b);
      }
    }
    const actions: any[] = [];
    for (const [key, atoms] of buckets) {
      if (atoms.length > 1) {
        actions.push({ kind: "merge_candidate", normalized_title: key, atoms: atoms.slice(0, 5),
          applied: false, recommendation: "Review before merge; curator does not merge automatically." });
      }
    }
    return actions.slice(0, 10);
  }

  private normTitle(title: string): string {
    let text = title.toLowerCase().replace(/([^)]*)/g, " ");
    text = text.replace(/20\d{2}[-_/]?\d{0,2}[-_/]?\d{0,2}/g, " ");
    return ((text.match(IT_WORD) || []).slice(0, 8)).join(" ");
  }
}
