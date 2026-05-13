export function FilterBar({ days, onDaysChange, onRefresh, totalEvents }) {
  const dayOptions = [
    { label: 'Last 7 days', value: 7 },
    { label: 'Last 30 days', value: 30 },
    { label: 'Last 90 days', value: 90 },
    { label: 'Last 365 days', value: 365 },
    { label: 'All time', value: 99999 }
  ];

  return (
    <div className="filter-bar">
      <div className="filter-left">
        <select
          value={days}
          onChange={(e) => onDaysChange(parseInt(e.target.value))}
          className="day-select"
        >
          {dayOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button onClick={onRefresh} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>
      <div className="filter-right">
        <span className="session-count">
          {totalEvents} {totalEvents === 1 ? 'session' : 'sessions'}
        </span>
      </div>
    </div>
  );
}
