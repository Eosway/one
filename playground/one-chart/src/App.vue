<script setup lang="ts">
import { computed, markRaw, shallowRef } from 'vue'
import type { Component } from 'vue'
import OneChartComponentDemoView from './views/OneChartComponentDemoView.vue'
import OneChartComposableDemoView from './views/OneChartComposableDemoView.vue'
import OneChartRuntimeDemoView from './views/OneChartRuntimeDemoView.vue'

type DemoViewKey = 'one-chart' | 'use-one-chart' | 'sales-chart'

interface DemoViewItem {
  key: DemoViewKey
  label: string
  summary: string
  component: Component
}

const views: DemoViewItem[] = [
  {
    key: 'one-chart',
    label: '组件接入',
    summary: '直接使用 OneChart 组件，适合快速接入，实例生命周期由组件托管。',
    component: markRaw(OneChartComponentDemoView),
  },
  {
    key: 'use-one-chart',
    label: 'Composable 接入',
    summary: '使用 useOneChart 绑定容器与配置，适合自行管理图表实例。',
    component: markRaw(OneChartComposableDemoView),
  },
  {
    key: 'sales-chart',
    label: 'Runtime 接入',
    summary: '显式创建 runtime，适合按需注册模块或复用运行时。',
    component: markRaw(OneChartRuntimeDemoView),
  },
]

const activeViewKey = shallowRef<DemoViewKey>('one-chart')
const activeView = computed(() => views.find((view) => view.key === activeViewKey.value) ?? views[0])
</script>

<template>
  <main class="app-shell">
    <header class="app-header">
      <div class="app-copy">
        <p class="app-eyebrow">Eosway One Playground</p>
        <h1 class="app-title">one-chart 接入方式演示</h1>
        <p class="app-desc">同一份图表配置，分别用组件、Composable 和 Runtime 三种方式接入，便于按场景选择。</p>
      </div>

      <nav class="view-switcher" aria-label="演示方式切换">
        <button
          v-for="view in views"
          :key="view.key"
          class="switch-card"
          :class="{ 'switch-card-active': view.key === activeViewKey }"
          type="button"
          @click="activeViewKey = view.key">
          <strong class="switch-title">{{ view.label }}</strong>
          <span class="switch-summary">{{ view.summary }}</span>
        </button>
      </nav>
    </header>

    <component :is="activeView.component" class="app-view" />
  </main>
</template>

<style>
.view-switcher {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 24px;
}

.switch-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: 18px 20px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.06);
  color: #0f172a;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    background-color 0.16s ease;
}

.switch-card:hover {
  transform: translateY(-2px);
  border-color: rgba(14, 116, 144, 0.32);
}

.switch-card-active {
  border-color: rgba(15, 118, 110, 0.45);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(226, 244, 241, 0.94));
  box-shadow: 0 24px 56px rgba(15, 118, 110, 0.12);
}

.switch-title {
  font-size: 18px;
}

.switch-summary {
  color: #475569;
  line-height: 1.6;
}

@media (max-width: 900px) {
  .view-switcher {
    grid-template-columns: 1fr;
  }
}
</style>
