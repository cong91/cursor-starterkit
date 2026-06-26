---
name: mockup-to-code
description: >
  Convert visual mockups (screenshots, Figma, descriptions) into production
  frontend code. Use when the user provides a design reference to implement.
---

# Mockup to Code

## Process

1. Identify the source: screenshot, Figma URL, or text description
2. Extract layout, typography, color, spacing, components
3. Match existing project design tokens if present (read tailwind config, theme files)
4. Implement with semantic HTML + accessible interactions
5. Verify visually when possible (browser screenshot via Playwright/chrome-devtools MCP)

## Rules

- Pixel-perfect is not the goal — match intent and hierarchy
- Use the project's existing component library, don't reinvent
- Responsive by default; check breakpoints
- Accessibility: focus states, alt text, semantic landmarks
