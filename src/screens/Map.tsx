import { cardsOfLevel, indexOf, LEVELS } from '../learning/curriculum'
import { mastery, MASTERY_LABELS } from '../learning/scheduler'
import { navigateTo } from '../router'
import { useProgress } from '../state/store'
import { CHORD_TYPES, cardId, inversionsOf, type ChordTypeId } from '../theory/chords'
import { MAJOR_ROOTS, formatNote } from '../theory/notes'
import './map.css'

const GROUPS: { title: string; types: ChordTypeId[] }[] = [
  { title: 'Уровни 1–3', types: ['maj', 'min'] },
  { title: '4 · Септаккорды', types: ['dom7', 'maj7', 'min7'] },
  { title: '5 · Краски', types: ['sus2', 'sus4', 'dim', 'aug', 'add9', 'six', 'min6', 'm7b5', 'dim7'] },
  { title: '6 · Джаз', types: ['dom9', 'maj9', 'min9', 'dom11', 'dom13', '7sus4'] },
]

const TYPES = GROUPS.flatMap((g) => g.types)

export function Map() {
  const { progress } = useProgress()
  const notation = progress.settings.notation
  const typeSymbol = (id: ChordTypeId) => CHORD_TYPES.find((t) => t.id === id)?.symbol || 'maj'
  const masteryOf = (id: string) => mastery(progress.cards[id])

  return (
    <section className="screen stack">
      <h1 className="h1">Карта</h1>

      <div className="card stack">
        {LEVELS.map((lvl) => {
          const cards = cardsOfLevel(lvl.level)
          const learned = cards.filter((id) => masteryOf(id) >= 2).length
          const introduced = cards.filter((id) => progress.introduced[id] !== undefined).length
          return (
            <div key={lvl.level} className="level-row">
              <div className="row row--between">
                <span>
                  {lvl.level}. {lvl.title}
                </span>
                <span className="muted small">
                  {learned}/{cards.length}
                </span>
              </div>
              <div className="level-bar">
                <i className="level-bar__intro" style={{ width: `${(introduced / cards.length) * 100}%` }} />
                <i className="level-bar__learned" style={{ width: `${(learned / cards.length) * 100}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="map-scroll">
        <div className="map-grid" style={{ gridTemplateColumns: `44px repeat(${TYPES.length}, 50px)` }}>
          <div className="map-corner" />
          {GROUPS.map((g) => (
            <div key={g.title} className="map-group" style={{ gridColumn: `span ${g.types.length}` }}>
              {g.title}
            </div>
          ))}
          <div className="map-corner" />
          {TYPES.map((t) => (
            <div key={t} className="map-head">
              {typeSymbol(t)}
            </div>
          ))}
          {MAJOR_ROOTS.map((rootName, root) => (
            <div key={root} className="map-row">
              <div className="map-root">{formatNote(rootName, notation)}</div>
              {TYPES.map((t) => {
                const id = cardId({ root, type: t, inversion: 0 })
                const introduced = progress.introduced[id] !== undefined
                const m = masteryOf(id)
                const inversions = Array.from({ length: inversionsOf(t) - 1 }, (_, i) => cardId({ root, type: t, inversion: i + 1 })).filter(
                  (inv) => indexOf(inv) >= 0,
                )
                return (
                  <button
                    key={t}
                    type="button"
                    className={`map-cell m-${m} ${introduced ? '' : 'is-locked'}`}
                    aria-label={`${formatNote(rootName, notation)}${typeSymbol(t)}: ${MASTERY_LABELS[m]}`}
                    onClick={() => navigateTo({ name: 'chord', id })}
                  >
                    <span>{typeSymbol(t)}</span>
                    {inversions.length > 0 && (
                      <span className="map-dots">
                        {inversions.map((inv) => (
                          <i key={inv} className={`m-${masteryOf(inv)} ${progress.introduced[inv] !== undefined ? '' : 'is-locked'}`} />
                        ))}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="legend">
        {MASTERY_LABELS.map((label, i) => (
          <span key={label} className="legend__item">
            <i className={`m-${i}`} /> {label}
          </span>
        ))}
      </div>
    </section>
  )
}
