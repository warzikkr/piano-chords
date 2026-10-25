// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { buildChord, type ChordSpec, type ChordTypeId } from '../../theory/chords'
import { BuildTask } from './BuildTask'
import { IntroTask } from './IntroTask'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const spec: ChordSpec = { root: 0, type: 'maj', inversion: 0 }
const base = {
  spec,
  voicing: buildChord(spec),
  knownTypes: ['maj', 'min'] as ChordTypeId[],
  notation: 'latin' as const,
  syllables: false,
  autoCheck: true,
  piano: null,
}

const key = (container: HTMLElement, midi: number) => container.querySelector(`[data-midi="${midi}"]`) as HTMLElement

test('intro shows the chord, its notes and formula, and continues on Дальше', () => {
  const onDone = vi.fn()
  const { container, getByText } = render(<IntroTask {...base} onDone={onDone} />)
  expect(container.querySelector('.chord-title__symbol')?.textContent).toBe('C')
  expect(getByText('C · E · G')).toBeTruthy()
  expect(getByText('4 + 3 полутона')).toBeTruthy()
  expect(key(container, 60).className).toContain('is-target')
  fireEvent.click(getByText('Дальше'))
  expect(onDone).toHaveBeenCalledTimes(1)
})

test('guided build highlights the keys, has no hint button, and lets you retry after a miss', () => {
  const onDone = vi.fn()
  const { container, queryByText, getByText } = render(<BuildTask {...base} guided onDone={onDone} />)
  expect(key(container, 60).className).toContain('is-hint')
  expect(key(container, 67).className).toContain('is-hint')
  expect(queryByText('Подсказка')).toBeNull()
  fireEvent.pointerDown(key(container, 60))
  fireEvent.pointerDown(key(container, 62))
  fireEvent.pointerDown(key(container, 67))
  expect(key(container, 62).className).toContain('is-wrong')
  fireEvent.click(getByText('Ещё раз'))
  expect(key(container, 62).className).not.toContain('is-wrong')
  expect(key(container, 60).className).toContain('is-hint')
  expect(onDone).not.toHaveBeenCalled()
})

test('guided build finishes without grading once the chord is right', () => {
  vi.useFakeTimers()
  const onDone = vi.fn()
  const { container } = render(<BuildTask {...base} guided onDone={onDone} />)
  fireEvent.pointerDown(key(container, 60))
  fireEvent.pointerDown(key(container, 64))
  fireEvent.pointerDown(key(container, 67))
  expect(key(container, 64).className).toContain('is-correct')
  vi.advanceTimersByTime(800)
  expect(onDone).toHaveBeenCalledTimes(1)
  vi.useRealTimers()
})
