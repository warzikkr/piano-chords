import {
  MAJOR_ROOTS,
  MINOR_ROOTS,
  formatNote,
  pc,
  spellDegree,
  type Midi,
  type NotationStyle,
  type NoteName,
  type Pc,
} from './notes'

export type ChordTypeId =
  | 'maj'
  | 'min'
  | 'dom7'
  | 'maj7'
  | 'min7'
  | 'sus2'
  | 'sus4'
  | 'dim'
  | 'aug'
  | 'add9'
  | 'six'
  | 'min6'
  | 'm7b5'
  | 'dim7'
  | 'dom9'
  | 'maj9'
  | 'min9'
  | 'dom11'
  | 'dom13'
  | '7sus4'

export type Level = 1 | 2 | 3 | 4 | 5 | 6

export interface ChordType {
  id: ChordTypeId
  symbol: string
  nameRu: string
  intervals: number[]
  degrees: number[]
  level: Level
  family: 'major' | 'minor'
  explain: string
}

export const CHORD_TYPES: ChordType[] = [
  { id: 'maj', symbol: '', nameRu: 'мажор', intervals: [0, 4, 7], degrees: [1, 3, 5], level: 1, family: 'major', explain: '4 + 3 полутона' },
  { id: 'min', symbol: 'm', nameRu: 'минор', intervals: [0, 3, 7], degrees: [1, 3, 5], level: 1, family: 'minor', explain: '3 + 4 полутона' },
  { id: 'dom7', symbol: '7', nameRu: 'доминантовый 7', intervals: [0, 4, 7, 10], degrees: [1, 3, 5, 7], level: 4, family: 'major', explain: 'мажор + малая септима (на 2 ниже октавы)' },
  { id: 'maj7', symbol: 'maj7', nameRu: 'большой maj7', intervals: [0, 4, 7, 11], degrees: [1, 3, 5, 7], level: 4, family: 'major', explain: 'мажор + большая септима (на 1 ниже октавы)' },
  { id: 'min7', symbol: 'm7', nameRu: 'минорный m7', intervals: [0, 3, 7, 10], degrees: [1, 3, 5, 7], level: 4, family: 'minor', explain: 'минор + малая септима' },
  { id: 'sus2', symbol: 'sus2', nameRu: 'sus2', intervals: [0, 2, 7], degrees: [1, 2, 5], level: 5, family: 'major', explain: 'мажор, терция опущена до секунды' },
  { id: 'sus4', symbol: 'sus4', nameRu: 'sus4', intervals: [0, 5, 7], degrees: [1, 4, 5], level: 5, family: 'major', explain: 'мажор, терция поднята до кварты' },
  { id: 'dim', symbol: 'dim', nameRu: 'уменьшённый', intervals: [0, 3, 6], degrees: [1, 3, 5], level: 5, family: 'minor', explain: 'минор с пониженной квинтой' },
  { id: 'aug', symbol: 'aug', nameRu: 'увеличенный', intervals: [0, 4, 8], degrees: [1, 3, 5], level: 5, family: 'major', explain: 'мажор с повышенной квинтой' },
  { id: 'add9', symbol: 'add9', nameRu: 'add9', intervals: [0, 4, 7, 14], degrees: [1, 3, 5, 9], level: 5, family: 'major', explain: 'мажор + нона (секунда октавой выше)' },
  { id: 'six', symbol: '6', nameRu: 'с секстой (6)', intervals: [0, 4, 7, 9], degrees: [1, 3, 5, 6], level: 5, family: 'major', explain: 'мажор + секста' },
  { id: 'min6', symbol: 'm6', nameRu: 'минорный с секстой (m6)', intervals: [0, 3, 7, 9], degrees: [1, 3, 5, 6], level: 5, family: 'minor', explain: 'минор + секста' },
  { id: 'm7b5', symbol: 'm7♭5', nameRu: 'полууменьшённый (m7♭5)', intervals: [0, 3, 6, 10], degrees: [1, 3, 5, 7], level: 5, family: 'minor', explain: 'dim + малая септима' },
  { id: 'dim7', symbol: 'dim7', nameRu: 'уменьшённый 7 (dim7)', intervals: [0, 3, 6, 9], degrees: [1, 3, 5, 7], level: 5, family: 'minor', explain: 'dim + уменьшённая септима' },
  { id: 'dom9', symbol: '9', nameRu: 'нонаккорд (9)', intervals: [0, 4, 7, 10, 14], degrees: [1, 3, 5, 7, 9], level: 6, family: 'major', explain: '7 + нона' },
  { id: 'maj9', symbol: 'maj9', nameRu: 'maj9', intervals: [0, 4, 7, 11, 14], degrees: [1, 3, 5, 7, 9], level: 6, family: 'major', explain: 'maj7 + нона' },
  { id: 'min9', symbol: 'm9', nameRu: 'm9', intervals: [0, 3, 7, 10, 14], degrees: [1, 3, 5, 7, 9], level: 6, family: 'minor', explain: 'm7 + нона' },
  { id: 'dom11', symbol: '11', nameRu: '11', intervals: [0, 7, 10, 14, 17], degrees: [1, 5, 7, 9, 11], level: 6, family: 'major', explain: '9 без терции + ундецима' },
  { id: 'dom13', symbol: '13', nameRu: '13', intervals: [0, 4, 10, 14, 21], degrees: [1, 3, 7, 9, 13], level: 6, family: 'major', explain: '7 без квинты + нона + терцдецима' },
  { id: '7sus4', symbol: '7sus4', nameRu: '7sus4', intervals: [0, 5, 7, 10], degrees: [1, 4, 5, 7], level: 6, family: 'major', explain: 'sus4 + малая септима' },
]

