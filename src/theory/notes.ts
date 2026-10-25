export type Midi = number
export type Pc = number
export type Letter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'
export type NotationStyle = 'latin' | 'german'

export interface NoteName {
  letter: Letter
  accidental: number
}

export const LETTERS: Letter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

export const LETTER_PC: Record<Letter, Pc> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

const WHITE_LETTER_BY_PC: Partial<Record<Pc, Letter>> = { 0: 'C', 2: 'D', 4: 'E', 5: 'F', 7: 'G', 9: 'A', 11: 'B' }

const SYLLABLES: Record<Letter, string> = {
  C: 'до',
  D: 'ре',
  E: 'ми',
  F: 'фа',
  G: 'соль',
  A: 'ля',
  B: 'си',
}

export function mod12(n: number): Pc {
  return ((n % 12) + 12) % 12
}

export function pc(midi: Midi): Pc {
  return mod12(midi)
}

export function isWhitePc(p: Pc): boolean {
  return WHITE_LETTER_BY_PC[mod12(p)] !== undefined
}

export function noteNamePc(n: NoteName): Pc {
  return mod12(LETTER_PC[n.letter] + n.accidental)
}

function naturalName(p: Pc): NoteName {
  const letter = WHITE_LETTER_BY_PC[mod12(p)]
  if (!letter) throw new Error(`pitch class ${p} is not a white key`)
  return { letter, accidental: 0 }
}

/**
 * Spell the chord tone that sits `semitones` above `root` and is written on
 * scale degree `degree` (3 = third, 5 = fifth, 7 = seventh, 9 = ninth ...).
 * Double accidentals and accidentals that land on a white key are simplified
 * to the plain white-key name, which is what a beginner expects to read.
 */
export function spellDegree(root: NoteName, degree: number, semitones: number): NoteName {
  const letterIndex = (LETTERS.indexOf(root.letter) + degree - 1) % 7
  const letter = LETTERS[letterIndex]
  const targetPc = mod12(noteNamePc(root) + semitones)
  let accidental = mod12(targetPc - LETTER_PC[letter])
  if (accidental > 6) accidental -= 12

  if (accidental !== 0 && isWhitePc(targetPc)) return naturalName(targetPc)
  if (Math.abs(accidental) >= 2) {
    const sign = Math.sign(accidental)
    const neighbour = LETTERS[(letterIndex + sign + 7) % 7]
    return { letter: neighbour, accidental: sign }
  }
  return { letter, accidental }
}

const ACCIDENTAL_GLYPH: Record<number, string> = { [-2]: '𝄫', [-1]: '♭', 0: '', 1: '♯', 2: '𝄪' }

export function formatNote(n: NoteName, style: NotationStyle = 'latin'): string {
  if (style === 'german' && n.letter === 'B') {
    if (n.accidental === 0) return 'H'
    if (n.accidental === -1) return 'B'
    if (n.accidental > 0) return 'H' + ACCIDENTAL_GLYPH[n.accidental]
    return 'B' + ACCIDENTAL_GLYPH[n.accidental + 1]
  }
  return n.letter + (ACCIDENTAL_GLYPH[n.accidental] ?? '')
}

const ACCIDENTAL_WORD: Record<number, string> = {
  [-2]: '-дубль-бемоль',
  [-1]: '-бемоль',
  0: '',
  1: '-диез',
  2: '-дубль-диез',
}

export function syllable(n: NoteName): string {
  return SYLLABLES[n.letter] + (ACCIDENTAL_WORD[n.accidental] ?? '')
}

export function midiName(midi: Midi, preferFlats = false): NoteName {
  const p = pc(midi)
  if (isWhitePc(p)) return naturalName(p)
  return preferFlats
    ? { ...naturalName(mod12(p + 1)), accidental: -1 }
    : { ...naturalName(mod12(p - 1)), accidental: 1 }
}

function names(spec: string): NoteName[] {
  return spec.split(' ').map((token) => {
    const letter = token[0] as Letter
    const accidental = token.endsWith('b') ? -1 : token.endsWith('#') ? 1 : 0
    return { letter, accidental }
  })
}

/** Preferred spelling of each root (index = pitch class) for major-family chords. */
export const MAJOR_ROOTS: NoteName[] = names('C Db D Eb E F F# G Ab A Bb B')

/** Preferred spelling of each root (index = pitch class) for minor-family chords. */
export const MINOR_ROOTS: NoteName[] = names('C C# D Eb E F F# G G# A Bb B')
