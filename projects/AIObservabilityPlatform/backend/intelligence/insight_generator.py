from datetime import datetime
from sqlalchemy.orm import Session
from backend.models import Event, Insight
from backend.intelligence.pattern_detector import PatternDetector
from backend.intelligence.topic_extractor import TopicExtractor

class InsightGenerator:
    def __init__(self, db: Session):
        self.db = db
        self.detector = PatternDetector(db)
        self.extractor = TopicExtractor()

    def generate_all_insights(self):
        """Generate all types of insights"""
        self.db.query(Insight).delete()
        self.db.commit()

        patterns = self.detector.detect_all_patterns()
        for pattern in patterns:
            insight = Insight(
                insight_type='pattern',
                content=pattern['content'],
                confidence=pattern['confidence']
            )
            self.db.add(insight)

        recommendations = self._generate_recommendations()
        for rec in recommendations:
            insight = Insight(
                insight_type='recommendation',
                content=rec['content'],
                confidence=rec['confidence'],
                related_topics=rec.get('topics')
            )
            self.db.add(insight)

        self.db.commit()

    def _generate_recommendations(self):
        """Generate actionable recommendations"""
        events = self.db.query(Event).all()
        recommendations = []

        if len(events) < 2:
            return recommendations

        topic_counts = {}
        for event in events:
            if event.topics:
                for topic in event.topics.split(','):
                    topic = topic.strip()
                    if topic:
                        topic_counts[topic] = topic_counts.get(topic, 0) + 1

        if topic_counts:
            favorite = max(topic_counts, key=topic_counts.get)
            if topic_counts[favorite] >= 3:
                recommendations.append({
                    'content': f'Consider a deep-dive project on {favorite} since you\'ve explored it {topic_counts[favorite]} times',
                    'confidence': 80.0,
                    'topics': favorite
                })

        if 'RAG' in topic_counts and 'Fine-tuning' not in topic_counts:
            recommendations.append({
                'content': 'You\'ve worked on RAG systems. Consider exploring fine-tuning for domain-specific embeddings',
                'confidence': 75.0,
                'topics': 'Fine-tuning,RAG'
            })

        avg_duration = sum(e.duration_minutes or 0 for e in events) / len(events)
        if avg_duration > 20:
            recommendations.append({
                'content': f'Your average session is {int(avg_duration)} min. Break complex tasks into smaller focused sessions',
                'confidence': 70.0,
                'topics': 'Productivity'
            })

        return recommendations

    def get_daily_summary(self, date: str) -> str:
        """Generate human-readable daily summary"""
        from datetime import datetime as dt

        date_obj = dt.strptime(date, '%Y-%m-%d').date()

        events = self.db.query(Event)\
            .filter(Event.timestamp.cast('date') == str(date_obj))\
            .all()

        if not events:
            return f"No activity recorded on {date}"

        total_tokens = sum(e.tokens_used or 0 for e in events)
        total_time = sum(e.duration_minutes or 0 for e in events)

        all_topics = []
        for event in events:
            if event.topics:
                all_topics.extend(event.topics.split(','))

        topics_str = ', '.join(set(all_topics)) if all_topics else 'general'

        summary = f"{len(events)} sessions ({total_time} min, {total_tokens} tokens) focused on {topics_str}"
        return summary
