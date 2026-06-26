import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { detectBrCli, checkBeadsState } from '../src/br-cli.mjs'

describe('br-cli', () => {
  it('detectBrCli returns structured result when br absent', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'csk-br-'))
    // Isolate: empty PATH, tmp home with no cargo/local bin, existsSync that only sees tmp
    const result = detectBrCli({
      env: { PATH: '' },
      homeDir: tmp,
      existsSync: (p) => p.startsWith(tmp),
    })
    assert.equal(result.ok, false)
    assert.equal(result.path, null)
    assert.ok(Array.isArray(result.candidates))
    fs.rmSync(tmp, { recursive: true, force: true })
  })

  it('checkBeadsState reports absent .beads correctly', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'csk-beads-'))
    const state = checkBeadsState(tmp)
    assert.equal(state.exists, false)
    fs.rmSync(tmp, { recursive: true, force: true })
  })
})
