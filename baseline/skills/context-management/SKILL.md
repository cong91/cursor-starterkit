---
name: context-management
description: Manages context health in long sessions — when to compress, summarize, and hand off. Use in long tasks or when context pressure is high.
---

# Context Management

## Signals to compress

- Completed phases with no pending work from that phase
- Repeated file contents already summarized
- Tool output no longer needed for active edits

## Handoff

When ending a long session, write to `.cursor/memory/project/state.md`:
- Current focus
- Decisions made
- Next steps
- Blockers

## Rules

- Keep active files high-signal
- Do not re-read large files unnecessarily
- Prefer targeted grep/search over full-file dumps
