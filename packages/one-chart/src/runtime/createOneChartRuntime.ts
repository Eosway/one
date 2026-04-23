import * as echarts from 'echarts/core'
import * as echartsFull from 'echarts'
import type { OneChartEChartsNamespace, OneChartModule, OneChartPlugin, OneChartRuntime, OneChartRuntimeOptions } from '../types/public'

/**
 * 创建一个可复用的 ECharts runtime。
 *
 * 该 runtime 负责模块注册、插件安装去重以及 `echarts` 命名空间暴露。
 */
export function createOneChartRuntime(options: OneChartRuntimeOptions = {}): OneChartRuntime {
  return createRuntime(echarts, options)
}

/**
 * 创建默认零配置 runtime。
 *
 * 该 runtime 基于完整 `echarts` 命名空间，开箱即用支持常规图表能力。
 */
export function createDefaultOneChartRuntime(): OneChartRuntime {
  return createRuntime(echartsFull as unknown as OneChartEChartsNamespace)
}

function createRuntime(echartsNamespace: OneChartEChartsNamespace, options: OneChartRuntimeOptions = {}): OneChartRuntime {
  const installedModules = new Set<OneChartModule>()
  const installedPlugins = new Set<string>()
  const runtime: OneChartRuntime = {
    echarts: echartsNamespace,
    installedModules,
    installedPlugins,
    useModules,
    installPlugins,
  }

  useModules(options.modules)

  function useModules(modules: OneChartModule[] = []): void {
    const pending = modules.filter((module) => {
      if (installedModules.has(module)) {
        return false
      }

      installedModules.add(module)
      return true
    })

    if (pending.length > 0) {
      echartsNamespace.use(pending)
    }
  }

  async function installPlugins(plugins: OneChartPlugin[] = []): Promise<void> {
    for (const plugin of plugins) {
      if (installedPlugins.has(plugin.name)) {
        continue
      }

      await plugin.install(runtime)
      installedPlugins.add(plugin.name)
    }
  }

  return runtime
}
