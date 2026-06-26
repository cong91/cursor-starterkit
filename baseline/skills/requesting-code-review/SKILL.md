---
name: requesting-code-review
description: Prepares and requests code review with context, diff summary, and areas of concern. Use before merge or when the user asks for review prep.
---

# Requesting Code Review

## Prepare

1. Run verification — all green
2. Review own diff — remove debug code, scope creep
3. Summarize: what, why, how to test

## Request template

```markdown
## Summary
- [change 1]
- [change 2]

## Test plan
- [ ] step

## Areas for reviewer focus
- [risky area]
```

Use Bugbot subagent or `/review` for automated pre-merge review.
