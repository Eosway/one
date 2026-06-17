import { describe, expect, it, vi } from 'vitest'
import { shallowRef } from 'vue'
import { useSeamlessResize } from '../src/composables/useSeamlessResize'

describe('useSeamlessResize', () => {
  it('does nothing when ResizeObserver is unavailable', () => {
    const original = globalThis.ResizeObserver
    Reflect.deleteProperty(globalThis, 'ResizeObserver')
    const onResize = vi.fn()
    const controller = useSeamlessResize(shallowRef(document.createElement('div')), onResize)

    expect(() => controller.start()).not.toThrow()
    expect(onResize).not.toHaveBeenCalled()

    globalThis.ResizeObserver = original
  })

  it('observes element and disconnects cleanly', () => {
    const observe = vi.fn()
    const disconnect = vi.fn()
    const onResize = vi.fn()
    const element = document.createElement('div')
    const original = globalThis.ResizeObserver

    globalThis.ResizeObserver = vi.fn(
      class ResizeObserverMock {
        observe = observe
        disconnect = disconnect
        unobserve = vi.fn()

        constructor(callback: ResizeObserverCallback) {
          callback([], this as ResizeObserver)
        }
      }
    ) as never

    const controller = useSeamlessResize(shallowRef(element), onResize)

    controller.start()
    controller.stop()

    expect(observe).toHaveBeenCalledWith(element)
    expect(onResize).toHaveBeenCalled()
    expect(disconnect).toHaveBeenCalled()

    globalThis.ResizeObserver = original
  })
})
