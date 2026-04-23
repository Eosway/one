<script setup lang="ts">
import { useTemplateRef } from 'vue'
import OneChartComponentDemo from '../components/OneChartComponentDemo.vue'
import { useSalesPlayground } from '../composables/useSalesPlayground'
import type { SalesChartControl } from '../types/sales'

const chartRef = useTemplateRef<SalesChartControl>('chart')
const {
  activePreset,
  loading,
  readyCount,
  lastAction,
  lastClick,
  runtimeSummary,
  cyclePreset,
  toggleLoading,
  highlightPeak,
  rerenderChart,
  setModeSummary,
  handleReady,
  handleBarClick,
} = useSalesPlayground(() => chartRef.value)

setModeSummary('内置 runtime')
</script>

<template>
  <section class="app-surface app-hero">
    <div class="app-copy">
      <p class="app-eyebrow">Mode 01</p>
      <h1 class="app-hero-title">组件接入</h1>
      <p class="app-hero-desc">
        直接使用
        <code>OneChart</code>
        组件传入
        <code>option</code>
        、loading和事件即可，适合大多数业务页面。
      </p>
    </div>

    <div class="app-status-grid">
      <article class="app-status-card">
        <span class="app-status-label">容器</span>
        <strong class="app-status-value">组件内部托管</strong>
      </article>
      <article class="app-status-card">
        <span class="app-status-label">实例控制</span>
        <strong class="app-status-value">通过组件 ref 调用</strong>
      </article>
      <article class="app-status-card">
        <span class="app-status-label">Runtime</span>
        <strong class="app-status-value">{{ runtimeSummary }}</strong>
      </article>
      <article class="app-status-card">
        <span class="app-status-label">初始化次数</span>
        <strong class="app-status-value">{{ readyCount }}</strong>
      </article>
    </div>
  </section>

  <section class="app-surface app-demo">
    <header class="app-panel-header">
      <div>
        <h2 class="app-panel-title">图表区</h2>
        <p class="app-panel-subtitle">这一方案最省心，图表实例和生命周期由组件统一托管。</p>
        <p class="app-panel-meta">
          <span class="app-panel-meta-label">当前数据集</span>
          <strong class="app-panel-meta-value">{{ activePreset.label }}</strong>
          <span>{{ activePreset.subtitle }}</span>
        </p>
      </div>

      <div class="app-actions">
        <button class="app-button" type="button" @click="cyclePreset">切换数据</button>
        <button class="app-button" type="button" @click="toggleLoading">
          {{ loading ? '关闭loading' : '显示loading' }}
        </button>
        <button class="app-button" type="button" @click="highlightPeak">高亮峰值</button>
        <button class="app-button" type="button" @click="rerenderChart">手动重绘</button>
      </div>
    </header>

    <OneChartComponentDemo ref="chart" :preset="activePreset" :loading="loading" @ready="handleReady" @bar-click="handleBarClick" />
  </section>

  <section class="app-info-grid app-info-grid-wide">
    <article class="app-surface app-info-card">
      <h2 class="app-info-title">适用场景</h2>
      <ul class="app-info-list">
        <li>希望尽快把图表接入页面。</li>
        <li>不需要直接操作图表实例。</li>
        <li>把 one-chart 当作标准业务组件使用。</li>
      </ul>
    </article>

    <article class="app-surface app-info-card">
      <h2 class="app-info-title">扩展方式</h2>
      <p class="app-info-line">
        <span>需要扩展能力时</span>
        <code>&lt;OneChart :plugins="[glPlugin(), statPlugin()]" /&gt;</code>
      </p>
      <p class="app-info-line">
        <span>注意事项</span>
        如果启用对应插件，仍需安装
        <code>echarts-gl / echarts-stat</code>
      </p>
    </article>

    <article class="app-surface app-info-card">
      <h2 class="app-info-title">最近状态</h2>
      <p class="app-info-line">
        <span>最近动作</span>
        {{ lastAction }}
      </p>
      <p class="app-info-line">
        <span>最近点击</span>
        {{ lastClick }}
      </p>
    </article>
  </section>
</template>
