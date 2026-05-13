import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { searchAPI } from '../api'
import { Search, Zap, Tag, Sparkles } from 'lucide-react'

const SUGGESTIONS = ['python', 'react', 'debugging', 'database', 'API', 'docker']

export default function SearchView() {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  const doSearch = async (q = query) => {
    if (!q.trim()) return
    setQuery(q); setLoading(true)
    try { const r = await searchAPI.search(q); setResults(r.data) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  return (
    <div className="p-8 lg:p-10 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }} className="mb-10">
          <h1 className="text-4xl font-black text-white tracking-tight leading-none mb-1.5">Search</h1>
          <p className="text-slate-500 text-sm font-medium">Find anything across your AI sessions</p>
        </motion.div>

        {/* Search bar */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }} className="mb-8">
          <div className="flex gap-3 items-stretch">
            <div className="flex-1 relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key==='Enter' && doSearch()}
                placeholder="Search sessions, topics, summaries..."
                className="w-full h-14 pl-14 pr-5 text-base font-semibold rounded-2xl glass text-slate-200 placeholder:text-slate-600 focus:outline-none transition-all duration-200"
                style={{ '&:focus': { borderColor:'rgba(129,140,248,0.4)' } }}
                onFocus={e => e.target.style.borderColor='rgba(129,140,248,0.35)'}
                onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.09)'}
              />
            </div>

            {/* THE search button */}
            <motion.button whileHover={{ scale:1.04, y:-2 }} whileTap={{ scale:0.97 }}
              onClick={() => doSearch()} disabled={loading}
              className="relative h-14 px-8 rounded-2xl font-black text-base text-white overflow-hidden disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 55%, #a78bfa 100%)',
                boxShadow: '0 8px 32px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}>
              {/* Shimmer sweep */}
              <motion.div className="absolute inset-0"
                style={{ background:'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%)' }}
                animate={{ x: ['-100%','200%'] }} transition={{ repeat:Infinity, duration:2.2, ease:'easeInOut' }} />
              <span className="relative flex items-center gap-2.5">
                {loading
                  ? <motion.div animate={{ rotate:360 }} transition={{ repeat:Infinity, duration:0.65, ease:'linear' }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  : <Search className="w-4.5 h-4.5" style={{width:18,height:18}} />
                }
                {loading ? 'Searching…' : 'Search'}
              </span>
            </motion.button>
          </div>

          {/* Suggestion chips */}
          {!results && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}
              className="flex flex-wrap gap-2 mt-4 items-center">
              <span className="text-xs text-slate-600 font-semibold">Try:</span>
              {SUGGESTIONS.map((s,i) => (
                <motion.button key={s}
                  initial={{ opacity:0, scale:0.85 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.3+i*0.05 }}
                  whileHover={{ scale:1.06, y:-1 }} whileTap={{ scale:0.95 }}
                  onClick={() => doSearch(s)}
                  className="glass px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-400 hover:text-indigo-300 transition-colors duration-150"
                  style={{ border:'1px solid rgba(255,255,255,0.08)' }}>
                  {s}
                </motion.button>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {results && (
            <motion.div key={results.query} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm font-semibold text-slate-500">
                  <span className="text-white font-black text-lg">{results.results_count}</span> results for{' '}
                  <span className="font-black" style={{ color:'#818cf8' }}>"{results.query}"</span>
                </p>
                <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                  onClick={() => { setResults(null); setQuery('') }}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-300 px-3 py-1.5 rounded-lg glass transition-all">
                  Clear
                </motion.button>
              </div>

              <div className="space-y-3">
                {(results.results||[]).map((event, idx) => (
                  <motion.div key={event.session_id}
                    initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:idx*0.04 }}
                    whileHover={{ y:-3, boxShadow:'0 16px 40px rgba(99,102,241,0.15)' }}
                    className="glass rounded-2xl p-5 cursor-pointer transition-all duration-200"
                    style={{ border:'1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex items-start justify-between gap-5">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-black text-white mb-1">{event.title||'Untitled'}</h3>
                        {event.summary && <p className="text-xs text-slate-500 line-clamp-2 mb-3">{event.summary}</p>}
                        <div className="flex flex-wrap gap-1.5">
                          {(event.topics||[]).map(t => (
                            <span key={t} className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ color:'#818cf8', background:'rgba(129,140,248,0.1)', border:'1px solid rgba(129,140,248,0.18)' }}>
                              <Tag style={{width:9,height:9}} />{t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="inline-block text-[10px] font-bold px-3 py-1.5 rounded-lg mb-2"
                          style={{ color:'#2dd4bf', background:'rgba(45,212,191,0.1)', border:'1px solid rgba(45,212,191,0.2)' }}>
                          {event.tool}
                        </span>
                        <div className="flex items-center gap-1.5 justify-end">
                          <Zap style={{width:12,height:12,color:'#fbbf24'}} />
                          <span className="text-xs font-bold text-amber-400">{(event.tokens_used||0).toLocaleString()}</span>
                        </div>
                        <p className="text-[10px] font-semibold text-slate-600 mt-1.5">{event.timestamp?.slice(0,10)}</p>
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
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}
            className="flex flex-col items-center justify-center py-28">
            <motion.div animate={{ y:[0,-8,0] }} transition={{ repeat:Infinity, duration:3.5, ease:'easeInOut' }}
              className="w-20 h-20 rounded-2xl glass flex items-center justify-center mb-6">
              <Sparkles className="w-9 h-9" style={{ color:'#818cf8' }} />
            </motion.div>
            <h3 className="text-xl font-black text-slate-400 mb-1.5">Search your AI sessions</h3>
            <p className="text-slate-600 text-sm text-center max-w-sm">
              Search across session titles, summaries, and topics — all your AI work, instantly findable.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
