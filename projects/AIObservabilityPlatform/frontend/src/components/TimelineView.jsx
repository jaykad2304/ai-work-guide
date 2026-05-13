export default function TimelineView({ timeline, days, onDaysChange }) {
  if (!timeline) return null

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Timeline</h1>
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

      {!timeline.daily_summaries?.length ? (
        <div className="text-center py-20 text-slate-400">
          No sessions in this period.
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />
          <div className="space-y-8">
            {timeline.daily_summaries.map(day => {
              const dayEvents = (timeline.events || []).filter(e =>
                e.timestamp?.startsWith(day.date)
              )
              return (
                <div key={day.date} className="relative pl-12">
                  <div className="absolute left-[18px] w-4 h-4 rounded-full bg-indigo-500 border-2 border-white shadow" />
                  <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-slate-100">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="font-semibold text-slate-800">
                          {new Date(day.date + 'T12:00:00').toLocaleDateString(
                            'en-US',
                            {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                            }
                          )}
                        </div>
                        <div className="flex gap-3 text-xs text-slate-500">
                          <span>{day.total_events} sessions</span>
                          <span>·</span>
                          <span>{(day.total_tokens || 0).toLocaleString()} tokens</span>
                          <span>·</span>
                          <span>{Math.round(day.activity_score)}% activity</span>
                        </div>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {dayEvents.map(event => (
                        <div key={event.session_id} className="px-5 py-4 hover:bg-slate-50">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-slate-800">
                                {event.title || 'Untitled'}
                              </div>
                              {event.summary && (
                                <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                                  {event.summary}
                                </div>
                              )}
                              <div className="flex flex-wrap gap-1 mt-2">
                                {(event.topics || []).slice(0, 3).map(t => (
                                  <span
                                    key={t}
                                    className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="text-xs text-slate-400 text-right shrink-0">
                              <div>{(event.tokens_used || 0).toLocaleString()} tok</div>
                              <div className="mt-1">{event.duration_minutes}m</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
