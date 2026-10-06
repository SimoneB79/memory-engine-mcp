import { describe, expect, it, beforeAll } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pluginEntry from "./entry.js";

describe("memory-engine-ts", () => {
  const registered: string[] = [];
  beforeAll(() => {
    process.env.MEMORY_DB_PATH = join(mkdtempSync(join(tmpdir(), "me-test-")), "memory.db");
    const api = {
      registerTool: (t: any) => registered.push(t?.name ?? "?"),
      on: () => {},
      logger: console,
      config: {},
    };
    (pluginEntry as any).register(api);
  });

  it("registra solo memory_* tools", () => {
    expect(registered.length).toBeGreaterThan(0);
    expect(registered.every((n) => n.startsWith("memory_"))).toBe(true);
  });

  it("espone memory_version", () => {
    expect(registered).toContain("memory_version");
  });
});
