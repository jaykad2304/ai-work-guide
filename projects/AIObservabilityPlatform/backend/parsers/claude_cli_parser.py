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
        """Parse all Claude CLI sessions from ~/.claude/"""
        sessions_dir = self.claude_dir / 'sessions'

        if not sessions_dir.exists():
            print(f"✗ Claude sessions directory not found: {sessions_dir}")
            return []

        parsed_events = []
        for session_file in sorted(sessions_dir.glob('*.json')):
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
        """Parse a single session JSON file"""
        with open(file_path, 'r') as f:
            session_data = json.load(f)

        messages = session_data.get('messages', [])
        if not messages:
            return None

        timestamp_str = session_data.get('created_at', datetime.utcnow().isoformat())
        timestamp = parse_iso_datetime(timestamp_str)

        session_id = session_data.get('id', file_path.stem)
        title = extract_title_from_messages(messages)

        total_tokens = sum(
            extract_tokens_from_message(msg) for msg in messages
        )

        all_text = ' '.join([msg.get('content', '') for msg in messages])
        keywords = extract_keywords(all_text, top_n=5)
        topics = ','.join(keywords) if keywords else 'general'

        duration_minutes = max(1, total_tokens // 100)

        summary = 'Session completed'
        for msg in reversed(messages):
            if msg.get('role') == 'assistant':
                content = msg.get('content', '')
                summary = content[:200].replace('\n', ' ').strip()
                break

        event = Event(
            timestamp=timestamp,
            tool='claude_cli',
            session_id=session_id,
            title=title,
            summary=summary,
            topics=topics,
            tokens_used=total_tokens,
            duration_minutes=duration_minutes,
            raw_content=json.dumps(session_data),
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
