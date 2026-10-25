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
