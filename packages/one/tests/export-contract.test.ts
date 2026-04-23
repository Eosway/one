import { describe, expect, it } from 'vitest'
import * as one from '../src'
import Chart, * as oneChartNamespace from '../src/chart'
import * as oneChartPluginsNamespace from '../src/chart/plugins'
import { OneChart, useOneChart, useOneChartRuntime } from '../../one-chart/src'
import * as oneChartPlugins from '../../one-chart/src/plugins'

describe('@eosway/one export contract', () => {
  it('only exposes core component and hooks from root entry', () => {
    expect(Object.keys(one).sort()).toEqual(['OneChart', 'useOneChart', 'useOneChartRuntime'])
    expect(one.OneChart).toBe(OneChart)
    expect(one.useOneChart).toBe(useOneChart)
    expect(one.useOneChartRuntime).toBe(useOneChartRuntime)
  })

  it('exposes default component and hooks from chart namespace', () => {
    expect(Chart).toBe(OneChart)
    expect(oneChartNamespace.default).toBe(OneChart)
    expect(oneChartNamespace.useOneChart).toBe(useOneChart)
    expect(oneChartNamespace.useOneChartRuntime).toBe(useOneChartRuntime)
  })

  it('only exposes plugins from chart plugins subpath', () => {
    expect(oneChartPluginsNamespace.glPlugin).toBe(oneChartPlugins.glPlugin)
    expect(oneChartPluginsNamespace.statPlugin).toBe(oneChartPlugins.statPlugin)
    expect('glPlugin' in one).toBe(false)
    expect('statPlugin' in one).toBe(false)
  })
})
