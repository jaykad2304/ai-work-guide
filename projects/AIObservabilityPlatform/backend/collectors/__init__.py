from abc import ABC, abstractmethod
from pathlib import Path
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.models import Event


class BaseCollector(ABC):
    """Abstract base class for data collectors."""

    tool_name: str
    watch_paths: List[Path]

    @abstractmethod
    def parse_all(self, db: Session) -> List[Event]:
        """Scan all sessions, add new ones to DB, return new events."""
        pass

    @abstractmethod
    def parse_file(self, file_path: Path, db: Session) -> Optional[Event]:
        """Parse a single session file and add to DB if new."""
        pass
