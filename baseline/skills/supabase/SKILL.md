---
name: supabase
description: >
  Work with Supabase projects via the Supabase MCP. Use when querying/managing
  a Supabase database, running migrations, or generating TypeScript types.
---

# Supabase (MCP)

## When to use

- Run SQL against a Supabase project
- Inspect tables, extensions, migrations
- Generate TypeScript types from the schema
- Deploy/list edge functions

## Setup

Requires `SUPABASE_ACCESS_TOKEN` env var. The MCP server is configured in
`~/.cursor/mcp.json`; set the token via Cursor's env or shell.

## Rules

- Prefer `execute_sql` for read queries over UI
- For destructive operations (drop, truncate), confirm with the user first
- Follow the `supabase-postgres-best-practices` rules for SQL quality (indexes, RLS, partial indexes)
