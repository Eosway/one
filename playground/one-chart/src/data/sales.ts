import type { SalesPreset } from '../types/sales'

export const salesPresets: SalesPreset[] = [
  {
    label: '基础销量',
    subtitle: '默认演示数据',
    months: ['1月', '2月', '3月', '4月', '5月', '6月'],
    values: [18, 24, 31, 22, 37, 41],
    color: '#0f766e',
  },
  {
    label: '活动期间',
    subtitle: '切换后可观察图表更新',
    months: ['7月', '8月', '9月', '10月', '11月', '12月'],
    values: [28, 35, 33, 48, 45, 56],
    color: '#d97706',
  },
]
