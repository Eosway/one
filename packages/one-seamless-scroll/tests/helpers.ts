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
