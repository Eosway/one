import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import OneSeamlessScroll from '../src/components/OneSeamlessScroll.vue'
import { BASE_FRAME_MS, installFrameMock, primeOverflow, runScheduledMeasure, setOffsetHeight, type FrameMock } from './helpers'

const itemSlot = '<div data-testid="item">{{ item.name }}</div>'

async function mountScrolling(frames: FrameMock) {
  const wrapper = mount(OneSeamlessScroll, {
    props: {
      list: [{ name: 'Alpha' }, { name: 'Beta' }, { name: 'Gamma' }],
      minItems: 2,
    },
    slots: {
      item: itemSlot,
    },
  })

  await primeOverflow(wrapper, frames)

  return wrapper
}

function trackTransform(wrapper: ReturnType<typeof mount>): string {
  return (wrapper.get('.one-seamless-scroll__track').element as HTMLElement).style.transform
}

describe('OneSeamlessScroll paused prop', () => {
  it('pauses in place, keeps the duplicate group and resumes from the same offset', async () => {
    const frames = installFrameMock()
    const wrapper = await mountScrolling(frames)

    expect(wrapper.attributes('data-state')).toBe('scrolling')
    expect(wrapper.findAll('.one-seamless-scroll__group')).toHaveLength(2)

    frames.runNextFrame(0)
    frames.runNextFrame(BASE_FRAME_MS)
    const offsetBeforePause = trackTransform(wrapper)
    expect(offsetBeforePause).toBe('translate3d(0, -0.5px, 0)')

    await wrapper.setProps({ paused: true })
    await nextTick()

    expect(wrapper.attributes('data-state')).toBe('paused')
    expect(wrapper.findAll('.one-seamless-scroll__group')).toHaveLength(2)
    expect(trackTransform(wrapper)).toBe(offsetBeforePause)
    expect(frames.pendingCount()).toBe(0)

    await wrapper.setProps({ paused: false })
    await nextTick()

    expect(wrapper.attributes('data-state')).toBe('scrolling')

    frames.runNextFrame(100)
    frames.runNextFrame(100 + BASE_FRAME_MS)

    expect(trackTransform(wrapper)).toBe('translate3d(0, -1px, 0)')

    wrapper.unmount()
    frames.restore()
  })

  it('keeps static when content does not overflow even if paused is true', async () => {
    const frames = installFrameMock()
    const wrapper = mount(OneSeamlessScroll, {
      props: {
        list: [{ name: 'Alpha' }, { name: 'Beta' }, { name: 'Gamma' }],
        minItems: 2,
        paused: true,
      },
      slots: {
        item: itemSlot,
      },
    })

    setOffsetHeight(wrapper.get('.one-seamless-scroll__viewport').element, 200)
    setOffsetHeight(wrapper.get('.one-seamless-scroll__group').element, 100)
    wrapper.vm.sync()
    await runScheduledMeasure(frames)
    await nextTick()

    expect(wrapper.attributes('data-state')).toBe('static')
    expect(wrapper.findAll('.one-seamless-scroll__group')).toHaveLength(1)
    expect(wrapper.emitted('state-change')).toEqual([[{ state: 'static', prevState: null }]])

    wrapper.unmount()
    frames.restore()
  })

  it('treats external paused and hover pause independently', async () => {
    const frames = installFrameMock()
    const wrapper = await mountScrolling(frames)

    await wrapper.trigger('mouseenter')
    expect(wrapper.attributes('data-state')).toBe('paused')

    await wrapper.setProps({ paused: true })
    await wrapper.setProps({ paused: false })
    expect(wrapper.attributes('data-state')).toBe('paused')

    await wrapper.trigger('mouseleave')
    expect(wrapper.attributes('data-state')).toBe('scrolling')

    wrapper.unmount()
    frames.restore()
  })

  it('clears a stale hover pause when hoverPause is turned off', async () => {
    const frames = installFrameMock()
    const wrapper = await mountScrolling(frames)

    await wrapper.trigger('mouseenter')
    expect(wrapper.attributes('data-state')).toBe('paused')

    await wrapper.setProps({ hoverPause: false })
    await nextTick()

    expect(wrapper.attributes('data-state')).toBe('scrolling')

    wrapper.unmount()
    frames.restore()
  })

  it('emits every state change once and keeps the initial emit', async () => {
    const frames = installFrameMock()
    const wrapper = await mountScrolling(frames)

    await wrapper.setProps({ paused: true })
    await wrapper.setProps({ paused: false })
    await nextTick()

    expect(wrapper.emitted('state-change')).toEqual([
      [{ state: 'static', prevState: null }],
      [{ state: 'scrolling', prevState: 'static' }],
      [{ state: 'paused', prevState: 'scrolling' }],
      [{ state: 'scrolling', prevState: 'paused' }],
    ])

    wrapper.unmount()
    frames.restore()
  })

  it('keeps the current offset across sync and continues from there', async () => {
    const frames = installFrameMock()
    const wrapper = await mountScrolling(frames)

    frames.runNextFrame(0)
    frames.runNextFrame(BASE_FRAME_MS)

    const track = wrapper.get('.one-seamless-scroll__track').element as HTMLElement
    const offsetBeforeSync = track.style.transform
    expect(offsetBeforeSync).toBe('translate3d(0, -0.5px, 0)')

    await wrapper.setProps({ paused: true })
    await nextTick()

    wrapper.vm.sync()
    await runScheduledMeasure(frames)

    expect(track.style.transform).toBe(offsetBeforeSync)
    expect(wrapper.findAll('.one-seamless-scroll__group')).toHaveLength(2)

    await wrapper.setProps({ paused: false })
    await nextTick()

    frames.runNextFrame(0)
    frames.runNextFrame(BASE_FRAME_MS)

    expect(track.style.transform).toBe('translate3d(0, -1px, 0)')

    wrapper.unmount()
    frames.restore()
  })

  it('stays static when the list is shorter than minItems even if content overflows', async () => {
    const frames = installFrameMock()
    const wrapper = mount(OneSeamlessScroll, {
      props: {
        list: [{ name: 'Alpha' }, { name: 'Beta' }],
        minItems: 5,
      },
      slots: {
        item: itemSlot,
      },
    })

    await primeOverflow(wrapper, frames)

    expect(wrapper.attributes('data-state')).toBe('static')
    expect(wrapper.findAll('.one-seamless-scroll__group')).toHaveLength(1)
    expect(wrapper.findAll('[data-testid="item"]')).toHaveLength(2)
    expect(frames.pendingCount()).toBe(0)
    expect(wrapper.emitted('state-change')).toEqual([[{ state: 'static', prevState: null }]])

    wrapper.unmount()
    frames.restore()
  })
})
