import { computed, nextTick, onBeforeUnmount, onMounted, shallowRef, toValue, watch, type MaybeRefOrGetter, type ShallowRef } from 'vue'
import { createOneChartRuntime } from '../runtime/createOneChartRuntime'
import type { OneChartInitOptions, OneChartInstance, OneChartOption, OneChartTheme, OneChartUpdateOptions, UseOneChartOptions } from '../types/public'
import { useOneChartEvents } from './useOneChartEvents'
import { useOneChartResize } from './useOneChartResize'

/**
 * `useOneChart()` 返回值。
 */
export interface UseOneChartReturn {
  /**
   * 图表容器 DOM ref。
   */
  elRef: ShallowRef<HTMLElement | undefined>

  /**
   * 当前 ECharts 实例 ref。
   */
  chart: ShallowRef<OneChartInstance | undefined>

  /**
   * 图表是否已完成初始化。
   */
  ready: Readonly<ShallowRef<boolean>>

  /**
   * 最近一次初始化错误。
   */
  error: ShallowRef<unknown>

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
 * `useOneChart()` 支持的输入形式。
 */
export type UseOneChartInput = MaybeRefOrGetter<UseOneChartOptions>

const defaultRuntime = createOneChartRuntime()

/**
 * 在 Vue 生命周期内管理 ECharts 实例。
 *
 * 负责初始化、更新、销毁、事件绑定、自动 resize 和 expose 方法封装。
 */
export function useOneChart(options: UseOneChartInput = {}): UseOneChartReturn {
  const elRef = shallowRef<HTMLElement>()
  const chart = shallowRef<OneChartInstance>()
  const ready = shallowRef(false)
  const error = shallowRef<unknown>()
  const events = useOneChartEvents()
  const runtime = computed(() => toValue(options).runtime ?? defaultRuntime)
  let disposed = false
  let initVersion = 0

  const resizeController = useOneChartResize(
    elRef,
    () => chart.value,
    () => toValue(options).autoResize ?? true
  )

  onMounted(() => {
    void rebuild()
  })

  onBeforeUnmount(() => {
    dispose()
  })

  watch(
    () => toValue(options).option,
    (option) => {
      if (toValue(options).manualUpdate || !chart.value || option == null) {
        return
      }

      setOption(option, toValue(options).updateOptions)
    },
    { deep: true }
  )

  watch(
    () => toValue(options).events,
    (nextEvents) => {
      events.update(chart.value, nextEvents)
    },
    { deep: true }
  )

  watch(
    () => toValue(options).autoResize,
    () => {
      resizeController.start()
    }
  )

  watch(
    () => toValue(options).loading,
    () => {
      syncLoading()
    },
    { deep: true }
  )

  watch(
    () => toValue(options).group,
    (group) => {
      if (chart.value) {
        chart.value.group = group ?? ''
      }
    }
  )

  watch(
    () => [toValue(options).theme, toValue(options).initOptions] as const,
    () => {
      if (chart.value) {
        void rebuild()
      }
    },
    { deep: true }
  )

  async function rebuild(): Promise<void> {
    const version = ++initVersion
    teardownChart(false)
    await nextTick()

    if (disposed || version !== initVersion || !elRef.value) {
      return
    }

    try {
      await runtime.value.installPlugins(toValue(options).plugins)
      if (disposed || version !== initVersion || !elRef.value) {
        return
      }

      const instance = runtime.value.echarts.init(
        elRef.value,
        toValue(options).theme as OneChartTheme | undefined,
        toValue(options).initOptions as OneChartInitOptions | undefined
      )

      const group = toValue(options).group
      if (group !== undefined) {
        instance.group = group
      }
      chart.value = instance
      ready.value = true
      error.value = undefined

      events.update(instance, toValue(options).events)

      const option = toValue(options).option
      if (option != null) {
        setOption(option, toValue(options).updateOptions)
      }

      syncLoading()
      resizeController.start()
      toValue(options).onReady?.(instance)
    } catch (caught) {
      error.value = caught
      toValue(options).onError?.(caught)
    }
  }

  function teardownChart(emitDisposed: boolean): void {
    resizeController.stop()
    events.stop()

    const instance = chart.value
    chart.value = undefined
    ready.value = false

    if (instance && !instance.isDisposed()) {
      instance.dispose()
      if (emitDisposed) {
        toValue(options).onDisposed?.()
      }
    }
  }

  function syncLoading(): void {
    const instance = chart.value
    if (!instance) {
      return
    }

    const loading = toValue(options).loading
    if (!loading) {
      instance.hideLoading()
      return
    }

    if (loading === true) {
      instance.showLoading()
      return
    }

    instance.showLoading(loading.type, loading.options)
  }

  function getInstance(): OneChartInstance | undefined {
    return chart.value
  }

  function setOption(option: OneChartOption, updateOptions?: OneChartUpdateOptions): void {
    chart.value?.setOption(option, updateOptions)
  }

  function resize(options?: Parameters<OneChartInstance['resize']>[0]): void {
    chart.value?.resize(options)
  }

  function clear(): void {
    chart.value?.clear()
  }

  function dispose(): void {
    if (disposed && !chart.value) {
      return
    }

    disposed = true
    initVersion += 1
    teardownChart(true)
  }

  function dispatchAction(payload: Parameters<OneChartInstance['dispatchAction']>[0]): void {
    chart.value?.dispatchAction(payload)
  }

  function showLoading(type?: Parameters<OneChartInstance['showLoading']>[0], loadingOptions?: Parameters<OneChartInstance['showLoading']>[1]): void {
    chart.value?.showLoading(type, loadingOptions)
  }

  function hideLoading(): void {
    chart.value?.hideLoading()
  }

  return {
    elRef,
    chart,
    ready,
    error,
    getInstance,
    setOption,
    resize,
    clear,
    dispose,
    dispatchAction,
    showLoading,
    hideLoading,
  }
}
