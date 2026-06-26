---
name: accessibility-audit
description: >
  Audit UI for accessibility (WCAG): keyboard, screen reader, contrast, focus,
  semantics. Use when reviewing UI or the user asks for an a11y check.
---

# Accessibility Audit

## Checklist

- [ ] Keyboard: every interactive element reachable + operable via Tab/Enter/Space
- [ ] Focus visible on every focusable element
- [ ] Semantic landmarks: header, nav, main, footer, aside
- [ ] Headings hierarchical (h1 → h2 → h3, no skips)
- [ ] Images have alt text (decorative → alt="")
- [ ] Form labels associated with inputs
- [ ] Color contrast ≥ 4.5:1 for text (WCAG AA)
- [ ] No motion without prefers-reduced-motion fallback
- [ ] ARIA only where semantics are missing — don't add redundant roles

## Tools

- Browser DevTools (Lighthouse / Accessibility panel)
- axe-core via Playwright/chrome-devtools MCP for automated scan
- Manual keyboard walk-through for things automation misses
