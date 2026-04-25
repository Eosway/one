import { computed, ref } from 'vue'
import type { ChatAssistant, UseChatAssistantOptions, UseChatAssistantReturn } from '../types/public'

export function useChatAssistant(options: UseChatAssistantOptions = {}): UseChatAssistantReturn {
  const initialAssistantList = cloneAssistantList(options.initialAssistantList ?? [])
  assertUniqueAssistantIds(initialAssistantList)

  const assistantList = ref<ChatAssistant[]>(initialAssistantList)
  const currentAssistantId = ref<string | undefined>(resolveInitialSelection(options.initialAssistantId, assistantList.value))

  const currentAssistant = computed(() => assistantList.value.find((item) => item.id === currentAssistantId.value))
  const hasAssistant = computed(() => currentAssistant.value !== undefined)

  function setAssistantList(nextAssistantList: ChatAssistant[]): void {
    const clonedAssistantList = cloneAssistantList(nextAssistantList)
    assertUniqueAssistantIds(clonedAssistantList)
    assistantList.value = clonedAssistantList

    if (!assistantList.value.some((item) => item.id === currentAssistantId.value)) {
      currentAssistantId.value = assistantList.value[0]?.id
    }
  }

  function selectAssistant(assistantId: string | undefined): void {
    if (!assistantId) {
      currentAssistantId.value = undefined
      return
    }

    if (!assistantList.value.some((item) => item.id === assistantId)) {
      throw new Error(`Assistant "${assistantId}" does not exist.`)
    }

    currentAssistantId.value = assistantId
  }

  function updateAssistant(assistantId: string, patch: Partial<Omit<ChatAssistant, 'id'>>): void {
    ensureAssistantExists(assistantList.value, assistantId)

    assistantList.value = assistantList.value.map((assistant) => {
      if (assistant.id !== assistantId) {
        return assistant
      }

      return {
        ...assistant,
        ...patch,
        suggestions: patch.suggestions ? [...patch.suggestions] : assistant.suggestions,
        metadata: patch.metadata ? { ...patch.metadata } : assistant.metadata,
      }
    })
  }

  function clearAssistant(): void {
    assistantList.value = []
    currentAssistantId.value = undefined
  }

  return {
    assistantList,
    currentAssistantId,
    currentAssistant,
    hasAssistant,
    setAssistantList,
    selectAssistant,
    updateAssistant,
    clearAssistant,
  }
}

function cloneAssistantList(assistantList: ChatAssistant[]): ChatAssistant[] {
  return assistantList.map((assistant) => ({
    ...assistant,
    suggestions: assistant.suggestions ? [...assistant.suggestions] : undefined,
    metadata: assistant.metadata ? { ...assistant.metadata } : undefined,
  }))
}

function resolveInitialSelection(initialAssistantId: string | undefined, assistantList: ChatAssistant[]): string | undefined {
  if (!initialAssistantId) {
    return assistantList[0]?.id
  }

  ensureAssistantExists(assistantList, initialAssistantId)
  return initialAssistantId
}

function ensureAssistantExists(assistantList: ChatAssistant[], assistantId: string): void {
  if (!assistantList.some((item) => item.id === assistantId)) {
    throw new Error(`Assistant "${assistantId}" does not exist.`)
  }
}

function assertUniqueAssistantIds(assistantList: ChatAssistant[]): void {
  const idSet = new Set<string>()

  for (const assistant of assistantList) {
    if (idSet.has(assistant.id)) {
      throw new Error(`Assistant "${assistant.id}" already exists.`)
    }

    idSet.add(assistant.id)
  }
}
