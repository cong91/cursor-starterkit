import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

function mkdtemp(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix))
}

describe('install-global (sandboxed)', () => {
  let fakeHome
  let savedHome

  before(() => {
    fakeHome = mkdtemp('csk-home-')
    // CURSOR_STARTERKIT_HOME is honored by constants.mjs and wins on Windows
    // where os.homedir() ignores HOME.
    savedHome = process.env.CURSOR_STARTERKIT_HOME
    process.env.CURSOR_STARTERKIT_HOME = fakeHome
  })

  after(() => {
    if (savedHome === undefined) delete process.env.CURSOR_STARTERKIT_HOME
    else process.env.CURSOR_STARTERKIT_HOME = savedHome
    fs.rmSync(fakeHome, { recursive: true, force: true })
  })

  it('installs skills, commands, mcp, hooks into sandbox HOME without leaking', async () => {
    const cursorHome = path.join(fakeHome, '.cursor')
    fs.mkdirSync(cursorHome, { recursive: true })
    // pre-existing user mcp — must survive install unchanged
    fs.writeFileSync(
      path.join(cursorHome, 'mcp.json'),
      JSON.stringify({ mcpServers: { 'user-tool': { command: 'node', args: ['u.js'] } } })
    )

    // Dynamic import after env is set so getHome() resolves the sandbox.
    const { installGlobal } = await import('../src/install-global.mjs')
    await installGlobal({ yes: true })

    // skills present
    const skills = fs.readdirSync(path.join(cursorHome, 'skills'))
    assert.ok(skills.includes('verification-before-completion'))

    // commands present (global pr.md, research.md)
    const commands = fs.readdirSync(path.join(cursorHome, 'commands'))
    assert.ok(commands.includes('pr.md'))
    assert.ok(commands.includes('research.md'))

    // user mcp preserved + baseline ripgrep added
    const mcp = JSON.parse(fs.readFileSync(path.join(cursorHome, 'mcp.json'), 'utf8'))
    assert.deepEqual(mcp.mcpServers['user-tool'], { command: 'node', args: ['u.js'] }, 'user mcp preserved')
    assert.ok(mcp.mcpServers.ripgrep, 'baseline ripgrep added')

    // package copy present
    assert.ok(fs.existsSync(path.join(cursorHome, 'starterkit', 'package.json')))

    // shims present
    const isWindows = process.platform === 'win32'
    const shimName = isWindows ? 'csk.cmd' : 'csk'
    assert.ok(fs.existsSync(path.join(fakeHome, '.local', 'bin', shimName)))

    // did NOT leak into real home
    const realHome = os.homedir()
    assert.notEqual(cursorHome, path.join(realHome, '.cursor'))
  })
})
