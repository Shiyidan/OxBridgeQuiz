<!-- 诊断报告首部分：展示报告头、模块切换和等效评估分。 -->
<template>
  <section class="diagnostic-summary">
    <header class="report-header">
      <h1>{{ report.header.title }}</h1>
      <div v-if="report.header.modules.length > 1" class="module-tabs" role="tablist" aria-label="考试模块">
        <button
          v-for="module in report.header.modules"
          :key="module.id"
          type="button"
          role="tab"
          :aria-selected="activeModuleId === module.id"
          :class="{ 'module-tab--active': activeModuleId === module.id }"
          @click="activeModuleId = module.id"
        >
          {{ module.label }}
        </button>
      </div>
    </header>

    <div class="section-title">
      <span class="section-title__icon" aria-hidden="true">◎</span>
      <h2>等效评估分</h2>
    </div>

    <article class="assessment-card">
      <div class="score-hero">
        <span class="score-hero__label">{{ scoreLabel }}</span>
        <div v-if="displayScore !== null" class="score-hero__value">
          <strong>{{ displayScore.toFixed(1) }}</strong>
          <span>{{ displayScaleLabel }}</span>
          <small v-if="displayRange">区间 [{{ displayRange[0].toFixed(1) }} - {{ displayRange[1].toFixed(1) }}]</small>
        </div>
        <div v-else class="score-hero__unavailable">暂无可靠换算结果</div>
        <p>基于本次 {{ displayedQuestionCount }} 题，{{ report.assessment.methodNote }}</p>
      </div>

      <div v-if="displayPositioning" class="positioning-block">
        <h3>水平定位与竞争力评估</h3>
        <div class="positioning-track" aria-hidden="true">
          <span :style="{ width: `${displayPositioning.percentileValue || 0}%` }"></span>
          <i :style="{ left: `${displayPositioning.percentileValue || 0}%` }"></i>
        </div>
        <div class="positioning-result">
          <b>{{ displayPositioning.performanceLevel }}</b>
          <strong>{{ displayPositioning.percentileLabel }}</strong>
        </div>
        <p>{{ displayPositioning.competitiveness }}</p>
        <small>{{ displayPositioning.cohortReference }}</small>
      </div>

      <div v-if="report.assessment.modules.length" class="module-performance">
        <h3>{{ report.header.examType === 'ESAT' ? '模块表现' : '分卷表现' }}</h3>
        <div class="module-performance__grid">
          <button
            v-for="module in report.assessment.modules"
            :key="module.id"
            type="button"
            class="module-score-card"
            :class="{ 'module-score-card--active': activeModuleId === module.id }"
            @click="activeModuleId = module.id"
          >
            <span>{{ module.label }} {{ report.header.examType === 'TMUA' ? '诊断参考分' : '预估分' }}</span>
            <strong>{{ module.score === null ? '-' : module.score.toFixed(1) }}</strong>
            <small>{{ module.correct }}/{{ module.total }} 题正确</small>
            <p>{{ module.summary }}</p>
          </button>
        </div>
      </div>

      <div class="difficulty-block">
        <div class="difficulty-heading">
          <div>
            <h3>难度掌握度分析</h3>
            <p>以下统计仅针对当前选择的{{ moduleContextName }}</p>
          </div>
          <div class="module-context" aria-live="polite">
            <span>当前查看</span>
            <strong>{{ activeModuleLabel }}</strong>
            <small>共 {{ activeModuleQuestionCount }} 题</small>
          </div>
        </div>
        <div :key="activeModuleId" class="difficulty-grid">
          <article
            v-for="item in displayedDifficultyMastery"
            :key="item.level"
            class="difficulty-item"
            :class="{ 'difficulty-item--empty': item.total === 0 }"
          >
            <div class="difficulty-item__meta">
              <span>{{ item.label }}</span>
              <small>{{ activeModuleLabel }}</small>
            </div>
            <template v-if="item.total > 0">
              <strong :class="difficultyClass(item.accuracy)">{{ formatAccuracy(item.accuracy) }}</strong>
              <small>{{ item.correct }}/{{ item.total }} 题正确</small>
            </template>
            <template v-else>
              <strong class="difficulty-item__empty-text">无此难度题</strong>
              <small>{{ activeModuleLabel }}未包含{{ item.label }}题目</small>
            </template>
          </article>
        </div>
      </div>

      <div v-if="report.assessment.riskSignal" class="risk-signal">
        <span aria-hidden="true">•</span>
        <p>{{ report.assessment.riskSignal }}</p>
      </div>
      <div v-else class="risk-signal risk-signal--unavailable">
        <p>风险信号暂未生成，不影响本页固定计算结果。</p>
      </div>
    </article>

    <div class="next-part-placeholder">总体成绩概览将在下一阶段开发</div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type {
  DiagnosticAssessmentModule,
  DiagnosticPositioning,
  DiagnosticReportSummary,
} from '@/api/exam'

