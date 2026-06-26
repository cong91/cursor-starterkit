---
name: chrome-devtools
description: >
  Debug and profile web pages via chrome-devtools-mcp. Use for performance
  profiling, DOM/CSS inspection, runtime evaluation, and console monitoring.
---

# Chrome DevTools (MCP)

## When to use

- Profile a slow page (CPU profiling, performance trace)
- Inspect computed styles or DOM structure
- Evaluate JS in page context for debugging
- Monitor console logs and network during reproduction

## Flow

1. MCP server `chrome-devtools` provides CDP-backed tools
2. `navigate_page` / `new_page` to open target
3. `take_snapshot` for accessibility tree, `take_screenshot` for visual
4. `evaluate_script` for DOM-scoped queries
5. For profiling: `Profiler.enable` → `Profiler.start` → reproduce → `Profiler.stop` → read returned log file

## Rules

- Avoid `Input.*` CDP methods (focus-sensitive in Electron) — use the dedicated click/type tools
- Large responses save to files — read focused sections only
