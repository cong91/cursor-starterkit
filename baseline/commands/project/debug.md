# Debug

Systematic debugging — root cause first, not symptom patching.

## Process

1. **Reproduce** — exact steps, expected vs actual
2. **Gather evidence** — logs, stack traces, failing test output
3. **Hypothesis** — one likely cause
4. **Test hypothesis** — smallest change or experiment
5. **Fix** — minimal diff at root cause
6. **Verify** — run failing test/command again

## Rules

- Do not guess library APIs — read types or docs
- If two fix attempts fail, stop and report blocker with evidence
- Load the `systematic-debugging` skill for complex issues