const TYPE_BY_ID = new Map(CHORD_TYPES.map((t) => [t.id, t]))

export function chordType(id: ChordTypeId): ChordType {
  const type = TYPE_BY_ID.get(id)
  if (!type) throw new Error(`unknown chord type ${id}`)
  return type
}

export interface ChordSpec {
  root: Pc
  type: ChordTypeId
  inversion: number
}

export interface ChordVoicing {
  spec: ChordSpec
  notes: Midi[]
  pcs: Pc[]
  bassPc: Pc
  names: NoteName[]
  rootName: NoteName
  symbol: string
  slash: string | null
}

export function rootName(root: Pc, type: ChordTypeId): NoteName {
  return chordType(type).family === 'minor' ? MINOR_ROOTS[root] : MAJOR_ROOTS[root]
}

export function buildChord(spec: ChordSpec, style: NotationStyle = 'latin', baseOctave = 4): ChordVoicing {
  const type = chordType(spec.type)
  const root = rootName(spec.root, spec.type)
  const rootMidi = 12 * (baseOctave + 1) + spec.root
  let notes = type.intervals.map((i) => rootMidi + i)
  let names = type.intervals.map((i, k) => (k === 0 ? root : spellDegree(root, type.degrees[k], i)))
  for (let k = 0; k < spec.inversion; k++) {
    notes = [...notes.slice(1), notes[0] + 12]
    names = [...names.slice(1), names[0]]
  }
  const pcs: Pc[] = []
  for (const n of notes) if (!pcs.includes(pc(n))) pcs.push(pc(n))
  const symbol = formatNote(root, style) + type.symbol
  const slash = spec.inversion > 0 ? `${symbol}/${formatNote(names[0], style)}` : null
  return { spec, notes, pcs, bassPc: pc(notes[0]), names, rootName: root, symbol, slash }
}

export function chordSymbol(spec: ChordSpec, style: NotationStyle = 'latin'): string {
  const v = buildChord(spec, style)
  return v.slash ?? v.symbol
}

export function inversionsOf(type: ChordTypeId): number {
  const t = chordType(type)
  if (t.level === 6 || t.id === 'add9') return 1
  return t.intervals.length
}

const INVERSION_LABELS = ['основной вид', 'первое обращение', 'второе обращение', 'третье обращение']

export function inversionLabel(n: number): string {
  return INVERSION_LABELS[n] ?? `обращение ${n}`
}

export type CardId = string

export function cardId(spec: ChordSpec): CardId {
  return `${spec.root}:${spec.type}:${spec.inversion}`
}

export function parseCardId(id: CardId): ChordSpec {
  const [root, type, inversion] = id.split(':')
  return { root: Number(root), type: type as ChordTypeId, inversion: Number(inversion) }
}
