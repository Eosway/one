import { defineOneChartPlugin } from '../runtime/defineOneChartPlugin'

/**
 * `echarts-stat` 延迟安装插件入口。
 */
export const statPlugin = defineOneChartPlugin({
  name: 'echarts-stat',
  async install() {
    await import('echarts-stat')
  },
})
