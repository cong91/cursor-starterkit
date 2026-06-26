# cursor-starterkit

<p align="center">
  Bootstrap Cursor IDE with a shared global baseline and a thin per-project <code>.cursor/</code> overlay — skills, slash commands, rules, MCP, hooks, SQLite memory, and beads task coordination.
</p>

<p align="center">
  <a href="#english">English</a> | <a href="#tiếng-việt">Tiếng Việt</a>
</p>

---

## English

### What this is

`cursor-starterkit` is **not** a copy of OpenCode. It is a Cursor-native installer that maps the same *ideas* (skills, commands, rules, MCP, memory, task coordination) onto **Cursor's real configuration surface**.

| Cursor surface | Global path | Project path |
| -------------- | ----------- | ------------ |
| **Skills** | `~/.cursor/skills/` | `.cursor/skills/` |
| **Slash commands** | `~/.cursor/commands/` | `.cursor/commands/` |
| **Rules** | — | `.cursor/rules/*.mdc` |
| **MCP** | `~/.cursor/mcp.json` | `.cursor/mcp.json` |
| **Hooks** | `~/.cursor/hooks.json` + `~/.cursor/hooks/scripts/` | `.cursor/hooks.json` |
| **Memory DB** | — | `.cursor/memory.db` (SQLite) |
| **Project memory** | — | `.cursor/memory/project/*.md` |
| **Beads tasks** | — | `.beads/` (via `br` CLI) |

