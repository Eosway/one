interface MockSseChunk {
  delay?: number
  event?: string
  data: unknown
}

interface MockSseResponseOptions {
  status?: number
  statusText?: string
  headers?: HeadersInit
  chunks?: MockSseChunk[]
}

const encoder = new TextEncoder()

export function createMockSseFetch(
  handler: (input: RequestInfo | URL, init?: RequestInit) => MockSseResponseOptions | Promise<MockSseResponseOptions>
): typeof fetch {
  return async (input, init) => {
    const response = await handler(input, init)
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        for (const chunk of response.chunks ?? []) {
          if (chunk.delay && chunk.delay > 0) {
            await sleep(chunk.delay)
          }

          const lines = []
          if (chunk.event) {
            lines.push(`event: ${chunk.event}`)
          }
          lines.push(`data: ${typeof chunk.data === 'string' ? chunk.data : JSON.stringify(chunk.data)}`)
          lines.push('')

          controller.enqueue(encoder.encode(lines.join('\n')))
        }

        controller.close()
      },
      cancel() {
        return undefined
      },
    })

    return new Response(stream, {
      status: response.status ?? 200,
      statusText: response.statusText ?? 'OK',
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        ...(response.headers ?? {}),
      },
    })
  }
}

function sleep(delay: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, delay))
}
