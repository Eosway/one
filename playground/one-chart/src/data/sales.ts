import type { SalesPreset } from '../types/sales'

export const salesPresets: SalesPreset[] = [
  {
    label: '基础销量',
    subtitle: '最小可运行柱状图',
    months: ['1月', '2月', '3月', '4月', '5月', '6月'],
    values: [18, 24, 31, 22, 37, 41],
    color: '#0f766e',
  },
  {
    label: '活动期间',
    subtitle: '用于切换 option 并观察自动更新',
    months: ['7月', '8月', '9月', '10月', '11月', '12月'],
    values: [28, 35, 33, 48, 45, 56],
    color: '#d97706',
  },
]
