# Connector Guide

AI Observer ships with built-in collectors for Claude CLI and Codex CLI. Other AI developer tools can be observed by adding a collector or by pushing normalized events to the external event API.

## Current Coverage

| Source | Status | How it is observed |
| --- | --- | --- |
| Claude CLI | Supported | Parses local Claude project session transcripts |
| Codex CLI | Supported | Parses local Codex session transcripts |
| Claude/Codex inside VS Code terminal | Usually supported | Still writes to the normal CLI session locations |
| VS Code AI extension chats | Connector-ready | Needs extension bridge or event push |
| GitHub Copilot CLI / IDE chat | Planned | Needs CLI wrapper, VS Code bridge, or GitHub API integration |
| Google Jules | Planned | Needs provider API/export/GitHub activity correlation |
| Other CLI agents | Connector-ready | Add collector or wrap command and POST events |

## Option 1: Push Events

Use this for VS Code extensions, browser extensions, custom wrappers, CI jobs, or tools that can emit structured activity.

```bash
curl -X POST http://localhost:8000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "github_copilot",
    "session_id": "github_copilot-local-123",
    "project": "AIObservabilityPlatform",
    "title": "Refactored dashboard cards",
    "summary": "Used Copilot suggestions while refactoring React components and validating the frontend build.",
    "topics": "copilot,react,dashboard,frontend",
    "tokens_used": 1200,
    "duration_minutes": 18,
    "metadata": {
      "source": "vscode_extension",
      "files_changed": ["frontend/src/components/Dashboard.jsx"]
    }
  }'
```

Fields:

- `tool`: stable source id, for example `github_copilot`, `google_jules`, `vscode_claude`, `aider_cli`
- `session_id`: optional stable id. If omitted, AI Observer generates one.
- `project`: optional project/workspace name.
- `title`: short session title.
- `summary`: readable explanation of what happened.
- `topics`: comma-separated tags.
- `tokens_used`: best available token count or estimate.
- `duration_minutes`: observed or estimated duration.
- `metadata`: provider-specific payload for later debugging.

## Option 2: Add a Collector

Use this when a tool writes local logs/transcripts or exposes files that can be scanned.

1. Create a file in `backend/collectors/`, for example `github_copilot.py`.
2. Subclass `BaseCollector`.
3. Implement `parse_all(db)` and `parse_file(file_path, db)`.
4. Normalize provider-specific data into `backend.models.Event`.
5. Register it in `backend/collectors/registry.py`.
6. Add it to `collectors.yml`.

Minimal collector shape:

```python
from pathlib import Path
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.collectors import BaseCollector
from backend.models import Event


class MyToolCollector(BaseCollector):
    tool_name = "my_tool"
    display_name = "My Tool"
    status = "supported"
    description = "Captures My Tool session logs."
    setup_hint = "Point watch_paths at the local log directory."
    watch_paths = [Path.home() / ".my-tool" / "sessions"]

    def parse_all(self, db: Session) -> List[Event]:
        events = []
        for path in self.watch_paths[0].glob("*.jsonl"):
            event = self.parse_file(path, db)
            if event:
                events.append(event)
        return events

    def parse_file(self, file_path: Path, db: Session) -> Optional[Event]:
        # Parse provider-specific data, then create/update Event.
        return None
```

## Configuration

Copy the example config and enable only the collectors you want:

```bash
cp collectors.yml.example collectors.yml
```

`collectors.yml`:

```yaml
collectors:
  - name: claude_cli
    enabled: true
  - name: codex_cli
    enabled: true
  - name: external_events
    enabled: true
```

## Coverage API

The UI and external tooling can inspect connector status:

```bash
curl http://localhost:8000/connectors
```

Statuses:

- `supported`: captured automatically by a built-in collector.
- `connector_ready`: can be observed by sending normalized events to `/api/events`.
- `planned`: product slot exists, but provider-specific instrumentation still needs to be implemented.
