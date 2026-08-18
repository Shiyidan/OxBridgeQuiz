<!-- 诊断报告 V1 TMUA 估分模块：兼容展示历史综合分与双卷诊断证据。 -->
<template>
  <section class="report-section">
    <div class="section-title">
      <span aria-hidden="true">◎</span>
      <div>
        <h2>综合评估分</h2>
        <p>TMUA 正式成绩只报告一个综合分；Paper 1 与 Paper 2 共同构成诊断依据</p>
      </div>
    </div>

    <article class="assessment-card">
      <div class="score-hero">
        <div class="score-heading">
          <div>
            <span>TMUA 综合评估分</span>
            <el-tooltip placement="top" effect="light" :show-after="150">
              <template #content>
                <div class="calculation-tooltip">
                  本报告使用历史真题正确率与参考曲线生成诊断估值。正式 UAT-UK 成绩会使用
                  Rasch 模型对 Paper 1 和 Paper 2 联合等值，最终成绩以官方发布为准。
                </div>
              </template>
              <button type="button" class="info-trigger" aria-label="查看 TMUA 综合评估分计算说明">
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <circle cx="10" cy="10" r="8"></circle>
                  <path d="M10 9v5"></path>
                  <circle cx="10" cy="6" r=".7"></circle>
                </svg>
              </button>
            </el-tooltip>
          </div>
        </div>

        <div class="score-primary">
          <span>当前点估分</span>
          <div v-if="report.assessment.score !== null" class="score-value">
            <strong>{{ report.assessment.score.toFixed(1) }}</strong>
            <em>{{ report.assessment.scaleLabel }}</em>
          </div>
          <div v-else class="score-unavailable">暂无可靠换算结果</div>
          <div v-if="report.assessment.scoreRange" class="score-reference-line">
            <span>估分参考区间（80%）</span>
            <el-tooltip placement="top" effect="light" :show-after="150">
              <template #content>
                <div class="calculation-tooltip">
                  区间用于表示本次题量与作答波动带来的估值不确定性，不是官方成绩区间。
                </div>
              </template>
              <button type="button" class="info-trigger" aria-label="查看估分参考区间说明">
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <circle cx="10" cy="10" r="8"></circle>
                  <path d="M10 9v5"></path>
                  <circle cx="10" cy="6" r=".7"></circle>
                </svg>
              </button>
            </el-tooltip>
            <strong>
              {{ report.assessment.scoreRange[0].toFixed(1) }}
              <i>—</i>
              {{ report.assessment.scoreRange[1].toFixed(1) }}
            </strong>
            <small>只表达诊断估值的不确定性</small>
          </div>
          <small v-else>基于本次两卷作答结果</small>
        </div>

        <p class="calculation-hint">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="10" cy="10" r="8"></circle>
            <path d="M10 9v5"></path>
            <circle cx="10" cy="6" r=".7"></circle>
          </svg>
          <span>
            {{ report.assessment.methodNote }}。
            <span class="calculation-detail">{{ scoreComposition }}</span>
          </span>
        </p>
      </div>

      <div v-if="report.assessment.positioning && report.assessment.score !== null" class="content-block">
        <div class="block-heading">
          <h3>水平定位与竞争力评估</h3>
          <span>UAT-UK 官方锚点</span>
        </div>

        <div class="official-scale" aria-label="TMUA 官方分数定位锚点">
          <div class="official-scale__track" aria-hidden="true">
            <span class="official-scale__fill" :style="{ width: `${scorePosition}%` }"></span>
            <i class="official-scale__anchor official-scale__anchor--typical"></i>
            <i class="official-scale__anchor official-scale__anchor--top"></i>
            <b class="official-scale__marker" :style="{ left: `${scorePosition}%` }">
              {{ report.assessment.score.toFixed(1) }}
            </b>
          </div>
          <div class="official-scale__labels">
            <span class="official-scale__edge">1.0</span>
            <span class="official-scale__label official-scale__label--typical">
              <b>4.5</b><small>典型考生</small>
            </span>
            <span class="official-scale__label official-scale__label--top">
              <b>7.0</b><small>约 10% 考生高于此分</small>
            </span>
            <span class="official-scale__edge">9.0</span>
          </div>
        </div>

        <div class="positioning-result" :class="positioningToneClass">
          <div>
            <small>当前官方锚点位置</small>
            <b>{{ report.assessment.positioning.performanceLevel }}</b>
          </div>
          <p>{{ report.assessment.positioning.competitiveness }}</p>
        </div>
        <div class="positioning-reference">
          <a href="https://esat-tmua.ac.uk/test-results/" target="_blank" rel="noopener noreferrer">
            查看 UAT-UK 成绩说明
          </a>
        </div>
      </div>

      <section class="papers-analysis" aria-labelledby="tmua-papers-analysis-title">
        <div class="papers-analysis__heading">
          <div>
            <h3 id="tmua-papers-analysis-title">Paper 1 与 Paper 2 诊断对照</h3>
            <p>两卷共同决定综合表现，分卷参考仅用于识别能力差异和训练重点</p>
          </div>
          <span>依据正确率、难度表现与逐题记录生成</span>
        </div>

        <div class="papers-analysis__grid">
          <article v-for="item in orderedModules" :key="item.id" class="paper-diagnostic">
            <header class="paper-diagnostic__header">
              <div>
                <span>{{ paperTabLabel(item.id, item.label) }}</span>
                <strong>{{ item.label }}</strong>
              </div>
              <span
                v-if="item.diagnosticAnalysis"
                class="analysis-source"
                :class="{ 'analysis-source--ai': item.diagnosticAnalysis.source !== 'fallback' }"
              >
                {{ diagnosticAnalysisSourceLabel(item.diagnosticAnalysis.source) }}
              </span>
            </header>

            <div class="paper-diagnostic__metrics">
              <span><b>{{ item.correct }}/{{ item.total }}</b> 题正确</span>
              <span v-if="item.score !== null">分卷诊断参考 <b>{{ item.score.toFixed(1) }}</b></span>
            </div>

            <template v-if="item.diagnosticAnalysis">
              <p class="diagnostic-summary">{{ item.diagnosticAnalysis.summary }}</p>
              <div class="diagnostic-grid">
                <div class="diagnostic-item diagnostic-item--strength">
                  <span>相对优势</span>
                  <p>{{ item.diagnosticAnalysis.strength }}</p>
                </div>
                <div class="diagnostic-item diagnostic-item--issue">
                  <span>关键问题</span>
                  <p>{{ item.diagnosticAnalysis.keyIssue }}</p>
                </div>
                <div class="diagnostic-item diagnostic-item--focus">
                  <span>提升重点</span>
                  <p>{{ item.diagnosticAnalysis.focusSuggestion }}</p>
                </div>
              </div>
            </template>
            <div v-else class="risk-signal" :class="{ 'risk-signal--unavailable': !item.riskSignal }">
              <strong>诊断提示</strong>
              <p v-if="item.riskSignal">{{ item.riskSignal }}</p>
              <p v-else>本卷分析暂未生成，不影响综合分和作答统计结果。</p>
            </div>
          </article>
        </div>
      </section>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DiagnosticAssessmentModule, DiagnosticReportSummary } from '@/api/exam'

