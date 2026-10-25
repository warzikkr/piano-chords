// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { QuizTask } from './QuizTask'

afterEach(cleanup)

const question = { q: 'Квинта вверх от C это…', options: ['F', 'G', 'A'], answer: 1, explain: 'Семь полутонов от C приводят к G.' }

test('a wrong pick shows the right answer and the explanation, then continues as wrong', () => {
  const onDone = vi.fn()
  const { getByText, container } = render(<QuizTask question={question} onDone={onDone} />)
  expect(getByText('Квинта вверх от C это…')).toBeTruthy()
  fireEvent.click(getByText('F'))
  expect(getByText('F').className).toContain('is-wrong')
  expect(getByText('G').className).toContain('is-correct')
  expect(getByText('Семь полутонов от C приводят к G.')).toBeTruthy()
  expect(container.querySelectorAll('.options button:disabled')).toHaveLength(3)
  fireEvent.click(getByText('Дальше'))
  expect(onDone).toHaveBeenCalledWith(false)
})

test('a right pick continues as correct', () => {
  const onDone = vi.fn()
  const { getByText } = render(<QuizTask question={question} onDone={onDone} />)
  fireEvent.click(getByText('G'))
  expect(getByText('Верно')).toBeTruthy()
  fireEvent.click(getByText('Дальше'))
  expect(onDone).toHaveBeenCalledWith(true)
})
