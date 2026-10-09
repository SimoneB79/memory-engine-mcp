# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.5.5] — 2026-10-09

### Fixed (openclaw-plugin)
- **4.5.4 incompleta**: oltre al configSchema, la build aveva azzerato anche `contracts.tools` nel manifest, quindi il gateway rifiutava la registrazione dei 46 tool ("plugin must declare contracts.tools before registering agent tools") e il Memory Engine non caricava. 4.5.5 ripristina contracts.tools (46 tool), configSchema ingest e allinea la stringa VERSION interna in src/tools.ts.
- Procedura release aggiornata: dopo `npm run build` ripristinare SEMPRE configSchema + contracts.tools nel manifest prima di validate/publish.

## [4.5.4] — 2026-10-09

### Fixed (openclaw-plugin)
- **4.5.3 broken**: la build aveva azzerato il `configSchema` del manifest (bug noto plugins build), quindi il gateway rifiutava la config con `plugins.entries.memory-engine.config.ingest` ("must not have additional properties: ingest") e l'update falliva. 4.5.4 ripristina il configSchema ingest (enabled/retention_days). Il fix doctor-contract di 4.5.3 è invariato.

## [4.5.3] — 2026-10-09

### Fixed (openclaw-plugin)
- **Doctor upgrade handshake**: il plugin non dichiarava alcun doctor contract, quindi `openclaw doctor` lasciava per sempre pending la migrazione dati/settings di `memory-engine/index` e `memory-engine/ui-feature` (warning "data/settings upgrade is unfinished"). Aggiunto `src/doctor-contract-api.ts` con `stateMigrations: []` e dichiarazione `doctorContract.stateMigrations: []` nel manifest: il Doctor ora ispeziona il plugin come stateless (lo stato vive nel proprio DB SQLite) e chiude l'handshake.

## [4.5.2] — 2026-10-09

### Fixed (openclaw-plugin)
- **memory_contradict**: l'INSERT su atoms dichiarava 16 colonne ma passava solo 14 valori, con i letterali nelle posizioni sbagliate ('ai' in confidence, 0.8 in status, 'active' in source). Errore runtime: "14 values for 16 columns". Ora confidence/status/source/weight sono valorizzati correttamente nel nuovo atomo e l'atomo vecchio viene marcato superseded.
- Aggiunto test di regressione (contradict.test.ts) che verifica anche il mapping colonne.
- devDeps: vitest ^3.3.0 non esiste su npm, corretto a ^3.2.4.

## [2.1.0] — 2026-10-06

### Fixed
- **Anti-livelock nel reindex background**: gli atomi che falliscono l'embed ripetutamente (testi oversize, contenuti corrotti) vengono messi in quarantena dopo 3 tentativi invece di bloccare il loop all'infinito con lo stesso atomo (bug: un solo atomo tossico fermava l'indicizzazione di tutto il DB).
- **Report fallimenti dettagliato**: reindex_embeddings espone gli atomi in quarantena con motivo; reindex_all/reindex_batch (python) ritornano failed_detail [{id, reason}] e contano gli atomi mancanti (skipped_missing) invece di saltarli in silenzio.
- **reindex_embeddings status**: nuovo campo quarantined con atom_id e reason per ogni elemento in quarantena.

## [2.0.0] — 2026-10-01