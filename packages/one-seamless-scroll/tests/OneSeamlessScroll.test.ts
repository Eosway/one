import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import OneSeamlessScroll from '../src/components/OneSeamlessScroll.vue'

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
