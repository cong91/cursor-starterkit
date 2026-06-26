---
name: anti-ai-slop
description: >
  Avoid generic AI design defaults (purple gradients, centered hero, emoji
  overload, "AI-powered" buzzwords). Use when building or reviewing UI to keep
  designs distinctive and human.
---

# Anti-AI-Slop

## Red flags

- Default purple/indigo gradient backgrounds
- Centered hero with one H1 + one subtitle + two CTAs
- Emoji as feature icons (🚀 ⚡ ✨)
- "AI-powered" / "next-generation" / "seamless" copy
- Rounded-2xl on everything
- Generic stock illustrations

## Fixes

- Pick a real aesthetic direction (editorial, brutalist, minimal, retro)
- Use a defined type scale and a real font pair
- Asymmetric layouts, intentional whitespace
- Custom SVG icons or a consistent icon set
- Concrete copy with specifics, not buzzwords

## Check

After building UI, screenshot it (Playwright/chrome-devtools MCP) and ask: "Could this be from any AI tool?" If yes, push further.
