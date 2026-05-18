from abc import ABC, abstractmethod
from pathlib import Path
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.models import Event


class BaseCollector(ABC):
    """Abstract base class for AI tool data collectors.

    New integrations should subclass this and normalize provider-specific
    transcripts/logs into Event rows. Keep provider parsing inside the collector;
    the rest of the app should only depend on the Event model.
    """

    tool_name: str
    watch_paths: List[Path]
    display_name: str = ''
    status: str = 'supported'
    description: str = ''
    setup_hint: str = ''

    @abstractmethod
    def parse_all(self, db: Session) -> List[Event]:
        """Scan all sessions, add new ones to DB, return new events."""
        pass

    @abstractmethod
    def parse_file(self, file_path: Path, db: Session) -> Optional[Event]:
        """Parse a single session file and add to DB if new."""
        pass

    def coverage(self) -> dict:
        """Return product-facing connector status for the Coverage UI/API."""
        return {
            'name': self.tool_name,
            'display_name': self.display_name or self.tool_name.replace('_', ' ').title(),
            'status': self.status,
            'watch_paths': [str(path) for path in self.watch_paths],
            'description': self.description,
            'setup_hint': self.setup_hint,
        }
