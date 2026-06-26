# cursor-starterkit

<p align="center">
  One-command setup that turns Cursor into a fully-configured AI coding workstation — skills, slash commands, rules, MCP servers, hooks, project memory, and task tracking, all wired into Cursor's native config surface.
</p>

<p align="center">
  <a href="#install">Install</a> · <a href="#what-you-get">What you get</a> · <a href="#daily-workflow">Daily workflow</a> · <a href="#memory">Memory</a> · <a href="#tiếng-việt">Tiếng Việt</a>
</p>

---

## Install

### 1. Set up your machine (once)

```bash
npx cursor-starterkit
```

That single command installs everything into `~/.cursor/`:

- **23 skills** the agent loads on demand
- **22 slash commands** you trigger by typing `/` in Agent chat
- **7 MCP servers** (ripgrep, context7, sequential-thinking, playwright, chrome-devtools, supabase, and `cursor-memory` for agent-driven recall)
- **3 hooks** (memory capture/inject, and a guard that blocks `curl | bash` and enforces Conventional Commits)
- **Memory engine** — SQLite + TF-IDF distillation, zero dependencies
- **CLI shims** `csk` and `cursor-starterkit` on your PATH

After it finishes, reload Cursor so the new MCP servers and hooks are picked up:

> **Ctrl+Shift+P → Reload Window**

### 2. Set up a project (from inside Cursor)

Open any project in Cursor, then in the Agent chat type:

```
/init
```

The agent runs the installer for you — it scaffolds the `.cursor/` overlay (project memory, rules, slash commands, MCP config), detects your tech stack, validates your build/test/lint commands, and writes a `CLAUDE.md` so Cursor automatically loads project context on every session. No terminal needed.

Prefer the terminal? You can also run:

```bash
cd your-project
csk install --yes
```

Flags: `--yes` (non-interactive), `--force-memory` (regenerate memory files), `--force-rules` (regenerate rules).

---

## What you get

After install, Cursor reads from these native locations:

| Capability | Global (all projects) | Per project |
| ---------- | --------------------- | ----------- |
| Skills | `~/.cursor/skills/` | `.cursor/skills/` |
| Slash commands | `~/.cursor/commands/` | `.cursor/commands/` |
| Rules | — | `.cursor/rules/*.mdc` |
| MCP servers | `~/.cursor/mcp.json` | `.cursor/mcp.json` |
| Hooks | `~/.cursor/hooks.json` + `~/.cursor/hooks/scripts/` | `.cursor/hooks.json` |
| Project memory | — | `.cursor/memory/project/*.md` |
| Memory database | — | `.cursor/memory.db` (SQLite) |
| Task tracking | — | `.beads/` (via `br` CLI) |

### Skills (23)

Loaded by the agent when the task matches the skill description:

`verification-before-completion` · `systematic-debugging` · `test-driven-development` · `writing-plans` · `incremental-implementation` · `requesting-code-review` · `receiving-code-review` · `memory-system` · `beads` · `prompt-leverage` · `deep-research` · `code-navigation` · `mockup-to-code` · `anti-ai-slop` · `accessibility-audit` · `playwright` · `chrome-devtools` · `context7` · `sequential-thinking` · `supabase` · `frontend-design` · `subagent-driven-development` · `context-management`

### Slash commands (22)

Type `/` in Agent chat:

**Global:** `/pr` · `/research`

**Project:** `/init` · `/plan` · `/verify` · `/ship` · `/review` · `/debug` · `/fix` · `/iterate` · `/create` · `/start` · `/ui-review` · `/audit` · `/handoff` · `/resume` · `/status` · `/explore` · `/init-user` · `/br` · `/memory-search` · `/session-search`

### MCP servers (7)

| Server | Use |
| ------ | --- |
| `cursor-memory` | Agent searches and stores project memory autonomously |
| `ripgrep` | Fast code search across large repos |
| `context7` | Look up current library/framework docs before writing code |
| `sequential-thinking` | Step-by-step reasoning for complex problems |
| `playwright` | Browser automation, screenshots, E2E tests |
| `chrome-devtools` | Page inspection, profiling, runtime evaluation |
| `supabase` | Run SQL, manage migrations, generate TypeScript types (needs `SUPABASE_ACCESS_TOKEN`) |

MCP is merged additively into `~/.cursor/mcp.json` — your existing servers are never overwritten.

### Hooks (3)

| Event | What it does |
| ----- | ------------ |
| `sessionStart` | Injects recent memory observations into context |
| `stop` | Reads the session transcript, distills it, stores an observation |
| `beforeShellExecution` | Blocks `curl | bash` / `wget | bash`; enforces Conventional Commits on `git commit` |

---

## Daily workflow

