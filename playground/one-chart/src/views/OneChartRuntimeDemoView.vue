<script setup lang="ts">
import { useTemplateRef } from 'vue'
import OneChartRuntimeDemo from '../components/OneChartRuntimeDemo.vue'
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

setModeSummary('自定义 runtime')
</script>

<template>
  <section class="app-surface app-hero">
    <div class="app-copy">
      <p class="app-eyebrow">Mode 03</p>
      <h1 class="app-hero-title">Runtime 接入</h1>
      <p class="app-hero-desc">
        显式创建
        <code>createOneChartRuntime({ modules })</code>
        并传入运行时，适合精确控制模块注册与 runtime 复用。
      </p>
    </div>

    <div class="app-status-grid">
      <article class="app-status-card">
        <span class="app-status-label">容器</span>
        <strong class="app-status-value">手动绑定 DOM</strong>
      </article>
      <article class="app-status-card">
        <span class="app-status-label">实例控制</span>
        <strong class="app-status-value">通过 runtime API 控制</strong>
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
        <p class="app-panel-subtitle">当你需要控制模块边界、复用 runtime，或接入自定义插件时，使用这一种。</p>
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

    <OneChartRuntimeDemo ref="chart" :preset="activePreset" :loading="loading" @ready="handleReady" @bar-click="handleBarClick" />
  </section>

  <section class="app-info-grid">
    <article class="app-surface app-info-card">
      <h2 class="app-info-title">适用场景</h2>
      <ul class="app-info-list">
        <li>希望按图表类型裁剪 ECharts 模块。</li>
        <li>需要在多个图表之间复用同一套 runtime。</li>
        <li>要接入自定义插件或扩展运行时能力。</li>
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
