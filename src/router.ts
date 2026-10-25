import { useCallback, useEffect, useState } from 'react'
import { isTopicId } from './learning/theory'
import { isValidCardId, type CardId } from './theory/chords'

export type TabName = 'today' | 'map' | 'progressions' | 'theory' | 'reference'

export type ReferenceView = 'lab' | 'finder' | 'sheet' | 'list'
export const REFERENCE_VIEWS: ReferenceView[] = ['lab', 'finder', 'sheet', 'list']

export type Route =
  | { name: Exclude<TabName, 'reference'> }
  | { name: 'reference'; view?: ReferenceView }
  | { name: 'settings' }
  | { name: 'session'; practice?: CardId; extraNew?: number }
  | { name: 'chord'; id: CardId }
  | { name: 'topic'; id: string }
  | { name: 'ear' }

const TABS: TabName[] = ['today', 'map', 'progressions', 'theory', 'reference']

export function parseRoute(hash: string): Route {
  const raw = hash.replace(/^#/, '')
  const [pathPart, query = ''] = raw.split('?')
  const [name, param] = pathPart.split('/')
  if (name === 'theory' && param) return isTopicId(param) ? { name: 'topic', id: param } : { name: 'theory' }
  if (name === 'reference') return param && REFERENCE_VIEWS.includes(param as ReferenceView) ? { name: 'reference', view: param as ReferenceView } : { name: 'reference' }
  if (TABS.includes(name as TabName)) return { name: name as TabName }
  if (name === 'settings') return { name: 'settings' }
  if (name === 'ear') return { name: 'ear' }
  if (name === 'chord' && param && isValidCardId(param)) return { name: 'chord', id: param }
  if (name === 'session') {
    if (param && isValidCardId(param)) return { name: 'session', practice: param }
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
    case 'topic':
      return `#theory/${r.id}`
    case 'reference':
      return r.view ? `#reference/${r.view}` : '#reference'
    case 'session':
      if (r.practice) return `#session/${r.practice}`
      if (r.extraNew) return `#session?extra=${r.extraNew}`
      return '#session'
    default:
      return `#${r.name}`
  }
}

export function navigateTo(r: Route): void {
  window.location.hash = routeHash(r)
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
