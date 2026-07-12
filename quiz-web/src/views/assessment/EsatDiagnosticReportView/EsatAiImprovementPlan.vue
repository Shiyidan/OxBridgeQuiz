<!-- ESAT AI 提升规划模块：展示确定性能力矩阵和受约束生成的高 ROI 缺口清单。 -->
<template>
  <section class="plan-section">
    <div class="section-title">
      <span aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M5 17 10 12l3 3 6-7"></path>
          <path d="M14 8h5v5"></path>
        </svg>
      </span>
      <div>
        <h2>AI 提升规划表</h2>
        <p>能力矩阵由固定规则计算，高 ROI 说明由受约束分析生成</p>
      </div>
    </div>

    <article class="plan-card">
      <section class="matrix-block">
        <div class="block-title">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 12h3l2-6 4 12 2-6h5"></path>
          </svg>
          <div>
            <h3>能力缺口矩阵</h3>
            <p>灰色表示样本量不足 3 题，不作为高 ROI 缺口候选</p>
          </div>
        </div>

        <div class="matrix-table">
          <div class="matrix-header">
            <span>知识点大类</span>
            <span>低难度</span>
            <span>中难度</span>
            <span>高难度</span>
          </div>
          <div class="matrix-body">
            <div v-for="row in plan.matrix" :key="`${row.moduleId}:${row.code}`" class="matrix-row">
              <div class="matrix-topic" :title="row.label">
                <strong>{{ row.label }}</strong>
                <small>{{ row.moduleLabel }}</small>
              </div>
              <div
                v-for="cell in row.cells"
                :key="cell.difficulty"
                class="matrix-cell"
                :class="`matrix-cell--${cell.status}`"
              >
                <strong>{{ cell.correct }}/{{ cell.total }}（{{ formatAccuracy(cell.accuracy) }}）</strong>
                <small>n={{ cell.total }}<template v-if="cell.total < 3"> · 样本不足</template></small>
              </div>
            </div>
            <div v-if="plan.matrix.length === 0" class="matrix-empty">
              本次试卷没有可用于能力矩阵的二级知识点。
            </div>
          </div>
        </div>
      </section>

      <section class="roi-block">
        <div class="block-title">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="8"></circle>
            <circle cx="12" cy="12" r="4"></circle>
            <circle cx="12" cy="12" r="1"></circle>
          </svg>
          <div>
            <h3>高 ROI 缺口清单</h3>
            <p>仅从 n≥3 且正确率不高于 70% 的格子中筛选，最多展示 5 项</p>
          </div>
        </div>

        <div v-if="plan.highRoiGaps.length" class="roi-grid">
          <article v-for="gap in plan.highRoiGaps" :key="`${gap.moduleId}:${gap.topicCode}:${gap.difficulty}`">
            <span class="rank-badge">Top {{ gap.rank }}</span>
            <small class="module-label">{{ gap.moduleLabel }}</small>
            <h4>{{ gap.topicLabel }} × {{ gap.difficultyLabel }} = {{ formatAccuracy(gap.accuracy) }}</h4>
            <dl>
              <div>
                <dt>当前正确率</dt>
                <dd>{{ formatAccuracy(gap.accuracy) }}</dd>
              </div>
              <div>
                <dt>样本量</dt>
                <dd>n={{ gap.total }}</dd>
              </div>
            </dl>
            <div class="gap-advice">
              <p>
                <svg class="advice-icon advice-icon--reason" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3 2.5 20h19z"></path>
                  <path d="M12 9v4"></path>
                  <circle cx="12" cy="17" r=".7"></circle>
                </svg>
                <span><b>优先原因：</b>{{ gap.priorityReason }}</span>
              </p>
              <p>
                <svg class="advice-icon advice-icon--time" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="9"></circle>
                  <path d="M12 7v5l3 2"></path>
                </svg>
                <span><b>建议投入：</b>{{ gap.suggestedHours }}</span>
              </p>
              <p>
                <svg class="advice-icon advice-icon--check" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 5h6a3 3 0 0 1 3 3v11a3 3 0 0 0-3-3H4z"></path>
                  <path d="M20 5h-4a3 3 0 0 0-3 3v11a3 3 0 0 1 3-3h4z"></path>
                </svg>
                <span><b>前置检查：</b>{{ gap.prerequisiteCheck }}</span>
              </p>
            </div>
          </article>
        </div>
        <div v-else class="roi-empty">
          本次没有同时满足样本量与缺口阈值的格子，暂不生成高 ROI 清单。
        </div>
      </section>
    </article>
  </section>
</template>

<script setup lang="ts">
import type { DiagnosticAiImprovementPlan } from '@/api/exam'

defineProps<{ plan: DiagnosticAiImprovementPlan }>()

// 矩阵和缺口卡片统一显示整数百分比，样本不足状态由颜色和文案单独说明。
function formatAccuracy(value: number | null): string {
  return value === null ? '-' : `${Math.round(value * 100)}%`
}
</script>

<style scoped lang="scss">
.plan-section {
  margin-bottom: 28px;
}

.section-title,
.block-title {
  display: flex;
  gap: 12px;
  align-items: center;
}

.section-title {
  margin-bottom: 16px;
}

.section-title > span {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: var(--radius-sm);
  background: var(--color-report-purple-soft);
  color: var(--color-report-purple);
}

.section-title svg,
.block-title > svg,
.advice-icon {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
}