1. **Open a project** in Cursor.
2. **Type `/init`** in Agent chat — installs the `.cursor/` overlay, detects your stack, writes `CLAUDE.md`.
3. **Plan the work:** `/plan` to scope the change.
4. **Implement:** let the agent code; it loads skills as needed.
5. **Verify:** `/verify` runs your typecheck/lint/test and reports pass/fail with evidence.
6. **Ship:** `/ship` summarizes the diff and prepares a commit/PR.
7. **Recall past decisions:** `/memory-search "auth"` or just ask "what did we decide about auth?" — the agent queries memory via MCP automatically.

### Task tracking with beads

For work that spans multiple sessions or has dependencies, use `/br`:

```
/br create "refactor auth module"
/br reserve <id>
/br done <id>
```

`br` (beads_rust) is a standalone CLI. `csk install` detects it and initializes `.beads/` automatically. If it's not installed, the starterkit tells you how to add it. Use TodoWrite for single-session linear work, and `br` for anything you need to remember next week.

---

## Memory

Cursor does not persist conversation memory across sessions on its own — each new chat starts fresh, and the built-in "Memories" feature was removed in Cursor 2.1.x. This starterkit gives every project a durable memory layer that works two ways:

### 1. Automatic — every session, no action needed

- When a session ends, the `stop` hook reads Cursor's transcript file (`transcript_path`) and distills the full conversation into a memory observation using TF-IDF.
- When the next session starts, the `sessionStart` hook writes the latest observations into `.cursor/memory/project/injected.md`.
- A rule (`alwaysApply`) tells Cursor to load that file into context automatically.

### 2. Agent-driven — the agent queries memory when it needs to

The `cursor-memory` MCP server exposes four tools the agent calls on its own:

- `memory_search` — FTS5 keyword search across observations
- `memory_recent` — latest observations
- `memory_remember` — store a new decision or fact
- `memory_stats` — database row counts

So when you ask "what did we decide about the auth approach?", the agent runs `memory_search "auth"` without you touching anything.

Memory is stored locally per project in `.cursor/memory.db` (SQLite, FTS5-indexed). Nothing leaves your machine.

**Requirements:** Node ≥ 22 (uses the built-in `node:sqlite`).

**Honest limits:** distillation is heuristic TF-IDF (no LLM curator, because Cursor does not expose an LLM-curation hook); transcripts carry no timestamps so ordering is by file order; context injection is via a markdown file + rule rather than a direct system-prompt transform.

---

## Development

```bash
git clone git@github.com:cong91/cursor-starterkit.git
cd cursor-starterkit
npm test            # 11 tests
npm run test:smoke  # both CLI bins --help
```

Publishing is automated: pushing a `v*` tag runs the GitHub Action (`npm test` → smoke → `npm publish` with `NPM_TOKEN`). See `.github/workflows/publish.yml`.

---

## Tiếng Việt

### Cài đặt

**Máy (một lần):**

```bash
npx cursor-starterkit
```

Cài 23 skill, 22 slash command, 7 MCP, 3 hook, engine memory SQLite vào `~/.cursor/`. Sau khi cài xong, reload Cursor (Ctrl+Shift+P → Reload Window).

**Mỗi project (từ trong Cursor):**

Mở project trong Cursor, gõ trong Agent chat:

```
/init
```

Agent tự cài `.cursor/` overlay (memory, rules, slash commands, MCP), phát hiện tech stack, validate lệnh build/test/lint, và tạo `CLAUDE.md` để Cursor tự nạp context mỗi session. Không cần mở terminal.

### Dùng hàng ngày

1. `/init` — cài project + phát hiện stack + tạo CLAUDE.md
2. `/plan` — lập kế hoạch
3. Code — agent tự load skill khi cần
4. `/verify` — chạy typecheck/lint/test, báo pass/fail có bằng chứng
5. `/ship` — tóm tắt diff, chuẩn bị commit/PR
6. Hỏi "quyết định về auth là gì?" — agent tự query memory qua MCP

### Memory

- **Tự động mỗi session:** hook `stop` chưng cất transcript → observation; hook `sessionStart` inject observation gần đây vào context qua rule `alwaysApply`.
- **Agent tự query:** MCP `cursor-memory` cho agent 4 tool (`memory_search`, `memory_recent`, `memory_remember`, `memory_stats`) — agent tự gọi khi cần nhớ lại quyết định cũ.
- Lưu local per-project ở `.cursor/memory.db` (SQLite + FTS5), không lên cloud.
- Yêu cầu Node ≥ 22.

### Task tracking

`/br create "..."`, `/br reserve <id>`, `/br done <id>` — cho công việc đa session có dependency. `csk install` tự phát hiện `br` và init `.beads/`.

---

## License

MIT
