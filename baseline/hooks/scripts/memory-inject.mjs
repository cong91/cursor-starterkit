#!/usr/bin/env node
/**
 * Cursor hook: sessionStart
 * Injects recent memory observations into context by writing a markdown
 * snapshot that the alwaysApply rule `project-context.mdc` references.
 *
 * Cursor passes a JSON object on stdin: { cwd, ... }.
 * Hook must exit 0; it cannot block session start.
 */
import { readStdinJson } from './lib/stdin.mjs'
import { resolveMemoryDbPath, openMemoryDb, recentObservations, dbStats } from '../../memory-db/memory-db.mjs'
import fs from 'node:fs'
import path from 'node:path'

async function main() {
  const input = await readStdinJson()
  const cwd = (input.workspace_roots && input.workspace_roots[0]) || input.cwd || process.cwd()
  const dbPath = resolveMemoryDbPath(cwd)
  if (!fs.existsSync(dbPath)) {
    process.exit(0)
  }

  let db
  try {
    db = openMemoryDb(dbPath, { readOnly: true })
  } catch (err) {
    process.stderr.write(`[memory-inject] skip: ${err.message}\n`)
    process.exit(0)
  }
  if (!db) process.exit(0)

  try {
    const recent = recentObservations(db, 12)
    const stats = dbStats(db)
    const injectPath = path.join(cwd, '.cursor', 'memory', 'project', 'injected.md')
    const lines = ['# Injected Memory', '', `_Snapshot at ${new Date().toISOString()} — ${stats.observations} observations_`, '']
    if (recent.length) {
      lines.push('## Recent observations', '')
      for (const o of recent) {
        lines.push(`- **${o.title}** (${o.type}, conf ${o.confidence.toFixed(2)}): ${o.narrative}`)
      }
    } else {
      lines.push('_No observations yet. Run `/memory-search` or finish a session to populate._')
    }
    fs.mkdirSync(path.dirname(injectPath), { recursive: true })
    fs.writeFileSync(injectPath, lines.join('\n') + '\n', 'utf8')
  } finally {
    try { db.close() } catch {}
  }
  process.exit(0)
}

main().catch((err) => {
  process.stderr.write(`[memory-inject] error: ${err.message}\n`)
  process.exit(0) // fail open
})
