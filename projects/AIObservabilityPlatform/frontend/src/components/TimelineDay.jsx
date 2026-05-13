import { SessionCard } from './SessionCard';

export function TimelineDay({ day, events }) {
  const dayEvents = events.filter((e) => e.timestamp.startsWith(day.date));

  return (
    <div className="day-card">
      <div className="day-header">
        <div>
          <h3 className="day-date">{day.date}</h3>
          <p className="day-summary">{day.daily_summary}</p>
        </div>
      </div>
      <div className="day-stats">
        <span className="stat-badge">📌 {day.total_events} sessions</span>
        <span className="stat-badge">🔤 {day.total_tokens.toLocaleString()} tokens</span>
        <span className="stat-badge">📊 {Math.round(day.activity_score)}% activity</span>
      </div>
      <div className="sessions-list">
        {dayEvents.length === 0 ? (
          <p style={{ color: 'var(--muted-text)', fontSize: '0.9rem', marginTop: '1rem' }}>
            No sessions recorded for this day
          </p>
        ) : (
          dayEvents.map((event) => (
            <SessionCard key={event.session_id} event={event} />
          ))
        )}
      </div>
    </div>
  );
}
