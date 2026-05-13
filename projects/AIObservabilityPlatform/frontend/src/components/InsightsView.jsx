import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { insightsAPI } from '../api'
import { getRandomQuote } from '../constants/quotes'
import { Sparkles, TrendingUp, Lightbulb, Search } from 'lucide-react'

export default function InsightsView() {
  const [patterns, setPatterns]   = useState([])
  const [recs, setRecs]           = useState([])
  const [stats, setStats]         = useState(null)
  const [quote]                   = useState(getRandomQuote())

  useEffect(() => {
    insightsAPI.getPatterns().then(r       => setPatterns(r.data.patterns || []))
    insightsAPI.getRecommendations().then(r => setRecs(r.data.recommendations || []))
    insightsAPI.getStats().then(r          => setStats(r.data))
  }, [])

  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }
  const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }

  return (
    <div className="p-8 lg:p-10 min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Insights</h1>
          <p className="text-slate-500 mt-1 text-base font-medium">Patterns discovered from your AI usage</p>
        </motion.div>

        {/* Quote banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          whileHover={{ scale: 1.01 }}
          className="relative mb-10 rounded-3xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #ec4899 100%)' }}
        >
          {/* Subtle blob */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10 blur-xl" />
          <div className="relative px-10 py-8 flex items-start gap-5">
            <Sparkles className="w-8 h-8 text-yellow-300 shrink-0 mt-0.5" />
            <p className="text-xl font-bold text-white italic leading-relaxed">&ldquo;{quote}&rdquo;</p>
          </div>
        </motion.div>

        {/* Stats */}
        {stats && (
          <motion.div
            variants={container} initial="hidden" animate="show"
            className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10"
          >
            {/* Tools */}
            <motion.div variants={item} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <h2 className="text-lg font-black text-slate-900">Most Used Tools</h2>
              </div>
              {Object.entries(stats.most_used_tools || {}).length === 0 ? (
                <p className="text-slate-400 font-medium">No data yet</p>
              ) : (
                Object.entries(stats.most_used_tools || {}).map(([tool, count], idx) => {
                  const max = Math.max(...Object.values(stats.most_used_tools || {}), 1)
                  return (
                    <div key={tool} className="mb-5 last:mb-0">
                      <div className="flex justify-between text-sm font-semibold mb-2">
                        <span className="text-slate-700">{tool}</span>
                        <span className="text-indigo-600 font-black">{count}</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(count / max) * 100}%` }}
                          transition={{ delay: idx * 0.12 + 0.4, duration: 0.8, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </motion.div>

            {/* Topics */}
            <motion.div variants={item} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                  <Search className="w-5 h-5 text-violet-500" />
                </div>
                <h2 className="text-lg font-black text-slate-900">Favorite Topics</h2>
              </div>
              {Object.entries(stats.favorite_topics || {}).length === 0 ? (
                <p className="text-slate-400 font-medium">No data yet</p>
              ) : (
                Object.entries(stats.favorite_topics || {}).slice(0, 7).map(([topic, count], idx) => {
                  const max = Math.max(...Object.values(stats.favorite_topics || {}), 1)
                  return (
                    <motion.div
                      key={topic}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.06 + 0.4 }}
                      className="flex items-center justify-between mb-4 last:mb-0"
                    >
                      <span className="text-sm font-semibold text-slate-700 capitalize">{topic}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(count / max) * 100}%` }}
                            transition={{ delay: idx * 0.06 + 0.5, duration: 0.7, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ background: 'linear-gradient(90deg, #8b5cf6, #ec4899)' }}
                          />
                        </div>
                        <span className="text-sm font-black text-violet-600 w-4 text-right">{count}</span>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Patterns + Recommendations — side by side on large screens */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Patterns */}
          {patterns.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                  <Search className="w-5 h-5 text-amber-500" />
                </div>
                <h2 className="text-lg font-black text-slate-900">Detected Patterns</h2>
              </div>
              <div className="space-y-4">
                {patterns.map((p, idx) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.06 + 0.5 }}
                    whileHover={{ x: 4 }}
                    className="flex gap-4 p-4 rounded-xl bg-amber-50 border border-amber-100 transition-all duration-150"
                  >
                    <Search className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{p.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="h-1.5 rounded-full bg-amber-200 overflow-hidden" style={{ width: 60 }}>
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${p.confidence}%` }} />
                        </div>
                        <span className="text-xs font-bold text-amber-600">{Math.round(p.confidence)}%</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Recommendations */}
          {recs.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-emerald-500" />
                </div>
                <h2 className="text-lg font-black text-slate-900">Recommendations</h2>
              </div>
              <div className="space-y-4">
                {recs.map((r, idx) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.06 + 0.6 }}
                    whileHover={{ x: 4 }}
                    className="flex gap-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100 transition-all duration-150"
                  >
                    <Lightbulb className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-sm font-semibold text-slate-800">{r.content}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Empty state */}
        {!stats && patterns.length === 0 && recs.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="flex flex-col items-center justify-center py-32"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-100 to-violet-100 border border-indigo-200 flex items-center justify-center mb-6"
            >
              <Sparkles className="w-10 h-10 text-indigo-500" />
            </motion.div>
            <h3 className="text-2xl font-black text-slate-700 mb-2">Insights generating...</h3>
            <p className="text-slate-400 font-medium">Use more AI sessions to unlock pattern detection</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
