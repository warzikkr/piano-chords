// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

afterEach(() => vi.restoreAllMocks())

test('a crashing screen shows a message and a way back to Today', () => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  const Boom = () => {
    throw new Error('boom')
  }
  const { getByText } = render(
    <ErrorBoundary>
      <Boom />
    </ErrorBoundary>,
  )
  expect(getByText('Что-то сломалось')).toBeTruthy()
  expect(getByText('На сегодня')).toBeTruthy()
})
