import { expect, test } from 'vitest'
import { planRequeue } from './requeue'
import type { SessionItem } from './session'

const card = (id: string, task: 'build' | 'spell' = 'build'): SessionItem => ({ kind: 'card', id, task, isNew: false })
const tail: SessionItem[] = [
  { kind: 'quiz', topicId: 'triads', question: 0 },
  { kind: 'progression', progressionId: 'pop', keyRoot: 0 },
]

test('a first miss brings the chord back a few cards later and again at the end', () => {
  const items = [card('0:maj:0'), card('7:maj:0'), card('9:min:0'), card('5:maj:0'), card('2:min:0'), ...tail]
  const next = planRequeue(items, 0, '0:maj:0', 0)
  const ids = next.map((i) => (i.kind === 'card' ? i.id : i.kind))
  expect(ids).toEqual(['0:maj:0', '7:maj:0', '9:min:0', '5:maj:0', '0:maj:0', '2:min:0', '0:maj:0', 'quiz', 'progression'])
  const copies = next.filter((i, idx) => idx > 0 && i.kind === 'card' && i.id === '0:maj:0')
  expect(copies).toHaveLength(2)
  expect(copies.every((i) => i.kind === 'card' && i.task === 'build' && i.retry)).toBe(true)
})

test('a second miss adds one more copy at the end, a third adds nothing', () => {
  const items = [card('0:maj:0'), card('7:maj:0'), ...tail]
  const once = planRequeue(items, 0, '0:maj:0', 1)
  expect(once.filter((i) => i.kind === 'card' && i.id === '0:maj:0')).toHaveLength(2)
  expect(once[once.length - 3]).toMatchObject({ kind: 'card', id: '0:maj:0' })
  expect(planRequeue(items, 0, '0:maj:0', 2)).toEqual(items)
})

test('near copy lands at the end of the cards when few cards remain', () => {
  const items = [card('0:maj:0'), card('7:maj:0'), ...tail]
  const next = planRequeue(items, 0, '0:maj:0', 0)
  const ids = next.map((i) => (i.kind === 'card' ? i.id : i.kind))
  expect(ids).toEqual(['0:maj:0', '7:maj:0', '0:maj:0', 'quiz', 'progression'])
})
