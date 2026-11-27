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
- 负责判断何时静态展示、何时自动滚动、何时暂停
- 不负责请求数据
- 不负责分页拼接
- 不负责虚拟列表
- 不负责表格、榜单等业务壳结构

适用场景：

- 预报结果表：表头固定，表体自动滚动
- 气象预警列表
- 安全监测、水情监测、闸门监测、动环监测四类预警列表
- 预案列表与预案事件列表
- 1920 / 3840 大屏的固定高度列表区域

`V1` 仅支持 `纵向连续滚动`。

## 状态模型

| 状态        | 说明                                     |
| ----------- | ---------------------------------------- |
| `empty`     | 无可展示数据                             |
| `static`    | 有数据，但当前静态展示                   |
| `scrolling` | 自动连续滚动中                           |
| `paused`    | 自动滚动可用，但因交互或外部开关临时暂停 |

状态优先级从高到低：

1. 空列表：`empty`
2. 不允许滚动、内容未溢出或开启减少动态效果：`static`
3. 外部 `paused` / 焦点暂停 / 鼠标悬停暂停：`paused`
4. 自动滚动：`scrolling`

`paused` 来源有三类，彼此独立，任一成立即暂停：

- `paused` prop：外部开关，优先级最高，适用于 `KeepAlive` 页面与业务临时暂停
- `pauseOnFocus`：焦点进入组件内部
- `hoverPause`：鼠标悬停

`paused=true` 只暂停动画，不移除复制组、不重置 `transform`、不改变溢出判断；恢复后从当前位置继续滚动。需要彻底关闭滚动能力（移除复制组、重置 `transform`）时使用 `enabled=false`。

## 属性 Props

| 属性                   | 类型                                                        | 必填 | 默认值  | 说明                                                                                                              |
| ---------------------- | ----------------------------------------------------------- | ---- | ------- | ----------------------------------------------------------------------------------------------------------------- |
| `list`                 | `T[]`                                                       | 是   | -       | 完整列表数据。组件内部负责遍历，通过 `item` 插槽渲染单项内容。                                                    |
| `itemKey`              | `keyof T \| ((item: T, index: number) => string \| number)` | 否   | -       | 单项稳定标识。列表存在动态修改时，建议显式传入。                                                                  |
| `minItems`             | `number`                                                    | 否   | `5`     | 自动滚动条目阈值。当 `list.length >= minItems` 时，组件才会进一步判断是否进入自动滚动。                           |
| `speed`                | `number`                                                    | 否   | `1.0`   | 滚动速度系数。`speed=1` 为 `0.5px/frame，≈30px/s @60fps`；最小值：`0.1`；最大值：不限制，建议 `≤6`；精度：`0.1`。 |
| `hoverPause`           | `boolean`                                                   | 否   | `true`  | 鼠标悬停时是否暂停。                                                                                              |
| `enabled`              | `boolean`                                                   | 否   | `true`  | 是否允许组件进入自动滚动。会移除复制组并重置 `transform`，不用于临时暂停。                                        |
| `paused`               | `boolean`                                                   | 否   | `false` | 外部暂停开关。只暂停动画，保留复制组与当前 `transform`，恢复后从当前位置继续。                                    |
| `pauseOnFocus`         | `boolean`                                                   | 否   | `true`  | 焦点进入组件内部时暂停；焦点在内部移动不恢复，离开根节点后才恢复。                                                |
| `respectReducedMotion` | `boolean`                                                   | 否   | `true`  | 尊重 `prefers-reduced-motion: reduce`，开启时停止自动滚动并切换为原生纵向滚动兜底。                               |
| `cloneFocusable`       | `boolean`                                                   | 否   | `false` | 复制组是否保留原生可聚焦能力。默认把复制组内可聚焦元素设为 `tabindex="-1"`，鼠标点击不受影响。                    |

补充说明：

