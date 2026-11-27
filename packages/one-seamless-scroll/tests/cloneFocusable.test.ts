import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import OneSeamlessScroll from '../src/components/OneSeamlessScroll.vue'
import { installFrameMock, primeOverflow } from './helpers'

const actionSlot = '<button type="button" data-testid="action">{{ item.name }}</button>'
const baseList = [{ name: 'Alpha' }, { name: 'Beta' }, { name: 'Gamma' }]

function mountWithActions(cloneFocusable?: boolean) {
  return mount(OneSeamlessScroll, {
    props: {
      list: baseList,
      minItems: 2,
      ...(cloneFocusable === undefined ? {} : { cloneFocusable }),
    },
    slots: {
      item: actionSlot,
    },
  })
}

function getClone(wrapper: ReturnType<typeof mountWithActions>) {
  return wrapper.findAll('.one-seamless-scroll__group')[1]
}

describe('OneSeamlessScroll cloneFocusable', () => {
  it('removes cloned controls from the tab order and keeps them clickable', async () => {
    const frames = installFrameMock()
    const wrapper = mountWithActions()

    await primeOverflow(wrapper, frames)

    const groups = wrapper.findAll('.one-seamless-scroll__group')
    expect(groups).toHaveLength(2)
    expect(groups[1].attributes('aria-hidden')).toBe('true')

    const originalButton = groups[0].get('[data-testid="action"]')
    const clonedButton = groups[1].get('[data-testid="action"]')

    expect(originalButton.attributes('tabindex')).toBeUndefined()
    expect(clonedButton.attributes('tabindex')).toBe('-1')
    expect(clonedButton.attributes('style') ?? '').not.toContain('pointer-events')

    const onClick = vi.fn()
    clonedButton.element.addEventListener('click', onClick)
    await clonedButton.trigger('click')

    expect(onClick).toHaveBeenCalledTimes(1)

    wrapper.unmount()
    frames.restore()
  })

  it('keeps the caller in full control when cloneFocusable is true', async () => {
    const frames = installFrameMock()
    const wrapper = mountWithActions(true)

    await primeOverflow(wrapper, frames)

    const clonedButton = getClone(wrapper).get('[data-testid="action"]')
    expect(clonedButton.attributes('tabindex')).toBeUndefined()

    wrapper.unmount()
    frames.restore()
  })

  it('re-applies the guard after the list changes', async () => {
    const frames = installFrameMock()
    const wrapper = mountWithActions()

    await primeOverflow(wrapper, frames)
    expect(getClone(wrapper).findAll('[data-testid="action"]')).toHaveLength(3)

    await wrapper.setProps({
      list: [...baseList, { name: 'Delta' }, { name: 'Epsilon' }],
    })
    wrapper.vm.sync()
    frames.runNextFrame(0)
    await nextTick()
    await nextTick()

    const clonedButtons = getClone(wrapper).findAll('[data-testid="action"]')
    expect(clonedButtons).toHaveLength(5)
    clonedButtons.forEach((button) => {
      expect(button.attributes('tabindex')).toBe('-1')
    })
    wrapper
      .findAll('.one-seamless-scroll__group')[0]
      .findAll('[data-testid="action"]')
      .forEach((button) => {
        expect(button.attributes('tabindex')).toBeUndefined()
      })

    wrapper.unmount()
    frames.restore()
  })

  it('re-applies the guard after sync and stays idempotent', async () => {
    const frames = installFrameMock()
    const wrapper = mountWithActions()

    await primeOverflow(wrapper, frames)

    wrapper.vm.sync()
    frames.runNextFrame(0)
    await nextTick()
    wrapper.vm.sync()
    frames.runNextFrame(0)
    await nextTick()

    expect(getClone(wrapper).get('[data-testid="action"]').attributes('tabindex')).toBe('-1')

    wrapper.unmount()
    frames.restore()
  })
})
