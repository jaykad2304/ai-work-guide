import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts'
import { motion } from 'framer-motion'
import { TrendingUp, Zap, Calendar, Target, ArrowUpRight } from 'lucide-react'

const card = 'bg-white rounded-2xl border border-slate-100 shadow-sm'

export default function Dashboard({ timeline, days, onDaysChange }) {
  if (!timeline) return null

  const totalTokens = timeline.events?.reduce((s, e) => s + (e.tokens_used || 0), 0) || 0

  const stats = [
    { label: 'Total Sessions',  value: timeline.total_events,                      icon: TrendingUp, color: '#6366f1', bg: '#eef2ff', change: '+12%' },
    { label: 'Tokens Used',     value: totalTokens.toLocaleString(),               icon: Zap,        color: '#f59e0b', bg: '#fffbeb', change: '+8%'  },
    { label: 'Active Days',     value: timeline.daily_summaries?.length || 0,      icon: Calendar,   color: '#10b981', bg: '#ecfdf5', change: '+3%'  },
    { label: 'Top Focus',       value: timeline.daily_summaries?.[0]?.primary_topics?.[0] || 'General', icon: Target, color: '#f43f5e', bg: '#fff1f2', change: null },
  ]

  const chartData = [...(timeline.daily_summaries || [])].reverse().map(d => ({
    date: d.date.slice(5),
    sessions: d.total_events,
    tokens: Math.round((d.total_tokens || 0) / 100),
  }))

  const item = {
    hidden: { opacity: 0, y: 16 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.4 } },
  }
  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  }

  return (
    <motion.div
      variants={container} initial="hidden" animate="show"
      className="p-8 lg:p-10 min-h-screen bg-slate-50"
    >
      {/* Page header */}
      <motion.div variants={item} className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1 text-base font-medium">Your AI activity at a glance</p>
        </div>
        <select
          value={days}
          onChange={e => onDaysChange(Number(e.target.value))}
          className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm shadow-sm hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all cursor-pointer"
        >
          {[7, 30, 90, 365].map(d => <option key={d} value={d}>Last {d} days</option>)}
        </select>
      </motion.div>

      {/* Stats row */}
      <motion.div variants={container} className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {stats.map(s => {
          const Icon = s.icon
          return (
            <motion.div
              key={s.label}
              variants={item}
              whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(0,0,0,0.08)' }}
              className={`${card} p-6 cursor-default`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                  <Icon style={{ color: s.color, width: 20, height: 20 }} />
                </div>
                {s.change && (
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
                    <ArrowUpRight style={{ width: 12, height: 12 }} />
                    {s.change}
                  </div>
                )}
              </div>
              <p className="text-3xl font-black text-slate-900 leading-none mb-1">{s.value}</p>
              <p className="text-sm text-slate-500 font-semibold">{s.label}</p>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Charts row — two side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-8">
        {/* Daily sessions bar chart */}
        <motion.div variants={item} className={`${card} p-6`}>
          <h2 className="text-lg font-black text-slate-900 mb-6">Daily Sessions</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} barSize={18}>
              <defs>
                <linearGradient id="bar1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,.1)', fontSize: 13, fontWeight: 600 }}
                cursor={{ fill: 'rgba(99,102,241,0.06)' }}
              />
              <Bar dataKey="sessions" fill="url(#bar1)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Token usage area chart */}
        <motion.div variants={item} className={`${card} p-6`}>
          <h2 className="text-lg font-black text-slate-900 mb-6">Token Usage (×100)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="area1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,.1)', fontSize: 13, fontWeight: 600 }}
                cursor={{ stroke: '#f59e0b', strokeWidth: 1 }}
              />
              <Area type="monotone" dataKey="tokens" stroke="#f59e0b" strokeWidth={2.5} fill="url(#area1)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent sessions — full width table-style */}
      <motion.div variants={item} className={`${card} p-6`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-slate-900">Recent Sessions</h2>
          <span className="text-sm text-indigo-600 font-semibold bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            {(timeline.events || []).length} total
          </span>
        </div>

        {/* Header row */}
        <div className="grid grid-cols-12 gap-4 px-4 pb-3 border-b border-slate-100">
          <span className="col-span-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Session</span>
          <span className="col-span-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Topics</span>
          <span className="col-span-2 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Tokens</span>
          <span className="col-span-2 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Duration</span>
          <span className="col-span-1 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Date</span>
        </div>

        <div className="divide-y divide-slate-50">
          {(timeline.events || []).slice(0, 10).map((event, idx) => (
            <motion.div
              key={event.session_id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.04 }}
              whileHover={{ backgroundColor: '#f8faff' }}
              className="grid grid-cols-12 gap-4 px-4 py-4 rounded-xl transition-colors duration-150 cursor-pointer"
            >
              <div className="col-span-5 min-w-0">
                <p className="font-bold text-slate-900 truncate text-sm">{event.title || 'Untitled Session'}</p>
                {event.summary && (
                  <p className="text-xs text-slate-400 truncate mt-0.5">{event.summary}</p>
                )}
              </div>
              <div className="col-span-2 flex flex-wrap gap-1 items-start">
                {(event.topics || []).slice(0, 2).map(t => (
                  <span key={t} className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full font-semibold">{t}</span>
                ))}
              </div>
              <div className="col-span-2 text-center">
                <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                  <Zap style={{ width: 12, height: 12 }} />
                  {(event.tokens_used || 0).toLocaleString()}
                </span>
              </div>
              <div className="col-span-2 text-center">
                <span className="text-sm font-semibold text-slate-600">{event.duration_minutes}m</span>
              </div>
              <div className="col-span-1 text-right">
                <span className="text-xs font-semibold text-slate-400">{event.timestamp?.slice(5, 10)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
