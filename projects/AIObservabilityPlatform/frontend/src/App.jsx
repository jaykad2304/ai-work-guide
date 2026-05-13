import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { parserAPI, timelineAPI, insightsAPI } from './api'
import { QUOTES } from './constants/quotes'
import Topbar from './components/Topbar'
import Dashboard from './components/Dashboard'
import ProjectsView from './components/ProjectsView'
import TimelineView from './components/TimelineView'
import SearchView from './components/SearchView'
import InsightsView from './components/InsightsView'

const VIEWS = {
  dashboard: Dashboard,
  projects:  ProjectsView,
  timeline:  TimelineView,
  search:    SearchView,
  insights:  InsightsView,
}

const MESSAGES = [
  'Scanning your AI sessions...',
  'Analyzing token usage...',
  'Mapping your projects...',
  'Building your timeline...',
  'Almost ready...',
]

function FloatingQuotes() {
  const positions = useRef(
    QUOTES.slice(0, 7).map((_, i) => ({
      x: 5 + (i * 13) % 80,
      y: 10 + (i * 17) % 75,
      delay: i * 0.35,
      duration: 5 + (i % 3) * 2,
    }))
  )
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {QUOTES.slice(0, 7).map((quote, i) => {
        const p = positions.current[i]
        return (
          <motion.div
            key={i}
            className="absolute max-w-xs px-4 py-2.5 rounded-2xl text-xs font-semibold italic text-slate-300"
            style={{
              left: `${p.x}%`,
              top:  `${p.y}%`,
              background: 'rgba(10,12,40,0.5)',
              border: '1px solid rgba(129,140,248,0.18)',
              backdropFilter: 'blur(12px)',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: [0, 0.85, 0.85, 0], y: [20, 0, 0, -20] }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              repeatDelay: 1.5,
              ease: 'easeInOut',
            }}
          >
            &ldquo;{quote}&rdquo;
          </motion.div>
        )
      })}
    </div>
  )
}

export default function App() {
  const [view, setView]         = useState('dashboard')
  const [days, setDays]         = useState(30)
  const [timeline, setTimeline] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [msgIdx, setMsgIdx]     = useState(0)

  useEffect(() => {
    const iv = setInterval(() => setMsgIdx(i => (i + 1) % MESSAGES.length), 1100)
    const init = async () => {
      try {
        await parserAPI.rescan()
        const res = await timelineAPI.getTimeline(days)
        setTimeline(res.data)
        await insightsAPI.generateInsights()
      } catch (e) { console.error(e) }
      finally { clearInterval(iv); setLoading(false) }
    }
    init()
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    if (timeline) timelineAPI.getTimeline(days).then(r => setTimeline(r.data))
  }, [days])

  const ActiveView = VIEWS[view]

  if (loading) {
    return (
      <>
        <div className="app-bg" />
        <div className="page-root items-center justify-center" style={{ position: 'relative' }}>
          <FloatingQuotes />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center relative z-10">
            <motion.div
              animate={{ scale: [1, 1.08, 1], boxShadow: ['0 0 24px rgba(99,102,241,0.35)', '0 0 52px rgba(139,92,246,0.55)', '0 0 24px rgba(99,102,241,0.35)'] }}
              transition={{ repeat: Infinity, duration: 2.2 }}
              className="w-16 h-16 mx-auto mb-7 rounded-2xl glass flex items-center justify-center"
            >
              <span className="text-3xl">🧠</span>
            </motion.div>
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">AI Observer</h1>
            <AnimatePresence mode="wait">
              <motion.p key={msgIdx} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                className="text-slate-400 text-sm font-semibold mb-7">{MESSAGES[msgIdx]}</motion.p>
            </AnimatePresence>
            <div className="flex justify-center gap-2">
              {[0,1,2].map(i => (
                <motion.div key={i} className="w-2 h-2 rounded-full" style={{ background: '#6366f1' }}
                  animate={{ y: [0, -8, 0], opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.1, delay: i * 0.18 }} />
              ))}
            </div>
          </motion.div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="app-bg" />
      <div className="page-root">
        <Topbar activeView={view} onNavigate={setView} />
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ActiveView timeline={timeline} days={days} onDaysChange={setDays} />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </>
  )
}
