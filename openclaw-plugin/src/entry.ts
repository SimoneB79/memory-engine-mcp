/**
 * Memory Engine TS — plugin entry with native hooks.
 * Tools (17) + periodic session ingest & digest (flush ogni 60s solo se ci sono nuovi messaggi).
 */
import { Type } from "typebox";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createTools, VERSION } from "./tools.js";
import { Curator } from "./curator.js";
import { buildAdminDefs } from "./admin.js";
import { buildSemanticDefs } from "./semantic.js";
import { buildMaintenanceDefs } from "./maintenance.js";
import { buildSessionDigest } from "./digest.js";
import type { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";

/** Il gateway puo' passare un tool-call id (stringa) come primo argomento:
 *  i params stanno in uno degli argomenti successivi, o in un envelope. */
const PARAM_KEYS = ["query","title","content","id","session_id","atom_id","from_id","to_id","relation","task_description","task_type","mistake","correction","old_atom_id","limit","domain","type","confidence","depth","strength","token_budget","body","reason"];
function normalizeParams(a: any, rest: any[] = []): any {
  const merged: any = {};
  const cands = [a, ...rest].filter((x: any) => x && typeof x === "object" && !Array.isArray(x));
  for (const c of cands) {
    for (const k of ["arguments", "input", "params", "args"]) {
      if (c[k] && typeof c[k] === "object" && !Array.isArray(c[k])) Object.assign(merged, c[k]);
    }
  }
  for (const c of cands) {
    for (const k of Object.keys(c)) {
      if (!(k in merged)) merged[k] = c[k];
    }
  }
  return merged;
}

const T = Type;

interface BufferedMsg { sessionId: string; role: string; content: string; ts: string }

/** Wrap nel tool-result shape richiesto dal contract "tools" di OpenClaw. */
function wrapResult(result: unknown) {
  const text = typeof result === "string" ? result : JSON.stringify(result ?? null);
  return { content: [{ type: "text" as const, text }] };
}

export default definePluginEntry({
  id: "memory-engine",
  name: "Memory Engine",
  description: "Memory Engine ported as native OpenClaw tools + periodic session ingest & digest.",
  register(api) {
    const dbPath = process.env.MEMORY_DB_PATH ?? "/data/memory.db";
    const me = createTools(dbPath);
    const curator = new Curator((me as any).__db, (me as any).__engine, ((api as any).config ?? {}).curator ?? {});
    const ingestCfg: any = (((api as any).config ?? {}).ingest ?? {});
    const ingestEnabled: boolean = ingestCfg.enabled !== false;
    const retentionDays: number = Number(ingestCfg.retention_days ?? 7);
    const logger = (api as any).logger ?? console;

    // ── Tools ─────────────────────────────────────────────
    const defs: Array<{ name: string; description: string; parameters: any; execute: (a: any) => any }> = [
      { name: "memory_version", description: "Memory Engine TS version.", parameters: T.Object({}), execute: () => me.version() },
      { name: "memory_recall", description: "Smart recall of past memories. Query short and specific. semantic=true merges embedding search.", parameters: T.Object({ query: T.String(), limit: T.Optional(T.Number()), domain: T.Optional(T.String()), semantic: T.Optional(T.Boolean()) }), execute: (a) => me.recall(a.query, a.limit ?? 5, a.domain, a.semantic ?? false) },
      { name: "memory_remember", description: "Save a durable memory (fact, decision, procedure, preference).", parameters: T.Object({ title: T.String(), content: T.String(), type: T.Optional(T.String()), domain: T.Optional(T.String()), confidence: T.Optional(T.Number()) }), execute: (a) => me.remember(a.title, a.content, a.type ?? "fact", a.domain ?? "general", a.confidence ?? 0.8) },
      { name: "memory_working_set", description: "Task context pack with token budget.", parameters: T.Object({ query: T.String(), domain: T.Optional(T.String()), limit: T.Optional(T.Number()), token_budget: T.Optional(T.Number()) }), execute: (a) => me.working_set(a.query, a.domain, a.limit ?? 8, a.token_budget ?? 2000) },
      { name: "memory_get_atom", description: "Full atom by id.", parameters: T.Object({ id: T.String() }), execute: (a) => me.get_atom(a.id) },
      { name: "memory_list_atoms", description: "List atoms by domain/type.", parameters: T.Object({ domain: T.Optional(T.String()), type: T.Optional(T.String()), limit: T.Optional(T.Number()) }), execute: (a) => me.list_atoms(a.domain, a.type, a.limit ?? 50) },
      { name: "memory_link", description: "Bond two atoms.", parameters: T.Object({ from_id: T.String(), to_id: T.String(), relation: T.String(), strength: T.Optional(T.Number()) }), execute: (a) => me.link(a.from_id, a.to_id, a.relation, a.strength) },
      { name: "memory_search_graph", description: "BFS graph traversal.", parameters: T.Object({ atom_id: T.String(), depth: T.Optional(T.Number()) }), execute: (a) => me.search_graph(a.atom_id, a.depth ?? 2) },
      { name: "memory_contradict", description: "New atom supersedes old one.", parameters: T.Object({ old_atom_id: T.String(), title: T.String(), body: T.Optional(T.String()), reason: T.Optional(T.String()) }), execute: (a) => me.memory_contradict(a.old_atom_id, a.title, a.body ?? "", a.reason ?? "") },
      { name: "memory_impact", description: "What depends on an atom.", parameters: T.Object({ atom_id: T.String(), depth: T.Optional(T.Number()) }), execute: (a) => me.memory_impact(a.atom_id, a.depth ?? 2) },
      { name: "memory_preference_search", description: "Search stable preferences.", parameters: T.Object({ query: T.Optional(T.String()), limit: T.Optional(T.Number()) }), execute: (a) => me.preference_search(a.query, undefined, a.limit ?? 20) },
      { name: "memory_error_check", description: "Known errors for a task.", parameters: T.Object({ task_description: T.String() }), execute: (a) => me.error_check(a.task_description) },
      { name: "memory_error_log", description: "Log mistake + correction.", parameters: T.Object({ task_type: T.String(), mistake: T.String(), correction: T.String() }), execute: (a) => me.error_log(a.task_type, a.mistake, a.correction) },
      { name: "memory_stats", description: "Memory statistics.", parameters: T.Object({}), execute: () => me.stats() },
      { name: "memory_session_summary", description: "Digest of a session.", parameters: T.Object({ session_id: T.String() }), execute: (a) => me.session_summary(a.session_id) },
      { name: "memory_generate_session_digest", description: "Generate digest atom for a session.", parameters: T.Object({ session_id: T.String() }), execute: (a) => me.generate_session_digest(a.session_id) },
      { name: "memory_admin", description: "Admin jobs pointer.", parameters: T.Object({}), execute: () => me._admin_note() },
      { name: "memory_curator_run", description: "Conservative curation pass: compact, bonds, isolated classification, promotions, merges. dry_run default true.", parameters: T.Object({ dry_run: T.Optional(T.Boolean()), auto_apply: T.Optional(T.Boolean()), max_atoms: T.Optional(T.Number()) }), execute: (a) => curator.run(a.dry_run ?? true, a.auto_apply ?? false, a.max_atoms) },
      { name: "memory_cognitive_status", description: "Cognitive health metrics for the memory graph.", parameters: T.Object({}), execute: () => curator.status() },
    ];
    for (const d of buildAdminDefs(me.__db)) defs.push(d);
    for (const d of buildSemanticDefs(me.__db, curator)) defs.push(d);
    for (const d of buildMaintenanceDefs(me.__db, dbPath)) defs.push(d);
    for (const d of defs) {
      (api.registerTool as any)(
        {
          name: d.name,
          description: d.description,
          parameters: d.parameters,
          execute: async (a: any, ...rest: any[]) => {
            return wrapResult(await d.execute(normalizeParams(a, rest)));
          },
        },
        { contract: "tools" }
      );
    }

    // ── Periodic ingest + digest (flush solo se cambiato) ──
    const buffer = new Map<string, BufferedMsg[]>();
    const flushedCount = new Map<string, number>(); // sid -> numero msg già scritti

    (api.on as any)("message_received", (event: any) => {
      try {
        if (!ingestEnabled) return;
        const sid = String(event?.sessionId ?? event?.sessionKey ?? "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48) || "unknown";
        const content = String(event?.body ?? event?.text ?? event?.content ?? "").slice(0, 2000);
        if (!content) return;
        const arr = buffer.get(sid) ?? [];
        arr.push({ sessionId: sid, role: "user", content, ts: new Date().toISOString() });
        buffer.set(sid, arr);
      } catch { /* never break inbound */ }
    });

    (api.on as any)("agent_end", (event: any) => {
      try {
        if (!ingestEnabled) return;
        const sid = String(event?.sessionId ?? event?.sessionKey ?? "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48) || "unknown";
        const text = String(event?.reply ?? event?.finalMessage ?? event?.text ?? "").slice(0, 1000);
        if (!text) return;
        const arr = buffer.get(sid) ?? [];
        arr.push({ sessionId: sid, role: "assistant", content: text, ts: new Date().toISOString() });
        buffer.set(sid, arr);
      } catch { /* observe only */ }
    });

    function flushSession(sid: string, sidRaw: string) {
        let retention = retentionDays;
        try {
            (me as any).__db.prepare("CREATE TABLE IF NOT EXISTS plugin_settings (key TEXT PRIMARY KEY, value TEXT)").run();
            const row = (me as any).__db.prepare("SELECT value FROM plugin_settings WHERE key='retention_days'").get();
            if (row && Number(row.value) > 0) retention = Number(row.value);
        } catch { /* fallback config */ }
      const db: DatabaseSync = (me as any).__db;
      const now = Math.floor(Date.now() / 1000);
      const msgs = buffer.get(sid) ?? [];
      const already = flushedCount.get(sid) ?? 0;
      if (msgs.length <= already) return; // nessun nuovo messaggio: skip
      const fresh = msgs.slice(already);
      // ingest session_msg atoms (dedup via content hash)
      for (const m of fresh) {
        const hash = createHash("md5").update(sid + "|" + m.role + "|" + m.content).digest("hex").slice(0, 12);
        const atomId = "smsg_" + hash;
        db.prepare(
          "INSERT OR IGNORE INTO atoms (id, type, memory_tier, domain, title, body, confidence, status, source, weight, tags, meta, created_at, updated_at, accessed_at, ttl) VALUES (?,?,?,?,?,?,?,'active','ai',1.0,'[]','{}',?,?,?,?)"
        ).run(atomId, "session_msg", "episodic", "session/" + sid, "[" + m.role + "] " + m.content.slice(0, 60), JSON.stringify({ role: m.role, content: m.content, timestamp: m.ts }), 0.7, now, now, now, now + retention * 86400);
      }
      // digest from ingested atoms (uses session_msg domain rows)
      const draft = buildSessionDigest(db, sid, { ocSessionId: sidRaw });
      if (draft) {
        db.prepare(
          "INSERT OR REPLACE INTO atoms (id, type, memory_tier, domain, title, body, confidence, status, source, weight, tags, meta, created_at, updated_at, accessed_at, ttl) VALUES (?,?,?,?,?,?,0.7,'active','ai',1.0,'[]','{}',?,?,?,?)"
        ).run(draft.id, "session_digest", "episodic", "session/" + sid, draft.title, draft.body, now, now, now, now + retention * 86400);
      }
      flushedCount.set(sid, msgs.length);
      logger.info?.("[memory-engine] periodic flush session " + sid + " (" + fresh.length + " new msgs, digest " + (draft ? "ok" : "skip") + ")");
    }

    const FLUSH_MS = 60_000;
    const timer = setInterval(() => {
      try {
        // automatic cleanup: expire session atoms whose TTL has passed
        try { (me as any).__db.prepare("UPDATE atoms SET status='expired', updated_at=unixepoch() WHERE type IN ('session_msg','session_digest') AND status='active' AND ttl IS NOT NULL AND ttl <= unixepoch()").run(); } catch {}
        for (const [sid, arr] of buffer) {
          if (arr.length > (flushedCount.get(sid) ?? 0)) flushSession(sid, sid);
        }
      } catch (err) {
        logger.warn?.("[memory-engine] periodic flush error: " + String(err));
      }
    }, FLUSH_MS);
    (timer as any).unref?.();

    logger.info?.("[memory-engine] v" + VERSION + " registered: " + defs.length + " tools + ingest " + (ingestEnabled ? "on (retention " + retentionDays + "d)" : "OFF") + " (" + (FLUSH_MS / 1000) + "s)");
  },
});
