<script setup lang="ts">
import { computed } from 'vue'
import { useOneChatPlayground } from './composables/useOneChatPlayground'

const playground = useOneChatPlayground()

const statusLabelMap = {
  idle: '空闲',
  submitting: '请求发送中',
  streaming: '接收流式内容',
  error: '请求失败',
} as const

const scenarioOptions = [
  { value: 'normal', label: '正常返回' },
  { value: 'slow', label: '慢速返回' },
  { value: 'error', label: '错误返回' },
] as const

const platformSummary = computed(() => {
  if (playground.platform.value === 'dify') {
    return '当前关注会话标识、消息标识和续聊行为。'
  }

  if (playground.platform.value === 'anthropic') {
    return '当前关注事件类型映射、文本增量和结束原因。'
  }

  return '当前关注 delta 拼接、完成信号和 usage 汇总。'
})

const sortedConversations = computed(() => [...playground.visibleConversations.value].reverse())

function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

function onSubmit(): void {
  void playground.sendMessage()
}
</script>

<template>
  <main class="app-shell">
    <header class="app-header">
      <div class="hero-copy">
        <p class="app-eyebrow">Eosway One Playground</p>
        <h1 class="app-title">one-chat playground</h1>
        <p class="app-desc">这里用于验证 one-chat 的接入链路和状态变化。</p>
      </div>
    </header>

    <section class="summary-grid">
      <article class="summary-card app-surface span-2">
        <span class="summary-label">当前平台</span>
        <strong class="summary-value">{{ playground.platform.value }}</strong>
        <p class="summary-desc">{{ platformSummary }}</p>
      </article>
      <article class="summary-card app-surface span-2">
        <span class="summary-label">当前助手</span>
        <strong class="summary-value">{{ playground.currentAssistantName }}</strong>
        <p class="summary-desc">查看助手切换后的上下文变化</p>
      </article>
      <article class="summary-card app-surface span-2">
        <span class="summary-label">当前会话</span>
        <strong class="summary-value">{{ playground.currentConversationTitle }}</strong>
        <p class="summary-desc">消息 {{ playground.chat.messages.value.length }} 条</p>
      </article>
      <article class="summary-card app-surface span-2">
        <span class="summary-label">流状态</span>
        <strong class="summary-value">{{ statusLabelMap[playground.chat.status.value] }}</strong>
        <p class="summary-desc">
          {{ playground.chat.metadata.value?.conversationId || '尚未拿到远端 conversationId' }}
        </p>
      </article>
    </section>

    <section class="workspace-grid">
      <section class="panel app-surface settings-panel span-2">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">运行设置</h2>
            <p class="panel-subtitle">切换平台、模式和请求参数，观察同一套 composable 如何消费不同来源的流。</p>
          </div>
        </div>

        <div class="field-grid">
          <label class="field">
            <span>模式</span>
            <select v-model="playground.mode.value">
              <option value="mock">mock</option>
              <option value="live">live</option>
            </select>
          </label>

          <label class="field">
            <span>平台</span>
            <select v-model="playground.platform.value">
              <option value="openai-compatible">openai-compatible</option>
              <option value="anthropic">anthropic</option>
              <option value="dify">dify</option>
            </select>
          </label>

          <label class="field">
            <span>返回场景</span>
            <select v-model="playground.scenario.value">
              <option v-for="option in scenarioOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>

          <label class="field">
            <span>模型</span>
            <input v-model="playground.model.value" type="text" :disabled="playground.platform.value === 'dify'" />
          </label>

          <label class="field">
            <span>maxTokens</span>
            <input v-model.number="playground.maxTokens.value" type="number" min="1" :disabled="playground.platform.value !== 'anthropic'" />
          </label>

          <label class="field">
            <span>Dify user</span>
            <input v-model="playground.difyUser.value" type="text" :disabled="playground.platform.value !== 'dify'" />
          </label>
        </div>

        <label class="field field-block">
          <span>URL</span>
          <input v-model="playground.url.value" type="text" />
        </label>

        <label class="field field-block">
          <span>Headers</span>
          <textarea v-model="playground.headersText.value" rows="2" placeholder="Authorization: Bearer xxx" />
        </label>

        <label class="field field-block">
          <span>附加请求 JSON</span>
          <textarea v-model="playground.bodyText.value" rows="2" placeholder='{"temperature":0.2}' />
        </label>
      </section>

      <section class="panel app-surface merged-side-panel span-2">
        <section class="merged-side-section">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">助手</h2>
              <p class="panel-subtitle">切换当前助手，并观察请求上下文的变化。</p>
            </div>
          </div>

          <div class="stack-list">
            <button
              v-for="assistant in playground.assistants.assistantList.value"
              :key="assistant.id"
              class="list-card list-card-rail"
              :class="{ 'list-card-active': assistant.id === playground.assistants.currentAssistantId.value }"
              type="button"
              :disabled="playground.chat.isStreaming.value"
              @click="playground.selectAssistant(assistant.id)">
              <strong>{{ assistant.name }}</strong>
              <span>{{ assistant.description }}</span>
            </button>
          </div>

          <div v-if="playground.assistants.currentAssistant.value?.suggestions?.length" class="suggestion-row">
            <button
              v-for="suggestion in playground.assistants.currentAssistant.value.suggestions"
              :key="suggestion"
              class="chip"
              type="button"
              @click="playground.applySuggestion(suggestion)">
              {{ suggestion }}
            </button>
          </div>
        </section>
        <section class="merged-side-section">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">会话</h2>
              <p class="panel-subtitle">切换当前会话，恢复该会话的聊天历史和标识。</p>
            </div>
          </div>

          <div class="stack-list">
            <button class="list-card list-card-create" type="button" :disabled="playground.chat.isStreaming.value" @click="playground.createConversation()">
              <strong>新建会话</strong>
              <span>创建一个新的会话，并切换过去。</span>
            </button>

            <button
              v-for="conversation in sortedConversations"
              :key="conversation.id"
              class="list-card list-card-rail"
              :class="{ 'list-card-active': conversation.id === playground.conversations.currentConversationId.value }"
              type="button"
              :disabled="playground.chat.isStreaming.value"
              @click="playground.selectConversation(conversation.id)">
              <span class="list-card-row">
                <strong>{{ conversation.title || conversation.id }}</strong>
                <button
                  v-if="conversation.id === playground.conversations.currentConversationId.value"
                  class="inline-action-button"
                  type="button"
                  :disabled="playground.chat.isStreaming.value"
                  aria-label="删除当前会话"
                  @click.stop="playground.removeCurrentConversation()">
                  删除
                </button>
              </span>
              <span>{{ conversation.messages.length }} 条消息</span>
            </button>
            <div v-if="sortedConversations.length === 0" class="empty-state">当前助手下还没有会话，可以先创建一个新会话。</div>
          </div>
        </section>
      </section>

      <section class="panel app-surface chat-panel span-4">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">对话区</h2>
            <p class="panel-subtitle">展示当前会话的内容，执行发送、停止和重试。</p>
          </div>

          <div class="action-row">
            <button class="ghost-button" type="button" :disabled="!playground.chat.canRetry.value" @click="playground.chat.retry()">重试</button>
            <button class="ghost-button" type="button" :disabled="!playground.chat.isStreaming.value" @click="playground.chat.stop()">停止</button>
            <button class="ghost-button" type="button" :disabled="playground.chat.isStreaming.value" @click="playground.resetCurrentConversation()">
              清空当前会话
            </button>
          </div>
        </div>

        <div class="status-grid">
          <article class="status-card">
            <span>status</span>
            <strong>{{ statusLabelMap[playground.chat.status.value] }}</strong>
          </article>
          <article class="status-card">
            <span>isStreaming</span>
            <strong>{{ playground.chat.isStreaming.value ? 'true' : 'false' }}</strong>
          </article>
          <article class="status-card">
            <span>conversationId</span>
            <strong>{{ playground.chat.metadata.value?.conversationId || 'n/a' }}</strong>
          </article>
          <article class="status-card">
            <span>messageId</span>
            <strong>{{ playground.chat.metadata.value?.messageId || 'n/a' }}</strong>
          </article>
        </div>

        <div v-if="playground.chat.error.value" class="error-box">
          {{ String(playground.chat.error.value) }}
        </div>

        <div class="conversation-surface">
          <div class="message-list">
            <article v-for="message in playground.chat.messages.value" :key="message.id" class="message-row" :class="[`message-row-${message.role}`]">
              <div class="message-bubble" :class="[`message-${message.role}`, message.status ? `message-status-${message.status}` : '']">
                <header class="message-meta">
                  <strong>{{ message.role }}</strong>
                  <span>{{ message.status || 'done' }}</span>
                </header>
                <pre>{{ message.content || '(empty)' }}</pre>
              </div>
            </article>
          </div>
        </div>

        <form class="composer" @submit.prevent="onSubmit">
          <textarea v-model="playground.draft.value" rows="1" placeholder="输入一条消息，观察消息列表、事件日志和 metadata 同步变化。" />
          <div class="composer-actions">
            <button class="primary-button" type="submit" :disabled="playground.chat.isStreaming.value">发送</button>
          </div>
        </form>
      </section>
    </section>

    <section class="observe-grid">
      <section class="panel app-surface observe-span-6">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">状态观察</h2>
            <p class="panel-subtitle">用于查看 composable 当前吸收的状态和最近一条助手消息。</p>
          </div>
        </div>

        <div class="debug-block">
          <span class="debug-label">chat.metadata</span>
          <pre>{{ formatJson(playground.chat.metadata.value ?? {}) }}</pre>
        </div>
        <div class="debug-block">
          <span class="debug-label">current assistant</span>
          <pre>{{ formatJson(playground.assistants.currentAssistant.value ?? {}) }}</pre>
        </div>
        <div class="debug-block">
          <span class="debug-label">latest assistant message</span>
          <pre>{{ formatJson(playground.latestAssistantMessage.value ?? {}) }}</pre>
        </div>
      </section>

      <section class="panel app-surface observe-span-5">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">事件日志</h2>
            <p class="panel-subtitle">这里展示统一后的事件流，方便核对语义层输出是否符合预期。</p>
          </div>
          <div class="action-row">
            <button class="ghost-button" type="button" style="width: 100px" @click="playground.clearLogs()">清空日志</button>
          </div>
        </div>

        <div class="log-list">
          <article v-for="item in playground.eventLogs.value" :key="item.id" class="log-card">
            <header class="log-meta">
              <strong>{{ item.event.type }}</strong>
              <span>{{ item.timestamp }}</span>
            </header>
            <pre>{{ formatJson(item.event) }}</pre>
          </article>
        </div>
      </section>

      <section class="panel app-surface observe-span-5">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">请求日志</h2>
            <p class="panel-subtitle">mock 模式下，这里记录请求内容，便于核对 headers、body 和上下文字段。</p>
          </div>
        </div>

        <div class="log-list request-log-list">
          <article v-for="item in playground.requestLogs.value" :key="item.id" class="log-card">
            <header class="log-meta">
              <strong>{{ item.platform }} · {{ item.scenario }}</strong>
              <span>{{ item.timestamp }}</span>
            </header>
            <pre>{{ formatJson(item.request) }}</pre>
          </article>
        </div>
      </section>
    </section>
  </main>
