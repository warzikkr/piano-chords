import { Rating, State, createEmptyCard, fsrs, type Card } from 'ts-fsrs'

export type TaskType = 'build' | 'recognize' | 'spell' | 'ear'

export interface AnswerResult {
  correct: boolean
  usedHint: boolean
  seconds: number
}

export const TIME_THRESHOLDS: Record<TaskType, number> = { build: 8, recognize: 6, spell: 8, ear: 5 }

export function ratingFor(task: TaskType, r: AnswerResult, optionCount = 4): Rating {
  if (!r.correct) return Rating.Again
  if (r.usedHint) return Rating.Hard
  const fast = r.seconds < TIME_THRESHOLDS[task] / 3
  if (fast && !(task === 'ear' && optionCount <= 2)) return Rating.Easy
  return Rating.Good
}

/** Serializable mirror of a ts-fsrs Card (times in epoch milliseconds). */
export interface StoredCard {
  due: number
  stability: number
  difficulty: number
  elapsedDays: number
  scheduledDays: number
  learningSteps: number
  reps: number
  lapses: number
  state: number
  lastReview: number | null
}

const scheduler = fsrs({ enable_fuzz: false })

function fromFsrs(card: Card): StoredCard {
  return {
    due: new Date(card.due).getTime(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
    learningSteps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    lastReview: card.last_review ? new Date(card.last_review).getTime() : null,
  }
}

function toFsrs(card: StoredCard): Card {
  return {
    due: new Date(card.due),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsedDays,
    scheduled_days: card.scheduledDays,
    learning_steps: card.learningSteps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state as State,
    last_review: card.lastReview === null ? undefined : new Date(card.lastReview),
  }
}

export function newStoredCard(now: number): StoredCard {
  return fromFsrs(createEmptyCard(new Date(now)))
}

export function reviewCard(card: StoredCard, rating: Rating, now: number): StoredCard {
  const grade = rating === Rating.Manual ? Rating.Good : rating
  const { card: next } = scheduler.next(toFsrs(card), new Date(now), grade)
  return fromFsrs(next)
}

export function isDue(card: StoredCard, now: number): boolean {
  return card.due <= now
}

export type Mastery = 0 | 1 | 2 | 3 | 4

export function mastery(card: StoredCard | undefined): Mastery {
  if (!card || card.reps === 0) return 0
  if (card.stability < 2) return 1
  if (card.stability < 10) return 2
  if (card.stability < 30) return 3
  return 4
}

export const MASTERY_LABELS = ['новый', 'учится', 'знаю', 'уверенно', 'выучено']
