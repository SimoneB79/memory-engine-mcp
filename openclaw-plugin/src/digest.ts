/**
 * Memory Engine TS — F4/F5: session digest generator.
 * Aligned with session_watcher._upsert_sqlite_digest (2.0 format).
 */
import { DatabaseSync } from "node:sqlite";
import { createHash, randomBytes } from "node:crypto";

export interface DigestDraft { id: string; title: string; body: string }

export function buildSessionDigest(
  db: DatabaseSync,
  sessionId: string,
  meta: { ocSessionId?: string; generation?: string; segment?: number; sourceKey?: string } = {}
): DigestDraft | null {
  const rows = db
    .prepare("SELECT body FROM atoms WHERE type = 'session_msg' AND domain = ? AND status = 'active' ORDER BY created_at ASC")
    .all("session/" + sessionId) as any[];
  if (!rows.length) return null;

  const messages: Array<{ role: string; content: string; timestamp?: string }> = [];
  for (const r of rows) {
    try { const b = JSON.parse(r.body); messages.push({ role: b.role, content: String(b.content ?? ""), timestamp: b.timestamp }); }
    catch { continue; }
  }
  const userMessages = messages.filter((m) => m.role === "user");
  if (!userMessages.length) return null;

  let selected = userMessages;
  if (selected.length > 30) selected = [...selected.slice(0, 15), ...selected.slice(-15)];
  const userLines = selected.map((m) => "- " + (m.content.length > 200 ? m.content.slice(0, 200) + "..." : m.content));
  const firstTs = userMessages[0].timestamp ?? "";
  const lastTs = userMessages[userMessages.length - 1].timestamp ?? "";

  const body =
    "Session: " + sessionId + "\n" +
    "OpenClaw session: " + (meta.ocSessionId ?? sessionId) + "\n" +
    "Generation: " + (meta.generation ?? "active") + "; segment: " + (meta.segment ?? 0) + "\n" +
    "Period: " + firstTs + " \u2192 " + lastTs + "\n" +
    "Messages: " + messages.length + "\n\nUser messages:\n" +
    userLines.join("\n");

  const title = "Digest: " + userLines[0].slice(2, 62);
  const id = meta.sourceKey
    ? "digest_" + createHash("sha256").update(meta.sourceKey).digest("hex").slice(0, 24)
    : "digest_" + sessionId.slice(0, 8) + "_" + randomBytes(3).toString("hex");
  return { id, title, body };
}
