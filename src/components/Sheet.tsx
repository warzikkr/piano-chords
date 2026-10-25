import type { ReactNode } from 'react'

interface SheetProps {
  open: boolean
  title?: string
  onClose: () => void
  children: ReactNode
}

export function Sheet({ open, title, onClose, children }: SheetProps) {
  if (!open) return null
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        {title && <h2 className="h2 sheet__title">{title}</h2>}
        {children}
      </div>
    </>
  )
}
