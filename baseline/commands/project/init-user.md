# Init User

Personalize Cursor for the current user.

## Collect

Ask (or infer from chat):
- Preferred language for communication
- Verbosity preference (concise / detailed)
- Default verification commands
- Git identity (name/email) if not set
- Any workflow constraints

## Write

Update `.cursor/memory/project/user.md` with the gathered preferences.
Do not touch global `~/.cursor/` config or git global config.