OpenCode concepts that **do not** map to Cursor (TypeScript plugin API, `system.transform`, `message.part.updated`) are replaced with Cursor-native equivalents (hooks, MCP, rules). See [vs OpenCode](#vs-opencode-starterkit).

### Install (two layers)

#### 1. Global — once per machine

```bash
npx cursor-starterkit
# or after install:
cursor-starterkit install --yes
```

Installs into `~/.cursor/`:

- **23 skills** — verification, debugging, TDD, planning, memory-system, beads, prompt-leverage, deep-research, code-navigation, mockup-to-code, anti-ai-slop, accessibility-audit, playwright, chrome-devtools, context7, sequential-thinking, supabase, frontend-design, subagent-driven-development, receiving/requesting-code-review, context-management, incremental-implementation, writing-plans
- **21 slash commands** — `/pr`, `/research` (global) + `/init`, `/plan`, `/verify`, `/ship`, `/review`, `/debug`, `/br`, `/memory-search`, `/create`, `/start`, `/fix`, `/iterate`, `/ui-review`, `/audit`, `/handoff`, `/resume`, `/status`, `/init-user`, `/explore` (project)
- **7 MCP servers** — ripgrep, context7, sequential-thinking, playwright, chrome-devtools, supabase, **cursor-memory** (agent-autonomous memory retrieval)
- **4 hooks** — `sessionStart` (memory inject), `stop` (memory capture), `beforeShellExecution` (guard: curl|bash block + conventional commits), `beforeSubmitPrompt` (prompt-leverage upgrade)
- **Memory DB module** — `~/.cursor/memory-db/` (node:sqlite + TF-IDF distill + search CLI)
- **CLI shims** — `csk`, `cursor-starterkit` in `~/.local/bin/`
- Package copy at `~/.cursor/starterkit/`

Reload Cursor after install: **Ctrl+Shift+P → Reload Window**

#### 2. Project — per repository

```bash
cd your-project
csk install --yes
```

Creates:

- `.cursor/memory/project/*.md` — project context scaffold (6 files)
- `.cursor/memory/_templates/` — blank templates
- `.cursor/rules/` — `project-context.mdc` (alwaysApply), `workflow`, `verification`, `typescript`
- `.cursor/commands/` — 19 project slash commands
- `.cursor/mcp.json` — project MCP template (additive)
- `.beads/` — initialized if `br` CLI is on PATH

Flags: `--yes`, `--force-memory`, `--force-rules`

### Memory system (Cursor-native, two-way)

Cursor has **no built-in cross-session memory** (the "Memories" feature was removed in Cursor 2.1.x — only Rules persist). This starterkit adds memory two ways:

**1. Automatic context (every session):**
- hook `stop` reads `transcript_path` (Cursor's real field) → distills the full conversation via TF-IDF → stores observations in `.cursor/memory.db`
- hook `sessionStart` writes recent observations to `.cursor/memory/project/injected.md`
- rule `project-context.mdc` (`alwaysApply`) surfaces `injected.md` into context — Cursor does this automatically, no agent action needed

**2. Agent-autonomous retrieval (MCP):**
- `cursor-memory` MCP server exposes `memory_search`, `memory_recent`, `memory_remember`, `memory_stats`
- The agent calls these on its own when it needs past context — no manual `/memory-search`
- Memory stays local per-project (SQLite + FTS5), not cloud

Verified with a real Cursor transcript: 108 messages → 1 observation with actual conversation content; `memory_search "sqlite memory"` → FTS5 hit.

**Requirements:** Node ≥ 22 (for `node:sqlite`).

**Honest limitations:** distillation is heuristic TF-IDF (no LLM curator — Cursor doesn't expose an LLM-curate hook); transcripts have no timestamps (file-order only); inject is via markdown+rule, not direct system-prompt transform.

### Beads (task coordination)

`br` (beads_rust) is a standalone CLI, independent of Cursor. `csk install` detects it and runs `br init` if absent.

- `/br list`, `/br create "..."`, `/br reserve <id>`, `/br done <id>`
- Persistent, multi-session, dependencies, git-synced
- vs TodoWrite: use `br` when work spans sessions or has dependencies

Install `br` separately (see `beads` skill). The guard hook blocks pipe-to-shell, so download the install script first, inspect, then run.

### Daily workflow in Cursor

1. Open project with `.cursor/` overlay
2. Agent chat → type `/` for commands
3. `/init` → detect stack, fill memory
4. `/plan` → implement → `/verify` → `/ship`
5. Skills auto-suggest from descriptions; mention by name when needed
6. `/memory-search` to recall past decisions; `/br` for task tracking

### Development

```bash
cd cursor-starterkit
npm test          # 11 tests
npm run test:smoke
```

### vs OpenCode starterkit

| | OpenCode | Cursor starterkit |
| - | -------- | ----------------- |
| Config root | `~/.config/opencode/` | `~/.cursor/` |
| Rules | `AGENTS.md` | `.cursor/rules/*.mdc` |
| Commands | `command/*.md` | `commands/*.md` (slash `/`) |
| Plugins | TypeScript plugins (`@opencode-ai/plugin`) | Hooks (Node stdin/stdout JSON) |
| Memory | SQLite plugin + 4-tier pipeline + LLM curator | SQLite + TF-IDF distill + heuristic observations |
| Memory capture | per message-part (`message.part.updated`) | per session summary (hook `stop`) |
| Memory inject | `system.transform` into system prompt | markdown `injected.md` + `alwaysApply` rule |
| Session search | plugin reads OpenCode session DB | `/memory-search` over project memory DB |
| Guard / prompt upgrade | plugins (`guard.ts`, `prompt-leverage.ts`) | hooks (`guard.mjs`, `prompt-leverage.mjs`) |
| Beads | plugin `beads-bridge` + skill | skill `beads` + `/br` command + `br init` in installer |
| Requires `br` / beads | Yes | Optional (detected, not required) |
| MCP | `opencode.json` mcp block | `~/.cursor/mcp.json` (Cursor native) |

**Why not copy OpenCode's plugins**: Cursor does not expose OpenCode's plugin API (`message.part.updated`, `system.transform`, `messages.transform`). Those plugins cannot run in Cursor. The starterkit reimplements the equivalent behavior using Cursor's hook + MCP + rule surfaces.

---

## Tiếng Việt

### Đây là gì

`cursor-starterkit` **không** copy nguyên OpenCode. Đây là bộ cài đặt **dành riêng cho Cursor**, chuyển các ý tưởng (skill, command, rule, MCP, memory, beads) sang đúng cơ chế Cursor hỗ trợ.

### Cài đặt

**Máy (một lần):**

```bash
npx cursor-starterkit
```

Cài 23 skill, 21 slash command, 6 MCP, 4 hook, module memory SQLite vào `~/.cursor/`. Reload Cursor sau khi cài.

**Từng dự án:**

```bash
cd du-an-cua-ban
csk install --yes
```

Tạo `.cursor/` với memory, rules, slash commands, `.beads/` (nếu có `br`).

### Memory SQLite

- Lưu tại `.cursor/memory.db` (dùng `node:sqlite` built-in Node 22+, zero dependency)
- Hook `stop` capture + chưng cất TF-IDF → observations
- Hook `sessionStart` inject observations gần đây vào `injected.md`, rule `alwaysApply` đọc
- `/memory-search <query>` tìm FTS5

**Khác OpenCode**: capture theo tóm tắt session (Cursor hook không thấy từng message part); inject qua markdown+rule thay vì system prompt. Vẫn hơn không có.

### Beads

`br` CLI độc lập IDE. `csk install` phát hiện và `br init` nếu thiếu. Dùng `/br` cho task tracking đa session.

### Dùng hàng ngày

`/init` → `/plan` → code → `/verify` → `/ship`. `/memory-search` để nhớ quyết định cũ, `/br` cho task.

---

## License

MIT
