<!-- 诊断报告 V1 ESAT 估分模块：兼容展示历史模块评分、定位与诊断分析。 -->
<template>
  <section class="report-section">
    <div class="module-toolbar">
      <div class="section-title">
        <span aria-hidden="true">◎</span>
        <div>
          <h2>等效评估分</h2>
          <p>{{ module.label }} · ESAT 各模块独立评分，不计算总分</p>
        </div>
      </div>
      <div class="module-tabs" role="tablist" aria-label="ESAT 等效评估分科目模块">
        <button
          v-for="item in modules"
          :key="item.id"
          type="button"
          role="tab"
          :aria-selected="activeModuleId === item.id"
          :class="{ 'module-tab--active': activeModuleId === item.id }"
          @click="selectModule(item.id)"
        >
          {{ item.label }}
        </button>
      </div>
    </div>

    <article class="assessment-card">
      <div class="module-identity">
        <span>当前模块</span>
        <strong>{{ module.label }}</strong>
        <small>{{ module.correct }}/{{ module.total }} 题正确</small>
      </div>

      <div class="score-hero">
        <div class="score-heading">
          <div>
            <span>模块等效评估分</span>
            <el-tooltip placement="top" effect="light" :show-after="150">
              <template #content>
                <div class="calculation-tooltip">
                  当前模块先计算原始正确率；题量不是标准27题时，按正确率归一为/27等效原始分，
                  再通过ESAT模块参考换算曲线得到1.0–9.0评估分。
                </div>
              </template>
              <button type="button" class="info-trigger" aria-label="查看等效评估分计算方式">
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <circle cx="10" cy="10" r="8"></circle>
                  <path d="M10 9v5"></path>
                  <circle cx="10" cy="6" r=".7"></circle>
                </svg>
              </button>
            </el-tooltip>
          </div>
        </div>

        <div class="score-overview">
          <div class="score-primary">
            <span>当前点估分</span>
            <div v-if="module.score !== null" class="score-value">
              <strong>{{ module.score.toFixed(1) }}</strong>
              <em>{{ module.scaleLabel }}</em>
            </div>
            <div v-else class="score-unavailable">暂无可靠换算结果</div>
            <div v-if="module.scoreRange" class="score-reference-line">
              <span>估分参考区间（80%）</span>
              <el-tooltip placement="top" effect="light" :show-after="150">
                <template #content>
                  <div class="calculation-tooltip">
                    使用Wilson 80%正确率区间表达小样本不确定性，再映射到ESAT评估分。
                    这不是官方成绩区间；题量越少，范围通常越宽。
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
                {{ module.scoreRange[0].toFixed(1) }}
                <i>—</i>
                {{ module.scoreRange[1].toFixed(1) }}
              </strong>
              <small>仅用于表示当前题量下的估分不确定性</small>
            </div>
            <small v-else>基于本次模块作答结果</small>
          </div>
        </div>

        <p v-if="module.notice" class="normalization-hint">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="10" cy="10" r="8"></circle>
            <path d="M10 9v5"></path>
            <circle cx="10" cy="6" r=".7"></circle>
          </svg>
          <span>
            {{ module.notice }}
            <span class="normalization-calculation">
              换算过程：{{ module.correct }} ÷ {{ module.total }} =
              {{ formatRawAccuracy(module.correct, module.total) }}，
              {{ formatRawAccuracy(module.correct, module.total) }} × 27 =
              {{ formatEquivalentRaw(module.equivalentRawScore) }}。
            </span>
          </span>
        </p>
      </div>

      <div v-if="module.positioning" class="content-block">
        <div class="block-heading">
          <h3>{{ module.label }} 水平定位与竞争力评估</h3>
          <span>模块独立参考</span>
        </div>
        <EsatScoreDistributionChart :module-id="module.id" :score="module.score" />
        <div
          class="positioning-result"
          :class="positioningToneClass(referencePercentile)"
        >
          <div>
            <span class="positioning-result__label">
              <small>当前表现等级</small>
              <el-tooltip
                placement="top"
                effect="light"
                :show-after="150"
                :content="performanceLevelExplanation(module.positioning.performanceLevel, module.score)"
              >
                <button type="button" class="info-trigger" aria-label="查看表现等级划分原因">
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <circle cx="10" cy="10" r="8"></circle>
                    <path d="M10 9v5"></path>
                    <circle cx="10" cy="6" r=".7"></circle>
                  </svg>
                </button>
              </el-tooltip>
            </span>
            <b>{{ module.positioning.performanceLevel }}</b>
          </div>
          <div>
            <small>参考百分位</small>
            <strong>{{ referencePercentileLabel }}</strong>
          </div>
          <p>
            <span v-if="module.positioning.analysisSource === 'deepseek'" class="ai-analysis-badge">
              AI 分析
            </span>
            {{ module.positioning.competitiveness }}
          </p>
        </div>
        <small class="positioning-reference">
          参考百分位按当前模块官方成绩分布累计估算；当前分数仍是基于本次作答的等效预估分
        </small>
      </div>

      <section v-if="module.diagnosticAnalysis" class="module-diagnostic">
        <div class="module-diagnostic__heading">
          <div>
            <strong>{{ module.label }} 模块诊断分析</strong>
            <span
              class="analysis-source"
              :class="{ 'analysis-source--ai': module.diagnosticAnalysis.source !== 'fallback' }"
            >
              {{ diagnosticAnalysisSourceLabel(module.diagnosticAnalysis.source) }}
            </span>
          </div>
          <small>依据当前模块的分数、正确率与难度表现生成</small>
        </div>
        <p class="diagnostic-summary">{{ module.diagnosticAnalysis.summary }}</p>
        <div class="diagnostic-grid">
          <article class="diagnostic-item diagnostic-item--strength">
            <span>相对优势</span>
            <p>{{ module.diagnosticAnalysis.strength }}</p>
          </article>
          <article class="diagnostic-item diagnostic-item--issue">
            <span>关键问题</span>
            <p>{{ module.diagnosticAnalysis.keyIssue }}</p>
          </article>
          <article class="diagnostic-item diagnostic-item--focus">
            <span>提升重点</span>
            <p>{{ module.diagnosticAnalysis.focusSuggestion }}</p>
          </article>
        </div>
      </section>
      <div v-else class="risk-signal" :class="{ 'risk-signal--unavailable': !module.riskSignal }">
        <strong>{{ module.label }} 诊断提示</strong>
        <p v-if="module.riskSignal">{{ module.riskSignal }}</p>
        <p v-else>诊断提示暂未生成，不影响模块固定计算结果。</p>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DiagnosticAssessmentModule } from '@/api/exam'
