import { CHORD_TYPES, inversionsOf, rootName, type ChordSpec, type ChordTypeId } from '../theory/chords'
import { formatNote, type NotationStyle } from '../theory/notes'

interface ChordPickerProps {
  spec: ChordSpec
  notation: NotationStyle
  onChange: (spec: ChordSpec) => void
  showInversions?: boolean
}

const INVERSION_SHORT = ['осн.', '1-е', '2-е', '3-е']

/** Root, type and inversion chips used by the chord lab and the finder's check mode. */
export function ChordPicker({ spec, notation, onChange, showInversions = true }: ChordPickerProps) {
  const inversions = inversionsOf(spec.type)
  return (
    <div className="stack picker">
      <div className="chips">
        {Array.from({ length: 12 }, (_, root) => (
          <button key={root} type="button" className={`chip ${spec.root === root ? 'is-active' : ''}`} onClick={() => onChange({ ...spec, root })}>
            {formatNote(rootName(root, spec.type), notation)}
          </button>
        ))}
      </div>
      <div className="chips">
        {CHORD_TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`chip ${spec.type === t.id ? 'is-active' : ''}`}
            title={t.nameRu}
            onClick={() => onChange({ ...spec, type: t.id as ChordTypeId, inversion: Math.min(spec.inversion, inversionsOf(t.id) - 1) })}
          >
            {t.symbol || 'maj'}
          </button>
        ))}
      </div>
      {showInversions && inversions > 1 && (
        <div className="seg seg--block">
          {Array.from({ length: inversions }, (_, i) => (
            <button key={i} type="button" className={spec.inversion === i ? 'is-active' : ''} onClick={() => onChange({ ...spec, inversion: i })}>
              {INVERSION_SHORT[i]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