const props = defineProps<{
  report: DiagnosticReportSummary
  modules: DiagnosticAssessmentModule[]
}>()

// 两卷始终按正式考试顺序同时展示，未知分卷排在已识别分卷之后。
const orderedModules = computed(() => {
  const order = ['paper1', 'paper2']
  return [...props.modules].sort((left, right) => {
    const leftIndex = order.indexOf(left.id)
    const rightIndex = order.indexOf(right.id)
    return (leftIndex === -1 ? order.length : leftIndex)
      - (rightIndex === -1 ? order.length : rightIndex)
  })
})

// 当前估值在 1.0-9.0 官方量尺上的几何位置只用于画点，不转换成百分位。
const scorePosition = computed(() => {
  const score = props.report.assessment.score
  if (score === null) return 0
  return Math.max(0, Math.min(100, ((score - 1) / 8) * 100))
})

// 定位颜色仅区分官方两个锚点所在区间，不表达额外百分位信息。
const positioningToneClass = computed(() => {
  const score = props.report.assessment.score || 1
  if (score > 7) return 'positioning-result--strong'
  if (score >= 4.5) return 'positioning-result--average'
  return 'positioning-result--weak'
})

// 小字呈现综合估值的可追溯构成，并明确分卷分数属于平台诊断参考。
const scoreComposition = computed(() => {
  const parts = props.modules.map((item) => {
    const score = item.score === null ? '-' : item.score.toFixed(1)
    return `${paperTabLabel(item.id, item.label)} ${item.correct}/${item.total}（分卷参考 ${score}）`
  })
  return parts.length ? `估值构成：${parts.join('；')}。` : ''
})

