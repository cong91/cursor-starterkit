---
name: test-driven-development
description: Write failing tests first, then minimal implementation. Use when adding features, fixing bugs with regression risk, or when the user asks for TDD.
---

# Test-Driven Development

## Red → Green → Refactor

1. **Red** — write a failing test for the desired behavior
2. **Green** — smallest code change to pass
3. **Refactor** — clean up with tests still green

## Rules

- One behavior per test
- Test real behavior, not implementation details
- Do not skip red — see the failure before implementing
- Run tests after each step

## When not to use

- Exploratory spikes (throwaway code)
- Pure config/doc changes with no test harness
