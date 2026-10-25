import { chordType, type ChordSpec, type ChordTypeId } from './chords'
import { LETTERS, LETTER_PC, MAJOR_ROOTS, mod12, noteNamePc, type Letter, type NoteName, type Pc } from './notes'

const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11]

/** Strict spelling by scale degree: one letter per degree, accidentals as needed (no simplification). */
export function spellDegreeStrict(root: NoteName, degree: number, semitones: number): NoteName {
  const letter: Letter = LETTERS[(LETTERS.indexOf(root.letter) + degree - 1) % 7]
  let accidental = mod12(noteNamePc(root) + semitones - LETTER_PC[letter])
  if (accidental > 6) accidental -= 12
  return { letter, accidental }
}

function scaleFrom(tonic: NoteName, steps: number[]): NoteName[] {
  return steps.map((s, i) => (i === 0 ? tonic : spellDegreeStrict(tonic, i + 1, s)))
}

export function majorScale(tonic: NoteName): NoteName[] {
  return scaleFrom(tonic, MAJOR_STEPS)
}

export function naturalMinor(tonic: NoteName): NoteName[] {
  return scaleFrom(tonic, [0, 2, 3, 5, 7, 8, 10])
}

const SHARP_ORDER: Letter[] = ['F', 'C', 'G', 'D', 'A', 'E', 'B']
const FLAT_ORDER: Letter[] = ['B', 'E', 'A', 'D', 'G', 'C', 'F']

export interface KeySignature {
  sharps: number
  flats: number
  accidentals: NoteName[]
}

export function keySignature(tonic: NoteName): KeySignature {
  const scale = majorScale(tonic)
  const sharps = scale.filter((x) => x.accidental > 0)
  const flats = scale.filter((x) => x.accidental < 0)
  const order = sharps.length ? SHARP_ORDER : FLAT_ORDER
  const accidentals = [...(sharps.length ? sharps : flats)].sort((a, b) => order.indexOf(a.letter) - order.indexOf(b.letter))
  return { sharps: sharps.length, flats: flats.length, accidentals }
}

export interface KeyInfo {
  tonic: NoteName
  pc: Pc
  sharps: number
  flats: number
  accidentals: NoteName[]
  relativeMinor: NoteName
}

function keyInfo(tonic: NoteName): KeyInfo {
  const sig = keySignature(tonic)
  return { tonic, pc: noteNamePc(tonic), ...sig, relativeMinor: spellDegreeStrict(tonic, 6, 9) }
}

const nn = (letter: Letter, accidental = 0): NoteName => ({ letter, accidental })

/** The fifteen standard major keys: C, seven with sharps, seven with flats. */
export const MAJOR_KEYS: KeyInfo[] = [
  nn('C'),
  nn('G'), nn('D'), nn('A'), nn('E'), nn('B'), nn('F', 1), nn('C', 1),
  nn('F'), nn('B', -1), nn('E', -1), nn('A', -1), nn('D', -1), nn('G', -1), nn('C', -1),
].map(keyInfo)

/** Clockwise circle of fifths by pitch class, starting at C. */
export const CIRCLE: Pc[] = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5]

/** The usual spelling of a key for each pitch class (F♯ rather than G♭, D♭ rather than C♯). */
export function keyByPc(pc: Pc): KeyInfo {
  return keyInfo(MAJOR_ROOTS[mod12(pc)])
}

export type ModeId = 'ionian' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'aeolian' | 'locrian'

export interface Mode {
  id: ModeId
  name: string
  degree: number
  blurb: string
}

export const MODES: Mode[] = [
  { id: 'ionian', name: 'Ионийский (мажор)', degree: 1, blurb: 'обычный мажор' },
  { id: 'dorian', name: 'Дорийский', degree: 2, blurb: 'минор с поднятой шестой, джаз и фанк' },
  { id: 'phrygian', name: 'Фригийский', degree: 3, blurb: 'минор с пониженной второй, фламенко' },
  { id: 'lydian', name: 'Лидийский', degree: 4, blurb: 'мажор с поднятой четвёртой, мечтательный' },
  { id: 'mixolydian', name: 'Миксолидийский', degree: 5, blurb: 'мажор с пониженной седьмой, блюз и рок' },
  { id: 'aeolian', name: 'Эолийский (минор)', degree: 6, blurb: 'натуральный минор' },
  { id: 'locrian', name: 'Локрийский', degree: 7, blurb: 'уменьшённый, редкий' },
]

/** A mode is the parent major scale started from another degree; spelled from that parent key. */
export function modeScale(tonic: NoteName, mode: ModeId): NoteName[] {
  const m = MODES.find((x) => x.id === mode)!
  const parentPc = mod12(noteNamePc(tonic) - MAJOR_STEPS[m.degree - 1])
  const parent = majorScale(keyByPc(parentPc).tonic)
  const rotated = [...parent.slice(m.degree - 1), ...parent.slice(0, m.degree - 1)]
  return rotated[0].letter === tonic.letter ? rotated : scaleFrom(tonic, rotated.map((x) => mod12(noteNamePc(x) - noteNamePc(rotated[0]))))
}

const NUMERALS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']
const DIATONIC_TYPES: ChordTypeId[] = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim']

export function diatonicChords(tonicPc: Pc): { numeral: string; spec: ChordSpec }[] {
  return MAJOR_STEPS.map((s, i) => ({ numeral: NUMERALS[i], spec: { root: mod12(tonicPc + s), type: DIATONIC_TYPES[i], inversion: 0 } }))
}

const ACC: Record<number, string> = { [-2]: '𝄫', [-1]: '♭', 0: '', 1: '♯', 2: '𝄪' }

/** Chord formula as scale degrees, e.g. m7♭5 → 1 ♭3 ♭5 ♭7. */
export function degreeLabels(type: ChordTypeId): string[] {
  const t = chordType(type)
  return t.intervals.map((semis, i) => {
    const degree = t.degrees[i]
    const natural = MAJOR_STEPS[(degree - 1) % 7] + 12 * Math.floor((degree - 1) / 7)
    let diff = semis - natural
    if (diff > 6) diff -= 12
    if (diff < -6) diff += 12
    return `${ACC[diff] ?? ''}${degree}`
  })
}
