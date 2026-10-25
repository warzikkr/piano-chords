import { exportProgress, importProgress, type Progress } from './progress'

export const GIST_FILE = 'piano-chords-progress.json'
const API = 'https://api.github.com'

export interface GistConfig {
  token: string
  gistId: string
  login: string
}

export interface GistApi {
  /** Checks the token, finds the gist with the progress file or creates a private one. */
  connect(token: string): Promise<GistConfig>
  pull(cfg: GistConfig): Promise<Progress | null>
  push(cfg: GistConfig, progress: Progress): Promise<void>
}

interface GistSummary {
  id: string
  files: Record<string, { content?: string; truncated?: boolean }>
}

export function createGistApi(fetchImpl: typeof fetch = fetch): GistApi {
  async function request<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
    let res: Response
    try {
      res = await fetchImpl(`${API}${path}`, {
        ...init,
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
          ...(init.headers ?? {}),
        },
      })
    } catch {
      throw new Error('Нет связи с GitHub')
    }
    if (res.status === 401 || res.status === 403) throw new Error('Токен не подошёл: проверь, что у него есть право gist')
    if (res.status === 404) throw new Error('Хранилище прогресса не найдено, подключи токен заново')
    if (!res.ok) throw new Error(`GitHub ответил ошибкой ${res.status}`)
    return (await res.json()) as T
  }

  return {
    async connect(token) {
      const user = await request<{ login: string }>(token, '/user')
      const gists = await request<GistSummary[]>(token, '/gists?per_page=100')
      const existing = gists.find((g) => g.files && GIST_FILE in g.files)
      if (existing) return { token, gistId: existing.id, login: user.login }
      const created = await request<{ id: string }>(token, '/gists', {
        method: 'POST',
        body: JSON.stringify({
          description: 'Прогресс тренажёра аккордов',
          public: false,
          files: { [GIST_FILE]: { content: '{}' } },
        }),
      })
      return { token, gistId: created.id, login: user.login }
    },
    async pull(cfg) {
      const gist = await request<GistSummary>(cfg.token, `/gists/${cfg.gistId}`)
      const file = gist.files?.[GIST_FILE]
      if (!file || !file.content || file.content.trim() === '' || file.content.trim() === '{}') return null
      if (file.truncated) throw new Error('Файл прогресса слишком большой для GitHub')
      return importProgress(file.content)
    },
    async push(cfg, progress) {
      await request(cfg.token, `/gists/${cfg.gistId}`, {
        method: 'PATCH',
        body: JSON.stringify({ files: { [GIST_FILE]: { content: exportProgress(progress) } } }),
      })
    },
  }
}
