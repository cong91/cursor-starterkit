---
name: systematic-debugging
description: Structured bug diagnosis starting from root cause. Use when fixing bugs, flaky tests, or unexpected behavior before applying patches.
---

# Systematic Debugging

## Phase 1: Reproduce

- Exact steps, environment, expected vs actual
- Capture logs, stack trace, failing test name

## Phase 2: Isolate

- Narrow to smallest failing case
- Binary search: when did it break? (`git bisect` if needed)

## Phase 3: Root cause

- Trace data/control flow to origin
- Distinguish symptom from cause

## Phase 4: Fix

- Minimal change at root cause
- Add regression test when appropriate

## Phase 5: Verify

- Re-run reproduction steps
- Run related test suite

Stop after two failed attempts on the same approach — report blocker with evidence.
