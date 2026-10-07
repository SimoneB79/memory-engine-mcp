# Parità Python ↔ TS — audit definitivo (07/10/2026)

## Copertura tool: 43/43 Python presenti nel TS (prefisso memory_)
TS ha 3 extra: memory_admin, memory_list_backups, memory_generate_session_digest.

## Gap REALI rimasti

| # | Gap | Dettaglio | Sforzo |
|---|-----|-----------|--------|
| 1 | **memory_recall_session** | Presente in Python (recall_session), NON esiste nel TS. Vicino ma diverso: memory_session_summary. | piccolo |
| 2 | **memory_find_similar semantico** | TS = solo FTS (etichettato "semantic embeddings: step 2", mai completato). Python: embedding coseno su atom_embeddings. Componenti già in embeddings.ts (embed + cosine + semanticSearch): manca solo find_similar_atoms per id. | piccolo |
| 3 | **_admin_note residuo** | tools.ts:231 dice che learning/curator/find_similar ecc. 'sono disponibili sul server MCP Python' — falso da 4.4.x, nota fuorviante da rimuovere. | banale |

## Gap NON di parità (mancano anche nel Python)
- memory_update_body (modifica body in place da tool). Nota: dal 4.5.0 la risposta a domande 'gap' appende [Human note] al body (parità process_answer).

## Ripristinato in 4.5.0 (verificato su DB reale)
- learning completo: 7 detector + dedup + side-effects (weak/decay/merge/contradiction/gap/graph_gap).

## Verificato a parità in audit precedenti (golden set 12/12 del 01/10 + review 07/10)
recall (+semantic opt), working_set (token budget v2), remember, graph tools (link/search_graph/contradict/impact/suggest_bonds), curator, decay, backup/restore, import/export (json+markdown), cleanup_*, error memory (check/list/log), preference_search, list_contradictions, cognitive_status, stats, version, reindex (migliorato nel TS: failed_detail).

## Conclusione
Dopo 4.5.0 mancano 2 funzioni reali (recall_session, find_similar semantico) + 1 residuo di testo. Entrambe le funzioni: ~1 ora di lavoro incluso test. Con quelle, parità 100%.
