import { computed, ref, watch } from 'vue'
import {
  createAnthropicChatStream,
  createDifyChatStream,
  createOpenAICompatibleChatStream,
  type ChatAssistant,
  type ChatConversation,
  type ChatMessage,
  type ChatStream,
  type ChatStreamEvent,
  useChatAssistant,
  useChatConversation,
  useStreamChat,
} from '@eosway/one-chat'
import { createMockSseFetch } from '../mock/createMockSseFetch'

export type PlaygroundPlatform = 'openai-compatible' | 'anthropic' | 'dify'
export type PlaygroundMode = 'mock' | 'live'
export type PlaygroundScenario = 'normal' | 'slow' | 'error'

interface PlaygroundRequestLog {
  id: string
  timestamp: string
  platform: PlaygroundPlatform
  mode: PlaygroundMode
  scenario: PlaygroundScenario
  request: {
    url: string
    method: string
    headers: Record<string, string>
    body?: unknown
  }
}

interface PlaygroundEventLog {
  id: string
  timestamp: string
  event: ChatStreamEvent
}

const defaultAssistants: ChatAssistant[] = [
  {
    id: 'assistant-support',
    name: 'Support Assistant',
    description: '适合查看基础问答、错误处理和停止生成。',
    welcomeMessage: '这是一个用于联调基础对话链路的助手。',
    suggestions: ['给我一个简短欢迎词', '介绍当前会话状态', '演示一段流式回答'],
    metadata: {
      temperature: 0.3,
    },
  },
  {
    id: 'assistant-analyst',
    name: 'Analyst Assistant',
    description: '适合查看助手切换后的上下文和请求参数变化。',
    welcomeMessage: '你可以切换到这个助手，观察请求内容和回复风格的变化。',
    suggestions: ['总结最近三条消息', '给出一条排查建议', '说明当前上下文包含哪些信息'],
    metadata: {
      temperature: 0.1,
    },
  },
]

const defaultConversations: ChatConversation[] = [
  {
    id: 'conversation-alpha',
    title: 'Alpha 调试会话',
    assistantId: 'assistant-support',
    metadata: {
      remoteConversationId: 'remote-alpha',
    },
    messages: [
      {
        id: 'alpha-welcome',
        role: 'assistant',
        content: '这是一个预置会话，用于查看历史消息恢复效果。',
        status: 'done',
      },
    ],
  },
  {
    id: 'conversation-beta',
    title: 'Beta 历史会话',
    assistantId: 'assistant-analyst',
    metadata: {
      remoteConversationId: 'remote-beta',
    },
    messages: [
      {
        id: 'beta-user',
        role: 'user',
        content: '请记录这是一条历史消息。',
      },
      {
        id: 'beta-answer',
        role: 'assistant',
        content: '已记录。切换回这个会话时，消息和远端标识应能一起恢复。',
        status: 'done',
      },
    ],
  },
]

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function createHeadersRecord(headersText: string): Record<string, string> {
  const headers: Record<string, string> = {}
  for (const line of headersText.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) {
      continue
    }

    const separatorIndex = trimmed.indexOf(':')
    if (separatorIndex <= 0) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed.slice(separatorIndex + 1).trim()
    if (!key) {
      continue
    }

    headers[key] = value
  }

  return headers
}

function safeParseJson(value: string): Record<string, unknown> | undefined {
  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : undefined
  } catch {
    return undefined
  }
}

function parseRequestInit(init?: RequestInit): { method: string; headers: Record<string, string>; body?: unknown } {
  const headers = Object.fromEntries(new Headers(init?.headers).entries())
  let body: unknown

  if (typeof init?.body === 'string' && init.body.length > 0) {
    try {
      body = JSON.parse(init.body)
    } catch {
      body = init.body
    }
  }

  return {
    method: init?.method ?? 'GET',
    headers,
    body,
  }
}

function createMockFetch(options: {
  platform: PlaygroundPlatform
  scenario: PlaygroundScenario
  requestLogs: PlaygroundRequestLog[]
  requestLogsRef: { value: PlaygroundRequestLog[] }
}): typeof fetch {
  return createMockSseFetch(async (input, init) => {
    const request = parseRequestInit(init)
    const requestLog: PlaygroundRequestLog = {
      id: createId('request'),
      timestamp: new Date().toISOString(),
      platform: options.platform,
      mode: 'mock',
      scenario: options.scenario,
      request: {
        url: String(input),
        method: request.method,
        headers: request.headers,
        body: request.body,
      },
    }
    options.requestLogsRef.value = [requestLog, ...options.requestLogs].slice(0, 12)

    const slow = options.scenario === 'slow'
    const delay = slow ? 420 : 120

    if (options.scenario === 'error') {
      return {
        chunks: createErrorChunks(options.platform, delay),
      }
    }

    return {
      chunks: createSuccessChunks(options.platform, delay, request.body),
    }
  })
}

