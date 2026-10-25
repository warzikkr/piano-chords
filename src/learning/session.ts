import { parseCardId, type CardId, type ChordSpec, type Level } from '../theory/chords'
import { KEYS, PROGRESSIONS, keyIsRecommended } from '../theory/progressions'
import type { Pc } from '../theory/notes'
import { dayKey, type Progress } from '../state/progress'
import { CURRICULUM, indexOf, levelOf } from './curriculum'
import { EAR_TYPES, shuffle, type Rng } from './distractors'
import { topicById } from './theory'
import { isDue, mastery, type StoredCard, type TaskType } from './scheduler'

export type SessionItem =
  | { kind: 'lesson'; level: Level }
  /** Meet a new chord: see it, hear it, read its notes. */
  | { kind: 'intro'; id: CardId }
  /** Repeat it on the keyboard with the keys highlighted; not graded. */
  | { kind: 'practice'; id: CardId }
  /** Graded exercise; feeds FSRS. `weak`: extra practice after recent misses; `mixed`: a known chord kept fresh; `retry`: repeat of a miss in this session. */
  | { kind: 'card'; id: CardId; task: TaskType; isNew: boolean; weak?: boolean; mixed?: boolean; retry?: boolean }
  | { kind: 'progression'; progressionId: string; keyRoot: Pc }
  /** A theory self-check question from a topic already read. */
  | { kind: 'quiz'; topicId: string; question: number }

export function availableTasks(spec: ChordSpec): TaskType[] {
  const tasks: TaskType[] = ['build', 'recognize', 'spell']
  if (spec.inversion === 0 && EAR_TYPES.includes(spec.type)) tasks.push('ear')
  return tasks
}

export function learnerLevel(p: Progress): Level {
  let level: Level = 1
  for (const id of Object.keys(p.introduced)) {
    if (indexOf(id) < 0) continue
    const l = levelOf(id)
    if (l > level) level = l
  }
  return level
}

/** Ear training only makes sense once the chord itself is known. */
const EAR_MIN_MASTERY = 2
export const WEAK_LIMIT = 3
export const MIXED_LIMIT = 2

export function pickTask(isNew: boolean, spec: ChordSpec, rng: Rng, counter: number, card?: StoredCard): TaskType {
  if (isNew || rng() < 0.5) return 'build'
  const others = availableTasks(spec).filter((t) => t !== 'build' && (t !== 'ear' || mastery(card) >= EAR_MIN_MASTERY))
  return others[counter % others.length]
}

/** Chords missed lately that are not due yet: they get extra practice until they settle. */
export function weakIds(p: Progress, now: number): CardId[] {
  return Object.entries(p.cards)
    .filter(([, card]) => card.lapses > 0 && mastery(card) <= 2 && !isDue(card, now))
    .sort((a, b) => (b[1].lastReview ?? 0) - (a[1].lastReview ?? 0))
    .map(([id]) => id)
    .slice(0, WEAK_LIMIT)
}

/** Well-known chords not due yet; a couple are mixed into every session. */
export function mixedIds(p: Progress, now: number, rng: Rng, exclude: Set<CardId>): CardId[] {
  const pool = Object.entries(p.cards)
    .filter(([id, card]) => !exclude.has(id) && mastery(card) >= 3 && !isDue(card, now))
    .map(([id]) => id)
  return shuffle(pool, rng).slice(0, MIXED_LIMIT)
}

function dueIds(p: Progress, now: number): CardId[] {
  return Object.entries(p.cards)
    .filter(([, card]) => isDue(card, now))
    .sort((a, b) => a[1].due - b[1].due)
    .map(([id]) => id)
}

function notIntroduced(p: Progress): CardId[] {
  return CURRICULUM.filter((e) => p.introduced[e.id] === undefined).map((e) => e.id)
}

export function sessionCounts(p: Progress, now: number): { due: number; newAvailable: number; weak: number } {
  const due = Math.min(dueIds(p, now).length, p.settings.maxReviews)
  const today = dayKey(now)
  const introducedToday = Object.values(p.introduced).filter((t) => dayKey(t) === today).length
  const remaining = notIntroduced(p).length
  const newAvailable = Math.max(0, Math.min(p.settings.newPerDay - introducedToday, remaining))
  return { due, newAvailable, weak: weakIds(p, now).length }
}

export function chooseProgression(p: Progress, rng: Rng): SessionItem | null {
  const has = (id: string) => p.introduced[id] !== undefined
  const candidates = PROGRESSIONS.flatMap((pr) =>
    KEYS.filter((k) => keyIsRecommended(pr, k, has)).map((k) => ({
      kind: 'progression' as const,
      progressionId: pr.id,
      keyRoot: k,
    })),
  )
  if (candidates.length === 0) return null
  const pop = candidates.filter((c) => c.progressionId === 'pop')
  const pool = pop.length ? pop : candidates
  return pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))]
}

export function buildSession(p: Progress, now: number, rng: Rng, extraNew = 0): SessionItem[] {
  const { due, newAvailable } = sessionCounts(p, now)
  const items: SessionItem[] = []

  // 1. Learn: lesson for a new level, then meet and repeat each new chord.
  const newIds = notIntroduced(p).slice(0, newAvailable + extraNew)
  const lessonsShown = new Set<Level>(p.lessonsSeen)
  for (const id of newIds) {
    const level = levelOf(id)
    if (!lessonsShown.has(level)) {
      lessonsShown.add(level)
      items.push({ kind: 'lesson', level })
    }
    items.push({ kind: 'intro', id }, { kind: 'practice', id })
  }

  // 2. Test the new chords, then review what is due.
  for (const id of newIds) items.push({ kind: 'card', id, task: 'build', isNew: true })
  dueIds(p, now)
    .slice(0, due)
    .forEach((id, i) => items.push({ kind: 'card', id, task: pickTask(false, parseCardId(id), rng, i, p.cards[id]), isNew: false }))

  // 2b. Extra practice for recent misses, and a couple of known chords to keep them fresh.
  const present = new Set(items.flatMap((i) => (i.kind === 'card' ? [i.id] : [])))
  for (const id of weakIds(p, now)) {
    if (present.has(id)) continue
    present.add(id)
    items.push({ kind: 'card', id, task: 'build', isNew: false, weak: true })
  }
  mixedIds(p, now, rng, present).forEach((id, i) => items.push({ kind: 'card', id, task: pickTask(false, parseCardId(id), rng, i + 7, p.cards[id]), isNew: false, mixed: true }))

  // 3. A couple of theory questions from topics already read.
  for (const q of pickQuizzes(p, rng, 2)) items.push(q)

  // 4. Play a progression made of chords already known.
  const progression = chooseProgression(p, rng)
  if (progression) items.push(progression)
  return items
}

export function pickQuizzes(p: Progress, rng: Rng, limit: number): SessionItem[] {
  const pool: SessionItem[] = []
  for (const topicId of p.theoryRead) {
    let topic
    try {
      topic = topicById(topicId)
    } catch {
      continue
    }
    topic.questions.forEach((_, question) => pool.push({ kind: 'quiz', topicId, question }))
  }
  return shuffle(pool, rng).slice(0, limit)
}

export function buildPracticeSession(id: CardId): SessionItem[] {
  const tasks: TaskType[] = ['build', 'recognize', 'spell', 'build', 'recognize']
  return tasks.map((task) => ({ kind: 'card', id, task, isNew: false }))
}