</template>

<style scoped>
.summary-grid,
.workspace-grid,
.field-grid,
.status-grid,
.observe-grid {
  display: grid;
  gap: 16px;
}

.summary-grid {
  grid-template-columns: repeat(8, minmax(0, 1fr));
  margin-bottom: 16px;
}

.workspace-grid {
  grid-template-columns: repeat(8, minmax(0, 1fr));
  align-items: stretch;
  margin-bottom: 16px;
}

.panel,
.summary-card {
  padding: 18px;
}

.summary-label,
.debug-label,
.field span,
.status-card span {
  display: block;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.summary-value {
  display: block;
  margin-top: 10px;
  font-size: 20px;
  line-height: 1.4;
}

.summary-desc {
  margin: 8px 0 0;
  color: #475569;
  line-height: 1.6;
}

.panel-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.panel-title {
  margin: 0;
  font-size: 20px;
}

.panel-subtitle {
  margin: 8px 0 0;
  color: #475569;
  line-height: 1.65;
}

.field-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-block {
  margin-top: 14px;
}

.field input,
.field select,
.field textarea,
.composer textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid rgba(148, 163, 184, 0.26);
  border-radius: 16px;
  background: rgba(248, 250, 252, 0.95);
  color: #0f172a;
  resize: vertical;
}

