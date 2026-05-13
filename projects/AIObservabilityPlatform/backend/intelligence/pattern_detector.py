from datetime import datetime
from collections import defaultdict
from sqlalchemy.orm import Session
from backend.models import Event
from typing import List, Dict

class PatternDetector:
    def __init__(self, db: Session):
        self.db = db

    def detect_day_patterns(self) -> List[Dict]:
        """Detect which days user is most productive"""
        events = self.db.query(Event).all()

        day_counts = defaultdict(int)
        day_tokens = defaultdict(int)

        for event in events:
            day_name = event.timestamp.strftime('%A')
            day_counts[day_name] += 1
            day_tokens[day_name] += event.tokens_used or 0

        if not day_counts:
            return []

        avg_per_day = {day: day_tokens[day] / day_counts[day] for day in day_counts}
        busiest_day = max(avg_per_day, key=avg_per_day.get)

        patterns = []
        if day_counts[busiest_day] > 2:
            patterns.append({
                'type': 'day_preference',
                'content': f'Most productive on {busiest_day}s ({day_counts[busiest_day]} sessions)',
                'confidence': min(100, day_counts[busiest_day] * 20)
            })

        return patterns

    def detect_time_patterns(self) -> List[Dict]:
        """Detect peak hours"""
        events = self.db.query(Event).all()

        hour_counts = defaultdict(int)
        for event in events:
            hour = event.timestamp.hour
            hour_counts[hour] += 1

        if not hour_counts:
            return []

        peak_hour = max(hour_counts, key=hour_counts.get)
        peak_count = hour_counts[peak_hour]

        patterns = []
        if peak_count > 2:
            patterns.append({
                'type': 'time_preference',
                'content': f'Peak productivity around {peak_hour}:00 ({peak_count} sessions)',
                'confidence': min(100, peak_count * 25)
            })

        return patterns

    def detect_topic_patterns(self) -> List[Dict]:
        """Detect topic repetition patterns"""
        events = self.db.query(Event).all()

        topic_counts = defaultdict(int)
        for event in events:
            if event.topics:
                for topic in event.topics.split(','):
                    topic = topic.strip()
                    if topic:
                        topic_counts[topic] += 1

        patterns = []
        for topic, count in sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)[:3]:
            if count >= 3:
                patterns.append({
                    'type': 'favorite_topic',
                    'content': f'Frequently discusses {topic} ({count} sessions)',
                    'confidence': min(100, count * 20)
                })

        return patterns

    def detect_anomalies(self) -> List[Dict]:
        """Detect unusual patterns"""
        events = self.db.query(Event).all()

        if len(events) < 5:
            return []

        durations = [e.duration_minutes or 0 for e in events]
        avg_duration = sum(durations) / len(durations)

        anomalies = []
        for event in events:
            if event.duration_minutes and event.duration_minutes > avg_duration * 2:
                anomalies.append({
                    'type': 'long_session',
                    'content': f'Unusually long session: "{event.title}" ({event.duration_minutes} min)',
                    'confidence': 85.0
                })

        return anomalies[:5]

    def detect_all_patterns(self) -> List[Dict]:
        """Detect all patterns"""
        all_patterns = []
        all_patterns.extend(self.detect_day_patterns())
        all_patterns.extend(self.detect_time_patterns())
        all_patterns.extend(self.detect_topic_patterns())
        all_patterns.extend(self.detect_anomalies())

        return all_patterns
