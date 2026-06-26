# Ship

Finish a feature branch: verify, summarize, prepare for merge.

## Checklist

- [ ] Run `/verify` or equivalent checks — all green
- [ ] Review diff — scope matches the task, no unrelated changes
- [ ] Update `.cursor/memory/project/state.md` if focus shifted
- [ ] Summarize changes: what, why, files, verification evidence

## If user wants a PR

Follow creating-pull-requests workflow:
- `git status`, `git diff`, `git log` vs base branch
- Push with `-u` if needed
- `gh pr create` with summary + test plan

## If user wants a commit

Only commit when explicitly requested. Stage specific files, not `git add .`.
