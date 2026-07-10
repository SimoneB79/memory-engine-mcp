-- Memory Engine — SQLite Schema
-- Version: 1.1 (2026-06-29 — added session_offsets, content_hash)
-- Created: 2026-06-27

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ============================================================
-- ATOMS: the core knowledge unit
-- ============================================================
CREATE TABLE IF NOT EXISTS atoms (
    id            TEXT PRIMARY KEY,           -- UUID or slug
    type          TEXT NOT NULL DEFAULT 'fact', -- fact, decision, event, preference, log, procedure, note
    domain        TEXT NOT NULL DEFAULT 'general',
    title         TEXT NOT NULL,
    body          TEXT,
    body_compact  TEXT,                        -- auto-generated summary (L0)
    confidence    REAL NOT NULL DEFAULT 0.5 CHECK(confidence >= 0 AND confidence <= 1),
    weight        REAL NOT NULL DEFAULT 1.0 CHECK(weight >= 0 AND weight <= 2.0),
    status        TEXT NOT NULL DEFAULT 'active', -- active, archived, merged, stale
    source        TEXT DEFAULT 'ai',           -- markdown, ai, human, import
    source_path   TEXT,                        -- original file path if from markdown
    created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at    INTEGER NOT NULL DEFAULT (unixepoch()),
    accessed_at   INTEGER NOT NULL DEFAULT (unixepoch()),
    access_count  INTEGER NOT NULL DEFAULT 0,
    ttl           INTEGER,                     -- NULL = permanent, otherwise epoch expiry
    tags          TEXT DEFAULT '[]',           -- JSON array
    meta          TEXT DEFAULT '{}'            -- JSON object for extensions
);

