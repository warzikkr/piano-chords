import type { CardId } from '../theory/chords'
import { parseCardId } from '../theory/chords'
import type { Progress } from '../state/progress'
import type { Rng } from './distractors'
import { mastery } from './scheduler'

export const ROUNDS_PER_GAME = 10

/** Root-position chords the learner knows; before anything is known, chords merely introduced. */
export function earGamePool(p: Progress): CardId[] {
  const rootPosition = (id: CardId) => parseCardId(id).inversion === 0
  const known = Object.entries(p.cards)
    .filter(([id, card]) => rootPosition(id) && mastery(card) >= 2)
    .map(([id]) => id)
  if (known.length > 0) return known
  return Object.keys(p.introduced).filter(rootPosition)
}

export function pickRound(pool: CardId[], rng: Rng, previous?: CardId): CardId {
  const candidates = pool.length > 1 && previous ? pool.filter((id) => id !== previous) : pool
  return candidates[Math.min(candidates.length - 1, Math.floor(rng() * candidates.length))]
}
