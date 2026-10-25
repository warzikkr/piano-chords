import { useRef, useState, type ReactNode } from 'react'
import { useAudio } from '../audio/useAudio'
import { Button } from '../components/Button'
import { displayRange } from '../components/displayRange'
import { Keyboard, type KeyMark } from '../components/Keyboard'
import { useProgress } from '../state/store'
import { CHORD_TYPES, buildChord, chordSymbol, type ChordSpec } from '../theory/chords'
import { intervalName } from '../theory/identify'
import { CIRCLE, MAJOR_KEYS, MODES, degreeLabels, diatonicChords, keyByPc, majorScale, modeScale, type ModeId } from '../theory/keys'
import { MAJOR_ROOTS, formatNote, midiName, noteNamePc, type Midi, type NoteName, type NotationStyle, type Pc } from '../theory/notes'
import { PROGRESSIONS, progressionChords } from '../theory/progressions'
import { plural } from '../ui/text'
import './cheatsheet.css'

function scaleMidis(notes: NoteName[]): Midi[] {
  const tonic = 60 + noteNamePc(notes[0])
  let last = tonic
  return notes.map((n, i) => {
    if (i === 0) return tonic
    let m = 60 + noteNamePc(n)
    while (m <= last) m += 12
    last = m
    return m
  })
}

function marksFor(midis: Midi[], mark: KeyMark = 'target'): Partial<Record<Midi, KeyMark>> {
  const out: Partial<Record<Midi, KeyMark>> = {}
  for (const m of midis) out[m] = mark
  return out
}

function signatureText(sharps: number, flats: number, accidentals: NoteName[], notation: NotationStyle): string {
  if (!sharps && !flats) return 'без знаков'
  const n = sharps || flats
  const word = sharps ? plural(n, 'диез', 'диеза', 'диезов') : plural(n, 'бемоль', 'бемоля', 'бемолей')
  return `${n} ${word}: ${accidentals.map((a) => formatNote(a, notation)).join(' ')}`
}

type SectionId = 'circle' | 'keys' | 'modes' | 'chords' | 'intervals' | 'inversions'

const SECTIONS: { id: SectionId; title: string }[] = [
  { id: 'circle', title: 'Круг квинт' },
  { id: 'keys', title: 'Тональности' },
  { id: 'modes', title: 'Лады' },
  { id: 'chords', title: 'Формулы аккордов' },
  { id: 'intervals', title: 'Интервалы' },
  { id: 'inversions', title: 'Обращения' },
]

interface SheetSectionProps {
  id: SectionId
  title: string
  open: boolean
  onToggle: (open: boolean) => void
  sectionRef: (el: HTMLElement | null) => void
  children: ReactNode
}

/** A collapsible block of the cheat sheet; native details/summary works on every phone. */
function SheetSection({ id, title, open, onToggle, sectionRef, children }: SheetSectionProps) {
  return (
    <details className="sheet__section" id={`sheet-${id}`} open={open} ref={sectionRef} onToggle={(e) => onToggle(e.currentTarget.open)}>
      <summary className="sheet__summary">
        <span>{title}</span>
        <span className="sheet__chevron" aria-hidden="true">
          {open ? '−' : '+'}
        </span>
      </summary>
      <div className="sheet__body stack">{children}</div>
    </details>
  )
}

