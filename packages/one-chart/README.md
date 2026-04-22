# @eosway/one-chart

> Vue 3 component, composables and runtime adapter for Apache ECharts.

`@eosway/one-chart` 不是业务图表组件库，而是一个通用的 ECharts 实例管理层，用于解决 Vue 生命周期内的图表初始化、更新、销毁、resize、事件绑定和插件扩展问题。

## 特性

- `OneChart` 组件
- `useOneChart` composable
- `createOneChartRuntime` runtime adapter
- `defineOneChartPlugin` 插件定义
- `ResizeObserver` 自动 resize
- ECharts 事件绑定与解绑
- 组件 expose / composable 实例方法封装
- 仅支持 ESM
- `echarts-gl` / `echarts-stat` 通过可选插件入口延迟加载，不进入主包

## 兼容性

- `vue >=3.3.0`
- `echarts >=5.5.0`
- `node ^20.19.0 || ^22.12.0 || >=24.0.0`

## 安装

```bash
pnpm add vue echarts @eosway/one-chart
```

如果需要使用可选扩展，再单独安装：

```bash
pnpm add echarts-gl
pnpm add echarts-stat
```

## 快速开始

### 组件用法

```vue
<script setup lang="ts">
import { OneChart } from '@eosway/one-chart'

const option = {
  xAxis: { type: 'category', data: ['A', 'B', 'C'] },
  yAxis: { type: 'value' },
  series: [{ type: 'bar', data: [12, 20, 15] }],
}

function handleClick(params: unknown) {
  console.log(params)
}

function handleReady() {
  console.log('ready')
}
</script>

<template>
  <OneChart :option="option" :width="640" :height="320" auto-resize :events="{ click: handleClick }" @ready="handleReady" />
</template>
```

### `useOneChart` composable 用法

```ts
import { useOneChart } from '@eosway/one-chart'

const option = {
  xAxis: { type: 'category', data: ['A', 'B', 'C'] },
  yAxis: { type: 'value' },
  series: [{ type: 'bar', data: [12, 20, 15] }],
}

const { elRef, chart, ready, error, setOption, resize, clear, dispose, dispatchAction, showLoading, hideLoading, getInstance } = useOneChart({
  option,
  autoResize: true,
  width: 640,
  height: 320,
  events: {
    click(params) {
      console.log(params)
    },
  },
})
```

```vue
<template>
  <div ref="elRef" />
</template>
```

### `createOneChartRuntime` 用法

```ts
import { createOneChartRuntime } from '@eosway/one-chart'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

const runtime = createOneChartRuntime({
  modules: [BarChart, LineChart, GridComponent, TooltipComponent, CanvasRenderer],
})
```

你可以将该 runtime 传给组件或 composable：

```ts
useOneChart({
  runtime,
  option,
})
```

```vue
<template>
  <OneChart :runtime="runtime" :option="option" />
</template>
```

### 插件定义

```ts
import { defineOneChartPlugin } from '@eosway/one-chart'

export const customPlugin = defineOneChartPlugin({
  name: 'custom-plugin',
  async install(runtime) {
    console.log(runtime.echarts)
  },
})
```

## 可选插件入口

```ts
import { glPlugin, statPlugin } from '@eosway/one-chart/plugins'
```

这两个插件只会在实际安装时动态导入：

- `glPlugin` -> `echarts-gl`
- `statPlugin` -> `echarts-stat`

主入口不会静态打入这两个扩展。

## API 概览

### `OneChart` Props

- `runtime?: OneChartRuntime`
- `option?: OneChartOption`
- `theme?: OneChartTheme`
- `initOptions?: OneChartInitOptions`
- `updateOptions?: OneChartUpdateOptions`
- `autoResize?: boolean`
- `manualUpdate?: boolean`
- `events?: OneChartEventMap`
- `width?: OneChartSize`
- `height?: OneChartSize`
- `plugins?: OneChartPlugin[]`
- `loading?: OneChartLoading`
- `group?: string`

### `OneChart` Emits

- `ready(chart)`
- `error(error)`
- `disposed()`

### `OneChart` Expose

- `getInstance()`
- `setOption(option, updateOptions?)`
- `resize(options?)`
- `clear()`
- `dispose()`
- `dispatchAction(payload)`
- `showLoading(type?, options?)`
- `hideLoading()`

### `useOneChart()` 返回值

- `elRef`
- `chart`
- `ready`
- `error`
- `getInstance()`
- `setOption(option, updateOptions?)`
- `resize(options?)`
- `clear()`
- `dispose()`
- `dispatchAction(payload)`
- `showLoading(type?, options?)`
- `hideLoading()`

## 设计约束

- `option` 可为空；为空时只初始化实例，不自动执行 `setOption`
- `manualUpdate=true` 时不自动监听 `option`
- `setOption` 默认不会先 `clear`
- `theme` / `initOptions` 变化会触发实例重建
- `events` 变化会先解绑旧事件，再绑定新事件
- `autoResize` 依赖 `ResizeObserver`；无该 API 时自动跳过
- SSR 环境下不会在模块顶层访问 `window` / `ResizeObserver`
- 异步插件安装期间如果组件已卸载，旧初始化流程不会继续创建实例

## 注意事项

### 容器尺寸

`OneChart` 不再依赖单独 CSS 文件，尺寸通过 `width` / `height` props 控制。

- `number` 会自动转为 `px`
- `string` 原样透传给内联样式
- 默认值均为 `100%`

例如：

```vue
<OneChart :width="320" height="240px" />
<OneChart width="100%" height="50vh" />
```

### 最小运行前提

ECharts 采用按需注册模型。若你使用 `createOneChartRuntime()`，请确保已注册对应图表、组件和 renderer；否则底层 ECharts 初始化或渲染会失败。

## License

Apache-2.0
