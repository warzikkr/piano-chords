import { expect, test } from 'vitest'
import { CURRICULUM, LEVELS, cardsOfLevel, indexOf, levelOf } from './curriculum'

test('curriculum has 288 unique cards', () => {
  expect(CURRICULUM).toHaveLength(288)
  expect(new Set(CURRICULUM.map((c) => c.id)).size).toBe(288)
})

test('level 1 starts with the four-chord progression and then Dm, Em', () => {
  expect(CURRICULUM.slice(0, 6).map((c) => c.id)).toEqual([
    '0:maj:0',
    '7:maj:0',
    '9:min:0',
    '5:maj:0',
    '2:min:0',
    '4:min:0',
  ])
})

test('level 2 follows the hand-shape order', () => {
  expect(CURRICULUM[6].id).toBe('2:maj:0')
  expect(CURRICULUM[9].id).toBe('0:min:0')
  expect(CURRICULUM[23].id).toBe('3:min:0')
  expect(cardsOfLevel(2)).toHaveLength(18)
})

test('level 3 holds both inversions of each triad in order', () => {
  expect(CURRICULUM[24].id).toBe('0:maj:1')
  expect(CURRICULUM[25].id).toBe('0:maj:2')
  expect(CURRICULUM[26].id).toBe('7:maj:1')
  expect(cardsOfLevel(3)).toHaveLength(48)
})

test('level 4 starts with the ii–V–I chords', () => {
  expect(cardsOfLevel(4).slice(0, 3)).toEqual(['7:dom7:0', '0:maj7:0', '2:min7:0'])
  expect(cardsOfLevel(4)).toHaveLength(36)
  expect(cardsOfLevel(4)[3]).toBe('0:dom7:0')
})

test('levels 5 and 6 cover every root of each type', () => {
  expect(cardsOfLevel(5)).toHaveLength(108)
  expect(cardsOfLevel(5)[0]).toBe('0:sus4:0')
  expect(cardsOfLevel(6)).toHaveLength(72)
  expect(cardsOfLevel(6)[0]).toBe('0:dom9:0')
})

test('lookups', () => {
  expect(levelOf('0:sus4:0')).toBe(5)
  expect(indexOf('7:maj:0')).toBe(1)
  expect(indexOf('nope')).toBe(-1)
  expect(LEVELS).toHaveLength(6)
  expect(LEVELS[0].title).toBe('Белые клавиши')
})
