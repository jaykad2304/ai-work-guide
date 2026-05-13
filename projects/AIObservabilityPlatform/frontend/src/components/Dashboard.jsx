import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts'
import { motion } from 'framer-motion'
import { TrendingUp, Zap, Calendar, Target } from 'lucide-react'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass px-3 py-2 rounded-xl text-xs font-bold text-white">
      <p className="text-slate-400 mb-1">{label}</p>
      <p style={{ color: '#818cf8' }}>{payload[0].value} {payload[0].name}</p>
    </div>
  )
}

const STATS = [
  { key: 'sessions', label: 'Sessions',     icon: TrendingUp, color: '#818cf8' },
  { key: 'tokens',   label: 'Tokens Used',  icon: Zap,        color: '#fbbf24' },
  { key: 'days',     label: 'Active Days',  icon: Calendar,   color: '#2dd4bf' },
  { key: 'topic',    label: 'Top Focus',    icon: Target,     color: '#f472b6' },
]

export default function Dashboard({ timeline, days, onDaysChange }) {
  if (!timeline) return null

  const totalTokens = timeline.events?.reduce((s, e) => s + (e.tokens_used || 0), 0) || 0
  const values = {
    sessions: timeline.total_events,
    tokens:   totalTokens.toLocaleString(),
    days:     timeline.daily_summaries?.length || 0,
    topic:    timeline.daily_summaries?.[0]?.primary_topics?.[0] || 'General',
  }

  const chartData = [...(timeline.daily_summaries || [])].reverse().map(d => ({
    date: d.date.slice(5),
    sessions: d.total_events,
    tokens: Math.round((d.total_tokens || 0) / 100),
  }))

  const fade = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }
  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="p-6 lg:p-8">

      {/* Page title + filter — like the reference "Spain ES / 09:39:58" */}
      <motion.div variants={fade} className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[11px] font-mono text-slate-600 uppercase tracking-[0.18em] mb-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-5xl font-black text-white tracking-tight leading-none">Dashboard</h1>
          <p className="text-slate-500 text-sm font-medium mt-2">Real-time AI usage intelligence</p>
        </div>
        <select value={days} onChange={e => onDaysChange(Number(e.target.value))}
          className="glass rounded-xl px-4 py-2.5 text-slate-300 text-sm font-semibold focus:outline-none cursor-pointer">
          {[7,30,90,365].map(d => <option key={d} value={d} style={{ background:'#050612' }}>Last {d} days</option>)}
        </select>
      </motion.div>

      {/* Stat cards — horizontal strip */}
      <motion.div variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STATS.map(s => {
          const Icon = s.icon
          return (
            <motion.div key={s.key} variants={fade}
              whileHover={{ y: -4, boxShadow: `0 16px 48px ${s.color}22` }}
              className="glass rounded-2xl p-5 cursor-default transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${s.color}18`, border: `1px solid ${s.color}28` }}>
                  <Icon style={{ width: 17, height: 17, color: s.color }} />
                </div>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
              </div>
              <p className="text-3xl font-black text-white tracking-tight leading-none mb-1">{values[s.key]}</p>
              <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">{s.label}</p>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 mb-6">
        {/* Sessions bar — takes 3/5 */}
        <motion.div variants={fade} className="xl:col-span-3 glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-black text-white tracking-tight">Daily Sessions</h2>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: '#818cf8', boxShadow: '0 0 6px #818cf8' }} />
              <span className="text-[10px] text-slate-600 font-mono">SESSIONS / DAY</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={14}>
              <defs>
                <linearGradient id="barG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" /><stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="date" stroke="transparent" tick={{ fontSize: 10, fill: '#334155', fontWeight: 700, fontFamily: 'monospace' }} />
              <YAxis stroke="transparent" tick={{ fontSize: 10, fill: '#334155' }} width={20} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(129,140,248,0.07)' }} />
              <Bar dataKey="sessions" fill="url(#barG)" radius={[5,5,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Token area — takes 2/5 */}
        <motion.div variants={fade} className="xl:col-span-2 glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-black text-white tracking-tight">Token Flow</h2>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: '#fbbf24', boxShadow: '0 0 6px #fbbf24' }} />
              <span className="text-[10px] text-slate-600 font-mono">×100</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor="#fbbf24" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="date" stroke="transparent" tick={{ fontSize: 10, fill: '#334155', fontWeight: 700, fontFamily: 'monospace' }} />
              <YAxis stroke="transparent" tick={{ fontSize: 10, fill: '#334155' }} width={20} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(251,191,36,0.25)', strokeWidth: 1 }} />
              <Area type="monotone" dataKey="tokens" stroke="#fbbf24" strokeWidth={2} fill="url(#areaG)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Sessions table — full width, compact */}
      <motion.div variants={fade} className="glass rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
          <h2 className="text-sm font-black text-white tracking-tight">Recent Sessions</h2>
          <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
            {(timeline.events||[]).length} RECORDS
          </span>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-12 gap-4 px-6 py-2.5 border-b border-white/[0.04]">
          {[['Session','col-span-5'],['Topics','col-span-2'],['Tokens','col-span-2 text-center'],['Duration','col-span-2 text-center'],['Date','col-span-1 text-right']].map(([h,cls]) => (
            <span key={h} className={`text-[9px] font-bold text-slate-700 uppercase tracking-widest ${cls}`}>{h}</span>
          ))}
        </div>

        <div>
          {(timeline.events||[]).slice(0,12).map((event, idx) => (
            <motion.div key={event.session_id}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
              whileHover={{ backgroundColor: 'rgba(129,140,248,0.04)' }}
              className="grid grid-cols-12 gap-4 px-6 py-3.5 border-b border-white/[0.03] last:border-0 cursor-pointer transition-colors duration-150">
              <div className="col-span-5 min-w-0">
                <p className="text-2xl font-bold text-slate-200">{event.title || 'Untitled Session'}</p>
                {event.summary && <p className="text-lg text-slate-500 mt-1">{event.summary}</p>}
              </div>
              <div className="col-span-2 flex flex-wrap gap-1.5 items-start pt-1">
                {(event.topics||[]).slice(0,2).map(t => (
                  <span key={t} className="text-base font-bold px-3 py-1 rounded"
                    style={{ background:'rgba(129,140,248,0.12)', color:'#818cf8', border:'1px solid rgba(129,140,248,0.15)' }}>{t}</span>
                ))}
              </div>
              <div className="col-span-2 text-center flex justify-center items-start pt-1">
                <span className="flex items-center gap-1.5 text-lg font-bold px-3 py-1 rounded"
                  style={{ background:'rgba(251,191,36,0.1)', color:'#fbbf24', border:'1px solid rgba(251,191,36,0.15)' }}>
                  <Zap style={{width:16,height:16}} />{(event.tokens_used||0).toLocaleString()}
                </span>
              </div>
              <div className="col-span-2 text-center">
                <span className="text-lg font-mono font-semibold text-slate-500">{event.duration_minutes}m</span>
              </div>
              <div className="col-span-1 text-right">
                <span className="text-base font-mono font-semibold text-slate-500">{event.timestamp?.slice(5,10)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
