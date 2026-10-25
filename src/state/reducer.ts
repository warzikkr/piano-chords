import type { CardId, Level } from '../theory/chords'
import { newStoredCard, ratingFor, reviewCard, type AnswerResult, type TaskType } from '../learning/scheduler'
import { createProgress, dayKey, emptyDay, type Progress, type Settings } from './progress'

export type Action =
  | { type: 'answer'; id: CardId; task: TaskType; result: AnswerResult; isNew: boolean; now: number; optionCount?: number }
  | { type: 'lessonSeen'; level: Level }
  | { type: 'sessionDone'; now: number }
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'import'; progress: Progress }
  | { type: 'reset' }

function yesterdayKey(now: number): string {
  const d = new Date(now)
  d.setDate(d.getDate() - 1)
  return dayKey(d.getTime())
}

export function reducer(p: Progress, a: Action): Progress {
  switch (a.type) {
    case 'answer': {
      const card = p.cards[a.id] ?? newStoredCard(a.now)
      const rating = ratingFor(a.task, a.result, a.optionCount ?? 4)
      const today = dayKey(a.now)
      const day = p.days[today] ?? emptyDay()
      const introduced = a.isNew || p.introduced[a.id] === undefined ? { ...p.introduced, [a.id]: p.introduced[a.id] ?? a.now } : p.introduced
      return {
        ...p,
        cards: { ...p.cards, [a.id]: reviewCard(card, rating, a.now) },
        introduced,
        days: {
          ...p.days,
          [today]: {
            ...day,
            reviews: day.reviews + (a.isNew ? 0 : 1),
            newCards: day.newCards + (a.isNew ? 1 : 0),
            correct: day.correct + (a.result.correct ? 1 : 0),
          },
        },
      }
    }
    case 'lessonSeen':
      return p.lessonsSeen.includes(a.level) ? p : { ...p, lessonsSeen: [...p.lessonsSeen, a.level] }
    case 'sessionDone': {
      const today = dayKey(a.now)
      const day = p.days[today] ?? emptyDay()
      let streak = p.streak
      if (p.lastSessionDay === yesterdayKey(a.now)) streak += 1
      else if (p.lastSessionDay !== today) streak = 1
      return { ...p, streak, lastSessionDay: today, days: { ...p.days, [today]: { ...day, sessionDone: true } } }
    }
    case 'settings':
      return { ...p, settings: { ...p.settings, ...a.patch } }
    case 'import':
      return a.progress
    case 'reset':
      return { ...createProgress(), settings: p.settings }
  }
}
