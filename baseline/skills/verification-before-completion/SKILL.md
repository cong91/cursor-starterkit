---
name: verification-before-completion
description: Requires running verification commands and confirming output before claiming work is complete, fixed, or passing. Use before commits, PRs, or completion status updates.
---

# Verification Before Completion

## Iron law

No completion claims without fresh verification evidence in the current turn.

## Gate

1. IDENTIFY — command that proves the claim
2. RUN — full command, fresh
3. READ — output, exit code, failure count
4. VERIFY — output matches claim
5. THEN — state claim with evidence

## Common failures

| Claim | Not sufficient |
| ----- | -------------- |
| Tests pass | Previous run, "should pass" |
| Lint clean | Partial file check |
| Agent succeeded | Agent self-report without reading diff |
