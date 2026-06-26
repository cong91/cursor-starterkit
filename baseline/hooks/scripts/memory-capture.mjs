#!/usr/bin/env node
/**
 * Cursor hook: stop (session end)
 *
 * Reads the real conversation transcript via `transcript_path` (Cursor passes
 * this in the stdin payload and as CURSOR_TRANSCRIPT_PATH env var), parses it,
 * and persists distilled observations into the project memory SQLite DB.
 *
 * Verified Cursor stop payload includes the common base fields:
 *   { conversation_id, generation_id, model, hook_event_name, cursor_version,
 *     workspace_roots, user_email, transcript_path, status, loop_count }
 *
 * This is the canonical Cursor-native bridge from conversation → memory.
 */
import { readStdinJson } from './lib/stdin.mjs'
import { resolveMemoryDbPath, openMemoryDb, captureTemporalMessages, getUndistilledMessages, markMessagesDistilled, storeDistillation, storeObservation } from '../../memory-db/memory-db.mjs'
import { distill } from '../../memory-db/distill.mjs'
import { readTranscript } from '../../memory-db/transcript.mjs'

async function main() {
  const input = await readStdinJson()
  const cwd = (input.workspace_roots && input.workspace_roots[0]) || input.cwd || process.cwd()
  const conversationId = input.conversation_id || input.sessionId || input.session_id || `sess-${Date.now()}`
  const transcriptPath = input.transcript_path || process.env.CURSOR_TRANSCRIPT_PATH || null

  const entries = readTranscript(transcriptPath)
  if (!entries.length) {
    // Nothing to capture — fail open, don't block session end
    process.exit(0)
  }

  const dbPath = resolveMemoryDbPath(cwd)
  let db
  try {
    db = openMemoryDb(dbPath)
  } catch (err) {
    process.stderr.write(`[memory-capture] skip: ${err.message}\n`)
    process.exit(0)
  }

  try {
    // Filter out tool noise from text for distillation quality, but capture all
    const textEntries = entries.filter((e) => !e.toolName)
    if (textEntries.length) {
      captureTemporalMessages(db, { sessionId: conversationId, entries: textEntries })
    }

    const undistilled = getUndistilledMessages(db, 500)
    if (undistilled.length >= 2) {
      const result = distill(undistilled)
      if (result) {
        const distId = storeDistillation(db, {
          sessionId: conversationId,
          terms: result.terms,
          summary: result.summary,
        })
        markMessagesDistilled(db, undistilled.map((m) => m.id))
        const topTerm = result.terms[0]?.term || 'session'
        storeObservation(db, {
          type: 'session',
          title: `Conversation ${conversationId.slice(0, 12)}: ${topTerm}`,
          narrative: result.summary.slice(0, 800),
          confidence: Math.min(0.4 + result.terms.length * 0.05, 0.9),
          sourceDistillationId: distId,
        })
      }
    }
  } finally {
    try { db.close() } catch {}
  }
  process.exit(0)
}

main().catch((err) => {
  process.stderr.write(`[memory-capture] error: ${err.message}\n`)
  process.exit(0) // fail open — never block session end
})
