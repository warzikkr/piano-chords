import { useState } from 'react'
import { mastery, MASTERY_LABELS } from '../learning/scheduler'
import { navigateTo } from '../router'
import { useProgress } from '../state/store'
import { CHORD_TYPES, buildChord, cardId, type ChordTypeId } from '../theory/chords'
import { MAJOR_ROOTS, formatNote, type Pc } from '../theory/notes'
import { notesLine } from './exercises/types'
import { matchesQuery, normalizeQuery } from './referenceSearch'
import './map.css'

export function ReferenceList() {
  const { progress } = useProgress()
  const { notation, syllables } = progress.settings
  const [root, setRoot] = useState<Pc | null>(0)
  const [type, setType] = useState<ChordTypeId | null>(null)
  const [query, setQuery] = useState('')

  const roots: Pc[] = root === null ? MAJOR_ROOTS.map((_, i) => i) : [root]
  const types = type === null ? CHORD_TYPES : CHORD_TYPES.filter((t) => t.id === type)
  const q = normalizeQuery(query)
  const items = roots
    .flatMap((r) => types.map((t) => buildChord({ root: r, type: t.id, inversion: 0 }, notation)))
    .filter((v) => matchesQuery(v, q))

  return (
    <div className="stack">
      <input
        className="search"
        type="search"
        placeholder="Например, F♯m7 или Db"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Поиск аккорда"
      />
      <div className="chips">
        <button type="button" className={`chip ${root === null ? 'is-active' : ''}`} onClick={() => setRoot(null)}>
          Все
        </button>
        {MAJOR_ROOTS.map((n, i) => (
          <button key={i} type="button" className={`chip ${root === i ? 'is-active' : ''}`} onClick={() => setRoot(i)}>
            {formatNote(n, notation)}
          </button>
        ))}
      </div>
      <div className="chips">
        <button type="button" className={`chip ${type === null ? 'is-active' : ''}`} onClick={() => setType(null)}>
          Все
        </button>
        {CHORD_TYPES.map((t) => (
          <button key={t.id} type="button" className={`chip ${type === t.id ? 'is-active' : ''}`} onClick={() => setType(t.id)}>
            {t.symbol || 'maj'}
          </button>
        ))}
      </div>
      <div className="ref-list">
        {items.map((v) => {
          const id = cardId(v.spec)
          const m = mastery(progress.cards[id])
          return (
            <button key={id} type="button" className="ref-item" onClick={() => navigateTo({ name: 'chord', id })}>
              <span className="ref-item__symbol">{v.symbol}</span>
              <span className="ref-item__notes muted">{notesLine(v.names, notation, syllables)}</span>
              <span className={`ref-item__mastery m-${m}`}>{MASTERY_LABELS[m]}</span>
            </button>
          )
        })}
        {items.length === 0 && <p className="muted">Ничего не нашлось</p>}
      </div>
    </div>
  )
}
