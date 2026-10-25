import { navigateTo, type ReferenceView } from '../router'
import { ChordFinder } from './ChordFinder'
import { ChordLab } from './ChordLab'
import { ReferenceList } from './ReferenceList'
import './map.css'

const VIEWS: { id: ReferenceView; label: string }[] = [
  { id: 'lab', label: 'Лаборатория' },
  { id: 'finder', label: 'Определитель' },
  { id: 'list', label: 'Список' },
]

export function Reference({ view }: { view: ReferenceView }) {
  return (
    <section className="screen stack">
      <h1 className="h1">Справочник</h1>
      <div className="seg seg--block">
        {VIEWS.map((v) => (
          <button key={v.id} type="button" className={view === v.id ? 'is-active' : ''} onClick={() => navigateTo({ name: 'reference', view: v.id })}>
            {v.label}
          </button>
        ))}
      </div>
      {view === 'lab' && <ChordLab />}
      {view === 'finder' && <ChordFinder />}
      {view === 'list' && <ReferenceList />}
    </section>
  )
}