-- ============================================================
-- SESSION OFFSETS: persistent read positions for JSONL files
-- ============================================================
CREATE TABLE IF NOT EXISTS session_offsets (
    filename      TEXT PRIMARY KEY,            -- e.g. "abc123.jsonl"
    offset        INTEGER NOT NULL DEFAULT 0,  -- last byte offset read
    updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============================================================
-- BONDS: typed relationships between atoms (knowledge graph)
-- ============================================================
CREATE TABLE IF NOT EXISTS bonds (
    from_id       TEXT NOT NULL,
    to_id         TEXT NOT NULL,
    relation      TEXT NOT NULL,               -- is_a, part_of, depends_on, contradicts, refines, derived_from, detail_of, related_to
    strength      REAL NOT NULL DEFAULT 0.5 CHECK(strength >= 0 AND strength <= 1),
    evidence      TEXT,                        -- why this bond exists
    created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
    PRIMARY KEY (from_id, to_id, relation),
    FOREIGN KEY (from_id) REFERENCES atoms(id) ON DELETE CASCADE,
    FOREIGN KEY (to_id) REFERENCES atoms(id) ON DELETE CASCADE
);

-- ============================================================
-- ATOM VERSIONS: track every change
-- ============================================================
CREATE TABLE IF NOT EXISTS atom_versions (
    atom_id       TEXT NOT NULL,
    version       INTEGER NOT NULL,
    title         TEXT,
    body          TEXT,
    changed_at    INTEGER NOT NULL DEFAULT (unixepoch()),
    changed_by    TEXT DEFAULT 'ai',           -- ai, human, system, import
    change_reason TEXT,
    PRIMARY KEY (atom_id, version),
    FOREIGN KEY (atom_id) REFERENCES atoms(id) ON DELETE CASCADE
);

-- ============================================================
-- HUMAN QUESTIONS: pending learning questions
-- ============================================================
CREATE TABLE IF NOT EXISTS human_questions (
    id            TEXT PRIMARY KEY,
    atom_ids      TEXT NOT NULL,               -- JSON array of involved atom IDs
    question_type TEXT NOT NULL,               -- contradiction, weak, merge_candidate, decay_critical, gap
    question      TEXT NOT NULL,
    options       TEXT,                        -- JSON array of suggested answers/options
    status        TEXT NOT NULL DEFAULT 'pending', -- pending, answered, dismissed
    answer        TEXT,
    created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
    answered_at   INTEGER,
    meta          TEXT DEFAULT '{}'
);

-- ============================================================
-- FTS5: Full-text search on atoms
-- ============================================================
CREATE VIRTUAL TABLE IF NOT EXISTS atoms_fts USING fts5(
    title, body, tags,
    content='atoms',
    content_rowid='rowid',
    tokenize='porter unicode61'
);

-- Triggers: keep FTS in sync with atoms
CREATE TRIGGER IF NOT EXISTS atoms_fts_ai AFTER INSERT ON atoms BEGIN
    INSERT INTO atoms_fts(rowid, title, body, tags)
    VALUES (new.rowid, new.title, COALESCE(new.body, ''), new.tags);
END;

CREATE TRIGGER IF NOT EXISTS atoms_fts_ad AFTER DELETE ON atoms BEGIN
    INSERT INTO atoms_fts(atoms_fts, rowid, title, body, tags)
    VALUES ('delete', old.rowid, old.title, COALESCE(old.body, ''), old.tags);
END;

CREATE TRIGGER IF NOT EXISTS atoms_fts_au AFTER UPDATE ON atoms BEGIN
    INSERT INTO atoms_fts(atoms_fts, rowid, title, body, tags)
    VALUES ('delete', old.rowid, old.title, COALESCE(old.body, ''), old.tags);
    INSERT INTO atoms_fts(rowid, title, body, tags)
    VALUES (new.rowid, new.title, COALESCE(new.body, ''), new.tags);
END;

-- ============================================================
-- EMBEDDINGS: vector embeddings for semantic search (Ollama)
-- ============================================================
CREATE TABLE IF NOT EXISTS atom_embeddings (
    atom_id       TEXT PRIMARY KEY,
    embedding     BLOB NOT NULL,               -- float32 array (768 dim for nomic-embed-text)
    model         TEXT NOT NULL DEFAULT 'nomic-embed-text',
    dim           INTEGER NOT NULL DEFAULT 768,
    created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at    INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (atom_id) REFERENCES atoms(id) ON DELETE CASCADE
);

-- ============================================================
-- ERROR MEMORY: track AI mistakes and user corrections
-- ============================================================
CREATE TABLE IF NOT EXISTS error_memory (
    id                   TEXT PRIMARY KEY,
    task_type            TEXT NOT NULL,               -- e.g. 'compilation', 'deploy', 'config'
    error_category       TEXT NOT NULL,               -- field_selection, logic_error, scope_error, omission, tool_misuse
    mistake_description  TEXT NOT NULL,               -- what the AI did wrong
    correction           TEXT NOT NULL,               -- what the AI should have done
    prevention_rule      TEXT,                        -- auto-generated rule after promotion
    severity             TEXT NOT NULL DEFAULT 'minor', -- minor, major, critical
    occurrence_count     INTEGER NOT NULL DEFAULT 1,
    last_occurrence      INTEGER NOT NULL DEFAULT (unixepoch()),
    is_resolved          INTEGER NOT NULL DEFAULT 0,
    resolved_to_atom_id  TEXT,                        -- atom id of the promoted preference
    conversation_id      TEXT,                        -- optional: session context
    meta                 TEXT DEFAULT '{}',           -- JSON for extensions
    created_at           INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at           INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_atoms_type ON atoms(type);
CREATE INDEX IF NOT EXISTS idx_atoms_domain ON atoms(domain);
CREATE INDEX IF NOT EXISTS idx_atoms_status ON atoms(status);
CREATE INDEX IF NOT EXISTS idx_atoms_weight ON atoms(weight);
CREATE INDEX IF NOT EXISTS idx_atoms_confidence ON atoms(confidence);
CREATE INDEX IF NOT EXISTS idx_atoms_accessed ON atoms(accessed_at);
CREATE INDEX IF NOT EXISTS idx_atoms_source ON atoms(source);
CREATE INDEX IF NOT EXISTS idx_bonds_from ON bonds(from_id);
CREATE INDEX IF NOT EXISTS idx_bonds_to ON bonds(to_id);
CREATE INDEX IF NOT EXISTS idx_bonds_relation ON bonds(relation);
CREATE INDEX IF NOT EXISTS idx_questions_status ON human_questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_type ON human_questions(question_type);
CREATE INDEX IF NOT EXISTS idx_errors_task ON error_memory(task_type);
CREATE INDEX IF NOT EXISTS idx_errors_category ON error_memory(error_category);
CREATE INDEX IF NOT EXISTS idx_errors_resolved ON error_memory(is_resolved);
CREATE INDEX IF NOT EXISTS idx_errors_severity ON error_memory(severity);
