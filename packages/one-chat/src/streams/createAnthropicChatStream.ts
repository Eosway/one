import type { AnthropicChatStreamOptions, ChatStream, ChatStreamMetadata } from '../types/public'
import { applyJsonHeaders, createSseIterable, extractSystemPrompt, getConversationMessages, normalizeUsage, resolveHeaders } from './shared'

interface AnthropicEventChunk {
  type?: string
  message?: {
    id?: string
  }
  delta?: {
    type?: string
    text?: string
    stop_reason?: string | null
  }
  usage?: {
    input_tokens?: number
    output_tokens?: number
  }
  error?: {
    message?: string
  }
}

export function createAnthropicChatStream(options: AnthropicChatStreamOptions): ChatStream {
  return async function* stream(request) {
    const headers = await resolveHeaders(options.headers)
    applyJsonHeaders(headers)

    if (!headers.has('x-api-key') && !headers.has('X-API-Key')) {
      // keep optional for proxy mode
    }
    if (!headers.has('anthropic-version')) {
      headers.set('anthropic-version', options.anthropicVersion ?? '2023-06-01')
    }

    const system = extractSystemPrompt(request.messages)
    const messages = getConversationMessages(request.messages).map((item) => ({
      role: item.role,
      content: item.content,
    }))

    let started = false
    let finished = false
    let lastMetadata: ChatStreamMetadata | undefined

    for await (const message of createSseIterable(options.url, {
      fetch: options.fetch,
      method: 'POST',
      headers,
      signal: request.signal,
      body: JSON.stringify({
        ...options.body,
        model: options.model,
        max_tokens: options.maxTokens,
        stream: true,
        system,
        messages,
      }),
    })) {
      const chunk = JSON.parse(message.data) as AnthropicEventChunk
      const type = chunk.type ?? message.event

      if (type === 'error') {
        throw new Error(chunk.error?.message ?? 'Anthropic stream error.')
      }

      const metadata: ChatStreamMetadata = {
        messageId: chunk.message?.id,
        usage: normalizeUsage(chunk.usage?.input_tokens, chunk.usage?.output_tokens, undefined, chunk.usage),
        raw: chunk,
      }

      if (!started && type !== 'ping') {
        yield { type: 'start', metadata }
        started = true
      } else if (shouldEmitMetadata(lastMetadata, metadata)) {
        yield { type: 'metadata', metadata }
      }

      lastMetadata = mergeMetadata(lastMetadata, metadata)

      if (type === 'content_block_delta' && chunk.delta?.type === 'text_delta' && chunk.delta.text) {
        yield {
          type: 'text-delta',
          text: chunk.delta.text,
          metadata: lastMetadata,
        }
      }

      if (!finished && (type === 'message_stop' || chunk.delta?.stop_reason)) {
        yield {
          type: 'finish',
          finishReason: chunk.delta?.stop_reason ?? undefined,
          metadata: lastMetadata,
        }
        finished = true
      }
    }

    if (!started) {
      yield { type: 'start' }
    }

    if (!finished) {
      yield { type: 'finish', metadata: lastMetadata }
    }
  }
}

function shouldEmitMetadata(previous: ChatStreamMetadata | undefined, next: ChatStreamMetadata): boolean {
  const hasMeaningfulValue = next.messageId !== undefined || next.usage !== undefined
  if (!hasMeaningfulValue) {
    return false
  }

  if (!previous) {
    return true
  }

  return next.messageId !== undefined && previous.messageId !== next.messageId ? true : next.usage !== undefined && previous.usage !== next.usage
}

function mergeMetadata(previous: ChatStreamMetadata | undefined, next: ChatStreamMetadata): ChatStreamMetadata {
  if (!previous) {
    return next
  }

  return {
    messageId: next.messageId ?? previous.messageId,
    usage: next.usage ?? previous.usage,
    raw: next.raw ?? previous.raw,
  }
}
