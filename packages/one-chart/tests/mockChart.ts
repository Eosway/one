import { vi } from 'vitest'

export function createMockChart() {
  const listeners = new Map<string, Array<(params: unknown) => void>>()
  let disposed = false

  return {
    group: undefined as string | undefined,
    setOption: vi.fn(),
    resize: vi.fn(),
    clear: vi.fn(),
    dispose: vi.fn(() => {
      disposed = true
    }),
    isDisposed: vi.fn(() => disposed),
    dispatchAction: vi.fn(),
    showLoading: vi.fn(),
    hideLoading: vi.fn(),
    on: vi.fn((eventName: string, handler: (params: unknown) => void) => {
      const handlers = listeners.get(eventName) ?? []
      handlers.push(handler)
      listeners.set(eventName, handlers)
    }),
    off: vi.fn((eventName: string, handler: (params: unknown) => void) => {
      const handlers = listeners.get(eventName) ?? []
      listeners.set(
        eventName,
        handlers.filter((candidate) => candidate !== handler)
      )
    }),
    emit(eventName: string, params: unknown) {
      for (const handler of listeners.get(eventName) ?? []) {
        handler(params)
      }
    },
  }
}
