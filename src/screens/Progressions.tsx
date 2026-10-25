import { useState } from 'react'
import { useAudio } from '../audio/useAudio'
import { ProgressionPlayer } from '../components/ProgressionPlayer'
import { useProgress } from '../state/store'
import { chordSymbol } from '../theory/chords'
import type { Pc } from '../theory/notes'
import { KEYS, PROGRESSIONS, keyIsRecommended, keyName, progressionById, progressionChords } from '../theory/progressions'
import './map.css'

export function Progressions() {
  const { progress } = useProgress()
  const { ensure } = useAudio()
  const notation = progress.settings.notation
  const [progressionId, setProgressionId] = useState('pop')
  const [keyRoot, setKeyRoot] = useState<Pc>(0)
  const [bpm, setBpm] = useState(80)
  const [mode, setMode] = useState<'listen' | 'play'>('listen')
  const has = (id: string) => progress.introduced[id] !== undefined
  const progression = progressionById(progressionId)
  const recommended = keyIsRecommended(progression, keyRoot, has)
  const chords = progressionChords(progression, keyRoot)
  const rounds = mode === 'play' ? (progression.numerals.length >= 8 ? 1 : 2) : null

  return (
    <section className="screen stack" onPointerDownCapture={() => void ensure()}>
      <h1 className="h1">Прогрессии</h1>
      <div className="chips">
        {PROGRESSIONS.map((p) => (
          <button key={p.id} type="button" className={`chip ${p.id === progressionId ? 'is-active' : ''}`} onClick={() => setProgressionId(p.id)}>
            {p.title}
          </button>
        ))}
      </div>
      <div className="chips">
        {KEYS.map((k) => {
          const rec = keyIsRecommended(progression, k, has)
          return (
            <button
              key={k}
              type="button"
              className={`chip ${k === keyRoot ? 'is-active' : ''} ${rec ? '' : 'is-dim'}`}
              title={rec ? '' : 'ещё не изучено'}
              onClick={() => setKeyRoot(k)}
            >
              {keyName(k, notation)}
            </button>
          )
        })}
      </div>
      <div className="row row--between row--wrap">
        <span className="seg">
          <button type="button" className={mode === 'listen' ? 'is-active' : ''} onClick={() => setMode('listen')}>
            Слушать
          </button>
          <button type="button" className={mode === 'play' ? 'is-active' : ''} onClick={() => setMode('play')}>
            Играть
          </button>
        </span>
        <label className="row small muted">
          Темп
          <input type="range" min={50} max={140} step={5} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} aria-label="Темп" />
          <b>{bpm}</b>
        </label>
      </div>
      <p className="muted small">
        {chords.map((c) => chordSymbol(c, notation)).join(' – ')}
        {!recommended && '. Часть этих аккордов ты ещё не проходил: слушать можно, а построить их подскажет справочник.'}
      </p>
      <ProgressionPlayer
        key={`${progressionId}-${keyRoot}-${mode}-${bpm}`}
        progressionId={progressionId}
        keyRoot={keyRoot}
        mode={mode}
        bpm={bpm}
        rounds={rounds}
        notation={notation}
      />
    </section>
  )
}
