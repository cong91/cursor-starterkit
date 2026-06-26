---
name: code-navigation
description: >
  Find and understand code structure before editing. Use when exploring an
  unfamiliar codebase, locating symbols, or tracing call graphs.
---

# Code Navigation

## Strategies

1. **Glob** for files by name pattern (`**/*.ts`, `src/components/**`)
2. **Grep/ripgrep** for symbols and strings — prefer the ripgrep MCP for large repos
3. **SemanticSearch** for "how does X work" questions
4. **goToDefinition / findReferences** (LSP) for exact symbol locations

## Before editing

- Read the target file fully (or the relevant range)
- Check `findReferences` to understand impact
- Note shared files — coordinate if another agent might edit them

## Anti-pattern

- Editing a file you haven't read
- Searching once and assuming there's only one match
