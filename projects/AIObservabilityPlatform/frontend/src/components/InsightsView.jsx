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
    insightsAPI.getPatterns().then(r        => setPatterns(r.data.patterns || []))
    insightsAPI.getRecommendations().then(r => setRecs(r.data.recommendations || []))
    insightsAPI.getStats().then(r           => setStats(r.data))
  }, [])

  const stagger = { hidden:{}, show:{ transition:{ staggerChildren:0.08 } } }
  const fade    = { hidden:{ opacity:0, y:16 }, show:{ opacity:1, y:0, transition:{ duration:0.4 } } }

  return (
    <div className="p-6 lg:p-8 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }} className="mb-10">
          <h1 className="text-4xl font-black text-white tracking-tight leading-none mb-1.5">Insights</h1>
          <p className="text-slate-500 text-sm font-medium">Patterns discovered from your AI usage</p>
        </motion.div>

        {/* Quote banner — uses the bg image vibe */}
        <motion.div initial={{ opacity:0, scale:0.98 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.15 }}
          whileHover={{ scale:1.01 }}
          className="relative mb-10 rounded-3xl overflow-hidden"
          style={{ background:'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(139,92,246,0.2) 60%, rgba(236,72,153,0.15) 100%)', border:'1px solid rgba(129,140,248,0.2)', backdropFilter:'blur(20px)' }}>
          {/* Floating orbs like in the reference image */}
          {[
            { w:180, h:180, left:'70%', top:'-40%',  color:'rgba(99,102,241,0.15)'  },
            { w:120, h:120, left:'85%', top:'40%',   color:'rgba(236,72,153,0.12)'  },
            { w:100, h:100, left:'60%', top:'60%',   color:'rgba(20,184,166,0.10)'  },
          ].map((orb,i) => (
            <motion.div key={i} className="absolute rounded-full pointer-events-none"
              style={{ width:orb.w, height:orb.h, left:orb.left, top:orb.top, background:orb.color, filter:'blur(40px)' }}
              animate={{ scale:[1,1.2,1], opacity:[0.6,1,0.6] }}
              transition={{ duration:4+i, repeat:Infinity, delay:i*1.2 }} />
          ))}
          <div className="relative px-8 py-7 flex items-start gap-5">
            <Sparkles className="w-7 h-7 shrink-0 mt-0.5" style={{ color:'#fbbf24' }} />
            <p className="text-lg font-bold text-slate-200 italic leading-relaxed">&ldquo;{quote}&rdquo;</p>
          </div>
        </motion.div>

        {stats && (
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            {/* Tools */}
            <motion.div variants={fade} className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'rgba(129,140,248,0.12)', border:'1px solid rgba(129,140,248,0.2)' }}>
                  <TrendingUp className="w-4.5 h-4.5" style={{width:18,height:18,color:'#818cf8'}} />
                </div>
                <h2 className="text-base font-black text-white">Most Used Tools</h2>
              </div>
              {Object.entries(stats.most_used_tools||{}).length === 0
                ? <p className="text-slate-600 text-sm">No data yet</p>
                : Object.entries(stats.most_used_tools||{}).map(([tool,count],idx) => {
                    const max = Math.max(...Object.values(stats.most_used_tools||{}),1)
                    return (
                      <div key={tool} className="mb-4 last:mb-0">
                        <div className="flex justify-between text-xs font-semibold mb-1.5">
                          <span className="text-slate-400">{tool}</span>
                          <span className="font-black" style={{ color:'#818cf8' }}>{count}</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background:'rgba(255,255,255,0.06)' }}>
                          <motion.div initial={{ width:0 }} animate={{ width:`${(count/max)*100}%` }}
                            transition={{ delay:idx*0.1+0.4, duration:0.9, ease:'easeOut' }}
                            className="h-full rounded-full" style={{ background:'linear-gradient(90deg,#6366f1,#818cf8)' }} />
                        </div>
                      </div>
                    )
                  })
              }
            </motion.div>

            {/* Topics */}
            <motion.div variants={fade} className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'rgba(192,132,252,0.12)', border:'1px solid rgba(192,132,252,0.2)' }}>
                  <Search className="w-4.5 h-4.5" style={{width:18,height:18,color:'#c084fc'}} />
                </div>
                <h2 className="text-base font-black text-white">Favorite Topics</h2>
              </div>
              {Object.entries(stats.favorite_topics||{}).length === 0
                ? <p className="text-slate-600 text-sm">No data yet</p>
                : Object.entries(stats.favorite_topics||{}).slice(0,7).map(([topic,count],idx) => {
                    const max = Math.max(...Object.values(stats.favorite_topics||{}),1)
                    return (
                      <motion.div key={topic}
                        initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay:idx*0.06+0.4 }}
                        className="flex items-center justify-between mb-3.5 last:mb-0">
                        <span className="text-xs font-semibold text-slate-400 capitalize">{topic}</span>
                        <div className="flex items-center gap-2.5">
                          <div className="h-1 rounded-full overflow-hidden" style={{ width:64, background:'rgba(255,255,255,0.06)' }}>
                            <motion.div initial={{ width:0 }} animate={{ width:`${(count/max)*100}%` }}
                              transition={{ delay:idx*0.06+0.5, duration:0.7 }}
                              className="h-full rounded-full" style={{ background:'linear-gradient(90deg,#8b5cf6,#c084fc)' }} />
                          </div>
                          <span className="text-xs font-black w-4 text-right" style={{ color:'#c084fc' }}>{count}</span>
                        </div>
                      </motion.div>
                    )
                  })
              }
            </motion.div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {patterns.length > 0 && (
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
              className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'rgba(251,191,36,0.1)', border:'1px solid rgba(251,191,36,0.2)' }}>
                  <Search className="w-4.5 h-4.5" style={{width:18,height:18,color:'#fbbf24'}} />
                </div>
                <h2 className="text-base font-black text-white">Detected Patterns</h2>
              </div>
              <div className="space-y-3">
                {patterns.map((p,idx) => (
                  <motion.div key={p.id}
                    initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay:idx*0.06+0.5 }}
                    whileHover={{ x:4 }}
                    className="flex gap-3 p-4 rounded-xl transition-all duration-150"
                    style={{ background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.12)' }}>
                    <Search className="w-4 h-4 shrink-0 mt-0.5" style={{ color:'#fbbf24' }} />
                    <div>
                      <p className="text-sm font-semibold text-slate-300">{p.content}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="h-1 rounded-full overflow-hidden" style={{ width:48, background:'rgba(255,255,255,0.07)' }}>
                          <div className="h-full rounded-full" style={{ width:`${p.confidence}%`, background:'#fbbf24' }} />
                        </div>
                        <span className="text-[10px] font-bold text-amber-500">{Math.round(p.confidence)}%</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {recs.length > 0 && (
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}
              className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'rgba(45,212,191,0.1)', border:'1px solid rgba(45,212,191,0.2)' }}>
                  <Lightbulb className="w-4.5 h-4.5" style={{width:18,height:18,color:'#2dd4bf'}} />
                </div>
                <h2 className="text-base font-black text-white">Recommendations</h2>
              </div>
              <div className="space-y-3">
                {recs.map((r,idx) => (
                  <motion.div key={r.id}
                    initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay:idx*0.06+0.6 }}
                    whileHover={{ x:4 }}
                    className="flex gap-3 p-4 rounded-xl transition-all duration-150"
                    style={{ background:'rgba(45,212,191,0.06)', border:'1px solid rgba(45,212,191,0.12)' }}>
                    <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" style={{ color:'#2dd4bf' }} />
                    <p className="text-sm font-semibold text-slate-300">{r.content}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {!stats && patterns.length===0 && recs.length===0 && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.4 }}
            className="flex flex-col items-center justify-center py-32">
            <motion.div animate={{ y:[0,-8,0] }} transition={{ repeat:Infinity, duration:3.5, ease:'easeInOut' }}
              className="w-20 h-20 rounded-2xl glass flex items-center justify-center mb-5">
              <Sparkles className="w-9 h-9" style={{ color:'#818cf8' }} />
            </motion.div>
            <h3 className="text-xl font-black text-slate-400 mb-1">Insights generating…</h3>
            <p className="text-slate-600 text-sm">Use more AI sessions to unlock pattern detection</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
