# Fix

Fix a reported bug or failing test.

## Steps

1. Reproduce — exact steps, expected vs actual
2. Gather evidence — logs, stack trace, failing test output
3. Load `systematic-debugging` skill
4. Hypothesize one root cause
5. Smallest fix at root cause
6. Re-run reproduction — confirm green
7. Add regression test if applicable

If two attempts fail, stop and report the blocker with evidence.
