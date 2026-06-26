import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'

const THIS_FILE = fileURLToPath(import.meta.url)
const SRC_DIR = path.dirname(THIS_FILE)
const PACKAGE_ROOT = path.resolve(SRC_DIR, '..')

// Node's os.homedir() ignores the HOME env var on Windows, which would make
// isolated install tests leak into the real user profile. Honor an explicit
// override first (re-resolved on each call) so tests can sandbox safely and
// so the real install still resolves the user's home correctly.
export function getHome() {
  const override = process.env.CURSOR_STARTERKIT_HOME || process.env.HOME
  if (override && typeof override === 'string' && override.length > 0) {
    return path.resolve(override)
  }
  return os.homedir()
}

export const CSK_PACKAGE_ROOT = PACKAGE_ROOT
export const CSK_BASELINE_ROOT = path.join(PACKAGE_ROOT, 'baseline')

// Cursor global paths — resolved lazily via getters so HOME overrides apply
// even when constants are imported before tests set the env var.
function cursorHome() {
  return path.join(getHome(), '.cursor')
}

export const GLOBAL_PACKAGE_ROOT = { resolve: () => path.join(cursorHome(), 'starterkit') }
export const GLOBAL_SKILLS_DIR = { resolve: () => path.join(cursorHome(), 'skills') }
export const GLOBAL_COMMANDS_DIR = { resolve: () => path.join(cursorHome(), 'commands') }
export const GLOBAL_MCP_FILE = { resolve: () => path.join(cursorHome(), 'mcp.json') }
export const GLOBAL_HOOKS_FILE = { resolve: () => path.join(cursorHome(), 'hooks.json') }
export const GLOBAL_HOOKS_DIR = { resolve: () => path.join(cursorHome(), 'hooks') }
export const GLOBAL_BIN_DIR = { resolve: () => path.join(getHome(), '.local', 'bin') }
export const GLOBAL_STATE_ROOT = { resolve: () => path.join(cursorHome(), 'starterkit-state') }
export const GLOBAL_BACKUP_DIR = { resolve: () => path.join(cursorHome(), 'starterkit-state', 'backups') }
export const GLOBAL_INSTALL_LOG_DIR = { resolve: () => path.join(cursorHome(), 'starterkit-state', 'install-logs') }
export const GLOBAL_MANIFEST_DIR = { resolve: () => path.join(cursorHome(), 'starterkit-state', 'manifests') }

export const PROJECT_MEMORY_FILES = [
  'project.md',
  'state.md',
  'roadmap.md',
  'tech-stack.md',
  'user.md',
  'gotchas.md',
]

export const PROJECT_RULE_FILES = [
  'project-context.mdc',
]
