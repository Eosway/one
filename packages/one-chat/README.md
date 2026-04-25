# @eosway/one-chat

> Vue 3 chat composable and stream adapters for AI platforms.

`@eosway/one-chat` 提供三类核心能力：

- `fetchSse()` 通用 SSE 拉流
- `createOpenAICompatibleChatStream()` / `createAnthropicChatStream()` / `createDifyChatStream()` 平台语义适配
- `useStreamChat()` 单会话流式聊天 composable

## 安装

```bash
pnpm add vue @eosway/one-chat
```

## 说明

当前版本优先聚焦：

- 基于 `fetch` 的 SSE 读取
- OpenAI-compatible、Anthropic、Dify 三类流式文本对话
- 单会话 `useStreamChat()` 状态管理
