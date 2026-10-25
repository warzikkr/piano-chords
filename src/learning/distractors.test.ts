import { expect, test } from 'vitest'
import { cardId, type ChordSpec } from '../theory/chords'
import { earOptions, recognizeOptions } from './distractors'

function lcg(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const cmaj: ChordSpec = { root: 0, type: 'maj', inversion: 0 }

test('recognizeOptions gives four distinct options including the answer', () => {
  for (let seed = 1; seed < 30; seed++) {
    const options = recognizeOptions(cmaj, lcg(seed))
    expect(options).toHaveLength(4)
    expect(new Set(options.map(cardId)).size).toBe(4)
    expect(options.map(cardId)).toContain('0:maj:0')
  }
})

test('recognizeOptions for an inversion card offers another inversion of the same chord', () => {
  const spec: ChordSpec = { root: 0, type: 'maj', inversion: 1 }
  const options = recognizeOptions(spec, lcg(3))
  expect(options.map(cardId)).toContain('0:maj:1')
  expect(options.some((o) => o.root === 0 && o.type === 'maj' && o.inversion !== 1)).toBe(true)
})

test('recognizeOptions stays within chord types the learner could have met', () => {
  const options = recognizeOptions(cmaj, lcg(5))
  expect(options.every((o) => o.type === 'maj' || o.type === 'min')).toBe(true)
})

test('ear options come only from chord types the learner has met', () => {
  expect(earOptions(cmaj, ['maj', 'min'], lcg(1))).toHaveLength(2)
  expect(earOptions(cmaj, ['maj'], lcg(1)).sort()).toEqual(['maj', 'min'])
  const withSevenths = earOptions(cmaj, ['maj', 'min', 'dom7', 'maj7', 'sus2'], lcg(2))
  expect(withSevenths.sort()).toEqual(['dom7', 'maj', 'maj7', 'min'])
  expect(earOptions({ root: 0, type: 'dim', inversion: 0 }, ['maj', 'min'], lcg(1)).sort()).toEqual(['dim', 'maj', 'min'])
  const many = earOptions(cmaj, ['maj', 'min', 'dom7', 'maj7', 'min7', 'dim', 'aug', 'sus4'], lcg(3))
  expect(many).toHaveLength(6)
  expect(many).toContain('maj')
})
