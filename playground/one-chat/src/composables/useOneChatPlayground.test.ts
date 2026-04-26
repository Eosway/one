import { describe, expect, it } from 'vitest'
import { useOneChatPlayground } from './useOneChatPlayground'

describe('useOneChatPlayground', () => {
  it('filters conversation list by current assistant', () => {
    const playground = useOneChatPlayground()

    expect(playground.assistants.currentAssistantId.value).toBe('assistant-support')
    expect(playground.visibleConversations.value.map((conversation) => conversation.id)).toEqual(['conversation-alpha'])
    expect(playground.conversations.currentConversationId.value).toBe('conversation-alpha')

    playground.selectAssistant('assistant-analyst')

    expect(playground.visibleConversations.value.map((conversation) => conversation.id)).toEqual(['conversation-beta'])
    expect(playground.conversations.currentConversationId.value).toBe('conversation-beta')
  })

  it('restores chat history and metadata when switching conversations under the same assistant', () => {
    const playground = useOneChatPlayground()

    playground.createConversation()

    const createdConversationId = playground.conversations.currentConversationId.value
    expect(createdConversationId).toBeDefined()
    expect(playground.chat.messages.value).toHaveLength(1)
    expect(playground.chat.messages.value[0]?.content).toContain('这是一个用于联调基础对话链路的助手。')

    playground.selectConversation('conversation-alpha')

    expect(playground.conversations.currentConversationId.value).toBe('conversation-alpha')
    expect(playground.chat.messages.value.map((message) => message.id)).toEqual(['alpha-welcome'])
    expect(playground.chat.metadata.value).toEqual({
      conversationId: 'remote-alpha',
      messageId: undefined,
    })
  })

  it('uses fixed mock speech segments to demonstrate sse concatenation', async () => {
    const playground = useOneChatPlayground()

    playground.draft.value = '请演示一段 mock SSE'
    await playground.sendMessage()

    const latestAssistantMessage = playground.latestAssistantMessage.value
    expect(latestAssistantMessage?.content).toContain('OpenAI mock 第一段：已收到请求，正在按 SSE delta 逐步输出。')
    expect(latestAssistantMessage?.content).toContain('第二段：当前助手为 assistant-support')
    expect(latestAssistantMessage?.content).toContain('第四段：如果你看到完整结尾')
    expect(playground.chat.metadata.value?.usage?.totalTokens).toBe(58)
  })
})