import { estimateEsatPercentile } from '@/data/esatScoreDistribution'
import EsatScoreDistributionChart from '../shared/EsatScoreDistributionChart.vue'

const props = defineProps<{
  module: DiagnosticAssessmentModule
  modules: DiagnosticAssessmentModule[]
  activeModuleId: string
}>()

const emit = defineEmits<{
  selectModule: [moduleId: string]
}>()

const referencePercentile = computed(() => estimateEsatPercentile(props.module.id, props.module.score))
const referencePercentileLabel = computed(() => {
  if (referencePercentile.value === null) return '暂无参考'
  return `约第 ${referencePercentile.value} 百分位`
})

// 混合来源表示部分模型字段被规则补齐，页面需如实区分全量 AI 与纯规则结果。
function diagnosticAnalysisSourceLabel(source: 'deepseek' | 'mixed' | 'fallback'): string {
  if (source === 'deepseek') return 'AI 分析'
  if (source === 'mixed') return 'AI + 规则'
  return '规则分析'
}

// 模块卡片只允许提交实际存在的模块 ID，避免页面科目状态越界。
function selectModule(moduleId: string): void {
  if (props.modules.some((item) => item.id === moduleId)) emit('selectModule', moduleId)
}

// 等效原始分统一保留一位小数，并在缺失时显示短横线。
function formatEquivalentRaw(value: number | null | undefined): string {
  return value === null || value === undefined ? '-' : value.toFixed(1)
}

