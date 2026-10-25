import { useRef, useState, type ChangeEvent } from 'react'
import { Button } from '../components/Button'
import { navigateTo } from '../router'
import { generateToken, linkForToken } from '../state/remote'
import { dayKey, exportProgress, importProgress, type Settings as SettingsModel } from '../state/progress'
import { useProgress } from '../state/store'
import './today.css'

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" className="setting-row" role="switch" aria-checked={value} onClick={() => onChange(!value)}>
      <span>{label}</span>
      <span className={`switch ${value ? 'is-on' : ''}`} aria-hidden="true">
        <i />
      </span>
    </button>
  )
}

function Stepper({ value, min, max, step = 1, onChange, label }: { value: number; min: number; max: number; step?: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="setting-row">
      <span>{label}</span>
      <span className="stepper">
        <button type="button" aria-label="Меньше" onClick={() => onChange(Math.max(min, value - step))} disabled={value <= min}>
          −
        </button>
        <b>{value}</b>
        <button type="button" aria-label="Больше" onClick={() => onChange(Math.min(max, value + step))} disabled={value >= max}>
          +
        </button>
      </span>
    </div>
  )
}

function timeAgo(at: number): string {
  const min = Math.round((Date.now() - at) / 60000)
  if (min < 1) return 'только что'
  if (min < 60) return `${min} мин назад`
  return new Date(at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

export function Settings() {
  const { progress, dispatch, sync } = useProgress()
  const [token, setToken] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const s = progress.settings
  const set = (patch: Partial<SettingsModel>) => dispatch({ type: 'settings', patch })
  const [message, setMessage] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const textArea = useRef<HTMLTextAreaElement>(null)

  const exportFile = () => {
    setText(exportProgress(progress))
    setMessage('Прогресс в поле ниже: скопируй его или сохрани файл')
    const blob = new Blob([exportProgress(progress)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `piano-chords-${dayKey(Date.now())}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const importFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const imported = importProgress(await file.text())
      dispatch({ type: 'import', progress: imported })
      setMessage('Прогресс загружен')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Не удалось прочитать файл')
    }
  }

  const importText = () => {
    try {
      dispatch({ type: 'import', progress: importProgress(text) })
      setMessage('Прогресс загружен')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Не удалось прочитать текст')
    }
  }

  const copy = () => {
    navigator.clipboard
      .writeText(text)
      .then(() => setMessage('Скопировано'))
      .catch(() => {
        textArea.current?.select()
        setMessage('Выдели текст и скопируй вручную')
      })
  }

  const connectSync = async (value: string) => {
    setConnecting(true)
    setSyncMessage(null)
    try {
      await sync.connect(value)
      setToken('')
      setSyncMessage('Готово: прогресс теперь привязан к токену')
    } catch (err) {
      setSyncMessage(err instanceof Error ? err.message : 'Не удалось подключить')
    } finally {
      setConnecting(false)
    }
  }

  const pageUrl = `${window.location.origin}${window.location.pathname}`
  const shareLink = sync.config ? linkForToken(pageUrl, sync.config.token) : ''

  const copyText = (value: string, done: string) => {
    navigator.clipboard
      .writeText(value)
      .then(() => setSyncMessage(done))
      .catch(() => setSyncMessage('Не удалось скопировать, выдели текст вручную'))
  }

  const statusText =
    sync.status.state === 'syncing'
      ? 'Синхронизирую…'
      : sync.status.state === 'ok'
        ? `Синхронизировано ${timeAgo(sync.status.at)}`
        : sync.status.state === 'error'
          ? sync.status.message
          : ''

  const reset = () => {
    dispatch({ type: 'reset' })
    setConfirmReset(false)
    setMessage('Прогресс сброшен')
  }

  return (
    <section className="screen stack">
      <div className="row">
        <Button variant="ghost" onClick={() => navigateTo({ name: 'today' })}>
          ← Сегодня
        </Button>
      </div>
      <h1 className="h1">Настройки</h1>

      <div className="card">
        <h2 className="h2 setting-title">Обозначения</h2>
        <div className="setting-row">
          <span>Нота си</span>
          <span className="seg">
            <button type="button" className={s.notation === 'latin' ? 'is-active' : ''} onClick={() => set({ notation: 'latin' })}>
              B
            </button>
            <button type="button" className={s.notation === 'german' ? 'is-active' : ''} onClick={() => set({ notation: 'german' })}>
              H
            </button>
          </span>
        </div>
        <Toggle label="Подсказка «до ре ми»" value={s.syllables} onChange={(v) => set({ syllables: v })} />
      </div>

      <div className="card">
        <h2 className="h2 setting-title">Занятия</h2>
        <Stepper label="Новых аккордов в день" value={s.newPerDay} min={1} max={10} onChange={(v) => set({ newPerDay: v })} />
        <Stepper label="Повторений за сессию" value={s.maxReviews} min={5} max={50} step={5} onChange={(v) => set({ maxReviews: v })} />
        <Toggle label="Проверять автоматически" value={s.autoCheck} onChange={(v) => set({ autoCheck: v })} />
      </div>

      <div className="card">
        <h2 className="h2 setting-title">Звук</h2>
        <div className="setting-row">
          <span>Громкость</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={s.volume}
            aria-label="Громкость"
            onChange={(e) => set({ volume: Number(e.target.value) })}
          />
        </div>
        <p className="muted small">
          Звук рояля: сэмплы из набора tonejs-instruments (CC-BY 3.0), укороченные для быстрой загрузки.
        </p>
      </div>

      <div className="card stack">
        <h2 className="h2 setting-title">Синхронизация</h2>
        {sync.config ? (
          <>
            <p className="muted small">Прогресс привязан к токену и общий для всех устройств, где он введён.</p>
            <div className="setting-row">
              <span>Токен</span>
              <code className="code">{sync.config.token}</code>
            </div>
            <p className="muted small">Ссылка для другого устройства: открой её там, и прогресс станет общим.</p>
            <code className="code code--block">{shareLink}</code>
            <div className="row row--wrap">
              <Button variant="primary" onClick={() => copyText(shareLink, 'Ссылка скопирована')}>
                Скопировать ссылку
              </Button>
              <Button onClick={() => copyText(sync.config!.token, 'Токен скопирован')}>Скопировать токен</Button>
            </div>
            <p className={`small ${sync.status.state === 'error' ? 'feedback--bad' : 'muted'}`}>{statusText || '\u00a0'}</p>
            <div className="row row--wrap">
              <Button onClick={() => void sync.syncNow()}>Синхронизировать сейчас</Button>
              <Button variant="ghost" onClick={sync.disconnect}>
                Отключить
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="muted small">
              Чтобы заниматься с телефона и компьютера с одним прогрессом, нужен токен. Создай его один раз здесь, а на другом устройстве открой ссылку с ним. Другой токен даст отдельный прогресс.
            </p>
            <Button variant="primary" size="lg" block onClick={() => void connectSync(generateToken())} disabled={connecting}>
              {connecting ? 'Подключаю…' : 'Создать токен'}
            </Button>
            <p className="muted small">Уже есть токен? Вставь его:</p>
            <input
              id="sync-token"
              className="search"
              type="text"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder="например, k7m2-x9qa-4pzt"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              aria-label="Токен"
            />
            <Button onClick={() => void connectSync(token)} disabled={!token.trim() || connecting}>
              Подключить
            </Button>
          </>
        )}
        {syncMessage && <p className="muted small">{syncMessage}</p>}
      </div>

      <div className="card stack">
        <h2 className="h2 setting-title">Данные</h2>
        <p className="muted small">Прогресс хранится только на этом устройстве. Экспорт можно перенести на другое: файлом или текстом.</p>
        <div className="row row--wrap">
          <Button onClick={exportFile}>Экспорт</Button>
          <Button onClick={copy} disabled={!text}>
            Скопировать
          </Button>
          <Button onClick={() => fileInput.current?.click()}>Из файла</Button>
          <Button onClick={importText} disabled={!text}>
            Загрузить из текста
          </Button>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={(e) => void importFile(e)} />
        </div>
        <textarea
          ref={textArea}
          id="progress-json"
          className="json-area"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Сюда можно вставить сохранённый прогресс"
          aria-label="Прогресс в виде текста"
        />
        {message && <p className="muted small">{message}</p>}
        {confirmReset ? (
          <div className="row row--wrap">
            <Button variant="danger" onClick={reset}>
              Да, сбросить всё
            </Button>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              Отмена
            </Button>
          </div>
        ) : (
          <Button variant="danger" onClick={() => setConfirmReset(true)}>
            Сбросить прогресс
          </Button>
        )}
      </div>
    </section>
  )
}