export function CheatSheet() {
  const { progress } = useProgress()
  const [open, setOpen] = useState<Set<SectionId>>(() => new Set<SectionId>(['circle']))
  const sectionRefs = useRef<Partial<Record<SectionId, HTMLElement | null>>>({})

  const toggle = (id: SectionId, value: boolean) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (value) next.add(id)
      else next.delete(id)
      return next
    })
  const jump = (id: SectionId) => {
    toggle(id, true)
    window.setTimeout(() => sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const Section = ({ id, children }: { id: SectionId; children: ReactNode }) => (
    <SheetSection
      id={id}
      title={SECTIONS.find((x) => x.id === id)?.title ?? ''}
      open={open.has(id)}
      onToggle={(value) => toggle(id, value)}
      sectionRef={(el) => {
        sectionRefs.current[id] = el
      }}
    >
      {children}
    </SheetSection>
  )

  const { ensure } = useAudio()
  const notation = progress.settings.notation
  const [keyPc, setKeyPc] = useState<Pc>(0)
  const [shownChord, setShownChord] = useState<ChordSpec | null>(null)
  const [modeTonic, setModeTonic] = useState<Pc>(0)
  const [mode, setMode] = useState<ModeId>('ionian')

  const key = keyByPc(keyPc)
  const scale = majorScale(key.tonic)
  const scaleNotes = scaleMidis(scale)
  const chords = diatonicChords(keyPc)
  const shownNotes = shownChord ? buildChord(shownChord).notes : scaleNotes
  const keyRange = displayRange(shownNotes)

  const modeNotes = modeScale(MAJOR_ROOTS[modeTonic], mode)
  const modeMidis = scaleMidis(modeNotes)
  const modeRange = displayRange(modeMidis)

  const playChord = (spec: ChordSpec) => {
    setShownChord(spec)
    void ensure().then((p) => p.playChord(buildChord(spec).notes))
  }
  const playScale = (midis: Midi[]) => void ensure().then((p) => p.playArpeggio([...midis, midis[0] + 12], 0.28, 0.6))

  const R = 150
  const outer = 114
  const inner = 73
  const pos = (i: number, r: number) => {
    const a = (i * 30 - 90) * (Math.PI / 180)
    return { x: R + r * Math.cos(a), y: R + r * Math.sin(a) }
  }

  return (
    <div className="stack sheet">
      <div className="chips">
        {SECTIONS.map((sec) => (
          <button key={sec.id} type="button" className={`chip ${open.has(sec.id) ? 'is-active' : ''}`} onClick={() => jump(sec.id)}>
            {sec.title}
          </button>
        ))}
      </div>
      <Section id="circle">
        <p className="muted small">Снаружи мажорные тональности, внутри их параллельные миноры. Соседи по кругу отличаются одним знаком. Нажми на тональность.</p>
        <svg className="circle" viewBox={`0 0 ${2 * R} ${2 * R}`} width={2 * R} height={2 * R} role="group" aria-label="Круг квинт">
          <circle cx={R} cy={R} r={outer + 24} className="circle__ring" />
          <circle cx={R} cy={R} r={(outer + inner) / 2 + 2} className="circle__ring" />
          {CIRCLE.map((pc, i) => {
            const k = keyByPc(pc)
            const o = pos(i, outer)
            const n = pos(i, inner)
            const active = pc === keyPc
            return (
              <g key={pc} className={`circle__key ${active ? 'is-active' : ''}`} onClick={() => { setKeyPc(pc); setShownChord(null) }}>
                <circle cx={o.x} cy={o.y} r={20} className="circle__major" />
                <text x={o.x} y={o.y + 1} className="circle__label">{formatNote(k.tonic, notation)}</text>
                <circle cx={n.x} cy={n.y} r={15} className="circle__minor" />
                <text x={n.x} y={n.y + 1} className="circle__label circle__label--minor">{formatNote(k.relativeMinor, notation)}m</text>
              </g>
            )
          })}
          <text x={R} y={R - 6} className="circle__center">{formatNote(key.tonic, notation)}</text>
          <text x={R} y={R + 14} className="circle__center circle__center--sub">{key.sharps ? `${key.sharps}♯` : key.flats ? `${key.flats}♭` : '0'}</text>
        </svg>
        <div className="card stack">
          <div className="row row--between">
            <b>{formatNote(key.tonic, notation)} мажор</b>
            <span className="muted small">{signatureText(key.sharps, key.flats, key.accidentals, notation)}</span>
          </div>
          <div className="row row--between">
            <span className="muted">Гамма</span>
            <span>{scale.map((x) => formatNote(x, notation)).join(' ')}</span>
          </div>
          <div className="row row--between">
            <span className="muted">Параллельный минор</span>
            <span>{formatNote(key.relativeMinor, notation)}m</span>
          </div>
          <div className="chips chips--wrap">
            {chords.map((c) => (
              <button key={c.numeral} type="button" className={`chip ${shownChord && chordSymbol(shownChord) === chordSymbol(c.spec) ? 'is-active' : ''}`} onClick={() => playChord(c.spec)}>
                <span className="chip__numeral">{c.numeral}</span> {chordSymbol(c.spec, notation)}
              </button>
            ))}
          </div>
          <Keyboard mode="display" marks={marksFor(shownNotes)} lowMidi={keyRange.lowMidi} octaves={keyRange.octaves} notation={notation} />
          <div className="row row--wrap">
            <Button onClick={() => { setShownChord(null); playScale(scaleNotes) }}>Сыграть гамму</Button>
          </div>
          <p className="muted small">
            Популярные обороты здесь:{' '}
            {PROGRESSIONS.slice(0, 4)
              .map((p) => `${p.title}: ${progressionChords(p, keyPc).map((s) => chordSymbol(s, notation)).join(' ')}`)
              .join(' · ')}
          </p>
        </div>
      </Section>

      <Section id="keys">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Мажор</th>
                <th>Знаки</th>
                <th>Минор</th>
              </tr>
            </thead>
            <tbody>
              {MAJOR_KEYS.map((k) => (
                <tr key={formatNote(k.tonic)}>
                  <td>{formatNote(k.tonic, notation)}</td>
                  <td>{signatureText(k.sharps, k.flats, k.accidentals, notation)}</td>
                  <td>{formatNote(k.relativeMinor, notation)}m</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="modes">
        <p className="muted small">Лад это та же мажорная гамма, начатая с другой ступени. Выбери тонику и лад.</p>
        <div className="chips">
          {MAJOR_ROOTS.map((n, pc) => (
            <button key={pc} type="button" className={`chip ${modeTonic === pc ? 'is-active' : ''}`} onClick={() => setModeTonic(pc)}>
              {formatNote(n, notation)}
            </button>
          ))}
        </div>
        <div className="chips">
          {MODES.map((m) => (
            <button key={m.id} type="button" className={`chip ${mode === m.id ? 'is-active' : ''}`} onClick={() => setMode(m.id)}>
              {m.name}
            </button>
          ))}
        </div>
        <div className="card stack">
          <div className="row row--between">
            <b>{modeNotes.map((x) => formatNote(x, notation)).join(' ')}</b>
            <span className="muted small">{MODES.find((m) => m.id === mode)?.blurb}</span>
          </div>
          <Keyboard mode="display" marks={marksFor(modeMidis)} lowMidi={modeRange.lowMidi} octaves={modeRange.octaves} notation={notation} />
          <div className="row">
            <Button onClick={() => playScale(modeMidis)}>Послушать</Button>
          </div>
        </div>
      </Section>

      <Section id="chords">
        <p className="muted small">Ступени считаются от мажорной гаммы корня. Пример от C.</p>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Аккорд</th>
                <th>Ступени</th>
                <th>Полутоны</th>
                <th>От C</th>
              </tr>
            </thead>
            <tbody>
              {CHORD_TYPES.map((t) => {
                const v = buildChord({ root: 0, type: t.id, inversion: 0 }, notation)
                return (
                  <tr key={t.id} onClick={() => playChord({ root: 0, type: t.id, inversion: 0 })}>
                    <td>
                      <b>C{t.symbol}</b> <span className="muted small">{t.nameRu}</span>
                    </td>
                    <td>{degreeLabels(t.id).join(' ')}</td>
                    <td className="muted">{t.intervals.join(' ')}</td>
                    <td>{v.names.map((n) => formatNote(n, notation)).join(' ')}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="intervals">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Полутоны</th>
                <th>Название</th>
                <th>От C</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((s) => (
                <tr key={s} onClick={() => void ensure().then((p) => p.playArpeggio([60, 60 + s], 0.5, 1))}>
                  <td>{s}</td>
                  <td>{intervalName(60, 60 + s)}</td>
                  <td>C → {formatNote(midiName(60 + s, s === 1 || s === 3 || s === 8 || s === 10), notation)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="inversions">
        <p className="muted small">Те же ноты, нижняя поднимается на октаву. Нажми, чтобы послушать.</p>
        <div className="inversions">
          {[0, 1, 2].map((inv) => {
            const spec: ChordSpec = { root: 0, type: 'maj', inversion: inv }
            const v = buildChord(spec, notation)
            const r = displayRange(v.notes)
            return (
              <button key={inv} type="button" className="inversions__item" onClick={() => void ensure().then((p) => p.playChord(v.notes))}>
                <b>{v.slash ?? v.symbol}</b>
                <span className="muted small">{v.names.map((n) => formatNote(n, notation)).join(' ')}</span>
                <Keyboard mode="display" marks={marksFor(v.notes)} lowMidi={r.lowMidi} octaves={r.octaves} notation={notation} labels="none" />
              </button>
            )
          })}
        </div>
      </Section>
    </div>
  )
}
