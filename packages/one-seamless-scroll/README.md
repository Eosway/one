# @eosway/one-seamless-scroll

> Vue 3 seamless scroll component for small and medium list display.

`@eosway/one-seamless-scroll` 提供一个聚焦的 Vue 3 无缝滚动组件：

- `OneSeamlessScroll` 固定容器内的纵向连续滚动展示

当前版本优先聚焦：

- `几十条到几百条` 数据规模下的稳定展示
- 纵向连续滚动
- 明确的状态语义和插槽边界
- 简洁、可维护的公开 API

## 安装

```bash
pnpm add vue @eosway/one-seamless-scroll
```

要求：

- `Vue >= 3.5.0`

## 组件定位

`OneSeamlessScroll` 是一个 `滚动容器组件`：

- 负责在固定可视区域内展示一组完整列表数据
- 负责判断何时静态展示、何时自动滚动、何时悬停暂停
- 不负责请求数据
- 不负责分页拼接
- 不负责虚拟列表
- 不负责表格、榜单等业务壳结构

`V1` 仅支持 `纵向连续滚动`。

## 状态模型

| 状态        | 说明                   |
| ----------- | ---------------------- |
| `empty`     | 无可展示数据           |
| `static`    | 有数据，但当前静态展示 |
| `scrolling` | 自动连续滚动中         |
| `paused`    | 因交互临时暂停         |

## 属性 Props

| 属性         | 类型                                                        | 必填 | 默认值 | 说明                                                                                    |
| ------------ | ----------------------------------------------------------- | ---- | ------ | --------------------------------------------------------------------------------------- |
| `list`       | `T[]`                                                       | 是   | -      | 完整列表数据。组件内部负责遍历，通过 `item` 插槽渲染单项内容。                          |
| `itemKey`    | `keyof T \| ((item: T, index: number) => string \| number)` | 否   | -      | 单项稳定标识。列表存在动态修改时，建议显式传入。                                        |
| `minItems`   | `number`                                                    | 否   | `5`    | 自动滚动条目阈值。当 `list.length >= minItems` 时，组件才会进一步判断是否进入自动滚动。 |
| `speed`      | `number`                                                    | 否   | `1.0`  | 滚动速度系数。以 `20px/s` 为 `1.0` 个单位，建议按 `0.1` 精度传入。                      |
| `hoverPause` | `boolean`                                                   | 否   | `true` | 鼠标悬停时是否暂停。                                                                    |
| `enabled`    | `boolean`                                                   | 否   | `true` | 是否允许组件进入自动滚动。                                                              |

补充说明：

- `minItems` 只决定“是否允许进入自动滚动判断”，不保证一定发生滚动。
- 实际进入 `scrolling` 还要求内容高度超过可视区高度。
- `speed` 仅在 `scrolling` 状态下生效。

## 事件 Emits

### `state-change`

- 正式状态发生变化时触发。

```ts
event: 'state-change'
payload: OneSeamlessScrollStateChangeEvent = {
  state: OneSeamlessScrollState
  prevState: OneSeamlessScrollState | null
}
```

## 插槽 Slots

### `item` 插槽

渲染单个列表项。

```ts
slot item: {
  item: T
  index: number
}
```

说明：

- 核心插槽
- 组件内部遍历 `list`
- 插槽只负责“单项内容怎么渲染”

### `empty`

自定义空列表展示。

```ts
slot empty: {}
```

说明：

- 仅用于空态内容自定义
- 不改变空态判定规则

## Expose

### `sync()`

重新同步容器与内容尺寸，并重新判断当前展示状态。

```ts
sync(): void
```

适用场景：

- 外层容器尺寸变化
- 组件从隐藏切回可见
- 外部布局发生显著变化

说明：

- `sync()` 不修改 `list`
- `sync()` 不直接改写状态
- `sync()` 适合用于外部布局变化后的重新对齐

## 使用示例

### 基础示例

```vue
<template>
  <OneSeamlessScroll :list="rows">
    <template #item="{ item }">
      <div class="row">
        <span>{{ item.name }}</span>
        <span>{{ item.value }}</span>
      </div>
    </template>
  </OneSeamlessScroll>
</template>
```

### 带状态监听

```vue
<template>
  <OneSeamlessScroll :list="rows" :min-items="4" :speed="1.2" @state-change="handleStateChange">
    <template #item="{ item, index }">
      <div class="row">
        <span>{{ index + 1 }}</span>
        <span>{{ item.name }}</span>
      </div>
    </template>

    <template #empty>
      <div class="empty">暂无数据</div>
    </template>
  </OneSeamlessScroll>
</template>
```

```ts
function handleStateChange(payload: OneSeamlessScrollStateChangeEvent) {
  console.log(payload.state, payload.prevState)
}
```

### 命令式同步

```vue
<template>
  <OneSeamlessScroll ref="scrollRef" :list="rows">
    <template #item="{ item }">
      <div class="row">{{ item.name }}</div>
    </template>
  </OneSeamlessScroll>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const scrollRef = ref<{ sync: () => void } | null>(null)

function handleLayoutChange() {
  scrollRef.value?.sync()
}
</script>
```

## 不进入 V1 的能力

- `direction`
- `v-model`
- `delay`
- `ease`
- `wheel`
- `singleLine`
- `visibleCount`
- `count`
- `offset`
- `add`
- `remove`
- `update`
- `pause`
- `resume`
- `start`
- `stop`

## 迁移原则

从历史 `vue3-seamless-scroll` 迁移到 `OneSeamlessScroll` 时：

- 保留 `list` 输入
- `step` 迁移为 `speed`
- `hover` 迁移为 `hoverPause`
- `limit-scroll-num` 迁移为 `minItems`
- 外部整表 `v-for` 迁移为 `#item` 单项插槽
- 不再迁移历史包的内部事件和数据操作命令