- `minItems` 只决定“是否允许进入自动滚动判断”，不保证一定发生滚动。
- 实际进入 `scrolling` 还要求内容高度超过可视区高度。
- `minItems` 默认值为 `5`，仅为兼容既有用法；大屏上内容溢出的列表通常应显式传 `1` 或 `2`，因为它只是滚动阈值，不负责判断内容是否溢出。
- `speed` 仅在 `scrolling` 状态下生效。掉帧时组件会限制单帧补偿距离，优先保持滚动细腻度。
- 大屏场景建议 `speed` 保持在 `0.5 ~ 1`，避免内容移动过快。

## 暂停行为

### 鼠标悬停

`hoverPause=true`（默认）时，鼠标移入暂停，移出恢复。不提供任何可见的“暂停/继续”按钮。

### 键盘焦点

`pauseOnFocus=true`（默认）时：

- 根节点监听 `focusin`，列表内任意可聚焦元素获得焦点时暂停。
- 根节点监听 `focusout`，只有焦点真正离开根节点才恢复。
- `event.relatedTarget` 仍在根节点内（内部焦点移动）时不恢复。
- `event.relatedTarget` 为 `null` 或在根节点外时允许恢复。
- 恢复时仍尊重外部 `paused` 与 `hoverPause`。

### 外部暂停（`paused`）

```ts
const paused = ref(false)
```

- `paused=true`：进入 `paused`，`data-state="paused"`。
- `paused=false`：从当前位置继续滚动，不跳回列表顶部。
- 与 `hoverPause` 独立；外部 `paused` 优先级高于悬停暂停。

### KeepAlive

`KeepAlive` 缓存的页面必须在 `onDeactivated` 暂停，否则隐藏页仍会消耗 `requestAnimationFrame`；`onActivated` 恢复后必须 `sync()`，因为隐藏期间容器尺寸可能为 `0`。

```ts
import { nextTick, onActivated, onDeactivated, ref } from 'vue'

const paused = ref(false)
const scrollRef = ref<{ sync: () => void } | null>(null)

onDeactivated(() => {
  paused.value = true
})

onActivated(async () => {
  paused.value = false
  await nextTick()
  scrollRef.value?.sync()
})
```

```vue
<OneSeamlessScroll ref="scrollRef" :list="rows" :paused="paused" :min-items="2">
  <template #item="{ item }">
    <div class="row">{{ item.name }}</div>
  </template>
</OneSeamlessScroll>
```

## 减少动态效果

`respectReducedMotion=true`（默认）时，组件在 `prefers-reduced-motion: reduce` 下：

- 不自动滚动
- 不复制第二组内容
- 不应用 `transform` 动画
- 状态为 `static`
- 根节点标记 `data-reduced-motion="true"`
- 根节点切换为原生纵向滚动（`overflow-y: auto`），内容不被裁切

媒体查询从 `reduce` 切回正常时，组件会重新测量尺寸并恢复 `scrolling`。

组件不会强制显示滚动条。需要隐藏原生滚动条时由业务层通过 CSS 处理：

```css
.alert-list :deep(.one-seamless-scroll) {
  scrollbar-width: none;
}

.alert-list :deep(.one-seamless-scroll)::-webkit-scrollbar {
  display: none;
}
```

## 事件 Emits

### `state-change`

- 正式状态发生变化时触发。
- 初始状态仍会触发一次，`prevState=null`。
- 相同状态不会重复触发。

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
  loop: 0 | 1
}
```

说明：

- `loop=0` 为原始组，`loop=1` 为无缝衔接的复制组。
- 复制组已带 `aria-hidden="true"`。
- 可据此给克隆项设置 `tabindex="-1"`、禁止重复业务事件，或添加仅原始组可见的样式。

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
- 组件从隐藏切回可见（`KeepAlive` 的 `onActivated`）
- 外部布局发生显著变化

说明：

- `sync()` 不修改 `list`
- `sync()` 不直接改写状态
- `sync()` 保持当前滚动位置
- `sync()` 适合用于外部布局变化后的重新对齐

## 使用示例

### 基础示例

```vue
<script setup lang="ts">
import { OneSeamlessScroll } from '@eosway/one-seamless-scroll'
</script>

