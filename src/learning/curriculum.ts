import { cardId, chordType, type CardId, type ChordTypeId, type Level } from '../theory/chords'
import type { Pc } from '../theory/notes'

export type { CardId }

export interface CurriculumEntry {
  id: CardId
  level: Level
}

export interface LevelInfo {
  level: Level
  title: string
  blurb: string
}

export const LEVELS: LevelInfo[] = [
  { level: 1, title: 'Белые клавиши', blurb: 'Формулы мажора и минора, шесть аккордов без чёрных клавиш' },
  { level: 2, title: 'Все 24', blurb: 'Мажор и минор от каждой ноты, по форме руки' },
  { level: 3, title: 'Обращения', blurb: 'Те же ноты в другом порядке и плавные переходы' },
  { level: 4, title: 'Септаккорды', blurb: '7, maj7 и m7, прогрессия ii–V–I' },
  { level: 5, title: 'Краски', blurb: 'sus, dim, aug, add9, 6 и полууменьшённые' },
  { level: 6, title: 'Джаз', blurb: 'Нонаккорды и дальше' },
]

/** Roots of major-family chords in the order they are introduced. */
export const MAJOR_ORDER: Pc[] = [0, 7, 5, 2, 4, 9, 1, 3, 8, 10, 11, 6]
/** Roots of minor-family chords in the order they are introduced. */
export const MINOR_ORDER: Pc[] = [9, 2, 4, 0, 5, 7, 1, 6, 8, 10, 11, 3]

const id = (root: Pc, type: ChordTypeId, inversion = 0) => cardId({ root, type, inversion })

const LEVEL_1: CardId[] = [id(0, 'maj'), id(7, 'maj'), id(9, 'min'), id(5, 'maj'), id(2, 'min'), id(4, 'min')]

const LEVEL_2: CardId[] = [
  id(2, 'maj'), id(4, 'maj'), id(9, 'maj'),
  id(0, 'min'), id(5, 'min'), id(7, 'min'),
  id(1, 'maj'), id(3, 'maj'), id(8, 'maj'),
  id(1, 'min'), id(6, 'min'), id(8, 'min'),
  id(10, 'maj'), id(10, 'min'),
  id(11, 'maj'), id(11, 'min'),
  id(6, 'maj'), id(3, 'min'),
]

const TRIADS: CardId[] = [...LEVEL_1, ...LEVEL_2]

const LEVEL_3: CardId[] = TRIADS.flatMap((triad) => {
  const [root, type] = triad.split(':')
  return [id(Number(root), type as ChordTypeId, 1), id(Number(root), type as ChordTypeId, 2)]
})

function rootsFor(type: ChordTypeId): Pc[] {
  return chordType(type).family === 'minor' ? MINOR_ORDER : MAJOR_ORDER
}

function allRoots(type: ChordTypeId, except?: Pc): CardId[] {
  return rootsFor(type)
    .filter((r) => r !== except)
    .map((r) => id(r, type))
}

const LEVEL_4: CardId[] = [
  id(7, 'dom7'), id(0, 'maj7'), id(2, 'min7'),
  ...allRoots('dom7', 7),
  ...allRoots('maj7', 0),
  ...allRoots('min7', 2),
]

const LEVEL_5_TYPES: ChordTypeId[] = ['sus4', 'sus2', 'dim', 'aug', 'six', 'min6', 'add9', 'm7b5', 'dim7']
const LEVEL_6_TYPES: ChordTypeId[] = ['dom9', 'maj9', 'min9', '7sus4', 'dom11', 'dom13']

const LEVEL_5: CardId[] = LEVEL_5_TYPES.flatMap((t) => allRoots(t))
const LEVEL_6: CardId[] = LEVEL_6_TYPES.flatMap((t) => allRoots(t))

const BY_LEVEL: Record<Level, CardId[]> = { 1: LEVEL_1, 2: LEVEL_2, 3: LEVEL_3, 4: LEVEL_4, 5: LEVEL_5, 6: LEVEL_6 }

export const CURRICULUM: CurriculumEntry[] = ([1, 2, 3, 4, 5, 6] as Level[]).flatMap((level) =>
  BY_LEVEL[level].map((cardIdValue) => ({ id: cardIdValue, level })),
)

const INDEX = new Map(CURRICULUM.map((entry, i) => [entry.id, i]))

export function indexOf(cardIdValue: CardId): number {
  return INDEX.get(cardIdValue) ?? -1
}

export function levelOf(cardIdValue: CardId): Level {
  const i = indexOf(cardIdValue)
  if (i < 0) throw new Error(`card ${cardIdValue} is not in the curriculum`)
  return CURRICULUM[i].level
}

export function cardsOfLevel(level: Level): CardId[] {
  return BY_LEVEL[level]
}

export function levelInfo(level: Level): LevelInfo {
  return LEVELS[level - 1]
}

