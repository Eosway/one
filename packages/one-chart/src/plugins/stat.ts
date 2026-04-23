import { defineOneChartPlugin } from '../runtime/defineOneChartPlugin'

export interface OneChartStatPluginOptions {
  /**
   * 预留给未来扩展的配置对象。
   */
  readonly [key: string]: unknown
}

/**
 * `echarts-stat` 延迟安装插件入口。
 */
export function statPlugin(_options: OneChartStatPluginOptions = {}) {
  return defineOneChartPlugin({
    name: 'echarts-stat',
    async install() {
      await import('echarts-stat')
    },
  })
}
