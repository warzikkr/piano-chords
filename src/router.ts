import { useCallback, useEffect, useState } from 'react'
import type { CardId } from './theory/chords'

export type TabName = 'today' | 'map' | 'progressions' | 'reference'

export type Route =
  | { name: TabName }
  | { name: 'settings' }
  | { name: 'session'; practice?: CardId; extraNew?: number }
  | { name: 'chord'; id: CardId }

const TABS: TabName[] = ['today', 'map', 'progressions', 'reference']

export function parseRoute(hash: string): Route {
  const raw = hash.replace(/^#/, '')
  const [pathPart, query = ''] = raw.split('?')
  const [name, param] = pathPart.split('/')
  if (TABS.includes(name as TabName)) return { name: name as TabName }
  if (name === 'settings') return { name: 'settings' }
  if (name === 'chord' && param) return { name: 'chord', id: param }
  if (name === 'session') {
    if (param) return { name: 'session', practice: param }
    const extra = new URLSearchParams(query).get('extra')
    if (extra && Number(extra) > 0) return { name: 'session', extraNew: Number(extra) }
    return { name: 'session' }
  }
  return { name: 'today' }
}

export function routeHash(r: Route): string {
  switch (r.name) {
    case 'chord':
      return `#chord/${r.id}`
    case 'session':
      if (r.practice) return `#session/${r.practice}`
      if (r.extraNew) return `#session?extra=${r.extraNew}`
      return '#session'
    default:
      return `#${r.name}`
  }
}

export function useRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash))
  useEffect(() => {
    const onChange = () => setRoute(parseRoute(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  const navigate = useCallback((r: Route) => {
    const hash = routeHash(r)
    if (window.location.hash === hash) setRoute(parseRoute(hash))
    else window.location.hash = hash
  }, [])
  return [route, navigate]
}
