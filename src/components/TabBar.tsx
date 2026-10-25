import type { TabName } from '../router'

const TABS: { name: TabName; label: string; icon: string }[] = [
  { name: 'today', label: 'Сегодня', icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-2 5.5 6 3.5-6 3.5v-7Z' },
  { name: 'map', label: 'Карта', icon: 'M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z' },
  { name: 'progressions', label: 'Прогрессии', icon: 'M3 12h3l3-7 4 14 3-7h5' },
  { name: 'reference', label: 'Справочник', icon: 'M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3V4Zm0 0v16M8 8h6M8 12h6' },
]

interface TabBarProps {
  current: TabName | null
  onSelect: (name: TabName) => void
}

export function TabBar({ current, onSelect }: TabBarProps) {
  return (
    <nav className="tabbar" aria-label="Разделы">
      {TABS.map((tab) => (
        <button
          key={tab.name}
          type="button"
          className={`tabbar__tab ${current === tab.name ? 'is-active' : ''}`}
          onClick={() => onSelect(tab.name)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={tab.icon} />
          </svg>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
