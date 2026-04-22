<script setup lang="ts">
import { computed, onMounted, useTemplateRef } from 'vue'
import { BarChart } from 'echarts/charts'
import { GridComponent, TitleComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { OneChart, createOneChartRuntime } from '@eosway/one-chart'
import type { OneChartEventMap, OneChartExpose, OneChartOption } from '@eosway/one-chart'
import type { SalesChartControl, SalesPreset } from '../types/sales'

interface OneChartBaseDemoProps {
  preset: SalesPreset
  loading?: boolean
  height?: number | string
}

const props = withDefaults(defineProps<OneChartBaseDemoProps>(), {
  loading: false,
  height: 420,
})

const emit = defineEmits<{
  barClick: [summary: string]
  ready: []
  runtimeReady: [moduleCount: number]
}>()

const runtime = createOneChartRuntime({
  modules: [BarChart, GridComponent, TitleComponent, TooltipComponent, CanvasRenderer],
})

const chartRef = useTemplateRef<OneChartExpose>('chart')

const peakIndex = computed(() => {
  const max = Math.max(...props.preset.values)
  return props.preset.values.findIndex((value) => value === max)
})

const option = computed<OneChartOption>(() => ({
  title: {
    text: props.preset.label,
    subtext: props.preset.subtitle,
    left: 0,
    textStyle: {
      color: '#0f172a',
      fontSize: 18,
      fontWeight: 700,
    },
    subtextStyle: {
      color: '#475569',
      fontSize: 12,
    },
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
  },
  grid: { top: 72, left: 24, right: 24, bottom: 24, containLabel: true },
  xAxis: {
    type: 'category',
    data: props.preset.months,
    axisTick: {
      show: false,
    },
    axisLine: {
      lineStyle: {
        color: '#cbd5e1',
      },
    },
    axisLabel: {
      color: '#334155',
    },
  },
  yAxis: {
    type: 'value',
    splitLine: {
      lineStyle: {
        color: '#e2e8f0',
      },
    },
    axisLabel: {
      color: '#64748b',
    },
  },
  series: [
    {
      name: '销量',
      type: 'bar',
      barWidth: 32,
      data: props.preset.values,
      itemStyle: {
        color: props.preset.color,
        borderRadius: [10, 10, 0, 0],
      },
      emphasis: {
        itemStyle: {
          color: '#1d4ed8',
        },
      },
      label: {
        show: true,
        position: 'top',
        color: '#0f172a',
        fontWeight: 600,
      },
    },
  ],
}))

const events: OneChartEventMap = {
  click(params) {
    const payload = params as { name?: string; value?: unknown }
    emit('barClick', `点击 ${payload.name ?? '-'}: ${String(payload.value ?? '-')}`)
  },
}

onMounted(() => {
  emit('runtimeReady', runtime.installedModules.size)
})

function highlightPeak(): void {
  chartRef.value?.dispatchAction({
    type: 'downplay',
    seriesIndex: 0,
  })
  chartRef.value?.dispatchAction({
    type: 'highlight',
    seriesIndex: 0,
    dataIndex: peakIndex.value,
  })
}

function rerender(): void {
  chartRef.value?.setOption(option.value, { notMerge: true })
  chartRef.value?.resize()
}

defineExpose<SalesChartControl>({
  highlightPeak,
  rerender,
})
</script>

<template>
  <OneChart ref="chart" :runtime="runtime" :option="option" :loading="loading" :events="events" :height="height" @ready="emit('ready')" />
</template>