function createSuccessChunks(platform: PlaygroundPlatform, delay: number, body: unknown): Array<{ delay: number; event?: string; data: unknown }> {
  const assistantHint =
    typeof body === 'object' && body !== null && 'assistant_id' in body && typeof body.assistant_id === 'string'
      ? (body.assistant_id as string)
      : typeof body === 'object' && body !== null && 'metadata' in body
        ? 'metadata'
        : 'default'

  if (platform === 'openai-compatible') {
    return [
      {
        delay,
        data: {
          id: 'resp_mock_1',
          choices: [
            {
              delta: {
                content: '这是 OpenAI-compatible 返回的第一段内容。',
              },
              finish_reason: null,
            },
          ],
        },
      },
      {
        delay,
        data: {
          id: 'resp_mock_1',
          choices: [
            {
              delta: {
                content: ` 当前助手标识为 ${assistantHint}。`,
              },
              finish_reason: null,
            },
          ],
        },
      },
      {
        delay,
        data: {
          id: 'resp_mock_1',
          choices: [
            {
              delta: {
                content: ' 这段内容可用于检查增量拼接、结束状态和 usage 汇总。',
              },
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: 18,
            completion_tokens: 26,
            total_tokens: 44,
          },
        },
      },
      {
        delay,
        data: '[DONE]',
      },
    ]
  }

  if (platform === 'anthropic') {
    return [
      {
        delay,
        event: 'message_start',
        data: {
          type: 'message_start',
          message: {
            id: 'msg_mock_1',
          },
          usage: {
            input_tokens: 14,
          },
        },
      },
      {
        delay,
        event: 'content_block_delta',
        data: {
          type: 'content_block_delta',
          delta: {
            type: 'text_delta',
            text: 'Anthropic 语义层已经开始产出文本增量。',
          },
        },
      },
      {
        delay,
        event: 'content_block_delta',
        data: {
          type: 'content_block_delta',
          delta: {
            type: 'text_delta',
            text: ` 当前助手标识为 ${assistantHint}。`,
          },
        },
      },
      {
        delay,
        event: 'message_delta',
        data: {
          type: 'message_delta',
          delta: {
            stop_reason: 'end_turn',
          },
          usage: {
            output_tokens: 22,
          },
        },
      },
      {
        delay,
        event: 'message_stop',
        data: {
          type: 'message_stop',
        },
      },
    ]
  }

  return [
    {
      delay,
      data: {
        event: 'message',
        answer: 'Dify 语义层首段输出。',
        conversation_id: 'dify-conversation-mock',
        message_id: 'dify-message-1',
      },
    },
    {
      delay,
      data: {
        event: 'message',
        answer: ` 当前助手标识为 ${assistantHint}，可用于观察 conversation_id 与 message_id 的变化。`,
        conversation_id: 'dify-conversation-mock',
        message_id: 'dify-message-1',
      },
    },
    {
      delay,
      data: {
        event: 'message_end',
        conversation_id: 'dify-conversation-mock',
        message_id: 'dify-message-1',
        metadata: {
          usage: {
            prompt_tokens: 12,
            completion_tokens: 24,
            total_tokens: 36,
          },
        },
      },
    },
  ]
}

function createErrorChunks(platform: PlaygroundPlatform, delay: number): Array<{ delay: number; event?: string; data: unknown }> {
  if (platform === 'anthropic') {
    return [
      {
        delay,
        event: 'error',
        data: {
          type: 'error',
          error: {
            message: 'Mock anthropic stream error.',
          },
        },
      },
    ]
  }

  if (platform === 'dify') {
    return [
      {
        delay,
        data: {
          event: 'error',
          error: 'Mock dify stream error.',
        },
      },
    ]
  }

  return [
    {
      delay,
      data: {
        id: 'resp_mock_error',
        choices: [
          {
            delta: {
              content: '这是一段错误前的输出。',
            },
            finish_reason: null,
          },
        ],
      },
    },
    {
      delay,
      data: 'not-json',
    },
  ]
}

function createPlaygroundStream(options: {
  platform: PlaygroundPlatform
  mode: PlaygroundMode
  scenario: PlaygroundScenario
  url: string
  headersText: string
  model: string
  maxTokens: number
  difyUser: string
  bodyText: string
  requestLogs: { value: PlaygroundRequestLog[] }
}): ChatStream {
  const headers = createHeadersRecord(options.headersText)
  const extraBody = safeParseJson(options.bodyText)
  const fetcher =
    options.mode === 'mock'
      ? createMockFetch({
          platform: options.platform,
          scenario: options.scenario,
          requestLogs: options.requestLogs.value,
          requestLogsRef: options.requestLogs,
        })
      : undefined

  if (options.platform === 'anthropic') {
    return createAnthropicChatStream({
      url: options.url,
      model: options.model,
      maxTokens: options.maxTokens,
      headers,
      body: (request) => ({
        ...(extraBody ?? {}),
        metadata: {
          assistantId: request.assistantId,
          conversationId: request.conversationId,
        },
      }),
      fetch: fetcher,
    })
  }

  if (options.platform === 'dify') {
    return createDifyChatStream({
      url: options.url,
      user: options.difyUser,
      headers,
      inputs: (request) => ({
        ...(extraBody ?? {}),
        assistantId: request.assistantId,
      }),
      body: (request) => ({
        assistant_id: request.assistantId,
      }),
      fetch: fetcher,
    })
  }

  return createOpenAICompatibleChatStream({
    url: options.url,
    model: options.model,
    headers,
    body: (request) => ({
      ...(extraBody ?? {}),
      assistant_id: request.assistantId,
      conversation_id: request.conversationId,
    }),
    fetch: fetcher,
  })
}

function wrapWithEventLogging(streamFactory: () => ChatStream, eventLogs: { value: PlaygroundEventLog[] }): ChatStream {
  return async function* stream(request) {
    const streamInstance = streamFactory()
    for await (const event of streamInstance(request)) {
      eventLogs.value = [
        {
          id: createId('event'),
          timestamp: new Date().toISOString(),
          event,
        },
        ...eventLogs.value,
      ].slice(0, 40)
      yield event
    }
  }
}

function cloneMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((message) => ({
    ...message,
    metadata: message.metadata ? { ...message.metadata } : undefined,
  }))
}

