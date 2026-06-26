---
name: prompt-leverage
description: >
  Strengthen raw user prompts into execution-ready instruction sets before
  planning or execution. Adds objective, context, work style, tool rules,
  output contract, verification, and done criteria. A beforeSubmitPrompt hook
  applies this automatically; use this skill manually for complex prompts.
---

# Prompt Leverage

Upgrade the user's current prompt into a stronger instruction set without changing intent.

## Framework blocks (use selectively)

- `Objective`: task + success criteria
- `Context`: sources, files, constraints, unknowns
- `Work Style`: depth, breadth, care, first-principles
- `Tool Rules`: when tools/inspection are required
- `Output Contract`: structure, format, detail level
- `Verification`: correctness, edge cases, alternatives
- `Done Criteria`: when to stop

## Rules

- Preserve objective, constraints, tone
- Add missing structure, don't rewrite everything
- Keep proportional — don't over-specify simple tasks
- A hook (`beforeSubmitPrompt`) applies this automatically; this skill is for manual tuning or template extraction
