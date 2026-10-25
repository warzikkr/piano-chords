import type { AnswerResult } from '../../learning/scheduler'
import { checkBuild } from '../../theory/check'
import type { ChordVoicing } from '../../theory/chords'
import type { Midi } from '../../theory/notes'

export interface TaskState {
  selected: Midi[]
  phase: 'answering' | 'correct' | 'wrong'
  usedHint: boolean
  startedAt: number
}

export type TaskEvent =
  | { type: 'toggle'; midi: Midi; autoCheck?: ChordVoicing }
  | { type: 'hint' }
  | { type: 'check'; voicing: ChordVoicing }
  | { type: 'reset'; now: number }

export function initialTaskState(now: number): TaskState {
  return { selected: [], phase: 'answering', usedHint: false, startedAt: now }
}

export function taskReducer(state: TaskState, event: TaskEvent): TaskState {
  switch (event.type) {
    case 'toggle': {
      if (state.phase !== 'answering') return state
      const selected = state.selected.includes(event.midi)
        ? state.selected.filter((m) => m !== event.midi)
        : [...state.selected, event.midi]
      const next = { ...state, selected }
      if (event.autoCheck && selected.length === event.autoCheck.notes.length) {
        return taskReducer(next, { type: 'check', voicing: event.autoCheck })
      }
      return next
    }
    case 'hint':
      return { ...state, usedHint: true }
    case 'check':
      if (state.phase !== 'answering') return state
      return { ...state, phase: checkBuild(state.selected, event.voicing).correct ? 'correct' : 'wrong' }
    case 'reset':
      return initialTaskState(event.now)
  }
}

export function finishResult(state: TaskState, now: number): AnswerResult {
  return { correct: state.phase === 'correct', usedHint: state.usedHint, seconds: (now - state.startedAt) / 1000 }
}
