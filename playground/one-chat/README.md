# Playground one-chat

用于本地验证和演示 `@eosway/one-chat` 当前三层能力。

## 启动

```bash
pnpm install
pnpm --filter one-chat dev
```

默认会启动一个开发期 playground，用来验证：

- `fetch + SSE` 是否能稳定拉流
- OpenAI-compatible / Anthropic / Dify 语义层映射是否正常
- `useStreamChat` / `useChatConversation` / `useChatAssistant` 是否能顺手串联
- 发送、停止、错误、retry、会话切换、助手切换、历史恢复等主链路

## 说明

- `mock` 模式会走真实的 `fetchSse -> createXxxChatStream -> useStreamChat` 链路，只是底层 `fetch` 被 playground 内 mock。
- `live` 模式会直接请求你填写的真实地址，适合联调代理或测试环境接口。
- playground 代码位于 `playground/one-chat`，不进入 `@eosway/one-chat` 正式导出。

## 构建

```bash
pnpm --filter one-chat build
```
