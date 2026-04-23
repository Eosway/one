# @eosway/one

> Aggregate entry for eosway one packages.

`@eosway/one` 用于统一承载 `@eosway/one-*` 系列包的聚合入口。

当前命名空间映射：

- `@eosway/one/chart` -> `@eosway/one-chart`
- `@eosway/one/chart/plugins` -> `@eosway/one-chart/plugins`

## 安装

```bash
pnpm add vue echarts @eosway/one
```

如果需要 `one-chart` 的可选扩展，再单独安装对应依赖：

```bash
pnpm add echarts-gl
pnpm add echarts-stat
```

## 用法

根入口仅导出核心组件与 hook，不导出 plugins：

```ts
import { OneChart, useOneChart, useOneChartRuntime } from '@eosway/one'
```

通过命名空间子路径访问具体组件包：

```ts
import OneChart, { useOneChart, useOneChartRuntime } from '@eosway/one/chart'
```

插件子路径同样使用命名空间：

```ts
import { glPlugin, statPlugin } from '@eosway/one/chart/plugins'
```

## 根入口说明

`@eosway/one` 仅导出核心组件与 hook：

- `OneChart`
- `useOneChart`
- `useOneChartRuntime`

`plugins` 及其他非核心能力不从根入口透出，必须使用子路径单独导入。
