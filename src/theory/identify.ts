import { CHORD_TYPES, buildChord, inversionsOf, type ChordSpec } from './chords'
import { formatNote, midiName, pc, type Midi, type NotationStyle, type NoteName, type Pc } from './notes'

export interface ChordMatch {
  spec: ChordSpec
  symbol: string
  slash: string | null
  bassPc: Pc
}

export interface NearMatch {
  spec: ChordSpec
  symbol: string
  missing: NoteName[]
  extra: NoteName[]
}

export interface Identification {
  pcs: Pc[]
  matches: ChordMatch[]
  near: NearMatch[]
}

const NEAR_LIMIT = 3

/** Name the chord spelled by the pressed keys; when nothing fits, say which chords are one note away. */
export function identifyChord(midis: Midi[], style: NotationStyle = 'latin'): Identification {
  if (midis.length === 0) return { pcs: [], matches: [], near: [] }
  const pcs = [...new Set(midis.map(pc))].sort((a, b) => a - b)
  const pressed = new Set(pcs)
  const bassPc = pc(Math.min(...midis))
  const matches: ChordMatch[] = []
  const near: NearMatch[] = []

  CHORD_TYPES.forEach((type) => {
    for (let root = 0; root < 12; root++) {
      const v = buildChord({ root, type: type.id, inversion: 0 }, style)
      const chordSet = new Set(v.pcs)
      const missing = v.pcs.filter((p) => !pressed.has(p))
      const extra = pcs.filter((p) => !chordSet.has(p))
      if (missing.length === 0 && extra.length === 0) {
        const bassIndex = v.pcs.indexOf(bassPc)
        let spec: ChordSpec = { root, type: type.id, inversion: 0 }
        let slash: string | null = null
        if (bassIndex > 0) {
          if (bassIndex < inversionsOf(type.id)) {
            spec = { root, type: type.id, inversion: bassIndex }
            slash = buildChord(spec, style).slash
          } else {
            slash = `${v.symbol}/${formatNote(v.names[bassIndex], style)}`
          }
        }
        matches.push({ spec, symbol: v.symbol, slash, bassPc })
      } else if (pcs.length >= 2 && missing.length + extra.length === 1) {
        const preferFlats = v.names.some((n) => n.accidental < 0)
        near.push({
          spec: { root, type: type.id, inversion: 0 },
          symbol: v.symbol,
          missing: missing.map((p) => v.names[v.pcs.indexOf(p)]),
          extra: extra.map((p) => midiName(60 + p, preferFlats)),
        })
      }
    }
  })

  const typeRank = (spec: ChordSpec) => CHORD_TYPES.findIndex((t) => t.id === spec.type)
  matches.sort((a, b) => Number(a.spec.inversion > 0 || a.slash !== null) - Number(b.spec.inversion > 0 || b.slash !== null) || typeRank(a.spec) - typeRank(b.spec))
  const size = (spec: ChordSpec) => buildChord(spec).pcs.length
  near.sort((a, b) => size(a.spec) - size(b.spec) || typeRank(a.spec) - typeRank(b.spec) || a.spec.root - b.spec.root)
  return { pcs, matches, near: near.slice(0, NEAR_LIMIT) }
}

/** Short Russian description of what changes between two chords, for the chord lab. */
export function describeDifference(from: ChordSpec, to: ChordSpec, style: NotationStyle = 'latin'): string {
  if (from.root !== to.root) return 'другой корень'
  const a = buildChord(from, style)
  const b = buildChord(to, style)
  if (from.type === to.type) {
    if (from.inversion === to.inversion) return ''
    if (to.inversion === from.inversion + 1) return `${formatNote(a.names[0], style)} на октаву вверх`
    if (to.inversion === from.inversion - 1) return `${formatNote(b.names[0], style)} на октаву вниз`
    return 'другое обращение'
  }
  const removed = a.pcs.map((p, i) => ({ p, name: a.names[i] })).filter((x) => !b.pcs.includes(x.p))
  const added = b.pcs.map((p, i) => ({ p, name: b.names[i] })).filter((x) => !a.pcs.includes(x.p))
  const fmt = (xs: { name: NoteName }[]) => xs.map((x) => formatNote(x.name, style)).join(', ')
  if (removed.length === 1 && added.length === 1) return `${fmt(removed)} → ${fmt(added)}`
  const parts: string[] = []
  if (added.length) parts.push(`+ ${fmt(added)}`)
  if (removed.length) parts.push(`− ${fmt(removed)}`)
  return parts.join(', ')
}

const INTERVALS = [
  'унисон',
  'малая секунда',
  'большая секунда',
  'малая терция',
  'большая терция',
  'чистая кварта',
  'тритон',
  'чистая квинта',
  'малая секста',
  'большая секста',
  'малая септима',
  'большая септима',
  'октава',
  'малая нона',
  'большая нона',
  'малая децима',
  'большая децима',
  'ундецима',
]

/** Russian name of the interval between two keys (order does not matter). */
export function intervalName(a: Midi, b: Midi): string {
  const semis = Math.abs(a - b)
  if (semis < INTERVALS.length) return INTERVALS[semis]
  return `${semis} полутонов`
}
