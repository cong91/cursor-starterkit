import fs from 'node:fs'
import path from 'node:path'
import {
  CSK_BASELINE_ROOT,
  CSK_PACKAGE_ROOT,
  GLOBAL_BACKUP_DIR,
  GLOBAL_BIN_DIR,
  GLOBAL_COMMANDS_DIR,
  GLOBAL_HOOKS_DIR,
  GLOBAL_HOOKS_FILE,
  GLOBAL_INSTALL_LOG_DIR,
  GLOBAL_MCP_FILE,
  GLOBAL_PACKAGE_ROOT,
  GLOBAL_SKILLS_DIR,
  getHome,
} from './constants.mjs'
import {
  backupIfExists,
  copyDirRecursive,
  ensureDir,
  exists,
  shouldCopyStarterkitPath,
  writeText,
} from './fs-utils.mjs'
import {
  mergeHooksConfigAdditive,
  mergeMcpConfigAdditive,
  readJson,
  writeJson,
  writeMergeManifest,
} from './json-merge.mjs'

function cursorHome() {
  return path.join(getHome(), '.cursor')
}

function copyRuntimeFilter(src, root) {
  const relative = path.relative(root, src)
  if (!relative) return true
  if (relative.split(path.sep).includes('.git')) return false
  return shouldCopyStarterkitPath(src, root)
}

function installPackageRuntime() {
  const packageRoot = GLOBAL_PACKAGE_ROOT.resolve()
  const backupDir = GLOBAL_BACKUP_DIR.resolve()
  backupIfExists(packageRoot, { backupRoot: backupDir })
  ensureDir(cursorHome())
  fs.cpSync(CSK_PACKAGE_ROOT, packageRoot, {
    recursive: true,
    force: true,
    filter: (src) => copyRuntimeFilter(src, CSK_PACKAGE_ROOT),
  })
}

function copySkills() {
  copyDirRecursive(path.join(CSK_BASELINE_ROOT, 'skills'), GLOBAL_SKILLS_DIR.resolve())
}

function copyCommands() {
  copyDirRecursive(path.join(CSK_BASELINE_ROOT, 'commands'), GLOBAL_COMMANDS_DIR.resolve())
}

function copyHooksScripts() {
  const src = path.join(CSK_BASELINE_ROOT, 'hooks', 'scripts')
  if (!exists(src)) return
  copyDirRecursive(src, path.join(GLOBAL_HOOKS_DIR.resolve(), 'scripts'))
}

function copyMemoryDb() {
  const src = path.join(CSK_BASELINE_ROOT, 'memory-db')
  if (!exists(src)) return
  copyDirRecursive(src, path.join(cursorHome(), 'memory-db'))
}

function mergeMcp() {
  const baselinePath = path.join(CSK_BASELINE_ROOT, 'mcp', 'mcp.json')
  if (!exists(baselinePath)) return null

  const mcpFile = GLOBAL_MCP_FILE.resolve()
  const baseline = readJson(baselinePath)
  const current = exists(mcpFile) ? readJson(mcpFile) : {}
  backupIfExists(mcpFile, { backupRoot: GLOBAL_BACKUP_DIR.resolve() })

  const merged = mergeMcpConfigAdditive({ current, baseline })
  writeJson(mcpFile, merged)
  return writeMergeManifest({
    targetPath: mcpFile,
    sourcePath: baselinePath,
    mergedKeys: Object.keys(baseline.mcpServers || {}),
    note: 'additive mcpServers merge',
  })
}

function mergeHooks() {
  const baselinePath = path.join(CSK_BASELINE_ROOT, 'hooks', 'hooks.json')
  if (!exists(baselinePath)) return null

  const hooksFile = GLOBAL_HOOKS_FILE.resolve()
  const baseline = readJson(baselinePath)
  const current = exists(hooksFile) ? readJson(hooksFile) : {}
  backupIfExists(hooksFile, { backupRoot: GLOBAL_BACKUP_DIR.resolve() })

  const merged = mergeHooksConfigAdditive({ current, baseline })
  writeJson(hooksFile, merged)
  copyHooksScripts()
  return writeMergeManifest({
    targetPath: hooksFile,
    sourcePath: baselinePath,
    mergedKeys: Object.keys(baseline.hooks || {}),
    note: 'additive hooks merge',
  })
}

