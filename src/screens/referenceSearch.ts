import { chordType, type ChordVoicing } from '../theory/chords'
import { MAJOR_ROOTS, MINOR_ROOTS, formatNote } from '../theory/notes'

/** Lower-case the query and turn typed accidentals (#, b after a letter) into the glyphs the app shows. */
export function normalizeQuery(q: string): string {
  return q
    .trim()
    .toLowerCase()
    .replace(/#/g, '♯')
    .replace(/([a-h])b/g, '$1♭')
}

/** A chord matches when the query is a part of its symbol under either spelling of its root. */
export function matchesQuery(v: ChordVoicing, q: string): boolean {
  if (q === '') return true
  const symbol = chordType(v.spec.type).symbol
  const spellings = [MAJOR_ROOTS[v.spec.root], MINOR_ROOTS[v.spec.root]]
  return spellings.some((root) => (formatNote(root) + symbol).toLowerCase().includes(q))
}