.field input:focus,
.field select:focus,
.field textarea:focus,
.composer textarea:focus {
  outline: 2px solid rgba(14, 116, 144, 0.2);
  border-color: rgba(14, 116, 144, 0.38);
}

.stack-list,
.message-list,
.log-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-card,
.log-card,
.status-card,
.debug-block {
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 249, 0.9));
}

.list-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  color: #10233c;
  text-align: left;
  cursor: pointer;
}

.list-card-rail {
  min-height: 96px;
  justify-content: center;
  align-items: flex-start;
  border-radius: 20px;
}

.list-card-create {
  min-height: 80px;
  justify-content: center;
  border-style: dashed;
}

.list-card-row {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.inline-action-button {
  flex: 0 0 auto;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(226, 232, 240, 0.95);
  color: #475569;
  font-size: 12px;
  cursor: pointer;
  transition:
    background-color 0.16s ease,
    color 0.16s ease;
}

.inline-action-button:hover {
  background: rgba(254, 226, 226, 0.96);
  color: #991b1b;
}

.chat-panel,
.settings-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.merged-side-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  height: 100%;
  align-items: stretch;
}

.merged-side-section {
  min-width: 0;
}

.list-card span {
  color: #475569;
  line-height: 1.55;
}

.list-card-active {
  border-color: rgba(14, 116, 144, 0.35);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(220, 242, 248, 0.92));
}

