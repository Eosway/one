import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import OneSeamlessScroll from '../src/components/OneSeamlessScroll.vue'

const BASE_FRAME_MS = 1000 / 60

function setOffsetHeight(element: Element, value: number): void {
  Object.defineProperty(element, 'offsetHeight', {
    configurable: true,
    value,
  })
}

function installFrameMock(): { runNextFrame: (timestamp: number) => void; restore: () => void } {
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame
  const originalCancelAnimationFrame = globalThis.cancelAnimationFrame
  const callbacks = new Map<number, FrameRequestCallback>()
  let seed = 0

  globalThis.requestAnimationFrame = vi.fn((callback: FrameRequestCallback): number => {
    seed += 1
    callbacks.set(seed, callback)
    return seed
  })
  globalThis.cancelAnimationFrame = vi.fn((id: number): void => {
    callbacks.delete(id)
  })

  return {
    runNextFrame(timestamp: number): void {
      const next = callbacks.entries().next().value
      if (!next) {
        throw new Error('No animation frame is queued.')
      }

      const [id, callback] = next
      callbacks.delete(id)
      callback(timestamp)
    },
    restore(): void {
      callbacks.clear()
      globalThis.requestAnimationFrame = originalRequestAnimationFrame
      globalThis.cancelAnimationFrame = originalCancelAnimationFrame
    },
  }
}

