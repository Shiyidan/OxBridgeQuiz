<!-- TMUA V2 报告的综合估分与双 Paper 表现对比图。 -->
<template>
  <div class="tmua-score-chart">
    <div class="score-overview">
      <section class="estimate-card">
        <div class="metric-heading">
          <div>
            <span>综合估分区间</span>
            <strong>{{ formattedOverallRange }}</strong>
          </div>
          <small>平台估算 · 1.0—9.0</small>
        </div>
        <div class="estimate-scale" aria-label="TMUA 综合估分区间标尺">
          <div class="estimate-scale__labels">
            <span>1.0</span><span>3.0</span><span>5.0</span><span>7.0</span><span>9.0</span>
          </div>
          <div class="estimate-scale__track">
            <i
              v-if="overallScoreRange"
              class="estimate-scale__band"
              :style="scoreBandStyle(overallScoreRange)"
            ></i>
            <b
              v-if="overallScore !== null"
              class="estimate-scale__point"
              :style="scorePointStyle(overallScore)"
            ></b>
          </div>
        </div>
      </section>

      <section class="gap-card" :class="{ 'gap-card--clear': paperGap >= 10 }">
        <span>双 Paper 表现差</span>
        <strong>{{ paperGap.toFixed(0) }}<small> 个百分点</small></strong>
        <p v-if="strongerModule && weakerModule">
          {{ shortLabel(strongerModule.label) }} 高于 {{ shortLabel(weakerModule.label) }}，后者是当前优先提升方向。
        </p>
      </section>
    </div>

    <section class="paper-comparison">
      <header>
        <div>
          <span>Paper 正确率对比</span>
          <small>同一量尺展示，直接比较两卷表现</small>
        </div>
        <div class="chart-legend"><i></i> 答对占比</div>
      </header>

      <div class="paper-axis" aria-hidden="true">
        <span></span>
        <div class="paper-axis__ticks">
          <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
        </div>
        <span></span><span></span>
      </div>
      <article
        v-for="module in modules"
        :key="module.id"
        class="paper-row"
        :class="{
          'paper-row--active': activeModuleId === module.id,
          'paper-row--weak': weakerModule?.id === module.id && paperGap >= 10,
        }"
      >
        <div class="paper-label">
          <strong>{{ shortLabel(module.label) }}</strong>
          <small>{{ module.correct }}/{{ module.total }} 题</small>
        </div>
        <div class="paper-track">
          <i :style="accuracyBarStyle(module)"></i>
          <span
            v-for="tick in [25, 50, 75]"
            :key="tick"
            :style="{ left: `${tick}%` }"
          ></span>
        </div>
        <b>{{ formatAccuracy(module) }}</b>
        <em>{{ moduleStatus(module) }}</em>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DiagnosticAssessmentModule } from '@/api/exam'

const props = defineProps<{
  modules: DiagnosticAssessmentModule[]
  overallScore: number | null
  overallScoreRange: [number, number] | null
  activeModuleId: string | null
}>()

// Paper 排序只用于识别本次相对强弱，不改变接口返回和页面展示顺序。
const sortedModules = computed(() => [...props.modules].sort((a, b) => moduleAccuracy(b) - moduleAccuracy(a)))
const strongerModule = computed(() => sortedModules.value[0] || null)
const weakerModule = computed(() => sortedModules.value[sortedModules.value.length - 1] || null)
const paperGap = computed(() => {
  if (!strongerModule.value || !weakerModule.value || strongerModule.value.id === weakerModule.value.id) return 0
  return Math.max(0, (moduleAccuracy(strongerModule.value) - moduleAccuracy(weakerModule.value)) * 100)
})
const formattedOverallRange = computed(() => {
  if (props.overallScoreRange) {
    return `${props.overallScoreRange[0].toFixed(1)}–${props.overallScoreRange[1].toFixed(1)}`
  }
  return props.overallScore === null ? '暂无' : props.overallScore.toFixed(1)
})

// 模块正确率优先使用题数计算，避免历史快照中的比例格式差异。
function moduleAccuracy(module: DiagnosticAssessmentModule): number {
  return module.total > 0 ? module.correct / module.total : 0
}

// 页面只保留用户熟悉的 Paper 名称，去除报告内部的考试前缀和解释后缀。
function shortLabel(label: string): string {
  return label.replace(/^TMUA\s*/i, '').replace(/\s*·.*$/, '')
}

// 综合估分映射到 TMUA 1.0—9.0 标尺。
function scoreBandStyle(range: [number, number]): Record<string, string> {
  const left = Math.max(0, Math.min(100, ((range[0] - 1) / 8) * 100))
  const right = Math.max(left, Math.min(100, ((range[1] - 1) / 8) * 100))
  return { left: `${left}%`, width: `${Math.max(2, right - left)}%` }
}

// 点估分与区间同时存在时用于标记区间中心位置。
function scorePointStyle(score: number): Record<string, string> {
  return { left: `${Math.max(0, Math.min(100, ((score - 1) / 8) * 100))}%` }
}

