---
name: memory-system
description: >
  Project memory pipeline for Cursor: reads the real Cursor transcript
  (transcript_path) at session stop, distills via TF-IDF into SQLite
  observations, injects recent observations at session start. Searchable via
  /memory-search. Use when persisting decisions or recalling past context.
---

# Memory System (Cursor-native)

## Architecture — built on Cursor's real surfaces

| Stage | Cursor mechanism | What happens |
| ----- | ---------------- | ------------ |
| Capture | hook `stop` receives `transcript_path` | `memory-capture.mjs` reads the `.jsonl` transcript, extracts user+assistant+tool text |
| Distill | TF-IDF (ported heuristic, no LLM) | Top terms + key sentences → `distillations` row |
| Store | `.cursor/memory.db` (node:sqlite) | `temporal_messages` → `distillations` → `observations` (FTS5) |
| Inject | hook `sessionStart` | `memory-inject.mjs` writes recent observations to `.cursor/memory/project/injected.md` |
| Surface | rule `project-context.mdc` (alwaysApply) | Cursor reads `injected.md` into context |
| Search | `/memory-search <query>` | FTS5 over observations |

## Why this works (verified)

Cursor's `stop` hook payload (official docs) includes the common base field
`transcript_path` — the path to the conversation's `.jsonl` transcript. The
transcript schema (verified on live files):

```
{ "role":"user"|"assistant", "message":{ "content":[ {type:"text",text}, {type:"tool_use",name,input} ] } }
{ "type":"turn_ended", "status":"success" }
```

So the memory system reads the **real, full conversation** — not just metadata.

## What's captured

- Every user prompt and assistant text block
- Every tool call (name + compact input preview)
- Distilled into one observation per session (top TF-IDF term as title, key sentences as narrative, confidence by term count)

## Limitations (honest)

- No per-message timestamps in the transcript — ordering is file order only
- Distillation is heuristic (TF-IDF), no LLM curator like OpenCode's plugin could do via `system.transform`
- Inject is via markdown+rule, not direct system-prompt transform (Cursor doesn't expose that to hooks)
- `[REDACTED]` markers may appear in transcripts if Cursor or another hook redacts content

## How the agent uses memory (two paths)

**1. Automatic (every session):** hook `sessionStart` writes recent observations to `.cursor/memory/project/injected.md`; the `alwaysApply` rule `project-context.mdc` surfaces it into context. No agent action needed.

**2. Autonomous (agent decides):** the `cursor-memory` MCP server exposes tools `memory_search`, `memory_recent`, `memory_remember`, `memory_stats`. The agent calls these on its own when the user asks "what did we decide about X" or when it needs to recall past context — no manual `/memory-search` required. Memory stays local and per-project (SQLite, not cloud).

## Manual ops (still available)

- `/memory-search --recent` — latest observations
- `/memory-search "auth"` — FTS5 query
- `/session-search "login"` — raw transcript search across all Cursor sessions (broader coverage)
