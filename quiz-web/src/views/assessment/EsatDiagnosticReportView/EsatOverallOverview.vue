<!-- ESAT 总体成绩概览模块：展示确定性作答统计，并按计时可靠性控制详细时间分析。 -->
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
          <span>时间与模块分析</span>
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
        </div>
        <div v-else class="time-unavailable">暂无可靠的总用时记录</div>

        <div v-if="overview.timing.detailedTimingReliable" class="timing-detail">
          <dl class="timing-summary">
            <div>
              <dt>平均用时</dt>
              <dd>{{ formatAverageDuration(overview.timing.averageDurationSeconds) }}</dd>
            </div>
            <div>
              <dt>超时题目</dt>
              <dd>{{ overview.timing.overtimeQuestionCount }} 题</dd>
            </div>
          </dl>

          <div class="module-times">
            <div v-for="module in overview.timing.modules" :key="module.id" class="module-time">
              <span>{{ module.label }}</span>
              <div class="module-time__track">
                <i :style="{ width: moduleActualPercent(module) }"></i>
                <b aria-hidden="true"></b>
              </div>
            </div>
            <div class="time-legend">
              <span><i></i>实际用时</span>
              <span><b></b>规定用时</span>
            </div>
          </div>
        </div>

        <div v-else class="timing-notice">
          逐题计时记录不完整，平均用时、超时题数和模块时间条暂不展示。
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

// 模块实际用时以规定用时标记的九成轨道为基准，超时部分最多延伸至轨道末端。
function moduleActualPercent(module: DiagnosticReportOverview['timing']['modules'][number]): string {
  if (module.plannedDurationSeconds <= 0) return '0%'
  return `${Math.min(100, (module.actualDurationSeconds / module.plannedDurationSeconds) * 90)}%`
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
  gap: 20px;
}

.overview-card {
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

.timing-summary > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 40px;
}

.timing-summary dt,
.timing-summary dd {
  margin: 0;
}

.timing-summary dd {
  font-weight: var(--weight-semi);
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

.time-hero > span {
  margin-left: 7px;
  color: var(--color-ink);
  font-size: var(--text-lg);
}

.time-hero small {
  margin-left: 16px;
  color: var(--color-report-slate);
}

.time-unavailable {
  margin-top: 34px;
  color: var(--color-ink-muted);
  font-size: var(--text-xl);
}

.timing-detail {
  display: grid;
  grid-template-columns: minmax(180px, 0.8fr) minmax(230px, 1.2fr);
  gap: 28px;
  margin-top: 32px;
}

.timing-summary {
  margin: 0;
  padding-right: 28px;
  border-right: 1px solid var(--color-line-soft);
}

.module-time + .module-time {
  margin-top: 13px;
}

.module-time > span {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
}

.module-time__track {
  position: relative;
  height: 9px;
  margin-top: 6px;
  border-radius: var(--radius-pill);
  background: var(--color-report-track);
}

.module-time__track i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-report-orange);
}

.module-time__track b {
  position: absolute;
  top: -4px;
  bottom: -4px;
  left: 90%;
  width: 2px;
  background: var(--color-report-slate);
  opacity: 0.45;
}

.time-legend {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 14px;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.time-legend span {
  display: flex;
  gap: 5px;
  align-items: center;
}

.time-legend i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-report-orange);
}

.time-legend b {
  width: 2px;
  height: 11px;
  background: var(--color-report-slate);
  opacity: 0.6;
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
</style>
