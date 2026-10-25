import { expect, test, vi } from 'vitest'
import { GIST_FILE, createGistApi } from './gist'
import { createProgress } from './progress'

type Call = { url: string; init?: RequestInit }

function fakeFetch(handler: (url: string, init?: RequestInit) => { status: number; body: unknown }) {
  const calls: Call[] = []
  const f = vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, init })
    const r = handler(url, init)
    return { ok: r.status < 300, status: r.status, json: async () => r.body } as Response
  })
  return { f: f as unknown as typeof fetch, calls }
}

test('connect finds the existing gist that holds the progress file', async () => {
  const { f, calls } = fakeFetch((url) => {
    if (url.endsWith('/user')) return { status: 200, body: { login: 'anton' } }
    if (url.includes('/gists?')) return { status: 200, body: [{ id: 'other', files: { 'x.txt': {} } }, { id: 'g1', files: { [GIST_FILE]: {} } }] }
    return { status: 500, body: {} }
  })
  const api = createGistApi(f)
  expect(await api.connect('tok')).toEqual({ token: 'tok', gistId: 'g1', login: 'anton' })
  expect(calls[0].init?.headers).toMatchObject({ Authorization: 'Bearer tok' })
})

test('connect creates a private gist when none exists', async () => {
  const { f, calls } = fakeFetch((url, init) => {
    if (url.endsWith('/user')) return { status: 200, body: { login: 'anton' } }
    if (url.includes('/gists?')) return { status: 200, body: [] }
    if (url.endsWith('/gists') && init?.method === 'POST') return { status: 201, body: { id: 'new1' } }
    return { status: 500, body: {} }
  })
  const api = createGistApi(f)
  expect(await api.connect('tok')).toEqual({ token: 'tok', gistId: 'new1', login: 'anton' })
  const create = calls.find((c) => c.init?.method === 'POST')!
  const body = JSON.parse(create.init!.body as string)
  expect(body.public).toBe(false)
  expect(Object.keys(body.files)).toEqual([GIST_FILE])
})

test('a bad token is reported in plain words', async () => {
  const { f } = fakeFetch(() => ({ status: 401, body: { message: 'Bad credentials' } }))
  await expect(createGistApi(f).connect('bad')).rejects.toThrow('Токен не подошёл')
})

test('pull returns the stored progress, or null when the file is empty', async () => {
  const stored = { ...createProgress(), streak: 3 }
  const { f } = fakeFetch((url) => {
    if (url.endsWith('/gists/g1')) return { status: 200, body: { files: { [GIST_FILE]: { content: JSON.stringify(stored), truncated: false } } } }
    return { status: 500, body: {} }
  })
  const api = createGistApi(f)
  expect(await api.pull({ token: 'tok', gistId: 'g1', login: 'anton' })).toEqual(stored)
  const { f: empty } = fakeFetch(() => ({ status: 200, body: { files: { [GIST_FILE]: { content: '', truncated: false } } } }))
  expect(await createGistApi(empty).pull({ token: 'tok', gistId: 'g1', login: 'anton' })).toBeNull()
})

test('push patches the gist file with the progress JSON', async () => {
  const { f, calls } = fakeFetch(() => ({ status: 200, body: { id: 'g1' } }))
  const p = { ...createProgress(), streak: 2 }
  await createGistApi(f).push({ token: 'tok', gistId: 'g1', login: 'anton' }, p)
  expect(calls[0].url.endsWith('/gists/g1')).toBe(true)
  expect(calls[0].init?.method).toBe('PATCH')
  expect(JSON.parse(JSON.parse(calls[0].init!.body as string).files[GIST_FILE].content).streak).toBe(2)
})

test('network failure is reported as no connection', async () => {
  const f = vi.fn(async () => {
    throw new TypeError('Failed to fetch')
  }) as unknown as typeof fetch
  await expect(createGistApi(f).pull({ token: 'tok', gistId: 'g1', login: 'anton' })).rejects.toThrow('Нет связи с GitHub')
})
