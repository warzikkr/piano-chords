export type BeatCallback = (beat: number, bar: number, when: number) => void

export interface Metronome {
  start(bpm: number, beatsPerBar: number, onBeat: BeatCallback): void
  stop(): void
  readonly running: boolean
}

export interface Timers {
  setInterval: (fn: () => void, ms: number) => unknown
  clearInterval: (id: unknown) => void
}

const LOOKAHEAD_MS = 25
const HORIZON = 0.12

/** Beat times t = nextBeatTime + k * secondsPerBeat that fall before now + horizon. */
export function scheduleBeats(now: number, nextBeatTime: number, horizon: number, secondsPerBeat: number): number[] {
  const out: number[] = []
  for (let t = nextBeatTime; t < now + horizon; t += secondsPerBeat) out.push(t)
  return out
}

const defaultTimers: Timers = {
  setInterval: (fn, ms) => window.setInterval(fn, ms),
  clearInterval: (id) => window.clearInterval(id as number),
}

export function createMetronome(ctx: AudioContext, timers: Timers = defaultTimers): Metronome {
  let timer: unknown = null
  let running = false
  let startTime = 0
  let nextIndex = 0
  let secondsPerBeat = 0.5
  let beatsPerBar = 4
  let onBeat: BeatCallback = () => undefined

  function click(when: number, accent: boolean): void {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = accent ? 1500 : 1000
    osc.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(accent ? 0.5 : 0.3, when)
    gain.gain.exponentialRampToValueAtTime(0.001, when + 0.04)
    osc.start(when)
    osc.stop(when + 0.05)
  }

  function tick(): void {
    const now = ctx.currentTime
    while (startTime + nextIndex * secondsPerBeat < now + HORIZON) {
      const when = startTime + nextIndex * secondsPerBeat
      const beat = nextIndex % beatsPerBar
      const bar = Math.floor(nextIndex / beatsPerBar)
      click(when, beat === 0)
      onBeat(beat, bar, when)
      nextIndex++
    }
  }

  function stop(): void {
    if (timer !== null) timers.clearInterval(timer)
    timer = null
    running = false
  }

  return {
    get running() {
      return running
    },
    start(bpm, bars, cb) {
      stop()
      secondsPerBeat = 60 / bpm
      beatsPerBar = bars
      onBeat = cb
      startTime = ctx.currentTime + 0.05
      nextIndex = 0
      running = true
      timer = timers.setInterval(tick, LOOKAHEAD_MS)
    },
    stop,
  }
}
