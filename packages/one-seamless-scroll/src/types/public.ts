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
 * `OneSeamlessScroll` `item` 插槽参数。
 */
export interface OneSeamlessScrollItemSlotProps<T = unknown> {
  /**
   * 当前条目数据。
   */
  item: T
  /**
   * 条目在原始列表中的下标。复制组复用同一下标。
   */
  index: number
  /**
   * 当前渲染组：`0` 为原始组，`1` 为无缝衔接的复制组。
   */
  loop: 0 | 1
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
   * `speed=1` 为 `0.5px/frame，≈30px/s @60fps`，例如：
   * - `0.5` 表示 `0.25px/frame`
   * - `1.0` 表示 `0.5px/frame`
   * - `2.0` 表示 `1px/frame`
   *
   * 最小值为 `0.1`；最大值不限制，建议 `<=6`；内部按 `0.1` 精度归一化。
   */
  speed?: number
  /**
   * 鼠标悬停时是否暂停。
   */
  hoverPause?: boolean
  /**
   * 是否允许组件进入自动滚动。
   *
   * 注意：该属性会移除复制组并重置 `transform`，用于彻底关闭滚动能力；
   * 临时暂停请使用 `paused`。
   */
  enabled?: boolean
  /**
   * 外部暂停开关。默认 `false`。
   *
   * - `true` 时仅暂停动画，不移除复制组、不重置 `transform`、不改变溢出判断。
   * - 恢复后从当前位置继续滚动。
   * - 与 `hoverPause` 相互独立，任一成立都会暂停；外部 `paused` 优先级最高。
   * - 适用于 `KeepAlive` 页面 `onDeactivated` / `onActivated` 与业务临时暂停。
   */
  paused?: boolean
  /**
   * 焦点进入组件时是否自动暂停。默认 `true`。
   *
   * 根节点监听 `focusin` / `focusout`：焦点在组件内部移动不恢复，
   * 只有焦点真正离开根节点且外部 `paused` 为 `false` 时才恢复滚动。
   */
  pauseOnFocus?: boolean
  /**
   * 是否尊重 `prefers-reduced-motion: reduce`。默认 `true`。
   *
   * 开启减少动态效果时：停止自动滚动、不复制第二组内容、不应用 `transform`，
   * 状态为 `static`，根节点标记 `data-reduced-motion="true"`，
   * 并使用原生纵向滚动兜底，保证内容不被裁切。
   */
  respectReducedMotion?: boolean
  /**
   * 是否允许复制组保留原生可聚焦能力。默认 `false`。
   *
   * 默认情况下组件会把复制组内可聚焦元素（`a[href]`、`button`、`input`、
   * `select`、`textarea`、`[tabindex]`）设置为 `tabindex="-1"`，避免重复 Tab 焦点；
   * 鼠标点击能力保持不变。设为 `true` 时组件完全不修改复制组。
   */
  cloneFocusable?: boolean
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
