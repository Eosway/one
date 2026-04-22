import type { OneChartPlugin } from '../types/public'

/**
 * 定义一个 One Chart 插件。
 *
 * 该函数只做类型约束与返回值透传，不会立即安装插件。
 */
export function defineOneChartPlugin(plugin: OneChartPlugin): OneChartPlugin {
  return plugin
}
