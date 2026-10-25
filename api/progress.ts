import { get, put } from '@vercel/blob'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleProgress, type ProgressStore } from '../server/progress.js'

const blobStore: ProgressStore = {
  async read(key) {
    const result = await get(key, { access: 'private', useCache: false })
    if (!result || result.statusCode !== 200) return null
    return await new Response(result.stream).text()
  },
  async write(key, text) {
    await put(key, text, { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' })
  },
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const raw = req.body
  const body = raw === undefined || raw === null ? undefined : typeof raw === 'string' ? raw : JSON.stringify(raw)
  const auth = req.headers.authorization
  const r = await handleProgress({ method: req.method ?? 'GET', authorization: Array.isArray(auth) ? auth[0] : auth, body }, blobStore)
  for (const [k, v] of Object.entries(r.headers)) res.setHeader(k, v)
  res.status(r.status)
  if (r.body === undefined) res.end()
  else res.send(r.body)
}
