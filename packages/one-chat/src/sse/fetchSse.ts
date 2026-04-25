import { createParser, type ParseError } from 'eventsource-parser'
import type { EventSourceMessage } from 'eventsource-parser'
import type { FetchSse, FetchSseOptions, SseMessage } from '../types/public'

export class FetchSseHttpError extends Error {
  response: Response
  status: number
  statusText: string
  bodyText?: string

  constructor(response: Response, bodyText?: string) {
    super(`SSE request failed with status ${response.status} ${response.statusText}`)
    this.name = 'FetchSseHttpError'
    this.response = response
    this.status = response.status
    this.statusText = response.statusText
    this.bodyText = bodyText
  }
}

export class FetchSseProtocolError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message)
    this.name = 'FetchSseProtocolError'
    if (options?.cause !== undefined) {
      Reflect.set(this, 'cause', options.cause)
    }
  }
}

export async function* fetchSse(input: RequestInfo | URL, options: FetchSseOptions = {}): AsyncGenerator<SseMessage, void, void> {
  const fetcher = options.fetch ?? globalThis.fetch
  if (typeof fetcher !== 'function') {
    throw new TypeError('A fetch implementation is required for fetchSse().')
  }

  const controller = new AbortController()
  const detachAbort = forwardAbort(options.signal, controller)
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined

  try {
    const headers = new Headers(options.headers)
    if (!headers.has('Accept')) {
      headers.set('Accept', 'text/event-stream')
    }

    const response = await fetcher(input, {
      ...options,
      headers,
      signal: controller.signal,
    })

    if (!response.ok) {
      throw await createHttpError(response)
    }

    await options.validateResponse?.(response)

    if (options.requireContentType !== false) {
      validateContentType(response)
    }

    if (!response.body) {
      throw new FetchSseProtocolError('SSE response body is empty.')
    }

    reader = response.body.getReader()
    const decoder = new TextDecoder()
    const queue: SseMessage[] = []
    let parseError: FetchSseProtocolError | undefined

    const parser = createParser({
      onEvent(event: EventSourceMessage) {
        queue.push({
          id: event.id || undefined,
          event: event.event || 'message',
          data: event.data,
        })
      },
      onError(error: ParseError) {
        parseError = new FetchSseProtocolError(`Invalid SSE stream: ${error.type}.`, { cause: error })
      },
    })

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }

      parser.feed(decoder.decode(value, { stream: true }))
      if (parseError) {
        throw parseError
      }

      while (queue.length > 0) {
        yield queue.shift()!
      }
    }

    const trailing = decoder.decode()
    if (trailing) {
      parser.feed(trailing)
    }

    parser.reset({ consume: true })
    if (parseError) {
      throw parseError
    }

    while (queue.length > 0) {
      yield queue.shift()!
    }
  } finally {
    detachAbort()
    controller.abort()

    if (reader) {
      try {
        await reader.cancel()
      } catch (error) {
        void error
      }
      reader.releaseLock()
    }
  }
}

export function useFetchSse(defaultOptions: FetchSseOptions = {}): FetchSse {
  return function boundFetchSse(input: RequestInfo | URL, options: FetchSseOptions = {}) {
    return fetchSse(input, mergeFetchSseOptions(defaultOptions, options))
  }
}

async function createHttpError(response: Response): Promise<FetchSseHttpError> {
  let bodyText: string | undefined

  try {
    bodyText = await response.clone().text()
  } catch (error) {
    void error
  }

  return new FetchSseHttpError(response, bodyText)
}

function validateContentType(response: Response): void {
  const contentType = response.headers.get('content-type')
  if (!contentType || !contentType.toLowerCase().includes('text/event-stream')) {
    throw new FetchSseProtocolError(`Expected "text/event-stream" but received "${contentType ?? 'unknown'}".`)
  }
}

function forwardAbort(signal: AbortSignal | undefined, controller: AbortController): () => void {
  if (!signal) {
    return () => {}
  }

  if (signal.aborted) {
    controller.abort(signal.reason)
    return () => {}
  }

  const abort = () => controller.abort(signal.reason)
  signal.addEventListener('abort', abort, { once: true })

  return () => {
    signal.removeEventListener('abort', abort)
  }
}

function mergeFetchSseOptions(base: FetchSseOptions, override: FetchSseOptions): FetchSseOptions {
  const headers = new Headers(base.headers)
  const overrideHeaders = new Headers(override.headers)
  overrideHeaders.forEach((value, key) => {
    headers.set(key, value)
  })

  return {
    ...base,
    ...override,
    headers,
    signal: override.signal ?? base.signal,
    fetch: override.fetch ?? base.fetch,
    validateResponse: override.validateResponse ?? base.validateResponse,
    requireContentType: override.requireContentType ?? base.requireContentType,
  }
}
