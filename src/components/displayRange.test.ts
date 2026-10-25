import { expect, test } from 'vitest'
import { displayRange } from './displayRange'

test('a chord inside the fourth octave uses the default two octaves from C4', () => {
  expect(displayRange([60, 64, 67])).toEqual({ lowMidi: 60, octaves: 2 })
  expect(displayRange([71, 75, 78])).toEqual({ lowMidi: 60, octaves: 2 })
})

test('a high inversion shifts the window up', () => {
  expect(displayRange([78, 83, 87])).toEqual({ lowMidi: 72, octaves: 2 })
})

test('a wide chord gets a third octave', () => {
  expect(displayRange([71, 75, 81, 85, 92])).toEqual({ lowMidi: 60, octaves: 3 })
})

test('empty input falls back to the default window', () => {
  expect(displayRange([])).toEqual({ lowMidi: 60, octaves: 2 })
})
