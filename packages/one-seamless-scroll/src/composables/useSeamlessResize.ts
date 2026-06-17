import type { Ref } from 'vue'

/**
 * ResizeObserver 控制器。
 */
export interface SeamlessResizeController {
  /**
   * 开始监听尺寸变化。
   */
  start: () => void
  /**
   * 停止监听尺寸变化。
   */
  stop: () => void
}

/**
 * 为目标元素提供最小化的 ResizeObserver 生命周期封装。
 */
export function useSeamlessResize(elRef: Ref<HTMLElement | null | undefined>, onResize: () => void): SeamlessResizeController {
  let observer: ResizeObserver | undefined

  function stop(): void {
    observer?.disconnect()
    observer = undefined
  }

  function start(): void {
    stop()

    if (typeof ResizeObserver === 'undefined') {
      return
    }

    const el = elRef.value
    if (!el) {
      return
    }

    observer = new ResizeObserver(() => {
      onResize()
    })
    observer.observe(el)
  }

  return {
    start,
    stop,
  }
}
