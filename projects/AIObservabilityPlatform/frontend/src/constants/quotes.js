const QUOTES = [
  "Your AI journey: where tokens flow like water and decisions linger like ghosts.",
  "I see you've been productive. Mostly talking to AI. That's... something.",
  "Another day, another thousand tokens burned for wisdom.",
  "The machines don't judge. Well, they do. But silently.",
  "Consistency? You and I both know that's a myth.",
  "At least the AI is listening. More than I can say for humans.",
  "Bold of you to assume your productivity metrics mean anything.",
  "Stats don't lie. They just... represent reality in flattering ways.",
  "Your coding velocity is impressive. For an AI. Which is doing the coding.",
  "The projects pile up, but at least you've got an observer now.",
  "I notice you're very dedicated. To chatting with AI. Love it for you.",
  "You're building things. With AI. How very 2024 of you.",
  "The tokens know. The database remembers. I see everything.",
  "Another marathon session. Your local coffee roaster must love you.",
  "Honestly, at this rate, you'll be fluent in AI by year's end.",
  "You know what they say about consistency... wait, they don't.",
  "The dashboard doesn't judge. It just... observes.",
  "Your attention span is... varied. Very varied.",
  "Peak productivity hours? Apparently whenever you're awake.",
  "You're either a genius or very confused. The timestamps don't say."
]

export function getRandomQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)]
}
