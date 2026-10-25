import { expect, test } from 'vitest'
import { createProgress, type Progress } from '../state/progress'
import { reducer } from '../state/reducer'
import { ROUNDS_PER_GAME, earGamePool, pickRound } from './earGame'

const NOW = new Date(2026, 9, 26, 10, 0).getTime()
const ok = { correct: true, usedHint: false, seconds: 4 }

function withCards(ids: string[], stability: number): Progress {
  let p = createProgress()
  for (const id of ids) p = reducer(p, { type: 'answer', id, task: 'build', result: ok, isNew: true, now: NOW })
  const cards = Object.fromEntries(Object.entries(p.cards).map(([id, c]) => [id, { ...c, stability, reps: 3 }]))
  return { ...p, cards }
}

test('the pool holds known root-position chords; inversions are left out', () => {
  const p = withCards(['0:maj:0', '7:maj:0', '0:maj:1', '9:min:0'], 12)
  expect(earGamePool(p).sort()).toEqual(['0:maj:0', '7:maj:0', '9:min:0'])
})

test('with nothing known yet, the pool falls back to chords that were at least introduced', () => {
  const p = withCards(['0:maj:0', '7:maj:0'], 1)
  expect(earGamePool(p).sort()).toEqual(['0:maj:0', '7:maj:0'])
  expect(earGamePool(createProgress())).toEqual([])
})

test('pickRound avoids repeating the previous chord when it can', () => {
  const pool = ['0:maj:0', '7:maj:0', '9:min:0']
  for (let i = 0; i < 20; i++) expect(pickRound(pool, () => i / 20, '0:maj:0')).not.toBe('0:maj:0')
  expect(pickRound(['0:maj:0'], () => 0.5, '0:maj:0')).toBe('0:maj:0')
  expect(ROUNDS_PER_GAME).toBe(10)
})

test('game results are counted and the best score kept', () => {
  let p = createProgress()
  p = reducer(p, { type: 'earGameRound', correct: true, now: NOW })
  p = reducer(p, { type: 'earGameRound', correct: false, now: NOW + 1 })
  p = reducer(p, { type: 'earGameFinished', score: 7, now: NOW + 2 })
  p = reducer(p, { type: 'earGameFinished', score: 5, now: NOW + 3 })
  expect(p.earGame).toEqual({ rounds: 2, correct: 1, best: 7, games: 2 })
  expect(p.updatedAt).toBe(NOW + 3)
})
