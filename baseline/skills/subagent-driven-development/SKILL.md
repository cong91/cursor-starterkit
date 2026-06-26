---
name: subagent-driven-development
description: >
  Delegate large or parallel work to Task subagents. Use when work spans
  multiple independent files, needs parallel exploration, or one part blocks
  another.
---

# Subagent-Driven Development

## When to parallelize

- 3+ independent tasks with no shared files
- Reads/searches (always independent)
- Writes to disjoint files

## When to serialize

- Edits to the same file — order them explicitly
- Shared contract changes (types, schema, public API) — downstream waits
- Chained transforms (B needs A's output)

## Distrust protocol

Subagent self-reports are ~50% accurate. After every Task:
1. Read changed files directly (`git diff` or Read)
2. Run verification (typecheck + lint minimum)
3. Compare against the original spec, not the agent's claims
4. Check files outside scope weren't touched

## Dispatch

Use `Task` tool with `subagent_type` matching the work (`explore`, `generalPurpose`, etc.). Give a detailed prompt; for large context, write a context file and reference its path.
