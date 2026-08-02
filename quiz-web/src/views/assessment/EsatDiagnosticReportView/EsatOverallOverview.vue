<!-- ESAT 总体成绩概览模块：展示分模块作答统计、考试节奏和基于逐题耗时的时间效率。 -->
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
          <span>考试节奏与时间效率</span>
          <svg class="clock-icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9"></circle>
            <path d="M12 7v5l3 2"></path>
          </svg>
        </div>

        <div v-if="overview.timing.totalDurationSeconds !== null" class="time-hero">
          <strong>{{ formatTotalMinutes(overview.timing.totalDurationSeconds) }}</strong>
          <span>min</span>
          <small v-if="overview.timing.plannedDurationSeconds !== null">
            总用时（规定 {{ formatTotalMinutes(overview.timing.plannedDurationSeconds) }} min）
          </small>
          <span class="pacing-badge" :class="`pacing-badge--${pacingStatus(overview.timing)}`">
            {{ pacingStatusLabel(overview.timing) }}
          </span>
        </div>
        <div v-else class="time-unavailable">暂无可靠的总用时记录</div>

        <div v-if="overview.timing.totalDurationSeconds !== null && !isLegacyTiming(overview.timing)" class="timing-coverage">
          <div>
            <span>作答覆盖</span>
            <strong>{{ timingAttemptedCount(overview.timing) }}/{{ overview.totalQuestions }}</strong>
          </div>
          <div>
            <span>已记录题平均耗时</span>
            <strong>{{ formatAverageDuration(overview.timing.averageDurationSeconds) }}</strong>
          </div>
          <div>
            <span>计时覆盖率</span>
            <strong>{{ formatCoverage(overview.timing) }}</strong>
          </div>
        </div>

        <template v-if="hasTimingAnalysis(overview.timing)">
          <section class="efficiency-block">
            <div class="timing-block-heading">
              <strong>时间效率四象限</strong>
              <small>平均目标题时 {{ formatAverageDuration(overview.timing.targetDurationSeconds ?? null) }} · 基于 {{ timingEfficiencySampleCount(overview.timing) }} 道已答且已记录耗时题目</small>
            </div>
            <div class="efficiency-grid">
              <article
                v-for="quadrant in timingQuadrants(overview.timing)"
                :key="quadrant.id"
                class="efficiency-cell"
                :class="`efficiency-cell--${quadrant.id}`"
              >
                <div class="efficiency-cell__heading">
                  <span>{{ quadrant.label }}</span>
                  <strong>{{ quadrant.count }} 题</strong>
                </div>
                <small>{{ quadrant.description }}</small>
              </article>
            </div>
          </section>

        </template>

        <div v-else class="timing-notice">
          {{ unavailableTimingNotice(overview.timing) }}
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { DiagnosticAssessmentModule, DiagnosticReportOverview } from '@/api/exam'

defineProps<{
  overview: DiagnosticReportOverview
  modules: DiagnosticAssessmentModule[]
}>()

type TimingOverview = DiagnosticReportOverview['timing']
type TimingQuadrantId = 'fast_correct' | 'slow_correct' | 'fast_wrong' | 'slow_wrong'

const TIMING_QUADRANTS: Array<{ id: TimingQuadrantId; label: string; description: string }> = [
  { id: 'fast_correct', label: '快且对', description: '当前相对熟练，可保持节奏' },
  { id: 'slow_correct', label: '慢且对', description: '理解正确，但仍需提升熟练度' },
  { id: 'fast_wrong', label: '快且错', description: '优先检查审题、计算与策略' },
  { id: 'slow_wrong', label: '慢且错', description: '核心时间黑洞，建议优先复盘' },
]

// 正确率按原型保留一位小数，避免与计数结果产生视觉误差。
function formatAccuracy(value: number | null): string {
  return value === null ? '-' : `${(value * 100).toFixed(1)}%`
}

// 总用时按分钟取整，保持与原型的大数字展示一致。
function formatTotalMinutes(seconds: number): string {
  return String(Math.max(0, Math.round(seconds / 60)))
}

// 平均用时根据量级显示分钟或秒，避免小数秒造成伪精确。
function formatAverageDuration(seconds: number | null): string {
  if (seconds === null) return '-'
  if (seconds >= 60) return `${(seconds / 60).toFixed(1)} min/题`
  return `${Math.round(seconds)} 秒/题`
}

// 新版报告按可靠度分层；旧报告缺少该字段时默认视为不可做逐题推断。
function timingAnalysisLevel(timing: TimingOverview): 'unavailable' | 'reference' | 'complete' {
  return timing.analysisLevel || 'unavailable'
}

// 已保存的旧报告没有新版覆盖率与象限快照，必须提示重新生成而不是把缺失值误显示为零。
function isLegacyTiming(timing: TimingOverview): boolean {
  return timing.analysisLevel === undefined
}

// 参考分析至少要求记录到三成题目耗时，并且存在可用于判定快慢的已答题目。
function hasTimingAnalysis(timing: TimingOverview): boolean {
  return timingAnalysisLevel(timing) !== 'unavailable' && (timing.efficiencySampleCount || 0) > 0
}

// 考试节奏只基于总时长和实际覆盖题数判断，不将模型文案作为节奏结论。
function pacingStatus(timing: TimingOverview): 'unavailable' | 'within_limit' | 'incomplete' | 'overtime' {
  return timing.pacingStatus || 'unavailable'
}