// 原始正确率保留一位小数，用于清楚展示归一化前的计算依据。
function formatRawAccuracy(correct: number, total: number): string {
  return total > 0 ? `${((correct / total) * 100).toFixed(1)}%` : '-'
}

// Tooltip 区分平台表现分档与官方成绩分布百分位，避免把两种定位口径混为一谈。
function performanceLevelExplanation(level: string, score: number | null): string {
  const ranges: Record<string, string> = {
    Excellent: '8.0-9.0',
    'Very Good': '7.0-7.9',
    Good: '6.0-6.9',
    Average: '4.0-5.9',
    'Below Average': '1.0-3.9',
  }
  const scoreLabel = score === null ? '暂无预估分' : `当前预估分 ${score.toFixed(1)}`
  const rangeLabel = ranges[level] || '对应分数档位'
  return `${scoreLabel}，落在 ${rangeLabel}，因此划分为 ${level}。表现等级由平台按预估分固定分档；旁边的参考百分位则按当前模块官方成绩分布估算。`
}

// 定位结果颜色仅表达官方参考分布中的累计位置，不改变预估分本身。
function positioningToneClass(value: number | null): string {
  if ((value ?? 0) >= 70) return 'positioning-result--strong'
  if ((value ?? 0) >= 40) return 'positioning-result--average'
  return 'positioning-result--weak'
}
</script>

<style scoped lang="scss">
.report-section {
  margin-bottom: 28px;
}

.module-toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  gap: 12px;
  align-items: center;
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
.block-heading h3,
.block-heading p {
  margin: 0;
}

.module-tabs {
  display: inline-flex;
  overflow: hidden;
  flex: 0 0 auto;
  border: 1px solid #dddce6;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.module-tabs button {
  min-width: 96px;
  height: 38px;
  padding: 0 12px;
  border: 0;
  border-right: 1px solid #e6e5ed;
  background: #fafafd;
  color: #56536a;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.module-tabs button:last-child {
  border-right: 0;
}

.module-tabs .module-tab--active {
  background: #4a485e;
  color: var(--color-ink-inverse);
}

.section-title h2 {
  font-size: var(--text-lg);
}

