import json
from pathlib import Path
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.collectors import BaseCollector
from backend.models import Event
from backend.parsers.utils import extract_keywords


class CodexCliCollector(BaseCollector):
    tool_name = 'codex_cli'
    watch_paths = [Path.home() / '.codex' / 'sessions']

    def parse_all(self, db: Session) -> List[Event]:
        events = []
        session_files = list(Path.home().glob('.codex/sessions/**/*.jsonl'))
        for path in sorted(session_files):
            event = self.parse_file(path, db)
            if event:
                events.append(event)
        return events

    def parse_file(self, file_path: Path, db: Session) -> Optional[Event]:
        try:
            lines = file_path.read_text().strip().split('\n')
            meta = None
            messages = []

            for line in lines:
                if not line.strip():
                    continue
                obj = json.loads(line)
                if obj.get('type') == 'session_meta':
                    meta = obj.get('payload', obj)
                elif obj.get('type') == 'message':
                    messages.append(obj.get('payload', obj))

            if not meta:
                return None

            session_id = f"codex_cli-{meta.get('id', 'unknown')}"
            # Skip if already in DB
            existing = db.query(Event).filter(Event.session_id == session_id).first()
            if existing:
                return None

            # Parse timestamp
            ts_str = meta.get('timestamp', '')
            if ts_str.endswith('Z'):
                ts_str = ts_str[:-1] + '+00:00'
            timestamp = datetime.fromisoformat(ts_str) if ts_str else datetime.utcnow()

            # Extract content from messages
            content_parts = []
            for m in messages:
                if isinstance(m, dict):
                    if isinstance(m.get('content'), str):
                        content_parts.append(m['content'])
                    elif isinstance(m.get('content'), list):
                        for part in m['content']:
                            if isinstance(part, dict) and 'text' in part:
                                content_parts.append(part['text'])
            content = ' '.join(content_parts)

            title = (content[:60] + '...') if len(content) > 60 else (content or f"Codex session {meta.get('id', '?')[:8]}")
            tokens = len(content) // 4
            duration = max(1, tokens // 100)
            topics = ','.join(extract_keywords(content, top_n=5))
            summary = content[:200] if content else 'Codex CLI session'

            event = Event(
                timestamp=timestamp,
                tool='codex_cli',
                session_id=session_id,
                title=title,
                summary=summary,
                topics=topics,
                tokens_used=tokens,
                duration_minutes=duration,
                raw_content=json.dumps({'file': str(file_path), 'cwd': meta.get('cwd', '')}),
                indexed=True
            )
            db.add(event)
            db.commit()
            return event
        except Exception as e:
            print(f"Error parsing Codex session {file_path}: {e}")
            return None
