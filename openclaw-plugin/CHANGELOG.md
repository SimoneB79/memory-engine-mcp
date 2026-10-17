# Changelog

## 4.6.0 (2026-10-17)

### New: Binding Rules — regole vincolanti

Gestione regole fondamentali che vengono caricate all'avvio di ogni sessione e inserite nel contesto come direttive ad alta priorità.

**Nuovi tool (4):**
- `memory_rules_get_binding` — restituisce le regole attive ordinate per priorità
- `memory_rules_add` — aggiunge una nuova regola (testo, categoria, priorità)
- `memory_rules_remove` — disattiva una regola esistente
- `memory_rules_list_all` — elenca tutte le regole (attive e disattivate)

**Nuova tab Web UI "Regole":**
- Card con descrizione, form di aggiunta (testo + categoria + priorità)
- Lista regole con toggle attiva/disattiva
- Contatore regole totali/attive

**Database:**
- Nuova tabella `binding_rules` (id, rule_text, category, priority, active, created_at, updated_at)
- Creazione automatica all'avvio del plugin (CREATE TABLE IF NOT EXISTS)

**Categorie disponibili:** general, destructive, external, privacy, domain
**Priorità:** 1 (massima) — 10 (minima)

## 4.5.9 (2026-10-14)

- Semantic search default ON
- WAL mode + busy_timeout 5s
- Fix regressione null intermittenti su memory_recall

## 4.5.8 (2026-10-13)

- WAL mode per eliminare lock SQLite intermittenti
- Logging su tutti i tool

## 4.5.7 (2026-10-13)

- Fix doctor contract handshake (stateMigrations vuote)
