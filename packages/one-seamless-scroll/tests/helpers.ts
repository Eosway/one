import type { VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { vi } from 'vitest'

export const BASE_FRAME_MS = 1000 / 60

export function setOffsetHeight(element: Element, value: number): void {
  Object.defineProperty(element, 'offsetHeight', {
    configurable: true,
    value,
  })
}

export interface FrameMock {
  runNextFrame: (timestamp: number) => void
  pendingCount: () => number
  restore: () => void
}

export function installFrameMock(): FrameMock {
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame
  const originalCancelAnimationFrame = globalThis.cancelAnimationFrame
  const callbacks = new Map<number, FrameRequestCallback>()
  let seed = 0

  globalThis.requestAnimationFrame = vi.fn((callback: FrameRequestCallback): number => {
    seed += 1
    callbacks.set(seed, callback)
    return seed
  })
  globalThis.cancelAnimationFrame = vi.fn((id: number): void => {
    callbacks.delete(id)
  })

  return {
    runNextFrame(timestamp: number): void {
      const next = callbacks.entries().next().value
      if (!next) {
        throw new Error('No animation frame is queued.')
      }

      const [id, callback] = next
      callbacks.delete(id)
      callback(timestamp)
    },
    pendingCount(): number {
      return callbacks.size
    },
    restore(): void {
      callbacks.clear()
      globalThis.requestAnimationFrame = originalRequestAnimationFrame
      globalThis.cancelAnimationFrame = originalCancelAnimationFrame
    },
  }
}

export async function runScheduledMeasure(frames: FrameMock): Promise<void> {
  frames.runNextFrame(0)
  await nextTick()
}

export async function primeOverflow(wrapper: VueWrapper, frames: FrameMock, viewportHeight = 100, contentHeight = 180): Promise<void> {
  setOffsetHeight(wrapper.get('.one-seamless-scroll__viewport').element, viewportHeight)
  setOffsetHeight(wrapper.get('.one-seamless-scroll__group').element, contentHeight)
  wrapper.vm.sync()
  await runScheduledMeasure(frames)
  await nextTick()
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

export interface MatchMediaMock {
  matches: () => boolean
  setMatches: (matches: boolean) => void
  listenerCount: () => number
  restore: () => void
}

export function installMatchMedia(initialMatches: boolean): MatchMediaMock {
  const original = window.matchMedia
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  let matches = initialMatches

  const mediaQuery = {
    media: REDUCED_MOTION_QUERY,
    get matches(): boolean {
      return matches
    },
    onchange: null,
    addEventListener(type: string, listener: (event: MediaQueryListEvent) => void): void {
      if (type === 'change') {
        listeners.add(listener)
      }
    },
    removeEventListener(type: string, listener: (event: MediaQueryListEvent) => void): void {
      if (type === 'change') {
        listeners.delete(listener)
      }
    },
    addListener(listener: (event: MediaQueryListEvent) => void): void {
      listeners.add(listener)
    },
    removeListener(listener: (event: MediaQueryListEvent) => void): void {
      listeners.delete(listener)
    },
    dispatchEvent(): boolean {
      return true
    },
  }

  window.matchMedia = vi.fn((query: string) => {
    if (query !== REDUCED_MOTION_QUERY) {
      throw new Error(`Unexpected media query: ${query}`)
    }

    return mediaQuery as unknown as MediaQueryList
  }) as unknown as typeof window.matchMedia

  return {
    matches: () => matches,
    setMatches(next: boolean) {
      matches = next
      const event = { matches: next, media: mediaQuery.media } as MediaQueryListEvent
      listeners.forEach((listener) => listener(event))
    },
    listenerCount: () => listeners.size,
    restore() {
      window.matchMedia = original
    },
  }
}
