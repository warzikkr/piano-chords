import { useState } from 'react'
import { useAudio } from '../audio/useAudio'
import { Button } from '../components/Button'
import { Keyboard, type KeyMark } from '../components/Keyboard'
import { useProgress } from '../state/store'
import { checkBuild } from '../theory/check'
import { buildChord, chordSymbol, type ChordSpec } from '../theory/chords'
import { identifyChord, intervalName } from '../theory/identify'
import { formatNote, pc, type Midi } from '../theory/notes'
import { ChordPicker } from './ChordPicker'
import { notesLine } from './exercises/types'
import { plural } from '../ui/text'

type Mode = 'free' | 'check'

/** Press any keys: the app names the chord, or checks the keys against a chord you picked. */
export function ChordFinder() {
  const { progress } = useProgress()
  const { ensure, piano } = useAudio()
  const { notation, syllables } = progress.settings
  const [mode, setMode] = useState<Mode>('free')
  const [selected, setSelected] = useState<Midi[]>([])
  const [target, setTarget] = useState<ChordSpec>({ root: 0, type: 'maj', inversion: 0 })
  const [showTarget, setShowTarget] = useState(false)

  const toggle = (m: Midi) => setSelected((s) => (s.includes(m) ? s.filter((x) => x !== m) : [...s, m].sort((a, b) => a - b)))
  const clear = () => setSelected([])
  const playSelected = () => void ensure().then((p) => p.playChord(selected))

  const voicing = buildChord(target, notation)
  const ident = identifyChord(selected, notation)
  const result = mode === 'check' && selected.length > 0 ? checkBuild(selected, voicing) : null

  const marks: Partial<Record<Midi, KeyMark>> = {}
  if (mode === 'check') {
    if (showTarget) for (const m of voicing.notes) marks[m] = 'hint'
    if (result) {
      const chordSet = new Set(voicing.pcs)
      for (const m of selected) marks[m] = result.correct ? 'correct' : chordSet.has(pc(m)) ? 'correct' : 'wrong'
    }
  }

  let verdict: string | null = null
  if (result) {
    if (result.correct) verdict = `Да, это ${chordSymbol(target, notation)}`
    else if (result.wrong.length === 0 && result.missing.length === 0) verdict = `Ноты верные, но внизу должна быть ${formatNote(voicing.names[0], notation)}`
    else {
      const parts: string[] = []
      if (result.missing.length) parts.push(`не хватает ${result.missing.map((p) => formatNote(voicing.names[voicing.pcs.indexOf(p)], notation)).join(', ')}`)
      if (result.wrong.length) parts.push(`лишняя ${[...new Set(result.wrong.map((m) => formatNote(buildChord({ root: pc(m), type: 'maj', inversion: 0 }, notation).rootName, notation)))].join(', ')}`)
      verdict = `Пока не ${chordSymbol(target, notation)}: ${parts.join('; ')}`
    }
  }

  return (
    <div className="stack">
      <div className="seg seg--block">
        <button type="button" className={mode === 'free' ? 'is-active' : ''} onClick={() => setMode('free')}>
          Что это?
        </button>
        <button type="button" className={mode === 'check' ? 'is-active' : ''} onClick={() => setMode('check')}>
          Проверить
        </button>
      </div>

      {mode === 'free' ? (
        <div className="finder__answer">
          {selected.length < 2 && <p className="muted">Нажми две клавиши, и я назову интервал; три и больше, и я назову аккорд.</p>}
          {selected.length === 2 && (
            <p className="lab__diff">
              Интервал: {intervalName(selected[0], selected[1])} ({Math.abs(selected[1] - selected[0])}{' '}
              {plural(Math.abs(selected[1] - selected[0]), 'полутон', 'полутона', 'полутонов')})
            </p>
          )}
          {selected.length >= 2 && ident.matches.length > 0 && (
            <>
              <div className="finder__main">{ident.matches[0].slash ?? ident.matches[0].symbol}</div>
              {ident.matches.length > 1 && <p className="muted small">То же самое: {ident.matches.slice(1, 4).map((m) => m.slash ?? m.symbol).join(', ')}</p>}
            </>
          )}
          {selected.length >= 2 && ident.matches.length === 0 && (
            <>
              <div className="finder__main finder__main--none">Такого аккорда нет</div>
              {ident.near.map((n) => (
                <p key={n.symbol} className="muted small">
                  Похоже на <b>{n.symbol}</b>
                  {n.missing.length > 0 && `: не хватает ${n.missing.map((x) => formatNote(x, notation)).join(', ')}`}
                  {n.extra.length > 0 && `: лишняя ${n.extra.map((x) => formatNote(x, notation)).join(', ')}`}
                </p>
              ))}
            </>
          )}
        </div>
      ) : (
        <>
          <ChordPicker spec={target} notation={notation} onChange={(s) => setTarget(s)} />
          <div className="finder__answer">
            <p className="muted small">
              Собери {chordSymbol(target, notation)} ({notesLine(voicing.names, notation, syllables)}) и смотри ответ.
            </p>
            {verdict && <p className={`feedback ${result?.correct ? 'feedback--ok' : 'feedback--bad'}`}>{verdict}</p>}
          </div>
        </>
      )}

      <Keyboard mode="toggle" selected={selected} marks={marks} notation={notation} shortcuts onToggle={toggle} onNoteOn={(m) => piano?.noteOn(m)} onNoteOff={(m) => piano?.noteOff(m)} />

      <div className="row row--wrap" style={{ justifyContent: 'center' }}>
        <Button variant="primary" onClick={playSelected} disabled={selected.length === 0}>
          Послушать
        </Button>
        <Button onClick={clear} disabled={selected.length === 0}>
          Сбросить
        </Button>
        {mode === 'check' && (
          <Button variant="ghost" onClick={() => setShowTarget(!showTarget)}>
            {showTarget ? 'Скрыть подсказку' : 'Показать клавиши'}
          </Button>
        )}
      </div>
    </div>
  )
}
