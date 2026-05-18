import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { Clock3, FolderKanban, Lightbulb, Tag, X, Zap } from 'lucide-react'
import { getSessionCompactSummary, getSessionDescriptor, getSessionHeadline, getSessionNarrative, getTokenAdvice, getToolLabel } from '../utils/sessionPresentation'

function getSessionTone(event) {
  const topics = Array.isArray(event.topics) ? event.topics.join(' ').toLowerCase() : ''
  const text = `${event.title || ''} ${event.summary || ''} ${event.display_summary || ''}`.toLowerCase()
  const tokens = event.tokens_used || 0
  const duration = event.duration_minutes || 0
  const haystack = `${topics} ${text}`

  if (tokens >= 100000 || duration >= 180 || /error|debug|bug|fix|failed|failure/.test(haystack)) return 'red'
  if (tokens >= 25000 || duration >= 90 || /review|investigate|ambiguous|unclear|maybe/.test(haystack)) return 'amber'
  if (/dashboard|theme|ui|design|frontend|image/.test(haystack)) return 'violet'
  if (/api|backend|database|parser|collector|integration|route/.test(haystack)) return 'cyan'
  if (/completed|implemented|validated|passed|ready/.test(haystack)) return 'green'
  return 'blue'
}

export default function SessionDigestCard({ event, index = 0, showProject = true, variant = 'dark', compact = false }) {
  const [expanded, setExpanded] = useState(false)
  const topics = Array.isArray(event.topics) ? event.topics.filter(Boolean).slice(0, 4) : []
  const headline = getSessionHeadline(event)
  const narrative = getSessionNarrative(event)
  const compactSummary = getSessionCompactSummary(event)
  const tokenAdvice = getTokenAdvice(event)
  const descriptor = getSessionDescriptor(event)
  const light = variant === 'light'
  const active = event.summary_status === 'active'
  const showDetails = !compact
  const tone = getSessionTone(event)
  const showAdvice = true
  const openDetails = () => setExpanded(true)
  const handleKeyDown = event => {
    if (!compact) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openDetails()
    }
  }

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
        whileHover={{ y: -2, boxShadow: light ? '0 22px 40px rgba(15, 23, 42, 0.1)' : '0 18px 40px rgba(8,12,30,0.28)' }}
        onClick={compact ? openDetails : undefined}
        onKeyDown={handleKeyDown}
        role={compact ? 'button' : undefined}
        tabIndex={compact ? 0 : undefined}
        aria-label={compact ? `Open details for ${headline}` : undefined}
        className={`session-card session-card--${tone} rounded-3xl p-5 lg:p-6 transition-all duration-200 ${light ? 'session-card--light' : ''} ${compact ? 'session-card--compact cursor-pointer' : ''}`}
      >
        <div className={`flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between ${light ? 'session-card-main--light' : ''}`}>
          <div className="min-w-0 flex-1">
            <div className={`flex flex-wrap items-center gap-2 ${compact ? 'mb-2' : 'mb-4'} ${light ? 'session-card-kicker--light' : ''}`}>
              <span className={`session-tool-chip ${light ? 'session-tool-chip--light' : ''}`}>{getToolLabel(event.tool)}</span>
              {active && <span className="session-status-chip">Summary pending</span>}
              <span className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${light ? 'text-slate-400' : 'text-slate-500'}`}>
                {descriptor}
              </span>
            </div>

            <h3 className={`font-semibold tracking-[-0.035em] leading-[1.08] mb-2 ${compact ? 'text-[1.2rem] lg:text-[1.35rem]' : 'text-[1.55rem] lg:text-[1.85rem]'} ${light ? 'text-slate-900' : 'text-white'}`}>
              {headline}
            </h3>

            <p className={`${compact ? 'text-[0.9rem] leading-[1.45] line-clamp-2' : 'text-[0.98rem] lg:text-[1.04rem] leading-[1.75]'} max-w-4xl ${light ? 'text-slate-600' : 'text-slate-300'}`}>
              {showDetails ? narrative : compactSummary}
            </p>

            <div className={`flex flex-wrap gap-2 ${compact ? 'mt-3' : 'mt-5'} ${light ? 'session-card-tags--light' : ''}`}>
              {topics.map(topic => (
                <span key={topic} className={`session-topic-pill ${light ? 'session-topic-pill--light' : ''}`}>
                  <Tag style={{ width: 12, height: 12 }} />
                  {topic}
                </span>
              ))}
              {showProject && event.project && event.project !== 'unknown' && (
                <span className={`session-project-pill ${light ? 'session-project-pill--light' : ''}`}>
                  <FolderKanban style={{ width: 12, height: 12 }} />
                  {event.project}
                </span>
              )}
            </div>
          </div>

          <div className={`session-metrics shrink-0 ${compact ? 'lg:w-[238px]' : 'lg:w-[240px]'} ${light ? 'session-metrics--light' : ''}`}>
            <div className={`session-metric-row ${light ? 'session-metric-row--light' : ''}`}>
              <span className={`session-metric-label ${light ? 'session-metric-label--light' : ''}`}>Tokens</span>
              <span className={`session-metric-value session-metric-value--token ${light ? 'session-metric-value--light' : ''}`}>
                <Zap style={{ width: 15, height: 15 }} />
                {(event.tokens_used || 0).toLocaleString()}
              </span>
            </div>
            <div className={`session-metric-row ${light ? 'session-metric-row--light' : ''}`}>
              <span className={`session-metric-label ${light ? 'session-metric-label--light' : ''}`}>Duration</span>
              <span className={`session-metric-value ${light ? 'session-metric-value--light' : ''}`}>
                <Clock3 style={{ width: 15, height: 15 }} />
                {event.duration_minutes || 1}m
              </span>
            </div>
            <div className={`session-metric-row ${light ? 'session-metric-row--light' : ''}`}>
              <span className={`session-metric-label ${light ? 'session-metric-label--light' : ''}`}>Date</span>
              <span className={`session-metric-date ${light ? 'session-metric-date--light' : ''}`}>
                {event.timestamp ? new Date(event.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        {showAdvice && <div className={`session-advice mt-5 ${light ? 'session-advice--light' : ''}`}>
          <div className="flex items-start gap-3">
            <div className={`session-advice-icon ${light ? 'session-advice-icon--light' : ''}`}>
              <Lightbulb style={{ width: 15, height: 15 }} />
            </div>
            <div>
              <p className={`text-[10px] uppercase tracking-[0.22em] font-bold mb-1 ${light ? 'text-amber-600' : 'text-amber-300/80'}`}>
                Token Saving Hint
              </p>
              <p className={`text-sm leading-relaxed ${light ? 'text-slate-600' : 'text-slate-200'}`}>
                {tokenAdvice}
              </p>
            </div>
          </div>
        </div>}
      </motion.article>

      <AnimatePresence>
        {compact && expanded && (
          <motion.div
            className="session-detail-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpanded(false)}
          >
            <motion.div
              className="session-detail-prompt"
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              onClick={event => event.stopPropagation()}
            >
              <button type="button" className="session-detail-close" onClick={() => setExpanded(false)} aria-label="Close session details">
                <X style={{ width: 15, height: 15 }} />
              </button>
              <h3>{headline}</h3>
              <p className="session-detail-narrative">{narrative}</p>
              <p className="session-detail-advice">{tokenAdvice}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
