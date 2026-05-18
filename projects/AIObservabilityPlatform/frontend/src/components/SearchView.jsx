import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { searchAPI } from '../api'
import { Search, Sparkles } from 'lucide-react'
import PageShell from './PageShell'
import SessionDigestCard from './SessionDigestCard'

const SUGGESTIONS = ['python', 'react', 'debugging', 'database', 'API', 'docker']

export default function SearchView({ theme = 'light', onThemeChange }) {
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
    <PageShell
      theme={theme}
      onThemeChange={onThemeChange}
      title="Search"
      eyebrow="Knowledge lookup"
      description="Find sessions, topics, summaries, and work trails across your local AI history."
      icon={Search}
      tone="blue"
      maxWidth="content"
    >
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }} className="mb-8">
          <div className="search-console">
            <div className="search-input-wrap">
              <Search className="search-input-icon" />
              <input value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key==='Enter' && doSearch()}
                placeholder="Search sessions, topics, summaries..."
                className="search-input"
              />
            </div>

            <motion.button whileHover={{ scale:1.04, y:-2 }} whileTap={{ scale:0.97 }}
              onClick={() => doSearch()} disabled={loading}
              className="search-button">
              <span>
                {loading
                  ? <motion.div animate={{ rotate:360 }} transition={{ repeat:Infinity, duration:0.65, ease:'linear' }}
                      className="search-spinner" />
                  : <Search style={{width:18,height:18}} />
                }
                {loading ? 'Searching…' : 'Search'}
              </span>
            </motion.button>
          </div>

          {!results && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}
              className="suggestion-row">
              <span>Try</span>
              {SUGGESTIONS.map((s,i) => (
                <motion.button key={s}
                  initial={{ opacity:0, scale:0.85 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.3+i*0.05 }}
                  whileHover={{ scale:1.06, y:-1 }} whileTap={{ scale:0.95 }}
                  onClick={() => doSearch(s)}
                  className="page-pill page-pill--blue">
                  {s}
                </motion.button>
              ))}
            </motion.div>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {results && (
            <motion.div key={results.query} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
              <div className="search-results-header">
                <p>
                  <strong>{results.results_count}</strong> results for <span>"{results.query}"</span>
                </p>
                <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                  onClick={() => { setResults(null); setQuery('') }}
                  className="ghost-action">
                  Clear
                </motion.button>
              </div>

              <div className="page-list">
                {(results.results||[]).map((event, idx) => (
                  <SessionDigestCard key={event.session_id || idx} event={event} index={idx} variant={theme} compact />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!results && !loading && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}
            className="page-empty-state">
            <motion.div animate={{ y:[0,-8,0] }} transition={{ repeat:Infinity, duration:3.5, ease:'easeInOut' }}
              className="page-empty-icon">
              <Sparkles style={{ width: 34, height: 34 }} />
            </motion.div>
            <h3>Search your AI sessions</h3>
            <p>Search across session titles, summaries, and topics. All local AI work, instantly findable.</p>
          </motion.div>
        )}
    </PageShell>
  )
}
