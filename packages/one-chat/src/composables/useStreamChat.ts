import { computed, getCurrentScope, onScopeDispose, ref, shallowRef } from 'vue'
import type { ChatMessage, ChatStreamMetadata, SendMessageInput, StreamChatStatus, UseStreamChatOptions, UseStreamChatReturn } from '../types/public'

const defaultCreateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function useStreamChat(options: UseStreamChatOptions): UseStreamChatReturn {
  const createId = options.createId ?? defaultCreateId
  const messages = ref<ChatMessage[]>(cloneMessages(options.initialMessages ?? []))
  const status = ref<StreamChatStatus>('idle')
  const error = shallowRef<unknown>()
  const metadata = shallowRef<ChatStreamMetadata>()
  const isStreaming = computed(() => status.value === 'submitting' || status.value === 'streaming')
  const canRetry = computed(() => lastRequestMessages.value.length > 0 && !isStreaming.value)

  const lastRequestMessages = shallowRef<ChatMessage[]>([])
  let currentAbortController: AbortController | undefined

  if (getCurrentScope()) {
    onScopeDispose(() => {
      stop()
    })
  }

  async function send(input: string | SendMessageInput): Promise<ChatMessage | undefined> {
    ensureIdle()
    error.value = undefined

    const userMessage = normalizeInput(input, createId)
    const nextMessages = [...messages.value, userMessage]

    messages.value = nextMessages
    return runStream(nextMessages)
  }

  async function retry(): Promise<ChatMessage | undefined> {
    ensureIdle()

    if (lastRequestMessages.value.length === 0) {
      return undefined
    }

    messages.value = cloneMessages(lastRequestMessages.value)
    error.value = undefined
    return runStream(messages.value)
  }

  function stop(): void {
    currentAbortController?.abort()
  }

  function clear(): void {
    stop()
    messages.value = []
    status.value = 'idle'
    error.value = undefined
    metadata.value = undefined
    lastRequestMessages.value = []
  }

  function setMessages(nextMessages: ChatMessage[]): void {
    messages.value = cloneMessages(nextMessages)
  }

  async function runStream(requestMessages: ChatMessage[]): Promise<ChatMessage | undefined> {
    const requestSnapshot = cloneMessages(requestMessages)
    const assistantMessage: ChatMessage = {
      id: createId(),
      role: 'assistant',
      content: '',
      status: 'streaming',
    }

    lastRequestMessages.value = requestSnapshot
    messages.value = [...requestSnapshot, assistantMessage]
    status.value = 'submitting'

    const abortController = new AbortController()
    currentAbortController = abortController

    try {
      for await (const event of options.stream({
        messages: requestSnapshot,
        signal: abortController.signal,
        conversationId: metadata.value?.conversationId,
        assistantId: metadata.value?.messageId,
      })) {
        if (event.type === 'start') {
          status.value = 'streaming'
          mergeMetadata(event.metadata)
          continue
        }

        if (event.type === 'metadata') {
          mergeMetadata(event.metadata)
          continue
        }

        if (event.type === 'text-delta') {
          status.value = 'streaming'
          assistantMessage.content += event.text
          mergeMetadata(event.metadata)
          continue
        }

        if (event.type === 'finish') {
          assistantMessage.status = 'done'
          mergeMetadata(event.metadata)
          status.value = 'idle'
        }
      }

      if (assistantMessage.status === 'streaming') {
        assistantMessage.status = 'done'
        status.value = 'idle'
      }

      return assistantMessage
    } catch (caught) {
      if (isAbortError(caught)) {
        assistantMessage.status = 'done'
        status.value = 'idle'
        return assistantMessage
      }

      assistantMessage.status = 'error'
      error.value = caught
      status.value = 'error'
      throw caught
    } finally {
      if (currentAbortController === abortController) {
        currentAbortController = undefined
      }
    }
  }

  function mergeMetadata(nextMetadata: ChatStreamMetadata | undefined): void {
    if (!nextMetadata) {
      return
    }

    metadata.value = {
      conversationId: nextMetadata.conversationId ?? metadata.value?.conversationId,
      messageId: nextMetadata.messageId ?? metadata.value?.messageId,
      responseId: nextMetadata.responseId ?? metadata.value?.responseId,
      usage: nextMetadata.usage ?? metadata.value?.usage,
      raw: nextMetadata.raw ?? metadata.value?.raw,
    }
  }

  function ensureIdle(): void {
    if (isStreaming.value) {
      throw new Error('Cannot start a new stream while another stream is active.')
    }
  }

  return {
    messages,
    status,
    error,
    metadata,
    isStreaming,
    canRetry,
    send,
    stop,
    retry,
    clear,
    setMessages,
  }
}

function normalizeInput(input: string | SendMessageInput, createId: () => string): ChatMessage {
  if (typeof input === 'string') {
    return {
      id: createId(),
      role: 'user',
      content: input,
    }
  }

  return {
    id: createId(),
    role: 'user',
    content: input.content,
    metadata: input.metadata,
  }
}

function cloneMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((message) => ({
    ...message,
    metadata: message.metadata ? { ...message.metadata } : undefined,
  }))
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException ? error.name === 'AbortError' : error instanceof Error && error.name === 'AbortError'
}
