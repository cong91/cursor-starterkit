#!/usr/bin/env node
/**
 * Cursor Starterkit — Memory MCP Server (stdio)
 *
 * Exposes the project memory SQLite store to Cursor's agent as MCP tools, so
 * the agent can autonomously search and store memory without the user having
 * to run /memory-search manually.
 *
 * Tools:
 *   - memory_search   : FTS5 search observations by query
 *   - memory_recent   : most recent observations
 *   - memory_remember : store a new observation (type, title, narrative, confidence)
 *   - memory_stats    : row counts for the memory DB
 *
 * The project root is resolved from the CURSOR_WORKSPACE_ROOT env var that
 * Cursor sets for MCP servers, falling back to process.cwd().
 *
 * Protocol: JSON-RPC over stdio, newline-delimited (MCP stdio transport,
 * spec 2025-06-18). No deps — pure Node.
 */

import { resolveMemoryDbPath, openMemoryDb, searchObservations, recentObservations, storeObservation, dbStats, closeMemoryDb } from './memory-db.mjs'

const PROTOCOL_VERSION = '2025-06-18'
const SERVER_NAME = 'cursor-starterkit-memory'
const SERVER_VERSION = '1.0.0'

function projectRoot() {
  return process.env.CURSOR_WORKSPACE_ROOT || process.env.CURSOR_CWD || process.cwd()
}

function send(msg) {
  process.stdout.write(`${JSON.stringify(msg)}\n`)
}

function errorResponse(id, code, message) {
  return { jsonrpc: '2.0', id, error: { code, message } }
}

function resultResponse(id, result) {
  return { jsonrpc: '2.0', id, result }
}

const TOOLS = [
  {
    name: 'memory_search',
    description: 'Search project memory observations by keyword (FTS5). Use when the user asks "what did we decide about X" or to recall past decisions/context from earlier sessions.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (multiple words = AND)' },
        limit: { type: 'number', description: 'Max results (default 8, max 20)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'memory_recent',
    description: 'List the most recent memory observations for this project. Use at session start to recall recent context.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max results (default 12, max 50)' },
      },
    },
  },
  {
    name: 'memory_remember',
    description: 'Store a new observation into project memory. Use when a durable decision, architectural choice, or important fact is established that should persist across sessions.',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Observation type: decision | fact | pattern | gotcha | session' },
        title: { type: 'string', description: 'Short title' },
        narrative: { type: 'string', description: 'Full description / context' },
        confidence: { type: 'number', description: '0.0-1.0 (default 0.7)' },
      },
      required: ['type', 'title', 'narrative'],
    },
  },
  {
    name: 'memory_stats',
    description: 'Return row counts for the project memory DB (temporal_messages, distillations, observations).',
    inputSchema: { type: 'object', properties: {} },
  },
]

function withDb(fn) {
  const dbPath = resolveMemoryDbPath(projectRoot())
  let db
  try {
    db = openMemoryDb(dbPath)
  } catch (err) {
    return { error: `Cannot open memory DB at ${dbPath}: ${err.message}. Run a session to completion first (stop hook populates it).` }
  }
  try {
    return fn(db)
  } finally {
    try { db.close() } catch {}
  }
}

function handleToolCall(name, args) {
  switch (name) {
    case 'memory_search': {
      const query = String(args?.query || '').trim()
      if (!query) return { content: [{ type: 'text', text: 'Error: query is required' }], isError: true }
      const limit = Math.min(Number(args?.limit) || 8, 20)
      return withDb((db) => {
        const rows = searchObservations(db, query, limit)
        return {
          content: [{ type: 'text', text: JSON.stringify({ query, count: rows.length, results: rows }, null, 2) }],
        }
      })
    }
    case 'memory_recent': {
      const limit = Math.min(Number(args?.limit) || 12, 50)
      return withDb((db) => {
        const rows = recentObservations(db, limit)
        return {
          content: [{ type: 'text', text: JSON.stringify({ count: rows.length, results: rows }, null, 2) }],
        }
      })
    }
    case 'memory_remember': {
      const type = String(args?.type || 'fact').trim()
      const title = String(args?.title || '').trim()
      const narrative = String(args?.narrative || '').trim()
      if (!title || !narrative) return { content: [{ type: 'text', text: 'Error: title and narrative required' }], isError: true }
      const confidence = Math.max(0, Math.min(1, Number(args?.confidence) || 0.7))
      return withDb((db) => {
        const id = storeObservation(db, { type, title, narrative, confidence })
        return { content: [{ type: 'text', text: JSON.stringify({ stored: true, id, type, title }) }] }
      })
    }
    case 'memory_stats': {
      return withDb((db) => {
        const stats = dbStats(db)
        return { content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }] }
      })
    }
    default:
      return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true }
  }
}

async function handleMessage(msg) {
  const { jsonrpc, id, method, params } = msg

  if (method === 'initialize') {
    return send(resultResponse(id, {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: { tools: {} },
      serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
    }))
  }

  if (method === 'notifications/initialized') {
    return // notification — no response
  }

  if (method === 'tools/list') {
    return send(resultResponse(id, { tools: TOOLS }))
  }

  if (method === 'tools/call') {
    const toolName = params?.name
    const args = params?.arguments || {}
    const result = handleToolCall(toolName, args)
    return send(resultResponse(id, result))
  }

  if (method === 'ping') {
    return send(resultResponse(id, {}))
  }

  // Unknown method
  if (id !== undefined) {
    return send(errorResponse(id, -32601, `Method not found: ${method}`))
  }
}

async function main() {
  let buf = ''
  for await (const chunk of process.stdin) {
    buf += chunk.toString('utf8')
    let nl
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).trim()
      buf = buf.slice(nl + 1)
      if (!line) continue
      let msg
      try {
        msg = JSON.parse(line)
      } catch (err) {
        process.stderr.write(`[memory-mcp] invalid JSON: ${err.message}\n`)
        continue
      }
      try {
        await handleMessage(msg)
      } catch (err) {
        process.stderr.write(`[memory-mcp] handler error: ${err.message}\n`)
        if (msg.id !== undefined) send(errorResponse(msg.id, -32603, err.message))
      }
    }
  }
}

main().catch((err) => {
  process.stderr.write(`[memory-mcp] fatal: ${err.message}\n`)
  process.exit(1)
})
