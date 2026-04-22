import { vi } from 'vitest'

vi.mock('echarts/core', () => {
  return {
    use: vi.fn(),
    init: vi.fn(),
  }
})
