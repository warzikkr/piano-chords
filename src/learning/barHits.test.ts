import { expect, test } from 'vitest'
import { buildChord } from '../theory/chords'
import { evaluateBar, summarize } from './barHits'

const cMajor = buildChord({ root: 0, type: 'maj', inversion: 0 })
const g7 = buildChord({ root: 7, type: 'dom7', inversion: 0 })

test('a chord struck together just after the downbeat is a hit with its offset', () => {
  const notes = [
    { midi: 60, timeMs: 1020 },
    { midi: 64, timeMs: 1030 },
    { midi: 67, timeMs: 1040 },
  ]
  expect(evaluateBar(notes, cMajor, 1000, 500)).toEqual({ hit: true, offsetMs: 20 })
})

test('an arpeggiated chord inside the bar still counts', () => {
  const notes = [
    { midi: 60, timeMs: 1000 },
    { midi: 64, timeMs: 1300 },
    { midi: 67, timeMs: 1600 },
  ]
  expect(evaluateBar(notes, cMajor, 1000, 500).hit).toBe(true)
})

test('a four-note chord needs all four pitch classes', () => {
  const three = [
    { midi: 67, timeMs: 1000 },
    { midi: 71, timeMs: 1000 },
    { midi: 74, timeMs: 1000 },
  ]
  expect(evaluateBar(three, g7, 1000, 500).hit).toBe(false)
  expect(evaluateBar([...three, { midi: 77, timeMs: 1010 }], g7, 1000, 500).hit).toBe(true)
})

test('extra or missing notes are a miss; an empty bar has no offset', () => {
  expect(evaluateBar([{ midi: 60, timeMs: 1000 }, { midi: 64, timeMs: 1000 }], cMajor, 1000, 500).hit).toBe(false)
  expect(
    evaluateBar([{ midi: 60, timeMs: 1000 }, { midi: 64, timeMs: 1000 }, { midi: 67, timeMs: 1000 }, { midi: 62, timeMs: 1000 }], cMajor, 1000, 500).hit,
  ).toBe(false)
  expect(evaluateBar([], cMajor, 1000, 500)).toEqual({ hit: false, offsetMs: null })
})

test('offset is measured from the nearest beat, negative when early', () => {
  const notes = [
    { midi: 60, timeMs: 1490 },
    { midi: 64, timeMs: 1490 },
    { midi: 67, timeMs: 1490 },
  ]
  expect(evaluateBar(notes, cMajor, 1000, 500).offsetMs).toBe(-10)
})

test('summarize counts hits and averages absolute offsets of hits only', () => {
  const r = summarize([
    { hit: true, offsetMs: 20 },
    { hit: true, offsetMs: -40 },
    { hit: false, offsetMs: 300 },
    { hit: false, offsetMs: null },
  ])
  expect(r).toEqual({ hits: 2, bars: 4, avgOffsetMs: 30 })
  expect(summarize([{ hit: false, offsetMs: null }]).avgOffsetMs).toBeNull()
})
