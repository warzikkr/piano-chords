import type { Midi } from '../theory/notes'

const SAMPLE_NAMES = ['C', 'Cs', 'D', 'Ds', 'E', 'F', 'Fs', 'G', 'Gs', 'A', 'As', 'B']
export const SAMPLE_LOW: Midi = 36
export const SAMPLE_HIGH: Midi = 96

function sampleName(midi: Midi): string {
  return SAMPLE_NAMES[midi % 12] + (Math.floor(midi / 12) - 1)
}

export function sampleFor(midi: Midi): { file: string; rate: number } {
  const clamped = Math.max(SAMPLE_LOW, Math.min(SAMPLE_HIGH, midi))
  return { file: sampleName(clamped), rate: 2 ** ((midi - clamped) / 12) }
}

export interface Piano {
  load(onProgress?: (done: number, total: number) => void): Promise<void>
  readonly ready: boolean
  readonly failed: boolean
  noteOn(midi: Midi, velocity?: number): void
  noteOff(midi: Midi): void
  playChord(midis: Midi[], seconds?: number): void
  playArpeggio(midis: Midi[], gap?: number, seconds?: number): void
  stopAll(): void
  setVolume(v: number): void
}

interface Voice {
  gain: GainNode
  sources: (AudioBufferSourceNode | OscillatorNode)[]
}

const RELEASE = 0.25
const POOL = 6

export function createPiano(ctx: AudioContext, baseUrl: string, fetchImpl: typeof fetch = fetch): Piano {
  const buffers = new Map<string, AudioBuffer>()
  const master = ctx.createGain()
  master.gain.value = 0.8
  master.connect(ctx.destination)
  const voices = new Map<Midi, Voice[]>()
  let loading: Promise<void> | null = null
  let ready = false
  let failed = false

  const names: string[] = []
  for (let m = SAMPLE_LOW; m <= SAMPLE_HIGH; m++) names.push(sampleName(m))

  async function fetchOne(name: string): Promise<boolean> {
    try {
      const res = await fetchImpl(`${baseUrl}${name}.mp3`)
      if (!res.ok) return false
      const buffer = await ctx.decodeAudioData(await res.arrayBuffer())
      buffers.set(name, buffer)
      return true
    } catch {
      return false
    }
  }

  function load(onProgress?: (done: number, total: number) => void): Promise<void> {
    if (loading) return loading
    loading = (async () => {
      const queue = [...names]
      let done = 0
      let ok = 0
      const worker = async () => {
        for (let name = queue.shift(); name !== undefined; name = queue.shift()) {
          if (await fetchOne(name)) ok++
          done++
          onProgress?.(done, names.length)
        }
      }
      await Promise.all(Array.from({ length: POOL }, worker))
      ready = ok >= names.length / 2
      failed = !ready
    })()
    return loading
  }

  function frequency(midi: Midi): number {
    return 440 * 2 ** ((midi - 69) / 12)
  }

  function trigger(midi: Midi, velocity: number, startAt: number, releaseAt?: number): void {
    const gain = ctx.createGain()
    gain.connect(master)
    const sources: Voice['sources'] = []
    const { file, rate } = sampleFor(midi)
    const buffer = buffers.get(file)
    if (buffer) {
      const src = ctx.createBufferSource()
      src.buffer = buffer
      src.playbackRate.value = rate
      src.connect(gain)
      gain.gain.setValueAtTime(velocity, startAt)
      src.start(startAt)
      sources.push(src)
    } else {
      const osc1 = ctx.createOscillator()
      osc1.type = 'triangle'
      osc1.frequency.value = frequency(midi)
      const osc2 = ctx.createOscillator()
      osc2.type = 'sine'
      osc2.frequency.value = frequency(midi) * 2
      const osc2Gain = ctx.createGain()
      osc2Gain.gain.value = 0.25
      osc1.connect(gain)
      osc2.connect(osc2Gain)
      osc2Gain.connect(gain)
      gain.gain.setValueAtTime(0.0001, startAt)
      gain.gain.linearRampToValueAtTime(velocity * 0.6, startAt + 0.01)
      gain.gain.exponentialRampToValueAtTime(velocity * 0.15, startAt + 1.2)
      osc1.start(startAt)
      osc2.start(startAt)
      sources.push(osc1, osc2)
    }
    const voice: Voice = { gain, sources }
    if (releaseAt !== undefined) {
      gain.gain.setTargetAtTime(0.0001, releaseAt, RELEASE / 4)
      for (const s of sources) s.stop(releaseAt + RELEASE + 0.1)
    } else {
      const list = voices.get(midi) ?? []
      list.push(voice)
      voices.set(midi, list)
      for (const s of sources) s.stop(startAt + 6)
    }
  }

  function release(voice: Voice, at: number): void {
    voice.gain.gain.cancelScheduledValues(at)
    voice.gain.gain.setTargetAtTime(0.0001, at, RELEASE / 4)
    for (const s of voice.sources) s.stop(at + RELEASE + 0.1)
  }

  return {
    get ready() {
      return ready
    },
    get failed() {
      return failed
    },
    load,
    noteOn(midi, velocity = 0.9) {
      trigger(midi, velocity, ctx.currentTime)
    },
    noteOff(midi) {
      const list = voices.get(midi)
      if (!list) return
      voices.delete(midi)
      for (const v of list) release(v, ctx.currentTime)
    },
    playChord(midis, seconds = 1.6) {
      const t = ctx.currentTime
      for (const m of midis) trigger(m, 0.85, t, t + seconds)
    },
    playArpeggio(midis, gap = 0.25, seconds = 1.2) {
      const t = ctx.currentTime
      midis.forEach((m, i) => trigger(m, 0.85, t + i * gap, t + i * gap + seconds))
    },
    stopAll() {
      const t = ctx.currentTime
      for (const list of voices.values()) for (const v of list) release(v, t)
      voices.clear()
    },
    setVolume(v) {
      master.gain.value = Math.max(0, Math.min(1, v))
    },
  }
}
