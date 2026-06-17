import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type ComputedRef, type Ref } from 'vue'
import { useSeamlessResize } from './useSeamlessResize'

/**
 * `useSeamlessMotion` 输入参数。
 */
export interface UseSeamlessMotionOptions {
  /**
   * 组件根节点。
   */
  rootRef: Ref<HTMLElement | null | undefined>
  /**
   * 可视区域节点。
   */
  viewportRef: Ref<HTMLElement | null | undefined>
  /**
   * 第一组内容节点。
   */
  firstLoopRef: Ref<HTMLElement | null | undefined>
  /**
   * 当前是否处于自动滚动状态。
   */
  isScrolling: ComputedRef<boolean>
  /**
   * 当前是否处于循环展示状态。
   */
  isLooping: ComputedRef<boolean>
  /**
   * 当前滚动速度，单位为像素每秒。
   */
  speedPixelsPerSecond: ComputedRef<number>
}

/**
 * `useSeamlessMotion` 返回结果。
 */
export interface UseSeamlessMotionResult {
  /**
   * 当前纵向偏移量。
   */
  offsetY: Ref<number>
  /**
   * 第一组内容的实际高度。
   */
  firstLoopHeight: Ref<number>
  /**
   * 可视区域的实际高度。
   */
  viewportHeight: Ref<number>
  /**
   * 当前是否需要渲染第二组内容用于无缝衔接。
   */
  shouldDuplicate: ComputedRef<boolean>
  /**
   * 当前是否满足动画运行条件。
   */
  canAnimate: ComputedRef<boolean>
  /**
   * 重新同步尺寸并刷新滚动条件。
   */
  sync: () => void
}

/**
 * 管理无缝滚动的尺寸测量、偏移计算与动画调度。
 */
export function useSeamlessMotion(options: UseSeamlessMotionOptions): UseSeamlessMotionResult {
  const { rootRef, viewportRef, firstLoopRef, isScrolling, isLooping, speedPixelsPerSecond } = options

  const offsetY = ref(0)
  const firstLoopHeight = ref(0)
  const viewportHeight = ref(0)
  const animationFrameId = ref<number | null>(null)
  const lastFrameTime = ref<number | null>(null)
  const measureFrameId = ref<number | null>(null)
  const measureScheduled = ref(false)

  const firstGroupRef = computed(() => firstLoopRef.value ?? undefined)
  const shouldDuplicate = computed(() => isLooping.value && viewportHeight.value > 0 && firstLoopHeight.value > viewportHeight.value)
  const canAnimate = computed(() => shouldDuplicate.value && firstLoopHeight.value > 0)

  /**
   * 停止当前动画帧，并清空上一帧时间戳。
   */
  function stopAnimation(): void {
    if (animationFrameId.value !== null) {
      cancelAnimationFrame(animationFrameId.value)
      animationFrameId.value = null
    }

    lastFrameTime.value = null
  }

  function stopScheduledMeasure(): void {
    if (measureFrameId.value !== null) {
      cancelAnimationFrame(measureFrameId.value)
      measureFrameId.value = null
    }

    measureScheduled.value = false
  }

  /**
   * 重新读取容器与内容尺寸，并规范化当前偏移量。
   */
  function measure(): void {
    viewportHeight.value = viewportRef.value?.offsetHeight ?? 0
    firstLoopHeight.value = firstLoopRef.value?.offsetHeight ?? 0

    if (!canAnimate.value) {
      offsetY.value = 0
      return
    }

    const cycleHeight = firstLoopHeight.value
    if (cycleHeight <= 0) {
      offsetY.value = 0
      return
    }

    const normalizedOffset = ((-offsetY.value % cycleHeight) + cycleHeight) % cycleHeight
    offsetY.value = normalizedOffset === 0 ? 0 : -normalizedOffset
  }

  /**
   * 基于绝对像素速度推进当前偏移量。
   */
  function tick(timestamp: number): void {
    if (!isScrolling.value || !canAnimate.value) {
      animationFrameId.value = null
      lastFrameTime.value = null
      return
    }

    if (lastFrameTime.value === null) {
      lastFrameTime.value = timestamp
    }

    const elapsed = timestamp - lastFrameTime.value
    lastFrameTime.value = timestamp

    const nextOffset = offsetY.value - (speedPixelsPerSecond.value * elapsed) / 1000
    const cycleHeight = firstLoopHeight.value

    offsetY.value = cycleHeight > 0 ? ((nextOffset % -cycleHeight) + -cycleHeight) % -cycleHeight : nextOffset

    animationFrameId.value = requestAnimationFrame(tick)
  }

  function startAnimation(): void {
    stopAnimation()

    if (!isScrolling.value || !canAnimate.value) {
      return
    }

    animationFrameId.value = requestAnimationFrame(tick)
  }

  async function flushMeasure(): Promise<void> {
    await nextTick()
    measureScheduled.value = false
    measureFrameId.value = null
    measure()
    startAnimation()
  }

  /**
   * 合并同一帧内的重复同步请求，避免多次测量。
   */
  function requestMeasure(): void {
    if (measureScheduled.value) {
      return
    }

    measureScheduled.value = true
    measureFrameId.value = requestAnimationFrame(() => {
      void flushMeasure()
    })
  }

  const handleGeometryChange = (): void => {
    requestMeasure()
  }

  const resizeController = useSeamlessResize(rootRef, handleGeometryChange)
  const contentResizeController = useSeamlessResize(firstGroupRef, handleGeometryChange)

  watch(isScrolling, (nextScrolling) => {
    if (nextScrolling) {
      startAnimation()
      return
    }

    stopAnimation()
  })

  watch(isLooping, (nextLooping) => {
    if (!nextLooping) {
      offsetY.value = 0
    }
  })

  onMounted(async () => {
    await flushMeasure()
    resizeController.start()
    contentResizeController.start()
  })

  onBeforeUnmount(() => {
    stopAnimation()
    stopScheduledMeasure()
    resizeController.stop()
    contentResizeController.stop()
  })

  return {
    offsetY,
    firstLoopHeight,
    viewportHeight,
    shouldDuplicate,
    canAnimate,
    sync: requestMeasure,
  }
}
