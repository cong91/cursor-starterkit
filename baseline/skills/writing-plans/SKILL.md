---
name: writing-plans
description: Creates structured implementation plans with discovery, steps, and verification. Use when planning features, refactors, or multi-file work before coding.
---

# Writing Plans

## Plan structure

```markdown
## Discovery
[Substantive findings from code/docs — >100 chars]

## Goal
[Outcome in one sentence]

## Approach
[Primary path + effort S/M/L]

## Steps
1. [Verifiable slice]
2. ...

## Verification
- commands + acceptance criteria

## Risks / rollback
```

## Rules

- Discovery is mandatory — reject plans without it
- Prefer incremental slices that ship independently
- One primary recommendation
