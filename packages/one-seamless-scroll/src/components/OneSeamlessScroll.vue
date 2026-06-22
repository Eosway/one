<script setup lang="ts" generic="T = unknown">
import { computed, ref, useTemplateRef, watch } from 'vue'
import type { CSSProperties } from 'vue'
import type { OneSeamlessScrollExposed, OneSeamlessScrollProps, OneSeamlessScrollState, OneSeamlessScrollStateChangeEvent } from '../types/public'
import { useSeamlessMotion } from '../composables/useSeamlessMotion'
import { resolveSeamlessItemKey } from '../utils/itemKey'
import { LAYOUT_STYLES } from './OneSeamlessScroll.styles'

defineOptions({ name: 'OneSeamlessScroll' })

const DEFAULT_SPEED = 1
const SPEED_UNIT_PIXELS_PER_SECOND = 20

const props = withDefaults(defineProps<OneSeamlessScrollProps<T>>(), {
  minItems: 5,
  speed: DEFAULT_SPEED,
  hoverPause: true,
  enabled: true,
})
const emit = defineEmits<{
  'state-change': [payload: OneSeamlessScrollStateChangeEvent]
}>()

defineSlots<{
  item(props: { item: T; index: number }): unknown
  empty(props: Record<string, never>): unknown
}>()

const hovered = ref(false)

const rootRef = useTemplateRef<HTMLElement>('root')
const viewportRef = useTemplateRef<HTMLElement>('viewport')
const firstLoopRef = useTemplateRef<HTMLElement>('firstLoop')

const normalizedList = computed<T[]>(() => props.list ?? [])
const normalizedMinItems = computed<number>(() => {
  const value = Math.trunc(props.minItems)
  return Number.isFinite(value) && value > 0 ? value : 1
})
const normalizedSpeed = computed<number>(() => {
  const value = Number.isFinite(props.speed) && props.speed > 0 ? props.speed : DEFAULT_SPEED
  return Math.round(value * 10) / 10
})
const speedPixelsPerSecond = computed<number>(() => normalizedSpeed.value * SPEED_UNIT_PIXELS_PER_SECOND)

const state = computed<OneSeamlessScrollState>(() => {
  if (normalizedList.value.length === 0) {
    return 'empty'
  }

  if (!props.enabled || normalizedList.value.length < normalizedMinItems.value) {
    return 'static'
  }

  if (props.hoverPause && hovered.value) {
    return 'paused'
  }

  return 'scrolling'
})

const isLooping = computed(() => state.value === 'scrolling' || state.value === 'paused')
const isScrolling = computed(() => state.value === 'scrolling')
const { offsetY, shouldDuplicate, sync } = useSeamlessMotion({
  rootRef,
  viewportRef,
  firstLoopRef,
  isScrolling,
  isLooping,
  speedPixelsPerSecond,
})
const trackStyle = computed<CSSProperties>(() => ({
  ...LAYOUT_STYLES.loopGroup,
  transform: `translate3d(0, ${offsetY.value}px, 0)`,
}))

watch(
  state,
  (nextState: OneSeamlessScrollState, prevState: OneSeamlessScrollState | undefined) => {
    emit('state-change', {
      state: nextState,
      prevState: prevState ?? null,
    })
  },
  { immediate: true }
)

function handleMouseEnter(): void {
  if (props.hoverPause) {
    hovered.value = true
  }
}

function handleMouseLeave(): void {
  if (props.hoverPause) {
    hovered.value = false
  }
}

watch(
  normalizedList,
  () => {
    sync()
  },
  { deep: true }
)

defineExpose<OneSeamlessScrollExposed>({
  sync,
})
</script>

<template>
  <div ref="root" class="one-seamless-scroll" :style="LAYOUT_STYLES.root" :data-state="state" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
    <div v-if="state === 'empty'" class="one-seamless-scroll__empty" :style="LAYOUT_STYLES.empty">
      <slot name="empty" />
    </div>

    <div v-else ref="viewport" class="one-seamless-scroll__viewport" :style="LAYOUT_STYLES.viewport">
      <div class="one-seamless-scroll__track" :style="trackStyle">
        <div ref="firstLoop" class="one-seamless-scroll__group" :style="LAYOUT_STYLES.loopGroup">
          <div
            v-for="renderItem in normalizedList.map((item, index) => ({ item, index, loop: 0 }))"
            :key="resolveSeamlessItemKey(renderItem.item, renderItem.index, renderItem.loop, props.itemKey)"
            class="one-seamless-scroll__item"
            :style="LAYOUT_STYLES.item">
            <slot name="item" :item="renderItem.item" :index="renderItem.index" />
          </div>
        </div>

        <div v-if="shouldDuplicate" class="one-seamless-scroll__group" :style="LAYOUT_STYLES.loopGroup" aria-hidden="true">
          <div
            v-for="renderItem in normalizedList.map((item, index) => ({ item, index, loop: 1 }))"
            :key="resolveSeamlessItemKey(renderItem.item, renderItem.index, renderItem.loop, props.itemKey)"
            class="one-seamless-scroll__item"
            :style="LAYOUT_STYLES.item">
            <slot name="item" :item="renderItem.item" :index="renderItem.index" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
