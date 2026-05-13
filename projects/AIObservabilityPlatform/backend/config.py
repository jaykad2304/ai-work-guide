import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

class Config:
    PROJECT_ROOT = Path(__file__).parent.parent
    CLAUDE_DATA_DIR = Path.home() / '.claude'
    DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./data/timeline.db')
    DATA_DIR = PROJECT_ROOT / 'data'
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'

    @classmethod
    def ensure_dirs(cls):
        cls.DATA_DIR.mkdir(exist_ok=True)

config = Config()
config.ensure_dirs()
