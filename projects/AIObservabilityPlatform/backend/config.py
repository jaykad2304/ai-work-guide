import os
from pathlib import Path
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

class Config:
    PROJECT_ROOT = Path(__file__).parent.parent
    CLAUDE_DATA_DIR = Path.home() / '.claude'
    DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./data/timeline.db')
    DATA_DIR = PROJECT_ROOT / 'data'
    TRACKING_CUTOFF_FILE = DATA_DIR / 'tracking_cutoff.txt'
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'

    @classmethod
    def ensure_dirs(cls):
        cls.DATA_DIR.mkdir(exist_ok=True)

    @staticmethod
    def _normalize_datetime(value: datetime | None) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)

    @classmethod
    def get_tracking_cutoff(cls) -> datetime | None:
        if not cls.TRACKING_CUTOFF_FILE.exists():
            return None
        raw = cls.TRACKING_CUTOFF_FILE.read_text().strip()
        if not raw:
            return None
        try:
            return cls._normalize_datetime(datetime.fromisoformat(raw.replace('Z', '+00:00')))
        except ValueError:
            return None

    @classmethod
    def set_tracking_cutoff(cls, value: datetime):
        normalized = cls._normalize_datetime(value) or datetime.now(timezone.utc)
        cls.TRACKING_CUTOFF_FILE.write_text(normalized.isoformat())

    @classmethod
    def should_track_timestamp(cls, value: datetime | None) -> bool:
        cutoff = cls.get_tracking_cutoff()
        candidate = cls._normalize_datetime(value)
        if cutoff is None or candidate is None:
            return True
        return candidate >= cutoff

config = Config()
config.ensure_dirs()
