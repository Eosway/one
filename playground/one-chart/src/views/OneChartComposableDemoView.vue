<script setup lang="ts">
import { useTemplateRef } from 'vue'
import OneChartComposableDemo from '../components/OneChartComposableDemo.vue'
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
      <p class="app-eyebrow">Mode 02</p>
      <h1 class="app-hero-title">Composable 接入</h1>
      <p class="app-hero-desc">
        使用
        <code>useOneChart</code>
        把图表挂到指定容器，并保留命令式调用能力，常见写法是
        <code>useOneChart(chartRef, { option })</code>
        。
      </p>
    </div>

    <div class="app-status-grid">
      <article class="app-status-card">
        <span class="app-status-label">容器</span>
        <strong class="app-status-value">手动绑定 DOM</strong>
      </article>
      <article class="app-status-card">
        <span class="app-status-label">实例控制</span>
        <strong class="app-status-value">通过返回的方法控制</strong>
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
        <p class="app-panel-subtitle">当你想保留默认运行时，又希望把容器、生命周期和实例操作掌握在自己组件里时，使用这一种。</p>
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

    <OneChartComposableDemo ref="chart" :preset="activePreset" :loading="loading" @ready="handleReady" @bar-click="handleBarClick" />
  </section>

  <section class="app-info-grid">
    <article class="app-surface app-info-card">
      <h2 class="app-info-title">适用场景</h2>
      <ul class="app-info-list">
        <li>
          需要主动调用
          <code>setOption</code>
          、
          <code>resize</code>
          或
          <code>dispatchAction</code>
          。
        </li>
        <li>图表要和自定义布局、动画或交互联动。</li>
        <li>希望在当前组件中统一管理生命周期。</li>
      </ul>
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
