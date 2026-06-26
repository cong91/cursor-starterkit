/**
 * TF-IDF Distillation — ported from OpenCode's heuristic engine.
 * Pure JS, no LLM dependency. Compresses a batch of messages into
 * top terms + a key-sentence summary.
 */

const STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for',
  'not', 'on', 'with', 'as', 'you', 'do', 'at', 'this', 'but', 'by', 'from',
  'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all',
  'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who',
  'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'no', 'just',
  'him', 'know', 'take', 'into', 'year', 'your', 'good', 'some', 'could',
  'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come',
  'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how',
  'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because',
  'any', 'these', 'give', 'day', 'most', 'us', 'is', 'are', 'was', 'were',
  'been', 'has', 'had', 'did', 'does', 'doing', 'should', 'shouldn',
  'don', 't', 's', 're', 've', 'll', 'm',
])

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
}

/**
 * Compute TF-IDF across a corpus of documents.
 * Returns top terms by summed TF-IDF weight.
 */
export function extractTerms(messages, maxTerms = 12) {
  const docs = messages.map((m) => tokenize(m.text))
  const N = docs.length || 1
  const df = new Map()
  for (const doc of docs) {
    const seen = new Set(doc)
    for (const term of seen) df.set(term, (df.get(term) || 0) + 1)
  }
  const tfidf = new Map()
  for (const doc of docs) {
    const tf = new Map()
    for (const term of doc) tf.set(term, (tf.get(term) || 0) + 1)
    for (const [term, count] of tf) {
      const idf = Math.log((N + 1) / ((df.get(term) || 0) + 1)) + 1
      const score = (count / doc.length) * idf
      tfidf.set(term, (tfidf.get(term) || 0) + score)
    }
  }
  return [...tfidf.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTerms)
    .map(([term, score]) => ({ term, score: Number(score.toFixed(3)) }))
}

/**
 * Pick the highest-information sentences from the corpus.
 * A sentence scores higher if it contains many top terms and is mid-length.
 */
export function extractKeySentences(messages, terms, maxSentences = 4) {
  const termSet = new Set(terms.map((t) => t.term))
  const sentences = []
  for (const m of messages) {
    const parts = String(m.text || '').split(/(?<=[.!?])\s+/).filter((s) => s.length > 30)
    for (const s of parts) {
      const words = tokenize(s)
      const hits = words.filter((w) => termSet.has(w)).length
      const lengthScore = 1 - Math.abs(s.length - 120) / 120
      const score = hits * 2 + Math.max(0, lengthScore)
      if (hits > 0) sentences.push({ text: s.trim(), score, role: m.role })
    }
  }
  return sentences.sort((a, b) => b.score - a.score).slice(0, maxSentences)
}

/**
 * Distill a batch of temporal messages into a distillation record.
 */
export function distill(messages) {
  if (!messages.length) return null
  const terms = extractTerms(messages)
  const keySentences = extractKeySentences(messages, terms)
  const summary = keySentences.map((s) => `[${s.role}] ${s.text}`).join('\n')
  return { terms, summary }
}
