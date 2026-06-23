<script setup lang="ts">
import { computed, ref } from 'vue'
import { OneSeamlessScroll } from '@eosway/one-seamless-scroll'
import type { OneSeamlessScrollState, OneSeamlessScrollStateChangeEvent } from '@eosway/one-seamless-scroll'

interface DemoRow {
  id: number
  sku: string
  name: string
  category: string
  stock: number
  status: '充足' | '偏低' | '缺货'
}

interface EventLogItem {
  id: number
  state: OneSeamlessScrollState
  prevState: OneSeamlessScrollState | null
  time: string
}

const sourceRows: DemoRow[] = [
  { id: 1, sku: 'INV-1001', name: '工业手套', category: '劳保', stock: 284, status: '充足' },
  { id: 2, sku: 'INV-1002', name: '铜球阀', category: '管件', stock: 96, status: '充足' },
  { id: 3, sku: 'INV-1003', name: '法兰垫片', category: '耗材', stock: 18, status: '偏低' },
  { id: 4, sku: 'INV-1004', name: '压力表', category: '仪表', stock: 42, status: '充足' },
  { id: 5, sku: 'INV-1005', name: '变频器风扇', category: '备件', stock: 7, status: '偏低' },
  { id: 6, sku: 'INV-1006', name: '不锈钢卡箍', category: '管件', stock: 156, status: '充足' },
  { id: 7, sku: 'INV-1007', name: '液位传感器', category: '仪表', stock: 0, status: '缺货' },
  { id: 8, sku: 'INV-1008', name: '配电箱门锁', category: '五金', stock: 12, status: '偏低' },
  { id: 9, sku: 'INV-1009', name: '尼龙扎带', category: '耗材', stock: 430, status: '充足' },
  { id: 10, sku: 'INV-1010', name: '防水接头', category: '电气', stock: 64, status: '充足' },
]

const count = ref(6)
const minItems = ref(5)
const speed = ref(1.0)
const hoverPause = ref(true)
const enabled = ref(true)

const currentState = ref<OneSeamlessScrollState>('empty')
const eventLogs = ref<EventLogItem[]>([])
let eventSeed = 0

const rows = computed(() => sourceRows.slice(0, count.value))

function formatTime(): string {
  return new Date().toLocaleTimeString('zh-CN', {
    hour12: false,
  })
}

function handleStateChange(payload: OneSeamlessScrollStateChangeEvent): void {
  currentState.value = payload.state
  eventSeed += 1
  eventLogs.value = [
    {
      id: eventSeed,
      state: payload.state,
      prevState: payload.prevState,
      time: formatTime(),
    },
    ...eventLogs.value,
  ].slice(0, 12)
}

function clearEventLogs(): void {
  eventLogs.value = []
}

function setCount(value: number): void {
  count.value = Math.max(0, Math.min(sourceRows.length, value))
}
</script>

<template>
  <main class="app-shell">
    <header class="app-header">
      <p class="app-eyebrow">Eosway One Playground</p>
      <h1 class="app-title">one-seamless-scroll 接入方式演示</h1>
      <p class="app-desc">调整参数，查看滚动效果与状态变化</p>
    </header>

    <section class="app-status-grid">
      <article class="app-status-card app-surface">
        <span class="app-status-label">当前状态</span>
        <strong class="app-status-value">{{ currentState }}</strong>
      </article>
      <article class="app-status-card app-surface">
        <span class="app-status-label">当前条目数</span>
        <strong class="app-status-value">{{ rows.length }}</strong>
      </article>
      <article class="app-status-card app-surface">
        <span class="app-status-label">滚动阈值</span>
        <strong class="app-status-value">{{ minItems }}</strong>
      </article>
      <article class="app-status-card app-surface">
        <span class="app-status-label">速度系数</span>
        <strong class="app-status-value">{{ speed.toFixed(1) }} = {{ (speed * 0.5).toFixed(2) }}px/frame， ≈{{ (speed * 30).toFixed(0) }}px/s @60fps</strong>
      </article>
    </section>

    <section class="playground-grid">
      <section class="app-surface panel panel-control">
        <div class="panel-copy">
          <h2 class="app-panel-title">参数控制</h2>
          <p class="app-panel-subtitle">控制条目数、阈值、速度、悬停等</p>
        </div>

        <div class="control-grid">
          <label class="field">
            <span class="field-label">数据条数</span>
            <input :value="count" type="range" min="0" :max="sourceRows.length" step="1" @input="setCount(Number(($event.target as HTMLInputElement).value))" />
            <strong class="field-value">{{ count }}</strong>
          </label>

          <label class="field">
            <span class="field-label">滚动阈值</span>
            <input v-model.number="minItems" type="range" min="1" :max="8" step="1" />
            <strong class="field-value">{{ minItems }}</strong>
          </label>

          <label class="field">
            <span class="field-label">速度系数</span>
            <input v-model.number="speed" type="range" min="0.1" max="6" step="0.1" />
            <strong class="field-value">{{ speed.toFixed(1) }}</strong>
          </label>

          <label class="toggle">
            <input v-model="hoverPause" type="checkbox" />
            <span>悬停暂停</span>
          </label>

          <label class="toggle">
            <input v-model="enabled" type="checkbox" />
            <span>允许自动滚动</span>
          </label>
        </div>

        <div class="quick-actions">
          <button class="app-button quick-button" type="button" @click="setCount(0)">空列表</button>
          <button class="app-button quick-button" type="button" @click="setCount(minItems - 1)">低于阈值</button>
          <button class="app-button quick-button" type="button" @click="setCount(minItems)">达到阈值</button>
          <button class="app-button quick-button" type="button" @click="setCount(sourceRows.length)">全部数据</button>
        </div>
      </section>

      <section class="app-surface panel panel-preview">
        <div class="panel-copy">
          <h2 class="app-panel-title">滚动预览</h2>
          <p class="app-panel-subtitle">默认展示库存列表</p>
        </div>

        <div class="preview-shell">
          <div class="preview-head">
            <span class="preview-col preview-col-sku">SKU</span>
            <span class="preview-col preview-col-name">物料</span>
            <span class="preview-col preview-col-category">分类</span>
            <span class="preview-col preview-col-status">状态</span>
            <span class="preview-col preview-col-stock">库存</span>
          </div>

          <div class="preview-body">
            <OneSeamlessScroll
              :list="rows"
              item-key="id"
              :min-items="minItems"
              :speed="speed"
              :hover-pause="hoverPause"
              :enabled="enabled"
              @state-change="handleStateChange">
              <template #item="{ item, index }">
                <article class="row-card" :class="{ 'row-card-alt': index % 2 === 1 }">
                  <span class="preview-col preview-col-sku">{{ item.sku }}</span>
                  <span class="preview-col preview-col-name">{{ item.name }}</span>
                  <span class="preview-col preview-col-category">{{ item.category }}</span>
                  <span class="preview-col preview-col-status">
                    <em class="status-chip" :class="`status-chip-${item.status}`">{{ item.status }}</em>
                  </span>
                  <span class="preview-col preview-col-stock">{{ item.stock }}</span>
                </article>
              </template>

              <template #empty>
                <div class="empty-state">暂无内容，请先增加数据条数。</div>
              </template>
            </OneSeamlessScroll>
          </div>
        </div>
      </section>

      <section class="app-surface panel panel-events">
        <div class="panel-header-row">
          <div class="panel-copy">
            <h2 class="app-panel-title">事件记录</h2>
            <p class="app-panel-subtitle">记录状态切换结果</p>
          </div>

          <button class="app-button clear-button" type="button" @click="clearEventLogs">清空</button>
        </div>

        <div v-if="eventLogs.length === 0" class="event-empty">暂无记录。</div>

        <ul v-else class="event-list">
          <li v-for="event in eventLogs" :key="event.id" class="event-item">
            <span class="event-time">{{ event.time }}</span>
            <span class="event-arrow">{{ event.prevState ?? 'null' }} -> {{ event.state }}</span>
          </li>
        </ul>
      </section>
    </section>
  </main>
