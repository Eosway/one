import type { ComposeOption, EChartsCoreOption, EChartsInitOpts, EChartsType, SetOptionOpts } from 'echarts/core'

/**
 * `OneChart` 接收的 ECharts option 类型。
 */
export type OneChartOption = ComposeOption<never> | EChartsCoreOption

/**
 * `OneChart` 初始化时使用的主题类型。
 */
export type OneChartTheme = string | Record<string, unknown>

/**
 * 图表容器尺寸输入类型。
 *
 * `number` 会被解释为像素值，`string` 原样透传给内联样式。
 */
export type OneChartSize = string | number

/**
 * ECharts 初始化参数类型。
 */
export type OneChartInitOptions = EChartsInitOpts

/**
 * `setOption` 更新参数类型。
 */
export type OneChartUpdateOptions = SetOptionOpts

/**
 * ECharts 实例类型。
 */
export type OneChartInstance = EChartsType

/**
 * `echarts/core` 命名空间类型。
 */
export type OneChartEChartsNamespace = typeof import('echarts/core')

type ExtractOneChartModule<T> = T extends Array<infer Module> ? Module : T

/**
 * ECharts 按需注册模块类型。
 */
export type OneChartModule = ExtractOneChartModule<Parameters<OneChartEChartsNamespace['use']>[0]>

/**
 * ECharts 事件处理函数类型。
 */
export type OneChartEventHandler = (params: unknown) => void

/**
 * ECharts 事件映射表。
 */
export type OneChartEventMap = Record<string, OneChartEventHandler | OneChartEventHandler[] | undefined>

/**
 * loading 对象配置。
 */
export interface OneChartLoadingOptions {
  /**
   * loading 类型。
   */
  type?: string

  /**
   * 透传给 `chart.showLoading()` 的配置对象。
   */
  options?: Record<string, unknown>
}

/**
 * 组件 / composable 的 loading 输入类型。
 */
export type OneChartLoading = boolean | OneChartLoadingOptions

/**
 * One Chart runtime 对外契约。
 */
export interface OneChartRuntime {
  /**
   * 当前 runtime 绑定的 `echarts/core` 命名空间。
   */
  readonly echarts: OneChartEChartsNamespace

  /**
   * 已安装的模块集合。
   */
  readonly installedModules: ReadonlySet<OneChartModule>

  /**
   * 已安装插件名集合。
   */
  readonly installedPlugins: ReadonlySet<string>

  /**
   * 注册 ECharts modules。
   *
   * 同一模块引用只会注册一次。
   */
  useModules: (modules?: OneChartModule[]) => void

  /**
   * 安装 runtime 插件。
   *
   * 同名插件只会执行一次。
   */
  installPlugins: (plugins?: OneChartPlugin[]) => Promise<void>
}

/**
 * 创建 runtime 时的输入参数。
 */
export interface OneChartRuntimeOptions {
  /**
   * 需要在 runtime 创建时立即注册的 ECharts modules。
   */
  modules?: OneChartModule[]
}

/**
 * One Chart 插件定义。
 */
export interface OneChartPlugin {
  /**
   * 插件唯一名称。
   */
  name: string

  /**
   * 插件安装函数。
   */
  install: (runtime: OneChartRuntime) => void | Promise<void>
}

/**
 * 默认公开的 `OneChart` / `useOneChart()` 配置。
 */
export interface OneChartBaseOptions {
  /**
   * 初始化后自动应用的 option。
   */
  option?: OneChartOption

  /**
   * 初始化主题；变更后会重建实例。
   */
  theme?: OneChartTheme

  /**
   * 是否启用自动 resize。
   */
  autoResize?: boolean

  /**
   * ECharts 事件映射。
   */
  events?: OneChartEventMap

  /**
   * 实例初始化前需要安装的插件列表。
   */
  plugins?: OneChartPlugin[]

  /**
   * loading 状态。
   */
  loading?: OneChartLoading
}

/**
 * `useOneChart()` 默认公开输入参数。
 */
export interface UseOneChartOptions extends OneChartBaseOptions {
  /**
   * 图表初始化成功回调。
   */
  onReady?: (chart: OneChartInstance) => void

  /**
   * 图表初始化或插件安装失败回调。
   */
  onError?: (error: unknown) => void

  /**
   * 实例销毁后回调。
   */
  onDisposed?: () => void
}

/**
 * 高级控制模式下的额外参数。
 *
 * 这些参数主要用于兼容旧调用或显式 runtime 场景，
 * 不属于默认主路径。
 */
export interface UseOneChartRuntimeOptions {
  /**
   * 自定义 runtime。
   */
  runtime?: OneChartRuntime

  /**
   * 初始化参数；变更后会重建实例。
   */
  initOptions?: OneChartInitOptions

  /**
   * 自动或手动 `setOption` 时使用的更新参数。
   */
  updateOptions?: OneChartUpdateOptions

  /**
   * 是否禁用对 `option` 的自动监听更新。
   */
  manualUpdate?: boolean

  /**
   * 图表分组名。
   */
  group?: string
}

/**
 * `OneChart` 组件 expose / `useOneChart()` 返回的实例控制方法。
 */
export interface OneChartExpose {
  /**
   * 获取当前 ECharts 实例。
   */
  getInstance: () => OneChartInstance | undefined

  /**
   * 调用底层 `chart.setOption()`。
   */
  setOption: (option: OneChartOption, updateOptions?: OneChartUpdateOptions) => void

  /**
   * 调用底层 `chart.resize()`。
   */
  resize: (options?: Parameters<OneChartInstance['resize']>[0]) => void

  /**
   * 调用底层 `chart.clear()`。
   */
  clear: () => void

  /**
   * 销毁当前图表实例。
   */
  dispose: () => void

  /**
   * 调用底层 `chart.dispatchAction()`。
   */
  dispatchAction: (payload: Parameters<OneChartInstance['dispatchAction']>[0]) => void

  /**
   * 调用底层 `chart.showLoading()`。
   */
  showLoading: (type?: Parameters<OneChartInstance['showLoading']>[0], options?: Parameters<OneChartInstance['showLoading']>[1]) => void

  /**
   * 调用底层 `chart.hideLoading()`。
   */
  hideLoading: () => void
}

/**
 * `OneChart` 默认公开 props。
 */
export interface OneChartProps extends OneChartBaseOptions {
  /**
   * ECharts option。
   *
   * 可为空；为空时只初始化实例，不自动执行 `setOption`。
   */
  option?: OneChartOption

  /**
   * ECharts 主题。
   *
   * 变更后会重建实例。
   */
  theme?: OneChartTheme

  /**
   * 图表容器宽度。
   *
   * 默认值为 `100%`。`number` 会被解释为像素值。
   */
  width?: OneChartSize

  /**
   * 图表容器高度。
   *
   * 默认值为 `100%`。`number` 会被解释为像素值。
   */
  height?: OneChartSize
}

/**
 * `OneChart` 高级兼容组件 props。
 */
