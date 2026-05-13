import { useState } from 'react'
import { searchAPI } from '../api'

export default function SearchView() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  const doSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const r = await searchAPI.search(query)
      setResults(r.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Search</h1>
      <p className="text-slate-500 text-sm mb-6">Search across all your AI sessions</p>

      <div className="flex gap-3 mb-8">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && doSearch()}
          placeholder="Search sessions, topics, summaries..."
          className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <button
          onClick={doSearch}
          className="px-5 py-3 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700"
        >
          {loading ? '...' : 'Search'}
        </button>
      </div>

      {results && (
        <div>
          <div className="text-sm text-slate-500 mb-4">
            {results.results_count} results for "{results.query}"
          </div>
          <div className="space-y-3">
            {(results.results || []).map(event => (
              <div
                key={event.session_id}
                className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-sm transition-shadow"
              >
                <div className="font-medium text-slate-800 text-sm">{event.title}</div>
                <div className="text-xs text-slate-500 mt-1 line-clamp-2">{event.summary}</div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(event.topics || []).map(t => (
                    <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  {event.timestamp?.slice(0, 10)} · {event.tool}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
