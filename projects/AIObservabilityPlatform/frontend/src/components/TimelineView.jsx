import { motion } from 'framer-motion'
import { Zap, Clock, Tag, Calendar } from 'lucide-react'

export default function TimelineView({ timeline, days, onDaysChange }) {
  if (!timeline) return null

  return (
    <div className="p-6 lg:p-8 min-h-screen">
      <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }}
        className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight leading-none mb-1.5">Timeline</h1>
          <p className="text-slate-500 text-sm font-medium">Every session, in order</p>
        </div>
        <select value={days} onChange={e => onDaysChange(Number(e.target.value))}
          className="glass rounded-xl px-4 py-2.5 text-slate-300 text-sm font-semibold focus:outline-none cursor-pointer">
          {[7,30,90,365].map(d => <option key={d} value={d} style={{ background:'#0f0f2e' }}>Last {d} days</option>)}
        </select>
      </motion.div>

      {!timeline.daily_summaries?.length ? (
        <div className="flex flex-col items-center justify-center py-40">
          <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center mb-5">
            <Calendar className="w-9 h-9 text-slate-500" />
          </div>
          <h3 className="text-xl font-black text-slate-400 mb-1">No sessions in this period</h3>
        </div>
      ) : (
        <div className="relative">
          {/* Animated spine */}
          <motion.div initial={{ scaleY:0 }} animate={{ scaleY:1 }}
            transition={{ duration:1.2, ease:'easeInOut', transformOrigin:'top' }}
            className="absolute left-[26px] top-5 bottom-5 w-px"
            style={{ background:'linear-gradient(to bottom, #fb923c, #818cf8, transparent)' }} />

          <div className="space-y-7">
            {timeline.daily_summaries.map((day, dayIdx) => {
              const dayEvents = (timeline.events||[]).filter(e => e.timestamp?.startsWith(day.date))
              return (
                <motion.div key={day.date}
                  initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }}
                  transition={{ delay: dayIdx*0.08 }}
                  className="pl-16 relative">

                  {/* Dot */}
                  <motion.div initial={{ scale:0 }} animate={{ scale:1 }}
                    transition={{ delay: dayIdx*0.08+0.2, type:'spring', bounce:0.5 }}
                    className="absolute left-[18px] top-5 w-4 h-4 rounded-full border-2 border-orange-400 bg-[#07071a]"
                    style={{ boxShadow:'0 0 12px rgba(251,146,60,0.5)' }} />

                  <div className="glass rounded-2xl overflow-hidden">
                    {/* Day header */}
                    <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.05]"
                      style={{ background:'rgba(251,146,60,0.05)' }}>
                      <h2 className="text-base font-black text-white">
                        {new Date(day.date+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}
                      </h2>
                      <div className="flex gap-2 flex-wrap">
                        {[
                          { label:`${day.total_events} sessions`, color:'#fb923c' },
                          { label:`${(day.total_tokens||0).toLocaleString()} tokens`, color:'#818cf8' },
                          { label:`${Math.round(day.activity_score)}% active`, color:'#2dd4bf' },
                        ].map(badge => (
                          <span key={badge.label} className="text-[11px] font-bold px-3 py-1 rounded-lg"
                            style={{ color:badge.color, background:`${badge.color}15`, border:`1px solid ${badge.color}25` }}>
                            {badge.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      {dayEvents.map((event, eIdx) => (
                        <motion.div key={event.session_id}
                          initial={{ opacity:0 }} animate={{ opacity:1 }}
                          transition={{ delay: dayIdx*0.08+eIdx*0.04 }}
                          whileHover={{ backgroundColor:'rgba(255,255,255,0.025)', x:4 }}
                          className="px-6 py-5 border-b border-white/[0.03] last:border-0 cursor-pointer transition-all duration-150">
                          <div className="flex items-start justify-between gap-5">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-bold text-slate-200">{event.title||'Untitled'}</h3>
                              {event.summary && <p className="text-xs text-slate-600 mt-1 line-clamp-2">{event.summary}</p>}
                              <div className="flex flex-wrap gap-1.5 mt-2.5">
                                {(event.topics||[]).slice(0,5).map(t => (
                                  <span key={t} className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                    style={{ color:'#818cf8', background:'rgba(129,140,248,0.1)', border:'1px solid rgba(129,140,248,0.18)' }}>
                                    <Tag style={{width:9,height:9}} />{t}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="shrink-0 text-right space-y-2">
                              <div className="flex items-center gap-1.5 justify-end">
                                <Zap style={{width:13,height:13,color:'#fbbf24'}} />
                                <span className="text-xs font-bold text-amber-400">{(event.tokens_used||0).toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-1.5 justify-end text-slate-600">
                                <Clock style={{width:12,height:12}} />
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
