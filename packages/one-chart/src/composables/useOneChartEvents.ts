import type { OneChartEventHandler, OneChartEventMap, OneChartInstance } from '../types/public'

export interface OneChartEventsController {
  update: (chart: OneChartInstance | undefined, events?: OneChartEventMap) => void
  stop: () => void
}

interface BoundEvent {
  eventName: string
  handler: OneChartEventHandler
}

export function useOneChartEvents(): OneChartEventsController {
  let currentChart: OneChartInstance | undefined
  let boundEvents: BoundEvent[] = []

  function stop(): void {
    if (!currentChart) {
      boundEvents = []
      return
    }

    for (const { eventName, handler } of boundEvents) {
      currentChart.off(eventName, handler)
    }

    boundEvents = []
  }

  function update(chart: OneChartInstance | undefined, events: OneChartEventMap = {}): void {
    stop()
    currentChart = chart

    if (!chart) {
      return
    }

    for (const [eventName, eventHandlers] of Object.entries(events)) {
      const handlers = Array.isArray(eventHandlers) ? eventHandlers : eventHandlers ? [eventHandlers] : []

      for (const handler of handlers) {
        chart.on(eventName, handler)
        boundEvents.push({ eventName, handler })
      }
    }
  }

  return {
    update,
    stop,
  }
}