.section-title p,
.block-heading p {
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

.module-identity {
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 14px 28px;
  border-bottom: 1px solid var(--color-line-soft);
  background: var(--color-surface-alt);
}

.module-identity span,
.module-identity small {
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
}

.module-identity strong {
  font-size: var(--text-lg);
}

.module-identity small {
  margin-left: auto;
}

.score-hero {
  padding: 28px 32px 30px;
}

.score-heading,
.score-heading > div {
  display: flex;
  align-items: center;
}

.score-heading {
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

.info-trigger:hover {
  color: var(--color-report-blue);
}

.info-trigger svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.5;
}

.calculation-tooltip {
  max-width: 320px;
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
  line-height: var(--leading-relaxed);
}

.score-overview {
  width: 100%;
}

.score-primary {
  display: flex;
  min-height: 165px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  border-color: var(--color-report-purple-soft);
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

.score-reference-line {
  display: flex;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
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

.score-unavailable {
  margin: 14px 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-semi);
}

.normalization-hint {
  display: flex;
  gap: 6px;
  align-items: flex-start;
  margin: 10px 4px 0;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  line-height: var(--leading-relaxed);
}

.normalization-calculation {
  margin-left: 4px;
  color: var(--color-ink-soft);
}

.normalization-hint svg {
  width: 14px;
  height: 14px;
  flex: 0 0 auto;
  fill: none;
  stroke: var(--color-report-orange);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.5;
}

.content-block {
  padding: 28px 32px;
  border-top: 1px solid var(--color-line-soft);
}

.block-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.block-heading > span {
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
}

.positioning-result {
  display: flex;
  max-width: 820px;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin: 16px auto 0;
  overflow: hidden;
  border: 1px solid var(--color-line-soft);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.positioning-result > div {
  display: grid;
  min-width: 150px;
  gap: 3px;
  padding: 12px 18px;
  border-right: 1px solid var(--color-line-soft);
}

.positioning-result__label {
  display: flex;
  align-items: center;
  gap: 4px;
}

.positioning-result__label .info-trigger {
  width: 16px;
  height: 16px;
}

.positioning-result__label .info-trigger svg {
  width: 14px;
  height: 14px;
}

.positioning-result small {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.positioning-result b,
.positioning-result strong {
  font-size: var(--text-base);
}

.positioning-result p {
  flex: 1;
  margin: 0;
  padding: 12px 18px;
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
}

.ai-analysis-badge {
  display: inline-block;
  margin-right: 7px;
  padding: 2px 6px;
  border-radius: var(--radius-pill);
  background: var(--color-report-purple-soft);
  color: var(--color-report-purple);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  white-space: nowrap;
}

.positioning-result--weak b,
.positioning-result--weak strong {
  color: var(--color-report-orange);
}

.positioning-result--average b,
.positioning-result--average strong {
  color: var(--color-report-blue);
}

.positioning-result--strong b,
.positioning-result--strong strong {
  color: var(--color-report-green);
}

.positioning-reference {
  display: block;
  margin: 10px 0 0;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  text-align: center;
}

.risk-signal {
  margin: 16px 24px 24px;
  padding: 14px 16px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-info-bg);
}

.risk-signal p {
  margin: 6px 0 0;
  line-height: var(--leading-relaxed);
}

.risk-signal--unavailable {
  color: var(--color-ink-muted);
}

.module-diagnostic {
  margin: 16px 24px 24px;
  padding: 18px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);
}

.module-diagnostic__heading,
.module-diagnostic__heading > div {
  display: flex;
  align-items: center;
}

.module-diagnostic__heading {
  justify-content: space-between;
  gap: 14px;
}

.module-diagnostic__heading > div {
  gap: 8px;
}

.module-diagnostic__heading > div > strong {
  font-size: var(--text-base);
}

.module-diagnostic__heading > small {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
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
  margin: 14px 0 0;
  padding: 12px 14px;
  border: 1px solid var(--color-line-soft);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-ink-soft);
  line-height: var(--leading-relaxed);
}

.diagnostic-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.diagnostic-item {
  padding: 13px 14px;
  border: 1px solid var(--color-line-soft);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}

.diagnostic-item > span {
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
}

.diagnostic-item p {
  margin: 7px 0 0;
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

.diagnostic-item--strength {
  border-top: 3px solid var(--color-report-green);
}

.diagnostic-item--strength > span {
  color: var(--color-report-green);
}

.diagnostic-item--issue {
  border-top: 3px solid var(--color-report-orange);
}

.diagnostic-item--issue > span {
  color: var(--color-report-orange);
}

.diagnostic-item--focus {
  border-top: 3px solid var(--color-report-purple);
}

.diagnostic-item--focus > span {
  color: var(--color-report-purple);
}

@media (max-width: 760px) {
  .module-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .module-tabs {
    width: 100%;
  }

  .module-tabs button {
    min-width: 0;
    flex: 1;
    padding: 0 8px;
  }

  .module-identity {
    align-items: flex-start;
    flex-direction: column;
  }

  .module-identity small {
    margin-left: 0;
  }

  .content-block {
    padding: 24px 20px;
  }

  .block-heading {
    gap: 8px;
    align-items: flex-start;
    flex-direction: column;
  }

  .positioning-result {
    align-items: stretch;
    flex-direction: column;
  }

  .positioning-result > div {
    width: 100%;
    box-sizing: border-box;
    border-right: 0;
    border-bottom: 1px solid var(--color-line-soft);
  }

  .module-diagnostic__heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .diagnostic-grid {
    grid-template-columns: 1fr;
  }

}
</style>
