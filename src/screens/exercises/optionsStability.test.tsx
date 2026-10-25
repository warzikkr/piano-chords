// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { buildChord, type ChordSpec, type ChordTypeId } from '../../theory/chords'
import { EarTask } from './EarTask'
import { RecognizeTask } from './RecognizeTask'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function labels(container: HTMLElement): string[] {
  return [...container.querySelectorAll('.options button')].map((b) => b.textContent ?? '')
}

function props() {
  const spec: ChordSpec = { root: 0, type: 'maj', inversion: 0 }
  return {
    spec,
    voicing: buildChord(spec),
    knownTypes: ['maj', 'min', 'dom7', 'maj7', 'min7', 'dim', 'aug', 'sus4'] as ChordTypeId[],
    notation: 'latin' as const,
    syllables: false,
    autoCheck: true,
    piano: null,
    onDone: () => undefined,
  }
}

function driftingRandom() {
  let n = 0
  vi.spyOn(Math, 'random').mockImplementation(() => {
    n = (n + 7) % 23
    return n / 23
  })
}

test('recognize options stay fixed when the task re-renders with a new spec object', () => {
  driftingRandom()
  const { container, rerender } = render(<RecognizeTask {...props()} />)
  const first = labels(container)
  expect(first).toHaveLength(4)
  rerender(<RecognizeTask {...props()} />)
  rerender(<RecognizeTask {...props()} />)
  expect(labels(container)).toEqual(first)
})

test('ear options stay fixed when the task re-renders with a new spec object', () => {
  driftingRandom()
  const { container, rerender } = render(<EarTask {...props()} />)
  const first = labels(container)
  expect(first).toHaveLength(6)
  rerender(<EarTask {...props()} />)
  rerender(<EarTask {...props()} />)
  expect(labels(container)).toEqual(first)
})