function buildPosixShim({ scriptPath }) {
  return `#!/usr/bin/env bash\nnode "${scriptPath}" "$@"\n`
}

function buildWindowsCmdShim({ scriptPath }) {
  return `@echo off\r\nnode "${scriptPath}" %*\r\n`
}

export function getCliShimSpecs({
  platform = process.platform,
  packageRoot = GLOBAL_PACKAGE_ROOT.resolve(),
  binDir = GLOBAL_BIN_DIR.resolve(),
} = {}) {
  // Use the path module matching the TARGET platform, not the host platform,
  // so shim paths are correct when generating cross-platform specs (e.g.
  // generating posix shims from a Windows host for testing/inspection).
  const pathApi = platform === 'win32' ? path.win32 : path.posix
  const isWindows = platform === 'win32'

  const specs = [
    { shimName: isWindows ? 'csk.cmd' : 'csk', scriptName: 'csk.mjs' },
    { shimName: isWindows ? 'cursor-starterkit.cmd' : 'cursor-starterkit', scriptName: 'cursor-starterkit.mjs' },
  ]

  return specs.map(({ shimName, scriptName }) => {
    const scriptPath = pathApi.join(packageRoot, 'bin', scriptName)
    return {
      shimPath: pathApi.join(binDir, shimName),
      content: isWindows ? buildWindowsCmdShim({ scriptPath }) : buildPosixShim({ scriptPath }),
      executable: !isWindows,
    }
  })
}

function installCliShims() {
  const binDir = GLOBAL_BIN_DIR.resolve()
  const packageRoot = GLOBAL_PACKAGE_ROOT.resolve()
  ensureDir(binDir)
  const specs = getCliShimSpecs({ packageRoot, binDir })
  for (const spec of specs) {
    writeText(spec.shimPath, spec.content)
    if (spec.executable) fs.chmodSync(spec.shimPath, 0o755)
  }
  return specs.map((s) => s.shimPath)
}

export async function installGlobal({ yes = false } = {}) {
  console.log('[cursor-starterkit] Installing global Cursor baseline...\n')

  installPackageRuntime()
  copySkills()
  copyCommands()
  copyHooksScripts()
  copyMemoryDb()
  const mcpManifest = mergeMcp()
  const hooksManifest = mergeHooks()
  const shims = installCliShims()

  const installLogDir = GLOBAL_INSTALL_LOG_DIR.resolve()
  ensureDir(installLogDir)
  const logPath = path.join(installLogDir, `install-${Date.now()}.log`)
  writeText(logPath, [
    `installed_at=${new Date().toISOString()}`,
    `package_root=${GLOBAL_PACKAGE_ROOT.resolve()}`,
    `skills=${GLOBAL_SKILLS_DIR.resolve()}`,
    `commands=${GLOBAL_COMMANDS_DIR.resolve()}`,
    `mcp=${GLOBAL_MCP_FILE.resolve()}`,
    `hooks=${GLOBAL_HOOKS_FILE.resolve()}`,
    `shims=${shims.join(',')}`,
    mcpManifest ? `mcp_manifest=${mcpManifest}` : '',
    hooksManifest ? `hooks_manifest=${hooksManifest}` : '',
  ].filter(Boolean).join('\n'))

  console.log('Installed:')
  console.log(`  package   → ${GLOBAL_PACKAGE_ROOT.resolve()}`)
  console.log(`  skills    → ${GLOBAL_SKILLS_DIR.resolve()}`)
  console.log(`  commands  → ${GLOBAL_COMMANDS_DIR.resolve()}`)
  console.log(`  mcp       → ${GLOBAL_MCP_FILE.resolve()} (additive merge)`)
  console.log(`  hooks     → ${GLOBAL_HOOKS_FILE.resolve()} (additive merge)`)
  console.log(`  shims     → ${shims.join(', ')}`)
  console.log('\nNext: open a project and run `csk install` to scaffold .cursor/')
  if (!yes) {
    console.log('\nReload Cursor window (Ctrl+Shift+P → Reload Window) to pick up MCP changes.')
  }
}
