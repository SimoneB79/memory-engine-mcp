import { defineControlUiPlugin } from "openclaw/plugin-sdk/control-ui";
import { createFeatureClient } from "openclaw/plugin-sdk/feature-contract";
import { contract } from "./ui-contract.js";

export default defineControlUiPlugin({
  id: contract.pluginId,
  activate(host) {
    host.ui.registerNavigation({ id: "memory-engine", label: "Memory Engine", page: { id: "memory-engine" }, icon: "brain" });
    host.ui.registerPage({
      id: "memory-engine",
      label: "Memory Engine",
      mount(container, context) {
        const feature: any = createFeatureClient(contract, context.host);
        const root = document.createElement("div");
        root.style.cssText = "padding:16px;font-family:system-ui,sans-serif;max-width:1100px;";
        const h1 = document.createElement("h1");
        h1.textContent = "Memory Engine";
        h1.style.margin = "0 0 12px 0";

        // ── tab bar ──
        const tabs = document.createElement("div");
        tabs.style.cssText = "display:flex;gap:4px;border-bottom:1px solid rgba(127,127,127,0.3);margin-bottom:16px;";
        const pages: Record<string, HTMLElement> = {};
        const mkTab = (id: string, label: string) => {
          const b = document.createElement("button");
          b.textContent = label;
          b.dataset.tab = id;
          b.style.cssText = "padding:8px 16px;border:none;background:transparent;color:inherit;cursor:pointer;font-size:14px;border-bottom:2px solid transparent;";
          b.onclick = () => {
            for (const k of Object.keys(pages)) { pages[k].style.display = k === id ? "block" : "none"; }
            for (const tb of tabs.querySelectorAll("button")) (tb as HTMLElement).style.borderBottomColor = tb === b ? "accent" : "transparent";
          };
          tabs.append(b);
          const pg = document.createElement("div");
          pg.dataset.page = id;
          pg.style.display = "none";
          pages[id] = pg;
          root.append(pg);
        };
        mkTab("overview", "Panoramica");
        mkTab("atoms", "Atomi");
        mkTab("curator", "Curator");
        mkTab("backup", "Backup");
        mkTab("questions", "Domande");
        mkTab("database", "Database");

        const status = (m: string) => { const el = document.createElement("div"); el.textContent = m; el.style.opacity = "0.6"; return el; };

        // ── PANORAMICA ──
        const ov = pages["overview"];
        const statsGrid = document.createElement("div");
        statsGrid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-bottom:16px;";
        const card = (label: string) => {
          const d = document.createElement("div");
          d.style.cssText = "background:rgba(127,127,127,0.1);border-radius:8px;padding:10px 14px;";
          const l = document.createElement("div"); l.textContent = label;
          l.style.cssText = "font-size:11px;opacity:0.7;text-transform:uppercase;letter-spacing:0.5px;";
          const v = document.createElement("div"); v.textContent = "…";
          v.style.cssText = "font-size:24px;font-weight:600;"; v.dataset.stat = label;
          d.append(l, v); return d;
        };
        statsGrid.append(card("Atomi attivi"), card("Durevoli"), card("Bond"), card("Isolati"), card("Pending"), card("Da compattare"));
        const recs = document.createElement("div");
        recs.style.cssText = "padding:12px;border-radius:8px;background:rgba(127,127,127,0.08);font-size:13px;";
        const setStat = (label: string, value: any) => { const el = statsGrid.querySelector('[data-stat="' + label + '"]'); if (el) el.textContent = String(value); };
        ov.append(statsGrid, recs);

        // ── ATOMI ──
        const at = pages["atoms"];
        const bar = document.createElement("div");
        bar.style.cssText = "display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;";
        const input = document.createElement("input");
        input.placeholder = "Cerca nella memoria…";
        input.setAttribute("aria-label", "Cerca atomi");
        input.style.cssText = "flex:1;min-width:200px;padding:8px 12px;border-radius:6px;border:1px solid rgba(127,127,127,0.4);background:transparent;color:inherit;";
        const selType = document.createElement("select");
        selType.style.cssText = "padding:8px;border-radius:6px;border:1px solid rgba(127,127,127,0.4);background:transparent;color:inherit;";
        for (const t of ["", "fact", "decision", "procedure", "preference", "project", "note", "log"]) {
          const o = document.createElement("option"); o.value = t; o.textContent = t || "tutti i tipi"; selType.append(o);
        }
        const selDom = document.createElement("select");
        selDom.style.cssText = selType.style.cssText;
        const btn = document.createElement("button");
        btn.textContent = "Cerca";
        btn.style.cssText = "padding:8px 16px;border-radius:6px;border:1px solid rgba(127,127,127,0.4);background:rgba(127,127,127,0.15);color:inherit;cursor:pointer;";
        bar.append(input, selType, selDom, btn);
        const list = document.createElement("div");
        list.style.cssText = "display:flex;flex-direction:column;gap:6px;";
        const detail = document.createElement("div");
        detail.style.cssText = "margin-top:12px;padding:12px;border-radius:8px;background:rgba(127,127,127,0.08);font-size:12px;overflow:auto;white-space:pre-wrap;display:none;max-height:300px;";
        at.append(bar, list, detail);
        const doSearch = async () => {
          const query = input.value.trim();
          if (!query) return;
          list.textContent = "…";
          try {
            const args: any = { query };
            if (selType.value) args.type = selType.value;
            if (selDom.value) args.domain = selDom.value;
            const r: any = await feature.invoke("search", args);
            list.textContent = "";
            if (!r.results?.length) { list.append(status("Nessun risultato.")); return; }
            for (const a of r.results) {
              const row = document.createElement("div");
              row.style.cssText = "display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-radius:6px;border:1px solid rgba(127,127,127,0.25);cursor:pointer;";
              const t = document.createElement("div");
              t.textContent = a.title;
              t.style.fontWeight = "500";
              const m = document.createElement("div");
              m.textContent = (a.type || "") + " · " + (a.domain || "");
              m.style.cssText = "font-size:11px;opacity:0.6;white-space:nowrap;margin-left:12px;";
              row.append(t, m);
              row.onclick = async () => {
                try {
                  const d: any = await feature.invoke("atom", { id: a.id });
                  detail.textContent = JSON.stringify(d, null, 2);
                  detail.style.display = "block";
                } catch (e) { detail.textContent = String(e); detail.style.display = "block"; }
              };
              list.append(row);
            }
          } catch (e) { list.textContent = "errore: " + String(e); }
        };
        btn.onclick = doSearch;
        input.onkeydown = (ev) => { if ((ev as KeyboardEvent).key === "Enter") doSearch(); };

        // ── CURATOR ──
        const cu = pages["curator"];
        const cuBar = document.createElement("div");
        cuBar.style.cssText = "display:flex;gap:8px;margin-bottom:12px;";
        const dryBtn = document.createElement("button"); dryBtn.textContent = "Dry-run"; dryBtn.style.cssText = btn.style.cssText;
        const applyBtn = document.createElement("button"); applyBtn.textContent = "Applica"; applyBtn.style.cssText = btn.style.cssText + "font-weight:600;";
        cuBar.append(dryBtn, applyBtn);
        const cuOut = document.createElement("pre");
        cuOut.style.cssText = "padding:12px;border-radius:8px;background:rgba(127,127,127,0.08);font-size:12px;white-space:pre-wrap;";
        cu.append(cuBar, cuOut);
        const runCurator = async (apply: boolean) => {
          (apply ? applyBtn : dryBtn).disabled = true;
          cuOut.textContent = "…";
          try {
            const r: any = await feature.invoke(apply ? "curator_apply" : "curator_dry", {});
            cuOut.textContent = (apply ? "APPLICATO" : "DRY-RUN") + " — compact: " + r.compact + " · bond suggeriti: " + r.bonds_suggested + (apply ? " · bond applicati: " + r.bonds_applied : "") + " · isolati classificati: " + r.isolated_classified + " · promotion: " + r.promotions + " · merge: " + r.merges;
            await refreshOverview();
          } catch (e) { cuOut.textContent = String(e); }
          finally { (apply ? applyBtn : dryBtn).disabled = false; }
        };
        dryBtn.onclick = () => runCurator(false);
        applyBtn.onclick = () => runCurator(true);

        // ── BACKUP ──
        const bk = pages["backup"];
        const bkBar = document.createElement("div");
        const bkBtn = document.createElement("button"); bkBtn.textContent = "Crea backup ora"; bkBtn.style.cssText = btn.style.cssText;
        const bkOut = document.createElement("span"); bkOut.style.cssText = "font-size:12px;opacity:0.8;margin-left:8px;";
        bkBar.append(bkBtn, bkOut);
        const bkList = document.createElement("div");
        bkList.style.cssText = "display:flex;flex-direction:column;gap:6px;margin-top:12px;";
        bk.append(bkBar, bkList);
        const loadBackups = async () => {
          bkList.textContent = "…";
          try {
            const r: any = await feature.invoke("backups_list", {});
            bkList.textContent = "";
            if (!r.backups?.length) { bkList.append(status("Nessun backup.")); return; }
            for (const b of r.backups) {
              const row = document.createElement("div");
              row.style.cssText = "display:flex;justify-content:space-between;padding:8px 12px;border-radius:6px;border:1px solid rgba(127,127,127,0.25);font-size:13px;";
              const n = document.createElement("span"); n.textContent = b.file;
              const m = document.createElement("span"); m.textContent = (b.size_bytes / 1048576).toFixed(1) + " MB · " + b.created.slice(0, 16).replace("T", " ");
              m.style.opacity = "0.6";
              row.append(n, m);
              bkList.append(row);
            }
          } catch (e) { bkList.textContent = String(e); }
        };
        bkBtn.onclick = async () => {
          bkBtn.disabled = true; bkOut.textContent = "…";
          try {
            const r: any = await feature.invoke("backup_now", {});
            bkOut.textContent = r.ok ? "OK: " + (r.size_bytes / 1048576).toFixed(1) + " MB" : "KO: " + r.reason;
            await loadBackups();
          } catch (e) { bkOut.textContent = String(e); }
          finally { bkBtn.disabled = false; }
        };

        // ── DOMANDE ──
        const qs = pages["questions"];
        const qsList = document.createElement("div");
        qsList.style.cssText = "display:flex;flex-direction:column;gap:8px;";
        qs.append(qsList);
        const loadQuestions = async () => {
          qsList.textContent = "…";
          try {
            const r: any = await feature.invoke("questions_list", {});
            qsList.textContent = "";
            if (!r.questions?.length) { qsList.append(status("Nessuna domanda in attesa.")); return; }
            for (const q of r.questions) {
              const box = document.createElement("div");
              box.style.cssText = "padding:12px;border-radius:8px;border:1px solid rgba(127,127,127,0.25);";
              const qt = document.createElement("div");
              qt.textContent = q.question;
              qt.style.cssText = "font-size:14px;margin-bottom:8px;";
              const row = document.createElement("div");
              row.style.cssText = "display:flex;gap:8px;";
              const inp = document.createElement("input");
              inp.placeholder = "La tua risposta…";
              inp.style.cssText = "flex:1;padding:6px 10px;border-radius:6px;border:1px solid rgba(127,127,127,0.4);background:transparent;color:inherit;";
              const send = document.createElement("button");
              send.textContent = "Rispondi"; send.style.cssText = btn.style.cssText;
              send.onclick = async () => {
                if (!inp.value.trim()) return;
                send.disabled = true;
                try {
                  await feature.invoke("question_answer", { question_id: q.id, answer: inp.value.trim() });
                  await loadQuestions();
                } catch (e) { qt.textContent += " [errore: " + String(e) + "]"; send.disabled = false; }
              };
              row.append(inp, send);
              box.append(qt, row);
              qsList.append(box);
            }
          } catch (e) { qsList.textContent = String(e); }
        };

        // __ DATABASE TAB __
        const dbp = pages["database"];
        const dbGrid = document.createElement("div");
        dbGrid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px;margin-bottom:16px;";
        const dbCard = (label: string) => {
          const d = document.createElement("div");
          d.style.cssText = "background:rgba(127,127,127,0.1);border-radius:8px;padding:10px 14px;";
          const l = document.createElement("div"); l.textContent = label; l.style.cssText = "font-size:11px;opacity:0.7;text-transform:uppercase;";
          const v = document.createElement("div"); v.textContent = "…"; v.style.cssText = "font-size:20px;font-weight:600;"; v.dataset.dbstat = label;
          d.append(l, v); return d;
        };
        dbGrid.append(dbCard("Attivi"), dbCard("Scaduti"), dbCard("Eliminati"), dbCard("Merged"), dbCard("DB MB"), dbCard("Retention"));
        const dbRow = document.createElement("div");
        dbRow.style.cssText = "display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center;";
        const ttlInput = document.createElement("input");
        ttlInput.type = "number"; ttlInput.min = "1"; ttlInput.max = "365";
        ttlInput.setAttribute("aria-label", "Retention giorni");
        ttlInput.style.cssText = "width:80px;padding:8px;border-radius:6px;border:1px solid rgba(127,127,127,0.4);background:transparent;color:inherit;";
        const ttlLabel = document.createElement("span"); ttlLabel.textContent = "giorni TTL"; ttlLabel.style.cssText = "font-size:13px;opacity:0.7;";
        const ttlBtn = document.createElement("button"); ttlBtn.textContent = "Salva TTL"; ttlBtn.style.cssText = "padding:8px 14px;border-radius:6px;border:1px solid rgba(127,127,127,0.4);background:rgba(127,127,127,0.15);color:inherit;cursor:pointer;";
        const cleanBtn = document.createElement("button"); cleanBtn.textContent = "Pulisci sessioni scadute"; cleanBtn.style.cssText = ttlBtn.style.cssText;
        const purgeBtn = document.createElement("button"); purgeBtn.textContent = "Purga definitiva"; purgeBtn.style.cssText = ttlBtn.style.cssText + "border-color:rgba(200,80,80,0.6);";
        const dbOut = document.createElement("span"); dbOut.style.cssText = "font-size:12px;opacity:0.8;";
        dbRow.append(ttlInput, ttlLabel, ttlBtn, cleanBtn, purgeBtn, dbOut);
        const dbPath = document.createElement("div");
        dbPath.style.cssText = "font-size:11px;opacity:0.5;";
        dbp.append(dbGrid, dbRow, dbPath);
        const setDbStat = (label: string, value: any) => { const el = dbGrid.querySelector('[data-dbstat="' + label + '"]'); if (el) el.textContent = String(value); };
        const loadDbStats = async () => {
          try {
            const st: any = await feature.invoke("db_stats", {});
            setDbStat("Attivi", st.by_status?.active ?? 0);
            setDbStat("Scaduti", st.by_status?.expired ?? 0);
            setDbStat("Eliminati", st.by_status?.deleted ?? 0);
            setDbStat("Merged", st.by_status?.merged ?? 0);
            setDbStat("DB MB", ((st.db_size_bytes ?? 0) / 1048576).toFixed(1));
            setDbStat("Retention", st.retention_days + "g");
            ttlInput.value = String(st.retention_days);
            dbPath.textContent = "DB: " + st.db_path;
          } catch (e) { dbOut.textContent = String(e); }
        };
        ttlBtn.onclick = async () => {
          const days = Number(ttlInput.value);
          if (!days || days < 1) { dbOut.textContent = "TTL non valido"; return; }
          try {
            const r: any = await feature.invoke("set_retention", { retention_days: days });
            dbOut.textContent = r.ok ? "TTL salvato: " + days + " giorni" : "KO";
            await loadDbStats();
          } catch (e) { dbOut.textContent = String(e); }
        };
        cleanBtn.onclick = async () => {
          cleanBtn.disabled = true; dbOut.textContent = "Pulizia…";
          try {
            const r: any = await feature.invoke("db_cleanup", { dry_run: false });
            dbOut.textContent = "Scaduti " + r.purged + " atomi sessione (" + r.max_age_days + "g)";
            await loadDbStats(); await refreshOverview();
          } catch (e) { dbOut.textContent = String(e); }
          finally { cleanBtn.disabled = false; }
        };
        purgeBtn.onclick = async () => {
          if (!confirm("Eliminare DEFINITIVAMENTE gli atomi con stato deleted/expired/merged? Azione irreversibile.")) return;
          purgeBtn.disabled = true; dbOut.textContent = "Purga…";
          try {
            const r: any = await feature.invoke("db_purge", { confirm: true });
            dbOut.textContent = r.ok ? "Eliminati definitivamente " + r.purged + " atomi" : "KO: " + r.reason;
            await loadDbStats(); await refreshOverview();
          } catch (e) { dbOut.textContent = String(e); }
          finally { purgeBtn.disabled = false; }
        };

        const refreshOverview = async () => {
          try {
            const st: any = await feature.invoke("status", {});
            if (context.signal.aborted) return;
            setStat("Atomi attivi", st.atoms_active);
            setStat("Durevoli", st.durable_atoms);
            setStat("Bond", st.bonds);
            setStat("Isolati", st.isolated);
            setStat("Pending", st.pending);
            setStat("Da compattare", st.missing_compact);
            recs.textContent = "💡 " + (st.recommendations || []).join(" · ");
          } catch (e) { recs.textContent = String(e); }
        };

        // prima tab attiva
        (tabs.querySelector("button") as HTMLElement)?.click();
        root.prepend(h1, tabs);
        container.append(root);
        refreshOverview();
        loadBackups();
        loadQuestions();
        loadDbStats();
        // domini nel filtro
        feature.invoke("domains", {}).then((r: any) => {
          for (const d of r.domains || []) {
            const o = document.createElement("option");
            o.value = d.domain; o.textContent = d.domain + " (" + d.count + ")";
            selDom.append(o);
          }
        }).catch(() => {});
        return { dispose: () => root.remove() };
      },
    });
  },
});
