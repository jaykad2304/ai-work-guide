import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { insightsAPI } from '../api'
import { getRandomQuote } from '../constants/quotes'
import { Sparkles, TrendingUp, Lightbulb, Search } from 'lucide-react'
import PageShell from './PageShell'

export default function InsightsView({ theme = 'light', onThemeChange }) {
  const [patterns, setPatterns]   = useState([])
  const [recs, setRecs]           = useState([])
  const [stats, setStats]         = useState(null)
  const [quote]                   = useState(getRandomQuote())

  useEffect(() => {
    insightsAPI.getPatterns().then(r        => setPatterns(r.data.patterns || []))
    insightsAPI.getRecommendations().then(r => setRecs(r.data.recommendations || []))
    insightsAPI.getStats().then(r           => setStats(r.data))
  }, [])

  const stagger = { hidden:{}, show:{ transition:{ staggerChildren:0.08 } } }
  const fade    = { hidden:{ opacity:0, y:16 }, show:{ opacity:1, y:0, transition:{ duration:0.4 } } }

  return (
    <PageShell
      theme={theme}
      onThemeChange={onThemeChange}
      title="Insights"
      eyebrow="Signal analysis"
      description="Patterns, tool usage, recommendations, and behavioral signals discovered from your AI sessions."
      icon={Sparkles}
      tone="violet"
    >
        <motion.div initial={{ opacity:0, scale:0.98 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.15 }}
          whileHover={{ scale:1.01 }}
          className="insight-banner">
          <div className="insight-banner-icon">
            <Sparkles style={{ width: 22, height: 22 }} />
          </div>
          <p>&ldquo;{quote}&rdquo;</p>
        </motion.div>

        {stats && (
          <motion.div variants={stagger} initial="hidden" animate="show" className="insight-grid">
            <motion.div variants={fade} className="ops-panel">
              <div className="ops-panel-heading">
                <div className="ops-panel-icon ops-panel-icon--blue">
                  <TrendingUp style={{width:18,height:18}} />
                </div>
                <h2>Most Used Tools</h2>
              </div>
              {Object.entries(stats.most_used_tools||{}).length === 0
                ? <p className="muted-copy">No data yet</p>
                : Object.entries(stats.most_used_tools||{}).map(([tool,count],idx) => {
                    const max = Math.max(...Object.values(stats.most_used_tools||{}),1)
                    return (
                      <div key={tool} className="metric-progress-row">
                        <div>
                          <span>{tool}</span>
                          <strong>{count}</strong>
                        </div>
                        <div className="metric-progress-track">
                          <motion.div initial={{ width:0 }} animate={{ width:`${(count/max)*100}%` }}
                            transition={{ delay:idx*0.1+0.4, duration:0.9, ease:'easeOut' }}
                            className="metric-progress-fill metric-progress-fill--blue" />
                        </div>
                      </div>
                    )
                  })
              }
            </motion.div>

            <motion.div variants={fade} className="ops-panel">
              <div className="ops-panel-heading">
                <div className="ops-panel-icon ops-panel-icon--violet">
                  <Search style={{width:18,height:18}} />
                </div>
                <h2>Favorite Topics</h2>
              </div>
              {Object.entries(stats.favorite_topics||{}).length === 0
                ? <p className="muted-copy">No data yet</p>
                : Object.entries(stats.favorite_topics||{}).slice(0,7).map(([topic,count],idx) => {
                    const max = Math.max(...Object.values(stats.favorite_topics||{}),1)
                    return (
                      <motion.div key={topic}
                        initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay:idx*0.06+0.4 }}
                        className="topic-count-row">
                        <span>{topic}</span>
                        <div className="metric-progress-track">
                          <motion.div initial={{ width:0 }} animate={{ width:`${(count/max)*100}%` }}
                            transition={{ delay:idx*0.06+0.5, duration:0.7 }}
                            className="metric-progress-fill metric-progress-fill--violet" />
                        </div>
                        <strong>{count}</strong>
                      </motion.div>
                    )
                  })
              }
            </motion.div>
          </motion.div>
        )}

        <div className="insight-grid">
          {patterns.length > 0 && (
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
              className="ops-panel">
              <div className="ops-panel-heading">
                <div className="ops-panel-icon ops-panel-icon--amber">
                  <Search style={{width:18,height:18}} />
                </div>
                <h2>Detected Patterns</h2>
              </div>
              <div className="insight-list">
                {patterns.map((p,idx) => (
                  <motion.div key={p.id}
                    initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay:idx*0.06+0.5 }}
                    whileHover={{ x:4 }}
                    className="insight-item insight-item--amber">
                    <Search style={{ width: 16, height: 16 }} />
                    <div>
                      <p>{p.content}</p>
                      <div className="confidence-row">
                        <div><span style={{ width:`${p.confidence}%` }} /></div>
                        <strong>{Math.round(p.confidence)}%</strong>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {recs.length > 0 && (
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}
              className="ops-panel">
              <div className="ops-panel-heading">
                <div className="ops-panel-icon ops-panel-icon--green">
                  <Lightbulb style={{width:18,height:18}} />
                </div>
                <h2>Recommendations</h2>
              </div>
              <div className="insight-list">
                {recs.map((r,idx) => (
                  <motion.div key={r.id}
                    initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay:idx*0.06+0.6 }}
                    whileHover={{ x:4 }}
                    className="insight-item insight-item--green">
                    <Lightbulb style={{ width: 16, height: 16 }} />
                    <p>{r.content}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {!stats && patterns.length===0 && recs.length===0 && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.4 }}
            className="page-empty-state">
            <motion.div animate={{ y:[0,-8,0] }} transition={{ repeat:Infinity, duration:3.5, ease:'easeInOut' }}
              className="page-empty-icon">
              <Sparkles style={{ width: 34, height: 34 }} />
            </motion.div>
            <h3>Insights generating...</h3>
            <p>Use more AI sessions to unlock pattern detection.</p>
          </motion.div>
        )}
    </PageShell>
  )
}
