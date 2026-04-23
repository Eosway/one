import { computed, shallowRef } from 'vue'
import { salesPresets } from '../data/sales'
import type { SalesChartControl } from '../types/sales'

export function useSalesPlayground(getChartControl: () => SalesChartControl | null | undefined) {
  const activePresetIndex = shallowRef(0)
  const loading = shallowRef(false)
  const readyCount = shallowRef(0)
  const lastAction = shallowRef('等待图表初始化')
  const lastClick = shallowRef('尚未点击图表')
  const modeSummary = shallowRef('使用内置运行时，开箱即用')

  const activePreset = computed(() => salesPresets[activePresetIndex.value])
  const runtimeSummary = computed(() => modeSummary.value)

  function cyclePreset(): void {
    activePresetIndex.value = (activePresetIndex.value + 1) % salesPresets.length
    lastAction.value = `已切换到「${activePreset.value.label}」`
  }

  function toggleLoading(): void {
    loading.value = !loading.value
    lastAction.value = loading.value ? '已显示loading' : '已关闭loading'
  }

  function highlightPeak(): void {
    getChartControl()?.highlightPeak()
    const peakValue = Math.max(...activePreset.value.values)
    const peakMonth = activePreset.value.months[activePreset.value.values.findIndex((value) => value === peakValue)]
    lastAction.value = `已高亮峰值：${peakMonth}`
  }

  function rerenderChart(): void {
    getChartControl()?.rerender()
    lastAction.value = '已手动刷新图表'
  }

  function handleReady(): void {
    readyCount.value += 1
    lastAction.value = '图表已完成初始化'
  }

  function setModeSummary(summary: string): void {
    modeSummary.value = summary
  }

  function handleBarClick(summary: string): void {
    lastClick.value = summary
    lastAction.value = '已更新点击结果'
  }

  return {
    activePreset,
    loading,
    readyCount,
    lastAction,
    lastClick,
    runtimeSummary,
    cyclePreset,
    toggleLoading,
    highlightPeak,
    rerenderChart,
    handleReady,
    setModeSummary,
    handleBarClick,
  }
}
