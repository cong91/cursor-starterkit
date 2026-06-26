# Audit

Audit the codebase or a subsystem for quality, security, or performance.

## Steps

1. Scope: which files/dirs to audit
2. Dimension: security / performance / correctness / dependencies
3. Gather evidence (grep, read, run analyzers if available)
4. Report findings by severity with `file:line`
5. Suggest the smallest credible fix per finding

Use the Security Review subagent for deep security audits, Bugbot for diff review.
