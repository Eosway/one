# Eosway One

> The eosway one monorepo for reusable Vue 3 components, composables, and runtime adapters.

`Eosway One` 是 `Eosway` 组织维护的 Vue 3 多包仓库，聚焦通用、可复用、可独立发布的组件、composables、runtime adapters 与相关工程化配套。

后续会持续扩展更多 `@eosway/one-*` 系列包。其中 `@eosway/one` 作为聚合入口，统一承载 components 与 composables，并通过命名空间子路径暴露附加能力。

## Packages 列表

| 包名                          | 版本                                                                                                                                      | 目录                                                             |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `@eosway/one-chat`            | 待发布                                                                                                                                    | [`packages/one-chat`](./packages/one-chat)                       |
| `@eosway/one`                 | [![npm version](https://img.shields.io/npm/v/@eosway/one.svg)](https://www.npmjs.com/package/@eosway/one)                                 | [`packages/one`](./packages/one)                                 |
| `@eosway/one-chart`           | [![npm version](https://img.shields.io/npm/v/@eosway/one-chart.svg)](https://www.npmjs.com/package/@eosway/one-chart)                     | [`packages/one-chart`](./packages/one-chart)                     |
| `@eosway/one-seamless-scroll` | [![npm version](https://img.shields.io/npm/v/@eosway/one-seamless-scroll.svg)](https://www.npmjs.com/package/@eosway/one-seamless-scroll) | [`packages/one-seamless-scroll`](./packages/one-seamless-scroll) |

### 命名空间映射

| 子路径                        | 对应包                                                                           |
| ----------------------------- | -------------------------------------------------------------------------------- |
| `@eosway/one`                 | `@eosway/one-chart`、`@eosway/one-seamless-scroll`、`@eosway/one-chat`（仅类型） |
| `@eosway/one/chat`            | `@eosway/one-chat`                                                               |
| `@eosway/one/chart`           | `@eosway/one-chart`                                                              |
| `@eosway/one/chart/plugins`   | `@eosway/one-chart/plugins`                                                      |
| `@eosway/one/seamless-scroll` | `@eosway/one-seamless-scroll`                                                    |

## 开发环境

本仓库开发与构建基于：

- `pnpm@10`
- `typescript ^5.9.3`
- `vite ^8`
- `vitest ^4`

## Workspace 命令

```bash
pnpm run tsc
pnpm run tsc:playground
pnpm run test
pnpm run build
pnpm run clean
```

`pnpm run tsc` 基于 TypeScript Project References，通过根 `tsconfig.json` 统一编排 `packages/*` 类型检查顺序。`pnpm run tsc:playground` 继续通过 workspace filter 下发到 `playground/*` 自行维护的 `tsconfig.json`。

## Playground

- [`playground/one-chart`](./playground/one-chart)
- [`playground/one-chat`](./playground/one-chat)
- [`playground/one-seamless-scroll`](./playground/one-seamless-scroll)
