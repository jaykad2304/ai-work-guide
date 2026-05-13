from typing import List

class TopicExtractor:
    def __init__(self):
        self.known_topics = {
            'RAG': ['retrieval', 'augmented', 'generation', 'vector', 'embedding', 'search'],
            'APIs': ['api', 'endpoint', 'request', 'response', 'integration', 'http'],
            'Payments': ['payment', 'settlement', 'transaction', 'liquidity', 'finance'],
            'Agents': ['agent', 'autonomous', 'loop', 'react', 'orchestration'],
            'Fine-tuning': ['fine-tune', 'finetune', 'lora', 'adapter', 'training'],
            'Database': ['database', 'sql', 'postgres', 'chroma', 'pinecone', 'vector'],
            'Trading': ['trade', 'algo', 'stock', 'nse', 'strategy', 'market'],
            'Code': ['code', 'function', 'class', 'method', 'implementation', 'refactor'],
            'Performance': ['optimize', 'latency', 'cache', 'index', 'speed'],
            'Security': ['auth', 'token', 'encryption', 'password', 'security']
        }

    def extract_topics(self, text: str) -> List[str]:
        """Extract topics from text"""
        text_lower = text.lower()
        extracted = []

        for topic, keywords in self.known_topics.items():
            for keyword in keywords:
                if keyword in text_lower:
                    extracted.append(topic)
                    break

        seen = set()
        result = []
        for topic in extracted:
            if topic not in seen:
                result.append(topic)
                seen.add(topic)

        return result if result else ['General']

    def get_topic_confidence(self, text: str, topic: str) -> float:
        """Get confidence score for a topic (0-100)"""
        topic_keywords = self.known_topics.get(topic, [])
        text_lower = text.lower()

        matches = sum(1 for kw in topic_keywords if kw in text_lower)
        max_possible = len(topic_keywords)

        if max_possible == 0:
            return 0.0

        confidence = (matches / max_possible) * 100
        return min(100, confidence)
