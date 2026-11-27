import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import OneSeamlessScroll from '../src/components/OneSeamlessScroll.vue'
import { installFrameMock, primeOverflow } from './helpers'

interface SlotItem {
  name: string
}

interface SlotProps {
  item: SlotItem
  index: number
  loop: 0 | 1
}

describe('OneSeamlessScroll item slot loop flag', () => {
  it('passes loop=0 for the original group and loop=1 for the clone group', async () => {
    const frames = installFrameMock()
    const wrapper = mount(OneSeamlessScroll, {
      props: {
        list: [{ name: 'Alpha' }, { name: 'Beta' }, { name: 'Gamma' }],
        minItems: 2,
      },
      slots: {
        item: ({ item, index, loop }: SlotProps) => h('span', { 'data-testid': 'item', 'data-loop': loop, 'data-index': index }, item.name),
      },
    })

    await primeOverflow(wrapper, frames)

    const groups = wrapper.findAll('.one-seamless-scroll__group')
    expect(groups).toHaveLength(2)

    const readRows = (groupIndex: number) =>
      groups[groupIndex].findAll('[data-testid="item"]').map((row) => ({
        loop: row.attributes('data-loop'),
        index: row.attributes('data-index'),
        text: row.text(),
      }))

    expect(readRows(0)).toEqual([
      { loop: '0', index: '0', text: 'Alpha' },
      { loop: '0', index: '1', text: 'Beta' },
      { loop: '0', index: '2', text: 'Gamma' },
    ])
    expect(readRows(1)).toEqual([
      { loop: '1', index: '0', text: 'Alpha' },
      { loop: '1', index: '1', text: 'Beta' },
      { loop: '1', index: '2', text: 'Gamma' },
    ])

    wrapper.unmount()
    frames.restore()
  })

  it('keeps loop flags stable after the list changes', async () => {
    const frames = installFrameMock()
    const wrapper = mount(OneSeamlessScroll, {
      props: {
        list: [{ name: 'Alpha' }],
        minItems: 1,
      },
      slots: {
        item: ({ item, loop }: SlotProps) => h('span', { 'data-testid': 'item', 'data-loop': loop }, item.name),
      },
    })

    await primeOverflow(wrapper, frames)

    await wrapper.setProps({
      list: [{ name: 'Alpha' }, { name: 'Beta' }, { name: 'Gamma' }],
    })
    wrapper.vm.sync()
    frames.runNextFrame(0)
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    const groups = wrapper.findAll('.one-seamless-scroll__group')
    expect(groups).toHaveLength(2)
    expect(groups[0].findAll('[data-testid="item"]').map((row) => row.attributes('data-loop'))).toEqual(['0', '0', '0'])
    expect(groups[1].findAll('[data-testid="item"]').map((row) => row.attributes('data-loop'))).toEqual(['1', '1', '1'])

    wrapper.unmount()
    frames.restore()
  })
})
