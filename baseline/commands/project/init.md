---
description: Initialize Cursor project — install .cursor/ overlay + detect stack + create CLAUDE.md
argument-hint: "[--deep] [--force]"
agent: build
---

# Init: $ARGUMENTS

Initialize this project for Cursor in one step:
1. Install the `.cursor/` project overlay (memory, rules, commands, mcp) if missing
2. Detect the tech stack and validate commands
3. Create `CLAUDE.md` so Cursor picks up project context automatically
4. Update `.cursor/memory/project/` with detected facts

Run once per project, or re-run with `--force` to regenerate.

## Phase 1: Install `.cursor/` overlay

If `.cursor/memory/project/project.md` does **not** exist, install the overlay by running the starterkit's project installer. Determine the installed package root first:

```bash
# Prefer the globally installed shim's package copy
node -e "console.log(require('path').join(require('os').homedir(), '.cursor', 'starterkit', 'bin', 'csk.mjs'))"
```

If that file exists, run (non-interactive):

```bash
node "<package-root>/bin/csk.mjs" install --yes
```

If it does **not** exist (starterkit not installed globally yet), tell the user to run `npx cursor-starterkit` once globally, then re-run `/init`. Do **not** attempt to install globally from here.

If `--force` was passed, run `node "<package-root>/bin/csk.mjs" install --yes --force-memory --force-rules`.

After install, the following should exist: `.cursor/memory/project/*.md`, `.cursor/rules/*.mdc`, `.cursor/commands/*.md`, `.cursor/mcp.json`.

## Phase 2: Detect Project

Detect and validate:

- Package manager and dependencies (with versions)
- Build, test, lint, dev commands — **validate each actually works** by running it
- CI/CD configuration
- Existing AI rules (`.cursor/rules/`, `.cursorrules`, `.github/copilot-instructions.md`, existing `CLAUDE.md`, `AGENTS.md`)
- Top-level directory structure

With `--deep`: Also analyze git history, source patterns, subsystem candidates.

## Phase 3: Preview Detection

Show a summary and ask the user for confirmation before writing files. Use the question tool.

## Phase 4: Create CLAUDE.md

Create `./CLAUDE.md` — **target <80 lines** (max 200). Cursor reads `CLAUDE.md` automatically every session (same as `AGENTS.md`). Include:

- Tech stack with versions
- File structure overview
- Commands (validated — only include ones that actually work)
- Code example from actual codebase (5-10 lines)
- Testing conventions
- Boundaries (always / ask-first / never)
- Gotchas specific to this project

If an existing `CLAUDE.md` or `AGENTS.md` has substantial content, merge — don't overwrite blindly.

## Phase 5: Update Memory

Update `.cursor/memory/project/tech-stack.md` with the detected stack and **verified** command table.
Update `.cursor/memory/project/project.md` with project identity (name, type, purpose, key directories).

If beads (`br`) is on PATH and `.beads/` exists, also note the open task count in `state.md`.

## Completion

Report:
- What was installed (overlay files created)
- What `CLAUDE.md` contains (sections)
- Which commands were validated (with pass/fail)
- Suggested next slash commands: `/plan`, `/verify`, `/ship`, `/memory-search`
