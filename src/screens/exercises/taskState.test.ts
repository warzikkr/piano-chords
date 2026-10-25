import { expect, test } from 'vitest'
import { buildChord } from '../../theory/chords'
import { finishResult, initialTaskState, taskReducer } from './taskState'

const cMajor = buildChord({ root: 0, type: 'maj', inversion: 0 })

test('toggle adds and removes keys while answering', () => {
  let s = initialTaskState(1000)
  s = taskReducer(s, { type: 'toggle', midi: 60 })
  s = taskReducer(s, { type: 'toggle', midi: 64 })
  expect(s.selected).toEqual([60, 64])
  s = taskReducer(s, { type: 'toggle', midi: 60 })
  expect(s.selected).toEqual([64])
  expect(s.phase).toBe('answering')
})

test('check marks the phase correct or wrong', () => {
  let s = initialTaskState(1000)
  for (const m of [60, 64, 67]) s = taskReducer(s, { type: 'toggle', midi: m })
  expect(taskReducer(s, { type: 'check', voicing: cMajor }).phase).toBe('correct')
  s = taskReducer(initialTaskState(1000), { type: 'toggle', midi: 60 })
  expect(taskReducer(s, { type: 'check', voicing: cMajor }).phase).toBe('wrong')
})

test('toggle with autoCheck checks as soon as enough keys are selected', () => {
  let s = initialTaskState(1000)
  s = taskReducer(s, { type: 'toggle', midi: 60, autoCheck: cMajor })
  s = taskReducer(s, { type: 'toggle', midi: 64, autoCheck: cMajor })
  expect(s.phase).toBe('answering')
  s = taskReducer(s, { type: 'toggle', midi: 67, autoCheck: cMajor })
  expect(s.phase).toBe('correct')
  expect(taskReducer(s, { type: 'toggle', midi: 62, autoCheck: cMajor }).selected).toEqual([60, 64, 67])
})

test('hint is remembered and lowers the result', () => {
  let s = taskReducer(initialTaskState(1000), { type: 'hint' })
  expect(s.usedHint).toBe(true)
  for (const m of [60, 64, 67]) s = taskReducer(s, { type: 'toggle', midi: m })
  s = taskReducer(s, { type: 'check', voicing: cMajor })
  expect(finishResult(s, 5500)).toEqual({ correct: true, usedHint: true, seconds: 4.5 })
})

test('reset starts a fresh attempt', () => {
  let s = taskReducer(initialTaskState(1000), { type: 'toggle', midi: 60 })
  s = taskReducer(s, { type: 'reset', now: 2000 })
  expect(s).toEqual(initialTaskState(2000))
})

test('fail marks the attempt wrong without a check', () => {
  const s = taskReducer(taskReducer(initialTaskState(1000), { type: 'toggle', midi: 60 }), { type: 'fail' })
  expect(s.phase).toBe('wrong')
  expect(taskReducer(s, { type: 'toggle', midi: 62 }).selected).toEqual([60])
})
