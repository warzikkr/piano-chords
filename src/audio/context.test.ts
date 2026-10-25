// @vitest-environment jsdom
import { beforeEach, expect, test, vi } from 'vitest'

class FakeContext {
  state = 'interrupted'
  resume = vi.fn(async () => {
    this.state = 'running'
  })
}

beforeEach(() => {
  vi.resetModules()
  ;(window as unknown as { AudioContext: unknown }).AudioContext = FakeContext
  URL.createObjectURL = vi.fn(() => 'blob:silent')
})

test('getAudioContext resumes a context in any non-running state, including iOS "interrupted"', async () => {
  const { getAudioContext } = await import('./context')
  const ctx = getAudioContext() as unknown as FakeContext
  expect(ctx.resume).toHaveBeenCalledTimes(1)
  ctx.state = 'interrupted'
  getAudioContext()
  expect(ctx.resume).toHaveBeenCalledTimes(2)
  ctx.state = 'running'
  getAudioContext()
  expect(ctx.resume).toHaveBeenCalledTimes(2)
})

test('a later pointerup or return to the page resumes an interrupted context', async () => {
  const { getAudioContext } = await import('./context')
  const ctx = getAudioContext() as unknown as FakeContext
  ctx.state = 'interrupted'
  window.dispatchEvent(new Event('pointerup'))
  expect(ctx.resume).toHaveBeenCalledTimes(2)
  ctx.state = 'interrupted'
  document.dispatchEvent(new Event('visibilitychange'))
  expect(ctx.resume).toHaveBeenCalledTimes(3)
})

test('unlockAudio retries until the silent audio actually plays, then stops', async () => {
  const play = vi.fn().mockRejectedValueOnce(new Error('no gesture')).mockResolvedValue(undefined)
  HTMLMediaElement.prototype.play = play
  const { unlockAudio } = await import('./context')
  unlockAudio()
  await Promise.resolve()
  await Promise.resolve()
  unlockAudio()
  await Promise.resolve()
  await Promise.resolve()
  unlockAudio()
  expect(play).toHaveBeenCalledTimes(2)
})
