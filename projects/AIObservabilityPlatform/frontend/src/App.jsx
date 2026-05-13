import React, { useState, useEffect } from 'react'
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
  insights: InsightsView
}

export default function App() {
  const [view, setView] = useState('dashboard')
  const [days, setDays] = useState(30)
  const [timeline, setTimeline] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const init = async () => {
      try {
        await parserAPI.rescan()
        const res = await timelineAPI.getTimeline(days)
        setTimeline(res.data)
        await insightsAPI.generateInsights()
      } catch (e) {
        console.error(e)
        setError(e.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (timeline) {
      timelineAPI.getTimeline(days).then(r => setTimeline(r.data))
    }
  }, [days])

  const ActiveView = VIEWS[view]

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <Sidebar activeView={view} onNavigate={setView} />
      <main className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            Loading your AI journey...
          </div>
        ) : error && !timeline ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-xl font-bold text-red-600 mb-4">Error Loading Data</h2>
              <p className="text-slate-600">{error}</p>
            </div>
          </div>
        ) : (
          <ActiveView timeline={timeline} days={days} onDaysChange={setDays} />
        )}
      </main>
    </div>
  )
}
