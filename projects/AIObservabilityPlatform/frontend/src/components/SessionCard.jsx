function getToolBadgeClass(tool) {
  if (tool.includes('claude_cli') || tool === 'claude_cli') return 'claude-cli';
  if (tool.includes('claude') || tool === 'claude_web') return 'claude-web';
  if (tool.includes('chatgpt')) return 'chatgpt';
  return 'claude-cli';
}

export function SessionCard({ event }) {
  const toolClass = getToolBadgeClass(event.tool);
  const topics = Array.isArray(event.topics) ? event.topics : [event.topics];

  return (
    <div className="session">
      <div className="session-title">{event.title}</div>
      <div className="session-meta">
        <span className={`tool-badge ${toolClass}`}>
          {event.tool === 'claude_cli' ? 'Claude CLI' : event.tool === 'claude_web' ? 'Claude Web' : 'ChatGPT'}
        </span>
        <span className="meta-item">⏱️ {event.duration_minutes} min</span>
        <span className="meta-item">🔤 {event.tokens_used.toLocaleString()} tokens</span>
      </div>
      {topics && topics.length > 0 && (
        <div className="topic-pills">
          {topics.filter(t => t && t.trim()).map((topic, idx) => (
            <span key={idx} className="topic-pill">
              {topic}
            </span>
          ))}
        </div>
      )}
      {event.summary && (
        <p className="session-summary">
          {event.summary.substring(0, 150)}
          {event.summary.length > 150 ? '...' : ''}
        </p>
      )}
    </div>
  );
}
