import { pcsEqual } from '../theory/check'
import type { ChordVoicing } from '../theory/chords'
import { pc, type Midi } from '../theory/notes'

export interface PlayedNote {
  midi: Midi
  timeMs: number
}

export interface BarResult {
  hit: boolean
  offsetMs: number | null
}

export interface DrillResult {
  hits: number
  bars: number
  avgOffsetMs: number | null
}

/** Did the notes played during a bar spell the target chord, and how far from the nearest beat did they start? */
export function evaluateBar(notes: PlayedNote[], target: ChordVoicing, barStartMs: number, beatMs: number): BarResult {
  if (notes.length === 0) return { hit: false, offsetMs: null }
  const hit = pcsEqual(
    notes.map((n) => pc(n.midi)),
    target.pcs,
  )
  const first = Math.min(...notes.map((n) => n.timeMs))
  const rel = first - barStartMs
  const nearestBeat = Math.round(rel / beatMs) * beatMs
  return { hit, offsetMs: Math.round(rel - nearestBeat) }
}

export function summarize(results: BarResult[]): DrillResult {
  const hits = results.filter((r) => r.hit)
  const offsets = hits.map((r) => Math.abs(r.offsetMs ?? 0))
  const avgOffsetMs = offsets.length ? Math.round(offsets.reduce((a, b) => a + b, 0) / offsets.length) : null
  return { hits: hits.length, bars: results.length, avgOffsetMs }
}
