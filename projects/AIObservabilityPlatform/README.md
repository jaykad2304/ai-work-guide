# 🧠 AI Observability Platform

**Track every AI tool interaction in one place.** Claude CLI, Codex CLI, ChatGPT web, and more — automatically detected and visualized in a beautiful, real-time dashboard.

**One command setup:** `docker-compose up` → Open browser → See all your AI activity instantly.

---

## ✨ Features

🚀 **Automatic Multi-Tool Tracking** — Claude CLI, Codex CLI, and extensible for any AI tool
⚡ **Real-time Dashboard** — See new sessions as they happen
📊 **Interactive Timeline** — Daily breakdown with stats and summaries
🔍 **Smart Search** — Find conversations by tool, date, topic, or keywords
💡 **Pattern Detection** — Discover your AI usage habits (peak hours, favorite topics)
🎨 **Vibrant UI** — Modern bright theme with smooth animations
🔌 **Plugin Architecture** — Add new tools without touching core code
🪝 **Webhook API** — Let VS Code extensions, browser tools send events
🐳 **Docker Ready** — Single `docker-compose up`, runs everywhere identically
🔒 **100% Local** — All data stays on your machine, no cloud, no tracking

---

## 🚀 Quick Start (Docker — Recommended)

**Requirements:** Docker and Docker Compose

```bash
git clone <your-repo>
cd AIObservabilityPlatform
docker-compose up
```

Then open **http://localhost:3000** in your browser.

**That's it!** The system automatically:
- ✅ Scans `~/.claude/sessions/` and `~/.codex/sessions/`
- ✅ Starts the backend API
- ✅ Starts the file watcher daemon
- ✅ Launches the frontend UI
- ✅ Watches for new sessions in real-time

---

## 🛠️ Local Development Setup

**Backend:**
```bash
cd projects/AIObservabilityPlatform
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

**Daemon (in another terminal):**
```bash
source venv/bin/activate
python daemon.py
```

**Frontend (in another terminal):**
```bash
cd frontend
npm install
npm run dev
```

Visit **http://localhost:3000**

## How It Works

### 1. **Automatic Collection**
- **File Watcher Daemon** monitors `~/.claude/sessions/*.json` and `~/.codex/sessions/**/*.jsonl` 
- On file create/modify → automatically triggers rescan
- No manual refresh needed, no code changes required

### 2. **Plugin Collectors**
Each AI tool has a "collector" that knows how to parse its session format:
- `ClaudeCliCollector` — Parses Claude CLI JSON sessions
- `CodexCliCollector` — Parses Codex CLI JSONL sessions
- Extensible: Add new tools by creating new collector modules

### 3. **Data Processing**
- Extract: timestamps, tokens, conversation content, metadata
- Parse: topics via keyword extraction
- Summarize: AI-generated session summaries
- Aggregate: Daily stats, activity scores, peak hours

### 4. **Real-time Visualization**
- Events stored in SQLite database
- Frontend queries API in real-time
- Timeline updates automatically as sessions are detected
- Search, filter, sort by any field

### 5. **Export & Integration**
- JSON export for data portability
- Markdown export for pasting into Claude context
- Webhook API for external tools to push events

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

### Events (External Integration)
- `POST /api/events` — Push events from any tool (VS Code, browser, CLI)
  ```json
  {
    "tool": "my_tool",
    "title": "Session title",
    "summary": "What happened",
    "topics": "keyword1,keyword2",
    "tokens_used": 1000,
    "duration_minutes": 5
  }
  ```

### Management
- `POST /rescan` — Manually trigger scan of all collectors
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

## Adding Your Own Tools

The collector system makes it easy to track new AI tools:

### Step 1: Create a Collector
Create `backend/collectors/my_tool.py`:
```python
from backend.collectors import BaseCollector
from backend.models import Event

class MyToolCollector(BaseCollector):
    tool_name = 'my_tool'
    watch_paths = [Path.home() / '.my_tool' / 'sessions']

    def parse_all(self, db):
        # Scan all session files and return list of Events
        pass

    def parse_file(self, file_path, db):
        # Parse a single session file
        pass
```

### Step 2: Register It
In `backend/collectors/registry.py`:
```python
BUILT_IN_COLLECTORS = {
    'my_tool': MyToolCollector,
    ...
}
```

### Step 3: Enable It
In `collectors.yml`:
```yaml
collectors:
  - name: my_tool
    enabled: true
```

Done! The daemon now watches for your tool's sessions and displays them in the UI.

### External Tools (VS Code, Browser)
Any tool can send events directly via **`POST /api/events`**:
```bash
curl -X POST http://localhost:8000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "my_vscode_extension",
    "title": "Fixed a bug",
    "summary": "Debugged authentication flow",
    "tokens_used": 2500,
    "topics": "debugging,backend"
  }'
```

---

## Architecture: Plugin-Based Design

```
User's Machine
├── ~/.claude/sessions/*.json ──┐
├── ~/.codex/sessions/**/*.jsonl├─→ File Watcher Daemon
└── VS Code Extensions ────────┘   └→ Collector Registry
                                      └→ Backend API
                                          └→ SQLite DB
                                              └→ Frontend UI
```

Each collector is independent and can be enabled/disabled in `collectors.yml`.

---

## Known Limitations (v1)

- Keyword-based topics (ML models in future)
- Local SQLite only (cloud sync in v2)
- No PDF exports yet (markdown/JSON working)

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
