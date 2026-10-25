import { buildChord, inversionLabel, type ChordSpec } from '../theory/chords'
import type { NotationStyle } from '../theory/notes'

interface ChordTitleProps {
  spec: ChordSpec
  notation: NotationStyle
  size?: 'lg' | 'md'
  subtitle?: string
}

export function ChordTitle({ spec, notation, size = 'lg', subtitle }: ChordTitleProps) {
  const v = buildChord(spec, notation)
  const sub = subtitle ?? (spec.inversion > 0 ? inversionLabel(spec.inversion) : undefined)
  return (
    <div className={`chord-title chord-title--${size}`}>
      <div className="chord-title__symbol">{v.slash ?? v.symbol}</div>
      {sub && <div className="chord-title__sub">{sub}</div>}
    </div>
  )
}
