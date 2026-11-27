import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

/**
 * 解析 `matchMedia` 变化事件中的 `matches`。
 */
function readMatches(event: MediaQueryListEvent | MediaQueryList): boolean {
  return event.matches
}

/**
 * 订阅 `prefers-reduced-motion` 媒体查询。
 *
 * - SSR 安全：`window` 或 `window.matchMedia` 不可用时始终返回 `false`。
 * - 组件卸载时自动移除监听。
 */
export function usePrefersReducedMotion(): Ref<boolean> {
  const prefersReducedMotion = ref(false)

  let mediaQuery: MediaQueryList | null = null
  let handleChange: ((event: MediaQueryListEvent) => void) | null = null

  function stop(): void {
    if (!mediaQuery || !handleChange) {
      mediaQuery = null
      handleChange = null
      return
    }

    if (typeof mediaQuery.removeEventListener === 'function') {
      mediaQuery.removeEventListener('change', handleChange)
    } else if (typeof mediaQuery.removeListener === 'function') {
      // 旧版 Safari 仅支持 addListener/removeListener。
      mediaQuery.removeListener(handleChange)
    }

    mediaQuery = null
    handleChange = null
  }

  function start(): void {
    stop()

    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY)
    prefersReducedMotion.value = readMatches(mediaQuery)

    handleChange = (event: MediaQueryListEvent): void => {
      prefersReducedMotion.value = readMatches(event)
    }

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange)
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleChange)
    }
  }

  onMounted(start)
  onBeforeUnmount(stop)

  return prefersReducedMotion
}
