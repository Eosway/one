# @eosway/one

> Aggregate entry for eosway one packages.

`@eosway/one` 是 `@eosway/one-*` 系列包的聚合入口，只负责入口聚合与类型透传；具体用法见各子包 README。

## 命名空间映射

| 子路径                        | 对应包                                                   | 承载形态             |
| ----------------------------- | -------------------------------------------------------- | -------------------- |
| `@eosway/one`                 | `one-chart`、`one-seamless-scroll`、`one-chat`（仅类型） | 根入口               |
| `@eosway/one/chat`            | `@eosway/one-chat`                                       | 运行时与类型完整透传 |
| `@eosway/one/chart`           | `@eosway/one-chart`                                      | 核心运行时与类型     |
| `@eosway/one/chart/plugins`   | `@eosway/one-chart/plugins`                              | 图表插件             |
| `@eosway/one/seamless-scroll` | `@eosway/one-seamless-scroll`                            | 组件与类型           |

## 安装

```bash
pnpm add vue echarts @eosway/one
```

| 依赖           | 要求                                   | 说明                                              |
| -------------- | -------------------------------------- | ------------------------------------------------- |
| Node           | `^20.19.0 \|\| ^22.12.0 \|\| >=24.0.0` | -                                                 |
| `vue`          | `>=3.5.0`                              | 受 `@eosway/one-seamless-scroll` 的 peer 下限约束 |
| `echarts`      | `>=5.5.0`                              | peer 依赖，非可选                                 |
| `echarts-gl`   | `>=2.0.0`                              | 可选，使用 `glPlugin` 时安装                      |
| `echarts-stat` | `>=1.2.0`                              | 可选，使用 `statPlugin` 时安装                    |

`@eosway/one-seamless-scroll` 没有额外运行时依赖。

## 导出矩阵

| 入口                          | 运行时导出                                                                                                                                                                                                                   | 类型导出                                                      |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `@eosway/one`                 | `OneChart`、`OneSeamlessScroll`、`useOneChart`、`useOneChartRuntime`                                                                                                                                                         | chat / chart / seamless-scroll 类型子集                       |
| `@eosway/one/chat`            | `fetchSse`、`useFetchSse`、`FetchSseHttpError`、`FetchSseProtocolError`、`createOpenAICompatibleChatStream`、`createAnthropicChatStream`、`createDifyChatStream`、`useChatStream`、`useChatConversation`、`useChatAssistant` | `@eosway/one-chat` 全部公开类型                               |
| `@eosway/one/chart`           | 默认导出 `OneChart`、`useOneChart`、`useOneChartRuntime`                                                                                                                                                                     | chart 类型子集                                                |
| `@eosway/one/chart/plugins`   | `glPlugin`、`statPlugin`                                                                                                                                                                                                     | -                                                             |
| `@eosway/one/seamless-scroll` | 默认导出 `OneSeamlessScroll`                                                                                                                                                                                                 | `OneSeamlessScrollProps`、`OneSeamlessScrollItemSlotProps` 等 |

## 入口约束

- 根入口不导出 chat 运行时能力（`useChatStream` 等），chat 运行时必须从 `@eosway/one/chat` 导入；根入口只提供 chat 类型。
- 根入口不导出 plugins。
- `@eosway/one/chart` 只提供默认导出的 `OneChart`，不使用命名导出 `OneChart`。
- `@eosway/one/seamless-scroll` 只提供默认导出。
- `createOneChartRuntime`、`defineOneChartPlugin`、`OneChartPlugin`、`OneChartModule`、`OneChartRuntime`、`OneChartRuntimeOptions` 未从聚合包透出，需要时直接从 `@eosway/one-chart` 导入。

## 根入口

`@eosway/one` 根入口只导出：

- `OneChart`
- `OneSeamlessScroll`
- `useOneChart`
- `useOneChartRuntime`
- chat / chart / seamless-scroll 的公开类型子集

## 子包文档

| 包                            | 文档                                     |
| ----------------------------- | ---------------------------------------- |
| `@eosway/one-chat`            | `packages/one-chat/README.md`            |
| `@eosway/one-chart`           | `packages/one-chart/README.md`           |
| `@eosway/one-seamless-scroll` | `packages/one-seamless-scroll/README.md` |
