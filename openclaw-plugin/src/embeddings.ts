/**
 * Memory Engine TS — embeddings via Ollama (nomic-embed-text).
 * Reads/writes the same atom_embeddings table used by the Python engine.
 */
import { DatabaseSync } from "node:sqlite";

const OLLAMA = process.env.OLLAMA_HOST ?? "http://ollama:11434";
const MODEL = process.env.ME_EMBED_MODEL ?? "nomic-embed-text";

export async function embed(text: string): Promise<Float32Array | null> {
  try {
    const res = await fetch(OLLAMA + "/api/embed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, input: text }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data: any = await res.json();
    const vec: number[] | undefined = data?.embeddings?.[0] ?? data?.embedding;
    if (!vec || !vec.length) return null;
    return new Float32Array(vec);
  } catch {
    return null;
  }
}

function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// cache vettori Float32Array per atom_id (evita riconversione buffer a ogni query)
const _vecCache = new Map<string, Float32Array>();
const VEC_CACHE_MAX = 20000;

function _cachedVec(id: string, buf: Buffer): Float32Array | null {
  if (!buf || !buf.length || buf.length % 4 !== 0) return null;
  const hit = _vecCache.get(id);
  if (hit && hit.byteLength === buf.length) return hit;
  if (_vecCache.size >= VEC_CACHE_MAX) _vecCache.clear();
  const v = new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
  _vecCache.set(id, v);
  return v;
}

// penalita' di dominio allineate all'engine FTS (session/daily inquinano la semantica)
const DOMAIN_PENALTY: Array<[string, number]> = [["session/", -0.05], ["daily/", -0.05]];

export async function semanticSearch(
  db: DatabaseSync,
  query: string,
  limit = 10,
  domain?: string
): Promise<Array<{ id: string; title: string; domain: string; type: string; semantic_score: number }>> {
  const qv = await embed(query);
  if (!qv) return [];
  const rows = db
    .prepare(
      "SELECT e.atom_id as id, e.embedding, a.title, a.domain, a.type, a.status " +
      "FROM atom_embeddings e JOIN atoms a ON a.id = e.atom_id " +
      "WHERE a.status = 'active'"
    )
    .all() as any[];
  const scored: Array<{ id: string; title: string; domain: string; type: string; semantic_score: number }> = [];
  let skippedCorrupt = 0;
  for (const r of rows) {
    if (domain && r.domain !== domain) continue;
    const buf = Buffer.isBuffer(r.embedding) ? r.embedding : Buffer.from(r.embedding?.buffer ?? r.embedding);
    const v = _cachedVec(r.id, buf);
    if (!v || v.length !== qv.length) { skippedCorrupt++; continue; } // riga anomala: dimensione incoerente, scartata e conteggiata
    let score = cosine(qv, v);
    for (const [pfx, pen] of DOMAIN_PENALTY) { if (String(r.domain || "").startsWith(pfx)) { score += pen; break; } }
    scored.push({ id: r.id, title: r.title, domain: r.domain, type: r.type, semantic_score: Math.round(score * 10000) / 10000 });
  }
  (semanticSearch as any)._lastSkippedCorrupt = skippedCorrupt;
  scored.sort((a, b) => b.semantic_score - a.semantic_score);
  // cutoff relativo: i punteggi nomic sono compressi (0.5-0.75); un top-N fisso mescola
  // risultati rilevanti e rumore distanti pochi centesimi. Teniamo solo cio' che sta
  // vicino al migliore, come fa un occhio umano a scartare i risultati "di riempimento".
  const top = scored[0]?.semantic_score ?? 0;
  const kept = scored.filter((s) => s.semantic_score >= top - 0.05);
  return kept.slice(0, limit);
}

export async function embedAtom(db: DatabaseSync, atomId: string, text: string): Promise<boolean> {
  const v = await embed(text);
  if (!v) return false;
  const buf = Buffer.from(v.buffer, v.byteOffset, v.byteLength);
  const now = Math.floor(Date.now() / 1000);
  db.prepare(
    "INSERT INTO atom_embeddings (atom_id, embedding, model, dim, created_at, updated_at) VALUES (?,?,?,?,?,?) " +
    "ON CONFLICT(atom_id) DO UPDATE SET embedding = excluded.embedding, updated_at = excluded.updated_at"
  ).run(atomId, buf, MODEL, v.length, now, now);
  return true;
}
