import { motion } from 'framer-motion'
import { Zap, Clock, Tag, Calendar } from 'lucide-react'

export default function TimelineView({ timeline, days, onDaysChange }) {
  if (!timeline) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-start mb-12"
        >
          <div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent mb-2">
              Timeline
            </h1>
            <p className="text-lg text-slate-400 font-medium">Every session, in order</p>
          </div>
          <select
            value={days}
            onChange={e => onDaysChange(Number(e.target.value))}
            className="px-6 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-100 font-semibold hover:border-orange-500/50 transition-all duration-300 cursor-pointer"
          >
            {[7, 30, 90, 365].map(d => (
              <option key={d} value={d}>
                Last {d} days
              </option>
            ))}
          </select>
        </motion.div>

        {!timeline.daily_summaries?.length ? (
          <div className="text-center py-32 text-slate-500">
            <Calendar className="w-24 h-24 mx-auto mb-6 opacity-30" />
            <h3 className="text-2xl font-bold mb-2 text-slate-400">No sessions in this period</h3>
          </div>
        ) : (
          <div className="relative">
            {/* Animated timeline line */}
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: '100%' }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-orange-500 via-pink-500 to-transparent"
            />

            <div className="space-y-12 relative">
              {timeline.daily_summaries.map((day, dayIdx) => {
                const dayEvents = (timeline.events || []).filter(e =>
                  e.timestamp?.startsWith(day.date)
                )

                return (
                  <motion.div
                    key={day.date}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: dayIdx * 0.1 }}
                    className="pl-20 relative"
                  >
                    {/* Timeline dot */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: dayIdx * 0.1 + 0.3, type: 'spring', bounce: 0.6 }}
                      className="absolute left-5 w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/50 border-2 border-slate-900"
                    />

                    {/* Day Card */}
                    <div className="group bg-slate-800/50 border border-slate-700/50 rounded-3xl overflow-hidden hover:border-orange-500/30 transition-all duration-300">
                      {/* Day Header */}
                      <div className="px-8 py-6 bg-gradient-to-r from-orange-500/10 to-red-500/10 border-b border-slate-700/30">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <h2 className="text-2xl font-black text-white">
                              {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </h2>
                          </div>
                          <div className="flex gap-4">
                            <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-lg">
                              <Calendar className="w-4 h-4 text-orange-400" />
                              <span className="text-sm font-bold text-orange-300">{day.total_events} sessions</span>
                            </div>
                            <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-lg">
                              <Zap className="w-4 h-4 text-purple-400" />
                              <span className="text-sm font-bold text-purple-300">
                                {(day.total_tokens || 0).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-lg">
                              <span className="text-sm font-bold text-blue-300">{Math.round(day.activity_score)}% active</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sessions */}
                      <div className="divide-y divide-slate-800/50">
                        {dayEvents.map((event, eIdx) => (
                          <motion.div
                            key={event.session_id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: dayIdx * 0.1 + eIdx * 0.05 }}
                            whileHover={{ x: 4 }}
                            className="px-8 py-5 hover:bg-slate-800/30 transition-all duration-200 cursor-pointer"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-white">
                                  {event.title || 'Untitled'}
                                </h3>
                                {event.summary && (
                                  <p className="text-sm text-slate-400 mt-1 line-clamp-2">{event.summary}</p>
                                )}
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {(event.topics || []).slice(0, 4).map(t => (
                                    <span
                                      key={t}
                                      className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-300"
                                    >
                                      <Tag className="w-3 h-3" />
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="shrink-0 text-right">
                                <div className="flex items-center gap-1.5 justify-end text-yellow-300">
                                  <Zap className="w-4 h-4 text-yellow-400" />
                                  <span className="text-sm font-bold">
                                    {(event.tokens_used || 0).toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 justify-end mt-2 text-slate-400">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span className="text-xs font-medium">{event.duration_minutes}m</span>
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
    </div>
  )
}
