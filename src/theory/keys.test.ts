import { expect, test } from 'vitest'
import { CIRCLE, MAJOR_KEYS, MODES, degreeLabels, diatonicChords, keyByPc, keySignature, majorScale, modeScale, naturalMinor } from './keys'
import { formatNote, type Letter, type NoteName } from './notes'

const n = (letter: Letter, accidental = 0): NoteName => ({ letter, accidental })
const f = (xs: NoteName[]) => xs.map((x) => formatNote(x)).join(' ')

test('major scales keep proper key spelling, including E sharp', () => {
  expect(f(majorScale(n('C')))).toBe('C D E F G A B')
  expect(f(majorScale(n('F', 1)))).toBe('F♯ G♯ A♯ B C♯ D♯ E♯')
  expect(f(majorScale(n('D', -1)))).toBe('D♭ E♭ F G♭ A♭ B♭ C')
  expect(f(naturalMinor(n('A')))).toBe('A B C D E F G')
})

test('key signatures count sharps or flats in order', () => {
  expect(keySignature(n('C'))).toEqual({ sharps: 0, flats: 0, accidentals: [] })
  expect(keySignature(n('F', 1)).sharps).toBe(6)
  expect(f(keySignature(n('F', 1)).accidentals)).toBe('F♯ C♯ G♯ D♯ A♯ E♯')
  expect(keySignature(n('B', -1)).flats).toBe(2)
  expect(f(keySignature(n('B', -1)).accidentals)).toBe('B♭ E♭')
})

test('fifteen standard major keys with relative minors, and the circle of fifths', () => {
  expect(MAJOR_KEYS).toHaveLength(15)
  expect(formatNote(keyByPc(0).relativeMinor)).toBe('A')
  expect(formatNote(keyByPc(3).relativeMinor)).toBe('C')
  expect(formatNote(keyByPc(6).relativeMinor)).toBe('D♯')
  expect(CIRCLE).toEqual([0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5])
  expect(MAJOR_KEYS.filter((k) => k.flats > 0)).toHaveLength(7)
})

test('modes are rotations of the parent major scale', () => {
  expect(MODES).toHaveLength(7)
  expect(f(modeScale(n('D'), 'dorian'))).toBe('D E F G A B C')
  expect(f(modeScale(n('G'), 'mixolydian'))).toBe('G A B C D E F')
  expect(f(modeScale(n('C'), 'ionian'))).toBe('C D E F G A B')
  expect(f(modeScale(n('A'), 'aeolian'))).toBe('A B C D E F G')
  expect(f(modeScale(n('E'), 'phrygian'))).toBe('E F G A B C D')
})

test('diatonic chords of a major key with roman numerals', () => {
  const c = diatonicChords(0)
  expect(c.map((x) => x.numeral)).toEqual(['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'])
  expect(c.map((x) => `${x.spec.root}:${x.spec.type}`)).toEqual(['0:maj', '2:min', '4:min', '5:maj', '7:maj', '9:min', '11:dim'])
})

test('degree labels show chord formulas the way cheat sheets do', () => {
  expect(degreeLabels('maj')).toEqual(['1', '3', '5'])
  expect(degreeLabels('min')).toEqual(['1', '♭3', '5'])
  expect(degreeLabels('dom7')).toEqual(['1', '3', '5', '♭7'])
  expect(degreeLabels('aug')).toEqual(['1', '3', '♯5'])
  expect(degreeLabels('dim7')).toEqual(['1', '♭3', '♭5', '𝄫7'])
  expect(degreeLabels('dom13')).toEqual(['1', '3', '♭7', '9', '13'])
})
