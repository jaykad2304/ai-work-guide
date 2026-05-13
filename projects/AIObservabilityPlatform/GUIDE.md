# 🧠 AI Observability Platform — Complete Guide

## What Is This Tool?

A **personal AI analytics dashboard** that automatically tracks every time you use Claude, Codex, or any other AI tool. Everything happens locally on your machine—no cloud, no tracking, no sharing of your data.

Think of it like a **fitness tracker for AI tool usage**. Just as a fitness tracker shows you how many steps you took, when you were most active, and what your patterns are—this tool shows you:

- What AI tools you used
- When you used them  
- How many tokens you used
- What topics you discussed
- Your usage patterns and preferences

---

## Installation (2 minutes)

### Step 1: Clone the Repository
```bash
git clone https://github.com/jaykad2304/ai-work-guide.git
cd ai-work-guide/projects/AIObservabilityPlatform
```

### Step 2: Start Everything
```bash
docker-compose up
```

### Step 3: Open in Browser
```
http://localhost:3000
```

**That's it!** The system is now:
- ✅ Scanning your Claude CLI sessions
- ✅ Scanning your Codex CLI sessions  
- ✅ Watching for new sessions in real-time
- ✅ Building a timeline of your AI usage
- ✅ Detecting patterns and generating insights

---

## What You'll See

### Dashboard Header
- **Bright gradient purple/indigo header** with your statistics
- 📊 Total sessions across all tools
- 🔤 Total tokens used
- 🎯 Your most-discussed topic

### Timeline
- **Interactive cards** for each day showing:
  - Date and daily summary
  - Total sessions that day
  - Total tokens used
  - Activity score (0-100%)
  - Peak activity hour

### Session Details
Each session card shows:
- 📝 **Title** — First message or topic
- 🛠️ **Tool** — Which AI tool (Claude CLI, Codex CLI, etc.)
- ⏱️ **Duration** — How long you spent
- 🔤 **Tokens** — Estimated token usage
- 📌 **Topics** — Extracted keywords (RAG, API, Debugging, etc.)
- 💬 **Summary** — Brief AI-generated summary of what you discussed

### Filter Bar
- 📅 **Date Range** — Switch between last 7/30/90/365 days or all time
- 🔄 **Refresh** — Manually trigger a scan for new sessions
- 📊 **Session Count** — How many sessions in the current view

---

## How Does It Work?

### Automatic Detection (The Magic Part)

The system uses a **File Watcher Daemon** that:

1. **Watches your session directories** (`~/.claude/sessions`, `~/.codex/sessions`)
2. **Detects new session files** when they're created
3. **Automatically parses them** (no manual refresh needed)
4. **Adds them to the database** (happens in seconds)
5. **Updates the UI** (you see new sessions instantly)

```
You run: claude chat
           ↓
Claude creates session file
           ↓
Daemon detects new file
           ↓
Daemon parses it
           ↓
Database updated
           ↓
UI refreshes
           ↓
You see new session on timeline ✨
```

### Data Collection (What Gets Tracked)

For each session, the system records:

| Field | Example | Purpose |
|-------|---------|---------|
| **Timestamp** | 2026-05-13 10:30 | When you used the tool |
| **Tool** | claude_cli | Which AI tool |
| **Title** | "Help me debug Python recursion" | Your first message |
| **Summary** | "Discussed recursive functions, DFS patterns..." | AI summary |
| **Topics** | RAG, Python, Debugging | Extracted keywords |
| **Tokens** | 2,500 | Estimated tokens used |
| **Duration** | 12 minutes | How long the session lasted |

---

## Features in Detail

### 🔍 Search
Find any conversation:
```
/search?q=react
/search?q=authentication
/search/topic/RAG
```

Results show all matching sessions with:
- Full session title and summary
- Which tool was used
- When it happened
- Token count and duration

### 📊 Insights
Auto-generated patterns about your usage:
- **Peak Hours** — When are you most active? (e.g., "Most active at 2 PM")
- **Favorite Topics** — What do you discuss most? (e.g., "RAG, APIs, Debugging")
- **Tool Preferences** — Which tools do you use most?
- **Activity Trends** — Are you using more AI tools over time?
- **Recommendations** — "You haven't discussed authentication in 5 days. Want to explore?"

### 📤 Export
Download your data:

**JSON Export:**
```json
{
  "sessions": [
    {
      "timestamp": "2026-05-13T10:30:00",
      "tool": "claude_cli",
      "title": "Debug Python recursion",
      "tokens_used": 2500,
      ...
    }
  ],
  "metadata": {...}
}
```

**Markdown Export:**
Formatted for pasting into Claude for context:
```markdown
# AI Activity (Last 30 Days)

## 2026-05-13
- Claude CLI: "Debug Python recursion" (2,500 tokens)
- Topics: Python, Debugging, Recursion

...
```

---

## Real-World Examples

