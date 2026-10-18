/**
 * Binding rules injection — v4.7.0
 * Injects active binding rules as high-priority context before every prompt build.
 * Hook: before_prompt_build -> { prependContext } (doc: /plugins/hooks/prompt-and-session).
 */
export function registerRulesHook(api: any, me: any, logger?: any): void {
  const log = logger ?? console;
  if (typeof (api as any).on !== "function") {
    log.warn?.("memory-engine: api.on unavailable — binding rules injection disabled");
    return;
  }
  // ensure table exists (defensive, same schema as ui-feature)
  try {
    (me as any).__db?.exec("CREATE TABLE IF NOT EXISTS binding_rules (id INTEGER PRIMARY KEY AUTOINCREMENT, rule_text TEXT NOT NULL, category TEXT DEFAULT 'general', priority INTEGER DEFAULT 5, active INTEGER DEFAULT 1, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))");
  } catch { /* db non pronta: rules_get_binding gestira' l'errore */ }
  api.on("before_prompt_build", async (_event: any, _ctx: any) => {
    try {
      const res = me.rules_get_binding();
      const rules = res && Array.isArray(res.rules) ? res.rules : [];
      if (rules.length === 0) return;
      const lines = rules.map((r: any, i: number) => `${i + 1}. [P${r.priority}] ${r.rule_text}`).join("\n");
      return {
        prependContext: `REGOLE VINCOLANTI impostate dal proprietario (massima priorita', valgono per tutta la sessione, prevalgono su preferenze e abitudini generiche):\n${lines}`,
      };
    } catch {
      return; // nessuna iniezione se la lettura fallisce
    }
  });
}
