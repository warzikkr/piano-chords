import { expect, test } from 'vitest'
import { KEYS, PROGRESSIONS, keyIsRecommended, keyName, progressionById, progressionChords, resolveNumeral } from './progressions'

test('resolveNumeral maps roman numerals to diatonic chords of a major key', () => {
  expect(resolveNumeral('vi', 0)).toEqual({ root: 9, type: 'min', inversion: 0 })
  expect(resolveNumeral('V7', 0)).toEqual({ root: 7, type: 'dom7', inversion: 0 })
  expect(resolveNumeral('ii7', 0)).toEqual({ root: 2, type: 'min7', inversion: 0 })
  expect(resolveNumeral('Imaj7', 5)).toEqual({ root: 5, type: 'maj7', inversion: 0 })
  expect(resolveNumeral('IV', 7)).toEqual({ root: 0, type: 'maj', inversion: 0 })
  expect(resolveNumeral('iii', 0)).toEqual({ root: 4, type: 'min', inversion: 0 })
  expect(resolveNumeral('I7', 0)).toEqual({ root: 0, type: 'dom7', inversion: 0 })
  expect(resolveNumeral('vii°', 0)).toEqual({ root: 11, type: 'dim', inversion: 0 })
})

test('the progression list matches the spec', () => {
  expect(PROGRESSIONS.map((p) => p.id)).toEqual(['pop', 'pop2', 'basic', 'fifties', 'jazz', 'canon', 'blues'])
  expect(progressionById('blues').numerals).toHaveLength(12)
  expect(progressionById('jazz').numerals).toEqual(['ii7', 'V7', 'Imaj7', 'Imaj7'])
  expect(progressionById('pop').title).toBe('I–V–vi–IV')
})

test('progressionChords transposes into the key', () => {
  expect(progressionChords(progressionById('pop'), 7).map((c) => c.root)).toEqual([7, 2, 4, 0])
})

test('keyIsRecommended needs every chord of the progression introduced', () => {
  const learned = new Set(['0:maj:0', '7:maj:0', '9:min:0', '5:maj:0'])
  const has = (id: string) => learned.has(id)
  expect(keyIsRecommended(progressionById('pop'), 0, has)).toBe(true)
  learned.delete('5:maj:0')
  expect(keyIsRecommended(progressionById('pop'), 0, has)).toBe(false)
})

test('KEYS start with C G F D and cover all twelve', () => {
  expect(KEYS.slice(0, 4)).toEqual([0, 7, 5, 2])
  expect(new Set(KEYS).size).toBe(12)
})

test('keyName uses major-root spelling and notation style', () => {
  expect(keyName(1, 'latin')).toBe('D♭')
  expect(keyName(11, 'german')).toBe('H')
})
