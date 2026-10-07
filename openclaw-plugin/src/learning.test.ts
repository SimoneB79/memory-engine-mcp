import { describe, expect, it, beforeAll } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createTools } from "./tools.js";
import { Learning } from "./learning.js";

describe("learning parity (v4.5.0)", () => {
  let me: any, learning: Learning;
  beforeAll(() => {
    const dir = mkdtempSync(join(tmpdir(), "me-learn-"));
    process.env.MEMORY_DB_PATH = join(dir, "memory.db");
    me = createTools(process.env.MEMORY_DB_PATH);
    const db = me.__db;
    // schema minimo (in produzione il DB esiste già, migrato dal Python)
    const now0 = Math.floor(Date.now() / 1000);
    db.prepare("CREATE TABLE IF NOT EXISTS atoms (id TEXT PRIMARY KEY, title TEXT, domain TEXT, type TEXT, status TEXT, confidence REAL, access_count INTEGER, weight REAL, body TEXT, tags TEXT, meta TEXT, created_at INTEGER, updated_at INTEGER, accessed_at INTEGER)").run();
    db.prepare("CREATE TABLE IF NOT EXISTS human_questions (id TEXT PRIMARY KEY, atom_ids TEXT, question_type TEXT, question TEXT, options TEXT, meta TEXT, status TEXT, answer TEXT, answered_at INTEGER, created_at INTEGER)").run();
    db.prepare("CREATE TABLE IF NOT EXISTS bonds (from_id TEXT, to_id TEXT, relation TEXT, strength REAL, evidence TEXT, created_at INTEGER)").run();
    learning = new Learning(db);
    const now = Math.floor(Date.now() / 1000);
    // gap: body quasi vuoto
    db.prepare("INSERT INTO atoms (id, title, domain, type, status, confidence, access_count, weight, body, created_at, updated_at, accessed_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
      .run("a-gap", "Config incompleta", "test:learn", "fact", "active", 0.9, 3, 0.8, "poche parole", now, now, now);
    // weak: confidence bassa + molto access
    db.prepare("INSERT INTO atoms (id, title, domain, type, status, confidence, access_count, weight, body, created_at, updated_at, accessed_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
      .run("a-weak", "Porta garage", "test:learn", "fact", "active", 0.2, 9, 0.5, "descrizione sufficientemente lunga del fatto sulla porta del garage", now, now, now);
    // decay: weight sotto soglia
    db.prepare("INSERT INTO atoms (id, title, domain, type, status, confidence, access_count, weight, body, created_at, updated_at, accessed_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
      .run("a-decay", "Vecchio server", "test:learn", "fact", "active", 0.8, 1, 0.05, "descrizione sufficientemente lunga del vecchio server di test", now, now, now);
  });

  it("crea domande gap/weak/decay_critical con i tipi Python", () => {
    const created = learning.runAllChecks();
    const types = created.map((c: any) => c.question_type);
    expect(types).toContain("gap");
    expect(types).toContain("weak");
    expect(types).toContain("decay_critical");
  });

  it("dedup: un secondo run non ricrea le stesse domande", () => {
    const second = learning.runAllChecks();
    const overlap = second.filter((c: any) => ["gap", "weak", "decay_critical"].includes(c.question_type));
    expect(overlap.length).toBe(0);
  });

  it("risposta gap appende [Human note] al body", () => {
    const db = me.__db;
    const qrow: any = db.prepare("SELECT * FROM human_questions WHERE question_type='gap' AND status='pending' LIMIT 1").get();
    expect(qrow).toBeTruthy();
    const effects = learning.applyAnswerSideEffects(qrow, "Il codice e' 1234");
    expect(effects.length).toBeGreaterThan(0);
    const body: any = db.prepare("SELECT body FROM atoms WHERE id='a-gap'").get();
    expect(String(body.body)).toContain("[Human note]: Il codice e' 1234");
  });
});