<template>
  <OneSeamlessScroll :list="rows" :min-items="2" :speed="0.8">
    <template #item="{ item }">
      <div class="row">
        <span>{{ item.name }}</span>
        <span>{{ item.value }}</span>
      </div>
    </template>
  </OneSeamlessScroll>
</template>
```

### 表头固定 + 表体滚动

组件不负责表格壳结构，表头必须放在组件外部，由业务层控制。

```vue
<template>
  <div class="result-table">
    <div class="result-table__head">
      <span>预报项目</span>
      <span>预报值</span>
      <span>发布时间</span>
    </div>

    <OneSeamlessScroll class="result-table__body" :list="rows" :min-items="1" :speed="0.8">
      <template #item="{ item }">
        <div class="result-table__row">
          <span>{{ item.name }}</span>
          <span>{{ item.value }}</span>
          <span>{{ item.time }}</span>
        </div>
      </template>
    </OneSeamlessScroll>
  </div>
</template>

<style scoped>
.result-table {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.result-table__head,
.result-table__row {
  display: grid;
  grid-template-columns: 2fr 1fr 2fr;
}

.result-table__body {
  flex: 1;
  min-height: 0;
}
</style>
```

### 带“详情/定位”按钮的预警列表

```vue
<template>
  <OneSeamlessScroll :list="alerts" :min-items="2" :speed="0.6">
    <template #item="{ item, loop }">
      <div class="alert-row">
        <span class="alert-row__title">{{ item.title }}</span>
        <!-- 默认 cloneFocusable=false：克隆按钮 tabindex=-1，鼠标点击仍可用 -->
        <button type="button" @click="handleAction(item, loop)">定位</button>
      </div>
    </template>
  </OneSeamlessScroll>
</template>

<script setup lang="ts">
interface Alert {
  id: string
  title: string
}

function handleAction(item: Alert, loop: 0 | 1): void {
  // 克隆组用于无缝衔接，业务事件建议在这里做幂等处理。
  console.log(item.id, loop)
}
</script>
```

需要完全自控克隆项焦点时：

```vue
<OneSeamlessScroll :list="alerts" :min-items="2" clone-focusable>
  <template #item="{ item, loop }">
    <div class="alert-row">
      <span>{{ item.title }}</span>
      <button type="button" :tabindex="loop === 0 ? undefined : -1" @click="handleAction(item, loop)">详情</button>
    </div>
  </template>
</OneSeamlessScroll>
```

### 组尾部间距

组件内部使用 `flex column` 排列条目。若业务层用 `gap` 控制条目间距，复制组与原始组交界处会少一个 `gap`。建议同时设置 `gap` 与等值 `padding-bottom`：

```css
.alert-list :deep(.one-seamless-scroll__group) {
  gap: 8px;
  padding-bottom: 8px;
}
```

组件不在包内硬编码业务间距。

### 减少动态效果的兜底样式

```vue
<OneSeamlessScroll class="alert-list" :list="alerts" :min-items="2">
  <template #item="{ item }">
    <div class="alert-row">{{ item.title }}</div>
  </template>
</OneSeamlessScroll>
```

```css
/* reduced-motion 时组件根节点已可原生滚动，这里只负责隐藏滚动条 */
.alert-list :deep(.one-seamless-scroll) {
  scrollbar-width: none;
}

.alert-list :deep(.one-seamless-scroll)::-webkit-scrollbar {
  display: none;
}
```

### 带状态监听

```vue
<template>
  <OneSeamlessScroll :list="rows" :min-items="2" :speed="1.2" @state-change="handleStateChange">
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

暂停与启停由 props 覆盖：

- `pause` / `resume`：使用 `paused`
- `start` / `stop`：使用 `enabled`（会重置复制组与 `transform`）

## 迁移原则

从历史 `vue3-seamless-scroll` 迁移到 `OneSeamlessScroll` 时：

- 保留 `list` 输入
- `step` 迁移为 `speed`
- `hover` 迁移为 `hoverPause`
- `limit-scroll-num` 迁移为 `minItems`
- 外部整表 `v-for` 迁移为 `#item` 单项插槽
- 不再迁移历史包的内部事件和数据操作命令
