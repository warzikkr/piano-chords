let context: AudioContext | null = null
let hooksInstalled = false

/** iOS reports 'interrupted' after a call or screen lock; anything but 'running' needs a resume. */
function resumeIfNeeded(): void {
  if (context && context.state !== 'running') void context.resume()
}

function installResumeHooks(): void {
  if (hooksInstalled) return
  hooksInstalled = true
  window.addEventListener('pointerup', resumeIfNeeded)
  window.addEventListener('touchend', resumeIfNeeded)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') resumeIfNeeded()
  })
}

export function getAudioContext(): AudioContext {
  if (!context) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    context = new Ctor()
    installResumeHooks()
  }
  resumeIfNeeded()
  return context
}

let unlocked = false

/** A looping silent <audio> element makes iOS play Web Audio even with the mute switch on. */
export function unlockAudio(): void {
  if (unlocked) return
  try {
    const audio = document.createElement('audio')
    audio.loop = true
    audio.setAttribute('playsinline', '')
    audio.src = URL.createObjectURL(new Blob([silentWav()], { type: 'audio/wav' }))
    audio
      .play()
      .then(() => {
        unlocked = true
      })
      .catch(() => undefined)
  } catch {
    // Not critical: sound still works when the phone is not muted.
  }
}

function silentWav(): ArrayBuffer {
  const sampleRate = 8000
  const samples = 800
  const buffer = new ArrayBuffer(44 + samples)
  const bytes = new Uint8Array(buffer)
  const view = new DataView(buffer)
  const str = (offset: number, s: string) => [...s].forEach((ch, i) => bytes.set([ch.charCodeAt(0)], offset + i))
  str(0, 'RIFF')
  view.setUint32(4, 36 + samples, true)
  str(8, 'WAVE')
  str(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate, true)
  view.setUint16(32, 1, true)
  view.setUint16(34, 8, true)
  str(36, 'data')
  view.setUint32(40, samples, true)
  bytes.fill(128, 44)
  return buffer
}
