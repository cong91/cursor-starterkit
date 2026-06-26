---
name: context7
description: >
  Look up current library/framework documentation via Context7 MCP. Use before
  writing code against an unfamiliar or recently-updated library API to avoid
  guessing method signatures.
---

# Context7

## When to use

- Writing code against a library you're not certain about
- Library API may have changed between versions
- User names a specific product/SDK version

## Flow

1. Call the `context7` MCP to resolve the library
2. Fetch the relevant docs section
3. Use the verified API surface in your code
4. Cite the doc source if the user asks why

## Rule

Never guess library method signatures or options — verify via Context7 or type definitions first.
