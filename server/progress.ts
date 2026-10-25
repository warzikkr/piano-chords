import { createHash } from 'node:crypto'

/** Key-value storage for progress blobs; the real one is Vercel Blob, tests use memory. */
export interface ProgressStore {
  read(key: string): Promise<string | null>
  write(key: string, text: string): Promise<void>
}

export interface ProgressRequest {
  method: string
  authorization?: string
  body?: string
}

export interface ProgressResponse {
  status: number
  headers: Record<string, string>
  body?: string
}

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
  'Cache-Control': 'no-store',
}

export const TOKEN_PATTERN = /^[A-Za-z0-9_-]{6,64}$/
const MAX_BYTES = 1_000_000

/** The token itself is never stored; its hash names the blob. */
export function keyFor(token: string): string {
  return `progress/${createHash('sha256').update(token).digest('hex')}.json`
}

function tokenFrom(authorization?: string): string | null {
  const m = /^Bearer\s+(.+)$/i.exec(authorization ?? '')
  return m ? m[1].trim() : null
}

export async function handleProgress(req: ProgressRequest, store: ProgressStore): Promise<ProgressResponse> {
  const method = req.method.toUpperCase()
  if (method === 'OPTIONS') return { status: 204, headers: CORS }
  if (method !== 'GET' && method !== 'PUT') return { status: 405, headers: { ...CORS, Allow: 'GET, PUT, OPTIONS' } }

  const token = tokenFrom(req.authorization)
  if (!token) return { status: 401, headers: CORS, body: 'Нужен токен' }
  if (!TOKEN_PATTERN.test(token)) return { status: 400, headers: CORS, body: 'Токен: от 6 до 64 букв, цифр, дефисов или подчёркиваний' }
  const key = keyFor(token)

  if (method === 'GET') {
    const text = await store.read(key)
    if (text === null) return { status: 204, headers: CORS }
    return { status: 200, headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' }, body: text }
  }

  const body = req.body ?? ''
  if (Buffer.byteLength(body, 'utf8') > MAX_BYTES) return { status: 413, headers: CORS, body: 'Слишком большой прогресс' }
  let parsed: unknown
  try {
    parsed = JSON.parse(body)
  } catch {
    return { status: 400, headers: CORS, body: 'Ожидался JSON' }
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return { status: 400, headers: CORS, body: 'Ожидался объект JSON' }
  await store.write(key, body)
  return { status: 200, headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' }, body: '{"ok":true}' }
}
