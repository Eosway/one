import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import OneSeamlessScroll from '../src/components/OneSeamlessScroll.vue'
import { installFrameMock, primeOverflow } from './helpers'

const focusableItemSlot = '<button type="button" data-testid="item">{{ item.name }}</button>'

async function mountScrolling() {
  const frames = installFrameMock()
  const wrapper = mount(OneSeamlessScroll, {
    props: {
      list: [{ name: 'Alpha' }, { name: 'Beta' }, { name: 'Gamma' }],
      minItems: 2,
    },
    slots: {
      item: focusableItemSlot,
    },
  })

  await primeOverflow(wrapper, frames)

  return { frames, wrapper }
}

function dispatchFocusEvent(element: Element, type: 'focusin' | 'focusout', relatedTarget: Node | null): void {
  const event = new Event(type, { bubbles: true })
  Object.defineProperty(event, 'relatedTarget', { value: relatedTarget })
  element.dispatchEvent(event)
}

describe('OneSeamlessScroll pauseOnFocus', () => {
  it('pauses when a item control receives focus and resumes when focus leaves the root', async () => {
    const { frames, wrapper } = await mountScrolling()
    const button = wrapper.get('[data-testid="item"]').element

    expect(wrapper.attributes('data-state')).toBe('scrolling')

    dispatchFocusEvent(button, 'focusin', null)
    await wrapper.vm.$nextTick()

    expect(wrapper.attributes('data-state')).toBe('paused')
    expect(wrapper.findAll('.one-seamless-scroll__group')).toHaveLength(2)

    dispatchFocusEvent(button, 'focusout', document.body)
    await wrapper.vm.$nextTick()

    expect(wrapper.attributes('data-state')).toBe('scrolling')

    wrapper.unmount()
    frames.restore()
  })

  it('stays paused while focus moves between elements inside the root', async () => {
    const { frames, wrapper } = await mountScrolling()
    const buttons = wrapper.findAll('[data-testid="item"]').map((item) => item.element)

    dispatchFocusEvent(buttons[0], 'focusin', null)
    await wrapper.vm.$nextTick()

    dispatchFocusEvent(buttons[0], 'focusout', buttons[1])
    await wrapper.vm.$nextTick()
    expect(wrapper.attributes('data-state')).toBe('paused')

    dispatchFocusEvent(buttons[1], 'focusout', wrapper.get('.one-seamless-scroll').element)
    await wrapper.vm.$nextTick()
    expect(wrapper.attributes('data-state')).toBe('paused')

    wrapper.unmount()
    frames.restore()
  })

  it('still respects the external paused flag after focus leaves', async () => {
    const { frames, wrapper } = await mountScrolling()
    const button = wrapper.get('[data-testid="item"]').element

    await wrapper.setProps({ paused: true })
    dispatchFocusEvent(button, 'focusin', null)
    dispatchFocusEvent(button, 'focusout', document.body)
    await wrapper.vm.$nextTick()

    expect(wrapper.attributes('data-state')).toBe('paused')

    await wrapper.setProps({ paused: false })
    await wrapper.vm.$nextTick()

    expect(wrapper.attributes('data-state')).toBe('scrolling')

    wrapper.unmount()
    frames.restore()
  })

  it('does not pause on focus when pauseOnFocus is false', async () => {
    const frames = installFrameMock()
    const wrapper = mount(OneSeamlessScroll, {
      props: {
        list: [{ name: 'Alpha' }, { name: 'Beta' }, { name: 'Gamma' }],
        minItems: 2,
        pauseOnFocus: false,
      },
      slots: {
        item: focusableItemSlot,
      },
    })

    await primeOverflow(wrapper, frames)

    dispatchFocusEvent(wrapper.get('[data-testid="item"]').element, 'focusin', null)
    await wrapper.vm.$nextTick()

    expect(wrapper.attributes('data-state')).toBe('scrolling')

    wrapper.unmount()
    frames.restore()
  })

  it('drops a stale focus pause when pauseOnFocus is turned off', async () => {
    const { frames, wrapper } = await mountScrolling()

    dispatchFocusEvent(wrapper.get('[data-testid="item"]').element, 'focusin', null)
    await wrapper.vm.$nextTick()
    expect(wrapper.attributes('data-state')).toBe('paused')

    await wrapper.setProps({ pauseOnFocus: false })
    await wrapper.vm.$nextTick()

    expect(wrapper.attributes('data-state')).toBe('scrolling')

    wrapper.unmount()
    frames.restore()
  })
})
