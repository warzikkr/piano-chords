import { CHORD_TYPES, cardId, inversionsOf, type ChordSpec, type ChordTypeId, type Level } from '../theory/chords'
import { indexOf, levelOf } from './curriculum'

export type Rng = () => number

/** Chord types a learner is asked to tell apart by ear. */
export const EAR_TYPES: ChordTypeId[] = ['maj', 'min', 'dom7', 'maj7', 'min7', 'dim', 'aug', 'sus4']

export function shuffle<T>(items: T[], rng: Rng): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function pick<T>(items: T[], rng: Rng): T {
  return items[Math.min(items.length - 1, Math.floor(rng() * items.length))]
}

function cardLevel(spec: ChordSpec): Level {
  const id = cardId(spec)
  return indexOf(id) >= 0 ? levelOf(id) : 6
}

export function recognizeOptions(spec: ChordSpec, rng: Rng): ChordSpec[] {
  const level = cardLevel(spec)
  const types = CHORD_TYPES.filter((t) => t.level <= level).map((t) => t.id)
  const result: ChordSpec[] = [spec]
  const seen = new Set([cardId(spec)])
  const add = (s: ChordSpec) => {
    const id = cardId(s)
    if (seen.has(id)) return
    seen.add(id)
    result.push(s)
  }

  const otherTypes = types.filter((t) => t !== spec.type)
  if (otherTypes.length) {
    const type = pick(otherTypes, rng)
    add({ root: spec.root, type, inversion: Math.min(spec.inversion, inversionsOf(type) - 1) })
  }
  add({ root: (spec.root + 1 + Math.floor(rng() * 11)) % 12, type: spec.type, inversion: spec.inversion })
  if (level >= 3 && inversionsOf(spec.type) > 1) {
    const inversions = Array.from({ length: inversionsOf(spec.type) }, (_, i) => i).filter((i) => i !== spec.inversion)
    add({ root: spec.root, type: spec.type, inversion: pick(inversions, rng) })
  }
  let guard = 0
  while (result.length < 4 && guard++ < 200) {
    const type = pick(types, rng)
    const maxInversion = level >= 3 ? inversionsOf(type) : 1
    add({ root: Math.floor(rng() * 12), type, inversion: Math.floor(rng() * maxInversion) })
  }
  return shuffle(result, rng)
}

export function earChoices(level: Level): ChordTypeId[] {
  if (level <= 3) return ['maj', 'min']
  if (level === 4) return ['maj', 'min', 'dom7', 'maj7', 'min7']
  return [...EAR_TYPES]
}

export function earOptions(spec: ChordSpec, level: Level, rng: Rng): ChordTypeId[] {
  const others = shuffle(
    earChoices(level).filter((t) => t !== spec.type),
    rng,
  ).slice(0, 5)
  return shuffle([spec.type, ...others], rng)
}
