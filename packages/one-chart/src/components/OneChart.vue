<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import { useOneChart } from '../composables/useOneChart'
import type { OneChartInstance, OneChartProps, OneChartSize } from '../types/public'

const props = withDefaults(defineProps<OneChartProps>(), {
  autoResize: true,
  width: '100%',
  height: '100%',
})

const emit = defineEmits<{
  ready: [chart: OneChartInstance]
  error: [error: unknown]
  disposed: []
}>()

const containerRef = useTemplateRef<HTMLElement>('container')
const elementRef = computed(() => containerRef.value ?? undefined)

const { getInstance, setOption, resize, clear, dispose, dispatchAction, showLoading, hideLoading } = useOneChart(elementRef, () => ({
  option: props.option,
  theme: props.theme,
  autoResize: props.autoResize,
  events: props.events,
  plugins: props.plugins,
  loading: props.loading,
  onReady: (chart) => emit('ready', chart),
  onError: (error) => emit('error', error),
  onDisposed: () => emit('disposed'),
}))

defineExpose({
  getInstance,
  setOption,
  resize,
  clear,
  dispose,
  dispatchAction,
  showLoading,
  hideLoading,
})

function normalizeSize(size: OneChartSize): string {
  return typeof size === 'number' ? `${size}px` : size
}

const containerStyle = computed(() => ({
  width: normalizeSize(props.width),
  height: normalizeSize(props.height),
}))
</script>

<template>
  <div ref="container" :style="containerStyle" />
</template>
