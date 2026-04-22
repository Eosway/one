import type { Ref } from 'vue'
import type { OneChartInstance } from '../types/public'

export interface OneChartResizeController {
  start: () => void
  stop: () => void
}

export function useOneChartResize(
  elRef: Ref<HTMLElement | undefined>,
  getChart: () => OneChartInstance | undefined,
  enabled: () => boolean
): OneChartResizeController {
  let observer: ResizeObserver | undefined

  function stop(): void {
    observer?.disconnect()
    observer = undefined
  }

  function start(): void {
    stop()

    if (!enabled() || typeof ResizeObserver === 'undefined') {
      return
    }

    const el = elRef.value
    if (!el) {
      return
    }

    observer = new ResizeObserver(() => {
      getChart()?.resize()
    })
    observer.observe(el)
  }

  return {
    start,
    stop,
  }
}
