import { expect, test } from 'vitest'
import { describeDifference, identifyChord, intervalName } from './identify'
import { formatNote } from './notes'

const names = (r: ReturnType<typeof identifyChord>) => r.matches.map((m) => m.slash ?? m.symbol)

test('a close-position triad is named directly', () => {
  const r = identifyChord([60, 64, 67])
  expect(names(r)[0]).toBe('C')
  expect(r.matches[0].spec).toEqual({ root: 0, type: 'maj', inversion: 0 })
  expect(identifyChord([60, 63, 67]).matches[0].symbol).toBe('Cm')
  expect(identifyChord([62, 66, 69, 72]).matches[0].symbol).toBe('D7')
})

test('inversions are named with a slash and the bass note', () => {
  expect(names(identifyChord([64, 67, 72]))[0]).toBe('C/E')
  expect(identifyChord([64, 67, 72]).matches[0].spec.inversion).toBe(1)
  expect(names(identifyChord([67, 72, 76]))[0]).toBe('C/G')
})

test('notes that spell two chords list both, the one with the bass as root first', () => {
  const r = identifyChord([60, 64, 67, 69])
  expect(names(r).slice(0, 2)).toEqual(['C6', 'Am7/C'])
  const r2 = identifyChord([57, 60, 64, 67])
  expect(names(r2).slice(0, 2)).toEqual(['Am7', 'C6/A'])
})

test('octave doubling does not matter', () => {
  expect(names(identifyChord([48, 60, 64, 67, 72]))[0]).toBe('C')
})

test('when nothing matches, the nearest chords say what is missing or extra', () => {
  const two = identifyChord([60, 64])
  expect(two.matches).toHaveLength(0)
  expect(two.near[0].symbol).toBe('C')
  expect(two.near[0].missing.map((n) => formatNote(n))).toEqual(['G'])
  expect(two.near[0].extra).toEqual([])
  const four = identifyChord([60, 62, 64, 67])
  expect(four.near[0].symbol).toBe('C')
  expect(four.near[0].extra.map((n) => formatNote(n))).toEqual(['D'])
  expect(identifyChord([]).matches).toHaveLength(0)
  expect(identifyChord([60]).near).toHaveLength(0)
})

test('describeDifference explains how one chord turns into another', () => {
  expect(describeDifference({ root: 0, type: 'maj', inversion: 0 }, { root: 0, type: 'min', inversion: 0 })).toBe('E → E♭')
  expect(describeDifference({ root: 0, type: 'maj', inversion: 0 }, { root: 0, type: 'dom7', inversion: 0 })).toBe('+ B♭')
  expect(describeDifference({ root: 0, type: 'dom7', inversion: 0 }, { root: 0, type: 'maj', inversion: 0 })).toBe('− B♭')
  expect(describeDifference({ root: 0, type: 'maj', inversion: 0 }, { root: 0, type: 'maj', inversion: 1 })).toBe('C на октаву вверх')
  expect(describeDifference({ root: 0, type: 'maj', inversion: 0 }, { root: 7, type: 'maj', inversion: 0 })).toBe('другой корень')
})

test('intervalName names the distance between two notes in Russian', () => {
  expect(intervalName(60, 64)).toBe('большая терция')
  expect(intervalName(64, 60)).toBe('большая терция')
  expect(intervalName(60, 63)).toBe('малая терция')
  expect(intervalName(60, 67)).toBe('чистая квинта')
  expect(intervalName(60, 66)).toBe('тритон')
  expect(intervalName(60, 72)).toBe('октава')
  expect(intervalName(60, 74)).toBe('большая нона')
  expect(intervalName(60, 60)).toBe('унисон')
})
