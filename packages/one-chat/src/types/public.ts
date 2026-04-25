import type { ComputedRef, Ref } from 'vue'

export interface SseMessage {
  id?: string
  event: string
  data: string
}

export interface FetchSseOptions extends Omit<RequestInit, 'signal'> {
  signal?: AbortSignal
  fetch?: typeof globalThis.fetch
  validateResponse?: (response: Response) => void | Promise<void>
  requireContentType?: boolean
}

export type FetchSse = (input: RequestInfo | URL, options?: FetchSseOptions) => AsyncGenerator<SseMessage, void, void>

export type ChatRole = 'system' | 'user' | 'assistant' | 'tool'

export type ChatMessageStatus = 'streaming' | 'done' | 'error'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  status?: ChatMessageStatus
  metadata?: Record<string, unknown>
}

export interface ChatConversation {
  id: string
  title?: string
  messages: ChatMessage[]
  assistantId?: string
  metadata?: Record<string, unknown>
}

export interface ChatAssistant {
  id: string
  name: string
  description?: string
  welcomeMessage?: string
  suggestions?: string[]
  metadata?: Record<string, unknown>
}

export interface ChatUsage {
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
  raw?: unknown
}

export interface ChatStreamMetadata {
  conversationId?: string
  messageId?: string
  responseId?: string
  usage?: ChatUsage
  raw?: unknown
}

export type ChatFinishReason = string

export type ChatStreamEvent =
  | { type: 'start'; metadata?: ChatStreamMetadata }
  | { type: 'metadata'; metadata: ChatStreamMetadata }
  | { type: 'text-delta'; text: string; metadata?: ChatStreamMetadata }
  | { type: 'finish'; finishReason?: ChatFinishReason; metadata?: ChatStreamMetadata }

export interface ChatStreamRequest {
  messages: ChatMessage[]
  signal?: AbortSignal
  conversationId?: string
  assistantId?: string
  metadata?: Record<string, unknown>
}

export type ChatStream = (request: ChatStreamRequest) => AsyncIterable<ChatStreamEvent>

export type HeadersResolver = HeadersInit | (() => HeadersInit | Promise<HeadersInit>)

export interface ChatStreamFactoryOptions {
  url: string | URL
  headers?: HeadersResolver
  fetch?: typeof globalThis.fetch
}

export interface OpenAICompatibleChatStreamOptions extends ChatStreamFactoryOptions {
  model: string
  body?: Record<string, unknown>
}

export interface AnthropicChatStreamOptions extends ChatStreamFactoryOptions {
  model: string
  maxTokens: number
  anthropicVersion?: string
  body?: Record<string, unknown>
}

export interface DifyChatStreamOptions extends ChatStreamFactoryOptions {
  user: string
  inputs?: Record<string, unknown>
  body?: Record<string, unknown>
}

export interface SendMessageInput {
  content: string
  metadata?: Record<string, unknown>
}

export type StreamChatStatus = 'idle' | 'submitting' | 'streaming' | 'error'

export interface UseStreamChatOptions {
  stream: ChatStream
  initialMessages?: ChatMessage[]
  createId?: () => string
}

export interface UseStreamChatReturn {
  messages: Ref<ChatMessage[]>
  status: Ref<StreamChatStatus>
  error: Ref<unknown>
  metadata: Ref<ChatStreamMetadata | undefined>
  isStreaming: ComputedRef<boolean>
  canRetry: ComputedRef<boolean>
  send: (input: string | SendMessageInput) => Promise<ChatMessage | undefined>
  stop: () => void
  retry: () => Promise<ChatMessage | undefined>
  clear: () => void
  setMessages: (messages: ChatMessage[]) => void
}

export interface UseChatConversationOptions {
  initialConversationId?: string
  initialConversationList?: ChatConversation[]
  createId?: () => string
}

export interface UseChatConversationReturn {
  conversationList: Ref<ChatConversation[]>
  currentConversationId: Ref<string | undefined>
  currentConversation: ComputedRef<ChatConversation | undefined>
  hasConversation: ComputedRef<boolean>
  createConversation: (input?: Partial<Omit<ChatConversation, 'id' | 'messages'>> & { id?: string; messages?: ChatMessage[] }) => ChatConversation
  setConversationList: (conversationList: ChatConversation[]) => void
  selectConversation: (conversationId: string | undefined) => void
  updateConversation: (conversationId: string, patch: Partial<Omit<ChatConversation, 'id'>>) => void
  removeConversation: (conversationId: string) => void
  upsertConversationMessages: (conversationId: string, messages: ChatMessage[]) => void
  clearConversation: () => void
}

export interface UseChatAssistantOptions {
  initialAssistantId?: string
  initialAssistantList?: ChatAssistant[]
}

export interface UseChatAssistantReturn {
  assistantList: Ref<ChatAssistant[]>
  currentAssistantId: Ref<string | undefined>
  currentAssistant: ComputedRef<ChatAssistant | undefined>
  hasAssistant: ComputedRef<boolean>
  setAssistantList: (assistantList: ChatAssistant[]) => void
  selectAssistant: (assistantId: string | undefined) => void
  updateAssistant: (assistantId: string, patch: Partial<Omit<ChatAssistant, 'id'>>) => void
  clearAssistant: () => void
}
