<script setup lang="ts" generic="T = unknown">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import type { OneSeamlessScrollExposed, OneSeamlessScrollProps, OneSeamlessScrollState, OneSeamlessScrollStateChangeEvent } from '../types/public'
import { useSeamlessMotion } from '../composables/useSeamlessMotion'
import { usePrefersReducedMotion } from '../composables/usePrefersReducedMotion'
import { resolveSeamlessItemKey } from '../utils/itemKey'
import { LAYOUT_STYLES } from './OneSeamlessScroll.styles'

defineOptions({ name: 'OneSeamlessScroll' })

const DEFAULT_SPEED = 1
const MIN_SPEED = 0.1
const CLONE_FOCUSABLE_SELECTOR = 'a[href], button, input, select, textarea, [tabindex]'

const props = withDefaults(defineProps<OneSeamlessScrollProps<T>>(), {
  minItems: 5,
  speed: DEFAULT_SPEED,
  hoverPause: true,
  enabled: true,
  paused: false,
  pauseOnFocus: true,
  respectReducedMotion: true,
  cloneFocusable: false,
})
const emit = defineEmits<{
  'state-change': [payload: OneSeamlessScrollStateChangeEvent]
}>()

defineSlots<{
  item(props: { item: T; index: number }): unknown
  empty(props: Record<string, never>): unknown
}>()

const hovered = ref(false)
const focusedWithin = ref(false)
const prefersReducedMotion = usePrefersReducedMotion()
const reducedMotionActive = computed(() => props.respectReducedMotion && prefersReducedMotion.value)

const rootRef = useTemplateRef<HTMLElement>('root')
const viewportRef = useTemplateRef<HTMLElement>('viewport')
const trackRef = useTemplateRef<HTMLElement>('track')
const firstLoopRef = useTemplateRef<HTMLElement>('firstLoop')
const secondLoopRef = useTemplateRef<HTMLElement>('secondLoop')

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

const isPausedByInteraction = computed(() => props.paused || focusedWithin.value || (props.hoverPause && hovered.value))
const isEligibleForMotion = computed(() => isEligibleByInput.value && !reducedMotionActive.value)
const isLooping = computed(() => isEligibleForMotion.value)
const isScrolling = computed(() => isEligibleForMotion.value && !isPausedByInteraction.value)
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

  if (!isEligibleForMotion.value || !hasOverflow.value) {
    return 'static'
  }

  if (isPausedByInteraction.value) {
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

watch(
  () => props.hoverPause,
  (enabled: boolean) => {
    if (!enabled) {
      hovered.value = false
    }
  }
)

function handleMouseLeave(): void {
  if (props.hoverPause) {
    hovered.value = false
  }
}

function handleFocusIn(): void {
  if (props.pauseOnFocus) {
    focusedWithin.value = true
  }
}

function handleFocusOut(event: FocusEvent): void {
  if (!props.pauseOnFocus) {
    return
  }

  const nextTarget = event.relatedTarget
  if (nextTarget instanceof Node && rootRef.value?.contains(nextTarget)) {
    return
  }

  focusedWithin.value = false
}

watch(
  () => props.pauseOnFocus,
  (enabled: boolean) => {
    if (!enabled) {
      focusedWithin.value = false
    }
  }
)

watch(reducedMotionActive, (active: boolean) => {
  if (!active) {
    const root = rootRef.value
    if (root && root.scrollTop !== 0) {
      root.scrollTop = 0
    }
  }

  sync()
})

const rootStyle = computed(() => (reducedMotionActive.value ? LAYOUT_STYLES.rootReducedMotion : LAYOUT_STYLES.root))
const viewportStyle = computed(() => (reducedMotionActive.value ? LAYOUT_STYLES.viewportReducedMotion : LAYOUT_STYLES.viewport))

watch([normalizedList, () => normalizedList.value.length], () => {
  sync()
})

/**
 * 把复制组内的可聚焦元素从 Tab 顺序中移除，鼠标交互保持不变。
 * 重复执行幂等，只修改复制组自己的 `tabindex`。
 */
function guardCloneFocus(): void {
  if (props.cloneFocusable) {
    return
  }

  const group = secondLoopRef.value
  if (!group) {
    return
  }

  group.querySelectorAll<HTMLElement>(CLONE_FOCUSABLE_SELECTOR).forEach((element) => {
    if (element.getAttribute('tabindex') !== '-1') {
      element.setAttribute('tabindex', '-1')
    }
  })
}

watch(
  [() => props.cloneFocusable, shouldDuplicate, secondLoopItems],
  () => {
    guardCloneFocus()
  },
  { flush: 'post' }
)

/**
 * 公开的 `sync()`：重新测量后再次修正复制组的焦点守卫。
 */
function handleSync(): void {
  sync()
  void nextTick().then(guardCloneFocus)
}

defineExpose<OneSeamlessScrollExposed>({
  sync: handleSync,
})
</script>

<template>
  <div
    ref="root"
    class="one-seamless-scroll"
    :style="rootStyle"
    :data-state="state"
    :data-reduced-motion="reducedMotionActive ? 'true' : undefined"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @focusin="handleFocusIn"
    @focusout="handleFocusOut">
    <div v-if="state === 'empty'" class="one-seamless-scroll__empty" :style="LAYOUT_STYLES.empty">
      <slot name="empty" />
    </div>

    <div v-else ref="viewport" class="one-seamless-scroll__viewport" :style="viewportStyle">
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

        <div v-if="shouldDuplicate" ref="secondLoop" class="one-seamless-scroll__group" :style="LAYOUT_STYLES.loopGroup" aria-hidden="true">
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
