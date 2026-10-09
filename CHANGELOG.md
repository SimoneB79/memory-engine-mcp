# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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