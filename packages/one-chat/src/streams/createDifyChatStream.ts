import type { ChatStream, ChatStreamMetadata, DifyChatStreamOptions } from '../types/public'
import { applyJsonHeaders, createSseIterable, getLastUserMessage, normalizeUsage, resolveHeaders } from './shared'

interface DifyChunk {
  event?: string
  answer?: string
  conversation_id?: string
  message_id?: string
  metadata?: {
    usage?: {
      prompt_tokens?: number
      completion_tokens?: number
      total_tokens?: number
    }
  }
  error?: string
}

export function createDifyChatStream(options: DifyChatStreamOptions): ChatStream {
  return async function* stream(request) {
    const lastUserMessage = getLastUserMessage(request.messages)
    if (!lastUserMessage) {
      throw new Error('Dify chat stream requires at least one user message.')
    }

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
        inputs: options.inputs ?? {},
        query: lastUserMessage.content,
        response_mode: 'streaming',
        conversation_id: request.conversationId,
        user: options.user,
      }),
    })) {
      const chunk = JSON.parse(message.data) as DifyChunk
      if (chunk.event === 'error') {
        throw new Error(chunk.error ?? 'Dify stream error.')
      }

      if (chunk.event === 'ping' || chunk.event === 'tts_message') {
        continue
      }

      const metadata: ChatStreamMetadata = {
        conversationId: chunk.conversation_id,
        messageId: chunk.message_id,
        usage: normalizeUsage(
          chunk.metadata?.usage?.prompt_tokens,
          chunk.metadata?.usage?.completion_tokens,
          chunk.metadata?.usage?.total_tokens,
          chunk.metadata?.usage
        ),
        raw: chunk,
      }

      if (!started) {
        yield { type: 'start', metadata }
        started = true
      } else if (hasMetadataUpdate(lastMetadata, metadata)) {
        yield { type: 'metadata', metadata }
      }

      lastMetadata = mergeMetadata(lastMetadata, metadata)

      if ((chunk.event === 'message' || chunk.event === 'agent_message') && chunk.answer) {
        yield {
          type: 'text-delta',
          text: chunk.answer,
          metadata: lastMetadata,
        }
      }

      if (!finished && chunk.event === 'message_end') {
        yield {
          type: 'finish',
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

function hasMetadataUpdate(previous: ChatStreamMetadata | undefined, next: ChatStreamMetadata): boolean {
  if (!previous) {
    return true
  }

  return previous.conversationId !== next.conversationId || previous.messageId !== next.messageId || previous.usage !== next.usage
}

function mergeMetadata(previous: ChatStreamMetadata | undefined, next: ChatStreamMetadata): ChatStreamMetadata {
  if (!previous) {
    return next
  }

  return {
    conversationId: next.conversationId ?? previous.conversationId,
    messageId: next.messageId ?? previous.messageId,
    usage: next.usage ?? previous.usage,
    raw: next.raw ?? previous.raw,
  }
}
