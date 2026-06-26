#!/usr/bin/env node
/**
 * Cursor hook: beforeShellExecution
 * Guardrails:
 *   1. Block pipe-to-shell: `curl ... | bash` / `wget ... | bash`
 *   2. Enforce Conventional Commits on `git commit -m`
 *
 * Cursor passes JSON on stdin: { command, ... }.
 * To block: exit non-zero with a JSON { error } on stdout, or write to stderr
 * and exit 2. We emit JSON and exit 2 on violation.
 */
import { readStdinJson } from './lib/stdin.mjs'

const CONVENTIONAL_RE = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-z0-9._/-]+\))?!?: .+/

async function main() {
  const input = await readStdinJson()
  const cmd = typeof input.command === 'string' ? input.command : ''
  if (!cmd) process.exit(0)

  // 1. pipe-to-shell blocker
  if (/(?:^|[;&|])\s*(?:curl|wget)\s.*\|\s*(?:ba)?sh/i.test(cmd)) {
    console.log(JSON.stringify({
      error: 'Blocked: detected pipe-to-shell pattern (curl/wget | bash). Download first, inspect, then run.',
    }))
    process.exit(2)
  }

  // 2. conventional commits
  if (/\bgit\s+commit\b/.test(cmd)) {
    const msgMatch = cmd.match(/(?:-m|--message=?)\s*"([^"]*)"/)
      ?? cmd.match(/(?:-m|--message=?)\s*'([^']*)'/)
      ?? cmd.match(/(?:-m|--message=?)\s+(\S+)/)
    const msg = msgMatch?.[1]
    if (!msg) {
      console.log(JSON.stringify({ error: 'Blocked: git commit missing -m message. Use: git commit -m "type(scope): subject"' }))
      process.exit(2)
    }
    if (!CONVENTIONAL_RE.test(msg)) {
      console.log(JSON.stringify({
        error: `Blocked: commit message not Conventional Commits compliant.\nGot: ${msg}\nExpected: <type>(scope): <subject>\nTypes: feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert`,
      }))
      process.exit(2)
    }
  }

  process.exit(0)
}

main().catch(() => process.exit(0))
