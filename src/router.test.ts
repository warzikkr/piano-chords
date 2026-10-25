import { expect, test } from 'vitest'
import { parseRoute, routeHash } from './router'

test('parseRoute reads tab names and parameters from the hash', () => {
  expect(parseRoute('')).toEqual({ name: 'today' })
  expect(parseRoute('#')).toEqual({ name: 'today' })
  expect(parseRoute('#map')).toEqual({ name: 'map' })
  expect(parseRoute('#nope')).toEqual({ name: 'today' })
  expect(parseRoute('#chord/0:maj:0')).toEqual({ name: 'chord', id: '0:maj:0' })
  expect(parseRoute('#session')).toEqual({ name: 'session' })
  expect(parseRoute('#session/0:maj:0')).toEqual({ name: 'session', practice: '0:maj:0' })
  expect(parseRoute('#session?extra=3')).toEqual({ name: 'session', extraNew: 3 })
})

test('routeHash is the inverse of parseRoute', () => {
  expect(routeHash({ name: 'session', practice: '0:maj:0' })).toBe('#session/0:maj:0')
  expect(routeHash({ name: 'session', extraNew: 3 })).toBe('#session?extra=3')
  expect(routeHash({ name: 'map' })).toBe('#map')
  expect(routeHash({ name: 'chord', id: '6:min7:1' })).toBe('#chord/6:min7:1')
  for (const hash of ['#today', '#reference', '#settings', '#progressions', '#session', '#chord/1:dim:0']) {
    expect(routeHash(parseRoute(hash))).toBe(hash)
  }
})

test('routes with ids that are not chords fall back safely', () => {
  expect(parseRoute('#chord/zzz')).toEqual({ name: 'today' })
  expect(parseRoute('#chord/0:maj:7')).toEqual({ name: 'today' })
  expect(parseRoute('#chord/12:maj:0')).toEqual({ name: 'today' })
  expect(parseRoute('#session/0:nope:0')).toEqual({ name: 'session' })
  expect(parseRoute('#chord/6:min7:1')).toEqual({ name: 'chord', id: '6:min7:1' })
})

test('theory routes', () => {
  expect(parseRoute('#theory')).toEqual({ name: 'theory' })
  expect(parseRoute('#theory/triads')).toEqual({ name: 'topic', id: 'triads' })
  expect(parseRoute('#theory/nope')).toEqual({ name: 'theory' })
  expect(routeHash({ name: 'topic', id: 'triads' })).toBe('#theory/triads')
})

test('reference views', () => {
  expect(parseRoute('#reference')).toEqual({ name: 'reference' })
  expect(parseRoute('#reference/finder')).toEqual({ name: 'reference', view: 'finder' })
  expect(parseRoute('#reference/nope')).toEqual({ name: 'reference' })
  expect(routeHash({ name: 'reference', view: 'lab' })).toBe('#reference/lab')
  expect(routeHash({ name: 'reference' })).toBe('#reference')
})

test('ear game route', () => {
  expect(parseRoute('#ear')).toEqual({ name: 'ear' })
  expect(routeHash({ name: 'ear' })).toBe('#ear')
})

test('cheat sheet view', () => {
  expect(parseRoute('#reference/sheet')).toEqual({ name: 'reference', view: 'sheet' })
})
