# Playground one-chart

用于本地演示和实测 `@eosway/one-chart`。

## 启动

```bash
pnpm install
pnpm --filter one-chart dev
```

默认会启动一个最小可运行页面，用来验证：

- `OneChart` 组件真实渲染
- 自定义 runtime 模块注册
- `click` 事件绑定
- `setOption` / `resize` / `dispatchAction` 等实例方法

## 构建

```bash
pnpm --filter one-chart build
```
