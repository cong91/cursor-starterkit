import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { openMemoryDb, closeMemoryDb, captureTemporalMessages, getUndistilledMessages, markMessagesDistilled, storeDistillation, storeObservation, searchObservations, recentObservations, dbStats, resolveMemoryDbPath } from '../baseline/memory-db/memory-db.mjs'
import { distill, extractTerms } from '../baseline/memory-db/distill.mjs'

function mkdtemp(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix))
}

describe('memory-db', () => {
  let tmp
  let dbPath

  before(() => {
    tmp = mkdtemp('csk-mem-')
    dbPath = resolveMemoryDbPath(tmp)
  })

  after(() => {
    closeMemoryDb(dbPath)
    fs.rmSync(tmp, { recursive: true, force: true })
  })

  it('creates schema and captures + distills + searches observations', () => {
    const db = openMemoryDb(dbPath)
    captureTemporalMessages(db, {
      sessionId: 's1',
      entries: [
        { role: 'user', text: 'fix the auth bug in login.ts where token expires too fast' },
        { role: 'assistant', text: 'I checked login.ts and found token expiry was 1 minute. Changed to 1 hour and added a refresh test.' },
        { role: 'user', text: 'run the refresh test to verify the token fix' },
      ],
    })
    const undistilled = getUndistilledMessages(db, 200)
    assert.equal(undistilled.length, 3)

    const result = distill(undistilled)
    assert.ok(result)
    assert.ok(result.terms.length > 0)
    assert.ok(result.summary.length > 0)

    const distId = storeDistillation(db, { sessionId: 's1', terms: result.terms, summary: result.summary })
    markMessagesDistilled(db, undistilled.map((m) => m.id))
    storeObservation(db, {
      type: 'session',
      title: `Session s1: ${result.terms[0].term}`,
      narrative: result.summary.slice(0, 500),
      confidence: 0.8,
      sourceDistillationId: distId,
    })

    const stats = dbStats(db)
    assert.equal(stats.temporalMessages, 3)
    assert.equal(stats.undistilled, 0)
    assert.equal(stats.distillations, 1)
    assert.equal(stats.observations, 1)

    const recent = recentObservations(db, 5)
    assert.equal(recent.length, 1)
    assert.match(recent[0].title, /Session s1/)

    const hits = searchObservations(db, result.terms[0].term, 5)
    assert.ok(hits.length >= 1)
  })
})

describe('distill TF-IDF', () => {
  it('extracts terms from a corpus', () => {
    const terms = extractTerms([
      { text: 'fix the auth bug in login.ts token expires too fast' },
      { text: 'login.ts token expiry was one minute changed to one hour' },
      { text: 'run the refresh test to verify the token fix' },
    ], 5)
    assert.ok(terms.length > 0)
    assert.ok(terms[0].score > 0)
  })

  it('returns null distillation for empty input', () => {
    assert.equal(distill([]), null)
  })
})