// Paper 条形长度表示原始作答正确率，不伪装成官方独立卷分数。
function accuracyBarStyle(module: DiagnosticAssessmentModule): Record<string, string> {
  return { width: `${Math.max(0, Math.min(100, moduleAccuracy(module) * 100))}%` }
}

// 正确率标签与原始题数保持一致。
function formatAccuracy(module: DiagnosticAssessmentModule): string {
  return `${Math.round(moduleAccuracy(module) * 100)}%`
}

// 双卷标签只描述本次内部相对关系，不推断官方能力等级。
function moduleStatus(module: DiagnosticAssessmentModule): string {
  if (props.modules.length < 2 || paperGap.value < 10) return '表现接近'
  return module.id === weakerModule.value?.id ? '优先提升' : '相对较强'
}
</script>

<style scoped lang="scss">
.tmua-score-chart { display: grid; gap: 16px; margin-top: 18px; }
.score-overview { display: grid; grid-template-columns: minmax(0,1.45fr) minmax(190px,.55fr); gap: 12px; }
.estimate-card, .gap-card, .paper-comparison { border: 1px solid #dce5df; border-radius: 10px; background: #f8fbf9; }
.estimate-card { padding: 16px 18px; }
.metric-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; }
.metric-heading span, .paper-comparison header span { display: block; color: #5a6961; font-size: 11px; }
.metric-heading strong { display: block; margin-top: 3px; color: #173f32; font-size: 25px; font-weight: 650; }
.metric-heading small, .paper-comparison header small { color: #829087; font-size: 10px; }
.estimate-scale { margin-top: 13px; }
.estimate-scale__labels { display: flex; justify-content: space-between; color: #819087; font-size: 9px; }
.estimate-scale__track { position: relative; height: 10px; margin-top: 6px; border-radius: 5px; background: #dfe7e2; }
.estimate-scale__band { position: absolute; top: 0; height: 10px; border-radius: 5px; background: #86b5a2; }
.estimate-scale__point { position: absolute; top: 50%; width: 14px; height: 14px; transform: translate(-50%,-50%); border: 3px solid #fff; border-radius: 50%; background: #1e604a; box-shadow: 0 0 0 1px #1e604a; }
.gap-card { display: flex; padding: 16px 18px; flex-direction: column; justify-content: center; background: #f2f7f4; }
.gap-card--clear { border-color: #e5c896; background: #fff8eb; }
.gap-card > span { color: #66746c; font-size: 10px; }
.gap-card > strong { margin-top: 5px; color: #193d31; font-size: 25px; font-weight: 650; }
.gap-card > strong small { font-size: 11px; font-weight: 500; }
.gap-card p { margin: 7px 0 0; color: #5b6961; font-size: 10px; line-height: 1.55; }
.paper-comparison { padding: 16px 18px 18px; background: #fff; }
.paper-comparison header { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; }
.paper-comparison header span { color: #1c4034; font-size: 13px; font-weight: 650; }
.paper-comparison header small { display: block; margin-top: 3px; }
.chart-legend { color: #7d8982; font-size: 9px; white-space: nowrap; }
.chart-legend i { display: inline-block; width: 10px; height: 6px; margin-right: 4px; border-radius: 3px; background: #2e7d5b; }
.paper-axis, .paper-row { display: grid; grid-template-columns: 105px minmax(190px,1fr) 48px 66px; gap: 12px; align-items: center; }
.paper-axis { margin-top: 13px; color: #8a958f; font-size: 8px; }
.paper-axis__ticks { display: flex; justify-content: space-between; }
.paper-axis__ticks span { transform: translateX(-50%); }
.paper-axis__ticks span:first-child { transform: none; }
.paper-axis__ticks span:last-child { transform: none; }
.paper-row { margin-top: 8px; padding: 10px 9px; border: 1px solid transparent; border-radius: 7px; }
.paper-row--active { border-color: #b9d7c9; background: #f2f8f5; }
.paper-row--weak { background: #fffaf1; }
.paper-label strong, .paper-label small { display: block; }
.paper-label strong { color: #213d34; font-size: 12px; }
.paper-label small { margin-top: 2px; color: #89938d; font-size: 9px; }
.paper-track { position: relative; height: 14px; overflow: hidden; border-radius: 7px; background: #e7ece9; }
.paper-track i { display: block; height: 100%; border-radius: 7px; background: #2e7d5b; }
.paper-row--weak .paper-track i { background: #c17a24; }
.paper-track span { position: absolute; top: 0; width: 1px; height: 100%; background: rgba(255,255,255,.65); }
.paper-row > b { color: #173f32; font-size: 14px; text-align: right; }
.paper-row > em { padding: 4px 6px; border-radius: 5px; background: #e1eee8; color: #245c47; font-size: 9px; font-style: normal; text-align: center; }
.paper-row--weak > em { background: #fae8ca; color: #885516; }

@media (max-width: 760px) {
  .score-overview { grid-template-columns: 1fr; }
  .paper-axis { display: none; }
  .paper-row { grid-template-columns: 82px minmax(100px,1fr) 42px; gap: 8px; }
  .paper-row > em { grid-column: 2 / -1; justify-self: end; }
}
</style>
