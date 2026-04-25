export function createTextStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()

  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk))
      }
      controller.close()
    },
  })
}

export function createSseResponse(chunks: string[], init: ResponseInit = {}): Response {
  return new Response(createTextStream(chunks), {
    status: 200,
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
    },
    ...init,
  })
}
