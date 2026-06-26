import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { getHome } from './constants.mjs'

function isWindows(platform) {
  return platform === 'win32'
}

function pathApiFor(platform) {
  return isWindows(platform) ? path.win32 : path.posix
}

export function getBrCandidatePaths({
  platform = process.platform,
  env = process.env,
  homeDir = getHome(),
  existsSync = fs.existsSync,
} = {}) {
  const pathApi = pathApiFor(platform)
  const delimiter = isWindows(platform) ? ';' : ':'
  const pathEntries = String(env.PATH || '')
    .split(delimiter)
    .map((entry) => entry.trim())
    .filter(Boolean)

  const fallbackBins = [
    pathApi.join(homeDir, '.cargo', 'bin'),
    pathApi.join(homeDir, '.local', 'bin'),
  ]

  const allDirs = [...pathEntries, ...fallbackBins]
  const names = isWindows(platform)
    ? ['br.exe', 'br.cmd', 'br.bat', 'br']
    : ['br']

  const seen = new Set()
  const candidates = []

  for (const dir of allDirs) {
    if (!dir) continue
    for (const name of names) {
      const fullPath = pathApi.join(dir, name)
      const key = isWindows(platform) ? fullPath.toLowerCase() : fullPath
      if (seen.has(key)) continue
      seen.add(key)
      if (existsSync(fullPath)) candidates.push(fullPath)
    }
  }
  return candidates
}

function runVersionCheck(binaryPath, spawn = spawnSync) {
  const direct = spawn(binaryPath, ['--version'], { encoding: 'utf8' })
  if (direct.status === 0) {
    const version = `${direct.stdout || ''}${direct.stderr || ''}`.trim() || null
    return { ok: true, version }
  }
  const fallback = spawn(binaryPath, ['version'], { encoding: 'utf8' })
  if (fallback.status === 0) {
    const version = `${fallback.stdout || ''}${fallback.stderr || ''}`.trim() || null
    return { ok: true, version }
  }
  return { ok: false, version: null }
}

export function detectBrCli({
  platform = process.platform,
  env = process.env,
  homeDir = getHome(),
  existsSync = fs.existsSync,
  spawn = spawnSync,
} = {}) {
  const candidates = getBrCandidatePaths({ platform, env, homeDir, existsSync })
  for (const candidatePath of candidates) {
    const checked = runVersionCheck(candidatePath, spawn)
    if (checked.ok) {
      return { ok: true, path: candidatePath, version: checked.version, candidates }
    }
  }
  return { ok: false, path: null, version: null, candidates }
}

export function checkBeadsState(cwd) {
  const dir = path.join(cwd, '.beads')
  const existsDir = fs.existsSync(dir)
  return {
    exists: existsDir,
    dir,
    healthy: !existsDir || (
      fs.existsSync(path.join(dir, 'issues.jsonl')) &&
      fs.existsSync(path.join(dir, 'metadata.json'))
    ),
  }
}

export function runBrInit(cwd) {
  return spawnSync('br', ['init'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
}
