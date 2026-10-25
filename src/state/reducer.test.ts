import { expect, test } from 'vitest'
import { createProgress, dayKey } from './progress'
import { reducer } from './reducer'

const ok = { correct: true, usedHint: false, seconds: 4 }
const at = (y: number, m: number, d: number, h: number, min: number) => new Date(y, m, d, h, min).getTime()

test('answering a new card introduces it and counts it for the day', () => {
  const now = at(2026, 9, 26, 10, 0)
  const p = reducer(createProgress(), { type: 'answer', id: '0:maj:0', task: 'build', result: ok, isNew: true, now })
  expect(p.introduced['0:maj:0']).toBe(now)
  expect(p.cards['0:maj:0'].reps).toBe(1)
  expect(p.days[dayKey(now)]).toEqual({ reviews: 0, newCards: 1, correct: 1, sessionDone: false })
})

test('answering a known card counts as a review and keeps introduction time', () => {
  const t0 = at(2026, 9, 25, 10, 0)
  let p = reducer(createProgress(), { type: 'answer', id: '0:maj:0', task: 'build', result: ok, isNew: true, now: t0 })
  const t1 = at(2026, 9, 26, 10, 0)
  p = reducer(p, { type: 'answer', id: '0:maj:0', task: 'spell', result: { ...ok, correct: false }, isNew: false, now: t1 })
  expect(p.introduced['0:maj:0']).toBe(t0)
  expect(p.cards['0:maj:0'].reps).toBe(2)
  expect(p.days[dayKey(t1)]).toEqual({ reviews: 1, newCards: 0, correct: 0, sessionDone: false })
})

test('ear answers with two options pass optionCount through to the rating', () => {
  const now = at(2026, 9, 26, 10, 0)
  const fast = { correct: true, usedHint: false, seconds: 1 }
  const two = reducer(createProgress(), { type: 'answer', id: '0:maj:0', task: 'ear', result: fast, isNew: true, now, optionCount: 2 })
  const four = reducer(createProgress(), { type: 'answer', id: '0:maj:0', task: 'ear', result: fast, isNew: true, now, optionCount: 4 })
  expect(four.cards['0:maj:0'].due).toBeGreaterThan(two.cards['0:maj:0'].due)
})

test('sessionDone grows the streak across midnight and not twice a day', () => {
  let p = reducer(createProgress(), { type: 'sessionDone', now: at(2026, 9, 25, 23, 59) })
  expect(p.streak).toBe(1)
  expect(p.days['2026-10-25'].sessionDone).toBe(true)
  p = reducer(p, { type: 'sessionDone', now: at(2026, 9, 26, 0, 1) })
  expect(p.streak).toBe(2)
  p = reducer(p, { type: 'sessionDone', now: at(2026, 9, 26, 18, 0) })
  expect(p.streak).toBe(2)
  expect(p.lastSessionDay).toBe('2026-10-26')
})

test('a missed day resets the streak to 1', () => {
  let p = reducer(createProgress(), { type: 'sessionDone', now: at(2026, 9, 20, 12, 0) })
  p = reducer(p, { type: 'sessionDone', now: at(2026, 9, 21, 12, 0) })
  p = reducer(p, { type: 'sessionDone', now: at(2026, 9, 23, 12, 0) })
  expect(p.streak).toBe(1)
})

test('settings patch, lessonSeen once, import and reset', () => {
  let p = reducer(createProgress(), { type: 'settings', patch: { notation: 'german', newPerDay: 5 } })
  expect(p.settings.notation).toBe('german')
  expect(p.settings.newPerDay).toBe(5)
  p = reducer(p, { type: 'lessonSeen', level: 1 })
  p = reducer(p, { type: 'lessonSeen', level: 1 })
  expect(p.lessonsSeen).toEqual([1])
  p = reducer(p, { type: 'answer', id: '0:maj:0', task: 'build', result: ok, isNew: true, now: at(2026, 9, 26, 10, 0) })
  const reset = reducer(p, { type: 'reset' })
  expect(reset.cards).toEqual({})
  expect(reset.lessonsSeen).toEqual([])
  expect(reset.settings.notation).toBe('german')
  const imported = reducer(reset, { type: 'import', progress: p })
  expect(imported).toEqual(p)
})

test('every change stamps updatedAt', () => {
  const now = at(2026, 9, 26, 10, 0)
  let p = reducer(createProgress(), { type: 'answer', id: '0:maj:0', task: 'build', result: ok, isNew: true, now })
  expect(p.updatedAt).toBe(now)
  p = reducer(p, { type: 'sessionDone', now: now + 1 })
  expect(p.updatedAt).toBe(now + 1)
  p = reducer(p, { type: 'settings', patch: { syllables: true }, now: now + 2 })
  expect(p.updatedAt).toBe(now + 2)
  p = reducer(p, { type: 'lessonSeen', level: 2, now: now + 3 })
  expect(p.updatedAt).toBe(now + 3)
  expect(reducer(p, { type: 'reset', now: now + 4 }).updatedAt).toBe(now + 4)
})

test('theory topics are marked read once and answers are counted per topic', () => {
  const now = at(2026, 9, 26, 10, 0)
  let p = reducer(createProgress(), { type: 'theoryRead', topicId: 'triads', now })
  p = reducer(p, { type: 'theoryRead', topicId: 'triads', now: now + 1 })
  expect(p.theoryRead).toEqual(['triads'])
  p = reducer(p, { type: 'theoryAnswer', topicId: 'triads', correct: true, now: now + 2 })
  p = reducer(p, { type: 'theoryAnswer', topicId: 'triads', correct: false, now: now + 3 })
  expect(p.theoryScores.triads).toEqual({ asked: 2, correct: 1 })
  expect(p.updatedAt).toBe(now + 3)
})
