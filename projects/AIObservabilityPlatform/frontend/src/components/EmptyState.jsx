export function EmptyState({ onRefresh }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">📭</div>
      <h3 className="empty-title">No Sessions Found</h3>
      <p className="empty-text">
        Start using Claude CLI or other AI tools to see your journey tracked here.
      </p>
      <button onClick={onRefresh} className="empty-cta">
        🔄 Refresh Now
      </button>
    </div>
  );
}
