import { parseCardId, type CardId, type ChordSpec, type Level } from '../theory/chords'
import { KEYS, PROGRESSIONS, keyIsRecommended } from '../theory/progressions'
import type { Pc } from '../theory/notes'
import { dayKey, type Progress } from '../state/progress'
import { CURRICULUM, indexOf, levelOf } from './curriculum'
import { EAR_TYPES, type Rng } from './distractors'
import { isDue, type TaskType } from './scheduler'

export type SessionItem =
  | { kind: 'lesson'; level: Level }
  /** Meet a new chord: see it, hear it, read its notes. */
  | { kind: 'intro'; id: CardId }
  /** Repeat it on the keyboard with the keys highlighted; not graded. */
  | { kind: 'practice'; id: CardId }
  /** Graded exercise; feeds FSRS. */
  | { kind: 'card'; id: CardId; task: TaskType; isNew: boolean }
  | { kind: 'progression'; progressionId: string; keyRoot: Pc }

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

export function pickTask(isNew: boolean, spec: ChordSpec, rng: Rng, counter: number): TaskType {
  if (isNew || rng() < 0.5) return 'build'
  const others = availableTasks(spec).filter((t) => t !== 'build')
  return others[counter % others.length]
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

export function sessionCounts(p: Progress, now: number): { due: number; newAvailable: number } {
  const due = Math.min(dueIds(p, now).length, p.settings.maxReviews)
  const today = dayKey(now)
  const introducedToday = Object.values(p.introduced).filter((t) => dayKey(t) === today).length
  const remaining = notIntroduced(p).length
  const newAvailable = Math.max(0, Math.min(p.settings.newPerDay - introducedToday, remaining))
  return { due, newAvailable }
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
    .forEach((id, i) => items.push({ kind: 'card', id, task: pickTask(false, parseCardId(id), rng, i), isNew: false }))

  // 3. Play a progression made of chords already known.
  const progression = chooseProgression(p, rng)
  if (progression) items.push(progression)
  return items
}

export function buildPracticeSession(id: CardId): SessionItem[] {
  const tasks: TaskType[] = ['build', 'recognize', 'spell', 'build', 'recognize']
  return tasks.map((task) => ({ kind: 'card', id, task, isNew: false }))
}
