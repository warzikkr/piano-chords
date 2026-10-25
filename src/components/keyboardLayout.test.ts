import { expect, test } from 'vitest'
import { keyboardLayout } from './keyboardLayout'

test('two octaves from C4 have 14 white and 10 black keys', () => {
  const layout = keyboardLayout(60, 2)
  expect(layout.whites).toHaveLength(14)
  expect(layout.blacks).toHaveLength(10)
  expect(layout.whites[0]).toEqual({ midi: 60, index: 0 })
  expect(layout.whites[13]).toEqual({ midi: 83, index: 13 })
})

test('black keys sit on the boundary after the given number of white keys', () => {
  const layout = keyboardLayout(60, 2)
  expect(layout.blacks[0]).toEqual({ midi: 61, leftWhites: 1 })
  expect(layout.blacks.find((b) => b.midi === 66)).toEqual({ midi: 66, leftWhites: 4 })
  expect(layout.blacks.find((b) => b.midi === 73)).toEqual({ midi: 73, leftWhites: 8 })
  const boundaries = layout.blacks.map((b) => b.leftWhites)
  expect(boundaries).not.toContain(3)
  expect(boundaries).not.toContain(7)
})
