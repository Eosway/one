/**
 * `OneSeamlessScroll` 的正式状态。
 */
export type OneSeamlessScrollState = 'empty' | 'static' | 'scrolling' | 'paused'

/**
 * `OneSeamlessScroll` `state-change` 事件参数。
 */
export interface OneSeamlessScrollStateChangeEvent {
  /**
   * 当前状态。
   */
  state: OneSeamlessScrollState
  /**
   * 上一个状态。首次触发时为 `null`。
   */
  prevState: OneSeamlessScrollState | null
}
/**
 * `OneSeamlessScroll` 组件 props。
 */
export interface OneSeamlessScrollProps<T = unknown> {
  /**
   * 完整列表数据。
   */
  list: T[]
  /**
   * 单项稳定标识。
   */
  itemKey?: keyof T | ((item: T, index: number) => string | number)
  /**
   * 自动滚动条目阈值。
   *
   * 当 `list.length >= minItems` 时，组件才会进一步判断是否进入自动滚动。
   */
  minItems?: number
  /**
   * 滚动速度系数。
   *
   * 以 `20px/s` 为 `1.0` 个单位，例如：
   * - `1.0` 表示 `20px/s`
   * - `2.5` 表示 `50px/s`
   */
  speed?: number
  /**
   * 鼠标悬停时是否暂停。
   */
  hoverPause?: boolean
  /**
   * 是否允许组件进入自动滚动。
   */
  enabled?: boolean
}

/**
 * `OneSeamlessScroll` 公开暴露的方法。
 */
export interface OneSeamlessScrollExposed {
  /**
   * 重新同步容器与内容尺寸，并重新判断当前展示状态。
   */
  sync: () => void
}
