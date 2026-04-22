import { defineOneChartPlugin } from '../runtime/defineOneChartPlugin'

/**
 * `echarts-gl` 延迟安装插件入口。
 */
export const glPlugin = defineOneChartPlugin({
  name: 'echarts-gl',
  async install() {
    await import('echarts-gl')
  },
})
