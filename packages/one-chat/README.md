# @eosway/one-chat

> Vue 3 chat composable and stream adapters for AI platforms.

`@eosway/one-chat` 提供三类核心能力：

- `fetchSse()` 通用 SSE 拉流
- `createOpenAICompatibleChatStream()` / `createAnthropicChatStream()` / `createDifyChatStream()` 平台语义适配
- `useStreamChat()` 单会话流式聊天 composable
- `useChatConversation()` 会话状态管理
- `useChatAssistant()` 助手状态管理

## 安装

```bash
pnpm add vue @eosway/one-chat
```

## 说明

当前版本优先聚焦：

- 基于 `fetch` 的 SSE 读取
- OpenAI-compatible、Anthropic、Dify 三类流式文本对话
- 单会话 `useStreamChat()` 状态管理

## 分层模型

`one-chat` 按从内到外的方式组织能力，每一层都可以独立使用：

- `useStreamChat()`：最小聊天闭环，只管理当前消息、流式状态、错误和重试。
- `useChatConversation()`：在聊天之上增加“当前会话”和“会话历史恢复”。
- `useChatAssistant()`：在会话之上增加“当前助手”和“助手切换”。

推荐的完整模型是：

```text
assistant -> conversations[] -> messages[]
```

也支持更轻的接法：

- 不需要助手列表时，直接使用 `useChatConversation() + useStreamChat()`
- 不需要会话列表时，直接使用 `useStreamChat()`

## 设计约束

- `useStreamChat()` 不依赖助手或会话列表，只接收可选的 `assistantId` 与 `conversationId`
- `useChatConversation()` 只管理会话列表、当前会话和历史消息
- `useChatAssistant()` 只管理助手列表和当前助手
- “助手拥有一组会话” 这类业务编排由上层页面或应用状态负责，不内建在核心 composable 中
