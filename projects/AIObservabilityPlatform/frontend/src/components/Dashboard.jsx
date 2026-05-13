import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function Dashboard({ timeline, days, onDaysChange }) {
  if (!timeline) return null

  const stats = [
    { label: 'Sessions', value: timeline.total_events, icon: '🗂️' },
    { label: 'Tokens', value: (timeline.events?.reduce((s, e) => s + (e.tokens_used || 0), 0) || 0).toLocaleString(), icon: '🔤' },
    { label: 'Active Days', value: timeline.daily_summaries?.length || 0, icon: '📅' },
    { label: 'Top Topic', value: timeline.daily_summaries?.[0]?.primary_topics?.[0] || 'N/A', icon: '🎯' },
  ]

  const chartData = [...(timeline.daily_summaries || [])].reverse().map(d => ({
    date: d.date.slice(5),
    sessions: d.total_events
  }))

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Your AI activity at a glance</p>
        </div>
        <select
          value={days}
          onChange={e => onDaysChange(Number(e.target.value))}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-600"
        >
          {[7, 30, 90, 365].map(d => (
            <option key={d} value={d}>
              Last {d} days
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div
            key={s.label}
            className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm"
          >
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold text-slate-900">{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Daily Sessions</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,.1)',
              }}
            />
            <Bar dataKey="sessions" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Recent Sessions</h2>
        <div className="space-y-3">
          {(timeline.events || []).slice(0, 5).map(event => (
            <div
              key={event.session_id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50"
            >
              <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-800 truncate">
                  {event.title || 'Untitled session'}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {event.timestamp?.slice(0, 10)} · {(event.tokens_used || 0).toLocaleString()} tokens
                </div>
              </div>
              <div className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full shrink-0">
                {event.tool}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
