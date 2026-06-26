import path from 'node:path'
import readline from 'node:readline'
import {
  CSK_BASELINE_ROOT,
  PROJECT_MEMORY_FILES,
  PROJECT_RULE_FILES,
} from './constants.mjs'
import { copyDirMissing, ensureDir, exists, writeText } from './fs-utils.mjs'
import { mergeMcpConfigAdditive, readJson, writeJson } from './json-merge.mjs'
import { renderProjectMemoryFiles } from './templates.mjs'
import { checkBeadsState, detectBrCli, runBrInit } from './br-cli.mjs'

function askYesNo(question, defaultYes = true) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const hint = defaultYes ? '[Y/n]' : '[y/N]'
  return new Promise((resolve) => {
    rl.question(`${question} ${hint} `, (answer) => {
      rl.close()
      const trimmed = String(answer || '').trim().toLowerCase()
      if (!trimmed) resolve(defaultYes)
      else resolve(trimmed === 'y' || trimmed === 'yes')
    })
  })
}

function materializeProjectOverlay({ cwd, forceMemory = false, forceRules = false }) {
  const cursorRoot = path.join(cwd, '.cursor')
  const memoryRoot = path.join(cursorRoot, 'memory')
  const memoryDir = path.join(memoryRoot, 'project')
  const rulesDir = path.join(cursorRoot, 'rules')
  const commandsDir = path.join(cursorRoot, 'commands')

  ensureDir(memoryDir)
  ensureDir(rulesDir)
  ensureDir(commandsDir)

  // Copy baseline project commands (team-shared workflows)
  const baselineCommands = path.join(CSK_BASELINE_ROOT, 'commands', 'project')
  if (exists(baselineCommands)) {
    copyDirMissing(baselineCommands, commandsDir)
  }

  // Copy baseline project rules (preserve existing; --force-rules regenerates below)
  const baselineRules = path.join(CSK_BASELINE_ROOT, 'rules', 'project')
  if (exists(baselineRules)) {
    copyDirMissing(baselineRules, rulesDir)
  }

  // Memory support tree (templates, research) — preserve existing
  const baselineMemoryRoot = path.join(CSK_BASELINE_ROOT, 'memory')
  const support = copyDirMissing(baselineMemoryRoot, memoryRoot, {
    filter: (srcPath) => {
      const relative = path.relative(baselineMemoryRoot, srcPath)
      if (!relative) return true
      return relative.split(path.sep).filter(Boolean)[0] !== 'project'
    },
  })

  const files = renderProjectMemoryFiles({ cwd })
  const written = []
  const preserved = []

  for (const name of PROJECT_MEMORY_FILES) {
    const targetPath = path.join(memoryDir, name)
    if (!forceMemory && exists(targetPath)) {
      preserved.push(targetPath)
      continue
    }
    writeText(targetPath, files[name])
    written.push(targetPath)
  }

  for (const name of PROJECT_RULE_FILES) {
    const targetPath = path.join(rulesDir, name)
    if (!forceRules && exists(targetPath)) {
      preserved.push(targetPath)
      continue
    }
    writeText(targetPath, files[name])
    written.push(targetPath)
  }

  // Project MCP — additive merge, use env placeholders
  const projectMcpPath = path.join(cursorRoot, 'mcp.json')
  const baselineMcp = path.join(CSK_BASELINE_ROOT, 'mcp', 'mcp.project.json')
  if (exists(baselineMcp)) {
    const current = exists(projectMcpPath) ? readJson(projectMcpPath) : {}
    const baseline = readJson(baselineMcp)
    writeJson(projectMcpPath, mergeMcpConfigAdditive({ current, baseline }))
  }

  return { written, preserved, supportCopied: support.copied, cursorRoot }
}

export async function installProject({
  cwd = process.cwd(),
  yes = false,
  forceMemory = false,
  forceRules = false,
} = {}) {
  console.log(`[csk] Project overlay install for: ${cwd}\n`)

  if (!yes) {
    const confirmed = await askYesNo('Create/update .cursor/ project overlay?')
    if (!confirmed) {
      console.log('Cancelled.')
      return { cancelled: true }
    }
  }

  const result = materializeProjectOverlay({ cwd, forceMemory, forceRules })

  // Beads integration: init .beads/ if br is available and not already initialized
  let beadsResult = null
  const br = detectBrCli()
  if (br.ok) {
    const state = checkBeadsState(cwd)
    if (!state.exists) {
      const init = runBrInit(cwd)
      beadsResult = { initialized: init.status === 0, brPath: br.path, brVersion: br.version }
    } else {
      beadsResult = { initialized: false, existed: true, brPath: br.path, brVersion: br.version }
    }
  } else {
    beadsResult = { available: false, candidates: br.candidates }
  }

  console.log('Created/updated:')
  for (const file of result.written) console.log(`  + ${path.relative(cwd, file)}`)
  if (result.preserved.length) {
    console.log('\nPreserved (already existed):')
    for (const file of result.preserved) console.log(`  = ${path.relative(cwd, file)}`)
  }
  if (result.supportCopied.length) {
    console.log(`\nCopied ${result.supportCopied.length} support file(s) into .cursor/memory/`)
  }

  if (beadsResult.available === false) {
    console.log('\nBeads (br CLI): not found on PATH.')
    console.log('  Install br to enable multi-session task coordination (see `beads` skill).')
  } else if (beadsResult.initialized) {
    console.log(`\nBeads: initialized .beads/ (br ${beadsResult.brVersion})`)
  } else if (beadsResult.existed) {
    console.log(`\nBeads: .beads/ already exists (br ${beadsResult.brVersion})`)
  }

  console.log('\nTry in Cursor Agent chat:')
  console.log('  /init           — detect stack and refine project memory')
  console.log('  /plan           — create an implementation plan')
  console.log('  /verify         — run verification before shipping')
  console.log('  /br list        — beads task coordination')
  console.log('  /memory-search  — search project memory')

  return { ...result, beads: beadsResult, cancelled: false }
}
