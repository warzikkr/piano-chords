import { vi } from 'vitest'

function param() {
  return {
    value: 1,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
  }
}

function node() {
  return {
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    gain: param(),
    frequency: param(),
    playbackRate: param(),
    type: 'sine',
    buffer: null,
    onended: null,
  }
}

/** Minimal stand-in for AudioContext used by audio unit tests. */
export function fakeContext() {
  return {
    currentTime: 0,
    state: 'running',
    destination: {},
    createGain: node,
    createOscillator: node,
    createBufferSource: node,
    decodeAudioData: vi.fn(async () => ({ duration: 4 })),
    resume: vi.fn(async () => undefined),
  } as unknown as AudioContext & { currentTime: number }
}
