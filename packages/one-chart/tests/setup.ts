import { vi } from 'vitest'

vi.mock('echarts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('echarts')>()
  return {
    ...actual,
    use: vi.fn(),
    init: vi.fn(),
  }
})

vi.mock('echarts/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('echarts/core')>()
  return {
    ...actual,
    use: vi.fn(),
    init: vi.fn(),
  }
})
