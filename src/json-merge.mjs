import fs from 'node:fs'
import path from 'node:path'
import { ensureDir, writeText } from './fs-utils.mjs'
import { GLOBAL_MANIFEST_DIR } from './constants.mjs'

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
}

function mergeObjectsAdditive(current = {}, incoming = {}) {
  const out = { ...current }
  for (const [key, value] of Object.entries(incoming)) {
    if (!(key in out)) {
      out[key] = value
      continue
    }
    const existing = out[key]
    // Whole-server conflict: keep user's existing server entry unchanged.
    // Deep-merge would silently graft baseline fields (e.g. env) onto the
    // user's server, which violates "additive only, never overwrite".
    // Baseline-only servers are still added via the `!(key in out)` branch.
  }
  return out
}

export function mergeMcpConfigAdditive({ current = {}, baseline = {} }) {
  const currentServers = current.mcpServers || {}
  const baselineServers = baseline.mcpServers || {}
  return {
    ...current,
    mcpServers: mergeObjectsAdditive(currentServers, baselineServers, { preserve: true }),
  }
}

export function mergeHooksConfigAdditive({ current = {}, baseline = {} }) {
  const out = { ...current }
  if (!baseline.version && !current.version) {
    out.version = 1
  } else if (!out.version && baseline.version) {
    out.version = baseline.version
  }

  const currentHooks = current.hooks || {}
  const baselineHooks = baseline.hooks || {}
  const mergedHooks = { ...currentHooks }

  for (const [event, entries] of Object.entries(baselineHooks)) {
    if (!Array.isArray(entries)) continue
    const existing = Array.isArray(mergedHooks[event]) ? [...mergedHooks[event]] : []
    for (const entry of entries) {
      const key = JSON.stringify(entry)
      // Skip if an equivalent hook already exists; never duplicate or overwrite.
      if (!existing.some((item) => JSON.stringify(item) === key)) {
        existing.push(entry)
      }
    }
    mergedHooks[event] = existing
  }

  out.hooks = mergedHooks
  return out
}

export function readJson(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const raw = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(raw)
}

export function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

export function writeMergeManifest({ targetPath, sourcePath, mergedKeys, note }) {
  ensureDir(GLOBAL_MANIFEST_DIR.resolve())
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const manifestPath = path.join(GLOBAL_MANIFEST_DIR.resolve(), `merge-${stamp}.json`)
  writeText(manifestPath, `${JSON.stringify({
    timestamp: new Date().toISOString(),
    targetPath,
    sourcePath,
    mergedKeys,
    note: note || null,
  }, null, 2)}\n`)
  return manifestPath
}