describe('OneSeamlessScroll', () => {
  it('renders the empty slot and emits the initial empty state', async () => {
    const wrapper = mount(OneSeamlessScroll, {
      props: {
        list: [],
      },
      slots: {
        empty: '<div data-testid="empty">No data</div>',
      },
    })

    await nextTick()

    expect(wrapper.get('[data-testid="empty"]').text()).toBe('No data')
    expect(wrapper.emitted('state-change')).toEqual([[{ state: 'empty', prevState: null }]])

    wrapper.unmount()
  })

  it('renders items statically when the list does not reach minItems', async () => {
    const wrapper = mount(OneSeamlessScroll, {
      props: {
        list: [{ name: 'Alpha' }, { name: 'Beta' }],
        minItems: 3,
      },
      slots: {
        item: '<div data-testid="item">{{ item.name }}</div>',
      },
    })

    await nextTick()

    expect(wrapper.findAll('[data-testid="item"]')).toHaveLength(2)
    expect(wrapper.text()).toContain('Alpha')
    expect(wrapper.text()).toContain('Beta')
    expect(wrapper.emitted('state-change')).toEqual([[{ state: 'static', prevState: null }]])

    wrapper.unmount()
  })

  it('renders required layout styles without external CSS', async () => {
    const wrapper = mount(OneSeamlessScroll, {
      props: {
        list: [{ name: 'Alpha' }, { name: 'Beta' }],
        minItems: 3,
      },
      slots: {
        item: '<div data-testid="item">{{ item.name }}</div>',
      },
    })

    await nextTick()

    expect(wrapper.get('.one-seamless-scroll').attributes('style')).toContain('overflow: hidden')
    expect(wrapper.get('.one-seamless-scroll__viewport').attributes('style')).toContain('height: 100%')
    expect(wrapper.get('.one-seamless-scroll__track').attributes('style')).toContain('flex-direction: column')
    expect(wrapper.get('.one-seamless-scroll__group').attributes('style')).toContain('flex-direction: column')
    const itemStyle = wrapper.get('.one-seamless-scroll__item').attributes('style')
    expect(itemStyle).toContain('flex-grow: 0')
    expect(itemStyle).toContain('flex-shrink: 0')
    expect(itemStyle).toContain('flex-basis: auto')

    wrapper.unmount()
  })

  it.each([
    { speed: 0, expectedOffset: '-0.05px' },
    { speed: 0.04, expectedOffset: '-0.05px' },
    { speed: 0.5, expectedOffset: '-0.25px' },
    { speed: 1, expectedOffset: '-0.5px' },
    { speed: 2, expectedOffset: '-1px' },
  ])('moves by the calibrated base step when speed is $speed', async ({ speed, expectedOffset }) => {
    const frames = installFrameMock()
    const wrapper = mount(OneSeamlessScroll, {
      props: {
        list: [{ name: 'Alpha' }, { name: 'Beta' }, { name: 'Gamma' }],
        minItems: 2,
        speed,
      },
      slots: {
        item: '<div data-testid="item">{{ item.name }}</div>',
      },
    })

    setOffsetHeight(wrapper.get('.one-seamless-scroll__viewport').element, 100)
    setOffsetHeight(wrapper.get('.one-seamless-scroll__group').element, 180)
    await nextTick()

    frames.runNextFrame(0)
    frames.runNextFrame(BASE_FRAME_MS)

    expect((wrapper.get('.one-seamless-scroll__track').element as HTMLElement).style.transform).toBe(`translate3d(0, ${expectedOffset}, 0)`)

    wrapper.unmount()
    frames.restore()
  })

  it('limits 20fps catch-up to two base frames', async () => {
    const frames = installFrameMock()
    const wrapper = mount(OneSeamlessScroll, {
      props: {
        list: [{ name: 'Alpha' }, { name: 'Beta' }, { name: 'Gamma' }],
        minItems: 2,
        speed: 1,
      },
      slots: {
        item: '<div data-testid="item">{{ item.name }}</div>',
      },
    })

    setOffsetHeight(wrapper.get('.one-seamless-scroll__viewport').element, 100)
    setOffsetHeight(wrapper.get('.one-seamless-scroll__group').element, 180)
    await nextTick()

    frames.runNextFrame(0)
    frames.runNextFrame(50)

    expect((wrapper.get('.one-seamless-scroll__track').element as HTMLElement).style.transform).toBe('translate3d(0, -1px, 0)')

    wrapper.unmount()
    frames.restore()
  })

  it('enters paused on hover and resumes scrolling on mouse leave', async () => {
    const wrapper = mount(OneSeamlessScroll, {
      props: {
        list: [{ name: 'Alpha' }, { name: 'Beta' }],
        minItems: 2,
      },
      slots: {
        item: '<div data-testid="item">{{ item.name }}</div>',
      },
    })

    await nextTick()
    await wrapper.trigger('mouseenter')
    await wrapper.trigger('mouseleave')

    expect(wrapper.emitted('state-change')).toEqual([
      [{ state: 'scrolling', prevState: null }],
      [{ state: 'paused', prevState: 'scrolling' }],
      [{ state: 'scrolling', prevState: 'paused' }],
    ])
    expect(wrapper.attributes('data-state')).toBe('scrolling')

    wrapper.unmount()
  })

  it('keeps scrolling on hover when hoverPause is disabled', async () => {
    const wrapper = mount(OneSeamlessScroll, {
      props: {
        list: [{ name: 'Alpha' }, { name: 'Beta' }],
        minItems: 2,
        hoverPause: false,
      },
      slots: {
        item: '<div data-testid="item">{{ item.name }}</div>',
      },
    })

    await nextTick()
    await wrapper.trigger('mouseenter')

    expect(wrapper.attributes('data-state')).toBe('scrolling')
    expect(wrapper.emitted('state-change')).toEqual([[{ state: 'scrolling', prevState: null }]])

    wrapper.unmount()
  })

  it('stays static when disabled even if the list reaches minItems', async () => {
    const wrapper = mount(OneSeamlessScroll, {
      props: {
        list: [{ name: 'Alpha' }, { name: 'Beta' }, { name: 'Gamma' }],
        minItems: 2,
        enabled: false,
      },
      slots: {
        item: '<div data-testid="item">{{ item.name }}</div>',
      },
    })

    await nextTick()

    expect(wrapper.findAll('[data-testid="item"]')).toHaveLength(3)
    expect(wrapper.emitted('state-change')).toEqual([[{ state: 'static', prevState: null }]])

    wrapper.unmount()
  })

  it('switches from static to scrolling when the list crosses minItems', async () => {
    const wrapper = mount(OneSeamlessScroll, {
      props: {
        list: [{ name: 'Alpha' }],
        minItems: 2,
      },
      slots: {
        item: '<div data-testid="item">{{ item.name }}</div>',
      },
    })

    await nextTick()
    await wrapper.setProps({
      list: [{ name: 'Alpha' }, { name: 'Beta' }],
    })
    await nextTick()

    expect(wrapper.attributes('data-state')).toBe('scrolling')
    expect(wrapper.findAll('[data-testid="item"]')).toHaveLength(2)
    expect(wrapper.emitted('state-change')).toEqual([[{ state: 'static', prevState: null }], [{ state: 'scrolling', prevState: 'static' }]])

    wrapper.unmount()
  })

  it('exposes sync as a public method without changing a stable state', async () => {
    const wrapper = mount(OneSeamlessScroll, {
      props: {
        list: [{ name: 'Alpha' }, { name: 'Beta' }],
        minItems: 2,
      },
      slots: {
        item: '<div>{{ item.name }}</div>',
      },
    })

    await nextTick()

    expect(typeof wrapper.vm.sync).toBe('function')
    wrapper.vm.sync()
    await nextTick()

    expect(wrapper.attributes('data-state')).toBe('scrolling')
    expect(wrapper.emitted('state-change')).toEqual([[{ state: 'scrolling', prevState: null }]])

    wrapper.unmount()
  })
})
