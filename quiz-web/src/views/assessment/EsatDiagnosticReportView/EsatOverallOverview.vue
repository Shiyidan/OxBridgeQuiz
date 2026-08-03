<!-- ESAT 总体成绩概览模块：展示分模块作答统计，以及可直接指导训练安排的模块时间效率。 -->
<template>
  <section class="overview-section">
    <div class="section-title">
      <span aria-hidden="true">⌁</span>
      <h2>总体成绩概览</h2>
    </div>

    <div class="overview-grid">
      <article class="overview-card result-card">
        <div class="card-heading">
          <span>分模块成绩总览</span>
          <i class="status-mark" aria-hidden="true"></i>
        </div>

        <div class="module-breakdown">
          <div class="module-breakdown__heading">
            <strong>各模块作答明细</strong>
            <small>正确数与难度分布</small>
          </div>
          <div class="module-performance-list">
            <article v-for="module in modules" :key="module.id" class="module-performance">
              <div class="module-performance__heading">
                <span>{{ module.label }}</span>
                <div>
                  <strong>{{ module.correct }}/{{ module.total }}</strong>
                  <small>题正确 · {{ formatAccuracy(moduleAccuracy(module)) }}</small>
                </div>
              </div>
              <div class="module-accuracy-track" aria-hidden="true">
                <i :style="{ width: moduleAccuracyPercent(module) }"></i>
              </div>
              <div class="module-difficulty-list">
                <span
                  v-for="difficulty in module.difficultyMastery"
                  :key="difficulty.level"
                  :class="difficultyToneClass(difficulty.accuracy, difficulty.total)"
                >
                  <b>{{ difficulty.label }}</b>
                  <em>{{ difficulty.total ? `${difficulty.correct}/${difficulty.total}` : '无题' }}</em>
                </span>
              </div>
            </article>
          </div>
        </div>
      </article>

      <article class="overview-card timing-card">
        <div class="card-heading">
          <span>模块时间效率</span>
          <svg class="clock-icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9"></circle>
            <path d="M12 7v5l3 2"></path>
          </svg>
        </div>

        <p class="timing-card__intro">1.0× 为模块目标题时；结合正确率判断应优先提速还是回查准确性。</p>

        <div v-if="timingModules.length" class="module-timing-list">
          <article v-for="module in timingModules" :key="module.id" class="module-timing-item">
            <div class="module-timing-item__heading">
              <strong>{{ module.label }}</strong>
              <em :class="timingEfficiencyToneClass(module.timeEfficiencyIndex ?? null)">
                {{ formatEfficiencyIndex(module.timeEfficiencyIndex ?? null) }}
              </em>
            </div>
            <p>
              已记录 {{ module.timedQuestionCount ?? 0 }}/{{ module.totalQuestions ?? 0 }} 题
              · 正确率 {{ formatAccuracy(module.accuracy ?? null) }}
            </p>
            <small>{{ timingModuleSuggestion(module) }}</small>
          </article>
        </div>

        <div v-else class="timing-notice">
          {{ unavailableModuleTimingNotice(overview.timing) }}
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DiagnosticAssessmentModule, DiagnosticReportOverview } from '@/api/exam'

const props = defineProps<{
  overview: DiagnosticReportOverview
  modules: DiagnosticAssessmentModule[]
}>()

type TimingOverview = DiagnosticReportOverview['timing']
type TimingModule = DiagnosticReportOverview['timing']['modules'][number]

// 仅展示已有模块耗时指数的新版数据，旧报告或样本不足时给出明确说明。
const timingModules = computed(() => {
  if (props.overview.timing.analysisLevel === undefined || props.overview.timing.analysisLevel === 'unavailable') return []
  return props.overview.timing.modules.filter(
    (module) => module.timeEfficiencyIndex !== null && module.timeEfficiencyIndex !== undefined,
  )
})

// 正确率按原型保留一位小数，避免与计数结果产生视觉误差。
function formatAccuracy(value: number | null): string {
  return value === null ? '-' : `${(value * 100).toFixed(1)}%`
}

// 没有可用模块指数时说明缺失原因，不将空数据错误展示为零效率。
function unavailableModuleTimingNotice(timing: TimingOverview): string {
  if (timing.totalDurationSeconds === null) return '暂无可靠的总用时记录，暂不能生成时间效率分析。'
  if (timing.analysisLevel === undefined) return '当前报告使用旧版时间统计快照；生成新版报告后将展示模块时间效率。'
  return '当前逐题耗时样本不足，暂不能形成可靠的模块时间效率。'
}

