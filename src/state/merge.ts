import type { StoredCard } from '../learning/scheduler'
import type { Level } from '../theory/chords'
import type { DayStats, Progress, TopicScore } from './progress'

function newerCard(a: StoredCard, b: StoredCard): StoredCard {
  if (a.reps !== b.reps) return a.reps > b.reps ? a : b
  return (a.lastReview ?? 0) >= (b.lastReview ?? 0) ? a : b
}

function mergeDay(a: DayStats | undefined, b: DayStats | undefined): DayStats {
  const x = a ?? { reviews: 0, newCards: 0, correct: 0, sessionDone: false }
  const y = b ?? { reviews: 0, newCards: 0, correct: 0, sessionDone: false }
  return {
    reviews: Math.max(x.reviews, y.reviews),
    newCards: Math.max(x.newCards, y.newCards),
    correct: Math.max(x.correct, y.correct),
    sessionDone: x.sessionDone || y.sessionDone,
  }
}

/**
 * Combine two copies of the same learner's progress (for example phone and laptop).
 * Cards keep whichever copy has seen more reviews, days and lessons are unioned,
 * and streak and settings come from the copy that changed last.
 */
export function mergeProgress(local: Progress, remote: Progress): Progress {
  const newer = remote.updatedAt > local.updatedAt ? remote : local
  const cards: Record<string, StoredCard> = { ...local.cards }
  for (const [id, card] of Object.entries(remote.cards)) cards[id] = cards[id] ? newerCard(cards[id], card) : card
  const introduced: Record<string, number> = { ...local.introduced }
  for (const [id, t] of Object.entries(remote.introduced)) introduced[id] = id in introduced ? Math.min(introduced[id], t) : t
  const days: Record<string, DayStats> = {}
  for (const key of new Set([...Object.keys(local.days), ...Object.keys(remote.days)])) days[key] = mergeDay(local.days[key], remote.days[key])
  const lessonsSeen = [...new Set<Level>([...local.lessonsSeen, ...remote.lessonsSeen])].sort((a, b) => a - b)
  const theoryRead = [...new Set([...local.theoryRead, ...remote.theoryRead])].sort()
  const theoryScores: Record<string, TopicScore> = { ...local.theoryScores }
  for (const [id, s] of Object.entries(remote.theoryScores)) {
    const l = theoryScores[id]
    theoryScores[id] = l ? { asked: Math.max(l.asked, s.asked), correct: Math.max(l.correct, s.correct) } : s
  }
  return {
    version: 1,
    cards,
    introduced,
    lessonsSeen,
    days,
    streak: newer.streak,
    lastSessionDay: newer.lastSessionDay,
    settings: { ...newer.settings },
    updatedAt: Math.max(local.updatedAt, remote.updatedAt),
    theoryRead,
    theoryScores,
  }
}
