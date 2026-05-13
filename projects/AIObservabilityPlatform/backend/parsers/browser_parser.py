import json
import sqlite3
import shutil
import tempfile
from pathlib import Path
from datetime import datetime
from sqlalchemy.orm import Session
from backend.models import Event

class BrowserParser:
    def __init__(self, db: Session):
        self.db = db
        self.chrome_history_path = Path.home() / '.config' / 'google-chrome' / 'Default' / 'History'
        self.firefox_history_path = Path.home() / '.mozilla' / 'firefox'

    def parse_browser_history(self):
        """Parse browser history for AI tool usage"""
        events = []

        # Try Chrome first
        events.extend(self._parse_chrome_history())

        # Try Firefox
        events.extend(self._parse_firefox_history())

        return events

    def _parse_chrome_history(self):
        """Parse Chrome history for Claude.ai and ChatGPT visits"""
        events = []

        if not self.chrome_history_path.exists():
            return events

        tmp_path = None
        try:
            # Copy Chrome history to temp location (Chrome locks the original)
            with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tmp:
                tmp_path = tmp.name
            shutil.copy2(self.chrome_history_path, tmp_path)

            # Chrome stores history in SQLite
            conn = sqlite3.connect(f'file:{tmp_path}?mode=ro', uri=True)
            cursor = conn.cursor()

            # Query URLs containing claude or chatgpt
            cursor.execute("""
                SELECT url, title, last_visit_time FROM urls
                WHERE url LIKE '%claude.ai%' OR url LIKE '%chatgpt%'
                ORDER BY last_visit_time DESC
                LIMIT 50
            """)

            for url, title, chrome_timestamp in cursor.fetchall():
                # Chrome timestamps are in microseconds since 1601-01-01
                timestamp = datetime.utcfromtimestamp((chrome_timestamp / 1e6) - 11644473600)

                tool = 'claude_web' if 'claude' in url else 'chatgpt'

                event = Event(
                    timestamp=timestamp,
                    tool=tool,
                    session_id=f"{tool}-{chrome_timestamp}",
                    title=title or f"Visited {tool}",
                    summary=f"Browsed {tool}",
                    topics=tool.replace('_', ''),
                    tokens_used=0,
                    duration_minutes=1,
                    raw_content=json.dumps({"url": url}),
                    indexed=True
                )
                events.append(event)

            conn.close()
        except Exception as e:
            print(f"Error parsing Chrome history: {e}")
        finally:
            # Clean up temp file
            try:
                Path(tmp_path).unlink()
            except:
                pass

        return events

    def _parse_firefox_history(self):
        """Parse Firefox history for Claude.ai and ChatGPT visits"""
        events = []

        if not self.firefox_history_path.exists():
            return events

        try:
            # Find the default profile
            profiles = list(self.firefox_history_path.glob('*.default-release'))
            if not profiles:
                profiles = list(self.firefox_history_path.glob('*.default'))

            for profile_dir in profiles:
                places_db = profile_dir / 'places.sqlite'
                if not places_db.exists():
                    continue

                # Copy Firefox history to temp location (Firefox locks the original)
                with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tmp:
                    tmp_path = tmp.name
                shutil.copy2(places_db, tmp_path)

                conn = sqlite3.connect(f'file:{tmp_path}?mode=ro', uri=True)
                cursor = conn.cursor()

                cursor.execute("""
                    SELECT url, title, last_visit_date FROM moz_places
                    WHERE url LIKE '%claude.ai%' OR url LIKE '%chatgpt%'
                    ORDER BY last_visit_date DESC
                    LIMIT 50
                """)

                for url, title, firefox_timestamp in cursor.fetchall():
                    # Firefox timestamps are in microseconds
                    timestamp = datetime.utcfromtimestamp(firefox_timestamp / 1e6)

                    tool = 'claude_web' if 'claude' in url else 'chatgpt'

                    event = Event(
                        timestamp=timestamp,
                        tool=tool,
                        session_id=f"{tool}-{firefox_timestamp}",
                        title=title or f"Visited {tool}",
                        summary=f"Browsed {tool}",
                        topics=tool.replace('_', ''),
                        tokens_used=0,
                        duration_minutes=1,
                        raw_content=json.dumps({"url": url}),
                        indexed=True
                    )
                    events.append(event)

                conn.close()
                # Clean up temp file
                try:
                    Path(tmp_path).unlink()
                except:
                    pass
        except Exception as e:
            print(f"Error parsing Firefox history: {e}")

        return events
