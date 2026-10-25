import { expect, test } from 'vitest'
import { handleProgress, type ProgressStore } from './progress'

function memoryStore(): ProgressStore & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    read: async (key) => data.get(key) ?? null,
    write: async (key, text) => void data.set(key, text),
  }
}

const auth = (token: string) => ({ authorization: `Bearer ${token}` })

test('preflight answers with CORS headers and no body', async () => {
  const r = await handleProgress({ method: 'OPTIONS' }, memoryStore())
  expect(r.status).toBe(204)
  expect(r.headers['Access-Control-Allow-Origin']).toBe('*')
  expect(r.headers['Access-Control-Allow-Methods']).toContain('PUT')
  expect(r.headers['Access-Control-Allow-Headers']).toContain('Authorization')
})

test('a missing or too short token is rejected', async () => {
  const store = memoryStore()
  expect((await handleProgress({ method: 'GET' }, store)).status).toBe(401)
  expect((await handleProgress({ method: 'GET', ...auth('abc') }, store)).status).toBe(400)
  expect((await handleProgress({ method: 'GET', ...auth('has space!') }, store)).status).toBe(400)
})

test('GET answers 204 when the token has no progress yet', async () => {
  const r = await handleProgress({ method: 'GET', ...auth('my-first-token') }, memoryStore())
  expect(r.status).toBe(204)
  expect(r.headers['Access-Control-Allow-Origin']).toBe('*')
})

test('PUT stores the JSON under a hash of the token and GET returns it', async () => {
  const store = memoryStore()
  const body = JSON.stringify({ version: 1, streak: 3 })
  const put = await handleProgress({ method: 'PUT', body, ...auth('my-first-token') }, store)
  expect(put.status).toBe(200)
  const [key] = [...store.data.keys()]
  expect(key).toMatch(/^progress\/[0-9a-f]{64}\.json$/)
  expect(key).not.toContain('my-first-token')
  const get = await handleProgress({ method: 'GET', ...auth('my-first-token') }, store)
  expect(get.status).toBe(200)
  expect(get.headers['Content-Type']).toContain('application/json')
  expect(get.body).toBe(body)
  expect((await handleProgress({ method: 'GET', ...auth('another-token') }, store)).status).toBe(204)
})

test('PUT rejects bodies that are not JSON objects or are too large', async () => {
  const store = memoryStore()
  expect((await handleProgress({ method: 'PUT', body: 'nope', ...auth('my-first-token') }, store)).status).toBe(400)
  expect((await handleProgress({ method: 'PUT', body: '[1,2]', ...auth('my-first-token') }, store)).status).toBe(400)
  const huge = JSON.stringify({ version: 1, pad: 'x'.repeat(1_100_000) })
  expect((await handleProgress({ method: 'PUT', body: huge, ...auth('my-first-token') }, store)).status).toBe(413)
  expect(store.data.size).toBe(0)
})

test('other methods are not allowed', async () => {
  expect((await handleProgress({ method: 'DELETE', ...auth('my-first-token') }, memoryStore())).status).toBe(405)
})
