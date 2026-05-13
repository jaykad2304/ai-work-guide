import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts'
import { motion } from 'framer-motion'
import { TrendingUp, Zap, Calendar, Target, ArrowUpRight } from 'lucide-react'

const STATS = [
  { key: 'sessions', label: 'Total Sessions', icon: TrendingUp, color: '#818cf8', glow: 'rgba(129,140,248,0.25)' },
  { key: 'tokens',   label: 'Tokens Used',    icon: Zap,        color: '#fbbf24', glow: 'rgba(251,191,36,0.2)'  },
  { key: 'days',     label: 'Active Days',    icon: Calendar,   color: '#2dd4bf', glow: 'rgba(45,212,191,0.2)'  },
  { key: 'topic',    label: 'Top Focus',      icon: Target,     color: '#f472b6', glow: 'rgba(244,114,182,0.2)' },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-strong rounded-xl px-4 py-3 text-xs font-bold text-white">
      <p className="text-slate-400 mb-1">{label}</p>
      <p style={{ color: '#818cf8' }}>{payload[0].value} {payload[0].name}</p>
    </div>
  )
}

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
    date: d.date.slice(5), sessions: d.total_events,
    tokens: Math.round((d.total_tokens || 0) / 100),
  }))

  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
  const fade    = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="p-8 lg:p-10 min-h-screen">

      {/* Header */}
      <motion.div variants={fade} className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight leading-none mb-1.5">Dashboard</h1>
          <p className="text-slate-500 text-sm font-medium">Your AI activity at a glance</p>
        </div>
        <select value={days} onChange={e => onDaysChange(Number(e.target.value))}
          className="glass rounded-xl px-4 py-2.5 text-slate-300 text-sm font-semibold focus:outline-none focus:border-indigo-500/40 cursor-pointer hover:glass transition-all">
          {[7,30,90,365].map(d => <option key={d} value={d} style={{ background: '#0f0f2e' }}>Last {d} days</option>)}
        </select>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={stagger} className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {STATS.map(s => {
          const Icon = s.icon
          return (
            <motion.div key={s.key} variants={fade}
              whileHover={{ y: -5, boxShadow: `0 20px 50px ${s.glow}` }}
              className="glass rounded-2xl p-5 cursor-default transition-all duration-300">
              <div className="flex items-start justify-between mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${s.color}1a`, border: `1px solid ${s.color}30` }}>
                  <Icon style={{ width: 18, height: 18, color: s.color }} />
                </div>
                <ArrowUpRight style={{ width: 14, height: 14, color: s.color, opacity: 0.7 }} />
              </div>
              <p className="text-3xl font-black text-white leading-none mb-1.5 tracking-tight">{values[s.key]}</p>
              <p className="text-xs text-slate-500 font-semibold">{s.label}</p>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        <motion.div variants={fade} className="glass rounded-2xl p-6">
          <h2 className="text-base font-black text-white mb-5">Daily Sessions</h2>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={chartData} barSize={16}>
              <defs>
                <linearGradient id="barG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" /><stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="date" stroke="transparent" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
              <YAxis stroke="transparent" tick={{ fontSize: 11, fill: '#475569' }} width={24} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(129,140,248,0.07)' }} />
              <Bar dataKey="sessions" fill="url(#barG)" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={fade} className="glass rounded-2xl p-6">
          <h2 className="text-base font-black text-white mb-5">Token Usage <span className="text-slate-500 font-medium text-xs">×100</span></h2>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor="#fbbf24" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="date" stroke="transparent" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
              <YAxis stroke="transparent" tick={{ fontSize: 11, fill: '#475569' }} width={24} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(251,191,36,0.3)', strokeWidth: 1 }} />
              <Area type="monotone" dataKey="tokens" stroke="#fbbf24" strokeWidth={2} fill="url(#areaG)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Sessions table */}
      <motion.div variants={fade} className="glass rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="text-base font-black text-white">Recent Sessions</h2>
          <span className="text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(129,140,248,0.12)', color: '#818cf8', border: '1px solid rgba(129,140,248,0.2)' }}>
            {(timeline.events||[]).length} total
          </span>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/[0.04]">
          {['Session','Topics','Tokens','Duration','Date'].map((h, i) => (
            <span key={h} className={`text-[10px] font-bold text-slate-600 uppercase tracking-widest ${
              i===0?'col-span-5':i===1?'col-span-2':i===2?'col-span-2 text-center':i===3?'col-span-2 text-center':'col-span-1 text-right'}`}>
              {h}
            </span>
          ))}
        </div>

        <div>
          {(timeline.events||[]).slice(0,10).map((event, idx) => (
            <motion.div key={event.session_id}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.035 }}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
              className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/[0.03] last:border-0 cursor-pointer transition-colors duration-150">
              <div className="col-span-5 min-w-0">
                <p className="text-sm font-bold text-slate-200 truncate">{event.title||'Untitled Session'}</p>
                {event.summary && <p className="text-xs text-slate-600 truncate mt-0.5">{event.summary}</p>}
              </div>
              <div className="col-span-2 flex flex-wrap gap-1 items-start pt-0.5">
                {(event.topics||[]).slice(0,2).map(t => (
                  <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background:'rgba(129,140,248,0.12)', color:'#818cf8', border:'1px solid rgba(129,140,248,0.18)' }}>{t}</span>
                ))}
              </div>
              <div className="col-span-2 text-center flex justify-center items-start pt-0.5">
                <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg"
                  style={{ background:'rgba(251,191,36,0.1)', color:'#fbbf24', border:'1px solid rgba(251,191,36,0.18)' }}>
                  <Zap style={{width:11,height:11}} />{(event.tokens_used||0).toLocaleString()}
                </span>
              </div>
              <div className="col-span-2 text-center">
                <span className="text-xs font-semibold text-slate-500">{event.duration_minutes}m</span>
              </div>
              <div className="col-span-1 text-right">
                <span className="text-xs font-semibold text-slate-600">{event.timestamp?.slice(5,10)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