.section-title h2,
.section-title p,
.block-title h3,
.block-title p {
  margin: 0;
}

.section-title h2 {
  font-size: var(--text-lg);
}

.section-title p,
.block-title p {
  margin-top: 3px;
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
}

.plan-card {
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.matrix-block,
.roi-block {
  padding: 28px 30px 30px;
}

.block-title {
  margin-bottom: 20px;
}

.block-title > svg {
  flex: 0 0 auto;
  color: var(--color-report-slate);
}

.block-title h3 {
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
}

.matrix-table {
  overflow: hidden;
  border: 1px solid var(--color-line-soft);
  border-radius: var(--radius-md);
}

.matrix-header,
.matrix-row {
  display: grid;
  grid-template-columns: minmax(260px, 1.05fr) repeat(3, minmax(180px, 1fr));
}

.matrix-header {
  min-height: 48px;
  align-items: center;
  background: var(--color-surface-alt);
  color: var(--color-ink-soft);
}

.matrix-header span {
  padding: 0 18px;
  text-align: center;
}

.matrix-header span:first-child {
  text-align: left;
}

.matrix-body {
  max-height: 432px;
  overflow-y: auto;
  scrollbar-color: var(--color-report-slate) var(--color-report-track);
  scrollbar-width: thin;
}

.matrix-body::-webkit-scrollbar {
  width: 8px;
}

.matrix-body::-webkit-scrollbar-track {
  background: var(--color-report-track);
}

.matrix-body::-webkit-scrollbar-thumb {
  border-radius: var(--radius-pill);
  background: var(--color-report-slate);
}

.matrix-row {
  min-height: 72px;
  box-sizing: border-box;
  border-top: 1px solid var(--color-line-soft);
}

.matrix-topic {
  display: flex;
  min-width: 0;
  gap: 5px;
  justify-content: center;
  flex-direction: column;
  padding: 12px 18px;
}

.matrix-topic strong {
  overflow: hidden;
  font-weight: var(--weight-normal);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.matrix-topic small {
  color: var(--color-ink-muted);
}

.matrix-cell {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  margin: 5px;
  border-radius: var(--radius-sm);
  text-align: center;
}

.matrix-cell strong {
  font-weight: var(--weight-medium);
}

.matrix-cell small {
  margin-top: 3px;
  font-size: var(--text-xs);
}

.matrix-cell--strong {
  background: var(--color-report-cell-strong);
  color: var(--color-report-green);
}

.matrix-cell--medium {
  background: var(--color-report-cell-medium);
  color: var(--color-report-orange);
}

.matrix-cell--weak {
  background: var(--color-report-cell-weak);
  color: var(--color-report-red);
}

.matrix-cell--insufficient {
  background: var(--color-report-cell-insufficient);
  color: var(--color-report-slate);
}

.matrix-empty,
.roi-empty {
  padding: 34px;
  color: var(--color-ink-muted);
  text-align: center;
}

.roi-block {
  border-top: 1px solid var(--color-line-soft);
  background: var(--color-surface-alt);
}

.roi-grid {
  display: flex;
  gap: 16px;
  padding: 0 0 12px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-color: var(--color-report-slate) var(--color-report-track);
  scrollbar-width: thin;
  scroll-snap-type: x proximity;
}

.roi-grid > article {
  position: relative;
  min-width: 320px;
  min-height: 270px;
  box-sizing: border-box;
  flex: 0 0 calc((100% - 32px) / 3);
  padding: 20px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  scroll-snap-align: start;
}

.roi-grid::-webkit-scrollbar {
  height: 8px;
}

.roi-grid::-webkit-scrollbar-track {
  border-radius: var(--radius-pill);
  background: var(--color-report-track);
}

.roi-grid::-webkit-scrollbar-thumb {
  border-radius: var(--radius-pill);
  background: var(--color-report-slate);
}

.rank-badge {
  position: absolute;
  top: 0;
  right: 0;
  padding: 5px 10px;
  border-radius: 0 var(--radius-md) 0 var(--radius-md);
  background: var(--color-report-cell-weak);
  color: var(--color-report-red);
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
}

.module-label {
  display: inline-block;
  padding: 3px 7px;
  border-radius: var(--radius-sm);
  background: var(--color-info-bg);
  color: var(--color-ink-muted);
}

.roi-grid h4 {
  min-height: 48px;
  margin: 10px 48px 10px 0;
  font-size: var(--text-base);
  line-height: var(--leading-normal);
}

.roi-grid dl {
  margin: 0 0 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-line-soft);
}

.roi-grid dl > div {
  display: flex;
  justify-content: space-between;
  min-height: 25px;
}

.roi-grid dt,
.roi-grid dd {
  margin: 0;
  font-size: var(--text-sm);
}

.roi-grid dt {
  color: var(--color-ink-muted);
}

.roi-grid dl > div:first-child dd {
  color: var(--color-report-red);
}

.gap-advice {
  display: grid;
  gap: 9px;
}

.gap-advice p {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin: 0;
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
  line-height: var(--leading-normal);
}

.gap-advice b {
  font-weight: var(--weight-medium);
}

.advice-icon {
  width: 17px;
  height: 17px;
  flex: 0 0 auto;
}

.advice-icon--reason {
  color: var(--color-report-orange);
}

.advice-icon--time {
  color: var(--color-report-blue);
}

.advice-icon--check {
  color: var(--color-report-purple);
}

</style>
