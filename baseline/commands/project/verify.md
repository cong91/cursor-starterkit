# Verify

Run verification before claiming work is complete.

## Steps

1. Read `.cursor/memory/project/tech-stack.md` for project verification commands
2. If missing, detect from `package.json` / `pyproject.toml` / `Makefile`
3. Run applicable checks in order:
   - typecheck
   - lint
   - test
   - build (if changed build paths)
4. Report each command with pass/fail and relevant output counts

## Output

Lead with status:
- **PASS** — all checks green, cite counts
- **FAIL** — first failure with file:line if available
- **BLOCKED** — what is missing to run checks

Do not commit or open PRs unless the user explicitly asked and checks pass.