</template>

<style scoped>
.playground-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
  margin-top: 24px;
}

.panel {
  padding: 24px;
}

.panel-control {
  grid-column: span 1;
}

.panel-preview {
  grid-column: span 2;
}

.panel-events {
  grid-column: span 1;
}

.panel-copy {
  flex: 300%;
  margin-bottom: 18px;
}

.panel-header-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
}

.control-grid {
  display: grid;
  gap: 16px;
}

.field {
  display: grid;
  gap: 8px;
}

.field-label {
  color: #475569;
  font-size: 14px;
  font-weight: 600;
}

.field input[type='range'] {
  width: 100%;
}

.field-value {
  color: #0f172a;
  font-size: 14px;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #0f172a;
  font-weight: 600;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 18px;
}

.quick-button,
.clear-button {
  width: 100%;
}

.preview-shell {
  display: grid;
  grid-template-rows: auto minmax(0, 320px);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.92), rgba(255, 255, 255, 0.96));
}

.preview-head {
  display: grid;
  grid-template-columns: 112px minmax(0, 1.7fr) 96px 88px 72px;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(90deg, rgba(15, 118, 110, 0.12), rgba(37, 99, 235, 0.06));
  color: #0f172a;
  font-size: 13px;
  font-weight: 700;
}

.preview-body {
  min-height: 0;
  padding: 0;
}

.row-card {
  display: grid;
  grid-template-columns: 112px minmax(0, 1.7fr) 96px 88px 72px;
  gap: 12px;
  align-items: center;
  min-height: 54px;
  padding: 0 16px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.82);
  color: #0f172a;
}

.row-card-alt {
  background: rgba(248, 250, 252, 0.84);
}

.preview-col {
  min-width: 0;
}

.preview-col-sku,
.preview-col-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-col-category,
.preview-col-status {
  text-align: center;
}

.preview-col-stock {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 54px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-style: normal;
  font-weight: 700;
}

.status-chip-充足 {
  background: rgba(34, 197, 94, 0.12);
  color: #15803d;
}

.status-chip-偏低 {
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
}

.status-chip-缺货 {
  background: rgba(239, 68, 68, 0.14);
  color: #b91c1c;
}

.empty-state,
.event-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  color: #64748b;
  text-align: center;
}

.event-list {
  display: grid;
  max-height: 360px;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow: auto;
  padding-right: 4px;
}

.event-item {
  display: grid;
  grid-template-columns: 60px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  padding: 14px 16px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 16px;
  background: rgba(248, 250, 252, 0.84);
}

.event-time {
  color: #64748b;
  font-size: 13px;
}

.event-arrow {
  color: #334155;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 960px) {
  .playground-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .panel-header-row {
    flex-direction: column;
  }

  .quick-actions {
    grid-template-columns: 1fr;
  }

  .preview-head,
  .row-card {
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1.4fr);
  }

  .event-item {
    grid-template-columns: 1fr;
  }
}
</style>
