import { expect, test, vi } from 'vitest'
import { fakeContext } from './fakeContext'
import { createPiano, sampleFor } from './sampler'

test('sampleFor maps midi to the nearest sampled file', () => {
  expect(sampleFor(60)).toEqual({ file: 'C4', rate: 1 })
  expect(sampleFor(61).file).toBe('Cs4')
  expect(sampleFor(36)).toEqual({ file: 'C2', rate: 1 })
  expect(sampleFor(96)).toEqual({ file: 'C7', rate: 1 })
  expect(sampleFor(30)).toEqual({ file: 'C2', rate: 2 ** (-6 / 12) })
  expect(sampleFor(100).file).toBe('C7')
  expect(sampleFor(100).rate).toBeCloseTo(2 ** (4 / 12))
})

test('piano falls back to synth when samples cannot load', async () => {
  const ctx = fakeContext()
  const failingFetch = vi.fn(async () => {
    throw new Error('offline')
  }) as unknown as typeof fetch
  const piano = createPiano(ctx, '/samples/', failingFetch)
  await piano.load()
  expect(piano.failed).toBe(true)
  expect(piano.ready).toBe(false)
  expect(() => piano.noteOn(60)).not.toThrow()
  expect(() => piano.noteOff(60)).not.toThrow()
  expect(() => piano.playChord([60, 64, 67])).not.toThrow()
  expect(() => piano.playArpeggio([60, 64, 67])).not.toThrow()
})

test('piano loads every sample through fetch and reports progress', async () => {
  const ctx = fakeContext()
  const okFetch = vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })) as unknown as typeof fetch
  const piano = createPiano(ctx, '/samples/', okFetch)
  const progress: number[] = []
  await piano.load((done) => progress.push(done))
  expect(piano.ready).toBe(true)
  expect(piano.failed).toBe(false)
  expect(okFetch).toHaveBeenCalledTimes(61)
  expect(progress.at(-1)).toBe(61)
  expect(() => piano.noteOn(60)).not.toThrow()
  expect(() => piano.setVolume(0.5)).not.toThrow()
})

test('load is idempotent', async () => {
  const ctx = fakeContext()
  const okFetch = vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })) as unknown as typeof fetch
  const piano = createPiano(ctx, '/samples/', okFetch)
  await Promise.all([piano.load(), piano.load()])
  await piano.load()
  expect(okFetch).toHaveBeenCalledTimes(61)
})