### Example 1: Find What You Did Last Week
1. Open dashboard
2. Set date range to "Last 7 days"
3. Scroll through timeline
4. Click any session to see full details
5. Export as Markdown to paste into Claude: "Here's what I worked on..."

### Example 2: Track Your Learning
1. Check "Favorite Topics" in Insights
2. See if you're learning new things or repeating the same topics
3. Get recommendations: "Try exploring distributed systems"

### Example 3: Optimize Your Tool Use
1. Look at peak hours — when are you most productive?
2. Check token usage — are you asking long questions or short?
3. See tool mix — do you balance Claude and Codex?
4. Use insights to identify patterns

### Example 4: Context for Claude
1. Export last week as Markdown
2. Paste into Claude when starting new project
3. Claude understands your recent work and context
4. Better, more relevant responses

---

## Plugin System: Add Your Own Tools

The system is built to be **extensible**. Anyone can add support for new AI tools.

### Example: Adding ChatGPT Web Tracker

**Step 1: Create a Browser Extension**
```javascript
// Detect when user visits chatgpt.com/chat
// After each message, send to the observability platform
fetch('http://localhost:8000/api/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tool: 'chatgpt_web',
    title: 'Discussing machine learning',
    tokens_used: 1500,
    topics: 'ML, neural networks'
  })
})
```

**Step 2: Done!**
New ChatGPT sessions now appear in your timeline automatically.

### Example: Adding a Custom CLI Tool

**Step 1: Create a Collector**
```python
# backend/collectors/my_ai_tool.py
from backend.collectors import BaseCollector

class MyAIToolCollector(BaseCollector):
    tool_name = 'my_ai_tool'
    watch_paths = [Path.home() / '.my_ai_tool' / 'sessions']

    def parse_all(self, db):
        # Read all session files and return Events
        pass
```

**Step 2: Register It**
```python
# backend/collectors/registry.py
BUILT_IN_COLLECTORS = {
    'my_ai_tool': MyAIToolCollector,
    ...
}
```

**Step 3: Enable It**
```yaml
# collectors.yml
collectors:
  - name: my_ai_tool
    enabled: true
```

**Done!** Your custom tool is now tracked.

---

## API Endpoints (For Developers)

### Core APIs

**Get Timeline**
```bash
curl http://localhost:8000/timeline?days=30
```
Returns: All events from last 30 days, grouped by day with stats

**Search**
```bash
curl "http://localhost:8000/search?q=python&tool=claude_cli"
```
Returns: All matching sessions

**Get Insights**
```bash
curl http://localhost:8000/insights/patterns
```
Returns: Detected patterns in your usage

**Push Event** (External Tools)
```bash
curl -X POST http://localhost:8000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "my_extension",
    "title": "Did something cool",
    "tokens_used": 500,
    "topics": "AI,learning"
  }'
```

**Trigger Rescan**
```bash
curl -X POST http://localhost:8000/rescan
```
Returns: Number of new sessions found

---

## Privacy & Security

✅ **All data stays on your machine**
- SQLite database in `./data/timeline.db`
- No cloud servers, no API calls to external services
- No tracking, no telemetry

✅ **Read-only access to your session files**
- System reads `~/.claude/sessions` (read-only)
- System reads `~/.codex/sessions` (read-only)
- Original files are never modified

✅ **You control everything**
- Delete data anytime: `rm ./data/timeline.db`
- Disable tools: Edit `collectors.yml`
- Export and use your data however you want

---

## Troubleshooting

### Sessions Not Appearing?

1. **Check if backend is running:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Manually trigger rescan:**
   ```bash
   curl -X POST http://localhost:8000/rescan
   ```

3. **Check daemon logs:**
   ```bash
   docker logs ai-observer-backend
   ```

### Data Not Updating?

1. **Restart containers:**
   ```bash
   docker-compose restart
   ```

2. **Check file watcher:**
   ```bash
   docker logs ai-observer-backend | grep daemon
   ```

### Port Already in Use?

If ports 3000 or 8000 are taken:
1. Edit `docker-compose.yml`
2. Change port mappings:
   ```yaml
   ports:
     - "3001:3000"  # Frontend on 3001 instead
     - "8001:8000"  # Backend on 8001 instead
   ```

---

## Next Steps

### For Personal Use
1. ✅ Clone and run with `docker-compose up`
2. Use the dashboard to understand your AI usage patterns
3. Export data for context when working with Claude
4. Check insights periodically to optimize your workflow

### For Contributing
1. Add support for new AI tools (create collectors)
2. Improve the UI/UX (React frontend)
3. Add new insight types (pattern detection)
4. Create browser extensions for web-based tools
5. Write documentation and examples

### For Sharing
1. Push to your GitHub
2. Share with friends who want to track their AI usage
3. Contribute back to the original project

---

## Support

- **Issues?** Check `/rescan` response for errors
- **Questions?** Read the README.md
- **Want to contribute?** Check the GitHub repo

---

**Built with 🧠 to track how you learn with AI**

Make your AI interactions visible, measurable, and actionable.
