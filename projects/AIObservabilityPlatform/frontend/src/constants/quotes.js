export const sarcasticQuotes = [
  "Another RAG conversation? You're really committed to the bit.",
  "May 13: The day you asked about vector databases for the 47th time.",
  "You asked Claude the same question 3 times. Feeling confident?",
  "3 payment conversations in one day. Your fintech journey is inspiring.",
  "You're really pushing the boundaries of AI observability. Or procrastinating.",
  "Touch grass challenge: FAILED",
  "Your AI journey: enlightening. Your sleep schedule: questionable.",
  "API integration at 3 AM? Living that startup life, I see.",
  "You've researched fine-tuning 8 times but haven't built anything yet.",
  "Your longest session was 47 minutes. Brilliant or concerning?",
  "You're discussing trading algorithms on your day off. Balance: 0/10",
  "Another all-nighter working on agents? These are the stories you'll tell.",
  "You asked about embeddings while on a meeting. Multitasking pro.",
  "Vector databases on your mind 24/7. This is what passion looks like.",
  "You've built 3 POCs this month. Follow-through: pending.",
  "Your activity graph looks like a heartbeat. Are you okay?",
  "Nobody has ever cared about LLMs this much. Except you.",
  "You're debugging at 4 AM. Respect.",
  "Peak productivity: Thursday at 2 PM. Consistent.",
  "Your average session length: way too long. Touch grass.",
  "RAG is love. RAG is life.",
  "You're building an AI observability tool. Peak self-awareness.",
  "Your timeline: fascinating. Your free time: nonexistent."
]

export function getRandomQuote() {
  return sarcasticQuotes[Math.floor(Math.random() * sarcasticQuotes.length)]
}

export function getContextualQuote(stats) {
  if (stats && stats.totalSessions > 20) {
    return "You're really committed to this. Or procrastinating. Maybe both."
  }
  if (stats && stats.favoriteTopic === 'RAG') {
    return "RAG is love. RAG is life. Seek help."
  }
  return getRandomQuote()
}
