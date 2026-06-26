# Plan

Create an implementation plan before coding non-trivial work.

## When to use

- New features spanning multiple files
- Refactors with trade-offs
- Anything where approach is not obvious

## Output format

```markdown
## Goal
[One sentence]

## Discovery
[What you read/searched — substantive, not boilerplate]

## Approach
[Primary recommendation + effort signal S/M/L]

## Steps
1. [Verifiable step]
2. ...

## Verification
- [ ] command to run
- [ ] acceptance criteria

## Risks
- [What could go wrong]
```

## Rules

- Read relevant code before planning
- One primary recommendation; at most one alternative
- Each step should be independently verifiable
- Do not start implementation until the user confirms (unless they said "plan and build")
