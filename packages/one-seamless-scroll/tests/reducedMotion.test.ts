import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import OneSeamlessScroll from '../src/components/OneSeamlessScroll.vue'
import { BASE_FRAME_MS, installFrameMock, installMatchMedia, primeOverflow } from './helpers'

const itemSlot = '<div data-testid="item">{{ item.name }}</div>'
const baseList = [{ name: 'Alpha' }, { name: 'Beta' }, { name: 'Gamma' }]

describe('OneSeamlessScroll respectReducedMotion', () => {
  it('falls back to a native scroll container without duplicating content', async () => {
    const frames = installFrameMock()
    const media = installMatchMedia(true)
    const wrapper = mount(OneSeamlessScroll, {
      props: {
        list: baseList,
        minItems: 2,
      },
      slots: {
        item: itemSlot,
      },
    })

    await primeOverflow(wrapper, frames)

    expect(wrapper.attributes('data-state')).toBe('static')
    expect(wrapper.attributes('data-reduced-motion')).toBe('true')
    expect(wrapper.findAll('.one-seamless-scroll__group')).toHaveLength(1)
    expect(wrapper.findAll('[data-testid="item"]')).toHaveLength(3)

    const rootStyle = wrapper.get('.one-seamless-scroll').attributes('style')
    expect(rootStyle).toContain('overflow-y: auto')
    expect(rootStyle).toContain('overflow-x: hidden')
    expect(rootStyle).not.toContain('overflow: hidden')

    const viewportStyle = wrapper.get('.one-seamless-scroll__viewport').attributes('style')
    expect(viewportStyle).toContain('height: auto')

    expect((wrapper.get('.one-seamless-scroll__track').element as HTMLElement).style.transform).toBe('translate3d(0, 0px, 0)')
    expect(frames.pendingCount()).toBe(0)
    expect(wrapper.emitted('state-change')).toEqual([[{ state: 'static', prevState: null }]])

    wrapper.unmount()
    expect(media.listenerCount()).toBe(0)

    media.restore()
    frames.restore()
  })

  it('keeps static when paused is true under reduced motion', async () => {
    const frames = installFrameMock()
    const media = installMatchMedia(true)
    const wrapper = mount(OneSeamlessScroll, {
      props: {
        list: baseList,
        minItems: 2,
        paused: true,
      },
      slots: {
        item: itemSlot,
      },
    })

    await primeOverflow(wrapper, frames)

    expect(wrapper.attributes('data-state')).toBe('static')
    expect(wrapper.attributes('data-reduced-motion')).toBe('true')

    wrapper.unmount()
    media.restore()
    frames.restore()
  })

  it('restores auto scrolling after the media query switches back', async () => {
    const frames = installFrameMock()
    const media = installMatchMedia(true)
    const wrapper = mount(OneSeamlessScroll, {
      props: {
        list: baseList,
        minItems: 2,
      },
      slots: {
        item: itemSlot,
      },
    })

    await primeOverflow(wrapper, frames)
    expect(wrapper.attributes('data-state')).toBe('static')

    media.setMatches(false)
    await nextTick()

    frames.runNextFrame(0)
    await nextTick()
    await nextTick()

    expect(wrapper.attributes('data-state')).toBe('scrolling')
    expect(wrapper.attributes('data-reduced-motion')).toBeUndefined()
    expect(wrapper.findAll('.one-seamless-scroll__group')).toHaveLength(2)

    frames.runNextFrame(100)
    frames.runNextFrame(100 + BASE_FRAME_MS)
    expect((wrapper.get('.one-seamless-scroll__track').element as HTMLElement).style.transform).toMatch(/^translate3d\(0, -[\d.]+px, 0\)$/)

    wrapper.unmount()
    media.restore()
    frames.restore()
  })

  it('ignores the media query when respectReducedMotion is false', async () => {
    const frames = installFrameMock()
    const media = installMatchMedia(true)
    const wrapper = mount(OneSeamlessScroll, {
      props: {
        list: baseList,
        minItems: 2,
        respectReducedMotion: false,
      },
      slots: {
        item: itemSlot,
      },
    })

    await primeOverflow(wrapper, frames)

    expect(wrapper.attributes('data-state')).toBe('scrolling')
    expect(wrapper.attributes('data-reduced-motion')).toBeUndefined()
    expect(wrapper.findAll('.one-seamless-scroll__group')).toHaveLength(2)

    wrapper.unmount()
    media.restore()
    frames.restore()
  })

  it('does not throw when matchMedia is unavailable', async () => {
    const original = window.matchMedia
    Reflect.deleteProperty(window, 'matchMedia')

    try {
      const wrapper = mount(OneSeamlessScroll, {
        props: {
          list: baseList,
          minItems: 2,
        },
        slots: {
          item: itemSlot,
        },
      })

      await nextTick()

      expect(wrapper.attributes('data-state')).toBe('static')
      expect(wrapper.attributes('data-reduced-motion')).toBeUndefined()

      wrapper.unmount()
    } finally {
      window.matchMedia = original
    }
  })
})
