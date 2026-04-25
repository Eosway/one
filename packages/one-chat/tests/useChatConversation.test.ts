import { describe, expect, it } from 'vitest'
import { useChatConversation } from '../src'

describe('useChatConversation', () => {
  it('creates and selects conversations', () => {
    const conversations = useChatConversation({
      createId: createIncrementalId(),
    })

    const created = conversations.createConversation({
      title: 'First',
    })

    expect(created.id).toBe('conversation-1')
    expect(conversations.currentConversationId.value).toBe('conversation-1')
    expect(conversations.currentConversation.value).toMatchObject({
      title: 'First',
      messages: [],
    })
  })

  it('updates messages for an existing conversation', () => {
    const conversations = useChatConversation({
      initialConversationList: [
        {
          id: 'conversation-1',
          title: 'First',
          messages: [],
        },
      ],
    })

    conversations.upsertConversationMessages('conversation-1', [
      {
        id: 'message-1',
        role: 'user',
        content: 'hello',
      },
    ])

    expect(conversations.currentConversation.value?.messages).toEqual([
      {
        id: 'message-1',
        role: 'user',
        content: 'hello',
      },
    ])
  })

  it('removes current conversation and falls back to next one', () => {
    const conversations = useChatConversation({
      initialConversationList: [
        {
          id: 'conversation-1',
          title: 'First',
          messages: [],
        },
        {
          id: 'conversation-2',
          title: 'Second',
          messages: [],
        },
      ],
      initialConversationId: 'conversation-1',
    })

    conversations.removeConversation('conversation-1')

    expect(conversations.currentConversationId.value).toBe('conversation-2')
    expect(conversations.conversationList.value).toHaveLength(1)
  })

  it('throws when initial conversation id does not exist', () => {
    expect(() =>
      useChatConversation({
        initialConversationList: [
          {
            id: 'conversation-1',
            title: 'First',
            messages: [],
          },
        ],
        initialConversationId: 'conversation-2',
      })
    ).toThrow('Conversation "conversation-2" does not exist.')
  })

  it('throws when creating a duplicated conversation id', () => {
    const conversations = useChatConversation({
      initialConversationList: [
        {
          id: 'conversation-1',
          title: 'First',
          messages: [],
        },
      ],
    })

    expect(() =>
      conversations.createConversation({
        id: 'conversation-1',
      })
    ).toThrow('Conversation "conversation-1" already exists.')
  })

  it('throws when updating a missing conversation', () => {
    const conversations = useChatConversation()

    expect(() => {
      conversations.updateConversation('conversation-1', {
        title: 'Updated',
      })
    }).toThrow('Conversation "conversation-1" does not exist.')
  })
})

function createIncrementalId(): () => string {
  let index = 0
  return () => {
    index += 1
    return `conversation-${index}`
  }
}
