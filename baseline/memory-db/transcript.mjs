/**
 * Cursor transcript reader — parses Cursor's real session transcript format.
 *
 * Cursor stores conversations as JSONL at a path provided to hooks via
 * `transcript_path` (stdin) / `CURSOR_TRANSCRIPT_PATH` (env).
 *
 * Verified schema (from live ~/.cursor/projects/<slug>/agent-transcripts/<id>/<id>.jsonl):
 *   - Message lines: { role: "user"|"assistant", message: { content: [ {type:"text",text}, {type:"tool_use",name,input}, ... ] } }
 *   - Marker lines: { type: "turn_ended", status: "success" }
 *   - No timestamps in the transcript itself.
 *
 * This module extracts a flat list of {role, text, toolName?} entries
 * suitable for distillation.
 */

import fs from 'node:fs'

const MAX_TEXT_LEN = 4000
const MAX_TOOL_INPUT_LEN = 800

export function readTranscript(transcriptPath) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return []
  const raw = fs.readFileSync(transcriptPath, 'utf8')
  const entries = []
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    let obj
    try {
      obj = JSON.parse(trimmed)
    } catch {
      continue
    }
    // Skip marker lines (turn_ended, etc.)
    if (obj.type && !obj.role) continue
    if (!obj.role || !obj.message?.content) continue

    for (const block of obj.message.content) {
      if (block.type === 'text' && typeof block.text === 'string' && block.text.trim()) {
        entries.push({
          role: obj.role,
          text: block.text.slice(0, MAX_TEXT_LEN),
          transcriptPath,
        })
      } else if (block.type === 'tool_use' && block.name) {
        // Record tool calls compactly so distillation can see what was done
        const inputPreview = JSON.stringify(block.input || {}).slice(0, MAX_TOOL_INPUT_LEN)
        entries.push({
          role: obj.role,
          text: `[tool:${block.name}] ${inputPreview}`,
          toolName: block.name,
          transcriptPath,
        })
      }
      // tool_result blocks (role:"user" with tool_result content) are captured
      // as text above if present; Cursor's observed schema nests results under
      // assistant content, but we handle whichever shape appears.
    }
  }
  return entries
}

/**
 * Find the transcript path for a conversation id by searching the standard
 * Cursor projects tree. Used as a fallback when a hook didn't pass transcript_path.
 */
export function findTranscriptByConversationId(cursorHome, conversationId) {
  if (!conversationId) return null
  const projectsDir = `${cursorHome}/projects`
  if (!fs.existsSync(projectsDir)) return null
  for (const projectDir of fs.readdirSync(projectsDir)) {
    const transcriptsDir = `${projectsDir}/${projectDir}/agent-transcripts/${conversationId}`
    const direct = `${transcriptsDir}/${conversationId}.jsonl`
    if (fs.existsSync(direct)) return direct
  }
  return null
}

/**
 * List all transcript files under a Cursor projects tree, newest first.
 * Returns [{path, conversationId, projectSlug, mtime}].
 */
export function listTranscripts(cursorHome, limit = 50) {
  const projectsDir = `${cursorHome}/projects`
  if (!fs.existsSync(projectsDir)) return []
  const out = []
  for (const projectDir of fs.readdirSync(projectsDir)) {
    const transcriptsRoot = `${projectsDir}/${projectDir}/agent-transcripts`
    if (!fs.existsSync(transcriptsRoot)) continue
    for (const convDir of fs.readdirSync(transcriptsRoot)) {
      const file = `${transcriptsRoot}/${convDir}/${convDir}.jsonl`
      if (fs.existsSync(file)) {
        try {
          const st = fs.statSync(file)
          out.push({
            path: file,
            conversationId: convDir,
            projectSlug: projectDir,
            mtime: st.mtimeMs,
          })
        } catch {}
      }
    }
  }
  return out.sort((a, b) => b.mtime - a.mtime).slice(0, limit)
}
