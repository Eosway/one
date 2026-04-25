import { describe, expect, it } from 'vitest'
import { useStreamChat, type ChatStreamEvent } from '../src'

describe('useStreamChat', () => {
  it('streams assistant messages into session state', async () => {
    const chat = useStreamChat({
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
    const chat = useStreamChat({
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
    const chat = useStreamChat({
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
