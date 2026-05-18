export default function WindowSelect({ days, onDaysChange }) {
  return (
    <div className="dashboard-select-wrap">
      <span>Window</span>
      <select value={days} onChange={event => onDaysChange(Number(event.target.value))} className="dashboard-select">
        {[1, 7, 30, 90, 365].map(dayCount => (
          <option key={dayCount} value={dayCount}>
            Last {dayCount} day{dayCount === 1 ? '' : 's'}
          </option>
        ))}
      </select>
    </div>
  )
}
