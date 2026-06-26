# memory-search

Search the project memory SQLite database for past observations.

## Usage

- `/memory-search <query>` — FTS5 search observations by keyword
- `/memory-search --recent` — show most recent observations

## Behavior

1. Run `node ~/.cursor/starterkit/baseline/memory-db/memory-search.mjs "<query>" --cwd <project>` (or `--recent`).
2. If "no memory DB yet", explain that memory populates after session end (hook `stop` captures + distills).
3. Present results as a short list: title, type, confidence, narrative snippet.
4. Use results to ground current work in past decisions.

## When to use

- User asks "what did we decide about X"
- Starting a session on a long-running project
- Resuming work after a gap
