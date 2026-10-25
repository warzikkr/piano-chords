import { AudioProvider } from './audio/useAudio'
import { TabBar } from './components/TabBar'
import { useRoute, type TabName } from './router'
import { ChordDetail } from './screens/ChordDetail'
import { Map } from './screens/Map'
import { Progressions } from './screens/Progressions'
import { Reference } from './screens/Reference'
import { Session } from './screens/Session'
import { Settings } from './screens/Settings'
import { Today } from './screens/Today'
import { ProgressProvider } from './state/store'

function tabFor(name: string): TabName | null {
  if (name === 'today' || name === 'map' || name === 'progressions' || name === 'reference') return name
  if (name === 'settings') return 'today'
  if (name === 'chord') return 'reference'
  return null
}

function Screens() {
  const [route, navigate] = useRoute()
  const tab = tabFor(route.name)

  let screen
  switch (route.name) {
    case 'today':
      screen = <Today />
      break
    case 'map':
      screen = <Map />
      break
    case 'progressions':
      screen = <Progressions />
      break
    case 'reference':
      screen = <Reference />
      break
    case 'settings':
      screen = <Settings />
      break
    case 'chord':
      screen = <ChordDetail />
      break
    case 'session':
      screen = <Session practice={route.practice} extraNew={route.extraNew} />
      break
  }

  return (
    <div className="app">
      {screen}
      {tab && <TabBar current={tab} onSelect={(name) => navigate({ name })} />}
    </div>
  )
}

export function App() {
  return (
    <ProgressProvider>
      <AudioProvider>
        <Screens />
      </AudioProvider>
    </ProgressProvider>
  )
}
