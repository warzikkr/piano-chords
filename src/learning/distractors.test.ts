import { expect, test } from 'vitest'
import { cardId, type ChordSpec } from '../theory/chords'
import { earChoices, earOptions, recognizeOptions } from './distractors'

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

test('earChoices grow with the level', () => {
  expect(earChoices(1)).toEqual(['maj', 'min'])
  expect(earChoices(3)).toEqual(['maj', 'min'])
  expect(earChoices(4)).toHaveLength(5)
  expect(earChoices(5)).toHaveLength(8)
})

test('earOptions always include the card type and cap at six', () => {
  expect(earOptions({ root: 0, type: 'sus2', inversion: 0 }, 1, lcg(1))).toHaveLength(3)
  expect(earOptions({ root: 0, type: 'sus2', inversion: 0 }, 1, lcg(1))).toContain('sus2')
  expect(earOptions(cmaj, 1, lcg(1))).toHaveLength(2)
  const six = earOptions(cmaj, 6, lcg(2))
  expect(six).toHaveLength(6)
  expect(six).toContain('maj')
  expect(new Set(six).size).toBe(6)
})
