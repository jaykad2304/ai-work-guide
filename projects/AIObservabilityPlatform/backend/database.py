from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from contextlib import contextmanager
from backend.config import config
from backend.models import Base

engine = create_engine(
    config.DATABASE_URL,
    connect_args={"check_same_thread": False} if 'sqlite' in config.DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Create all tables"""
    Base.metadata.create_all(bind=engine)

def get_db():
    """Dependency for FastAPI to get DB session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@contextmanager
def get_db_context():
    """Context manager for standalone DB operations"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
