# Review

Review code changes for bugs, security, and regressions before style.

## Focus order

1. **Bugs** — logic errors, edge cases, race conditions
2. **Security** — injection, auth, secrets in code
3. **Regressions** — broken contracts, missing error handling
4. **Tests** — meaningful coverage of changed behavior
5. **Style** — only after the above

## Output format

- 🔴 **Critical** — must fix
- 🟡 **Suggestion** — consider improving
- 🟢 **Nice to have** — optional

Cite `file:line` for non-trivial findings. Use the Bugbot or Security Review subagent for thorough diff review when the user wants deep analysis.
