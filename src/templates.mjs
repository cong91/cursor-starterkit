import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { PROJECT_MEMORY_FILES } from './constants.mjs'

function toTitleCase(value) {
  return String(value || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase())
}

function detectPackageManager(cwd) {
  if (fs.existsSync(path.join(cwd, 'pnpm-lock.yaml'))) return 'pnpm'
  if (fs.existsSync(path.join(cwd, 'yarn.lock'))) return 'yarn'
  if (fs.existsSync(path.join(cwd, 'bun.lockb')) || fs.existsSync(path.join(cwd, 'bun.lock'))) return 'bun'
  if (fs.existsSync(path.join(cwd, 'package-lock.json'))) return 'npm'
  return null
}

function detectGitRemote(cwd) {
  const result = spawnSync('git', ['config', '--get', 'remote.origin.url'], { cwd, encoding: 'utf8' })
  if (result.status !== 0) return null
  return String(result.stdout || '').trim() || null
}

function detectCurrentBranch(cwd) {
  const result = spawnSync('git', ['branch', '--show-current'], { cwd, encoding: 'utf8' })
  if (result.status !== 0) return null
  return String(result.stdout || '').trim() || null
}

function readPackageJson(cwd) {
  const filePath = path.join(cwd, 'package.json')
  if (!fs.existsSync(filePath)) return null
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch {
    return null
  }
}

function detectProjectType({ packageJson }) {
  if (!packageJson) return 'generic repository'
  if (packageJson.bin) return 'CLI / tool project'
  if (packageJson.dependencies?.next) return 'Next.js application'
  if (packageJson.dependencies?.react || packageJson.devDependencies?.react) return 'React application'
  return 'Node.js / JavaScript project'
}

function detectPrimaryLanguage(cwd) {
  if (fs.existsSync(path.join(cwd, 'tsconfig.json'))) return 'TypeScript'
  if (fs.existsSync(path.join(cwd, 'pyproject.toml'))) return 'Python'
  if (fs.existsSync(path.join(cwd, 'Cargo.toml'))) return 'Rust'
  if (fs.existsSync(path.join(cwd, 'go.mod'))) return 'Go'
  if (fs.existsSync(path.join(cwd, 'package.json'))) return 'JavaScript / TypeScript'
  return 'Mixed / unknown'
}

function collectProjectContext({ cwd }) {
  const packageJson = readPackageJson(cwd)
  const repoName = packageJson?.name || path.basename(cwd)
  return {
    cwd,
    repoName,
    displayName: toTitleCase(repoName),
    packageJson,
    packageManager: detectPackageManager(cwd),
    remote: detectGitRemote(cwd),
    branch: detectCurrentBranch(cwd),
    projectType: detectProjectType({ packageJson }),
    primaryLanguage: detectPrimaryLanguage(cwd),
    installedAt: new Date().toISOString().slice(0, 10),
  }
}

function renderScriptsBlock({ packageJson, packageManager }) {
  if (!packageJson?.scripts) return '_No package.json scripts detected._'
  const pm = packageManager || 'npm'
  const lines = Object.entries(packageJson.scripts).map(([name, cmd]) => `- \`${name}\`: \`${pm} run ${name}\` → \`${cmd}\``)
  return lines.join('\n')
}

export function renderProjectMemoryFiles({ cwd }) {
  const ctx = collectProjectContext({ cwd })
  const scripts = renderScriptsBlock(ctx)

  return {
    'project.md': `# ${ctx.displayName}

## Overview

- **Type:** ${ctx.projectType}
- **Language:** ${ctx.primaryLanguage}
- **Package manager:** ${ctx.packageManager || 'unknown'}
- **Remote:** ${ctx.remote || 'none'}
- **Branch:** ${ctx.branch || 'unknown'}
- **Initialized:** ${ctx.installedAt} via cursor-starterkit

## Purpose

Describe what this project does and who it serves.

## Key directories

_List important folders and what lives in each._

`,

    'state.md': `# Project State

_Last updated: ${ctx.installedAt}_

## Current focus

_What are we building or fixing right now?_

## Blockers

_None yet._

## Recent decisions

- Initialized Cursor project overlay with cursor-starterkit

`,

    'roadmap.md': `# Roadmap

## Now

- [ ] Fill in project purpose in \`project.md\`
- [ ] Run \`/init\` in Cursor to refine tech stack detection

## Next

- [ ] Define milestones

## Later

- [ ] _

`,

    'tech-stack.md': `# Tech Stack

## Runtime

- **Project type:** ${ctx.projectType}
- **Primary language:** ${ctx.primaryLanguage}
- **Package manager:** ${ctx.packageManager || 'unknown'}

## Scripts

${scripts}

## Verification commands

| Check | Command |
| ----- | ------- |
| Typecheck | _detect from package.json_ |
| Lint | _detect from package.json_ |
| Test | _detect from package.json_ |

_Update after running \`/init\`._

`,

    'user.md': `# User Preferences

## Communication

- Language: _your preference_
- Verbosity: concise, evidence-based

## Workflow

- Verify before claiming completion
- Prefer minimal diffs
- Ask before destructive git operations

`,

    'gotchas.md': `# Gotchas

Project-specific footguns, env quirks, and warnings.

## Environment

- _

## Dependencies

- _

`,

    'project-context.mdc': `---
description: Project-specific context from memory files
alwaysApply: true
---

# Project Context

Read these files for project-specific guidance:

- \`.cursor/memory/project/project.md\` — purpose and structure
- \`.cursor/memory/project/tech-stack.md\` — stack and verification commands
- \`.cursor/memory/project/state.md\` — current focus
- \`.cursor/memory/project/user.md\` — user preferences
- \`.cursor/memory/project/gotchas.md\` — footguns
- \`.cursor/memory/project/injected.md\` — recent memory observations (auto-generated by sessionStart hook)

When instructions conflict, newer user messages win.
`,
  }
}
