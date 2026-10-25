import { expect, test } from 'vitest'
import { buildChord } from '../theory/chords'
import { matchesQuery, normalizeQuery } from './referenceSearch'

test('normalizeQuery turns typed accidentals into the symbols the app shows', () => {
  expect(normalizeQuery('Db')).toBe('d♭')
  expect(normalizeQuery('F#m7')).toBe('f♯m7')
  expect(normalizeQuery(' B ')).toBe('b')
  expect(normalizeQuery('Bb')).toBe('b♭')
})

test('matchesQuery finds a chord by either enharmonic spelling of its root', () => {
  const gSharpMinor = buildChord({ root: 8, type: 'min', inversion: 0 })
  expect(matchesQuery(gSharpMinor, normalizeQuery('G#m'))).toBe(true)
  expect(matchesQuery(gSharpMinor, normalizeQuery('Abm'))).toBe(true)
  expect(matchesQuery(gSharpMinor, normalizeQuery('Am'))).toBe(false)
  expect(matchesQuery(gSharpMinor, '')).toBe(true)
})
