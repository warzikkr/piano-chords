import { expect, test, vi } from 'vitest'
import { createProgress } from './progress'
import { createRemoteApi, generateToken, isValidToken, linkForToken, tokenFromSearch } from './remote'

type Call = { url: string; init?: RequestInit }

function fakeFetch(handler: (url: string, init?: RequestInit) => { status: number; body?: string }) {
  const calls: Call[] = []
  const f = vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, init })
    const r = handler(url, init)
    return { ok: r.status < 300, status: r.status, text: async () => r.body ?? '' } as Response
  })
  return { f: f as unknown as typeof fetch, calls }
}

test('tokens are 6 to 64 url-safe characters; generated ones look like xxxx-xxxx-xxxx', () => {
  expect(isValidToken('my-first-token')).toBe(true)
  expect(isValidToken('abc')).toBe(false)
  expect(isValidToken('has space')).toBe(false)
  const t = generateToken()
  expect(t).toMatch(/^[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/)
  expect(isValidToken(t)).toBe(true)
  expect(generateToken()).not.toBe(t)
})

test('tokenFromSearch reads ?t= and ignores junk', () => {
  expect(tokenFromSearch('?t=my-first-token')).toBe('my-first-token')
  expect(tokenFromSearch('?x=1&t=abcd-efgh-ijkl')).toBe('abcd-efgh-ijkl')
  expect(tokenFromSearch('?t=no')).toBeNull()
  expect(tokenFromSearch('')).toBeNull()
})

test('linkForToken builds the shareable link', () => {
  expect(linkForToken('https://app.example/piano/', 'abcd-efgh-ijkl')).toBe('https://app.example/piano/?t=abcd-efgh-ijkl')
})

test('connect checks the token against the server and keeps it', async () => {
  const { f, calls } = fakeFetch(() => ({ status: 204 }))
  const api = createRemoteApi('https://x.test/api/progress', f)
  expect(await api.connect(' my-first-token ')).toEqual({ token: 'my-first-token' })
  expect(calls[0].init?.headers).toMatchObject({ Authorization: 'Bearer my-first-token' })
  await expect(api.connect('abc')).rejects.toThrow('от 6 до 64')
})

test('pull returns null when the server has nothing and the progress otherwise', async () => {
  const stored = { ...createProgress(), streak: 3 }
  const { f } = fakeFetch((_u, init) => (init?.method === 'GET' ? { status: 200, body: JSON.stringify(stored) } : { status: 500 }))
  const api = createRemoteApi('/api/progress', f)
  expect(await api.pull({ token: 'my-first-token' })).toEqual(stored)
  const { f: empty } = fakeFetch(() => ({ status: 204 }))
  expect(await createRemoteApi('/api/progress', empty).pull({ token: 'my-first-token' })).toBeNull()
})

test('push PUTs the progress JSON with the token', async () => {
  const { f, calls } = fakeFetch(() => ({ status: 200, body: '{"ok":true}' }))
  await createRemoteApi('/api/progress', f).push({ token: 'my-first-token' }, { ...createProgress(), streak: 2 })
  expect(calls[0].init?.method).toBe('PUT')
  expect(JSON.parse(calls[0].init!.body as string).streak).toBe(2)
})

test('errors are reported in plain words', async () => {
  const { f } = fakeFetch(() => ({ status: 401 }))
  await expect(createRemoteApi('/api/progress', f).pull({ token: 'my-first-token' })).rejects.toThrow('Токен не принят')
  const down = vi.fn(async () => {
    throw new TypeError('Failed to fetch')
  }) as unknown as typeof fetch
  await expect(createRemoteApi('/api/progress', down).pull({ token: 'my-first-token' })).rejects.toThrow('Нет связи с сервером')
})
