import fs from 'node:fs'
import path from 'node:path'

export const DEFAULT_COPY_DENYLIST = [
  'node_modules',
  'dist',
  '.git',
  'coverage',
  '.next',
  '.turbo',
  'logs',
]

export function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

export function exists(targetPath) {
  return fs.existsSync(targetPath)
}

function isRuntimeArtifactName(name) {
  return DEFAULT_COPY_DENYLIST.includes(name)
}

export function shouldCopyStarterkitPath(sourcePath, rootPath = null) {
  const relative = rootPath ? path.relative(rootPath, sourcePath) : sourcePath
  if (!relative || relative === '') return true

  const parts = relative.split(path.sep).filter(Boolean)
  if (parts.some(isRuntimeArtifactName)) return false
  return true
}

export function copyFileIfExists(fromPath, toPath) {
  if (!exists(fromPath)) return false
  if (!shouldCopyStarterkitPath(fromPath, path.dirname(fromPath))) return false
  ensureDir(path.dirname(toPath))
  fs.copyFileSync(fromPath, toPath)
  return true
}

export function copyDirRecursive(fromDir, toDir, options = {}) {
  if (!exists(fromDir)) return false
  const filter = options.filter || ((src) => shouldCopyStarterkitPath(src, fromDir))
  ensureDir(toDir)
  fs.cpSync(fromDir, toDir, {
    recursive: true,
    force: true,
    filter,
  })
  return true
}

export function copyDirMissing(fromDir, toDir, options = {}) {
  const copied = []
  const preserved = []
  if (!exists(fromDir)) return { copied, preserved }

  const filter = options.filter || ((src) => shouldCopyStarterkitPath(src, fromDir))

  function visit(srcPath) {
    if (!filter(srcPath)) return
    const relative = path.relative(fromDir, srcPath)
    const targetPath = path.join(toDir, relative)
    const stat = fs.statSync(srcPath)

    if (stat.isDirectory()) {
      ensureDir(targetPath)
      for (const entry of fs.readdirSync(srcPath)) {
        visit(path.join(srcPath, entry))
      }
      return
    }

    if (!stat.isFile()) return
    if (exists(targetPath)) {
      preserved.push(targetPath)
      return
    }
    ensureDir(path.dirname(targetPath))
    fs.copyFileSync(srcPath, targetPath)
    copied.push(targetPath)
  }

  visit(fromDir)
  return { copied, preserved }
}

export function backupIfExists(targetPath, { backupRoot }) {
  if (!exists(targetPath)) return null
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const baseName = path.basename(targetPath)
  const backupPath = path.join(backupRoot, `${baseName}.${stamp}`)
  ensureDir(backupRoot)
  fs.cpSync(targetPath, backupPath, { recursive: true, force: true })
  return backupPath
}

export function writeText(filePath, content) {
  ensureDir(path.dirname(filePath))
  fs.writeFileSync(filePath, content, 'utf8')
}
