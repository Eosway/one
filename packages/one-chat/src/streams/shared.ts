import { fetchSse } from '../sse/fetchSse'
import type { ChatMessage, ChatUsage, HeadersResolver } from '../types/public'

export async function resolveHeaders(resolver?: HeadersResolver): Promise<Headers> {
  if (!resolver) {
    return new Headers()
  }

  const resolved = typeof resolver === 'function' ? await resolver() : resolver
  return new Headers(resolved)
}

export function applyJsonHeaders(headers: Headers): void {
  if (!headers.has('Accept')) {
    headers.set('Accept', 'text/event-stream')
  }

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
}

export function extractSystemPrompt(messages: ChatMessage[]): string | undefined {
  const systemMessages = messages.filter((message) => message.role === 'system' && message.content)
  if (systemMessages.length === 0) {
    return undefined
  }

  return systemMessages.map((message) => message.content).join('\n\n')
}

export function getConversationMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter((message) => message.role !== 'system')
}

export function getLastUserMessage(messages: ChatMessage[]): ChatMessage | undefined {
  return [...messages].reverse().find((message) => message.role === 'user')
}

export function normalizeUsage(
  inputTokens: number | undefined,
  outputTokens: number | undefined,
  totalTokens: number | undefined,
  raw: unknown
): ChatUsage | undefined {
  if (inputTokens == null && outputTokens == null && totalTokens == null) {
    return undefined
  }

  return {
    inputTokens,
    outputTokens,
    totalTokens,
    raw,
  }
}

export function createSseIterable(url: string | URL, init: RequestInit & { fetch?: typeof globalThis.fetch; signal?: AbortSignal }) {
  return fetchSse(url, init)
}
