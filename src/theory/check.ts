import type { ChordVoicing } from './chords'
import { pc, type Midi, type Pc } from './notes'

export interface BuildResult {
  correct: boolean
  wrong: Midi[]
  missing: Pc[]
  bassOk: boolean
}

export function pcsEqual(a: Pc[], b: Pc[]): boolean {
  const sa = new Set(a.map(pc))
  const sb = new Set(b.map(pc))
  if (sa.size !== sb.size) return false
  for (const x of sa) if (!sb.has(x)) return false
  return true
}

export function checkBuild(pressed: Midi[], voicing: ChordVoicing): BuildResult {
  const chordSet = new Set(voicing.pcs)
  const pressedSet = new Set(pressed.map(pc))
  const wrong = pressed.filter((m) => !chordSet.has(pc(m)))
  const missing = voicing.pcs.filter((p) => !pressedSet.has(p))
  const bassOk = pressed.length > 0 && pc(Math.min(...pressed)) === voicing.bassPc
  const correct = wrong.length === 0 && missing.length === 0 && bassOk
  return { correct, wrong, missing, bassOk }
}

export function checkSpell(selected: Pc[], voicing: ChordVoicing): boolean {
  return pcsEqual(selected, voicing.pcs)
}
