export { fetchSse, useFetchSse, FetchSseHttpError, FetchSseProtocolError } from './sse/fetchSse'
export { createOpenAICompatibleChatStream } from './streams/createOpenAICompatibleChatStream'
export { createAnthropicChatStream } from './streams/createAnthropicChatStream'
export { createDifyChatStream } from './streams/createDifyChatStream'
export { useStreamChat } from './composables/useStreamChat'

export type {
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
  StreamChatStatus,
  UseStreamChatOptions,
  UseStreamChatReturn,
} from './types/public'
