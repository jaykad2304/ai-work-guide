import json
from pathlib import Path
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.collectors import BaseCollector
from backend.models import Event
from backend.parsers.utils import extract_keywords
from backend.config import config


class CodexCliCollector(BaseCollector):
    tool_name = 'codex_cli'
    display_name = 'Codex CLI'
    status = 'supported'
    description = 'Captures Codex CLI sessions from local JSONL session transcripts.'
    setup_hint = 'Install/use Codex CLI normally; sessions are read from ~/.codex/sessions.'
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
            collected_text = []
            assistant_text = []

            for line in lines:
                if not line.strip():
                    continue
                obj = json.loads(line)
                if obj.get('type') == 'session_meta':
                    meta = obj.get('payload', obj)
                else:
                    self._collect_text(obj, collected_text, assistant_text)

            if not meta:
                return None

            session_id = f"codex_cli-{meta.get('id', 'unknown')}"
            existing = db.query(Event).filter(Event.session_id == session_id).first()

            ts_str = meta.get('timestamp', '')
            if ts_str.endswith('Z'):
                ts_str = ts_str[:-1] + '+00:00'
            timestamp = datetime.fromisoformat(ts_str) if ts_str else datetime.utcnow()
            if not config.should_track_timestamp(timestamp):
                return None

            content = ' '.join(t for t in collected_text if t).strip()
            assistant_summary = ' '.join(t for t in assistant_text if t).strip()
            project_name = self._extract_project_name(meta.get('cwd', ''))
            title = self._build_title(content, assistant_summary, meta)
            tokens = max(len(content) // 4, len(assistant_summary) // 5)
            duration = max(1, tokens // 100)
            topics = ','.join(extract_keywords(content, top_n=5))
            summary = self._build_summary(content, assistant_summary)

            payload = {
                'timestamp': timestamp,
                'tool': 'codex_cli',
                'session_id': session_id,
                'project': project_name,
                'title': title,
                'summary': summary,
                'topics': topics,
                'tokens_used': tokens,
                'duration_minutes': duration,
                'raw_content': json.dumps({
                    'file': str(file_path),
                    'cwd': meta.get('cwd', ''),
                    'excerpt': content,
                    'assistant_summary': assistant_summary,
                    'summary_status': 'ready'
                }),
                'indexed': True
            }

            if existing:
                changed = False
                for field, value in payload.items():
                    if getattr(existing, field) != value:
                        setattr(existing, field, value)
                        changed = True
                if changed:
                    db.commit()
                    return existing
                return None

            event = Event(**payload)
            db.add(event)
            db.commit()
            return event
        except Exception as e:
            db.rollback()
            print(f"Error parsing Codex session {file_path}: {e}")
            return None

    def _collect_text(self, obj, collected_text, assistant_text):
        obj_type = obj.get('type')
        payload = obj.get('payload', {})

        if obj_type == 'message':
            self._append_text_from_value(payload, collected_text)
            return

        if obj_type == 'response_item' and isinstance(payload, dict):
            self._append_text_from_value(payload.get('content'), collected_text, assistant_text)
            return

        if obj_type == 'event_msg' and isinstance(payload, dict):
            text = payload.get('message')
            if text:
                target = assistant_text if payload.get('phase') == 'commentary' else collected_text
                target.append(self._clean_text(text))

    def _append_text_from_value(self, value, collected_text, assistant_text=None):
        if isinstance(value, str):
            cleaned = self._clean_text(value)
            if cleaned and self._is_meaningful_text(cleaned):
                collected_text.append(cleaned)
            return

        if isinstance(value, dict):
            if 'text' in value:
                self._append_text_from_value(value.get('text'), collected_text, assistant_text)
            elif 'content' in value:
                self._append_text_from_value(value.get('content'), collected_text, assistant_text)
            return

        if isinstance(value, list):
            for item in value:
                if not isinstance(item, dict):
                    continue
                text = item.get('text')
                if text:
                    cleaned = self._clean_text(text)
                    if not cleaned or not self._is_meaningful_text(cleaned):
                        continue
                    collected_text.append(cleaned)
                    if assistant_text is not None and item.get('type') == 'output_text':
                        assistant_text.append(cleaned)

    def _clean_text(self, text: str) -> str:
        return ' '.join(str(text).replace('\n', ' ').split()).strip()

    def _is_meaningful_text(self, text: str) -> bool:
        lowered = text.lower()
        ignored_prefixes = (
            '<permissions instructions>',
            '<environment_context>',
            '<collaboration_mode>',
            '<turn_aborted>',
            'you are codex, a coding agent',
            '# personality',
            '# general',
            'filesystem sandboxing defines',
            'collaboration mode:',
            'you are now in default mode',
            'any previous instructions for other modes',
            'knowledge cutoff:',
            'current date:',
        )
        if lowered.startswith(ignored_prefixes):
            return False
        if lowered in {'commentary', 'completed'}:
            return False
        return True

    def _extract_project_name(self, cwd: str) -> Optional[str]:
        if not cwd:
            return None
        path = Path(cwd)
        return path.name or cwd

    def _build_title(self, content: str, assistant_summary: str, meta: dict) -> str:
        for candidate in [content, assistant_summary]:
            if candidate:
                title = candidate[:72].strip()
                return f"{title}..." if len(candidate) > 72 else title
        return f"Codex session {meta.get('id', '?')[:8]}"

    def _build_summary(self, content: str, assistant_summary: str) -> str:
        if assistant_summary:
            return assistant_summary
        if content:
            return content
        return 'Codex CLI session'
