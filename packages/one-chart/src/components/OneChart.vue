<script setup lang="ts">
import { computed } from 'vue'
import { useOneChart } from '../composables/useOneChart'
import type { OneChartInstance, OneChartProps, OneChartSize } from '../types/public'

const props = withDefaults(defineProps<OneChartProps>(), {
  autoResize: true,
  manualUpdate: false,
  width: '100%',
  height: '100%',
})

const emit = defineEmits<{
  ready: [chart: OneChartInstance]
  error: [error: unknown]
  disposed: []
}>()

const { elRef, getInstance, setOption, resize, clear, dispose, dispatchAction, showLoading, hideLoading } = useOneChart(() => ({
  runtime: props.runtime,
  option: props.option,
  theme: props.theme,
  initOptions: props.initOptions,
  updateOptions: props.updateOptions,
  autoResize: props.autoResize,
  manualUpdate: props.manualUpdate,
  events: props.events,
  width: props.width,
  height: props.height,
  plugins: props.plugins,
  loading: props.loading,
  group: props.group,
  onReady: (chart) => emit('ready', chart),
  onError: (error) => emit('error', error),
  onDisposed: () => emit('disposed'),
}))

// `vue-tsc` 在启用 `noUnusedLocals` 时不会把模板中的 ref 使用计入脚本作用域。
void elRef

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
  <div ref="elRef" :style="containerStyle" />
</template>
