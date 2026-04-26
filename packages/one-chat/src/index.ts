export { fetchSse, useFetchSse, FetchSseHttpError, FetchSseProtocolError } from './sse/fetchSse'
export { createOpenAICompatibleChatStream } from './streams/createOpenAICompatibleChatStream'
export { createAnthropicChatStream } from './streams/createAnthropicChatStream'
export { createDifyChatStream } from './streams/createDifyChatStream'
export { useChatStream } from './composables/useChatStream'
export { useChatConversation } from './composables/useChatConversation'
export { useChatAssistant } from './composables/useChatAssistant'

export type {
  ChatAssistant,
  ChatConversation,
  AnthropicChatStreamOptions,
  ChatFinishReason,
  ChatMessage,
  ChatMessageStatus,
  ChatRole,
  ChatStream,
  ChatStreamEvent,
  ChatStreamMetadata,
  ChatStreamRequest,
  ChatUsage,
  DifyChatStreamOptions,
  FetchSse,
  FetchSseOptions,
  OpenAICompatibleChatStreamOptions,
  SendMessageInput,
  SseMessage,
  ChatStreamStatus,
  UseChatAssistantOptions,
  UseChatAssistantReturn,
  UseChatStreamOptions,
  UseChatStreamReturn,
  UseChatConversationOptions,
  UseChatConversationReturn,
} from './types/public'
