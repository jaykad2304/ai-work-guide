export function Header({ stats }) {
  return (
    <div className="header">
      <div className="header-content">
        <h1 className="header-title">🧠 AI Observability Platform</h1>
        <p className="header-tagline">Your AI journey, visualized</p>
        <div className="header-stats">
          <div className="stat-pill">
            <span>📊 Sessions:</span>
            <span className="stat-value">{stats.total_events}</span>
          </div>
          <div className="stat-pill">
            <span>🔤 Tokens:</span>
            <span className="stat-value">{stats.total_tokens?.toLocaleString() || 0}</span>
          </div>
          <div className="stat-pill">
            <span>🎯 Top Topic:</span>
            <span className="stat-value">{stats.top_topic || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
