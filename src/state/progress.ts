import { isValidCardId, type CardId, type Level } from '../theory/chords'
import type { NotationStyle } from '../theory/notes'
import type { StoredCard } from '../learning/scheduler'

export interface Settings {
  notation: NotationStyle
  syllables: boolean
  newPerDay: number
  maxReviews: number
  volume: number
  autoCheck: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  notation: 'latin',
  syllables: false,
  newPerDay: 3,
  maxReviews: 20,
  volume: 0.8,
  autoCheck: true,
}

export interface DayStats {
  reviews: number
  newCards: number
  correct: number
  sessionDone: boolean
}

export interface Progress {
  version: 1
  cards: Record<CardId, StoredCard>
  introduced: Record<CardId, number>
  lessonsSeen: Level[]
  days: Record<string, DayStats>
  streak: number
  lastSessionDay: string | null
  settings: Settings
}

export const STORAGE_KEY = 'piano-chords:v1'

export function createProgress(): Progress {
  return {
    version: 1,
    cards: {},
    introduced: {},
    lessonsSeen: [],
    days: {},
    streak: 0,
    lastSessionDay: null,
    settings: { ...DEFAULT_SETTINGS },
  }
}

export function emptyDay(): DayStats {
  return { reviews: 0, newCards: 0, correct: 0, sessionDone: false }
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Local calendar date, e.g. 2026-01-05. */
export function dayKey(now: number): string {
  const d = new Date(now)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
}

const CARD_NUMBER_FIELDS: (keyof StoredCard)[] = [
  'due',
  'stability',
  'difficulty',
  'elapsedDays',
  'scheduledDays',
  'learningSteps',
  'reps',
  'lapses',
  'state',
]

function isStoredCard(x: unknown): x is StoredCard {
  if (!isRecord(x)) return false
  if (!CARD_NUMBER_FIELDS.every((f) => typeof x[f] === 'number' && Number.isFinite(x[f]))) return false
  return x.lastReview === null || typeof x.lastReview === 'number'
}

function validCards(raw: unknown): Record<CardId, StoredCard> {
  const out: Record<CardId, StoredCard> = {}
  if (!isRecord(raw)) return out
  for (const [id, card] of Object.entries(raw)) if (isValidCardId(id) && isStoredCard(card)) out[id] = card
  return out
}

function validIntroduced(raw: unknown): Record<CardId, number> {
  const out: Record<CardId, number> = {}
  if (!isRecord(raw)) return out
  for (const [id, t] of Object.entries(raw)) if (isValidCardId(id) && typeof t === 'number') out[id] = t
  return out
}

function normalize(raw: unknown): Progress | null {
  if (!isRecord(raw) || raw.version !== 1 || !isRecord(raw.cards) || !isRecord(raw.settings)) return null
  const base = createProgress()
  return {
    version: 1,
    cards: validCards(raw.cards),
    introduced: validIntroduced(raw.introduced),
    lessonsSeen: Array.isArray(raw.lessonsSeen) ? (raw.lessonsSeen as Level[]) : [],
    days: isRecord(raw.days) ? (raw.days as Record<string, DayStats>) : {},
    streak: typeof raw.streak === 'number' ? raw.streak : 0,
    lastSessionDay: typeof raw.lastSessionDay === 'string' ? raw.lastSessionDay : null,
    settings: { ...base.settings, ...(raw.settings as Partial<Settings>) },
  }
}

export function loadProgress(storage: Pick<Storage, 'getItem'>): Progress {
  try {
    const text = storage.getItem(STORAGE_KEY)
    if (!text) return createProgress()
    return normalize(JSON.parse(text)) ?? createProgress()
  } catch {
    return createProgress()
  }
}

export function saveProgress(storage: Pick<Storage, 'setItem'>, p: Progress): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(p))
  } catch {
    // Storage may be unavailable (private mode); the app keeps working in memory.
  }
}

export function exportProgress(p: Progress): string {
  return JSON.stringify(p, null, 2)
}

export function importProgress(json: string): Progress {
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    throw new Error('Файл не похож на экспорт этого приложения')
  }
  const p = normalize(raw)
  if (!p) throw new Error('Файл не похож на экспорт этого приложения')
  return p
}
