import { describe, expect, it } from 'vitest'
import { FetchSseHttpError, FetchSseProtocolError, fetchSse, useFetchSse } from '../src'
import { createSseResponse } from './helpers'

describe('fetchSse', () => {
  it('parses standard SSE messages', async () => {
    const messages = []
    const response = createSseResponse(['id: 1\nevent: delta\ndata: hello\ndata: world\n\n'])

    for await (const message of fetchSse('https://example.com/sse', {
      fetch: async () => response,
    })) {
      messages.push(message)
    }

    expect(messages).toEqual([
      {
        id: '1',
        event: 'delta',
        data: 'hello\nworld',
      },
    ])
  })

  it('throws on non-2xx responses', async () => {
    const response = new Response('bad request', {
      status: 400,
      statusText: 'Bad Request',
      headers: {
        'content-type': 'text/plain',
      },
    })

    const iterator = fetchSse('https://example.com/sse', {
      fetch: async () => response,
    })

    await expect(iterator.next()).rejects.toBeInstanceOf(FetchSseHttpError)
  })

  it('throws when content type is not event stream', async () => {
    const response = new Response('ok', {
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
    })

    const iterator = fetchSse('https://example.com/sse', {
      fetch: async () => response,
    })

    await expect(iterator.next()).rejects.toBeInstanceOf(FetchSseProtocolError)
  })

  it('creates a bound fetchSse initializer with merged options', async () => {
    const boundFetchSse = useFetchSse({
      method: 'POST',
      headers: {
        Authorization: 'Bearer base-token',
        'X-Base': '1',
      },
      fetch: async (_input, init) => {
        expect(init?.method).toBe('POST')
        expect(new Headers(init?.headers).get('authorization')).toBe('Bearer override-token')
        expect(new Headers(init?.headers).get('x-base')).toBe('1')
        expect(new Headers(init?.headers).get('x-extra')).toBe('2')

        return createSseResponse(['data: hello\n\n'])
      },
    })

    const messages = []
    for await (const message of boundFetchSse('https://example.com/sse', {
      headers: {
        Authorization: 'Bearer override-token',
        'X-Extra': '2',
      },
    })) {
      messages.push(message)
    }

    expect(messages).toEqual([
      {
        event: 'message',
        data: 'hello',
      },
    ])
  })
})
