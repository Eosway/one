import { effectScope } from 'vue'
import { describe, expect, it } from 'vitest'
import { useOneChartRuntime } from '../src'
import { createOneChartRuntime } from '../src/runtime/createOneChartRuntime'

describe('runtime api', () => {
  it('keeps runtime mode available through useOneChartRuntime', async () => {
    const runtime = createOneChartRuntime({
      modules: [{} as never],
    })

    const scope = effectScope()

    try {
      const result = scope.run(() =>
        useOneChartRuntime({
          runtime,
          manualUpdate: true,
          option: {
            xAxis: {},
            yAxis: {},
            series: [],
          },
        })
      )

      expect(result).toBeDefined()
      expect(typeof result?.setOption).toBe('function')
      expect(typeof result?.dispose).toBe('function')
      expect(runtime.installedModules.size).toBe(1)
    } finally {
      scope.stop()
    }
  })
})
