import { describe, expect, test } from 'vitest'
import {
  CHORD_TYPES,
  buildChord,
  cardId,
  chordType,
  inversionLabel,
  inversionsOf,
  parseCardId,
  rootName,
  type ChordSpec,
} from './chords'
import { formatNote } from './notes'

const spec = (root: number, type: ChordSpec['type'], inversion = 0): ChordSpec => ({ root, type, inversion })
const names = (s: ChordSpec, style: 'latin' | 'german' = 'latin') =>
  buildChord(s, style).names.map((n) => formatNote(n, style))

test('twenty chord types in spec order', () => {
  expect(CHORD_TYPES).toHaveLength(20)
  expect(CHORD_TYPES[0].id).toBe('maj')
  expect(CHORD_TYPES[19].id).toBe('7sus4')
  expect(chordType('dom13').intervals).toEqual([0, 4, 10, 14, 21])
  expect(chordType('dom11').degrees).toEqual([1, 5, 7, 9, 11])
  expect(chordType('min').family).toBe('minor')
  expect(chordType('dim7').family).toBe('minor')
  expect(chordType('sus4').level).toBe(5)
})

describe('buildChord', () => {
  test('C major in root position starts at middle C', () => {
    const v = buildChord(spec(0, 'maj'))
    expect(v.notes).toEqual([60, 64, 67])
    expect(v.pcs).toEqual([0, 4, 7])
    expect(v.bassPc).toBe(0)
    expect(v.symbol).toBe('C')
    expect(v.slash).toBeNull()
  })

  test('inversions move the lowest note up an octave and get a slash name', () => {
    const first = buildChord(spec(0, 'maj', 1))
    expect(first.notes).toEqual([64, 67, 72])
    expect(first.bassPc).toBe(4)
    expect(first.slash).toBe('C/E')
    const second = buildChord(spec(0, 'maj', 2))
    expect(second.notes).toEqual([67, 72, 76])
    expect(second.slash).toBe('C/G')
    expect(buildChord(spec(7, 'dom7', 1)).notes).toEqual([71, 74, 77, 79])
  })

  test('root is placed in the fourth octave for every pitch class', () => {
    expect(buildChord(spec(6, 'maj')).notes).toEqual([66, 70, 73])
    expect(buildChord(spec(11, 'min')).notes).toEqual([71, 74, 78])
  })

  test('spelling follows the chord family', () => {
    expect(names(spec(1, 'maj'))).toEqual(['D♭', 'F', 'A♭'])
    expect(buildChord(spec(1, 'maj')).symbol).toBe('D♭')
    expect(names(spec(1, 'min'))).toEqual(['C♯', 'E', 'G♯'])
    expect(buildChord(spec(1, 'min')).symbol).toBe('C♯m')
    expect(names(spec(6, 'dim7'))).toEqual(['F♯', 'A', 'C', 'E♭'])
  })

  test('awkward spellings are simplified', () => {
    expect(names(spec(6, 'aug'))).toEqual(['F♯', 'A♯', 'D'])
    expect(names(spec(4, 'aug'))).toEqual(['E', 'G♯', 'C'])
    expect(names(spec(10, 'dim'))).toEqual(['B♭', 'D♭', 'E'])
  })

  test('extended chords use the spec intervals', () => {
    expect(buildChord(spec(0, 'dom11')).notes).toEqual([60, 67, 70, 74, 77])
    expect(buildChord(spec(0, 'dom13')).notes).toEqual([60, 64, 70, 74, 81])
    expect(buildChord(spec(0, 'add9')).notes).toEqual([60, 64, 67, 74])
  })

  test('symbols for the remaining types', () => {
    expect(buildChord(spec(0, 'm7b5')).symbol).toBe('Cm7♭5')
    expect(buildChord(spec(0, 'six')).symbol).toBe('C6')
    expect(buildChord(spec(0, '7sus4')).symbol).toBe('C7sus4')
    expect(buildChord(spec(0, 'maj7')).symbol).toBe('Cmaj7')
    expect(buildChord(spec(9, 'min7')).symbol).toBe('Am7')
  })

  test('german notation renames B and B flat', () => {
    expect(buildChord(spec(11, 'maj'), 'german').symbol).toBe('H')
    expect(buildChord(spec(10, 'maj'), 'german').symbol).toBe('B')
    expect(buildChord(spec(11, 'min'), 'german').symbol).toBe('Hm')
    expect(buildChord(spec(0, 'maj', 2), 'german').slash).toBe('C/G')
  })
})

test('inversionsOf counts positions for triads and sevenths only', () => {
  expect(inversionsOf('maj')).toBe(3)
  expect(inversionsOf('dom7')).toBe(4)
  expect(inversionsOf('six')).toBe(4)
  expect(inversionsOf('add9')).toBe(1)
  expect(inversionsOf('dom9')).toBe(1)
})

test('inversionLabel in Russian', () => {
  expect(inversionLabel(0)).toBe('основной вид')
  expect(inversionLabel(1)).toBe('первое обращение')
  expect(inversionLabel(2)).toBe('второе обращение')
  expect(inversionLabel(3)).toBe('третье обращение')
})

test('cardId round-trips a spec', () => {
  expect(cardId(spec(6, 'min7', 1))).toBe('6:min7:1')
  expect(parseCardId('6:min7:1')).toEqual(spec(6, 'min7', 1))
})

test('rootName picks the family spelling', () => {
  expect(formatNote(rootName(1, 'maj'))).toBe('D♭')
  expect(formatNote(rootName(1, 'dim'))).toBe('C♯')
})
