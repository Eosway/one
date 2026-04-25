import type { ChatStream, ChatStreamMetadata, OpenAICompatibleChatStreamOptions } from '../types/public'
import { applyJsonHeaders, createSseIterable, normalizeUsage, resolveHeaders } from './shared'

interface OpenAICompatibleChunk {
  id?: string
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
  choices?: Array<{
    delta?: {
      content?: string
    }
    finish_reason?: string | null
  }>
}

export function createOpenAICompatibleChatStream(options: OpenAICompatibleChatStreamOptions): ChatStream {
  return async function* stream(request) {
    const headers = await resolveHeaders(options.headers)
    applyJsonHeaders(headers)

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
        stream: true,
        messages: request.messages.map((item) => ({
          role: item.role,
          content: item.content,
        })),
      }),
    })) {
      if (message.data === '[DONE]') {
        if (!started) {
          yield { type: 'start' }
          started = true
        }

        if (!finished) {
          yield { type: 'finish', metadata: lastMetadata }
          finished = true
        }
        break
      }

      const chunk = JSON.parse(message.data) as OpenAICompatibleChunk
      const choice = chunk.choices?.[0]
      const metadata: ChatStreamMetadata = {
        responseId: chunk.id,
        usage: normalizeUsage(chunk.usage?.prompt_tokens, chunk.usage?.completion_tokens, chunk.usage?.total_tokens, chunk.usage),
        raw: chunk,
      }

      if (!started) {
        yield { type: 'start', metadata }
        started = true
      } else if (hasMetadataUpdate(lastMetadata, metadata)) {
        yield { type: 'metadata', metadata }
      }

      lastMetadata = metadata

      const text = choice?.delta?.content
      if (typeof text === 'string' && text.length > 0) {
        yield { type: 'text-delta', text, metadata }
      }

      if (!finished && choice?.finish_reason) {
        yield {
          type: 'finish',
          finishReason: choice.finish_reason,
          metadata,
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

function hasMetadataUpdate(previous: ChatStreamMetadata | undefined, next: ChatStreamMetadata): boolean {
  if (!previous) {
    return true
  }

  return previous.responseId !== next.responseId || previous.usage !== next.usage
}
