#!/usr/bin/env node
/**
 * session-search CLI — search across ALL Cursor session transcripts for a project.
 *
 * Unlike /memory-search (which queries the distilled memory DB), this reads the
 * raw Cursor transcript .jsonl files directly. Use when you need the actual
 * conversation text, not the distilled observations.
 *
 * Usage:
 *   node session-search.mjs "<query>" [--cwd PATH] [--limit N]
 *   node session-search.mjs --list [--cwd PATH]
 */
import path from 'node:path'
import os from 'node:os'
import { listTranscripts, readTranscript } from '../memory-db/transcript.mjs'

function parseArgs(argv) {
  const positional = []
  let cwd = process.cwd()
  let limit = 6
  let list = false
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--cwd') cwd = argv[++i]
    else if (a === '--limit') limit = Number(argv[++i]) || 6
    else if (a === '--list') list = true
    else if (!a.startsWith('-')) positional.push(a)
  }
  return { query: positional.join(' ').trim(), cwd, limit, list }
}

function cursorHome() {
  return path.join(os.homedir(), '.cursor')
}

function snippetAround(text, query, radius = 160) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx < 0) return text.slice(0, radius)
  const start = Math.max(0, idx - radius / 2)
  const end = Math.min(text.length, idx + query.length + radius / 2)
  return `…${text.slice(start, end)}…`
}

async function main() {
  const { query, cwd, limit, list } = parseArgs(process.argv.slice(2))
  const transcripts = listTranscripts(cursorHome(), 100)

  if (list) {
    console.log(JSON.stringify({
      totalTranscripts: transcripts.length,
      transcripts: transcripts.slice(0, limit).map((t) => ({
        conversationId: t.conversationId,
        projectSlug: t.projectSlug,
        mtime: new Date(t.mtime).toISOString(),
      })),
    }, null, 2))
    return
  }

  if (!query) {
    console.error('Usage: session-search.mjs "<query>" [--cwd PATH] [--limit N] | --list')
    process.exit(1)
  }

  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const results = []
  for (const t of transcripts) {
    const entries = readTranscript(t.path)
    const matches = []
    for (const e of entries) {
      if (e.toolName) continue
      const lower = e.text.toLowerCase()
      if (words.every((w) => lower.includes(w))) {
        matches.push({ role: e.role, snippet: snippetAround(e.text, words[0]) })
        if (matches.length >= 3) break
      }
    }
    if (matches.length) {
      results.push({
        conversationId: t.conversationId,
        projectSlug: t.projectSlug,
        mtime: new Date(t.mtime).toISOString(),
        matchCount: matches.length,
        snippets: matches,
      })
    }
    if (results.length >= limit) break
  }

  console.log(JSON.stringify({
    query,
    stats: { totalTranscripts: transcripts.length, matched: results.length },
    results,
  }, null, 2))
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