// 节奏状态使用直白文字，帮助学生先判断是否需要优先解决完成整卷的问题。
function pacingStatusLabel(timing: TimingOverview): string {
  const labels = {
    within_limit: '节奏在时限内',
    incomplete: '本次未完成整卷',
    overtime: '已超过规定时长',
    unavailable: '节奏待记录',
  }
  return labels[pacingStatus(timing)]
}

// 作答覆盖兼容旧报告：缺失时回退为已记录耗时的题目数量，避免展示空白分子。
function timingAttemptedCount(timing: TimingOverview): number {
  return timing.attemptedQuestionCount ?? timing.timedQuestionCount ?? 0
}

// 逐题耗时覆盖只统计存在正耗时的题目，不将未查看题误写为零秒作答。
function timingRecordedCount(timing: TimingOverview): number {
  return timing.timedQuestionCount ?? 0
}

// 覆盖率按记录题数计算，旧报告没有覆盖率字段时按零处理并显示不完整提示。
function formatCoverage(timing: TimingOverview): string {
  return `${Math.round((timing.timingCoverage || 0) * 100)}%`
}

// 四象限按“是否超过该题难度目标用时 × 是否答对”分类，所有计数均来自已答且有耗时的题目。
function timingQuadrants(timing: TimingOverview): Array<{ id: TimingQuadrantId; label: string; description: string; count: number }> {
  const countMap = new Map((timing.quadrants || []).map((item) => [item.id, item.count]))
  return TIMING_QUADRANTS.map((item) => ({ ...item, count: countMap.get(item.id) || 0 }))
}

// 四象限样本数优先使用后端聚合结果，兼容旧快照时则以四格数量相加。
function timingEfficiencySampleCount(timing: TimingOverview): number {
  if (timing.efficiencySampleCount !== undefined) return timing.efficiencySampleCount
  return timingQuadrants(timing).reduce((sum, item) => sum + item.count, 0)
}

// 样本不足时保留总时长和覆盖数据，并指出继续答题后何时会形成可用分析。
function unavailableTimingNotice(timing: TimingOverview): string {
  if (timing.totalDurationSeconds === null) return '暂无可靠的总用时记录，暂不能生成时间效率分析。'
  if (isLegacyTiming(timing)) return '当前报告使用旧版时间统计快照；重新完成并生成诊断报告后，将展示新版时间效率分析。'
  return `当前仅记录 ${timingRecordedCount(timing)} 题耗时（${formatCoverage(timing)}），至少记录 30% 题目耗时后显示参考性分析。`
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
  align-items: start;
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

.time-hero {
  display: flex;
  align-items: baseline;
  margin-top: 10px;
}

.time-hero strong {
  color: var(--color-ink);
  font-size: var(--text-6xl);
  letter-spacing: var(--tracking-tight);
  line-height: var(--leading-tight);
}

.time-hero > span:not(.pacing-badge) {
  margin-left: 7px;
  color: var(--color-ink);
  font-size: var(--text-lg);
}

.time-hero small {
  margin-left: 16px;
  color: var(--color-report-slate);
}

.pacing-badge {
  margin-left: auto;
  padding: 5px 9px;
  border-radius: var(--radius-pill);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
}

.pacing-badge--within_limit {
  background: var(--color-report-cell-strong);
  color: var(--color-report-green);
}

.pacing-badge--incomplete,
.pacing-badge--overtime {
  background: var(--color-report-cell-weak);
  color: var(--color-report-red);
}

.pacing-badge--unavailable {
  background: var(--color-report-cell-insufficient);
  color: var(--color-report-slate);
}

.time-unavailable {
  margin-top: 34px;
  color: var(--color-ink-muted);
  font-size: var(--text-xl);
}

.timing-coverage {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 18px;
}

.timing-coverage > div {
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: 10px;
  border-radius: var(--radius-sm);
  background: var(--color-surface-alt);
}

.timing-coverage span,
.timing-coverage strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timing-coverage span,
.timing-block-heading small {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.timing-coverage strong {
  font-size: var(--text-sm);
}

.efficiency-block {
  margin-top: 18px;
}

.timing-block-heading {
  display: flex;
  gap: 12px;
  align-items: baseline;
  flex-wrap: nowrap;
  margin-bottom: 15px;
}

.timing-block-heading strong {
  flex: 0 0 auto;
  font-size: var(--text-sm);
}

.timing-block-heading small {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: right;
}

.efficiency-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.efficiency-cell {
  display: grid;
  gap: 3px;
  min-height: 76px;
  padding: 11px 12px;
  border-radius: var(--radius-sm);
}

.efficiency-cell__heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.efficiency-cell__heading > span {
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
}

.efficiency-cell__heading > strong {
  font-size: var(--text-lg);
  line-height: var(--leading-tight);
}

.efficiency-cell > small {
  font-size: var(--text-xs);
  line-height: var(--leading-normal);
}

.efficiency-cell--fast_correct {
  background: var(--color-report-cell-strong);
  color: var(--color-report-green);
}

.efficiency-cell--slow_correct {
  background: var(--color-report-cell-medium);
  color: var(--color-report-orange);
}

.efficiency-cell--fast_wrong,
.efficiency-cell--slow_wrong {
  background: var(--color-report-cell-weak);
  color: var(--color-report-red);
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

  .time-hero {
    flex-wrap: wrap;
  }

  .time-hero small {
    width: 100%;
    margin: 5px 0 0;
  }

  .pacing-badge {
    margin-left: 12px;
  }

  .timing-coverage {
    grid-template-columns: 1fr;
  }
}
</style>
