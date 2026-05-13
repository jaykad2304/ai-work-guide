import json
from pathlib import Path
from datetime import datetime
from sqlalchemy.orm import Session
from backend.models import Event, DailyMetadata
from backend.parsers.utils import (
    extract_tokens_from_message,
    extract_title_from_messages,
    extract_keywords,
    parse_iso_datetime
)
from backend.config import config

class ClaudeCliParser:
    def __init__(self, db: Session):
        self.db = db
        self.claude_dir = config.CLAUDE_DATA_DIR

    def parse_all_sessions(self):
        """Parse all Claude CLI sessions from ~/.claude/projects/"""
        projects_dir = self.claude_dir / 'projects'

        print(f"[DEBUG] Looking for sessions in: {projects_dir}")
        print(f"[DEBUG] Claude dir: {self.claude_dir}")
        print(f"[DEBUG] Claude dir exists: {self.claude_dir.exists()}")

        if not projects_dir.exists():
            print(f"✗ Claude projects directory not found: {projects_dir}")
            print(f"[DEBUG] Contents of {self.claude_dir}:")
            if self.claude_dir.exists():
                for item in self.claude_dir.iterdir():
                    print(f"  - {item.name}")
            return []

        parsed_events = []
        for project_folder in projects_dir.iterdir():
            if not project_folder.is_dir():
                continue

            for session_file in sorted(project_folder.glob('*.jsonl')):
                try:
                    event = self._parse_session_file(session_file)
                    if event:
                        existing = self.db.query(Event).filter(
                            Event.session_id == event.session_id
                        ).first()

                        if not existing:
                            self.db.add(event)
                            parsed_events.append(event)
                            print(f"✓ Parsed: {event.title} ({event.timestamp.date()})")
                        else:
                            print(f"⊘ Already indexed: {event.title}")
                except Exception as e:
                    print(f"✗ Error parsing {session_file.name}: {str(e)}")

        self.db.commit()
        return parsed_events

    def _parse_session_file(self, file_path: Path):
        """Parse a single JSONL session file"""
        messages = []
        created_at = None

        with open(file_path, 'r') as f:
            for line in f:
                if not line.strip():
                    continue
                try:
                    obj = json.loads(line)
                    # Check if this is a message entry (nested under 'message' key)
                    if 'message' in obj and isinstance(obj['message'], dict):
                        msg = obj['message']
                        if msg.get('type') == 'message':
                            messages.append(msg)
                            # Capture timestamp from first message
                            if not created_at and 'timestamp' in obj:
                                created_at = obj['timestamp']
                except json.JSONDecodeError:
                    continue

        if not messages:
            return None

        session_id = file_path.stem

        raw_project = file_path.parent.name
        parts = raw_project.lstrip('-').split('-')
        project_name = 'unknown'
        for i, part in enumerate(parts):
            if part == 'projects' and i + 1 < len(parts):
                project_name = '-'.join(parts[i+1:])
                break
        else:
            project_name = parts[-1] if parts else 'unknown'

        timestamp = parse_iso_datetime(created_at or datetime.utcnow().isoformat())
        title = extract_title_from_messages(messages)

        total_tokens = 0
        for msg in messages:
            if isinstance(msg, dict) and 'usage' in msg:
                usage = msg.get('usage', {})
                total_tokens += usage.get('input_tokens', 0) + usage.get('output_tokens', 0)

        # Extract text content from all messages
        all_text = ''
        for msg in messages:
            if isinstance(msg, dict):
                content = msg.get('content', [])
                if isinstance(content, list):
                    for item in content:
                        if isinstance(item, dict) and 'text' in item:
                            all_text += ' ' + item['text']
                elif isinstance(content, str):
                    all_text += ' ' + content

        keywords = extract_keywords(all_text, top_n=5)
        topics = ','.join(keywords) if keywords else 'general'

        duration_minutes = max(1, total_tokens // 100) if total_tokens > 0 else 1

        summary = 'Session completed'
        for msg in reversed(messages):
            if isinstance(msg, dict) and msg.get('role') == 'assistant':
                content = msg.get('content', [])
                if isinstance(content, list):
                    for item in content:
                        if isinstance(item, dict) and 'text' in item:
                            summary = item['text'][:200].replace('\n', ' ').strip()
                            break
                elif isinstance(content, str):
                    summary = content[:200].replace('\n', ' ').strip()
                if summary != 'Session completed':
                    break

        event = Event(
            timestamp=timestamp,
            tool='claude_cli',
            session_id=session_id,
            project=project_name,
            title=title,
            summary=summary,
            topics=topics,
            tokens_used=total_tokens,
            duration_minutes=duration_minutes,
            raw_content=json.dumps({'messages': messages}),
            processed_at=datetime.utcnow(),
            indexed=True
        )

        return event

    def update_daily_metadata(self):
        """Update DailyMetadata based on parsed events"""
        from collections import defaultdict

        events = self.db.query(Event).order_by(Event.timestamp).all()

        daily_stats = defaultdict(lambda: {
            'events': [],
            'total_tokens': 0,
            'tools': set(),
            'all_topics': []
        })

        for event in events:
            date_key = event.timestamp.strftime('%Y-%m-%d')
            daily_stats[date_key]['events'].append(event)
            daily_stats[date_key]['total_tokens'] += event.tokens_used or 0
            daily_stats[date_key]['tools'].add(event.tool)
            if event.topics:
                daily_stats[date_key]['all_topics'].extend(event.topics.split(','))

        for date_str, stats in daily_stats.items():
            existing = self.db.query(DailyMetadata).filter(
                DailyMetadata.date == date_str
            ).first()

            activity_score = min(100, len(stats['events']) * 15)

            hours = defaultdict(int)
            for event in stats['events']:
                hour = event.timestamp.hour
                hours[hour] += 1
            peak_hour = max(hours, key=hours.get) if hours else 0

            longest_event = max(stats['events'], key=lambda e: e.duration_minutes or 0)

            metadata = DailyMetadata(
                date=date_str,
                total_events=len(stats['events']),
                total_tokens=stats['total_tokens'],
                tools_used=','.join(sorted(stats['tools'])),
                primary_topics=','.join(set(stats['all_topics']))[:500],
                activity_score=activity_score,
                peak_hour=peak_hour,
                longest_session_id=longest_event.session_id,
                daily_summary=f"{len(stats['events'])} sessions, {stats['total_tokens']} tokens"
            )

            if existing:
                for key, value in metadata.__dict__.items():
                    if not key.startswith('_'):
                        setattr(existing, key, value)
            else:
                self.db.add(metadata)

        self.db.commit()
