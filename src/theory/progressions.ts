import { cardId, type ChordSpec, type ChordTypeId } from './chords'
import { MAJOR_ROOTS, formatNote, mod12, type NotationStyle, type Pc } from './notes'

export interface Progression {
  id: string
  title: string
  numerals: string[]
}

export const PROGRESSIONS: Progression[] = [
  { id: 'pop', title: 'I–V–vi–IV', numerals: ['I', 'V', 'vi', 'IV'] },
  { id: 'pop2', title: 'vi–IV–I–V', numerals: ['vi', 'IV', 'I', 'V'] },
  { id: 'basic', title: 'I–IV–V', numerals: ['I', 'IV', 'V', 'V'] },
  { id: 'fifties', title: 'I–vi–IV–V', numerals: ['I', 'vi', 'IV', 'V'] },
  { id: 'jazz', title: 'ii–V–I', numerals: ['ii7', 'V7', 'Imaj7', 'Imaj7'] },
  { id: 'canon', title: 'Канон', numerals: ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'] },
  {
    id: 'blues',
    title: 'Блюз 12 тактов',
    numerals: ['I7', 'I7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'V7'],
  },
]

export function progressionById(id: string): Progression {
  const p = PROGRESSIONS.find((x) => x.id === id)
  if (!p) throw new Error(`unknown progression ${id}`)
  return p
}

const DEGREE_SEMITONES: Record<string, number> = { i: 0, ii: 2, iii: 4, iv: 5, v: 7, vi: 9, vii: 11 }

export function resolveNumeral(numeral: string, keyRoot: Pc): ChordSpec {
  const match = /^([ivIV]+)(°?)(maj7|7)?$/.exec(numeral)
  if (!match) throw new Error(`bad numeral ${numeral}`)
  const [, roman, dimMark, suffix] = match
  const isUpper = roman === roman.toUpperCase()
  const root = mod12(keyRoot + DEGREE_SEMITONES[roman.toLowerCase()])
  let type: ChordTypeId
  if (dimMark) type = 'dim'
  else if (suffix === 'maj7') type = 'maj7'
  else if (suffix === '7') type = isUpper ? 'dom7' : 'min7'
  else type = isUpper ? 'maj' : 'min'
  return { root, type, inversion: 0 }
}

export function progressionChords(p: Progression, keyRoot: Pc): ChordSpec[] {
  return p.numerals.map((n) => resolveNumeral(n, keyRoot))
}

export const KEYS: Pc[] = [0, 7, 5, 2, 10, 9, 4, 3, 8, 11, 1, 6]

export function keyIsRecommended(p: Progression, keyRoot: Pc, introduced: (id: string) => boolean): boolean {
  return progressionChords(p, keyRoot).every((spec) => introduced(cardId(spec)))
}

export function keyName(keyRoot: Pc, style: NotationStyle = 'latin'): string {
  return formatNote(MAJOR_ROOTS[keyRoot], style)
}