// 时间效率指数以 1.0× 为目标，帮助学生判断模块更需要限时训练还是保持速度。
function formatEfficiencyIndex(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(1)}×`
}

// 颜色只表达相对速度，不直接评价知识掌握水平。
function timingEfficiencyToneClass(value: number | null): string {
  if (value === null) return 'module-timing-item__value--empty'
  if (value > 1.25) return 'module-timing-item__value--slow'
  if (value < 0.75) return 'module-timing-item__value--fast'
  return 'module-timing-item__value--target'
}

// 行动建议同时参考速度和正确率，避免仅凭答题快慢判断模块表现。
function timingModuleSuggestion(module: TimingModule): string {
  const efficiency = module.timeEfficiencyIndex ?? null
  const accuracy = module.accuracy ?? null
  if (efficiency !== null && efficiency > 1.25 && accuracy !== null && accuracy < 0.7) {
    return '优先安排限时专项与错题复盘。'
  }
  if (efficiency !== null && efficiency > 1.25) return '安排限时模块训练，提升解题熟练度。'
  if (efficiency !== null && efficiency < 0.75 && accuracy !== null && accuracy < 0.7) {
    return '速度较快但正确率待提升，复盘审题与计算检查。'
  }
  return '当前节奏可用，后续模考持续观察。'
}

// 模块正确率由答对数和实际题量直接计算，不使用预估分或难度加权。
function moduleAccuracy(module: DiagnosticAssessmentModule): number | null {
  return module.total > 0 ? module.correct / module.total : null
}

// 模块迷你进度条限制在0%-100%，避免异常数据破坏汇总卡布局。
function moduleAccuracyPercent(module: DiagnosticAssessmentModule): string {
  return `${Math.max(0, Math.min(100, (moduleAccuracy(module) || 0) * 100))}%`
}

// 难度标签颜色根据该层级正确率映射，并将无题层级单独显示为灰色。
function difficultyToneClass(accuracy: number | null, total: number): string {
  if (!total || accuracy === null) return 'difficulty-pill--empty'
  if (accuracy >= 0.7) return 'difficulty-pill--strong'
  if (accuracy >= 0.4) return 'difficulty-pill--medium'
  return 'difficulty-pill--weak'
}
</script>

<style scoped lang="scss">
.overview-section {
  margin-bottom: 28px;
}

.section-title {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.section-title > span {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: var(--radius-sm);
  background: var(--color-info-bg);
  color: var(--color-ink-soft);
  font-size: var(--text-xl);
}

.section-title h2 {
  margin: 0;
  font-size: var(--text-lg);
}

.overview-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  align-items: stretch;
  gap: 20px;
}

.overview-card {
  box-sizing: border-box;
  min-height: 350px;
  padding: 30px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.card-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--color-ink-soft);
}

.status-mark {
  position: relative;
  width: 34px;
  height: 34px;
  border: 2px solid var(--color-report-track);
  border-radius: 50%;
}

.status-mark::after {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-report-slate);
  content: '';
  opacity: 0.4;
  transform: translate(-50%, -50%);
}

.module-breakdown {
  margin-top: 22px;
}

.module-breakdown__heading,
.module-performance__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.module-breakdown__heading > strong {
  font-size: var(--text-sm);
}

.module-breakdown__heading > small {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.module-performance-list {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.module-performance {
  padding: 12px 13px;
  border: 1px solid var(--color-line-soft);
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);
}

.module-performance__heading > span {
  font-weight: var(--weight-medium);
}

.module-performance__heading > div {
  display: flex;
  align-items: baseline;
  gap: 5px;
}

.module-performance__heading > div > strong {
  color: var(--color-report-blue);
  font-size: var(--text-base);
}

.module-performance__heading > div > small {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.module-accuracy-track {
  height: 5px;
  margin-top: 8px;
  overflow: hidden;
  border-radius: var(--radius-pill);
  background: var(--color-report-track);
}

.module-accuracy-track i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-report-blue);
}

.module-difficulty-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  margin-top: 9px;
}

.module-difficulty-list > span {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  padding: 4px 7px;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
}

.module-difficulty-list b {
  font-weight: var(--weight-medium);
}

.module-difficulty-list em {
  font-style: normal;
}

.difficulty-pill--strong {
  background: var(--color-report-cell-strong);
  color: var(--color-report-green);
}

.difficulty-pill--medium {
  background: var(--color-report-cell-medium);
  color: var(--color-report-orange);
}

.difficulty-pill--weak {
  background: var(--color-report-cell-weak);
  color: var(--color-report-red);
}

.difficulty-pill--empty {
  background: var(--color-report-cell-insufficient);
  color: var(--color-report-slate);
}

.clock-icon {
  width: 30px;
  height: 30px;
  fill: none;
  stroke: var(--color-report-slate);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.timing-card__intro {
  margin: 8px 0 0;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  line-height: var(--leading-relaxed);
}

.module-timing-list {
  margin-top: 14px;
  border-top: 1px solid var(--color-line-soft);
}

.module-timing-item {
  padding: 14px 0;
  border-bottom: 1px solid var(--color-line-soft);
}

.module-timing-item__heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.module-timing-item__heading strong {
  font-size: var(--text-sm);
}

.module-timing-item__heading em {
  font-size: var(--text-lg);
  font-style: normal;
  font-weight: var(--weight-semi);
  line-height: var(--leading-tight);
}

.module-timing-item p,
.module-timing-item > small {
  display: block;
  margin: 5px 0 0;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  line-height: var(--leading-normal);
}

.module-timing-item > small {
  color: var(--color-ink-soft);
}

.module-timing-item__value--fast {
  color: var(--color-report-green);
}

.module-timing-item__value--target {
  color: var(--color-report-blue);
}

.module-timing-item__value--slow {
  color: var(--color-report-red);
}

.module-timing-item__value--empty {
  color: var(--color-report-slate);
}

.timing-notice {
  margin-top: 36px;
  padding: 15px 18px;
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

@media (max-width: 980px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 620px) {
  .overview-card {
    padding: 22px 18px;
  }
}
</style>
