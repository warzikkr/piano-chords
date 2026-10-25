import { expect, test } from 'vitest'
import { createProgress, type Progress } from '../state/progress'
import { reducer } from '../state/reducer'
import { newStoredCard } from './scheduler'
import {
  availableTasks,
  buildPracticeSession,
  buildSession,
  learnerLevel,
  pickTask,
  sessionCounts,
  type SessionItem,
} from './session'

const DAY = 24 * 60 * 60 * 1000
const NOW = new Date(2026, 9, 26, 10, 0).getTime()
const zero = () => 0
const ok = { correct: true, usedHint: false, seconds: 4 }

function withIntroduced(ids: string[], when: number): Progress {
  let p = createProgress()
  for (const id of ids) p = reducer(p, { type: 'answer', id, task: 'build', result: ok, isNew: true, now: when })
  return p
}

function allDue(p: Progress, now: number): Progress {
  const cards = Object.fromEntries(Object.entries(p.cards).map(([id, c]) => [id, { ...c, due: now - 1000 }]))
  return { ...p, cards }
}

test('a fresh learner gets the level 1 lesson and three new build cards', () => {
  const items = buildSession(createProgress(), NOW, zero)
  expect(items).toEqual<SessionItem[]>([
    { kind: 'lesson', level: 1 },
    { kind: 'card', id: '0:maj:0', task: 'build', isNew: true },
    { kind: 'card', id: '7:maj:0', task: 'build', isNew: true },
    { kind: 'card', id: '9:min:0', task: 'build', isNew: true },
  ])
})

test('due reviews come first, then new cards with a lesson, then a progression', () => {
  const p = allDue(withIntroduced(['0:maj:0', '7:maj:0', '9:min:0', '5:maj:0', '2:min:0', '4:min:0'], NOW - DAY), NOW)
  const items = buildSession({ ...p, lessonsSeen: [1] }, NOW, zero)
  const reviews = items.slice(0, 6)
  expect(reviews.every((i) => i.kind === 'card' && !i.isNew)).toBe(true)
  const newCards = items.filter((i) => i.kind === 'card' && i.isNew)
  expect(newCards.map((i) => (i.kind === 'card' ? i.id : ''))).toEqual(['2:maj:0', '4:maj:0', '9:maj:0'])
  expect(items[6]).toEqual({ kind: 'lesson', level: 2 })
  expect(items.filter((i) => i.kind === 'lesson')).toHaveLength(1)
  expect(items.at(-1)).toEqual({ kind: 'progression', progressionId: 'pop', keyRoot: 0 })
})

test('no progression while the four pop chords are not all introduced', () => {
  const p = withIntroduced(['0:maj:0', '7:maj:0', '9:min:0'], NOW - DAY)
  expect(buildSession(p, NOW, zero).some((i) => i.kind === 'progression')).toBe(false)
})

test('review limit and daily new limit are respected', () => {
  const p = allDue(withIntroduced(['0:maj:0', '7:maj:0', '9:min:0', '5:maj:0', '2:min:0'], NOW - DAY), NOW)
  const limited = { ...p, settings: { ...p.settings, maxReviews: 2 } }
  expect(buildSession(limited, NOW, zero).filter((i) => i.kind === 'card' && !i.isNew)).toHaveLength(2)
  expect(sessionCounts(limited, NOW)).toEqual({ due: 2, newAvailable: 3 })
  const today = withIntroduced(['0:maj:0', '7:maj:0', '9:min:0'], NOW)
  expect(sessionCounts(today, NOW).newAvailable).toBe(0)
})

test('reviews that are not due yet are not in the session', () => {
  const p = withIntroduced(['0:maj:0'], NOW)
  const future = { ...p, cards: { '0:maj:0': { ...newStoredCard(NOW), due: NOW + DAY } } }
  expect(buildSession(future, NOW, zero).filter((i) => i.kind === 'card' && !i.isNew)).toHaveLength(0)
})

test('pickTask', () => {
  const cmaj = { root: 0, type: 'maj' as const, inversion: 0 }
  expect(pickTask(true, cmaj, () => 0.9, 7)).toBe('build')
  expect(pickTask(false, cmaj, () => 0.1, 7)).toBe('build')
  expect(pickTask(false, cmaj, () => 0.9, 0)).toBe('recognize')
  expect(pickTask(false, cmaj, () => 0.9, 1)).toBe('spell')
  expect(pickTask(false, cmaj, () => 0.9, 2)).toBe('ear')
})

test('availableTasks excludes ear for inversions and non-ear types', () => {
  expect(availableTasks({ root: 0, type: 'maj', inversion: 0 })).toEqual(['build', 'recognize', 'spell', 'ear'])
  expect(availableTasks({ root: 0, type: 'maj', inversion: 1 })).toEqual(['build', 'recognize', 'spell'])
  expect(availableTasks({ root: 0, type: 'sus2', inversion: 0 })).toEqual(['build', 'recognize', 'spell'])
})

test('learnerLevel is the highest level with an introduced card', () => {
  expect(learnerLevel(createProgress())).toBe(1)
  expect(learnerLevel(withIntroduced(['0:maj:0', '0:sus4:0'], NOW))).toBe(5)
})

test('practice session drills one chord five times', () => {
  const items = buildPracticeSession('5:maj:0')
  expect(items).toHaveLength(5)
  expect(items.map((i) => (i.kind === 'card' ? i.task : ''))).toEqual(['build', 'recognize', 'spell', 'build', 'recognize'])
  expect(items.every((i) => i.kind === 'card' && i.id === '5:maj:0' && !i.isNew)).toBe(true)
})
