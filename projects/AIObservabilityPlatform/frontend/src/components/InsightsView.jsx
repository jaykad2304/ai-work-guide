import { useEffect, useState } from 'react'
import { insightsAPI } from '../api'
import { getRandomQuote } from '../constants/quotes'

export default function InsightsView() {
  const [patterns, setPatterns] = useState([])
  const [recs, setRecs] = useState([])
  const [stats, setStats] = useState(null)

  useEffect(() => {
    insightsAPI.getPatterns().then(r => setPatterns(r.data.patterns || []))
    insightsAPI.getRecommendations().then(r => setRecs(r.data.recommendations || []))
    insightsAPI.getStats().then(r => setStats(r.data))
  }, [])

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Insights</h1>
      <p className="text-slate-500 text-sm mb-8">Patterns and recommendations from your AI usage</p>

      <div className="bg-gradient-to-r from-indigo-500 to-violet-500 rounded-xl p-5 text-white mb-8">
        <div className="text-base font-medium italic">"{getRandomQuote()}"</div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-100 p-4">
            <div className="text-xs text-slate-500 mb-2 font-medium">Most Used Tools</div>
            {Object.entries(stats.most_used_tools || {}).map(([tool, count]) => (
              <div key={tool} className="flex justify-between text-sm py-1">
                <span className="text-slate-700">{tool}</span>
                <span className="font-medium text-indigo-600">{count}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-4">
            <div className="text-xs text-slate-500 mb-2 font-medium">Favorite Topics</div>
            {Object.entries(stats.favorite_topics || {})
              .slice(0, 5)
              .map(([topic, count]) => (
                <div key={topic} className="flex justify-between text-sm py-1">
                  <span className="text-slate-700">{topic}</span>
                  <span className="font-medium text-indigo-600">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {patterns.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Detected Patterns</h2>
          <div className="space-y-2">
            {patterns.map(p => (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-slate-100 p-4 flex items-start gap-3"
              >
                <span>🔍</span>
                <div>
                  <div className="text-sm text-slate-800">{p.content}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Confidence: {Math.round(p.confidence)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recs.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Recommendations</h2>
          <div className="space-y-2">
            {recs.map(r => (
              <div
                key={r.id}
                className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3"
              >
                <span>💡</span>
                <div className="text-sm text-slate-700">{r.content}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
