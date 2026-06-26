/**
 * Cursor Starterkit — Memory DB
 *
 * SQLite-backed per-project memory. Schema inspired by OpenCode's 4-tier
 * pipeline (temporal_messages → distillations → observations) but adapted to
 * Cursor's hook surface: capture is session-summary granularity (hook `stop`),
 * not per-message-part, because Cursor hooks do not expose message parts.
 *
 * Uses node:sqlite (Node >= 22 built-in) — zero dependency.
 */

import path from 'node:path'
import fs from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

function requireNodeSqlite() {
  try {
    return require('node:sqlite')
  } catch {
    throw new Error(
      'node:sqlite requires Node >= 22. Install with nvm/upgrade Node, or run on Node 22+.',
    )
  }
}

const DB_CACHE = new Map()

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS temporal_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  role TEXT NOT NULL,
  text TEXT NOT NULL,
  time_created INTEGER NOT NULL,
  distilled INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS distillations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  terms TEXT NOT NULL,
  summary TEXT NOT NULL,
  time_created INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  narrative TEXT NOT NULL,
  confidence REAL NOT NULL DEFAULT 0.5,
  source_distillation_id INTEGER,
  time_created INTEGER NOT NULL,
  FOREIGN KEY (source_distillation_id) REFERENCES distillations(id)
);

CREATE VIRTUAL TABLE IF NOT EXISTS observations_fts USING fts5(
  title, narrative,
  content='observations',
  content_rowid='id',
  tokenize='porter unicode61'
);

CREATE TRIGGER IF NOT EXISTS observations_ai AFTER INSERT ON observations BEGIN
  INSERT INTO observations_fts(rowid, title, narrative) VALUES (new.id, new.title, new.narrative);
END;

CREATE TRIGGER IF NOT EXISTS observations_ad AFTER DELETE ON observations BEGIN
  INSERT INTO observations_fts(observations_fts, rowid, title, narrative) VALUES('delete', old.id, old.title, old.narrative);
END;

CREATE INDEX IF NOT EXISTS idx_tm_session ON temporal_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_tm_distilled ON temporal_messages(distilled);
CREATE INDEX IF NOT EXISTS idx_obs_type ON observations(type);
`

export function resolveMemoryDbPath(projectRoot) {
  return path.join(projectRoot, '.cursor', 'memory.db')
}

export function openMemoryDb(dbPath, { readOnly = false } = {}) {
  if (!readOnly && DB_CACHE.has(dbPath)) return DB_CACHE.get(dbPath)
  if (!fs.existsSync(dbPath)) {
    if (readOnly) return null
    fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  }
  const { DatabaseSync } = requireNodeSqlite()
  const db = new DatabaseSync(dbPath, { readOnly, timeout: 5000 })
  if (!readOnly) {
    db.exec(SCHEMA_SQL)
    DB_CACHE.set(dbPath, db)
  }
  return db
}

export function closeMemoryDb(dbPath) {
  const db = DB_CACHE.get(dbPath)
  if (db) {
    db.close()
    DB_CACHE.delete(dbPath)
  }
}

export function captureTemporalMessages(db, { sessionId, entries }) {
  const now = Date.now()
  const stmt = db.prepare(
    'INSERT INTO temporal_messages (session_id, role, text, time_created) VALUES (?, ?, ?, ?)',
  )
  for (const e of entries) {
    stmt.run(sessionId || null, e.role || 'unknown', String(e.text || '').slice(0, 4000), now)
  }
}

export function getUndistilledMessages(db, limit = 200) {
  const stmt = db.prepare(
    'SELECT id, session_id, role, text FROM temporal_messages WHERE distilled = 0 ORDER BY time_created ASC LIMIT ?',
  )
  return stmt.all(limit)
}

export function markMessagesDistilled(db, ids) {
  if (!ids.length) return
  const placeholders = ids.map(() => '?').join(',')
  db.prepare(`UPDATE temporal_messages SET distilled = 1 WHERE id IN (${placeholders})`).run(...ids)
}

export function storeDistillation(db, { sessionId, terms, summary }) {
  const stmt = db.prepare(
    'INSERT INTO distillations (session_id, terms, summary, time_created) VALUES (?, ?, ?, ?)',
  )
  const info = stmt.run(sessionId || null, JSON.stringify(terms), summary, Date.now())
  return info.lastInsertRowid
}

export function storeObservation(db, { type, title, narrative, confidence = 0.5, sourceDistillationId = null }) {
  const stmt = db.prepare(
    'INSERT INTO observations (type, title, narrative, confidence, source_distillation_id, time_created) VALUES (?, ?, ?, ?, ?, ?)',
  )
  const info = stmt.run(type, title, narrative, confidence, sourceDistillationId, Date.now())
  return info.lastInsertRowid
}

export function searchObservations(db, query, limit = 8) {
  const trimmed = String(query || '').trim()
  if (!trimmed) return []
  // FTS5 AND query: prefix each term for partial match
  const ftsQuery = trimmed.split(/\s+/).filter(Boolean).map((t) => `${t.replace(/["']/g, '')}*`).join(' ')
  try {
    const stmt = db.prepare(
      `SELECT o.id, o.type, o.title, o.narrative, o.confidence, o.time_created,
              bm25(observations_fts) AS rank
       FROM observations_fts
       JOIN observations o ON o.id = observations_fts.rowid
       WHERE observations_fts MATCH ?
       ORDER BY rank
       LIMIT ?`,
    )
    return stmt.all(ftsQuery, limit)
  } catch {
    // FTS match syntax error → fall back to LIKE
    const likeStmt = db.prepare(
      `SELECT id, type, title, narrative, confidence, time_created FROM observations
       WHERE title LIKE ? OR narrative LIKE ?
       ORDER BY time_created DESC LIMIT ?`,
    )
    const pat = `%${trimmed}%`
    return likeStmt.all(pat, pat, limit)
  }
}

export function recentObservations(db, limit = 12) {
  return db.prepare(
    'SELECT id, type, title, narrative, confidence, time_created FROM observations ORDER BY time_created DESC LIMIT ?',
  ).all(limit)
}

export function dbStats(db) {
  const tm = db.prepare('SELECT COUNT(*) AS c FROM temporal_messages').get().c
  const tmUndistilled = db.prepare('SELECT COUNT(*) AS c FROM temporal_messages WHERE distilled=0').get().c
  const dist = db.prepare('SELECT COUNT(*) AS c FROM distillations').get().c
  const obs = db.prepare('SELECT COUNT(*) AS c FROM observations').get().c
  return { temporalMessages: tm, undistilled: tmUndistilled, distillations: dist, observations: obs }
}
