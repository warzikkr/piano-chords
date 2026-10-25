import { describe, expect, test } from 'vitest'
import { checkBuild, checkSpell, pcsEqual } from './check'
import { buildChord } from './chords'

const cMajor = buildChord({ root: 0, type: 'maj', inversion: 0 })
const cOverE = buildChord({ root: 0, type: 'maj', inversion: 1 })

describe('checkBuild', () => {
  test('exact close voicing is correct', () => {
    expect(checkBuild([60, 64, 67], cMajor)).toEqual({ correct: true, wrong: [], missing: [], bassOk: true })
  })

  test('octave does not matter as long as the bass is the root', () => {
    expect(checkBuild([48, 64, 67], cMajor).correct).toBe(true)
    expect(checkBuild([60, 64, 67, 72], cMajor).correct).toBe(true)
  })

  test('wrong bass note fails with bassOk false', () => {
    const r = checkBuild([72, 64, 67], cMajor)
    expect(r.correct).toBe(false)
    expect(r.bassOk).toBe(false)
    expect(r.wrong).toEqual([])
    expect(r.missing).toEqual([])
  })

  test('duplicate pitch class with a missing chord tone is reported as missing', () => {
    const r = checkBuild([60, 72, 64], cMajor)
    expect(r.correct).toBe(false)
    expect(r.missing).toEqual([7])
    expect(r.wrong).toEqual([])
  })

  test('wrong note is listed and the missing tone named', () => {
    const r = checkBuild([60, 63, 67], cMajor)
    expect(r.correct).toBe(false)
    expect(r.wrong).toEqual([63])
    expect(r.missing).toEqual([4])
  })

  test('first inversion needs the third in the bass', () => {
    expect(checkBuild([64, 67, 72], cOverE).correct).toBe(true)
    const r = checkBuild([60, 64, 67], cOverE)
    expect(r.correct).toBe(false)
    expect(r.bassOk).toBe(false)
  })

  test('empty input is simply incorrect', () => {
    const r = checkBuild([], cMajor)
    expect(r.correct).toBe(false)
    expect(r.missing).toEqual([0, 4, 7])
  })
})

test('checkSpell compares pitch-class sets ignoring order', () => {
  expect(checkSpell([7, 0, 4], cMajor)).toBe(true)
  expect(checkSpell([0, 4], cMajor)).toBe(false)
  expect(checkSpell([0, 4, 7, 9], cMajor)).toBe(false)
})

test('pcsEqual ignores order and duplicates', () => {
  expect(pcsEqual([0, 4, 7], [7, 4, 0, 0])).toBe(true)
  expect(pcsEqual([0, 4, 7], [0, 4])).toBe(false)
})
