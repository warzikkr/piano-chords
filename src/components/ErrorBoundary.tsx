import { Component, type ReactNode } from 'react'
import { Button } from './Button'

interface State {
  failed: boolean
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: unknown): void {
    console.error(error)
  }

  private home = () => {
    window.location.hash = '#today'
    this.setState({ failed: false })
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <section className="screen stack">
        <h1 className="h1">Что-то сломалось</h1>
        <p className="muted">Экран не смог открыться. Прогресс цел: он сохраняется после каждого ответа.</p>
        <Button variant="primary" size="lg" onClick={this.home}>
          На сегодня
        </Button>
      </section>
    )
  }
}
