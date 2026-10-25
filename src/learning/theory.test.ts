import { expect, test } from 'vitest'
import { THEORY, questionCount, topicById } from './theory'

test('eight short topics with unique ids, interactive pages and self-check questions', () => {
  expect(THEORY).toHaveLength(8)
  expect(new Set(THEORY.map((t) => t.id)).size).toBe(8)
  for (const t of THEORY) {
    expect(t.title.length).toBeGreaterThan(0)
    expect(t.pages.length).toBeGreaterThanOrEqual(2)
    expect(t.pages.length).toBeLessThanOrEqual(4)
    for (const p of t.pages) {
      expect(p.text.length).toBeGreaterThan(20)
      expect(p.text.length).toBeLessThan(420)
      expect(p.demo.kind).toBeDefined()
    }
    expect(t.questions.length).toBeGreaterThanOrEqual(2)
    for (const q of t.questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(3)
      expect(q.answer).toBeGreaterThanOrEqual(0)
      expect(q.answer).toBeLessThan(q.options.length)
      expect(new Set(q.options).size).toBe(q.options.length)
    }
  }
  expect(THEORY.some((t) => t.pages.some((p) => p.demo.kind === 'interval'))).toBe(true)
  expect(THEORY.some((t) => t.pages.some((p) => p.demo.kind === 'sequence'))).toBe(true)
})

test('lookups', () => {
  expect(topicById('triads').title).toBe('Мажор и минор')
  expect(() => topicById('nope')).toThrow()
  expect(questionCount()).toBeGreaterThanOrEqual(16)
})
