<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import { BarChart } from 'echarts/charts'
import { GridComponent, TitleComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { createOneChartRuntime, useOneChartRuntime } from '@eosway/one-chart'
import type { OneChartEventMap, OneChartOption } from '@eosway/one-chart'
import type { SalesChartControl, SalesPreset } from '../types/sales'

interface OneChartRuntimeDemoProps {
  preset: SalesPreset
  loading?: boolean
  height?: number | string
}

const props = withDefaults(defineProps<OneChartRuntimeDemoProps>(), {
  loading: false,
  height: 420,
})

const emit = defineEmits<{
  barClick: [summary: string]
  ready: []
}>()

const runtime = createOneChartRuntime({
  modules: [BarChart, GridComponent, TitleComponent, TooltipComponent, CanvasRenderer],
})

const chartRef = useTemplateRef<HTMLElement>('chart')
const elementRef = computed(() => chartRef.value ?? undefined)

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
  click(params: unknown) {
    const payload = params as { name?: string; value?: unknown }
    emit('barClick', `点击 ${payload.name ?? '-'}: ${String(payload.value ?? '-')}`)
  },
}

const chart = useOneChartRuntime(elementRef, () => ({
  runtime,
  option: option.value,
  loading: props.loading,
  events,
  onReady: () => emit('ready'),
}))

function highlightPeak(): void {
  chart.dispatchAction({
    type: 'downplay',
    seriesIndex: 0,
  })
  chart.dispatchAction({
    type: 'highlight',
    seriesIndex: 0,
    dataIndex: peakIndex.value,
  })
}

function rerender(): void {
  chart.setOption(option.value, { notMerge: true })
  chart.resize()
}

defineExpose<SalesChartControl>({
  highlightPeak,
  rerender,
})
</script>

<template>
  <div ref="chart" class="chart-host" :style="{ minHeight: typeof height === 'number' ? `${height}px` : height }" />
</template>

<style scoped>
.chart-host {
  width: 100%;
  min-height: 420px;
}
</style>
