import { useState } from 'react'
import { useAudio } from '../audio/useAudio'
import { Button } from '../components/Button'
import { ChordTitle } from '../components/ChordTitle'
import { displayRange } from '../components/displayRange'
import { Keyboard, type KeyMark } from '../components/Keyboard'
import { indexOf, levelOf } from '../learning/curriculum'
import { mastery, MASTERY_LABELS } from '../learning/scheduler'
import { navigateTo } from '../router'
import { useProgress } from '../state/store'
import { buildChord, cardId, chordType, inversionLabel, inversionsOf, parseCardId, type CardId } from '../theory/chords'
import type { Midi } from '../theory/notes'
import { notesLine } from './exercises/types'
import './map.css'

const INVERSION_SHORT = ['осн.', '1-е', '2-е', '3-е']

export function ChordDetail({ id }: { id: CardId }) {
  const { progress } = useProgress()
  const { ensure, loading } = useAudio()
  const { notation, syllables } = progress.settings
  const base = parseCardId(id)
  const [inversion, setInversion] = useState(base.inversion)
  const spec = { ...base, inversion }
  const type = chordType(spec.type)
  const voicing = buildChord(spec, notation)
  const range = displayRange(voicing.notes)
  const cid = cardId(spec)
  const inCurriculum = indexOf(cid) >= 0
  const introduced = progress.introduced[cid] !== undefined
  const m = mastery(progress.cards[cid])
  const marks: Partial<Record<Midi, KeyMark>> = {}
  for (const n of voicing.notes) marks[n] = 'target'

  const play = (mode: 'chord' | 'arpeggio') => {
    void ensure().then((piano) => (mode === 'chord' ? piano.playChord(voicing.notes) : piano.playArpeggio(voicing.notes)))
  }

  const back = () => {
    if (window.history.length > 1) window.history.back()
    else navigateTo({ name: 'reference' })
  }

  return (
    <section className="screen stack">
      <div className="row">
        <Button variant="ghost" onClick={back}>
          ← Назад
        </Button>
      </div>
      <ChordTitle spec={spec} notation={notation} subtitle={inversion > 0 ? `${type.nameRu} · ${inversionLabel(inversion)}` : type.nameRu} />
      <Keyboard mode="display" marks={marks} lowMidi={range.lowMidi} octaves={range.octaves} notation={notation} preferFlats={voicing.names.some((n) => n.accidental < 0)} />
      <div className="row" style={{ justifyContent: 'center' }}>
        <Button variant="primary" onClick={() => play('chord')} disabled={loading}>
          {loading ? 'Загружаю…' : 'Аккорд'}
        </Button>
        <Button onClick={() => play('arpeggio')} disabled={loading}>
          Арпеджио
        </Button>
      </div>
      {inversionsOf(spec.type) > 1 && (
        <div className="seg seg--block">
          {Array.from({ length: inversionsOf(spec.type) }, (_, i) => (
            <button key={i} type="button" className={inversion === i ? 'is-active' : ''} onClick={() => setInversion(i)}>
              {INVERSION_SHORT[i]}
            </button>
          ))}
        </div>
      )}
      <div className="card stack">
        <div className="row row--between">
          <span className="muted">Ноты</span>
          <b>{notesLine(voicing.names, notation, syllables)}</b>
        </div>
        <div className="row row--between">
          <span className="muted">Формула</span>
          <span>{type.explain}</span>
        </div>
        <div className="row row--between">
          <span className="muted">Полутоны</span>
          <span>{type.intervals.join(' · ')}</span>
        </div>
        <div className="row row--between">
          <span className="muted">Статус</span>
          <span className={`ref-item__mastery m-${m}`}>{introduced ? MASTERY_LABELS[m] : inCurriculum ? `уровень ${levelOf(cid)}, ещё впереди` : 'вне программы'}</span>
        </div>
      </div>
      {inCurriculum && (
        <Button
          variant="primary"
          size="lg"
          block
          onClick={() => {
            void ensure()
            navigateTo({ name: 'session', practice: cid })
          }}
        >
          Потренировать
        </Button>
      )}
    </section>
  )
}
