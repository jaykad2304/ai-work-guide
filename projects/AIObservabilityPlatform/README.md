# AI Observability Platform

Track, visualize, and analyze all your AI interactions (Claude CLI, Claude.ai, ChatGPT, etc.) with an interactive timeline, intelligent insights, and exportable knowledge bases.

## Features

✨ **Timeline Visualization** — Interactive daily breakdown of all AI conversations
🔍 **Smart Search** — Search by topic, date, tool, or keywords
📊 **Insights & Patterns** — Auto-generated patterns (favorite topics, peak hours, activity trends)
💾 **Multiple Exports** — JSON, Markdown, PDF formats
🎭 **Sarcastic UI** — Witty quotes that roast your productivity
🌓 **Dark Theme** — Easy on the eyes, optimized for late-night coding
🐳 **Docker Ready** — Single `docker-compose up` deployment

## Quick Start

### Option 1: Docker (Easiest)

```bash
docker-compose up
```

Visit http://localhost:3000

### Option 2: Local Development

**Backend:**
```bash
cd projects/AIObservabilityPlatform
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:3000

## How It Works

1. **Data Collection** — Scans `~/.claude/` for Claude CLI session transcripts
2. **Processing** — Extracts metadata: timestamps, tokens, topics, summaries
3. **Intelligence** — Detects patterns (favorite topics, peak hours, activity anomalies)
4. **Visualization** — Interactive timeline showing daily activity
5. **Exports** — Generate markdown for Claude context, JSON for integration, PDFs for sharing

## API Endpoints

### Timeline
- `GET /timeline?days=30` — Get last 30 days of activity
- `GET /timeline/{date}` — Get all sessions for a specific date
- `GET /timeline/{session_id}/detail` — Full conversation details

### Search
- `GET /search?q=RAG` — Search conversations
- `GET /search/topic/{topic}` — Find all sessions about a topic

### Insights
- `GET /insights/patterns` — Detected usage patterns
- `GET /insights/recommendations` — AI-generated recommendations
- `GET /insights/stats` — Overall statistics
- `POST /insights/generate` — Generate/refresh insights

### Export
- `POST /export/json` — Export as JSON
- `POST /export/markdown` — Export as Markdown (for Claude context)

### Management
- `POST /rescan` — Scan and parse Claude CLI history
- `GET /health` — Health check

## Data Structure

### Events Table
- `timestamp` — When the conversation happened
- `tool` — Which tool (claude_cli, claude_web, chatgpt, codex)
- `title` — First message/topic
- `summary` — Brief AI summary of conversation
- `topics` — Extracted keywords (RAG, API, Payments, etc.)
- `tokens_used` — Estimated token count
- `duration_minutes` — Conversation length
- `raw_content` — Full JSON transcript

### Daily Metadata
- `date` — ISO date
- `total_events` — Number of sessions
- `total_tokens` — Daily token count
- `activity_score` — 0-100 productivity score
- `peak_hour` — Most active hour (0-23)
- `primary_topics` — Top topics for the day

## Architecture

```
┌─────────────────────────────────────┐
│  Data Sources                       │
│  ~/.claude/ + Browser History       │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Backend (FastAPI + SQLAlchemy)     │
│  • Parser (Claude CLI sessions)     │
│  • Intelligence (patterns/insights) │
│  • Routes (timeline, search, export)│
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  SQLite Database (Local)            │
│  • Events                           │
│  • Daily Metadata                   │
│  • Insights                         │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Frontend (React + Vite)            │
│  • Interactive Timeline             │
│  • Search & Filters                 │
│  • Export Controls                  │
└─────────────────────────────────────┘
```

## Tech Stack

- **Backend:** Python 3.11, FastAPI, SQLAlchemy, SQLite
- **Frontend:** React 18, Vite, Axios
- **Intelligence:** Keyword extraction, Pattern detection
- **Deployment:** Docker, docker-compose
- **Testing:** pytest

## Known Limitations (v1)

- Claude CLI history only (browser/API logs in v2)
- Local SQLite (no cloud sync in v1)
- Keyword-based topics (ML models in future)
- Markdown/JSON exports (PDF/HTML in v1.1)

## Future Enhancements

- [ ] Browser activity tracking (Claude.ai, ChatGPT, Codex)
- [ ] 3D activity heatmap visualization
- [ ] Persona generation (auto-build user profile)
- [ ] Obsidian integration
- [ ] ML-based insight generation
- [ ] Cloud backup (optional)
- [ ] PDF/HTML exports
- [ ] Team analytics
- [ ] API key management
- [ ] Webhook notifications

## Privacy

✅ **All data stays local** — No cloud uploads, no tracking
✅ **No external APIs** — Everything runs on your machine
✅ **Offline-first** — Works without internet
✅ **You own your data** — SQLite on your filesystem

## Contributing

Found a bug? Have a feature idea? Open an issue or PR!

```bash
git clone https://github.com/jaykad2304/ai-work-guide.git
cd projects/AIObservabilityPlatform
# Make your changes
git push origin feature-branch
```

## License

MIT

---

Built with 🧠 by [Jaykumar](https://github.com/jaykad2304) | 
[GitHub](https://github.com/jaykad2304/ai-work-guide) |
[Docs](./docs/)
