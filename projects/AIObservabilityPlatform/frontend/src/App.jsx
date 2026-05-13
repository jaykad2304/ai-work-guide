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
  projects: ProjectsView,
  timeline: TimelineView,
  search: SearchView,
  insights: InsightsView,
}

export default function App() {
  const [view, setView] = useState('dashboard')
  const [days, setDays] = useState(30)
  const [timeline, setTimeline] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState('Initializing...')

  useEffect(() => {
    const messages = [
      'Scanning your AI sessions...',
      'Analyzing token usage...',
      'Mapping your projects...',
      'Building your timeline...',
    ]
    let idx = 0
    const interval = setInterval(() => {
      idx = (idx + 1) % messages.length
      setLoadingMessage(messages[idx])
    }, 900)

    const init = async () => {
      try {
        setLoadingMessage('Scanning your AI sessions...')
        await parserAPI.rescan()
        setLoadingMessage('Building your timeline...')
        const res = await timelineAPI.getTimeline(days)
        setTimeline(res.data)
        setLoadingMessage('Generating insights...')
        await insightsAPI.generateInsights()
      } catch (e) {
        console.error(e)
      } finally {
        clearInterval(interval)
        setLoading(false)
      }
    }
    init()
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (timeline) {
      timelineAPI.getTimeline(days).then(r => setTimeline(r.data))
    }
  }, [days])

  const ActiveView = VIEWS[view]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          {/* Pulsing brain icon */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              boxShadow: [
                '0 0 40px rgba(99, 102, 241, 0.4)',
                '0 0 80px rgba(168, 85, 247, 0.6)',
                '0 0 40px rgba(99, 102, 241, 0.4)',
              ],
            }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center"
          >
            <span className="text-5xl">🧠</span>
          </motion.div>

          <motion.h1
            className="text-4xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            AI Observer
          </motion.h1>

          <AnimatePresence mode="wait">
            <motion.p
              key={loadingMessage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-slate-400 text-lg font-medium"
            >
              {loadingMessage}
            </motion.p>
          </AnimatePresence>

          {/* Loading dots */}
          <div className="flex justify-center gap-2 mt-8">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-3 h-3 rounded-full bg-indigo-500"
                animate={{ y: [0, -12, 0], opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar activeView={view} onNavigate={setView} />
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
          >
            <ActiveView timeline={timeline} days={days} onDaysChange={setDays} />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