// 分卷标签保持短而稳定，完整语义由当前分卷标题承担。
function paperTabLabel(moduleId: string, fallback: string): string {
  if (moduleId === 'paper1') return 'Paper 1'
  if (moduleId === 'paper2') return 'Paper 2'
  return fallback
}

// 模型字段存在部分降级时必须如实标记为混合分析。
function diagnosticAnalysisSourceLabel(source: 'deepseek' | 'mixed' | 'fallback'): string {
  if (source === 'deepseek') return 'AI 分析'
  if (source === 'mixed') return 'AI + 规则'
  return '规则分析'
}
</script>

<style scoped lang="scss">
.report-section {
  margin-bottom: 28px;
}

.section-title,
.score-heading,
.score-heading > div {
  display: flex;
  align-items: center;
}

.section-title {
  gap: 12px;
  margin-bottom: 16px;
}

.section-title > span {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: var(--radius-sm);
  background: var(--color-info-bg);
}

.section-title h2,
.section-title p,
.block-heading h3 {
  margin: 0;
}

.section-title h2 {
  font-size: var(--text-lg);
}

.section-title p {
  margin-top: 3px;
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
}

.assessment-card {
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.score-hero,
.content-block {
  padding: 28px 32px 30px;
}

.content-block {
  border-top: 1px solid var(--color-line-soft);
}

.score-heading,
.block-heading {
  justify-content: space-between;
  margin-bottom: 16px;
}

.score-heading > div {
  gap: 7px;
}

.score-heading > div > span {
  color: var(--color-ink-soft);
  font-weight: var(--weight-medium);
}

.info-trigger {
  display: grid;
  width: 20px;
  height: 20px;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--color-report-slate);
  cursor: help;
}

.info-trigger svg,
.calculation-hint svg {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.5;
}

.info-trigger svg {
  width: 17px;
  height: 17px;
}

.calculation-tooltip {
  max-width: 340px;
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
  line-height: var(--leading-relaxed);
}

.score-primary {
  display: flex;
  min-height: 165px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  border: 1px solid var(--color-report-purple-soft);
  border-radius: var(--radius-md);
  background: var(--color-report-purple-soft);
  text-align: center;
}

.score-primary > span,
.score-primary > small {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.score-value {
  display: flex;
  gap: 9px;
  align-items: baseline;
  margin: 7px 0;
}

.score-value strong {
  color: var(--color-report-purple);
  font-size: var(--text-6xl);
  line-height: var(--leading-tight);
}

.score-value em {
  color: var(--color-ink-soft);
  font-style: normal;
}

.score-unavailable {
  margin: 14px 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-semi);
}

.score-reference-line {
  display: flex;
  max-width: 100%;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 3px 12px;
  overflow-x: auto;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  white-space: nowrap;
}

.score-reference-line > strong {
  margin-left: 4px;
  color: var(--color-report-blue);
  font-size: var(--text-base);
}

.score-reference-line > strong i {
  margin: 0 4px;
  color: var(--color-report-slate);
  font-style: normal;
  font-weight: var(--weight-normal);
}

.score-reference-line > small::before {
  margin-right: 7px;
  content: '·';
}

.calculation-hint {
  display: flex;
  gap: 7px;
  align-items: flex-start;
  margin: 10px 4px 0;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  line-height: var(--leading-relaxed);
}

.calculation-hint svg {
  width: 14px;
  height: 14px;
  flex: 0 0 auto;
  color: var(--color-report-orange);
}

.calculation-detail {
  margin-left: 4px;
  color: var(--color-ink-soft);
}

.block-heading {
  display: flex;
  align-items: center;
}

.block-heading > span {
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
}

.official-scale {
  max-width: 900px;
  margin: 44px auto 34px;
  padding: 0 24px;
}

.official-scale__track {
  position: relative;
  height: 8px;
  border-radius: var(--radius-pill);
  background: var(--color-line-soft);
}

.official-scale__fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-report-purple);
}

.official-scale__anchor,
.official-scale__marker {
  position: absolute;
  transform: translateX(-50%);
}

.official-scale__anchor {
  top: -4px;
  width: 2px;
  height: 16px;
  background: var(--color-report-slate);
}

.official-scale__anchor--typical {
  left: 43.75%;
}

.official-scale__anchor--top {
  left: 75%;
}

.official-scale__marker {
  bottom: 17px;
  min-width: 42px;
  padding: 5px 8px;
  border-radius: var(--radius-sm);
  background: var(--color-report-purple);
  color: var(--color-ink-inverse);
  font-size: var(--text-xs);
  text-align: center;
}

