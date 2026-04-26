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
  useChatStream,
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
    description: '适合基础问答、错误处理和停止生成。',
    welcomeMessage: '这是一个用于联调基础对话链路的助手。',
    suggestions: ['给我一个简短欢迎词', '介绍当前会话状态', '演示一段流式回答'],
    metadata: {
      temperature: 0.3,
    },
  },
  {
    id: 'assistant-analyst',
    name: 'Analyst Assistant',
    description: '观查助手切换后的上下文和参数变化。',
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
  const mockSpeech = createMockSpeechSegments(platform, assistantHint)

  if (platform === 'openai-compatible') {
    return [
      {
        delay,
        data: {
          id: 'resp_mock_1',
          choices: [
            {
              delta: {
                content: mockSpeech[0],
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
                content: mockSpeech[1],
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
                content: mockSpeech[2],
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
                content: mockSpeech[3],
              },
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: 20,
            completion_tokens: 38,
            total_tokens: 58,
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
            text: mockSpeech[0],
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
            text: mockSpeech[1],
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
            text: mockSpeech[2],
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
            text: mockSpeech[3],
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
            output_tokens: 34,
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
        answer: mockSpeech[0],
        conversation_id: 'dify-conversation-mock',
        message_id: 'dify-message-1',
      },
    },
    {
      delay,
      data: {
        event: 'message',
        answer: mockSpeech[1],
        conversation_id: 'dify-conversation-mock',
        message_id: 'dify-message-1',
      },
    },
    {
      delay,
      data: {
        event: 'message',
        answer: mockSpeech[2],
        conversation_id: 'dify-conversation-mock',
        message_id: 'dify-message-1',
      },
    },
    {
      delay,
      data: {
        event: 'message',
        answer: mockSpeech[3],
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
            prompt_tokens: 14,
            completion_tokens: 36,
            total_tokens: 50,
          },
        },
      },
    },
  ]
}

function createMockSpeechSegments(platform: PlaygroundPlatform, assistantHint: string): [string, string, string, string] {
  if (platform === 'anthropic') {
    return [
      'Anthropic mock 第一段：已进入流式响应，可以开始观察 text delta。',
      ' 第二段：当前助手为 ' + assistantHint + '，用于验证上下文是否透传。',
      ' 第三段：这句话会继续追加在同一条 assistant 消息后面。',
      ' 第四段：如果你看到完整收尾，说明事件顺序、结束原因和 usage 汇总都正常。',
    ]
  }

  if (platform === 'dify') {
    return [
      'Dify mock 第一段：现在开始逐步返回 answer 字段。',
      ' 第二段：当前助手为 ' + assistantHint + '，可用于观察请求上下文。',
      ' 第三段：conversation_id 与 message_id 会在整个续聊过程中保持稳定。',
      ' 第四段：如果这句也出现，说明前面的 SSE 分段已经被正确拼接。',
    ]
  }

  return [
    'OpenAI mock 第一段：已收到请求，正在按 SSE delta 逐步输出。',
    ' 第二段：当前助手为 ' + assistantHint + '，可用于验证上下文透传。',
    ' 第三段：这条回复会持续追加到同一条 assistant 消息上。',
    ' 第四段：如果你看到完整结尾，说明增量拼接、完成信号和 usage 汇总都正常。',
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

  const chat = useChatStream({
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

  const visibleConversations = computed(() => {
    const currentAssistantId = assistants.currentAssistantId.value

    if (!currentAssistantId) {
      return conversations.conversationList.value
    }

    return conversations.conversationList.value.filter((conversation) => conversation.assistantId === currentAssistantId)
  })

  const latestAssistantMessage = computed(() => [...chat.messages.value].reverse().find((message) => message.role === 'assistant'))
  const currentConversationTitle = computed(() => conversations.currentConversation.value?.title ?? '未选择会话')
  const currentAssistantName = computed(() => assistants.currentAssistant.value?.name ?? '未选择助手')
  const lastConversationIdByAssistant = ref<Record<string, string>>({})
  let isRestoringConversationState = false

  function syncConversationState(): void {
    if (isRestoringConversationState) {
      return
    }

    const currentConversationId = conversations.currentConversationId.value
    if (!currentConversationId) {
      return
    }

    conversations.updateConversation(currentConversationId, {
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

  function rememberConversationForAssistant(assistantId: string | undefined, conversationId: string | undefined): void {
    if (!assistantId || !conversationId) {
      return
    }

    const conversation = conversations.conversationList.value.find((item) => item.id === conversationId)
    if (!conversation || conversation.assistantId !== assistantId) {
      return
    }

    lastConversationIdByAssistant.value = {
      ...lastConversationIdByAssistant.value,
      [assistantId]: conversationId,
    }
  }

  function restoreChatFromConversation(conversationId: string | undefined): void {
    const conversation = conversations.conversationList.value.find((item) => item.id === conversationId)

    isRestoringConversationState = true
    chat.clear()
    chat.setMessages(cloneMessages(conversation?.messages ?? []))
    chat.setMetadata(
      conversation
        ? {
            conversationId: conversation.metadata?.remoteConversationId as string | undefined,
            messageId: conversation.metadata?.remoteMessageId as string | undefined,
          }
        : undefined
    )
    isRestoringConversationState = false

    rememberConversationForAssistant(assistants.currentAssistantId.value, conversationId)
  }

  function syncConversationSelectionForAssistant(assistantId: string | undefined): void {
    const currentConversationId = conversations.currentConversationId.value
    const currentConversationVisible = visibleConversations.value.some((conversation) => conversation.id === currentConversationId)

    if (currentConversationVisible) {
      rememberConversationForAssistant(assistantId, currentConversationId)
      restoreChatFromConversation(currentConversationId)
      return
    }

    const rememberedConversationId = assistantId ? lastConversationIdByAssistant.value[assistantId] : undefined
    const nextConversationId = visibleConversations.value.some((conversation) => conversation.id === rememberedConversationId)
      ? rememberedConversationId
      : visibleConversations.value[0]?.id

    conversations.selectConversation(nextConversationId)
    restoreChatFromConversation(nextConversationId)
  }

  async function sendMessage(): Promise<void> {
    const content = draft.value.trim()
    if (!content) {
      return
    }

    if (!conversations.currentConversationId.value) {
      createConversation()
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

  function selectAssistant(assistantId: string | undefined): void {
    if (chat.isStreaming.value) {
      return
    }

    assistants.selectAssistant(assistantId)
    syncConversationSelectionForAssistant(assistantId)
  }

  function selectConversation(conversationId: string | undefined): void {
    if (chat.isStreaming.value) {
      return
    }

    if (conversationId && !visibleConversations.value.some((conversation) => conversation.id === conversationId)) {
      throw new Error(`Conversation "${conversationId}" does not belong to the current assistant.`)
    }

    conversations.selectConversation(conversationId)
    restoreChatFromConversation(conversationId)
  }

  function createConversation(): void {
    if (chat.isStreaming.value) {
      return
    }

    const currentAssistant = assistants.currentAssistant.value
    const conversation = conversations.createConversation({
      title: `新会话 ${visibleConversations.value.length + 1}`,
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

    restoreChatFromConversation(conversation.id)
  }

  function removeCurrentConversation(): void {
    if (chat.isStreaming.value) {
      return
    }

    const currentConversationId = conversations.currentConversationId.value
    if (!currentConversationId) {
      return
    }

    const currentVisibleConversationList = visibleConversations.value
    const currentIndex = currentVisibleConversationList.findIndex((conversation) => conversation.id === currentConversationId)

    conversations.removeConversation(currentConversationId)

    const nextVisibleConversationList = visibleConversations.value
    const nextConversation = nextVisibleConversationList[currentIndex] ?? nextVisibleConversationList[Math.max(currentIndex - 1, 0)]

    conversations.selectConversation(nextConversation?.id)
    restoreChatFromConversation(nextConversation?.id)
  }

  function clearLogs(): void {
    requestLogs.value = []
    eventLogs.value = []
  }

  function resetCurrentConversation(): void {
    if (chat.isStreaming.value) {
      return
    }

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

  syncConversationSelectionForAssistant(assistants.currentAssistantId.value)

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
    visibleConversations,
    chat,
    latestAssistantMessage,
    currentConversationTitle,
    currentAssistantName,
    selectAssistant,
    selectConversation,
    sendMessage,
    createConversation,
    removeCurrentConversation,
    clearLogs,
    resetCurrentConversation,
    applySuggestion,
  }
}
