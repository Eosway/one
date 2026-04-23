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

setModeSummary('高级 runtime 模式，显式注册 5 个 ECharts modules')
</script>

<template>
  <section class="hero-panel">
    <div class="hero-copy">
      <p class="eyebrow">Mode 03</p>
      <h1 class="hero-title">高级控制 / Runtime 模式</h1>
      <p class="hero-desc">
        显式创建
        <code>createOneChartRuntime({ modules })</code>
        并通过高级入口接入，适合要控制模块注册和 runtime 复用的场景。
      </p>
    </div>

    <div class="status-grid">
      <article class="status-card">
        <span class="status-label">当前数据集</span>
        <strong class="status-value">{{ activePreset.label }}</strong>
      </article>
      <article class="status-card">
        <span class="status-label">Runtime</span>
        <strong class="status-value">{{ runtimeSummary }}</strong>
      </article>
      <article class="status-card">
        <span class="status-label">Ready 次数</span>
        <strong class="status-value">{{ readyCount }}</strong>
      </article>
    </div>
  </section>

  <section class="demo-panel">
    <header class="panel-header">
      <div>
        <h2 class="panel-title">图表区</h2>
        <p class="panel-subtitle">保留原有控制模式能力，便于按需注册 modules 和接入自定义 runtime 插件。</p>
      </div>

      <div class="actions">
        <button class="action-button" type="button" @click="cyclePreset">切换数据</button>
        <button class="action-button" type="button" @click="toggleLoading">
          {{ loading ? '关闭 loading' : '显示 loading' }}
        </button>
        <button class="action-button" type="button" @click="highlightPeak">高亮峰值</button>
        <button class="action-button" type="button" @click="rerenderChart">手动重绘</button>
      </div>
    </header>

    <OneChartRuntimeDemo ref="chart" :preset="activePreset" :loading="loading" @ready="handleReady" @bar-click="handleBarClick" />
  </section>

  <section class="info-grid">
    <article class="info-card">
      <h2 class="info-title">适用场景</h2>
      <ul class="info-list">
        <li>需要按需注册 ECharts modules 以控制体积或能力边界。</li>
        <li>希望复用 runtime，并安装自定义 plugin。</li>
        <li>需要兼容旧调用或已有控制模式封装。</li>
      </ul>
    </article>

    <article class="info-card">
      <h2 class="info-title">最近状态</h2>
      <p class="info-line">
        <span>最近动作</span>
        {{ lastAction }}
      </p>
      <p class="info-line">
        <span>最近点击</span>
        {{ lastClick }}
      </p>
    </article>
  </section>
</template>

<style scoped>
.hero-panel,
.demo-panel,
.info-card {
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(14px);
}

.hero-panel {
  padding: 28px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #0f766e;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-title {
  margin: 0;
  font-size: clamp(32px, 5vw, 52px);
  line-height: 1.05;
}

.hero-desc {
  max-width: 720px;
  margin: 12px 0 0;
  color: #334155;
  line-height: 1.7;
}

.status-grid,
.info-grid {
  display: grid;
  gap: 16px;
  margin-top: 24px;
}

.status-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.status-card {
  padding: 18px 20px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(241, 245, 249, 0.92));
}

.status-label {
  display: block;
  color: #64748b;
  font-size: 13px;
}

.status-value {
  display: block;
  margin-top: 8px;
  font-size: 18px;
}

.demo-panel {
  margin-top: 24px;
  padding: 24px;
}

.panel-header {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.panel-title,
.info-title {
  margin: 0;
  font-size: 22px;
}

.panel-subtitle {
  margin: 8px 0 0;
  color: #475569;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
}

.action-button {
  padding: 10px 16px;
  border: 0;
  border-radius: 999px;
  background: #0f172a;
  color: #f8fafc;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.16s ease,
    opacity 0.16s ease,
    background-color 0.16s ease;
}

.action-button:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
}

.info-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 24px;
}

.info-card {
  padding: 24px;
}

.info-list {
  margin: 16px 0 0;
  padding-left: 18px;
  color: #334155;
  line-height: 1.8;
}

.info-line {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 16px 0 0;
  color: #0f172a;
}

.info-line span {
  color: #64748b;
  font-size: 13px;
}

@media (max-width: 900px) {
  .status-grid,
  .info-grid {
    grid-template-columns: 1fr;
  }

  .panel-header {
    flex-direction: column;
  }

  .actions {
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .hero-panel,
  .demo-panel,
  .info-card {
    border-radius: 20px;
    padding: 18px;
  }

  .action-button {
    width: 100%;
  }
}
</style>
