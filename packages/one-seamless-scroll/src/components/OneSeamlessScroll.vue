<script setup lang="ts" generic="T = unknown">
import { computed, ref, useTemplateRef, watch } from 'vue'
import type { OneSeamlessScrollExposed, OneSeamlessScrollProps, OneSeamlessScrollState, OneSeamlessScrollStateChangeEvent } from '../types/public'
import { useSeamlessMotion } from '../composables/useSeamlessMotion'
import { resolveSeamlessItemKey } from '../utils/itemKey'
import { LAYOUT_STYLES } from './OneSeamlessScroll.styles'

defineOptions({ name: 'OneSeamlessScroll' })

const DEFAULT_SPEED = 1
const MIN_SPEED = 0.1

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
const trackRef = useTemplateRef<HTMLElement>('track')
const firstLoopRef = useTemplateRef<HTMLElement>('firstLoop')

const normalizedList = computed<T[]>(() => props.list ?? [])
const firstLoopItems = computed(() => normalizedList.value.map((item, index) => ({ item, index, loop: 0 })))
const secondLoopItems = computed(() => normalizedList.value.map((item, index) => ({ item, index, loop: 1 })))
const normalizedMinItems = computed<number>(() => {
  const value = Math.trunc(props.minItems)
  return Number.isFinite(value) && value > 0 ? value : 1
})
const normalizedSpeed = computed<number>(() => {
  const value = Number.isFinite(props.speed) ? props.speed : DEFAULT_SPEED
  return Math.max(MIN_SPEED, Math.round(value * 10) / 10)
})

const isEligibleByInput = computed(() => props.enabled && normalizedList.value.length >= normalizedMinItems.value)

const isLooping = computed(() => isEligibleByInput.value)
const isScrolling = computed(() => isEligibleByInput.value && !(props.hoverPause && hovered.value))
const { hasOverflow, shouldDuplicate, sync } = useSeamlessMotion({
  rootRef,
  viewportRef,
  trackRef,
  firstLoopRef,
  isScrolling,
  isLooping,
  speed: normalizedSpeed,
})

const state = computed<OneSeamlessScrollState>(() => {
  if (normalizedList.value.length === 0) {
    return 'empty'
  }

  if (!isEligibleByInput.value || !hasOverflow.value) {
    return 'static'
  }

  if (props.hoverPause && hovered.value) {
    return 'paused'
  }

  return 'scrolling'
})

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

watch([normalizedList, () => normalizedList.value.length], () => {
  sync()
})

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
      <div ref="track" class="one-seamless-scroll__track" :style="LAYOUT_STYLES.loopGroup">
        <div ref="firstLoop" class="one-seamless-scroll__group" :style="LAYOUT_STYLES.loopGroup">
          <div
            v-for="renderItem in firstLoopItems"
            :key="resolveSeamlessItemKey(renderItem.item, renderItem.index, renderItem.loop, props.itemKey)"
            class="one-seamless-scroll__item"
            :style="LAYOUT_STYLES.item">
            <slot name="item" :item="renderItem.item" :index="renderItem.index" />
          </div>
        </div>

        <div v-if="shouldDuplicate" class="one-seamless-scroll__group" :style="LAYOUT_STYLES.loopGroup" aria-hidden="true">
          <div
            v-for="renderItem in secondLoopItems"
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
