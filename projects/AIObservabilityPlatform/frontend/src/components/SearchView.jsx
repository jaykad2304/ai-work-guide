import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { searchAPI } from '../api'
import { Search, Zap, Tag } from 'lucide-react'

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-5xl font-black bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Search
          </h1>
          <p className="text-lg text-slate-400 font-medium">Find anything across your AI sessions</p>
        </motion.div>

        {/* Search Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative mb-12"
        >
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
          <div className="relative flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()}
                placeholder="Search sessions, topics, summaries..."
                className="w-full pl-14 pr-6 py-5 text-lg font-semibold rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={doSearch}
              disabled={loading}
              className="px-8 py-5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white text-lg font-black shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                  className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                'Search'
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {results && (
            <motion.div
              key={results.query}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-slate-400 text-lg font-semibold mb-6">
                <span className="text-white font-black">{results.results_count}</span> results for{' '}
                <span className="text-emerald-400">"{results.query}"</span>
              </p>

              <div className="space-y-4">
                {(results.results || []).map((event, idx) => (
                  <motion.div
                    key={event.session_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ y: -4, x: 4 }}
                    className="group bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-black text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-green-400 group-hover:to-cyan-400 group-hover:bg-clip-text transition-all duration-300">
                          {event.title || 'Untitled'}
                        </h3>
                        {event.summary && (
                          <p className="text-slate-400 text-sm mt-2 line-clamp-2">{event.summary}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-4">
                          {(event.topics || []).map(t => (
                            <span
                              key={t}
                              className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-slate-700/50 text-slate-300 border border-slate-600/50"
                            >
                              <Tag className="w-3 h-3" />
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="inline-block bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full mb-2">
                          {event.tool}
                        </span>
                        <div className="flex items-center gap-1.5 justify-end mt-2">
                          <Zap className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm font-bold text-yellow-300">
                            {(event.tokens_used || 0).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">{event.timestamp?.slice(0, 10)}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!results && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center py-24"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500/20 to-cyan-500/20 border border-green-500/20 flex items-center justify-center">
              <Search className="w-10 h-10 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-400 mb-2">Type something to search</h3>
            <p className="text-slate-500">Search across session titles, summaries, and topics</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
