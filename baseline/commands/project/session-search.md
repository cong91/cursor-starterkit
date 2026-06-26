# session-search

Search across ALL Cursor session transcripts for this machine.

## Usage

- `/session-search <query>` — full-text search conversation transcripts
- `/session-search --list` — list recent conversations

## Behavior

Run `node ~/.cursor/starterkit/baseline/memory-db/session-search.mjs "<query>"` (or `--list`).

Unlike `/memory-search` (queries the distilled memory DB), this reads the raw
Cursor transcript `.jsonl` files at `~/.cursor/projects/*/agent-transcripts/*`
directly. Returns conversationId, project, mtime, and matching snippets.

## When to use

- "What did we discuss about X in a previous chat?"
- Recalling a decision from a different session/project
- `/memory-search` returns nothing but you remember the conversation

## vs /memory-search

| | /memory-search | /session-search |
| - | --------------- | --------------- |
| Source | memory.db (distilled) | transcript .jsonl (raw) |
| Granularity | observations | full conversation text |
| Speed | FTS5 fast | reads files, slower |
| Coverage | only sessions where stop hook ran | every Cursor session on disk |