const props = defineProps<{ report: DiagnosticReportSummary }>()

const activeModuleId = ref(props.report.header.modules[0]?.id || '')

// 报告数据刷新后保证当前分卷仍存在，否则回到第一个分卷。
watch(
  () => props.report.header.modules,
  (modules) => {
    if (!modules.some((module) => module.id === activeModuleId.value)) {
      activeModuleId.value = modules[0]?.id || ''
    }
  },
)

// 当前分卷驱动分卷卡片高亮和难度掌握度切换。
const activeModule = computed<DiagnosticAssessmentModule | null>(
  () => props.report.assessment.modules.find((module) => module.id === activeModuleId.value) || null,
)

// 兼容旧混合组件；ESAT 已迁移到独立页面，TMUA 始终使用单一总分。
const usesModuleScore = computed(() => props.report.header.examType === 'ESAT')

// 主分数按考试规则选择 TMUA 总分或兼容模块分。
const displayScore = computed(() =>
  usesModuleScore.value ? activeModule.value?.score ?? null : props.report.assessment.score,
)

// 分数区间与当前主分数保持相同统计口径。
const displayRange = computed<[number, number] | null>(() =>
  usesModuleScore.value ? activeModule.value?.scoreRange ?? null : props.report.assessment.scoreRange,
)

// 评分标尺根据当前展示的分数对象读取。
const displayScaleLabel = computed(() =>
  usesModuleScore.value ? activeModule.value?.scaleLabel || '/ 9.0' : props.report.assessment.scaleLabel,
)

// 水平定位与当前主分数同步，避免跨分卷混用百分位。
const displayPositioning = computed<DiagnosticPositioning | null>(() =>
  usesModuleScore.value ? activeModule.value?.positioning ?? null : props.report.assessment.positioning,
)

// 题量说明使用当前评分范围内的实际题目数。
const displayedQuestionCount = computed(() =>
  usesModuleScore.value ? activeModule.value?.total || 0 : props.report.assessment.basedOnQuestions,
)

// 难度掌握度始终切换到当前选择的分卷。
const displayedDifficultyMastery = computed(() =>
  activeModule.value?.difficultyMastery || props.report.assessment.difficultyMastery,
)

// 当前分卷名称用于难度区的上下文提示。
const activeModuleLabel = computed(() => activeModule.value?.label || '整份试卷')

// 当前分卷题量用于避免把分卷统计误解为整卷统计。
const activeModuleQuestionCount = computed(() =>
  activeModule.value?.total ?? props.report.assessment.basedOnQuestions,
)

// TMUA 使用“试卷”语义，兼容旧数据时其他考试使用“科目”。
const moduleContextName = computed(() =>
  props.report.header.examType === 'TMUA' ? '试卷' : '科目',
)

// 分数标题明确当前展示的是总分还是模块分。
const scoreLabel = computed(() =>
  usesModuleScore.value && activeModule.value
    ? `${activeModule.value.label} 等效评估分`
    : '等效评估分',
)

// 正确率只保留整数百分比，避免样本较少时产生伪精确。
function formatAccuracy(value: number | null): string {
  return value === null ? '-' : `${Math.round(value * 100)}%`
}

// 难度状态只映射颜色 token，不改变后端计算结果。
function difficultyClass(value: number | null): string {
  if (value === null) return 'difficulty-value--muted'
  if (value >= 0.7) return 'difficulty-value--strong'
  if (value >= 0.4) return 'difficulty-value--medium'
  return 'difficulty-value--weak'
}
</script>

<style scoped lang="scss">
.diagnostic-summary {
  width: 100%;
}

.report-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 52px;
  margin-bottom: 32px;
  border-bottom: 1px solid var(--color-line);
}

.report-header h1 {
  margin: 0 0 14px;
  font-size: var(--text-2xl);
}

