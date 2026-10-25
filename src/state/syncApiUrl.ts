/**
 * Where progress is stored. On Vercel the API lives next to the site; a build for
 * another host (GitHub Pages, local preview) points at the Vercel deployment through
 * the VITE_SYNC_API variable.
 */
export const SYNC_API_URL: string = import.meta.env.VITE_SYNC_API || '/api/progress'
