import React, { useState, useEffect } from 'react'
import { parserAPI, timelineAPI, insightsAPI } from './api'
import { Header } from './components/Header'
import { FilterBar } from './components/FilterBar'
import { TimelineDay } from './components/TimelineDay'
import { EmptyState } from './components/EmptyState'

function App() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeline, setTimeline] = useState(null)
  const [days, setDays] = useState(30)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchTimeline = async (daysValue) => {
    try {
      const timelineResult = await timelineAPI.getTimeline(daysValue)
      setTimeline(timelineResult.data)
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to load timeline')
      console.error(err)
    }
  }

  const handleRescan = async () => {
    setIsRefreshing(true)
    try {
      const parseResult = await parserAPI.rescan()
      console.log('✓ Data rescanned:', parseResult.data)
      await fetchTimeline(days)
      await insightsAPI.generateInsights()
    } catch (err) {
      setError(err.message || 'Failed to rescan data')
      console.error(err)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Initial load: rescan once, then fetch timeline and insights
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true)
        setError(null)

        // Parse Claude CLI data once
        const parseResult = await parserAPI.rescan()
        console.log('✓ Initial data parsed:', parseResult.data)

        // Get timeline
        const timelineResult = await timelineAPI.getTimeline(days)
        setTimeline(timelineResult.data)

        // Generate insights
        await insightsAPI.generateInsights()
      } catch (err) {
        setError(err.message || 'Failed to load data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    initializeApp()
  }, [])

  // When days change, only refetch timeline (not rescan)
  useEffect(() => {
    if (timeline) {
      fetchTimeline(days)
    }
  }, [days])

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Scanning your AI journey...</p>
      </div>
    )
  }

  if (error && !timeline) {
    return (
      <div className="app">
        <div className="error">
          <h2>⚠️ Error Loading Data</h2>
          <p>{error}</p>
          <p>Make sure the backend is running on http://localhost:8000</p>
        </div>
      </div>
    )
  }

  const stats = {
    total_events: timeline?.total_events || 0,
    total_tokens: timeline?.events?.reduce((sum, e) => sum + (e.tokens_used || 0), 0) || 0,
    top_topic: timeline?.daily_summaries?.[0]?.primary_topics?.split(',')?.[0] || 'N/A'
  }

  return (
    <div className="app">
      <Header stats={stats} />

      {timeline && (
        <>
          <FilterBar
            days={days}
            onDaysChange={setDays}
            onRefresh={handleRescan}
            totalEvents={timeline.total_events}
          />

          <div className="app-container">
            {error && (
              <div className="error" style={{ margin: '2rem' }}>
                <p>{error}</p>
              </div>
            )}

            {timeline.daily_summaries.length === 0 ? (
              <EmptyState onRefresh={handleRescan} />
            ) : (
              <div className="timeline-container">
                <h2 className="timeline-title">
                  Timeline ({timeline.days_shown} days)
                </h2>
                {timeline.daily_summaries.map((day) => (
                  <TimelineDay
                    key={day.date}
                    day={day}
                    events={timeline.events}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default App
