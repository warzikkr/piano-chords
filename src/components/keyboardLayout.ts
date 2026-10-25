import { isWhitePc, pc, type Midi } from '../theory/notes'

export interface KeyboardLayout {
  whites: { midi: Midi; index: number }[]
  blacks: { midi: Midi; leftWhites: number }[]
}

export function keyboardLayout(lowMidi: Midi, octaves: number): KeyboardLayout {
  const whites: KeyboardLayout['whites'] = []
  const blacks: KeyboardLayout['blacks'] = []
  for (let midi = lowMidi; midi < lowMidi + octaves * 12; midi++) {
    if (isWhitePc(pc(midi))) whites.push({ midi, index: whites.length })
    else blacks.push({ midi, leftWhites: whites.length })
  }
  return { whites, blacks }
}
