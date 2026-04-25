import { computed, ref } from 'vue'
import type { ChatConversation, ChatMessage, UseChatConversationOptions, UseChatConversationReturn } from '../types/public'

const defaultCreateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function useChatConversation(options: UseChatConversationOptions = {}): UseChatConversationReturn {
  const createId = options.createId ?? defaultCreateId
  const initialConversationList = cloneConversationList(options.initialConversationList ?? [])
  assertUniqueConversationIds(initialConversationList)

  const conversationList = ref<ChatConversation[]>(initialConversationList)
  const currentConversationId = ref<string | undefined>(resolveInitialSelection(options.initialConversationId, conversationList.value, 'Conversation'))

  const currentConversation = computed(() => conversationList.value.find((item) => item.id === currentConversationId.value))
  const hasConversation = computed(() => currentConversation.value !== undefined)

  function createConversation(input: Partial<Omit<ChatConversation, 'id' | 'messages'>> & { id?: string; messages?: ChatMessage[] } = {}): ChatConversation {
    const nextId = input.id ?? createId()
    ensureConversationExists(conversationList.value, nextId, false)

    const conversation: ChatConversation = {
      id: nextId,
      title: input.title,
      assistantId: input.assistantId,
      metadata: input.metadata ? { ...input.metadata } : undefined,
      messages: cloneMessages(input.messages ?? []),
    }

    conversationList.value = [...conversationList.value, conversation]
    currentConversationId.value = conversation.id
    return cloneConversation(conversation)
  }

  function setConversationList(nextConversationList: ChatConversation[]): void {
    const clonedConversationList = cloneConversationList(nextConversationList)
    assertUniqueConversationIds(clonedConversationList)
    conversationList.value = clonedConversationList

    if (!conversationList.value.some((item) => item.id === currentConversationId.value)) {
      currentConversationId.value = conversationList.value[0]?.id
    }
  }

  function selectConversation(conversationId: string | undefined): void {
    if (!conversationId) {
      currentConversationId.value = undefined
      return
    }

    if (!conversationList.value.some((item) => item.id === conversationId)) {
      throw new Error(`Conversation "${conversationId}" does not exist.`)
    }

    currentConversationId.value = conversationId
  }

  function updateConversation(conversationId: string, patch: Partial<Omit<ChatConversation, 'id'>>): void {
    ensureConversationExists(conversationList.value, conversationId)

    conversationList.value = conversationList.value.map((conversation) => {
      if (conversation.id !== conversationId) {
        return conversation
      }

      return {
        ...conversation,
        ...patch,
        messages: patch.messages ? cloneMessages(patch.messages) : conversation.messages,
        metadata: patch.metadata ? { ...patch.metadata } : conversation.metadata,
      }
    })
  }

  function removeConversation(conversationId: string): void {
    ensureConversationExists(conversationList.value, conversationId)

    const nextConversationList = conversationList.value.filter((item) => item.id !== conversationId)
    conversationList.value = nextConversationList

    if (currentConversationId.value === conversationId) {
      currentConversationId.value = nextConversationList[0]?.id
    }
  }

  function upsertConversationMessages(conversationId: string, messages: ChatMessage[]): void {
    updateConversation(conversationId, { messages })
  }

  function clearConversation(): void {
    conversationList.value = []
    currentConversationId.value = undefined
  }

  return {
    conversationList,
    currentConversationId,
    currentConversation,
    hasConversation,
    createConversation,
    setConversationList,
    selectConversation,
    updateConversation,
    removeConversation,
    upsertConversationMessages,
    clearConversation,
  }
}

function cloneConversationList(conversationList: ChatConversation[]): ChatConversation[] {
  return conversationList.map(cloneConversation)
}

function cloneConversation(conversation: ChatConversation): ChatConversation {
  return {
    ...conversation,
    messages: cloneMessages(conversation.messages),
    metadata: conversation.metadata ? { ...conversation.metadata } : undefined,
  }
}

function cloneMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((message) => ({
    ...message,
    metadata: message.metadata ? { ...message.metadata } : undefined,
  }))
}

function resolveInitialSelection(initialConversationId: string | undefined, conversationList: ChatConversation[], entityLabel: string): string | undefined {
  if (!initialConversationId) {
    return conversationList[0]?.id
  }

  ensureConversationExists(conversationList, initialConversationId, true, entityLabel)
  return initialConversationId
}

function ensureConversationExists(conversationList: ChatConversation[], conversationId: string, shouldExist = true, entityLabel = 'Conversation'): void {
  const exists = conversationList.some((item) => item.id === conversationId)

  if (shouldExist && !exists) {
    throw new Error(`${entityLabel} "${conversationId}" does not exist.`)
  }

  if (!shouldExist && exists) {
    throw new Error(`${entityLabel} "${conversationId}" already exists.`)
  }
}

function assertUniqueConversationIds(conversationList: ChatConversation[]): void {
  const idSet = new Set<string>()

  for (const conversation of conversationList) {
    if (idSet.has(conversation.id)) {
      throw new Error(`Conversation "${conversation.id}" already exists.`)
    }

    idSet.add(conversation.id)
  }
}
