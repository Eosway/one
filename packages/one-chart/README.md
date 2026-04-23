# @eosway/one-chart

> Vue 3 component and composables adapter for Apache ECharts.

`@eosway/one-chart` 提供两层 API：

- 默认主路径：非控制模式，零配置可用
- 高级路径：控制模式，保留 runtime / modules / plugin 安装能力

## 特性

- `OneChart` 组件零配置模式
- `useOneChart(chartRef, { option })` composable 零配置模式
- `plugins` 扩展模式
- `createOneChartRuntime()` 高级 runtime 模式
- `ResizeObserver` 自动 resize
- ECharts 事件绑定与解绑
- `echarts-gl` / `echarts-stat` 通过可选插件入口延迟加载，不进入主包
- 仅支持 ESM

## 兼容性

- `vue >=3.3.0`
- `echarts >=5.5.0`
- `node ^20.19.0 || ^22.12.0 || >=24.0.0`

## 安装

```bash
pnpm add vue echarts @eosway/one-chart
```

如果需要使用可选扩展，再单独安装对应依赖：

```bash
pnpm add echarts-gl
pnpm add echarts-stat
```

## 组件零配置模式

默认组件模式直接使用内置完整 ECharts runtime，业务方不需要关心：

- `runtime`
- `modules`
- `createOneChartRuntime()`

`option` 直接使用原生 ECharts option。

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
</script>

<template>
  <OneChart :option="option" :height="320" :events="{ click: handleClick }" />
</template>
```

### `OneChart` 默认 Props

- `option?: OneChartOption`
- `loading?: boolean | OneChartLoadingOptions`
- `theme?: OneChartTheme`
- `autoResize?: boolean`
- `events?: OneChartEventMap`
- `width?: string | number`
- `height?: string | number`
- `plugins?: OneChartPlugin[]`

### `OneChart` Emits

- `ready(chart)`
- `error(error)`
- `disposed()`

## composable 零配置模式

默认 composable 主路径为：

```ts
useOneChart(chartRef, { option })
```

第一个参数是容器 ref，必传；第二个参数为配置对象。

```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { useOneChart } from '@eosway/one-chart'

const chartRef = useTemplateRef<HTMLElement>('chart')

const option = {
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed'] },
  yAxis: { type: 'value' },
  series: [{ type: 'line', data: [15, 23, 21] }],
}

useOneChart(chartRef, {
  option,
  onReady(chart) {
    console.log(chart)
  },
})
</script>

<template>
  <div ref="chart" style="width: 100%; height: 320px;" />
</template>
```

### `useOneChart()` 默认参数

- `option?: OneChartOption`
- `loading?: boolean | OneChartLoadingOptions`
- `theme?: OneChartTheme`
- `autoResize?: boolean`
- `events?: OneChartEventMap`
- `plugins?: OneChartPlugin[]`
- `onReady?: (chart) => void`
- `onError?: (error) => void`
- `onDisposed?: () => void`

### `useOneChart()` 返回值

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

## plugins 扩展模式

默认非控制模式也支持 `plugins` 扩展。

插件从 `@eosway/one-chart/plugins` 导入，调用形式统一为工厂函数：

```ts
import { glPlugin, statPlugin } from '@eosway/one-chart/plugins'
```

```vue
<template>
  <OneChart :option="option" :plugins="[glPlugin(), statPlugin()]" />
</template>
```

```ts
useOneChart(chartRef, {
  option,
  plugins: [glPlugin(), statPlugin()],
})
```

说明：

- `glPlugin()` 会动态导入 `echarts-gl`
- `statPlugin()` 会动态导入 `echarts-stat`
- 业务方仍需自行安装对应外部依赖

## 高级 runtime 模式

`runtime` 是高级能力，不是默认用法。

如果你需要按需注册 modules、复用 runtime 或安装自定义 plugin，可以继续使用：

```ts
import { createOneChartRuntime } from '@eosway/one-chart'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

const runtime = createOneChartRuntime({
  modules: [BarChart, LineChart, GridComponent, TooltipComponent, CanvasRenderer],
})
```

高级控制模式 composable：

```ts
import { useOneChartRuntime } from '@eosway/one-chart'

useOneChartRuntime(chartRef, {
  runtime,
  option,
  manualUpdate: true,
})
```

## 自定义插件

```ts
import { defineOneChartPlugin } from '@eosway/one-chart'

export const customPlugin = defineOneChartPlugin({
  name: 'custom-plugin',
  async install(runtime) {
    console.log(runtime.echarts)
  },
})
```

## 设计约束

- 默认主路径基于完整 `echarts` 命名空间，常规图表开箱即用
- `option` 可为空；为空时只初始化实例，不自动执行 `setOption`
- `theme` 变化会触发实例重建
- `events` 变化会先解绑旧事件，再绑定新事件
- `autoResize` 依赖 `ResizeObserver`；无该 API 时自动跳过
- 异步插件安装期间如果组件已卸载，旧初始化流程不会继续创建实例

## 注意事项

### 容器尺寸

`OneChart` 通过 `width` / `height` props 控制尺寸。

- `number` 会自动转为 `px`
- `string` 原样透传给内联样式
- 默认值均为 `100%`

### 高级模式兼容

如果你仍然需要这些高级参数，请使用 `useOneChartRuntime(...)`：

- `runtime`
- `initOptions`
- `manualUpdate`
- 初始化级 `updateOptions`
- `group`

## License

Apache-2.0
