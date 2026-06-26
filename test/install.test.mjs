import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { mergeMcpConfigAdditive, mergeHooksConfigAdditive } from '../src/json-merge.mjs'
import { getCliShimSpecs } from '../src/install-global.mjs'

describe('json-merge', () => {
  it('merges mcpServers additively without overwriting existing server', () => {
    const merged = mergeMcpConfigAdditive({
      current: { mcpServers: { existing: { command: 'node', args: ['a.js'] } } },
      baseline: { mcpServers: { ripgrep: { command: 'npx', args: ['-y', 'rg-mcp'] } } },
    })
    assert.ok(merged.mcpServers.existing)
    assert.ok(merged.mcpServers.ripgrep)
  })

  it('preserves user config when baseline has the same server name (no overwrite)', () => {
    const merged = mergeMcpConfigAdditive({
      current: { mcpServers: { ripgrep: { command: 'npx', args: ['-y', 'mcp-ripgrep@latest'] } } },
      baseline: { mcpServers: { ripgrep: { command: 'npx', args: ['-y', '@modelcontextprotocol/server-ripgrep'], env: {} } } },
    })
    assert.deepEqual(merged.mcpServers.ripgrep, { command: 'npx', args: ['-y', 'mcp-ripgrep@latest'] })
  })

  it('merges hooks additively without duplicating', () => {
    const merged = mergeHooksConfigAdditive({
      current: { version: 1, hooks: { stop: [{ command: './hooks/a.sh' }] } },
      baseline: { version: 1, hooks: { stop: [{ command: './hooks/b.sh' }] } },
    })
    assert.equal(merged.hooks.stop.length, 2)
  })

  it('does not duplicate an identical hook entry', () => {
    const merged = mergeHooksConfigAdditive({
      current: { version: 1, hooks: { stop: [{ command: './hooks/a.sh' }] } },
      baseline: { version: 1, hooks: { stop: [{ command: './hooks/a.sh' }] } },
    })
    assert.equal(merged.hooks.stop.length, 1)
  })
})

describe('cli shims', () => {
  it('generates windows and posix shims', () => {
    const win = getCliShimSpecs({ platform: 'win32', packageRoot: 'C:\\pkg', binDir: 'C:\\bin' })
    // Use path.win32.basename so the assertion holds on Linux CI too
    assert.ok(win.some((s) => path.win32.basename(s.shimPath) === 'csk.cmd'))
    const posix = getCliShimSpecs({ platform: 'linux', packageRoot: '/pkg', binDir: '/bin' })
    assert.ok(posix.some((s) => path.posix.basename(s.shimPath) === 'csk'))
  })
})
