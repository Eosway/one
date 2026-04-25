import { describe, expect, it } from 'vitest'
import { createAnthropicChatStream, createDifyChatStream, createOpenAICompatibleChatStream, type ChatMessage } from '../src'
import { createSseResponse } from './helpers'

const messages: ChatMessage[] = [
  {
    id: 'user-1',
    role: 'user',
    content: 'hello',
  },
]

describe('chat stream adapters', () => {
  it('maps OpenAI-compatible chunks to chat events', async () => {
    const stream = createOpenAICompatibleChatStream({
      url: 'https://example.com/v1/chat/completions',
      model: 'gpt-test',
      fetch: async () =>
        createSseResponse([
          'data: {"id":"resp_1","choices":[{"delta":{"content":"Hel"},"finish_reason":null}]}\n\n',
          'data: {"id":"resp_1","choices":[{"delta":{"content":"lo"},"finish_reason":"stop"}],"usage":{"prompt_tokens":1,"completion_tokens":2,"total_tokens":3}}\n\n',
          'data: [DONE]\n\n',
        ]),
    })

    const events = []
    for await (const event of stream({ messages })) {
      events.push(event)
    }

    expect(events).toEqual([
      {
        type: 'start',
        metadata: {
          responseId: 'resp_1',
          usage: undefined,
          raw: {
            id: 'resp_1',
            choices: [{ delta: { content: 'Hel' }, finish_reason: null }],
          },
        },
      },
      {
        type: 'text-delta',
        text: 'Hel',
        metadata: {
          responseId: 'resp_1',
          usage: undefined,
          raw: {
            id: 'resp_1',
            choices: [{ delta: { content: 'Hel' }, finish_reason: null }],
          },
        },
      },
      {
        type: 'metadata',
        metadata: {
          responseId: 'resp_1',
          usage: {
            inputTokens: 1,
            outputTokens: 2,
            totalTokens: 3,
            raw: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
          },
          raw: {
            id: 'resp_1',
            choices: [{ delta: { content: 'lo' }, finish_reason: 'stop' }],
            usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
          },
        },
      },
      {
        type: 'text-delta',
        text: 'lo',
        metadata: {
          responseId: 'resp_1',
          usage: {
            inputTokens: 1,
            outputTokens: 2,
            totalTokens: 3,
            raw: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
          },
          raw: {
            id: 'resp_1',
            choices: [{ delta: { content: 'lo' }, finish_reason: 'stop' }],
            usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
          },
        },
      },
      {
        type: 'finish',
        finishReason: 'stop',
        metadata: {
          responseId: 'resp_1',
          usage: {
            inputTokens: 1,
            outputTokens: 2,
            totalTokens: 3,
            raw: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
          },
          raw: {
            id: 'resp_1',
            choices: [{ delta: { content: 'lo' }, finish_reason: 'stop' }],
            usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
          },
        },
      },
    ])
  })

  it('maps Anthropic chunks to chat events', async () => {
    const stream = createAnthropicChatStream({
      url: 'https://example.com/v1/messages',
      model: 'claude-test',
      maxTokens: 256,
      fetch: async () =>
        createSseResponse([
          'event: message_start\ndata: {"type":"message_start","message":{"id":"msg_1"},"usage":{"input_tokens":1}}\n\n',
          'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hel"}}\n\n',
          'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"lo"}}\n\n',
          'event: message_delta\ndata: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":2}}\n\n',
          'event: message_stop\ndata: {"type":"message_stop"}\n\n',
        ]),
    })

    const events = []
    for await (const event of stream({ messages })) {
      events.push(event)
    }

    expect(events[0]).toMatchObject({ type: 'start' })
    expect(events[1]).toMatchObject({ type: 'text-delta', text: 'Hel' })
    expect(events[2]).toMatchObject({ type: 'text-delta', text: 'lo' })
    expect(events[3]).toMatchObject({ type: 'metadata' })
    expect(events[4]).toMatchObject({ type: 'finish', finishReason: 'end_turn' })
  })

  it('maps Dify chunks to chat events', async () => {
    const stream = createDifyChatStream({
      url: 'https://example.com/v1/chat-messages',
      user: 'user-1',
      headers: {
        Authorization: 'Bearer dify-token',
      },
      fetch: async () =>
        createSseResponse([
          'data: {"event":"message","answer":"Hel","conversation_id":"conv_1","message_id":"msg_1"}\n\n',
          'data: {"event":"message","answer":"lo","conversation_id":"conv_1","message_id":"msg_1"}\n\n',
          'data: {"event":"message_end","conversation_id":"conv_1","message_id":"msg_1","metadata":{"usage":{"prompt_tokens":1,"completion_tokens":2,"total_tokens":3}}}\n\n',
        ]),
    })

    const events = []
    for await (const event of stream({ messages })) {
      events.push(event)
    }

    expect(events[0]).toMatchObject({ type: 'start' })
    expect(events[1]).toMatchObject({ type: 'text-delta', text: 'Hel' })
    expect(events[2]).toMatchObject({ type: 'text-delta', text: 'lo' })
    expect(events[3]).toMatchObject({ type: 'metadata' })
    expect(events[4]).toMatchObject({ type: 'finish' })
  })
})