.module-tabs {
  display: inline-flex;
  align-self: flex-start;
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.module-tabs button {
  min-width: 100px;
  height: 36px;
  padding: 0 20px;
  border: 0;
  border-right: 1px solid var(--color-line);
  background: var(--color-surface);
  color: var(--color-ink-soft);
  cursor: pointer;
}

.module-tabs button:last-child {
  border-right: 0;
}

.module-tabs .module-tab--active {
  background: var(--color-ink);
  color: var(--color-ink-inverse);
}

.section-title {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 16px;
}

.section-title__icon {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: var(--radius-sm);
  background: var(--color-info-bg);
  color: var(--color-charcoal);
  font-weight: var(--weight-bold);
}

.section-title h2 {
  margin: 0;
  font-size: var(--text-lg);
}

.assessment-card {
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.score-hero {
  padding: 34px;
  text-align: center;
  background: var(--color-surface-alt);
}

.score-hero__label {
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
}

.score-hero__value {
  display: flex;
  gap: 10px;
  align-items: baseline;
  justify-content: center;
  margin: 6px 0;
}

.score-hero__value strong {
  font-size: var(--text-5xl);
  line-height: var(--leading-tight);
}

.score-hero__value > span,
.score-hero__value small,
.score-hero p,
.positioning-block small {
  color: var(--color-ink-muted);
}

.score-hero__unavailable {
  margin: 12px 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-semi);
}

.score-hero p {
  margin: 8px 0 0;
  font-size: var(--text-sm);
}

.positioning-block,
.module-performance,
.difficulty-block {
  padding: 28px 32px;
  border-top: 1px solid var(--color-line-soft);
}

.positioning-block h3,
.module-performance h3,
.difficulty-block h3 {
  margin: 0 0 20px;
  font-size: var(--text-base);
}

.difficulty-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.difficulty-heading h3 {
  margin-bottom: 6px;
}

.difficulty-heading p {
  margin: 0;
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
}

.module-context {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 250px;
  padding: 10px 14px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);
}

.module-context span,
.module-context small {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.module-context strong {
  margin-left: auto;
}

.positioning-track {
  position: relative;
  height: 8px;
  margin: 36px 16px 20px;
  border-radius: var(--radius-pill);
  background: var(--color-line-soft);
}

.positioning-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-charcoal);
}

.positioning-track i {
  position: absolute;
  top: 50%;
  width: 14px;
  height: 14px;
  border: 3px solid var(--color-surface);
  border-radius: 50%;
  background: var(--color-black);
  transform: translate(-50%, -50%);
  box-shadow: var(--shadow-sm);
}

.positioning-result {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
}

.positioning-result b {
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  background: var(--color-info-bg);
  font-size: var(--text-xs);
}

.positioning-block p,
.positioning-block small {
  display: block;
  margin: 10px 0 0;
  text-align: center;
}

.module-performance__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.difficulty-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  animation: difficulty-enter var(--duration-base) var(--ease-out);
}

.module-score-card,
.difficulty-item {
  min-width: 0;
  padding: 18px 20px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-ink);
  text-align: left;
}

.module-score-card {
  cursor: pointer;
}

.module-score-card--active {
  border-color: var(--color-charcoal);
  box-shadow: inset 3px 0 0 var(--color-charcoal);
}

.module-score-card strong,
.difficulty-item strong {
  display: block;
  margin: 6px 0;
  font-size: var(--text-2xl);
}

.module-score-card small,
.difficulty-item small,
.module-score-card p {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.module-score-card p {
  margin: 10px 0 0;
}

.difficulty-item {
  position: relative;
  overflow: hidden;
}

.difficulty-item::before {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 3px;
  background: var(--color-charcoal);
  content: '';
}

.difficulty-item--empty::before {
  background: var(--color-line);
}

.difficulty-item__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.difficulty-item__meta small {
  padding: 2px 7px;
  border-radius: var(--radius-pill);
  background: var(--color-info-bg);
  color: var(--color-ink-soft);
}

.difficulty-item__empty-text {
  color: var(--color-ink-muted);
  font-size: var(--text-lg);
}

.difficulty-value--strong {
  color: var(--color-success);
}

.difficulty-value--medium {
  color: var(--color-warning);
}

.difficulty-value--weak {
  color: var(--color-danger);
}

.difficulty-value--muted {
  color: var(--color-ink-muted);
}

.risk-signal {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin: 16px 24px 24px;
  padding: 14px 16px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-info-bg);
}

.risk-signal span {
  font-size: var(--text-xl);
  line-height: 1;
}

.risk-signal p {
  margin: 0;
  line-height: var(--leading-relaxed);
}

.risk-signal--unavailable {
  color: var(--color-ink-muted);
}

.next-part-placeholder {
  margin-top: 24px;
  padding: 18px;
  border: 1px dashed var(--color-line);
  border-radius: var(--radius-md);
  color: var(--color-ink-muted);
  text-align: center;
}

@keyframes difficulty-enter {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
