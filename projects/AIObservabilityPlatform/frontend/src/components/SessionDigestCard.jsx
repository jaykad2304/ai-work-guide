import { motion } from 'framer-motion'
import { Clock3, FolderKanban, Lightbulb, Tag, Zap } from 'lucide-react'
import { getSessionDescriptor, getSessionHeadline, getSessionNarrative, getTokenAdvice, getToolLabel } from '../utils/sessionPresentation'

export default function SessionDigestCard({ event, index = 0, showProject = true, variant = 'dark' }) {
  const topics = Array.isArray(event.topics) ? event.topics.filter(Boolean).slice(0, 4) : []
  const headline = getSessionHeadline(event)
  const narrative = getSessionNarrative(event)
  const tokenAdvice = getTokenAdvice(event)
  const descriptor = getSessionDescriptor(event)
  const light = variant === 'light'
  const active = event.summary_status === 'active'

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -2, boxShadow: light ? '0 22px 40px rgba(15, 23, 42, 0.1)' : '0 18px 40px rgba(8,12,30,0.28)' }}
      className={`session-card rounded-3xl p-5 lg:p-6 transition-all duration-200 ${light ? 'session-card--light' : ''}`}
    >
      <div className={`flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between ${light ? 'session-card-main--light' : ''}`}>
        <div className="min-w-0 flex-1">
          <div className={`flex flex-wrap items-center gap-2 mb-4 ${light ? 'session-card-kicker--light' : ''}`}>
            <span className={`session-tool-chip ${light ? 'session-tool-chip--light' : ''}`}>{getToolLabel(event.tool)}</span>
            {active && <span className="session-status-chip">Summary pending</span>}
            <span className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${light ? 'text-slate-400' : 'text-slate-500'}`}>
              {descriptor}
            </span>
          </div>

          <h3 className={`text-[1.55rem] lg:text-[1.85rem] font-semibold tracking-[-0.035em] leading-[1.08] mb-2 ${light ? 'text-slate-900' : 'text-white'}`}>
            {headline}
          </h3>

          <p className={`text-[0.98rem] lg:text-[1.04rem] leading-[1.75] max-w-4xl ${light ? 'text-slate-600' : 'text-slate-300'}`}>
            {narrative}
          </p>

          <div className={`flex flex-wrap gap-2 mt-5 ${light ? 'session-card-tags--light' : ''}`}>
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

        <div className={`session-metrics shrink-0 lg:w-[240px] ${light ? 'session-metrics--light' : ''}`}>
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

      <div className={`session-advice mt-5 ${light ? 'session-advice--light' : ''}`}>
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
      </div>
    </motion.article>
  )
}
