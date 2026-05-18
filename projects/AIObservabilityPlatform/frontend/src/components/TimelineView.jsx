import { motion } from 'framer-motion'
import { Calendar, Clock, Zap } from 'lucide-react'
import PageShell from './PageShell'
import WindowSelect from './WindowSelect'
import SessionDigestCard from './SessionDigestCard'

export default function TimelineView({ timeline, days, onDaysChange, theme = 'light', onThemeChange }) {
  if (!timeline) return null

  return (
    <PageShell
      theme={theme}
      onThemeChange={onThemeChange}
      title="Timeline"
      eyebrow="Event stream"
      description="Every captured session in chronological order, grouped by day with tokens and activity context."
      icon={Calendar}
      tone="amber"
      actions={<WindowSelect days={days} onDaysChange={onDaysChange} />}
    >
      {!timeline.daily_summaries?.length ? (
        <div className="page-empty-state">
          <div className="page-empty-icon">
            <Calendar style={{ width: 34, height: 34 }} />
          </div>
          <h3>No sessions in this period</h3>
          <p>Adjust the window or capture new AI sessions.</p>
        </div>
      ) : (
        <div className="timeline-shell">
          <motion.div initial={{ scaleY:0 }} animate={{ scaleY:1 }}
            transition={{ duration:1.2, ease:'easeInOut', transformOrigin:'top' }}
            className="timeline-spine" />

          <div className="timeline-day-list">
            {timeline.daily_summaries.map((day, dayIdx) => {
              const dayEvents = (timeline.events||[]).filter(e => e.timestamp?.startsWith(day.date))
              return (
                <motion.div key={day.date}
                  initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }}
                  transition={{ delay: dayIdx*0.08 }}
                  className="timeline-day">

                  <motion.div initial={{ scale:0 }} animate={{ scale:1 }}
                    transition={{ delay: dayIdx*0.08+0.2, type:'spring', bounce:0.5 }}
                    className="timeline-dot" />

                  <div className="timeline-card">
                    <div className="timeline-day-header">
                      <h2>
                        {new Date(day.date+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}
                      </h2>
                      <div className="timeline-badges">
                        {[
                          { label:`${day.total_events} sessions`, tone:'amber', icon: Calendar },
                          { label:`${(day.total_tokens||0).toLocaleString()} tokens`, tone:'blue', icon: Zap },
                          { label:`${Math.round(day.activity_score)}% active`, tone:'green', icon: Clock },
                        ].map(badge => (
                          <span key={badge.label} className={`page-pill page-pill--${badge.tone}`}>
                            <badge.icon style={{ width: 12, height: 12 }} /> {badge.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="nested-session-list">
                      {dayEvents.map((event, eIdx) => (
                        <SessionDigestCard key={event.session_id || eIdx} event={event} index={eIdx} variant={theme} compact />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}
    </PageShell>
  )
}
