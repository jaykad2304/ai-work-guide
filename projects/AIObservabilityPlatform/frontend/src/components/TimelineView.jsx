import { motion } from 'framer-motion'
import { Zap, Clock, Tag, Calendar } from 'lucide-react'

export default function TimelineView({ timeline, days, onDaysChange }) {
  if (!timeline) return null

  return (
    <div className="p-8 lg:p-10 min-h-screen bg-slate-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-10"
      >
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Timeline</h1>
          <p className="text-slate-500 mt-1 text-base font-medium">Every session, in order</p>
        </div>
        <select
          value={days}
          onChange={e => onDaysChange(Number(e.target.value))}
          className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm shadow-sm hover:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all cursor-pointer"
        >
          {[7, 30, 90, 365].map(d => <option key={d} value={d}>Last {d} days</option>)}
        </select>
      </motion.div>

      {!timeline.daily_summaries?.length ? (
        <div className="flex flex-col items-center justify-center py-40">
          <div className="w-24 h-24 rounded-3xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-6">
            <Calendar className="w-10 h-10 text-amber-400" />
          </div>
          <h3 className="text-2xl font-black text-slate-700 mb-2">No sessions in this period</h3>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline spine */}
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 1, ease: 'easeInOut', transformOrigin: 'top' }}
            className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-amber-400 via-indigo-400 to-transparent"
          />

          <div className="space-y-8">
            {timeline.daily_summaries.map((day, dayIdx) => {
              const dayEvents = (timeline.events || []).filter(e => e.timestamp?.startsWith(day.date))

              return (
                <motion.div
                  key={day.date}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: dayIdx * 0.08 }}
                  className="pl-16 relative"
                >
                  {/* Dot */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: dayIdx * 0.08 + 0.25, type: 'spring', bounce: 0.55 }}
                    className="absolute left-[18px] top-5 w-4.5 h-4.5 rounded-full bg-white border-2 border-amber-400 shadow-md shadow-amber-200"
                    style={{ width: 18, height: 18 }}
                  />

                  {/* Day block */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                    {/* Day header */}
                    <div className="px-7 py-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-50">
                      <h2 className="text-xl font-black text-slate-900">
                        {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', {
                          weekday: 'long', month: 'long', day: 'numeric',
                        })}
                      </h2>
                      <div className="flex gap-3 flex-wrap">
                        <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
                          <Calendar style={{ width: 13, height: 13 }} />{day.total_events} sessions
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                          <Zap style={{ width: 13, height: 13 }} />{(day.total_tokens || 0).toLocaleString()} tokens
                        </span>
                        <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {Math.round(day.activity_score)}% active
                        </span>
                      </div>
                    </div>

                    {/* Sessions */}
                    <div className="divide-y divide-slate-50">
                      {dayEvents.map((event, eIdx) => (
                        <motion.div
                          key={event.session_id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: dayIdx * 0.08 + eIdx * 0.04 }}
                          whileHover={{ backgroundColor: '#f8faff', x: 4 }}
                          className="px-7 py-5 transition-all duration-150 cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-6">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-bold text-slate-900">{event.title || 'Untitled'}</h3>
                              {event.summary && (
                                <p className="text-sm text-slate-500 mt-1.5 line-clamp-2">{event.summary}</p>
                              )}
                              <div className="flex flex-wrap gap-2 mt-3">
                                {(event.topics || []).slice(0, 5).map(t => (
                                  <span key={t} className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                                    <Tag style={{ width: 10, height: 10 }} />{t}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="shrink-0 text-right space-y-2">
                              <div className="flex items-center gap-1.5 justify-end">
                                <Zap style={{ width: 14, height: 14, color: '#f59e0b' }} />
                                <span className="text-sm font-bold text-amber-600">{(event.tokens_used || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-1.5 justify-end text-slate-400">
                                <Clock style={{ width: 13, height: 13 }} />
                                <span className="text-xs font-semibold">{event.duration_minutes}m</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