.empty-state {
  padding: 18px 16px;
  border: 1px dashed rgba(148, 163, 184, 0.28);
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.7);
  color: #64748b;
  line-height: 1.6;
}

.suggestion-row,
.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.suggestion-row {
  margin-top: 14px;
}

.chip,
.ghost-button,
.primary-button {
  padding: 10px 14px;
  border-radius: 999px;
  cursor: pointer;
  transition:
    transform 0.16s ease,
    background-color 0.16s ease,
    opacity 0.16s ease;
}

.chip,
.ghost-button {
  background: rgba(226, 232, 240, 0.9);
  color: #0f172a;
}

.primary-button {
  background: #0f172a;
  color: #f8fafc;
}

.chip:hover,
.ghost-button:hover,
.primary-button:hover {
  transform: translateY(-1px);
}

.primary-button:hover {
  background: #0f4c81;
}

.chip:disabled,
.ghost-button:disabled,
.primary-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
  transform: none;
}

.status-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 16px;
}

.status-card strong {
  display: block;
  margin-top: 8px;
  font-size: 17px;
}

.error-box {
  margin-bottom: 16px;
  padding: 14px;
  border-radius: 18px;
  background: rgba(254, 226, 226, 0.9);
  color: #991b1b;
}

.message-meta,
.log-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  color: #475569;
  font-size: 13px;
}

.conversation-surface {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  margin-top: 4px;
  padding: 16px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 22px;
  background: rgba(248, 250, 252, 0.9);
}

.message-list {
  flex: 1 1 auto;
  min-height: 0;
  gap: 14px;
  overflow: auto;
  max-height: 398px;
}

.message-row {
  display: flex;
}

.message-row-user {
  justify-content: flex-end;
}

.message-row-assistant,
.message-row-system,
.message-row-tool {
  justify-content: flex-start;
}

.message-bubble {
  width: min(100%, 78%);
  padding: 14px 16px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 22px;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.04);
}

.message-user {
  border-color: rgba(59, 130, 246, 0.22);
  background: linear-gradient(180deg, rgba(219, 234, 254, 0.96), rgba(239, 246, 255, 0.98));
}

.message-assistant {
  border-color: rgba(15, 118, 110, 0.22);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(240, 253, 250, 0.96));
}

.message-status-streaming {
  box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.34);
}

.message-status-error {
  box-shadow: inset 0 0 0 1px rgba(220, 38, 38, 0.3);
}

.composer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: end;
  margin-top: 16px;
}

.composer textarea {
  min-height: 46px;
  max-height: 160px;
}

.composer-actions {
  display: flex;
  align-items: center;
}

.debug-block + .debug-block {
  margin-top: 12px;
}

.debug-block pre,
.log-card pre {
  color: #10233c;
  font-size: 13px;
  line-height: 1.7;
}

.request-log-list,
.log-list {
  max-height: 640px;
  overflow: auto;
}

.observe-grid {
  grid-template-columns: repeat(16, minmax(0, 1fr));
}

.span-2 {
  grid-column: span 2;
}

.span-4 {
  grid-column: span 4;
}

.observe-span-5 {
  grid-column: span 5;
}

.observe-span-6 {
  grid-column: span 6;
}

@media (max-width: 1480px) {
  .workspace-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1100px) {
  .status-grid,
  .field-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .workspace-grid,
  .observe-grid,
  .summary-grid,
  .merged-side-panel {
    grid-template-columns: 1fr;
  }

  .span-2,
  .span-4,
  .observe-span-5,
  .observe-span-6 {
    grid-column: span 1;
  }
}

@media (max-width: 720px) {
  .field-grid,
  .status-grid,
  .composer {
    grid-template-columns: 1fr;
  }

  .panel-header {
    flex-direction: column;
  }

  .action-row > * {
    width: 100%;
  }
}
</style>
