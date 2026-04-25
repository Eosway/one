import { describe, expect, it } from 'vitest'
import { useChatAssistant } from '../src'

describe('useChatAssistant', () => {
  it('tracks current assistant selection', () => {
    const assistants = useChatAssistant({
      initialAssistantList: [
        {
          id: 'assistant-1',
          name: 'Sales Copilot',
        },
        {
          id: 'assistant-2',
          name: 'Support Agent',
        },
      ],
    })

    expect(assistants.currentAssistantId.value).toBe('assistant-1')

    assistants.selectAssistant('assistant-2')

    expect(assistants.currentAssistant.value).toMatchObject({
      id: 'assistant-2',
      name: 'Support Agent',
    })
  })

  it('updates assistant metadata in place', () => {
    const assistants = useChatAssistant({
      initialAssistantList: [
        {
          id: 'assistant-1',
          name: 'Sales Copilot',
        },
      ],
    })

    assistants.updateAssistant('assistant-1', {
      description: 'Handles presales discovery',
      suggestions: ['产品介绍', '报价方案'],
    })

    expect(assistants.currentAssistant.value).toMatchObject({
      description: 'Handles presales discovery',
      suggestions: ['产品介绍', '报价方案'],
    })
  })

  it('clears assistant state', () => {
    const assistants = useChatAssistant({
      initialAssistantList: [
        {
          id: 'assistant-1',
          name: 'Sales Copilot',
        },
      ],
    })

    assistants.clearAssistant()

    expect(assistants.assistantList.value).toEqual([])
    expect(assistants.currentAssistantId.value).toBeUndefined()
  })

  it('throws when initial assistant id does not exist', () => {
    expect(() =>
      useChatAssistant({
        initialAssistantList: [
          {
            id: 'assistant-1',
            name: 'Sales Copilot',
          },
        ],
        initialAssistantId: 'assistant-2',
      })
    ).toThrow('Assistant "assistant-2" does not exist.')
  })

  it('throws when updating a missing assistant', () => {
    const assistants = useChatAssistant()

    expect(() => {
      assistants.updateAssistant('assistant-1', {
        description: 'Updated',
      })
    }).toThrow('Assistant "assistant-1" does not exist.')
  })
})
