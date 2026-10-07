/**
 * Memory Engine TS — Learning module (full Python parity port, v4.5.0).
 * 7 detector + dedup + capacity + answer side-effects, port fedele di learning.py/engine.py.
 */
import type { DatabaseSync } from "node:sqlite";

export interface LearningConfig {
  max_pending_questions?: number;
  contradiction_threshold?: number;
  weak_confidence_threshold?: number;
  weak_access_threshold?: number;
  merge_similarity_threshold?: number;
  decay_critical_threshold?: number;
  gap_body_min_chars?: number;
  graph_gap_enabled?: boolean;
  graph_gap_min_weight?: number;
  graph_gap_limit?: number;
  graph_gap_types?: string[];
  graph_gap_excluded_domain_prefixes?: string[];
}

function parseTags(v: any): Set<string> {
  if (Array.isArray(v)) return new Set(v.map(String));
  try { return new Set(JSON.parse(v || "[]").map(String)); } catch { return new Set(); }
}

export function computeSimilarity(a: any, b: any): number {
  const wa = new Set(String(a.title || "").toLowerCase().split(/\s+/).filter(Boolean));
  const wb = new Set(String(b.title || "").toLowerCase().split(/\s+/).filter(Boolean));
  const inter = [...wa].filter((w) => wb.has(w)).length;
  const union = new Set([...wa, ...wb]).size;
  const jaccard = wa.size && wb.size && union ? inter / union : 0;
  const domainBonus = a.domain === b.domain ? 0.2 : 0;
  const ta = parseTags(a.tags), tb = parseTags(b.tags);
  const tInter = [...ta].filter((t) => tb.has(t)).length;
  const tUnion = new Set([...ta, ...tb]).size;
  const tagSim = ta.size && tb.size && tUnion ? tInter / tUnion : 0;
  return Math.min(1, jaccard * 0.5 + tagSim * 0.3 + domainBonus);
}

export class Learning {
  constructor(private db: DatabaseSync, public config: LearningConfig = {}) {}

  private q(sql: string, ...p: any[]): any[] { return this.db.prepare(sql).all(...p) as any[]; }
  private q1(sql: string, ...p: any[]): any { return this.db.prepare(sql).get(...p) as any; }
  private x(sql: string, ...p: any[]): void { this.db.prepare(sql).run(...p); }

  /** Garantisce le colonne options/meta (migration idempotente). */
  ensureSchema(): void {
    const cols = new Set(this.q("PRAGMA table_info(human_questions)").map((c: any) => c.name));
    if (!cols.has("options")) this.x("ALTER TABLE human_questions ADD COLUMN options TEXT");
    if (!cols.has("meta")) this.x("ALTER TABLE human_questions ADD COLUMN meta TEXT");
  }

