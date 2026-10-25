import type { Midi } from '../theory/notes'

/** Keyboard window (lowest C and number of octaves) that shows every given note. */
export function displayRange(notes: Midi[]): { lowMidi: Midi; octaves: number } {
  if (notes.length === 0) return { lowMidi: 60, octaves: 2 }
  const min = Math.min(...notes)
  const max = Math.max(...notes)
  const lowMidi = 12 * Math.floor(min / 12)
  const octaves = max >= lowMidi + 24 ? 3 : 2
  return { lowMidi, octaves }
}
