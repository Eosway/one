import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type ComputedRef, type Ref } from 'vue'
import { useSeamlessResize } from './useSeamlessResize'

const BASE_FRAME_MS = 1000 / 60
const BASE_STEP_PX = 0.5
const MAX_CATCH_UP_FRAMES = 2
const OFFSET_PRECISION = 1000

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
   * 承载 transform 的轨道节点。
   */
  trackRef: Ref<HTMLElement | null | undefined>
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
   * 当前滚动速度系数。
   */
  speed: ComputedRef<number>
}

/**
 * `useSeamlessMotion` 返回结果。
 */
export interface UseSeamlessMotionResult {
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
  const { rootRef, viewportRef, trackRef, firstLoopRef, isScrolling, isLooping, speed } = options

  const firstLoopHeight = ref(0)
  const viewportHeight = ref(0)
  const animationFrameId = ref<number | null>(null)
  const lastFrameTime = ref<number | null>(null)
  const measureFrameId = ref<number | null>(null)
  const measureScheduled = ref(false)
  let offsetY = 0
  let timeDebtMs = 0

  const firstGroupRef = computed(() => firstLoopRef.value ?? undefined)
  const shouldDuplicate = computed(() => isLooping.value && viewportHeight.value > 0 && firstLoopHeight.value > viewportHeight.value)
  const canAnimate = computed(() => shouldDuplicate.value && firstLoopHeight.value > 0)

  function applyTransform(): void {
    const track = trackRef.value
    if (!track) {
      return
    }

    track.style.transform = `translate3d(0, ${offsetY}px, 0)`
  }

  function setOffsetY(nextOffsetY: number): void {
    offsetY = nextOffsetY
    applyTransform()
  }

  function normalizeOffsetY(nextOffsetY: number, cycleHeight: number): number {
    if (cycleHeight <= 0) {
      return Math.round(nextOffsetY * OFFSET_PRECISION) / OFFSET_PRECISION
    }

    const normalizedOffsetY = ((nextOffsetY % -cycleHeight) + -cycleHeight) % -cycleHeight
    return Math.round(normalizedOffsetY * OFFSET_PRECISION) / OFFSET_PRECISION
  }

  /**
   * 停止当前动画帧，并清空上一帧时间戳。
   */
  function stopAnimation(): void {
    if (animationFrameId.value !== null) {
      cancelAnimationFrame(animationFrameId.value)
      animationFrameId.value = null
    }

    lastFrameTime.value = null
    timeDebtMs = 0
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
      setOffsetY(0)
      return
    }

    const cycleHeight = firstLoopHeight.value
    if (cycleHeight <= 0) {
      setOffsetY(0)
      return
    }

    const normalizedOffset = ((-offsetY % cycleHeight) + cycleHeight) % cycleHeight
    setOffsetY(normalizedOffset === 0 ? 0 : -normalizedOffset)
  }

  /**
   * 用固定标准帧步进推进当前偏移量，限制掉帧后的单帧补偿距离。
   */
  function tick(timestamp: number): void {
    if (!isScrolling.value || !canAnimate.value) {
      animationFrameId.value = null
      lastFrameTime.value = null
      timeDebtMs = 0
      return
    }

    if (lastFrameTime.value === null) {
      lastFrameTime.value = timestamp
      animationFrameId.value = requestAnimationFrame(tick)
      return
    }

    const elapsed = timestamp - lastFrameTime.value
    lastFrameTime.value = timestamp
    timeDebtMs += elapsed

    const catchUpFrames = Math.min(Math.floor(timeDebtMs / BASE_FRAME_MS), MAX_CATCH_UP_FRAMES)
    if (catchUpFrames > 0) {
      const stepPx = speed.value * BASE_STEP_PX
      const distancePx = catchUpFrames * stepPx
      const nextOffset = offsetY - distancePx

      setOffsetY(normalizeOffsetY(nextOffset, firstLoopHeight.value))
      timeDebtMs -= catchUpFrames * BASE_FRAME_MS
    }

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
      setOffsetY(0)
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
    firstLoopHeight,
    viewportHeight,
    shouldDuplicate,
    canAnimate,
    sync: requestMeasure,
  }
}
