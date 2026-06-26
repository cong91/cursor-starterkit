---
name: incremental-implementation
description: Breaks large work into small verifiable slices that ship working code at each step. Use for multi-step features or refactors.
---

# Incremental Implementation

## Slice criteria

Each slice must:
- Leave the repo in a working state
- Be verifiable on its own
- Touch the smallest surface that delivers value

## Loop

1. Pick next slice from plan
2. Implement
3. Verify (typecheck/lint/test as applicable)
4. Commit only if user asked
5. Repeat

## Anti-patterns

- Big-bang refactors without intermediate green states
- Multiple unrelated changes in one slice
