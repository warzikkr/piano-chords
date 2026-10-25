import type { Piano } from '../../audio/sampler'
import type { AnswerResult } from '../../learning/scheduler'
import type { ChordSpec, ChordVoicing, Level } from '../../theory/chords'
import type { NotationStyle, NoteName } from '../../theory/notes'
import { formatNote, syllable } from '../../theory/notes'

export interface TaskProps {
  spec: ChordSpec
  voicing: ChordVoicing
  learnerLevel: Level
  notation: NotationStyle
  syllables: boolean
  autoCheck: boolean
  piano: Piano | null
  onDone: (result: AnswerResult, optionCount?: number) => void
}

export function noteLabel(n: NoteName, notation: NotationStyle, syllables: boolean): string {
  return syllables ? `${formatNote(n, notation)} (${syllable(n)})` : formatNote(n, notation)
}

export function notesLine(names: NoteName[], notation: NotationStyle, syllables: boolean): string {
  return names.map((n) => noteLabel(n, notation, syllables)).join(' · ')
}
