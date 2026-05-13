import React, { useState, useEffect } from 'react'
import { parserAPI, timelineAPI, insightsAPI } from './api'
import { getRandomQuote } from './constants/quotes'

function App() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeline, setTimeline] = useState(null)
  const [quote, setQuote] = useState(getRandomQuote())

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true)

        // Parse Claude CLI data
        const parseResult = await parserAPI.rescan()
        console.log('✓ Data parsed:', parseResult.data)

        // Get timeline
        const timelineResult = await timelineAPI.getTimeline(30)
        setTimeline(timelineResult.data)

        // Generate insights
        await insightsAPI.generateInsights()

        setQuote(getRandomQuote())
      } catch (err) {
        setError(err.message || 'Failed to load data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    initializeApp()
  }, [])

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Scanning your AI journey...</p>
      </div>
    )
  }

  if (error) {
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

  return (
    <div className="app">
      <div className="navbar">
        <h1>🧠 AI Observability Platform</h1>
        <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          {timeline?.total_events || 0} conversations tracked
        </span>
      </div>

      <div className="quote">{quote}</div>

      {timeline && (
        <div className="timeline-container">
          <h2 style={{ marginBottom: '2rem', color: '#94a3b8' }}>
            Timeline ({timeline.days_shown} days)
          </h2>

          {timeline.daily_summaries.length === 0 ? (
            <div className="error">No activity found. Start using Claude CLI to see your timeline!</div>
          ) : (
            timeline.daily_summaries.map((day) => (
              <div key={day.date} className="day-card">
                <div className="day-header">
                  <div>
                    <h3 style={{ color: '#f1f5f9' }}>{day.date}</h3>
                    <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{day.daily_summary}</p>
                  </div>
                  <div className="day-stats">
                    <span>Sessions: {day.total_events}</span>
                    <span>Tokens: {day.total_tokens}</span>
                    <span>Activity: {Math.round(day.activity_score)}%</span>
                  </div>
                </div>

                {timeline.events
                  .filter((e) => e.timestamp.startsWith(day.date))
                  .map((event) => (
                    <div key={event.session_id} className="session">
                      <div className="session-title">{event.title}</div>
                      <div className="session-meta">
                        <span>🛠️ {event.tool}</span>
                        <span>⏱️ {event.duration_minutes} min</span>
                        <span>🔤 {event.tokens_used} tokens</span>
                        <span>📌 {event.topics.join(', ')}</span>
                      </div>
                      {event.summary && (
                        <p style={{ fontSize: '0.9rem', color: '#cbd5e1', marginTop: '0.5rem' }}>
                          {event.summary.substring(0, 100)}...
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default App
