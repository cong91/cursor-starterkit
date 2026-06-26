---
name: beads
description: >
  Multi-agent task coordination using br (beads_rust) CLI. Use when work spans
  multiple sessions, has dependencies, needs file locking, or requires agent
  coordination. Covers claim/reserve/done cycle, dependency management, and
  hierarchical decomposition.
---

# Beads — Multi-Agent Task Coordination

> Replaces ad-hoc task tracking that loses state between sessions.

## When to Use

- Work spans multiple sessions with dependencies or blockers
- Multiple agents editing the same codebase
- Need persistent task state across handoffs

## When NOT to Use

- Single-session, linear tasks → use TodoWrite
- Quick changes with no dependencies

## Setup

`br` (beads_rust) is a standalone CLI, independent of Cursor. Install separately:

- Unix: `curl -fsSL https://raw.githubusercontent.com/nicobailon/beads_rust/main/install.sh | bash` (download first, inspect, then run — guard hook blocks pipe-to-shell)
- Windows: download `br.exe` and add to PATH

Verify: `br --version`

In a project, run `br init` (or `csk install` does it if `br` is present) to create `.beads/`.

## Core Cycle

```
br create "<task>"     # create an issue
br list                # see open issues
br show <id>           # inspect a task
br reserve <id>        # claim ownership
br done <id>           # mark complete
br block <id> --reason # mark blocked
```

## Dependencies

```
br create "refactor auth" --depends-on <id>
br reserve <id>          # cannot start until dependency done
```

## Session Protocol

At session start: `br list` to see what's open and reserved by you.
At session end: `br done <id>` for completed work, or `br block <id> --reason "..."` if stuck.

## vs TodoWrite

- `br`: persistent, multi-session, dependencies, file-backed, git-synced
- TodoWrite: in-conversation, linear, ephemeral

Rule: "Will I need this in 2 weeks?" → YES = br.