.official-scale__marker::after {
  position: absolute;
  top: 100%;
  left: 50%;
  border: 5px solid transparent;
  border-top-color: var(--color-report-purple);
  content: '';
  transform: translateX(-50%);
}

.official-scale__labels {
  position: relative;
  display: flex;
  justify-content: space-between;
  min-height: 42px;
  margin-top: 12px;
}

.official-scale__edge,
.official-scale__label {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.official-scale__label {
  position: absolute;
  display: grid;
  gap: 2px;
  text-align: center;
  transform: translateX(-50%);
}

.official-scale__label b {
  color: var(--color-ink-soft);
}

.official-scale__label small {
  white-space: nowrap;
}

.official-scale__label--typical {
  left: 43.75%;
}

.official-scale__label--top {
  left: 75%;
}

.positioning-result {
  display: flex;
  max-width: 900px;
  align-items: stretch;
  margin: 16px auto 0;
  overflow: hidden;
  border: 1px solid var(--color-line-soft);
  border-radius: var(--radius-md);
}

.positioning-result > div {
  display: grid;
  min-width: 180px;
  align-content: center;
  gap: 4px;
  padding: 12px 18px;
  border-right: 1px solid var(--color-line-soft);
}

.positioning-result small {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.positioning-result p {
  flex: 1;
  margin: 0;
  padding: 14px 18px;
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

.positioning-result--weak b {
  color: var(--color-report-orange);
}

.positioning-result--average b {
  color: var(--color-report-blue);
}

.positioning-result--strong b {
  color: var(--color-report-green);
}

.positioning-reference {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

.positioning-reference a {
  color: var(--color-report-blue);
  font-size: var(--text-xs);
}

.papers-analysis {
  padding: 28px 32px 32px;
  border-top: 1px solid var(--color-line-soft);
}

.papers-analysis__heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 22px;
}

.papers-analysis__heading h3,
.papers-analysis__heading p {
  margin: 0;
}

.papers-analysis__heading p {
  margin-top: 4px;
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
}

.papers-analysis__heading > span {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  text-align: right;
}

.papers-analysis__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}

.paper-diagnostic {
  min-width: 0;
}

.paper-diagnostic + .paper-diagnostic {
  margin-top: 28px;
  padding-top: 28px;
  border-top: 1px solid var(--color-line-soft);
}

.paper-diagnostic__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.paper-diagnostic__header > div {
  display: grid;
  gap: 3px;
}

.paper-diagnostic__header > div > span {
  color: var(--color-report-purple);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
}

.paper-diagnostic__header strong {
  font-size: var(--text-base);
}

.paper-diagnostic__metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin-top: 12px;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.paper-diagnostic__metrics b {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
}

.analysis-source {
  padding: 3px 7px;
  border-radius: var(--radius-pill);
  background: var(--color-info-bg);
  color: var(--color-info);
  font-size: var(--text-xs);
}

.analysis-source--ai {
  background: var(--color-report-purple-soft);
  color: var(--color-report-purple);
}

.diagnostic-summary {
  margin: 16px 0 4px;
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

.diagnostic-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.diagnostic-item {
  padding: 13px 14px;
  border: 1px solid var(--color-line-soft);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}

.diagnostic-item > span {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
}

.diagnostic-item p,
.risk-signal p {
  margin: 6px 0 0;
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

.diagnostic-item--strength > span {
  color: var(--color-report-green);
}

.diagnostic-item--issue > span {
  color: var(--color-report-orange);
}

.diagnostic-item--focus > span {
  color: var(--color-report-blue);
}

.risk-signal--unavailable {
  color: var(--color-ink-muted);
}

.risk-signal {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--color-line-soft);
}

button:focus-visible,
a:focus-visible {
  outline: 2px solid var(--color-report-purple);
  outline-offset: 2px;
}

@media (max-width: 760px) {
  .papers-analysis__heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .papers-analysis__heading > span {
    text-align: left;
  }

  .score-hero,
  .content-block,
  .papers-analysis {
    padding: 22px 18px;
  }

  .positioning-result {
    flex-direction: column;
  }

  .positioning-result > div {
    border-right: 0;
    border-bottom: 1px solid var(--color-line-soft);
  }

  .diagnostic-grid {
    grid-template-columns: 1fr;
  }

  .official-scale {
    padding: 0 8px;
  }

  .official-scale__label small {
    max-width: 96px;
    white-space: normal;
  }
}
</style>
