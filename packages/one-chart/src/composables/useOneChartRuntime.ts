import { shallowRef, toValue, watch, type MaybeRefOrGetter, type ShallowRef } from 'vue'
import { useOneChartCore, type UseOneChartReturn } from './useOneChart'
import type { OneChartSize, UseOneChartOptions, UseOneChartRuntimeOptions } from '../types/public'

interface UseOneChartRuntimeCompatOptions extends UseOneChartOptions, UseOneChartRuntimeOptions {
  width?: OneChartSize
  height?: OneChartSize
}

type UseOneChartRuntimeInput = MaybeRefOrGetter<UseOneChartRuntimeCompatOptions>

/**
 * `useOneChart()` 高级兼容入口。
 *
 * 保留旧签名和 runtime 级控制能力，供按需使用。
 */
export function useOneChartRuntime(elRef: MaybeRefOrGetter<HTMLElement | undefined>, options?: UseOneChartRuntimeInput): UseOneChartReturn
export function useOneChartRuntime(options?: UseOneChartRuntimeInput): UseOneChartReturn
export function useOneChartRuntime(
  elRefOrOptions?: MaybeRefOrGetter<HTMLElement | undefined> | UseOneChartRuntimeInput,
  options?: UseOneChartRuntimeInput
): UseOneChartReturn {
  const elRef = options === undefined ? shallowRef<HTMLElement>() : computedElementRef(elRefOrOptions as MaybeRefOrGetter<HTMLElement | undefined>)
  const resolvedOptions = options ?? (elRefOrOptions as UseOneChartRuntimeInput) ?? {}

  return useOneChartCore(elRef, normalizeRuntimeOptions(elRef, resolvedOptions))
}

function computedElementRef(target: MaybeRefOrGetter<HTMLElement | undefined>): ShallowRef<HTMLElement | undefined> {
  const elRef = shallowRef<HTMLElement>()

  watch(
    () => toValue(target),
    (value) => {
      elRef.value = value
    },
    { immediate: true }
  )

  return elRef
}

function normalizeRuntimeOptions(
  elRef: ShallowRef<HTMLElement | undefined>,
  options: UseOneChartRuntimeInput
): MaybeRefOrGetter<UseOneChartRuntimeCompatOptions> {
  const normalized = shallowRef(toValue(options))

  watch(
    () => toValue(options),
    (value) => {
      normalized.value = value
    },
    { immediate: true }
  )

  watch(
    () => [normalized.value.width, normalized.value.height] as const,
    () => {
      const el = elRef.value
      if (!el) {
        return
      }

      if (normalized.value.width != null) {
        el.style.width = typeof normalized.value.width === 'number' ? `${normalized.value.width}px` : normalized.value.width
      }

      if (normalized.value.height != null) {
        el.style.height = typeof normalized.value.height === 'number' ? `${normalized.value.height}px` : normalized.value.height
      }
    },
    { immediate: true }
  )

  return normalized
}
