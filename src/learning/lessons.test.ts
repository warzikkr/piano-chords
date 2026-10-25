import { expect, test } from 'vitest'
import type { Level } from '../theory/chords'
import { LESSONS } from './lessons'

test('every level has two to four short pages', () => {
  for (const level of [1, 2, 3, 4, 5, 6] as Level[]) {
    const pages = LESSONS[level]
    expect(pages.length, `level ${level}`).toBeGreaterThanOrEqual(2)
    expect(pages.length, `level ${level}`).toBeLessThanOrEqual(4)
    for (const page of pages) {
      expect(page.title.length).toBeGreaterThan(0)
      expect(page.text.length).toBeGreaterThan(0)
      expect(page.text.length, page.title).toBeLessThan(400)
      expect(page.demo.kind).toBeDefined()
    }
  }
})

test('level 1 teaches how to find C and shows the two triad formulas', () => {
  const kinds = LESSONS[1].map((p) => p.demo.kind)
  expect(kinds[0]).toBe('findNote')
  expect(kinds).toContain('showChord')
  expect(kinds).toContain('compare')
})

test('level 3 explains slash notation', () => {
  expect(LESSONS[3].some((p) => p.text.includes('C/E'))).toBe(true)
})
