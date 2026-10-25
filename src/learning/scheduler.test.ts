import { Rating } from 'ts-fsrs'
import { describe, expect, test } from 'vitest'
import { MASTERY_LABELS, TIME_THRESHOLDS, isDue, mastery, newStoredCard, ratingFor, reviewCard } from './scheduler'

const DAY = 24 * 60 * 60 * 1000

describe('ratingFor', () => {
  test('wrong answer is Again', () => {
    expect(ratingFor('build', { correct: false, usedHint: false, seconds: 1 })).toBe(Rating.Again)
  })
  test('correct with hint is Hard', () => {
    expect(ratingFor('build', { correct: true, usedHint: true, seconds: 1 })).toBe(Rating.Hard)
  })
  test('fast correct is Easy, normal correct is Good', () => {
    expect(ratingFor('build', { correct: true, usedHint: false, seconds: 2 })).toBe(Rating.Easy)
    expect(ratingFor('build', { correct: true, usedHint: false, seconds: 5 })).toBe(Rating.Good)
    expect(ratingFor('ear', { correct: true, usedHint: false, seconds: 1.5 })).toBe(Rating.Easy)
  })
  test('ear task with two options never rates Easy', () => {
    expect(ratingFor('ear', { correct: true, usedHint: false, seconds: 1.5 }, 2)).toBe(Rating.Good)
  })
  test('thresholds match the spec', () => {
    expect(TIME_THRESHOLDS).toEqual({ build: 8, recognize: 6, spell: 8, ear: 5 })
  })
})

describe('card scheduling', () => {
  test('a new card is due immediately', () => {
    const t = Date.UTC(2026, 9, 26, 12)
    const c = newStoredCard(t)
    expect(c.due).toBe(t)
    expect(c.reps).toBe(0)
    expect(isDue(c, t)).toBe(true)
  })

  test('reviewing pushes the due date into the future', () => {
    const t = Date.UTC(2026, 9, 26, 12)
    const c = reviewCard(newStoredCard(t), Rating.Good, t)
    expect(c.reps).toBe(1)
    expect(c.lastReview).toBe(t)
    expect(c.due).toBeGreaterThan(t)
    expect(isDue(c, t)).toBe(false)
    expect(isDue(c, c.due)).toBe(true)
  })

  test('repeated good reviews grow stability', () => {
    let t = Date.UTC(2026, 9, 26, 12)
    let c = reviewCard(newStoredCard(t), Rating.Good, t)
    const s1 = c.stability
    for (let i = 0; i < 3; i++) {
      t = Math.max(c.due, t + DAY)
      c = reviewCard(c, Rating.Good, t)
    }
    expect(c.stability).toBeGreaterThan(s1)
    expect(c.reps).toBe(4)
  })

  test('stored card survives JSON round trip', () => {
    const t = Date.UTC(2026, 9, 26, 12)
    const c = reviewCard(newStoredCard(t), Rating.Good, t)
    const back = JSON.parse(JSON.stringify(c))
    expect(reviewCard(back, Rating.Good, c.due).reps).toBe(2)
  })
})

describe('mastery', () => {
  const t = Date.UTC(2026, 9, 26, 12)
  test('unknown or unreviewed card is 0', () => {
    expect(mastery(undefined)).toBe(0)
    expect(mastery(newStoredCard(t))).toBe(0)
  })
  test('buckets by stability', () => {
    const base = { ...reviewCard(newStoredCard(t), Rating.Good, t), reps: 3 }
    expect(mastery({ ...base, stability: 1 })).toBe(1)
    expect(mastery({ ...base, stability: 5 })).toBe(2)
    expect(mastery({ ...base, stability: 15 })).toBe(3)
    expect(mastery({ ...base, stability: 40 })).toBe(4)
  })
  test('labels', () => {
    expect(MASTERY_LABELS).toEqual(['новый', 'учится', 'знаю', 'уверенно', 'выучено'])
  })
})
