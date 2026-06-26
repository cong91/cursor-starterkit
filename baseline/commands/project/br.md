# br

Run beads (br) task coordination. Passes `$ARGUMENTS` to `br`.

## Usage

- `/br list` — show open tasks
- `/br create "fix login bug"` — create a task
- `/br reserve <id>` — claim a task
- `/br done <id>` — complete a task
- `/br block <id> --reason "waiting on API"`

## Behavior

1. Check `br` is on PATH (`br --version`). If missing, tell the user how to install (see `beads` skill).
2. If `.beads/` does not exist in the project, run `br init` first.
3. Run `br $ARGUMENTS` and report output.
4. For `br done` / `br block`, also update `.cursor/memory/project/state.md` to reflect the new task state.

## When to suggest

The agent should suggest `/br` when the user describes work that spans sessions, has blockers/dependencies, or involves multiple coordinated tasks.
