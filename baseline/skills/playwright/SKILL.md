---
name: playwright
description: >
  Browser automation for testing and verification via @playwright/mcp. Use when
  verifying UI changes, running end-to-end tests, or taking screenshots of
  rendered pages.
---

# Playwright

## When to use

- Verify UI changes render correctly
- End-to-end test a user flow
- Screenshot a page for visual review
- Catch console errors during interaction

## Flow

1. MCP server `playwright` provides browser tools (navigate, snapshot, click, type, screenshot)
2. Navigate to the target URL (use a local dev server or stable URL)
3. Take a snapshot for accessibility tree + a screenshot for visual
4. Interact (click, type) and re-screenshot to verify
5. Check console for errors

## Rules

- Prefer the MCP tools over raw shell commands
- Don't repeat a failing action more than once without new evidence
- Report blockers (login, captcha) instead of improvising
