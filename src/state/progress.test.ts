import { expect, test } from 'vitest'
import {
  DEFAULT_SETTINGS,
  STORAGE_KEY,
  createProgress,
  dayKey,
  exportProgress,
  importProgress,
  loadProgress,
  saveProgress,
} from './progress'

test('createProgress starts empty with default settings', () => {
  const p = createProgress()
  expect(p.version).toBe(1)
  expect(p.cards).toEqual({})
  expect(p.streak).toBe(0)
  expect(p.settings).toEqual(DEFAULT_SETTINGS)
  expect(DEFAULT_SETTINGS).toEqual({
    notation: 'latin',
    syllables: false,
    newPerDay: 3,
    maxReviews: 20,
    volume: 0.8,
    autoCheck: true,
  })
})

test('loadProgress falls back to a fresh progress on garbage or nothing', () => {
  expect(loadProgress({ getItem: () => 'garbage' })).toEqual(createProgress())
  expect(loadProgress({ getItem: () => null })).toEqual(createProgress())
  expect(loadProgress({ getItem: () => '{"version":1}' })).toEqual(createProgress())
})

test('loadProgress fills in settings that a stored copy lacks', () => {
  const stored = { ...createProgress(), settings: { notation: 'german' } }
  const p = loadProgress({ getItem: () => JSON.stringify(stored) })
  expect(p.settings.notation).toBe('german')
  expect(p.settings.newPerDay).toBe(3)
})

test('saveProgress writes JSON under the storage key', () => {
  const written: Record<string, string> = {}
  saveProgress({ setItem: (k, v) => void (written[k] = v) }, createProgress())
  expect(JSON.parse(written[STORAGE_KEY]).version).toBe(1)
})

test('importProgress rejects foreign JSON and round-trips exports', () => {
  expect(() => importProgress('{"foo":1}')).toThrow('Файл не похож на экспорт этого приложения')
  expect(() => importProgress('not json')).toThrow()
  const p = createProgress()
  p.streak = 4
  expect(importProgress(exportProgress(p))).toEqual(p)
})

test('dayKey uses the local calendar date', () => {
  expect(dayKey(new Date(2026, 0, 5, 23, 59).getTime())).toBe('2026-01-05')
  expect(dayKey(new Date(2026, 0, 6, 0, 1).getTime())).toBe('2026-01-06')
})
