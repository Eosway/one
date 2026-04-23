import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as echartsFull from 'echarts'
import * as echarts from 'echarts/core'
import { createDefaultOneChartRuntime, createOneChartRuntime } from '../src/runtime/createOneChartRuntime'
import { defineOneChartPlugin } from '../src/runtime/defineOneChartPlugin'

describe('createOneChartRuntime', () => {
  beforeEach(() => {
    vi.mocked(echarts.use).mockClear()
    vi.mocked(echartsFull.use).mockClear()
  })

  it('registers modules once by reference', () => {
    const module = {} as never
    const runtime = createOneChartRuntime({ modules: [module, module] })

    runtime.useModules([module])

    expect(echarts.use).toHaveBeenCalledTimes(1)
    expect(echarts.use).toHaveBeenCalledWith([module])
  })

  it('installs plugins once by name', async () => {
    const install = vi.fn()
    const runtime = createOneChartRuntime()
    const plugin = defineOneChartPlugin({
      name: 'custom',
      install,
    })

    await runtime.installPlugins([plugin, plugin])
    await runtime.installPlugins([plugin])

    expect(install).toHaveBeenCalledTimes(1)
  })

  it('throws when plugin installation fails', async () => {
    const runtime = createOneChartRuntime()
    const error = new Error('install failed')
    const plugin = defineOneChartPlugin({
      name: 'broken',
      install: () => {
        throw error
      },
    })

    await expect(runtime.installPlugins([plugin])).rejects.toThrow(error)
    expect(runtime.installedPlugins.has('broken')).toBe(false)
  })

  it('creates a default runtime backed by full echarts namespace', () => {
    const runtime = createDefaultOneChartRuntime()

    runtime.useModules([{} as never])

    expect(runtime.echarts).toBe(echartsFull)
    expect(echartsFull.use).toHaveBeenCalledTimes(1)
  })
})
