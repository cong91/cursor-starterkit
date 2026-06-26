#!/usr/bin/env node
/**
 * memory-search CLI — query the project memory SQLite DB.
 * Usage: node memory-search.mjs "<query>" [--limit N] [--cwd PATH] [--recent]
 */
import { resolveMemoryDbPath, openMemoryDb, searchObservations, recentObservations, dbStats } from '../memory-db/memory-db.mjs'

function parseArgs(argv) {
  const positional = []
  let limit = 8
  let cwd = process.cwd()
  let recent = false
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--limit') limit = Number(argv[++i]) || 8
    else if (a === '--cwd') cwd = argv[++i]
    else if (a === '--recent') recent = true
    else if (!a.startsWith('-')) positional.push(a)
  }
  return { query: positional.join(' '), limit, cwd, recent }
}

async function main() {
  const { query, limit, cwd, recent } = parseArgs(process.argv.slice(2))
  const dbPath = resolveMemoryDbPath(cwd)
  let db
  try {
    db = openMemoryDb(dbPath, { readOnly: true })
  } catch (err) {
    console.error(`[memory-search] cannot open DB: ${err.message}`)
    console.error(`Expected at: ${dbPath}`)
    process.exit(1)
  }
  if (!db) {
    console.error(`[memory-search] no memory DB yet at: ${dbPath}`)
    console.error(`Run a session to completion (hook stop) to populate it.`)
    process.exit(0)
  }
  try {
    const stats = dbStats(db)
    if (recent || !query) {
      const rows = recentObservations(db, limit)
      console.log(JSON.stringify({ stats, results: rows }, null, 2))
    } else {
      const rows = searchObservations(db, query, limit)
      console.log(JSON.stringify({ query, stats, results: rows }, null, 2))
    }
  } finally {
    try { db.close() } catch {}
  }
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
