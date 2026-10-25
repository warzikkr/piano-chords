import type { CardId } from '../theory/chords'
import type { SessionItem } from './session'

const NEAR_GAP = 4
export const MAX_RETRIES = 2

function tailStart(items: SessionItem[], from: number): number {
  const i = items.findIndex((it, idx) => idx > from && (it.kind === 'quiz' || it.kind === 'progression'))
  return i < 0 ? items.length : i
}

/**
 * After a miss at `atIndex`, bring the chord back: on the first miss a few cards
 * later and once more at the end of the cards; on the second miss once more at the
 * end; after that the session moves on (the scheduler brings it back tomorrow).
 */
export function planRequeue(items: SessionItem[], atIndex: number, id: CardId, attempt: number): SessionItem[] {
  if (attempt >= MAX_RETRIES) return items
  const copy = (): SessionItem => ({ kind: 'card', id, task: 'build', isNew: false, retry: true })
  const end = tailStart(items, atIndex)
  if (attempt === 1) return [...items.slice(0, end), copy(), ...items.slice(end)]
  const near = Math.min(atIndex + NEAR_GAP, end)
  if (near >= end) return [...items.slice(0, end), copy(), ...items.slice(end)]
  const withNear = [...items.slice(0, near), copy(), ...items.slice(near)]
  return [...withNear.slice(0, end + 1), copy(), ...withNear.slice(end + 1)]
}
