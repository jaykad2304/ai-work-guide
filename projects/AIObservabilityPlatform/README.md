# 🧠 AI Observability Platform

**Track every AI tool interaction in one place.** Claude CLI, Codex CLI, ChatGPT web, and more — automatically detected and visualized in a beautiful, real-time dashboard.

**One command setup:** `docker-compose up` → Open browser → See all your AI activity instantly.

---

## ✨ Features

🚀 **Automatic Multi-Tool Tracking** — Claude CLI, Codex CLI, and extensible for any AI tool
⚡ **Real-time Dashboard** — Poster-style headers and clearer session cards
📊 **Interactive Timeline** — Daily breakdown with stats and summaries
🔍 **Smart Search** — Find conversations by tool, date, topic, or keywords
💡 **Pattern Detection** — Discover your AI usage habits (peak hours, favorite topics)
📝 **Session Digests** — Compact summaries explain what each session was about
💸 **Token Saving Hints** — Every session card includes advice to reduce token usage
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

## Start & Stop Scripts

For local demos, you can use the included helper scripts:

```bash
./start.sh
```

`start.sh` runs `docker-compose up --build -d` for the backend stack, then starts the Vite frontend with `npm run dev`.

To stop everything:

```bash
./stop.sh
```

`stop.sh` runs `docker-compose down` and stops the local Vite dev server.

Use Docker directly if you want the fully containerized path. Use `./start.sh` / `./stop.sh` when you want a quick local development/demo workflow.

## CLI History

You can optionally inspect project-scoped AI history from the terminal. This is just a small local helper around `scripts/ai_history.py`; it reads the same SQLite database used by the dashboard.

```bash
python scripts/ai_history.py
python scripts/ai_history.py --days 7
python scripts/ai_history.py --project AIObservabilityPlatform --limit 10
```

What it does:
- Resolves the current folder to the closest tracked project name
- Shows recent sessions as short digests instead of raw opening prompts
- Prints tokens, duration, date, and topics for quick terminal review

If you want the shorter `./ai-history` command, create a local wrapper:

```bash
cat > ai-history <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "${SCRIPT_DIR}/venv/bin/python" "${SCRIPT_DIR}/scripts/ai_history.py" "$@"
EOF
chmod +x ai-history
```

You can also symlink that wrapper into your `PATH` if you want to call it globally as `ai-history`.

## Connector Coverage

AI Observer is built around two integration paths:

- **Collectors** parse local provider logs/transcripts into normalized events.
- **External event ingestion** lets VS Code extensions, browser extensions, CLI wrappers, CI jobs, or hosted agents push events to `POST /api/events`.

Built-in today:

- Claude CLI
- Codex CLI
- External Event API

Connector-ready/planned:

- VS Code AI extension chats
- GitHub Copilot CLI / IDE activity
- Google Jules async coding tasks
- Other AI-powered CLI agents

To configure collectors:

```bash
cp collectors.yml.example collectors.yml
```

To inspect product coverage:

```bash
curl http://localhost:8000/connectors
```

See [docs/connectors.md](docs/connectors.md) for the collector contract and `/api/events` payload examples.

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
- Summarize: concise display digests for UI and CLI consumption
- Aggregate: Daily stats, activity scores, peak hours

### 4. **Real-time Visualization**
- Events stored in SQLite database
- Frontend queries API in real-time
- Timeline updates automatically as sessions are detected
- Search, filter, sort by any field
- Dashboard, Projects, Timeline, and Search render sessions as compact narrative cards
- Each session card includes a token-saving hint based on the session summary and size

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
    "tool": "github_copilot",
    "session_id": "github_copilot-local-123",
    "project": "AIObservabilityPlatform",
    "title": "Session title",
    "summary": "What happened",
    "topics": "keyword1,keyword2",
    "tokens_used": 1000,
    "duration_minutes": 5
  }
  ```

### Connectors
- `GET /connectors` — Show supported, connector-ready, and planned integrations

### Management
- `POST /rescan` — Manually trigger scan of all collectors
- `GET /health` — Health check

## Data Structure

### Events Table
- `timestamp` — When the conversation happened
- `tool` — Which tool (claude_cli, claude_web, chatgpt, codex)
- `title` — First message/topic
- `summary` — Brief AI summary of conversation or extracted assistant recap
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

## UI Notes

- Each main view starts with a large poster-style heading so the active page reads clearly.
- Session cards use stronger borders and spacing to make adjacent sessions easy to distinguish.
- Session summaries stay compact, but now explain the task more directly and include token-saving advice.

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