export function useOneChatPlayground() {
  const mode = ref<PlaygroundMode>('mock')
  const platform = ref<PlaygroundPlatform>('openai-compatible')
  const scenario = ref<PlaygroundScenario>('normal')
  const url = ref('https://example.com/v1/chat/completions')
  const headersText = ref('Authorization: Bearer demo-token')
  const model = ref('gpt-4.1-mini')
  const maxTokens = ref(512)
  const difyUser = ref('playground-user')
  const bodyText = ref('')
  const draft = ref('')
  const requestLogs = ref<PlaygroundRequestLog[]>([])
  const eventLogs = ref<PlaygroundEventLog[]>([])

  const assistants = useChatAssistant({
    initialAssistantList: defaultAssistants,
    initialAssistantId: defaultAssistants[0]?.id,
  })

  const conversations = useChatConversation({
    initialConversationList: defaultConversations,
    initialConversationId: defaultConversations[0]?.id,
  })

  const streamFactory = computed(() =>
    wrapWithEventLogging(
      () =>
        createPlaygroundStream({
          platform: platform.value,
          mode: mode.value,
          scenario: scenario.value,
          url: url.value,
          headersText: headersText.value,
          model: model.value,
          maxTokens: maxTokens.value,
          difyUser: difyUser.value,
          bodyText: bodyText.value,
          requestLogs,
        }),
      eventLogs
    )
  )

  const chat = useStreamChat({
    stream: async function* (request) {
      const currentAssistant = assistants.currentAssistant.value
      const nextRequest = {
        ...request,
        assistantId: currentAssistant?.id ?? request.assistantId,
        metadata: {
          ...(request.metadata ?? {}),
          assistant: currentAssistant
            ? {
                id: currentAssistant.id,
                name: currentAssistant.name,
              }
            : undefined,
        },
      }

      for await (const event of streamFactory.value(nextRequest)) {
        yield event
      }
    },
    initialMessages: cloneMessages(conversations.currentConversation.value?.messages ?? []),
    initialMetadata: {
      conversationId: conversations.currentConversation.value?.metadata?.remoteConversationId as string | undefined,
    },
    conversationId: computed(() => conversations.currentConversation.value?.metadata?.remoteConversationId as string | undefined),
    assistantId: assistants.currentAssistantId,
  })

  const latestAssistantMessage = computed(() => [...chat.messages.value].reverse().find((message) => message.role === 'assistant'))
  const currentConversationTitle = computed(() => conversations.currentConversation.value?.title ?? '未命名会话')
  const currentAssistantName = computed(() => assistants.currentAssistant.value?.name ?? '未选择助手')

  function syncConversationState(): void {
    const currentConversationId = conversations.currentConversationId.value
    if (!currentConversationId) {
      return
    }

    conversations.updateConversation(currentConversationId, {
      assistantId: assistants.currentAssistantId.value,
      messages: cloneMessages(chat.messages.value),
      metadata: {
        ...(conversations.currentConversation.value?.metadata ?? {}),
        remoteConversationId: chat.metadata.value?.conversationId ?? conversations.currentConversation.value?.metadata?.remoteConversationId,
        remoteMessageId: chat.metadata.value?.messageId,
      },
    })
  }

  watch(
    () => chat.messages.value,
    () => {
      syncConversationState()
    },
    { deep: true }
  )

  watch(
    () => chat.metadata.value,
    () => {
      syncConversationState()
    },
    { deep: true }
  )

  watch(
    () => conversations.currentConversationId.value,
    (conversationId: string | undefined) => {
      const conversation = conversations.conversationList.value.find((item) => item.id === conversationId)
      chat.setMessages(cloneMessages(conversation?.messages ?? []))
      chat.setMetadata({
        conversationId: conversation?.metadata?.remoteConversationId as string | undefined,
        messageId: conversation?.metadata?.remoteMessageId as string | undefined,
      })

      if (conversation?.assistantId && assistants.assistantList.value.some((item) => item.id === conversation.assistantId)) {
        assistants.selectAssistant(conversation.assistantId)
      }
    },
    { immediate: true }
  )

  watch(
    () => assistants.currentAssistantId.value,
    (assistantId: string | undefined) => {
      const currentConversationId = conversations.currentConversationId.value
      if (!currentConversationId) {
        return
      }

      conversations.updateConversation(currentConversationId, {
        assistantId,
      })
    }
  )

  watch(
    () => platform.value,
    (nextPlatform: PlaygroundPlatform) => {
      if (nextPlatform === 'anthropic') {
        url.value = 'https://example.com/v1/messages'
        model.value = 'claude-3-7-sonnet-latest'
        headersText.value = 'x-api-key: demo-key\nanthropic-version: 2023-06-01'
        return
      }

      if (nextPlatform === 'dify') {
        url.value = 'https://example.com/v1/chat-messages'
        headersText.value = 'Authorization: Bearer app-demo-token'
        return
      }

      url.value = 'https://example.com/v1/chat/completions'
      model.value = 'gpt-4.1-mini'
      headersText.value = 'Authorization: Bearer demo-token'
    },
    { immediate: true }
  )

  async function sendMessage(): Promise<void> {
    const content = draft.value.trim()
    if (!content) {
      return
    }

    draft.value = ''
    try {
      await chat.send({
        content,
        metadata: {
          from: 'playground',
        },
      })
    } catch (error) {
      void error
    }
  }

  function createConversation(): void {
    const currentAssistant = assistants.currentAssistant.value
    const conversation = conversations.createConversation({
      title: `新会话 ${conversations.conversationList.value.length + 1}`,
      assistantId: currentAssistant?.id,
      metadata: {},
      messages: currentAssistant?.welcomeMessage
        ? [
            {
              id: createId('welcome'),
              role: 'assistant',
              content: currentAssistant.welcomeMessage,
              status: 'done',
            },
          ]
        : [],
    })

    chat.setMessages(cloneMessages(conversation.messages))
    chat.setMetadata(undefined)
  }

  function removeCurrentConversation(): void {
    const currentConversationId = conversations.currentConversationId.value
    if (!currentConversationId) {
      return
    }

    conversations.removeConversation(currentConversationId)
  }

  function clearLogs(): void {
    requestLogs.value = []
    eventLogs.value = []
  }

  function resetCurrentConversation(): void {
    chat.clear()
    const currentConversationId = conversations.currentConversationId.value
    if (!currentConversationId) {
      return
    }

    conversations.updateConversation(currentConversationId, {
      messages: [],
      metadata: {
        ...(conversations.currentConversation.value?.metadata ?? {}),
        remoteConversationId: undefined,
        remoteMessageId: undefined,
      },
    })
  }

  function applySuggestion(content: string): void {
    draft.value = content
  }

  return {
    mode,
    platform,
    scenario,
    url,
    headersText,
    model,
    maxTokens,
    difyUser,
    bodyText,
    draft,
    requestLogs,
    eventLogs,
    assistants,
    conversations,
    chat,
    latestAssistantMessage,
    currentConversationTitle,
    currentAssistantName,
    sendMessage,
    createConversation,
    removeCurrentConversation,
    clearLogs,
    resetCurrentConversation,
    applySuggestion,
  }
}
