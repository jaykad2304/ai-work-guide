const TOOL_LABELS = {
  claude_cli: 'Claude CLI',
  codex_cli: 'Codex CLI',
  claude_web: 'Claude Web',
  chatgpt: 'ChatGPT',
}

const SUMMARY_PENDING_TEXT = 'Summary is not ready yet. It will be generated when this session is complete.'

function cleanText(text = '') {
  return String(text)
    .replace(/\s+/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .trim()
}

function truncate(text, length = 500) {
  if (!text) return ''
  return text.length > length ? `${text.slice(0, length).trim()}...` : text
}

export function getToolLabel(tool) {
  return TOOL_LABELS[tool] || tool?.replace(/_/g, ' ') || 'AI Tool'
}

export function getSessionHeadline(event) {
  if (event.summary_status === 'active') {
    return 'Session in progress'
  }

  const displaySummary = cleanText(event.display_summary)
  const title = cleanText(event.title)
  if (displaySummary) {
    const firstSentence = displaySummary.split('. ')[0]
    return truncate(firstSentence, 84)
  }
  if (title && !/^codex session/i.test(title) && !/^untitled$/i.test(title)) {
    return title
  }

  const summary = cleanText(event.summary)
  if (summary && !/^codex cli session$/i.test(summary) && !/^session completed$/i.test(summary)) {
    return truncate(summary, 72)
  }

  const project = cleanText(event.project)
  if (project && project !== 'unknown') {
    return `${getToolLabel(event.tool)} work in ${project}`
  }

  return `${getToolLabel(event.tool)} session`
}

export function getSessionNarrative(event) {
  if (event.summary_status === 'active') {
    return SUMMARY_PENDING_TEXT
  }

  const displaySummary = cleanText(event.display_summary)
  const summary = cleanText(event.summary)
  const topics = Array.isArray(event.topics) ? event.topics.filter(Boolean) : []
  const project = cleanText(event.project)
  const toolLabel = getToolLabel(event.tool)

  if (displaySummary) {
    const sentences = displaySummary.split(/(?<=\.)\s+/).filter(Boolean)
    if (sentences.length > 1) {
      return truncate(sentences.slice(1).join(' '), 800)
    }
    return truncate(displaySummary, 800)
  }

  if (summary && !/^codex cli session$/i.test(summary) && !/^session completed$/i.test(summary)) {
    return truncate(summary, 800)
  }

  if (topics.length && project && project !== 'unknown') {
    return `Worked in ${project} using ${toolLabel} with focus on ${topics.slice(0, 3).join(', ')}.`
  }

  if (topics.length) {
    return `${toolLabel} session centered on ${topics.slice(0, 3).join(', ')}.`
  }

  if (project && project !== 'unknown') {
    return `${toolLabel} activity recorded in ${project}, but the underlying session did not expose a detailed summary.`
  }

  return `${toolLabel} activity was captured, but this session needs richer source text to describe the exact task.`
}

export function getSessionDescriptor(event) {
  const topics = Array.isArray(event.topics) ? event.topics.filter(Boolean) : []
  const parts = []

  if (event.project && event.project !== 'unknown') parts.push(event.project)
  if (topics.length) parts.push(topics.slice(0, 2).join(' / '))

  return parts.length ? parts.join('  •  ') : 'Session overview'
}

export function extractAchievements(event) {
  const summary = cleanText(event.summary || '')
  if (!summary) return []

  const sentences = summary.split(/(?<=[.!?])\s+/).filter(Boolean)
  const achievements = []

  const actionVerbs = [
    'added', 'implemented', 'updated', 'fixed', 'removed', 'created',
    'refactored', 'optimized', 'debugged', 'improved', 'designed',
    'built', 'integrated', 'configured', 'deployed', 'enhanced'
  ]

  for (const sentence of sentences) {
    const lower = sentence.toLowerCase()
    if (actionVerbs.some(verb => lower.includes(verb))) {
      const trimmed = sentence.trim()
      if (trimmed.length > 15 && !achievements.includes(trimmed)) {
        achievements.push(trimmed)
      }
    }
    if (achievements.length >= 2) break
  }

  return achievements
}

export function getTokenAdvice(event) {
  if (event.token_hint) {
    return cleanText(event.token_hint)
  }
  const tokens = event.tokens_used || 0
  const summary = cleanText(event.summary).toLowerCase()
  const topics = Array.isArray(event.topics) ? event.topics.join(' ').toLowerCase() : ''
  const haystack = `${summary} ${topics}`

  if (tokens >= 2500) {
    return 'Reduce tokens by splitting the ask into smaller checkpoints and requesting diffs or bullet summaries before full rewrites.'
  }

  if (tokens >= 1200) {
    return 'Reduce tokens by reusing prior context, naming the exact file or function, and asking for one targeted change at a time.'
  }

  if (haystack.includes('debug') || haystack.includes('error') || haystack.includes('bug')) {
    return 'Reduce tokens by pasting the failing command, stack trace, and expected behavior first so the assistant spends fewer turns locating the issue.'
  }

  if (haystack.includes('api') || haystack.includes('integration') || haystack.includes('endpoint')) {
    return 'Reduce tokens by providing the request shape, response example, and one concrete goal instead of the whole integration story.'
  }

  if (haystack.includes('react') || haystack.includes('ui') || haystack.includes('frontend')) {
    return 'Reduce tokens by attaching the relevant component and a screenshot together so the assistant can skip exploratory back-and-forth.'
  }

  return 'Reduce tokens by starting with the exact outcome, the relevant files, and any constraints so the assistant can answer in one pass.'
}
