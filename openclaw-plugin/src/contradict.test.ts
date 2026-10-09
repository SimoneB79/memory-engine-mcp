import { describe, expect, it } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createTools } from "./tools.js";

describe("memory_contradict regression: INSERT atoms 16 colonne (bug 14 values, 4.5.1)", () => {
  it("contraddice un atomo senza errori di schema e con valori nelle colonne giuste", () => {
    const me: any = createTools(join(mkdtempSync(join(tmpdir(), "me-ctr-")), "memory.db"));
    const db = me.__db;
    // schema minimo, come learning.test.ts (in produzione il DB esiste già)
    db.prepare("CREATE TABLE IF NOT EXISTS atoms (id TEXT PRIMARY KEY, type TEXT, memory_tier TEXT, domain TEXT, title TEXT, body TEXT, confidence REAL, status TEXT, source TEXT, weight REAL, tags TEXT, meta TEXT, created_at INTEGER, updated_at INTEGER, accessed_at INTEGER, valid_from INTEGER, valid_until INTEGER, body_compact TEXT, access_count INTEGER)").run();
    db.prepare("CREATE TABLE IF NOT EXISTS memory_contradictions (id TEXT PRIMARY KEY, old_atom_id TEXT, new_atom_id TEXT, reason TEXT, resolution TEXT, created_at INTEGER, created_by TEXT, meta TEXT)").run();
    db.prepare("CREATE TABLE IF NOT EXISTS bonds (from_id TEXT, to_id TEXT, relation TEXT, strength REAL, evidence TEXT, created_at INTEGER)").run();
    const rem = me.remember("fatto obsoleto di test", "body vecchio", "fact", "test/contradict");
    const res = me.memory_contradict(rem.id, "fatto corretto di test", "body nuovo", "correzione");
    expect(res.contradiction_id).toContain("contradiction_");
    const list = me.list_contradictions(undefined, 5);
    expect(list.length).toBeGreaterThan(0);
    const neo: any = db.prepare("SELECT * FROM atoms WHERE id = ?").get(res.new_atom_id);
    expect(neo.status).toBe("active");
    expect(neo.source).toBe("ai");       // prima finiva in confidence
    expect(neo.confidence).toBe(0.8);    // prima finiva in status
    const old: any = db.prepare("SELECT * FROM atoms WHERE id = ?").get(rem.id);
    expect(old.status).toBe("superseded");
  });
});
