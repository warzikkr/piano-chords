import { expect, test, vi } from 'vitest'
import { fakeContext } from './fakeContext'
import { createMetronome, scheduleBeats } from './metronome'

test('scheduleBeats returns the beat times that fall inside the lookahead window', () => {
  expect(scheduleBeats(0.9, 1.0, 0.12, 0.5)).toEqual([1.0])
  expect(scheduleBeats(1.0, 1.0, 0.6, 0.5)).toEqual([1.0, 1.5])
  expect(scheduleBeats(0.5, 1.0, 0.12, 0.5)).toEqual([])
})

test('metronome schedules beats ahead of time and stops cleanly', () => {
  const ctx = fakeContext()
  let tick: (() => void) | null = null
  const timers = {
    setInterval: vi.fn((fn: () => void) => {
      tick = fn
      return 1 as unknown as ReturnType<typeof setInterval>
    }),
    clearInterval: vi.fn(),
  }
  const m = createMetronome(ctx, timers)
  const beats: [number, number][] = []
  m.start(120, 4, (beat, bar) => beats.push([beat, bar]))
  expect(m.running).toBe(true)
  tick!()
  expect(beats).toEqual([[0, 0]])
  ctx.currentTime = 1.0
  tick!()
  expect(beats).toEqual([
    [0, 0],
    [1, 0],
    [2, 0],
  ])
  ctx.currentTime = 2.0
  tick!()
  expect(beats.at(-1)).toEqual([0, 1])
  m.stop()
  expect(timers.clearInterval).toHaveBeenCalled()
  expect(m.running).toBe(false)
})
