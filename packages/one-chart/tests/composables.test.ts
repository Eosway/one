import { describe, expect, it, vi } from 'vitest'
import { shallowRef } from 'vue'
import { useOneChartEvents } from '../src/composables/useOneChartEvents'
import { useOneChartResize } from '../src/composables/useOneChartResize'
import { createMockChart } from './mockChart'

describe('useOneChartEvents', () => {
  it('binds and unbinds chart events', () => {
    const chart = createMockChart()
    const click = vi.fn()
    const controller = useOneChartEvents()

    controller.update(chart as never, { click })
    chart.emit('click', { value: 1 })
    controller.stop()
    chart.emit('click', { value: 2 })

    expect(click).toHaveBeenCalledTimes(1)
    expect(chart.on).toHaveBeenCalledWith('click', click)
    expect(chart.off).toHaveBeenCalledWith('click', click)
  })
})

describe('useOneChartResize', () => {
  it('does nothing when ResizeObserver is unavailable', () => {
    const original = globalThis.ResizeObserver
    Reflect.deleteProperty(globalThis, 'ResizeObserver')
    const controller = useOneChartResize(
      shallowRef(document.createElement('div')),
      () => createMockChart() as never,
      () => true
    )

    expect(() => controller.start()).not.toThrow()

    globalThis.ResizeObserver = original
  })

  it('observes and disconnects when ResizeObserver exists', () => {
    const observe = vi.fn()
    const disconnect = vi.fn()
    const chart = createMockChart()
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

    const controller = useOneChartResize(
      shallowRef(element),
      () => chart as never,
      () => true
    )

    controller.start()
    controller.stop()

    expect(observe).toHaveBeenCalledWith(element)
    expect(chart.resize).toHaveBeenCalled()
    expect(disconnect).toHaveBeenCalled()

    globalThis.ResizeObserver = original
  })
})
