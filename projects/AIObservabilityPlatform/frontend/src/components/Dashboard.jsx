import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { motion } from 'framer-motion'
import { TrendingUp, Zap, Calendar, Target } from 'lucide-react'

export default function Dashboard({ timeline, days, onDaysChange }) {
  if (!timeline) return null

  const totalTokens = timeline.events?.reduce((s, e) => s + (e.tokens_used || 0), 0) || 0

  const stats = [
    {
      label: 'Total Sessions',
      value: timeline.total_events,
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Tokens Used',
      value: totalTokens.toLocaleString(),
      icon: Zap,
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      label: 'Active Days',
      value: timeline.daily_summaries?.length || 0,
      icon: Calendar,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Top Focus',
      value: timeline.daily_summaries?.[0]?.primary_topics?.[0] || 'General',
      icon: Target,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
    },
  ]

  const chartData = [...(timeline.daily_summaries || [])].reverse().map(d => ({
    date: d.date.slice(5),
    sessions: d.total_events,
  }))

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8"
    >
      {/* Header */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto mb-12"
      >
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Dashboard
          </h1>
          <p className="text-lg text-slate-400 font-medium">Your AI activity at a glance</p>
        </motion.div>

        {/* Time Filter */}
        <motion.div variants={itemVariants} className="flex justify-end">
          <select
            value={days}
            onChange={e => onDaysChange(Number(e.target.value))}
            className="px-6 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-100 font-semibold hover:border-purple-500/50 transition-all duration-300 cursor-pointer hover:bg-slate-800"
          >
            {[7, 30, 90, 365].map(d => (
              <option key={d} value={d}>
                Last {d} days
              </option>
            ))}
          </select>
        </motion.div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-12"
      >
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="group relative"
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-20 rounded-2xl blur-xl transition-all duration-500`} />
              <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-xl hover:border-slate-600/50 transition-all duration-300">
                <div className={`inline-flex p-3 rounded-lg ${stat.bgColor} mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-slate-400 text-sm font-semibold mb-1">{stat.label}</p>
                <p className="text-4xl font-black bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  {stat.value}
                </p>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Chart */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        whileHover={{ y: -4 }}
        className="max-w-7xl mx-auto bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-3xl p-8 backdrop-blur-xl mb-12"
      >
        <h2 className="text-2xl font-black text-white mb-6">Daily Activity</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                <stop offset="100%" stopColor="#a855f7" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
            <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '13px', fontWeight: 500 }} />
            <YAxis stroke="#94a3b8" style={{ fontSize: '13px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(100, 116, 139, 0.3)',
                borderRadius: '12px',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
              }}
              cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
            />
            <Bar dataKey="sessions" fill="url(#barGradient)" radius={[12, 12, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Recent Sessions */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto"
      >
        <h2 className="text-2xl font-black text-white mb-6">Recent Sessions</h2>
        <div className="space-y-3">
          {(timeline.events || []).slice(0, 8).map((event, idx) => (
            <motion.div
              key={event.session_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ x: 8 }}
              className="group bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl p-4 hover:border-purple-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all duration-300">
                    {event.title || 'Untitled Session'}
                  </h3>
                  {event.summary && (
                    <p className="text-sm text-slate-400 mt-2 line-clamp-2">{event.summary}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {(event.topics || []).slice(0, 3).map(t => (
                      <span
                        key={t}
                        className="px-3 py-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold rounded-full"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-lg px-3 py-2">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-bold text-cyan-300">
                      {(event.tokens_used || 0).toLocaleString()} T
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{event.timestamp?.slice(0, 10)}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
