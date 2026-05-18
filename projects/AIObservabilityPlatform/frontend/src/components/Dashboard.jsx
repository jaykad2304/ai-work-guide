import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts'
import { motion } from 'framer-motion'
import { BrainCircuit, TrendingUp, Zap, Calendar, Target, ShieldCheck, ServerCog, Gauge, GitBranch, Sun, Moon } from 'lucide-react'
import SessionDigestCard from './SessionDigestCard'

const STATS = [
  { key: 'sessions', label: 'Observed Sessions', icon: TrendingUp, color: '#3b82f6', helper: 'Trace volume', tone: 'blue' },
  { key: 'tokens', label: 'Token Throughput', icon: Zap, color: '#f59e0b', helper: 'Cumulative burn', tone: 'amber' },
  { key: 'days', label: 'Active Days', icon: Calendar, color: '#22c55e', helper: 'Coverage window', tone: 'green' },
  { key: 'topic', label: 'Primary Focus', icon: Target, color: '#8b5cf6', helper: 'Dominant signal', tone: 'violet' },
]

const CustomTooltip = ({ active, payload, label, theme = 'light' }) => {
  if (!active || !payload?.length) return null
  const dark = theme === 'dark'
  return (
    <div className={`rounded-lg border px-3 py-2 text-xs font-bold shadow-xl ${dark ? 'border-slate-700 bg-slate-950 text-slate-50' : 'border-slate-200 bg-white text-slate-950'}`}>
      <p className={`mb-1 font-mono text-[10px] uppercase tracking-[0.16em] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
      <p style={{ color: payload[0].color || '#0070f3' }}>{payload[0].value} {payload[0].name}</p>
    </div>
  )
}

function getPeakDay(chartData) {
  if (!chartData.length) return null
  return chartData.reduce((best, entry) => (entry.sessions > best.sessions ? entry : best), chartData[0])
}

function getPrimaryFocus(timeline, events) {
  const blocked = new Set(['not', 'no', 'none', 'unknown', 'general', 'you', 'use', 'all', 'now', 'let'])
  const candidates = [
    ...(timeline.daily_summaries?.flatMap(day => day.primary_topics || []) || []),
    ...events.flatMap(event => event.topics || []),
  ]

  const topic = candidates.find(candidate => {
    const normalized = String(candidate || '').trim().toLowerCase()
    return normalized.length > 2 && !blocked.has(normalized)
  })

  return topic || 'Dashboard'
}

export default function Dashboard({ timeline, days, onDaysChange, theme = 'light', onThemeChange }) {
  if (!timeline) return null

  const events = timeline.events || []
  const latestEvent = events[0]
  const totalTokens = events.reduce((sum, event) => sum + (event.tokens_used || 0), 0)
  const values = {
    sessions: timeline.total_events || 0,
    tokens: totalTokens.toLocaleString(),
    days: timeline.daily_summaries?.length || 0,
    topic: getPrimaryFocus(timeline, events),
  }

  const chartData = [...(timeline.daily_summaries || [])].reverse().map(day => ({
    date: day.date.slice(5),
    sessions: day.total_events,
    tokens: Math.round((day.total_tokens || 0) / 100),
  }))

  const peakDay = getPeakDay(chartData)
  const averageTokens = events.length ? Math.round(totalTokens / events.length) : 0
  const projectCount = new Set(events.map(event => event.project).filter(project => project && project !== 'unknown')).size
  const coveragePercent = Math.min(100, Math.round(((timeline.daily_summaries?.length || 0) / Math.max(days, 1)) * 100))
  const coverageTone = coveragePercent >= 70 ? 'green' : coveragePercent >= 25 ? 'amber' : 'red'
  const tokenTone = averageTokens > 50000 ? 'red' : averageTokens > 15000 ? 'amber' : 'green'
  const signalHealth = timeline.total_events > 0 ? 'Nominal' : 'Idle'
  const latestTool = latestEvent?.tool_label || latestEvent?.tool || 'No source'
  const latestCapture = latestEvent?.display_summary || latestEvent?.summary || latestEvent?.title || 'Waiting for a fresh capture'
  const momentumLabel = timeline.total_events > 0 ? 'Live capture active' : 'Waiting for first session'
  const isDark = theme === 'dark'
  const gridStroke = isDark ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.22)'
  const axisFill = isDark ? '#94a3b8' : '#64748b'
  const barCursor = isDark ? 'rgba(96,165,250,0.1)' : 'rgba(0,112,243,0.06)'

  const fade = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } } }
  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className={`dashboard-shell dashboard-shell--premium dashboard-shell--${theme} p-4 sm:p-6 lg:px-10 lg:py-8`}>
      <motion.section variants={fade} className="dashboard-overview-bar mb-5">
        <div className="dashboard-overview-copy">
          <div className="dashboard-signal-row mb-3">
            <span className="dashboard-signal-pill">AI Observability</span>
            <span className="dashboard-signal-text">{momentumLabel}</span>
          </div>
          <h1 className="dashboard-title">Session intelligence dashboard</h1>
          <p className="dashboard-copy">Track AI work volume, token burn, coverage, and recent session quality from one focused operations surface.</p>
        </div>

        <div className="dashboard-brain-mark" aria-hidden="true">
          <BrainCircuit style={{ width: 68, height: 68 }} />
          <span />
        </div>

        <div className="dashboard-overview-side">
          <div className="dashboard-control-row">
            <div className="dashboard-theme-toggle" aria-label="Theme selector">
              <button className={theme === 'light' ? 'is-active' : ''} type="button" onClick={() => onThemeChange?.('light')} aria-pressed={theme === 'light'}>
                <Sun style={{ width: 13, height: 13 }} /> Light
              </button>
              <button className={theme === 'dark' ? 'is-active' : ''} type="button" onClick={() => onThemeChange?.('dark')} aria-pressed={theme === 'dark'}>
                <Moon style={{ width: 13, height: 13 }} /> Dark
              </button>
            </div>
            <div className="dashboard-select-wrap">
              <span>Window</span>
              <select value={days} onChange={e => onDaysChange(Number(e.target.value))} className="dashboard-select">
                {[1, 7, 30, 90, 365].map(dayCount => <option key={dayCount} value={dayCount}>Last {dayCount} day{dayCount === 1 ? '' : 's'}</option>)}
              </select>
            </div>
          </div>

          <div className="dashboard-ops-strip">
            {[
              { label: 'Signal Health', value: signalHealth, icon: ShieldCheck, tone: 'green' },
              { label: 'Coverage', value: `${coveragePercent}%`, icon: Gauge, tone: coverageTone },
              { label: 'Latest Source', value: latestTool, icon: ServerCog, tone: 'blue' },
            ].map(item => {
              const Icon = item.icon
              return (
                <div key={item.label} className={`dashboard-ops-item dashboard-ops-item--${item.tone}`}>
                  <Icon style={{ width: 16, height: 16 }} />
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              )
            })}
          </div>
        </div>
      </motion.section>

      <motion.section variants={stagger} className="dashboard-stat-grid mb-4">
        {STATS.map(stat => {
          const Icon = stat.icon
          const isText = stat.key === 'topic'
          return (
            <motion.div key={stat.key} variants={fade} whileHover={{ y: -2 }} className={`dashboard-stat-card dashboard-stat-card--${stat.tone}`}>
              <div className="dashboard-stat-top">
                <div className="dashboard-stat-icon" style={{ color: stat.color, background: `${stat.color}18`, borderColor: `${stat.color}35` }}>
                  <Icon style={{ width: 17, height: 17 }} />
                </div>
                <span className="dashboard-stat-helper">{stat.helper}</span>
              </div>
              <p className={`dashboard-stat-value ${isText ? 'dashboard-stat-value--text' : ''}`}>{values[stat.key]}</p>
              <p className="dashboard-stat-label">{stat.label}</p>
            </motion.div>
          )
        })}
      </motion.section>

      <motion.section variants={stagger} className="dashboard-density-strip mb-4">
        {[
          { label: 'Trace cadence', value: peakDay ? `${peakDay.sessions}/day` : '0/day', icon: Target, tone: 'blue' },
          { label: 'Avg token burn', value: averageTokens.toLocaleString(), icon: Zap, tone: tokenTone },
          { label: 'Projects watched', value: projectCount || 0, icon: GitBranch, tone: 'green' },
          { label: 'Latest capture', value: latestCapture, icon: ShieldCheck, tone: 'blue' },
        ].map(item => {
          const Icon = item.icon
          return (
            <motion.div key={item.label} variants={fade} className={`dashboard-density-item dashboard-density-item--${item.tone}`}>
              <Icon style={{ width: 15, height: 15 }} />
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </motion.div>
          )
        })}
      </motion.section>

      <div className="dashboard-chart-grid mb-0">
        <motion.div variants={fade} className="dashboard-chart-card dashboard-chart-card--sessions">
          <div className="dashboard-chart-header">
            <h2 className="dashboard-panel-title">Daily Sessions</h2>
            <span className="dashboard-panel-meta">Sessions / day</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={14}>
              <defs>
                <linearGradient id="barG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#67e8f9" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="date" stroke="transparent" tick={{ fontSize: 10, fill: axisFill, fontWeight: 700, fontFamily: 'monospace' }} />
              <YAxis stroke="transparent" tick={{ fontSize: 10, fill: axisFill }} width={24} />
              <Tooltip content={<CustomTooltip theme={theme} />} cursor={{ fill: barCursor }} />
              <Bar dataKey="sessions" fill="url(#barG)" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={fade} className="dashboard-chart-card dashboard-chart-card--tokens">
          <div className="dashboard-chart-header">
            <h2 className="dashboard-panel-title">Token Flow</h2>
            <span className="dashboard-panel-meta">x100</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.26} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="date" stroke="transparent" tick={{ fontSize: 10, fill: axisFill, fontWeight: 700, fontFamily: 'monospace' }} />
              <YAxis stroke="transparent" tick={{ fontSize: 10, fill: axisFill }} width={24} />
              <Tooltip content={<CustomTooltip theme={theme} />} cursor={{ stroke: isDark ? 'rgba(251,191,36,0.45)' : 'rgba(245,158,11,0.3)', strokeWidth: 1 }} />
              <Area type="monotone" dataKey="tokens" stroke="#f59e0b" strokeWidth={2} fill="url(#areaG)" dot={{ r: 3, fill: '#fff', stroke: '#f59e0b', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.section variants={fade} className="dashboard-output-panel">
        <div className="dashboard-output-header">
          <div>
            <span className="dashboard-output-kicker">Primary output</span>
            <h2 className="dashboard-feed-title">Session Feed</h2>
            <p className="dashboard-feed-copy">Readable summaries with enough telemetry context to decide where to investigate next.</p>
          </div>
          <span className="dashboard-record-count">{events.length} Records</span>
        </div>
        <div className="dashboard-output-list">
          {events.slice(0, 10).map((event, idx) => (
            <SessionDigestCard key={event.session_id || event.id || idx} event={event} index={idx} variant={theme} compact />
          ))}
        </div>
      </motion.section>
    </motion.div>
  )
}
