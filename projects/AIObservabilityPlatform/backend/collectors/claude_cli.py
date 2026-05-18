from pathlib import Path
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.collectors import BaseCollector
from backend.parsers.claude_cli_parser import ClaudeCliParser
from backend.models import Event


class ClaudeCliCollector(BaseCollector):
    tool_name = 'claude_cli'
    display_name = 'Claude CLI'
    status = 'supported'
    description = 'Captures Claude CLI sessions from local JSONL project transcripts.'
    setup_hint = 'Install/use Claude CLI normally; sessions are read from ~/.claude/projects.'
    watch_paths = [Path.home() / '.claude' / 'sessions']

    def parse_all(self, db: Session) -> List[Event]:
        parser = ClaudeCliParser(db)
        events = parser.parse_all_sessions()
        parser.update_daily_metadata()
        return events

    def parse_file(self, file_path: Path, db: Session) -> Optional[Event]:
        parser = ClaudeCliParser(db)
        return parser._parse_session_file(file_path)
