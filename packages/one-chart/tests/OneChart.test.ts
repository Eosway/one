import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import * as echarts from 'echarts/core'
import OneChart from '../src/components/OneChart.vue'
import { createMockChart } from './mockChart'

describe('OneChart', () => {
  it('initializes chart, emits ready, and exposes instance methods', async () => {
    const chart = createMockChart()
    vi.mocked(echarts.init).mockReturnValue(chart as never)

    const wrapper = mount(OneChart, {
      props: {
        option: {
          xAxis: {},
          yAxis: {},
          series: [],
        },
        autoResize: false,
        group: 'dashboard',
      },
      attachTo: document.body,
    })

    await flushPromises()

    expect(echarts.init).toHaveBeenCalled()
    expect(chart.setOption).toHaveBeenCalled()
    expect(chart.group).toBe('dashboard')
    expect(wrapper.emitted('ready')?.[0]?.[0]).toBe(chart)

    wrapper.vm.resize()
    wrapper.vm.clear()

    expect(chart.resize).toHaveBeenCalled()
    expect(chart.clear).toHaveBeenCalled()

    wrapper.unmount()

    expect(chart.dispose).toHaveBeenCalled()
    expect(wrapper.emitted('disposed')).toHaveLength(1)
  })

  it('applies inline width and height styles', async () => {
    const chart = createMockChart()
    vi.mocked(echarts.init).mockReturnValue(chart as never)

    const wrapper = mount(OneChart, {
      props: {
        autoResize: false,
        width: 320,
        height: '50%',
      },
    })

    await flushPromises()

    const root = wrapper.get('div')
    expect(root.attributes('style')).toContain('width: 320px;')
    expect(root.attributes('style')).toContain('height: 50%;')
  })

  it('emits error when plugin installation fails', async () => {
    const error = new Error('plugin failed')
    const wrapper = mount(OneChart, {
      props: {
        autoResize: false,
        plugins: [
          {
            name: 'broken',
            install: () => {
              throw error
            },
          },
        ],
      },
    })

    await flushPromises()

    expect(wrapper.emitted('error')?.[0]?.[0]).toBe(error)
  })
})
