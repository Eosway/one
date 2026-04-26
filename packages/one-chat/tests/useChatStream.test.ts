import { computed, ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { useChatStream, type ChatStreamEvent } from '../src'

describe('useChatStream', () => {
  it('streams assistant messages into session state', async () => {
    const chat = useChatStream({
      createId: createIncrementalId(),
      stream: async function* (): AsyncGenerator<ChatStreamEvent> {
        yield { type: 'start' }
        yield { type: 'text-delta', text: 'Hel' }
        yield { type: 'text-delta', text: 'lo' }
        yield { type: 'finish', finishReason: 'stop' }
      },
    })

    await chat.send('Hi')

    expect(chat.status.value).toBe('idle')
    expect(chat.messages.value).toEqual([
      {
        id: 'id-1',
        role: 'user',
        content: 'Hi',
      },
      {
        id: 'id-2',
        role: 'assistant',
        content: 'Hello',
        status: 'done',
      },
    ])
  })

  it('retries the last request snapshot', async () => {
    let count = 0
    const chat = useChatStream({
      createId: createIncrementalId(),
      stream: async function* (): AsyncGenerator<ChatStreamEvent> {
        count += 1
        yield { type: 'start' }
        yield { type: 'text-delta', text: `run-${count}` }
        yield { type: 'finish' }
      },
    })

    await chat.send('Hi')
    await chat.retry()

    expect(chat.messages.value[1]).toMatchObject({
      role: 'assistant',
      content: 'run-2',
    })
  })

  it('stops an active stream', async () => {
    const chat = useChatStream({
      createId: createIncrementalId(),
      stream: async function* ({ signal }): AsyncGenerator<ChatStreamEvent> {
        yield { type: 'start' }
        yield { type: 'text-delta', text: 'partial' }
        await waitForAbort(signal!)
      },
    })

    const sending = chat.send('Hi')
    await Promise.resolve()
    chat.stop()
    await sending

    expect(chat.status.value).toBe('idle')
    expect(chat.messages.value[1]).toMatchObject({
      role: 'assistant',
      content: 'partial',
      status: 'done',
    })
  })

  it('passes conversation and assistant context into stream requests', async () => {
    const conversationId = ref('conversation-1')
    const assistantId = computed(() => 'assistant-1')
    const receivedRequests: Array<{ conversationId?: string; assistantId?: string }> = []

    const chat = useChatStream({
      createId: createIncrementalId(),
      conversationId,
      assistantId,
      stream: async function* (request): AsyncGenerator<ChatStreamEvent> {
        receivedRequests.push({
          conversationId: request.conversationId,
          assistantId: request.assistantId,
        })
        yield { type: 'start' }
        yield { type: 'finish' }
      },
    })

    await chat.send('Hello')

    conversationId.value = 'conversation-2'
    await chat.retry()

    expect(receivedRequests).toEqual([
      {
        conversationId: 'conversation-1',
        assistantId: 'assistant-1',
      },
      {
        conversationId: 'conversation-2',
        assistantId: 'assistant-1',
      },
    ])
  })

  it('allows replacing metadata when restoring another conversation', async () => {
    const requests: Array<{ conversationId?: string }> = []
    const chat = useChatStream({
      createId: createIncrementalId(),
      stream: async function* (request): AsyncGenerator<ChatStreamEvent> {
        requests.push({ conversationId: request.conversationId })
        yield {
          type: 'start',
          metadata: {
            conversationId: 'remote-conversation-1',
          },
        }
        yield { type: 'finish' }
      },
    })

    await chat.send('Hello')

    chat.setMessages([
      {
        id: 'id-3',
        role: 'user',
        content: 'Restored',
      },
    ])
    chat.setMetadata({
      conversationId: 'remote-conversation-2',
    })

    await chat.retry()

    expect(requests).toEqual([
      {
        conversationId: undefined,
      },
      {
        conversationId: 'remote-conversation-2',
      },
    ])
  })
})

function createIncrementalId(): () => string {
  let index = 0
  return () => {
    index += 1
    return `id-${index}`
  }
}

function waitForAbort(signal: AbortSignal): Promise<never> {
  return new Promise((_, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }

    signal.addEventListener(
      'abort',
      () => {
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true }
    )
  })
}
