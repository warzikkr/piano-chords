import { exportProgress, importProgress, type Progress } from './progress'

export interface SyncConfig {
  token: string
}

export interface SyncApi {
  /** Validates the token with the server and returns the config to store. */
  connect(token: string): Promise<SyncConfig>
  pull(cfg: SyncConfig): Promise<Progress | null>
  push(cfg: SyncConfig, progress: Progress): Promise<void>
}

export const TOKEN_PATTERN = /^[A-Za-z0-9_-]{6,64}$/
export const TOKEN_RULE = 'Токен: от 6 до 64 латинских букв, цифр, дефисов или подчёркиваний'

export function isValidToken(token: string): boolean {
  return TOKEN_PATTERN.test(token)
}

const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'

/** A fresh token like k7m2-x9qa-4pzt: easy to read aloud, hard to guess. */
export function generateToken(): string {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  const chars = [...bytes].map((b) => ALPHABET[b % ALPHABET.length])
  return `${chars.slice(0, 4).join('')}-${chars.slice(4, 8).join('')}-${chars.slice(8, 12).join('')}`
}

export function tokenFromSearch(search: string): string | null {
  const t = new URLSearchParams(search).get('t')?.trim() ?? ''
  return isValidToken(t) ? t : null
}

export function linkForToken(pageUrl: string, token: string): string {
  return `${pageUrl}?t=${encodeURIComponent(token)}`
}

export function createRemoteApi(baseUrl: string, fetchImpl: typeof fetch = fetch): SyncApi {
  async function request(token: string, init: RequestInit): Promise<Response> {
    let res: Response
    try {
      res = await fetchImpl(baseUrl, {
        ...init,
        headers: { Authorization: `Bearer ${token}`, ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...(init.headers ?? {}) },
      })
    } catch {
      throw new Error('Нет связи с сервером')
    }
    if (res.status === 401 || res.status === 403) throw new Error('Токен не принят')
    if (res.status === 400) throw new Error(TOKEN_RULE)
    if (res.status === 413) throw new Error('Прогресс слишком большой для хранилища')
    if (!res.ok && res.status !== 204) throw new Error(`Сервер ответил ошибкой ${res.status}`)
    return res
  }

  return {
    async connect(raw) {
      const token = raw.trim()
      if (!isValidToken(token)) throw new Error(TOKEN_RULE)
      await request(token, { method: 'GET' })
      return { token }
    },
    async pull(cfg) {
      const res = await request(cfg.token, { method: 'GET' })
      if (res.status === 204) return null
      const text = await res.text()
      if (!text.trim()) return null
      return importProgress(text)
    },
    async push(cfg, progress) {
      await request(cfg.token, { method: 'PUT', body: exportProgress(progress) })
    },
  }
}
