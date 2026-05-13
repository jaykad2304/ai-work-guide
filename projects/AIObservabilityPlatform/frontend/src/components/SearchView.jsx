import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { searchAPI } from '../api'
import { Search, Zap, Tag, Sparkles } from 'lucide-react'

const SUGGESTIONS = ['python', 'react', 'debugging', 'database', 'API', 'deployment']

export default function SearchView() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  const doSearch = async (q = query) => {
    if (!q.trim()) return
    setQuery(q)
    setLoading(true)
    try {
      const r = await searchAPI.search(q)
      setResults(r.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 lg:p-10 min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Search</h1>
          <p className="text-slate-500 mt-1 text-base font-medium">Find anything across your AI sessions</p>
        </motion.div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex gap-3 items-stretch">
            {/* Input */}
            <div className="flex-1 relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()}
                placeholder="Search sessions, topics, summaries..."
                className="w-full h-16 pl-14 pr-5 text-lg font-semibold rounded-2xl bg-white border-2 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 shadow-sm transition-all duration-200"
              />
            </div>

            {/* Search button — the star of the show */}
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => doSearch()}
              disabled={loading}
              className="relative h-16 px-8 rounded-2xl font-black text-lg text-white shadow-lg overflow-hidden disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.45)',
              }}
            >
              {/* Animated shimmer */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              />
              <span className="relative flex items-center gap-2.5">
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                {loading ? 'Searching...' : 'Search'}
              </span>
            </motion.button>
          </div>

          {/* Suggestion chips */}
          {!results && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-2 mt-4"
            >
              <span className="text-sm text-slate-400 font-semibold self-center">Try:</span>
              {SUGGESTIONS.map((s, i) => (
                <motion.button
                  key={s}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => doSearch(s)}
                  className="px-4 py-1.5 bg-white border border-slate-200 rounded-full text-sm font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-150 shadow-sm"
                >
                  {s}
                </motion.button>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {results && (
            <motion.div
              key={results.query}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-5">
                <p className="text-slate-600 font-semibold text-base">
                  <span className="text-slate-900 font-black text-xl">{results.results_count}</span> results for{' '}
                  <span className="text-indigo-600 font-black">"{results.query}"</span>
                </p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setResults(null); setQuery('') }}
                  className="text-sm font-semibold text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-all"
                >
                  Clear
                </motion.button>
              </div>

              <div className="space-y-3">
                {(results.results || []).map((event, idx) => (
                  <motion.div
                    key={event.session_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    whileHover={{ y: -3, boxShadow: '0 12px 32px rgba(99,102,241,0.1)' }}
                    className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm transition-all duration-200 cursor-pointer hover:border-indigo-200"
                  >
                    <div className="flex items-start justify-between gap-5">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-black text-slate-900 mb-1">{event.title || 'Untitled'}</h3>
                        {event.summary && (
                          <p className="text-sm text-slate-500 line-clamp-2 mb-3">{event.summary}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {(event.topics || []).map(t => (
                            <span key={t} className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                              <Tag style={{ width: 10, height: 10 }} />{t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="inline-block bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-lg mb-2">
                          {event.tool}
                        </span>
                        <div className="flex items-center gap-1.5 justify-end">
                          <Zap style={{ width: 13, height: 13, color: '#f59e0b' }} />
                          <span className="text-sm font-bold text-amber-600">{(event.tokens_used || 0).toLocaleString()}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-400 mt-1.5">{event.timestamp?.slice(0, 10)}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {!results && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col items-center justify-center py-28"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-100 to-violet-100 border border-indigo-200 flex items-center justify-center mb-6"
            >
              <Sparkles className="w-10 h-10 text-indigo-500" />
            </motion.div>
            <h3 className="text-2xl font-black text-slate-700 mb-2">Search your AI sessions</h3>
            <p className="text-slate-400 font-medium text-center max-w-sm">
              Search across session titles, summaries, and topics — all your AI work, instantly searchable.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
