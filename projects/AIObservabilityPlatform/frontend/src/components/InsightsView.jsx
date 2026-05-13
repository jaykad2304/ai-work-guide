import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { insightsAPI } from '../api'
import { getRandomQuote } from '../constants/quotes'
import { Sparkles, TrendingUp, Lightbulb, Search } from 'lucide-react'

export default function InsightsView() {
  const [patterns, setPatterns] = useState([])
  const [recs, setRecs] = useState([])
  const [stats, setStats] = useState(null)
  const [quote] = useState(getRandomQuote())

  useEffect(() => {
    insightsAPI.getPatterns().then(r => setPatterns(r.data.patterns || []))
    insightsAPI.getRecommendations().then(r => setRecs(r.data.recommendations || []))
    insightsAPI.getStats().then(r => setStats(r.data))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-5xl font-black bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent mb-2">
            Insights
          </h1>
          <p className="text-lg text-slate-400 font-medium">Patterns discovered from your AI usage</p>
        </motion.div>

        {/* Sarcastic Quote Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
          className="relative mb-10 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-90" />
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-white/10"
                style={{
                  width: Math.random() * 200 + 60,
                  height: Math.random() * 200 + 60,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.05, 0.15, 0.05],
                }}
                transition={{
                  duration: 4 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
          <div className="relative p-8 flex items-start gap-5">
            <Sparkles className="w-8 h-8 text-yellow-300 shrink-0 mt-1" />
            <p className="text-xl font-bold text-white italic leading-relaxed">"{quote}"</p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10"
          >
            {/* Most Used Tools */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-xl font-black text-white">Most Used Tools</h2>
              </div>
              {Object.entries(stats.most_used_tools || {}).length > 0 ? (
                Object.entries(stats.most_used_tools || {}).map(([tool, count], idx) => (
                  <motion.div
                    key={tool}
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ delay: idx * 0.1 + 0.5 }}
                    className="mb-4 last:mb-0"
                  >
                    <div className="flex justify-between text-sm font-semibold mb-2">
                      <span className="text-slate-300">{tool}</span>
                      <span className="text-blue-400 font-black text-base">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '75%' }}
                        transition={{ delay: idx * 0.1 + 0.6, duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                      />
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-slate-400 text-sm">No tool data yet</p>
              )}
            </div>

            {/* Favorite Topics */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Search className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-xl font-black text-white">Favorite Topics</h2>
              </div>
              <div className="space-y-3">
                {Object.entries(stats.favorite_topics || {})
                  .slice(0, 6)
                  .map(([topic, count], idx) => (
                    <motion.div
                      key={topic}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08 + 0.5 }}
                      className="flex items-center justify-between"
                    >
                      <span className="text-slate-300 font-semibold text-sm capitalize">{topic}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${Math.min(count * 10, 80)}px` }} />
                        <span className="text-purple-400 font-black text-sm w-6 text-right">{count}</span>
                      </div>
                    </motion.div>
                  ))}
                {Object.keys(stats.favorite_topics || {}).length === 0 && (
                  <p className="text-slate-400 text-sm">No topic data yet</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Patterns */}
        {patterns.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-black text-white mb-5 flex items-center gap-3">
              <Search className="w-7 h-7 text-yellow-400" />
              Detected Patterns
            </h2>
            <div className="space-y-3">
              {patterns.map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.06 + 0.5 }}
                  whileHover={{ x: 6 }}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-yellow-500/30 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-yellow-500/10 shrink-0">
                      <Search className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">{p.content}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 rounded-full bg-slate-700 w-24 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
                            style={{ width: `${p.confidence}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-400 font-semibold">{Math.round(p.confidence)}% confidence</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recommendations */}
        {recs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-2xl font-black text-white mb-5 flex items-center gap-3">
              <Lightbulb className="w-7 h-7 text-orange-400" />
              Recommendations
            </h2>
            <div className="space-y-3">
              {recs.map((r, idx) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.06 + 0.6 }}
                  whileHover={{ x: 6 }}
                  className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-5 hover:border-amber-500/40 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-amber-500/20 shrink-0">
                      <Lightbulb className="w-5 h-5 text-amber-400" />
                    </div>
                    <p className="text-slate-200 font-semibold">{r.content}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* No data state */}
        {!stats && patterns.length === 0 && recs.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center py-24"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/20 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-yellow-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-400 mb-2">Insights generating...</h3>
            <p className="text-slate-500">Use more AI sessions to unlock pattern detection</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
