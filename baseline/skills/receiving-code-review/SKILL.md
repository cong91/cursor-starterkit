---
name: receiving-code-review
description: >
  Process incoming code review feedback: triage severity, fix real bugs first,
  push back on subjective style with rationale. Use when reviewing a PR or
  responding to reviewer comments.
---

# Receiving Code Review

## Triage

1. **Bugs / regressions** — fix first, cite the fix
2. **Security** — fix, reference the threat
3. **Tests** — add coverage if the gap is real
4. **Style / naming** — apply if it matches project conventions; push back with rationale otherwise
5. **Nitpicks** — apply only if cheap; don't block merge

## Responding

- Acknowledge each comment (resolved / won't fix / needs discussion)
- For "won't fix", give a concrete reason
- For fixes, link the commit that addresses it
- Don't argue tone — focus on the technical substance
