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
    label: '组件零配置',
    summary: '直接 `<OneChart :option="option" />`，默认走内置完整 runtime。',
    component: markRaw(OneChartComponentDemoView),
  },
  {
    key: 'use-one-chart',
    label: 'Composable 零配置',
    summary: '直接 `useOneChart(chartRef, { option })`，容器和实例生命周期自己掌控。',
    component: markRaw(OneChartComposableDemoView),
  },
  {
    key: 'sales-chart',
    label: '高级 Runtime',
    summary: '显式 `createOneChartRuntime({ modules })`，保留按需注册与高级控制。',
    component: markRaw(OneChartRuntimeDemoView),
  },
]

const activeViewKey = shallowRef<DemoViewKey>('one-chart')
const activeView = computed(() => views.find((view) => view.key === activeViewKey.value) ?? views[0])
</script>

<template>
  <main class="page-shell">
    <header class="app-header">
      <div class="app-copy">
        <p class="app-eyebrow">Eosway One Playground</p>
        <h1 class="app-title">one-chart 三种接入方式演示</h1>
        <p class="app-desc">这个 playground 按“组件零配置、composable 零配置、高级 runtime”三条路径组织，默认路径不再要求手动注册 ECharts modules。</p>
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

    <component :is="activeView.component" />
  </main>
</template>

<style>
body {
  margin: 0;
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: radial-gradient(circle at top, rgba(15, 118, 110, 0.18), transparent 30%), linear-gradient(180deg, #f8fafc 0%, #eef6ff 100%);
  color: #0f172a;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

button,
code {
  font: inherit;
}

.page-shell {
  min-height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px 56px;
}

.app-header {
  margin-bottom: 24px;
}

.app-eyebrow {
  margin: 0 0 8px;
  color: #0f766e;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.app-title {
  margin: 0;
  font-size: clamp(34px, 5vw, 54px);
  line-height: 1.02;
}

.app-desc {
  max-width: 780px;
  margin: 12px 0 0;
  color: #334155;
  line-height: 1.7;
}

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
  .page-shell {
    padding: 20px 14px 32px;
  }

  .view-switcher {
    grid-template-columns: 1fr;
  }
}
</style>
