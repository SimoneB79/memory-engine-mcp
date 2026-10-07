import { describe, expect, it, beforeAll } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createTools } from "./tools.js";
import { buildAdminDefs } from "./admin.js";

describe("parità 4.5.1: recall_session + find_similar", () => {
  let me: any, findSimilar: any;
  beforeAll(() => {
    const dir = mkdtempSync(join(tmpdir(), "me-p451-"));
    process.env.MEMORY_DB_PATH = join(dir, "memory.db");
    me = createTools(process.env.MEMORY_DB_PATH);
    const db = me.__db;
    const now = Math.floor(Date.now() / 1000);
    db.prepare("CREATE TABLE IF NOT EXISTS atoms (id TEXT PRIMARY KEY, title TEXT, domain TEXT, type TEXT, status TEXT, confidence REAL, access_count INTEGER, weight REAL, body TEXT, body_compact TEXT, tags TEXT, meta TEXT, created_at INTEGER, updated_at INTEGER, accessed_at INTEGER)").run();
    db.prepare("CREATE TABLE IF NOT EXISTS human_questions (id TEXT PRIMARY KEY, atom_ids TEXT, question_type TEXT, question TEXT, options TEXT, meta TEXT, status TEXT, answer TEXT, answered_at INTEGER, created_at INTEGER)").run();
    db.prepare("CREATE TABLE IF NOT EXISTS bonds (from_id TEXT, to_id TEXT, relation TEXT, strength REAL, evidence TEXT, created_at INTEGER)").run();
    db.prepare("CREATE VIRTUAL TABLE IF NOT EXISTS atoms_fts USING fts5(title, body, content='atoms', content_rowid='rowid')").run();
    db.prepare("CREATE TABLE IF NOT EXISTS atom_embeddings (atom_id TEXT PRIMARY KEY, embedding BLOB, model TEXT, dim INTEGER, created_at INTEGER, updated_at INTEGER)").run();
    const ins = db.prepare("INSERT INTO atoms (id, title, domain, type, status, confidence, access_count, weight, body, created_at, updated_at, accessed_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)");
    ins.run("s1-msg1", "Configurazione UPS NUT", "session/testsess", "session_msg", "active", 0.8, 1, 0.5, "abbiamo fermato il container nut-upsd e mascherato il NUT nativo", now, now, now);
    ins.run("s1-msg2", "Diagnosi NAS rumoroso", "session/testsess", "session_msg", "active", 0.8, 1, 0.5, "il rumore era causato dal restart loop del container", now, now, now);
    ins.run("other1", "Ricetta carbonara", "cucina", "fact", "active", 0.9, 2, 0.7, "guanciale, uova, pecorino, pepe nero", now, now, now);
    db.prepare("INSERT INTO atoms_fts(atoms_fts) VALUES('rebuild')").run();
    findSimilar = buildAdminDefs(db).find((d: any) => d.name === "memory_find_similar");
  });

  it("recall_session trova solo atomi del dominio session/testsess", async () => {
    const res = await me.recall_session("testsess", "container NUT");
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBeGreaterThan(0);
    expect(res.every((r: any) => r.domain === "session/testsess")).toBe(true);
  });

  it("find_similar senza ollama: fallback FTS e mai crash", async () => {
    const res = await findSimilar.execute({ atom_id: "s1-msg1", limit: 3 });
    expect(res.reference).toBe("s1-msg1");
    expect(typeof res.mode).toBe("string");
    expect(Array.isArray(res.similar)).toBe(true);
  });

  it("find_similar su atomo inesistente: errore pulito", async () => {
    const res = await findSimilar.execute({ atom_id: "non-esiste" });
    expect(res.error).toBe("atom not found");
  });
});