  // ─── DETECTOR (parità engine.py) ───────────────────────
  detectContradictions(): any[] {
    const thr = this.config.contradiction_threshold ?? 0.7;
    const atoms = this.q("SELECT * FROM atoms WHERE status='active' ORDER BY id LIMIT 500");
    const out: any[] = [];
    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const a = atoms[i], b = atoms[j];
        if (a.domain !== b.domain) continue;
        const sim = computeSimilarity(a, b);
        if (sim >= thr) out.push({ atom_a: a.id, atom_b: b.id, title_a: a.title, title_b: b.title, similarity: Math.round(sim * 1000) / 1000 });
      }
    }
    return out;
  }

  detectWeakAtoms(): any[] {
    const conf = this.config.weak_confidence_threshold ?? 0.4;
    const acc = this.config.weak_access_threshold ?? 5;
    return this.q("SELECT * FROM atoms WHERE status='active' AND confidence < ? AND access_count >= ? ORDER BY access_count DESC", conf, acc);
  }

  detectMergeCandidates(): any[] {
    const thr = this.config.merge_similarity_threshold ?? 0.85;
    const atoms = this.q("SELECT * FROM atoms WHERE status='active' ORDER BY id LIMIT 500");
    const out: any[] = [];
    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const sim = computeSimilarity(atoms[i], atoms[j]);
        if (sim >= thr) out.push({ atom_a: atoms[i].id, atom_b: atoms[j].id, title_a: atoms[i].title, title_b: atoms[j].title, similarity: Math.round(sim * 1000) / 1000 });
      }
    }
    return out;
  }

  detectDecayCritical(): any[] {
    const thr = this.config.decay_critical_threshold ?? 0.15;
    return this.q("SELECT * FROM atoms WHERE status='active' AND weight < ? ORDER BY weight ASC", thr);
  }

  detectGaps(): any[] {
    const minChars = this.config.gap_body_min_chars ?? 50;
    return this.q("SELECT * FROM atoms WHERE status='active' AND (body IS NULL OR LENGTH(COALESCE(body,'')) < ?) ORDER BY access_count DESC", minChars);
  }

  detectGraphGaps(): any[] {
    const minWeight = this.config.graph_gap_min_weight ?? 0.6;
    const limit = this.config.graph_gap_limit ?? 20;
    const types = this.config.graph_gap_types ?? ["fact", "decision", "procedure", "preference", "project", "note"];
    const excluded = this.config.graph_gap_excluded_domain_prefixes ?? ["daily/", "session/"];
    const rows = this.q("SELECT a.* FROM atoms a LEFT JOIN bonds bo ON bo.from_id = a.id OR bo.to_id = a.id WHERE a.status='active' AND a.weight >= ? AND bo.from_id IS NULL ORDER BY a.weight DESC, a.access_count DESC LIMIT ?", minWeight, limit * 3);
    return rows.filter((r: any) => {
      const t = JSON.parse(r.type ? JSON.stringify(r.type) : '"' + r.type + '"');
      return types.includes(String(r.type)) && !excluded.some((p) => String(r.domain || "").startsWith(p));
    }).slice(0, limit);
  }

  // ─── RUN (parità learning.py run_all_checks) ───────────
  addQuestion(atomIds: string[], questionType: string, question: string, options: string[], meta: any): any {
    const now = Math.floor(Date.now() / 1000);
    const id = "q_" + questionType + "_" + atomIds.join("-").slice(0, 40) + "_" + now;
    this.x("INSERT OR IGNORE INTO human_questions (id, atom_ids, question_type, question, options, meta, status, created_at) VALUES (?,?,?,?,?,?,?,?)",
      id, JSON.stringify(atomIds), questionType, question, JSON.stringify(options), JSON.stringify(meta), "pending", now);
    return { id, question_type: questionType, question };
  }

  runAllChecks(): any[] {
    this.ensureSchema();
    const maxPending = this.config.max_pending_questions ?? 20;
    const pending = this.q("SELECT * FROM human_questions WHERE status='pending' LIMIT 100");
    if (pending.length >= maxPending) return [];

    // dedup: non ricreare domande già pending/answered/dismissed (atom_ids normalizzati sorted)
    const existingKeys = new Set<string>();
    for (const qrow of this.q("SELECT question_type, atom_ids FROM human_questions WHERE status IN ('pending','answered','dismissed')")) {
      let ids: string[];
      try { ids = JSON.parse(qrow.atom_ids || "[]"); } catch { ids = [qrow.atom_ids]; }
      existingKeys.add(qrow.question_type + "|" + JSON.stringify([...ids].sort()));
    }

    const created: any[] = [];
    const hasCapacity = () => pending.length + created.length < maxPending;
    const key = (t: string, ids: string[]) => t + "|" + JSON.stringify([...ids].sort());
    const seen = (t: string, ids: string[]) => { const k = key(t, ids); if (existingKeys.has(k)) return true; existingKeys.add(k); return false; };

    // 1. Contraddizioni
    for (const c of this.detectContradictions()) {
      if (!hasCapacity()) return created;
      const ids = [c.atom_a, c.atom_b];
      if (seen("contradiction", ids)) continue;
      created.push(this.addQuestion(ids, "contradiction",
        `Ho due informazioni potenzialmente in conflitto:\n• ${c.title_a}\n• ${c.title_b}\nSimilarità: ${c.similarity}. Quale è corretta, o vanno unify?`,
        [c.title_a, c.title_b, "Entrambe corrette (contesti diversi)"], { similarity: c.similarity }));
    }

    // 2. Weak atoms
    for (const w of this.detectWeakAtoms()) {
      if (!hasCapacity()) return created;
      if (seen("weak", [w.id])) continue;
      created.push(this.addQuestion([w.id], "weak",
        `'${w.title}' è consultato spesso (${w.access_count} volte) ma ha confidence bassa (${w.confidence}). Puoi confermare che è corretto?`,
        ["Sì, corretto", "No, da correggere", "Non sono sicuro"], { confidence: w.confidence, access_count: w.access_count }));
    }

    // 3. Merge candidates
    for (const m of this.detectMergeCandidates()) {
      if (!hasCapacity()) return created;
      const ids = [m.atom_a, m.atom_b];
      if (seen("merge_candidate", ids)) continue;
      created.push(this.addQuestion(ids, "merge_candidate",
        `Questi due atomi sembrano duplicati (similarità ${m.similarity}):\n• ${m.title_a}\n• ${m.title_b}\nLi unifico?`,
        ["Sì, unifica", "No, sono diversi"], { similarity: m.similarity }));
    }

    // 4. Decay critical
    for (const d of this.detectDecayCritical()) {
      if (!hasCapacity()) return created;
      if (seen("decay_critical", [d.id])) continue;
      created.push(this.addQuestion([d.id], "decay_critical",
        `'${d.title}' non è più consultato da tempo (weight: ${Number(d.weight).toFixed(3)}). Archivio o è ancora rilevante?`,
        ["Archivia", "Rilevante, aggiorna weight", "Elimina"], { weight: d.weight }));
    }

    // 5. Gaps
    for (const g of this.detectGaps()) {
      if (!hasCapacity()) return created;
      if (seen("gap", [g.id])) continue;
      created.push(this.addQuestion([g.id], "gap",
        `'${g.title}' ha informazioni incomplete. Puoi aggiungere dettagli?`,
        [], { body_length: String(g.body || "").length }));
    }

    // 6. Graph gaps (default OFF, come Python v1.5.2)
    if (this.config.graph_gap_enabled === true) {
      for (const g of this.detectGraphGaps()) {
        if (!hasCapacity()) return created;
        if (seen("graph_gap", [g.id])) continue;
        created.push(this.addQuestion([g.id], "graph_gap",
          `'${g.title}' è un atomo importante ma isolato nel grafo. Vuoi collegarlo ad altri atomi correlati?`,
          ["Suggerisci bond", "Mantieni isolato", "Archivia"], { weight: g.weight, access_count: g.access_count }));
      }
    }

    return created;
  }

  // ─── ANSWER SIDE-EFFECTS (parità learning.py process_answer) ───
  applyAnswerSideEffects(qrow: any, answer: string): string[] {
    const effects: string[] = [];
    let atomIds: string[] = [];
    try { atomIds = JSON.parse(qrow.atom_ids || "[]"); } catch { /* noop */ }
    const now = Math.floor(Date.now() / 1000);
    const low = answer.toLowerCase();

    const updateAtom = (id: string, sets: string, ...vals: any[]) => {
      this.x(`UPDATE atoms SET ${sets}, updated_at=? WHERE id=?`, ...vals, now, id);
      effects.push(`${id}: ${sets}`);
    };

    switch (qrow.question_type) {
      case "weak":
        if (low.includes("corretto") || low.includes("sì") || low.includes("si,")) {
          for (const aid of atomIds) updateAtom(aid, "confidence=0.9");
        } else if (low.includes("correggere")) {
          for (const aid of atomIds) updateAtom(aid, "confidence=0.2");
        }
        break;
      case "decay_critical":
        if (low.includes("archivia")) { for (const aid of atomIds) updateAtom(aid, "status='archived'"); }
        else if (low.includes("rilevante")) { for (const aid of atomIds) updateAtom(aid, "weight=1.0"); }
        break;
      case "merge_candidate":
        if (low.includes("unifi") && atomIds.length >= 2) {
          // merge soft: bond + status merged sul duplicato (stessa semantica di memory_merge_atoms)
          for (const b of this.q("SELECT * FROM bonds WHERE from_id=? OR to_id=?", atomIds[1], atomIds[1])) {
            const nf = b.from_id === atomIds[1] ? atomIds[0] : b.from_id;
            const nt = b.to_id === atomIds[1] ? atomIds[0] : b.to_id;
            if (nf !== nt) this.x("INSERT OR IGNORE INTO bonds (from_id, to_id, relation, strength, evidence, created_at) VALUES (?,?,?,?,?,unixepoch())", nf, nt, b.relation, b.strength, b.evidence);
          }
          updateAtom(atomIds[1], "status='merged'");
          effects.push(`merged ${atomIds[1]} -> ${atomIds[0]}`);
        }
        break;
      case "contradiction":
        if (atomIds.length >= 2) {
          for (const aid of atomIds) {
            const at = this.q1("SELECT meta FROM atoms WHERE id=?", aid);
            if (!at) continue;
            let meta: any = {}; try { meta = JSON.parse(at.meta || "{}"); } catch { /* noop */ }
            meta.contradiction_resolution = answer;
            updateAtom(aid, "meta=?", JSON.stringify(meta));
          }
        }
        break;
      case "gap":
        // la risposta umana arricchisce il body in place ([Human note], come il Python)
        for (const aid of atomIds) {
          const at = this.q1("SELECT body FROM atoms WHERE id=?", aid);
          if (!at) continue;
          const newBody = String(at.body || "") + `\n\n[Human note]: ${answer}`;
          updateAtom(aid, "body=?", newBody);
        }
        break;
      case "graph_gap":
        if (low.includes("archivia")) { for (const aid of atomIds) updateAtom(aid, "status='archived'"); }
        else if (low.includes("mantieni")) {
          for (const aid of atomIds) {
            const at = this.q1("SELECT meta FROM atoms WHERE id=?", aid);
            if (!at) continue;
            let meta: any = {}; try { meta = JSON.parse(at.meta || "{}"); } catch { /* noop */ }
            meta.allow_isolated = true;
            updateAtom(aid, "meta=?", JSON.stringify(meta));
          }
        }
        break;
    }
    return effects;
  }
}
