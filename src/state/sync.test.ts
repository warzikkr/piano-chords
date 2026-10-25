import { expect, test, vi } from 'vitest'
import type { SyncApi, SyncConfig } from './remote'
import { createProgress, type Progress } from './progress'
import { reducer } from './reducer'
import { createSyncEngine, type SyncStatus } from './sync'

const cfg: SyncConfig = { token: 'my-first-token' }
const ok = { correct: true, usedHint: false, seconds: 4 }
const T = new Date(2026, 9, 26, 10, 0).getTime()

function fakeApi(initial: Progress | null) {
  let remote = initial
  const pushes: Progress[] = []
  const api: SyncApi = {
    connect: async () => cfg,
    pull: async () => remote,
    push: async (_c, p) => {
      remote = p
      pushes.push(p)
    },
  }
  return { api, pushes, remote: () => remote }
}

function harness(initialRemote: Progress | null, local: Progress) {
  const { api, pushes, remote } = fakeApi(initialRemote)
  let current = local
  const applied: Progress[] = []
  const statuses: SyncStatus[] = []
  const engine = createSyncEngine({
    api,
    getProgress: () => current,
    applyMerged: (p) => {
      current = p
      applied.push(p)
    },
    onStatus: (s) => statuses.push(s),
    debounceMs: 1000,
  })
  return { engine, pushes, remote, applied, statuses, set: (p: Progress) => (current = p) }
}

const flush = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve()
}

test('start with an empty remote uploads the local progress', async () => {
  const local = reducer(createProgress(), { type: 'answer', id: '0:maj:0', task: 'build', result: ok, isNew: true, now: T })
  const h = harness(null, local)
  h.engine.start(cfg)
  await flush()
  expect(h.pushes).toHaveLength(1)
  expect(h.applied).toHaveLength(0)
  expect(h.statuses.at(-1)?.state).toBe('ok')
})

test('start with a remote that knows more applies the merge locally and uploads it', async () => {
  const local = reducer(createProgress(), { type: 'answer', id: '0:maj:0', task: 'build', result: ok, isNew: true, now: T })
  const remote = reducer(createProgress(), { type: 'answer', id: '7:maj:0', task: 'build', result: ok, isNew: true, now: T + 1 })
  const h = harness(remote, local)
  h.engine.start(cfg)
  await flush()
  expect(Object.keys(h.applied[0].cards).sort()).toEqual(['0:maj:0', '7:maj:0'])
  expect(Object.keys(h.remote()!.cards).sort()).toEqual(['0:maj:0', '7:maj:0'])
})

test('local changes are uploaded once after the debounce, unchanged content is not re-sent', async () => {
  vi.useFakeTimers()
  const h = harness(createProgress(), createProgress())
  h.engine.start(cfg)
  await flush()
  const before = h.pushes.length
  const p1 = reducer(createProgress(), { type: 'answer', id: '0:maj:0', task: 'build', result: ok, isNew: true, now: T })
  h.set(p1)
  h.engine.onProgressChanged(p1)
  const p2 = reducer(p1, { type: 'answer', id: '7:maj:0', task: 'build', result: ok, isNew: true, now: T + 1 })
  h.set(p2)
  h.engine.onProgressChanged(p2)
  vi.advanceTimersByTime(999)
  await flush()
  expect(h.pushes.length).toBe(before)
  vi.advanceTimersByTime(2)
  await flush()
  expect(h.pushes.length).toBe(before + 1)
  expect(Object.keys(h.pushes.at(-1)!.cards)).toHaveLength(2)
  h.engine.onProgressChanged(p2)
  vi.advanceTimersByTime(1001)
  await flush()
  expect(h.pushes.length).toBe(before + 1)
  vi.useRealTimers()
})

test('a failing remote is reported and does not touch local progress', async () => {
  const api: SyncApi = {
    connect: async () => cfg,
    pull: async () => {
      throw new Error('Нет связи с GitHub')
    },
    push: async () => undefined,
  }
  const statuses: SyncStatus[] = []
  const applied: Progress[] = []
  const engine = createSyncEngine({ api, getProgress: createProgress, applyMerged: (p) => applied.push(p), onStatus: (s) => statuses.push(s) })
  engine.start(cfg)
  await flush()
  expect(statuses.at(-1)).toEqual({ state: 'error', message: 'Нет связи с GitHub' })
  expect(applied).toHaveLength(0)
})

test('stop turns status off and drops pending uploads', async () => {
  vi.useFakeTimers()
  const h = harness(createProgress(), createProgress())
  h.engine.start(cfg)
  await flush()
  const before = h.pushes.length
  h.engine.onProgressChanged(reducer(createProgress(), { type: 'answer', id: '0:maj:0', task: 'build', result: ok, isNew: true, now: T }))
  h.engine.stop()
  vi.advanceTimersByTime(5000)
  await flush()
  expect(h.pushes.length).toBe(before)
  expect(h.statuses.at(-1)).toEqual({ state: 'off' })
  vi.useRealTimers()
})
