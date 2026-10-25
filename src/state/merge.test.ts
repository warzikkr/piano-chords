import { expect, test } from 'vitest'
import { mergeProgress } from './merge'
import { createProgress, type Progress } from './progress'
import { reducer } from './reducer'

const ok = { correct: true, usedHint: false, seconds: 4 }
const T = new Date(2026, 9, 26, 10, 0).getTime()

function learned(ids: string[], from: number): Progress {
  let p = createProgress()
  ids.forEach((id, i) => {
    p = reducer(p, { type: 'answer', id, task: 'build', result: ok, isNew: true, now: from + i * 1000 })
  })
  return p
}

test('cards from both sides are kept and the more reviewed copy wins', () => {
  const a = learned(['0:maj:0', '7:maj:0'], T)
  let b = learned(['0:maj:0', '9:min:0'], T + 60_000)
  b = reducer(b, { type: 'answer', id: '0:maj:0', task: 'spell', result: ok, isNew: false, now: T + 120_000 })
  const m = mergeProgress(a, b)
  expect(Object.keys(m.cards).sort()).toEqual(['0:maj:0', '7:maj:0', '9:min:0'])
  expect(m.cards['0:maj:0'].reps).toBe(2)
  expect(m.introduced['0:maj:0']).toBe(T)
  expect(mergeProgress(b, a)).toEqual(m)
})

test('days, lessons and streak merge sensibly', () => {
  let a = learned(['0:maj:0'], T)
  a = reducer(a, { type: 'lessonSeen', level: 1, now: T })
  a = reducer(a, { type: 'sessionDone', now: T + 1 })
  let b = learned(['7:maj:0'], T + 10)
  b = reducer(b, { type: 'lessonSeen', level: 2, now: T + 10 })
  b = reducer(b, { type: 'sessionDone', now: T + 20 })
  b = reducer(b, { type: 'settings', patch: { notation: 'german' }, now: T + 30 })
  const m = mergeProgress(a, b)
  expect(m.lessonsSeen).toEqual([1, 2])
  const day = Object.values(m.days)[0]
  expect(day.newCards).toBe(1)
  expect(day.sessionDone).toBe(true)
  expect(m.streak).toBe(1)
  expect(m.settings.notation).toBe('german')
  expect(m.updatedAt).toBe(T + 30)
})

test('merging with an empty remote keeps everything local', () => {
  const a = learned(['0:maj:0', '7:maj:0'], T)
  expect(mergeProgress(a, createProgress())).toEqual(a)
  expect(mergeProgress(createProgress(), a)).toEqual(a)
})

test('theory reading and scores merge as unions and maxima', () => {
  let a = createProgress()
  a = reducer(a, { type: 'theoryRead', topicId: 'triads', now: T })
  a = reducer(a, { type: 'theoryAnswer', topicId: 'triads', correct: true, now: T + 1 })
  let b = createProgress()
  b = reducer(b, { type: 'theoryRead', topicId: 'keys', now: T + 2 })
  b = reducer(b, { type: 'theoryAnswer', topicId: 'triads', correct: true, now: T + 3 })
  b = reducer(b, { type: 'theoryAnswer', topicId: 'triads', correct: false, now: T + 4 })
  const m = mergeProgress(a, b)
  expect(m.theoryRead).toEqual(['keys', 'triads'])
  expect(m.theoryScores.triads).toEqual({ asked: 2, correct: 1 })
})

test('ear game stats merge as sums and maxima', () => {
  let a = createProgress()
  a = reducer(a, { type: 'earGameRound', correct: true, now: T })
  a = reducer(a, { type: 'earGameFinished', score: 6, now: T + 1 })
  let b = createProgress()
  b = reducer(b, { type: 'earGameRound', correct: false, now: T + 2 })
  b = reducer(b, { type: 'earGameFinished', score: 8, now: T + 3 })
  expect(mergeProgress(a, b).earGame).toEqual({ rounds: 2, correct: 1, best: 8, games: 2 })
})
