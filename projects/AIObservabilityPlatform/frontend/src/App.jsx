import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { parserAPI, timelineAPI, insightsAPI } from './api'
import Sidebar from './components/Sidebar'
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

export default function App() {
  const [view, setView]       = useState('dashboard')
  const [days, setDays]       = useState(30)
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
      } catch (e) {
        console.error(e)
      } finally {
        clearInterval(iv)
        setLoading(false)
      }
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
      <div className="flex items-center justify-center h-screen bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="w-20 h-20 mx-auto mb-8 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <span className="text-4xl">🧠</span>
          </motion.div>

          <h1 className="text-3xl font-black text-slate-900 mb-2">AI Observer</h1>

          <AnimatePresence mode="wait">
            <motion.p
              key={msgIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="text-slate-500 font-medium text-base mb-8"
            >
              {MESSAGES[msgIdx]}
            </motion.p>
          </AnimatePresence>

          <div className="flex justify-center gap-2">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-indigo-500"
                animate={{ y: [0, -10, 0], opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.1, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar activeView={view} onNavigate={setView} />
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            <ActiveView timeline={timeline} days={days} onDaysChange={setDays} />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
