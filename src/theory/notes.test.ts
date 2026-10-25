import { describe, expect, test } from 'vitest'
import {
  MAJOR_ROOTS,
  MINOR_ROOTS,
  formatNote,
  midiName,
  noteNamePc,
  pc,
  spellDegree,
  syllable,
  type Letter,
  type NoteName,
} from './notes'

const n = (letter: Letter, accidental = 0): NoteName => ({ letter, accidental })

test('pc of a midi number is its pitch class', () => {
  expect(pc(60)).toBe(0)
  expect(pc(61)).toBe(1)
  expect(pc(71)).toBe(11)
  expect(pc(48)).toBe(0)
})

test('noteNamePc applies accidentals and wraps around', () => {
  expect(noteNamePc(n('D', -1))).toBe(1)
  expect(noteNamePc(n('B', 1))).toBe(0)
  expect(noteNamePc(n('C', -1))).toBe(11)
})

describe('spellDegree spells chord tones by scale degree', () => {
  test.each<[NoteName, number, number, NoteName]>([
    [n('C'), 3, 4, n('E')],
    [n('D', -1), 3, 4, n('F')],
    [n('C', 1), 3, 3, n('E')],
    [n('E', -1), 3, 3, n('G', -1)],
    [n('F', 1), 7, 9, n('E', -1)],
    [n('C'), 9, 14, n('D')],
    [n('C'), 13, 21, n('A')],
    [n('G', 1), 7, 10, n('F', 1)],
  ])('%o degree %i, %i semitones → %o', (root, degree, semis, expected) => {
    expect(spellDegree(root, degree, semis)).toEqual(expected)
  })

  test.each<[NoteName, number, number, NoteName]>([
    [n('F', 1), 5, 8, n('D')],
    [n('E'), 5, 8, n('C')],
    [n('B', -1), 5, 6, n('E')],
    [n('F'), 7, 9, n('D')],
  ])('simplifies double accidentals and white-key accidentals: %o %i %i → %o', (root, degree, semis, expected) => {
    expect(spellDegree(root, degree, semis)).toEqual(expected)
  })
})

test('formatNote uses unicode accidentals and the German H/B convention', () => {
  expect(formatNote(n('B', -1), 'latin')).toBe('B♭')
  expect(formatNote(n('F', 1), 'latin')).toBe('F♯')
  expect(formatNote(n('C'), 'latin')).toBe('C')
  expect(formatNote(n('B'), 'german')).toBe('H')
  expect(formatNote(n('B', -1), 'german')).toBe('B')
  expect(formatNote(n('B', 1), 'german')).toBe('H♯')
})

test('syllable gives Russian solfège names', () => {
  expect(syllable(n('D', -1))).toBe('ре-бемоль')
  expect(syllable(n('B'))).toBe('си')
  expect(syllable(n('F', 1))).toBe('фа-диез')
  expect(syllable(n('G'))).toBe('соль')
})

test('preferred root spellings per family', () => {
  expect(MAJOR_ROOTS[6]).toEqual(n('F', 1))
  expect(MAJOR_ROOTS[1]).toEqual(n('D', -1))
  expect(MINOR_ROOTS[1]).toEqual(n('C', 1))
  expect(MINOR_ROOTS[8]).toEqual(n('G', 1))
  expect(MAJOR_ROOTS).toHaveLength(12)
  expect(MINOR_ROOTS).toHaveLength(12)
})

test('midiName labels keys with sharps by default and flats on request', () => {
  expect(midiName(60)).toEqual(n('C'))
  expect(midiName(61)).toEqual(n('C', 1))
  expect(midiName(61, true)).toEqual(n('D', -1))
  expect(midiName(70, true)).toEqual(n('B', -1))
})
