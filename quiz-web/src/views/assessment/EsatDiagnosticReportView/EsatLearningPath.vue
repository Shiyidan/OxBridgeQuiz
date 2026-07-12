<!-- ESAT 三阶段学习路径模块：结合学生目标资料、能力缺口和可用时间生成滚动计划。 -->
<template>
  <section class="path-section">
    <div class="section-title">
      <span aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <circle cx="7" cy="6" r="2"></circle>
          <circle cx="17" cy="6" r="2"></circle>
          <circle cx="7" cy="18" r="2"></circle>
          <path d="M9 6h6M7 8v8M9 18h4a4 4 0 0 0 4-4V8"></path>
        </svg>
      </span>
      <div>
        <h2>AI 定制三阶段学习路径</h2>
        <p>依据备考资料、本次能力矩阵与高 ROI 缺口生成</p>
      </div>
    </div>

    <article class="path-card">
      <header class="path-overview">
        <div class="phase-track" aria-hidden="true">
          <i
            v-for="phase in path.phases"
            :key="phase.id"
            :class="`phase-track--${phase.id}`"
            :style="{ width: phasePercent(phase.durationWeeks) }"
          ></i>
        </div>
        <div class="phase-labels">
          <span v-for="phase in path.phases" :key="phase.id">
            {{ phase.title }}（{{ phase.durationWeeks }}周）
          </span>
        </div>
        <p class="time-summary">
          规划周期：<strong>{{ path.summary.planningWeeks }} 周</strong>
          · 每周投入：<strong>{{ path.summary.weeklyHours }} 小时</strong>
          · 总可投入时长：<strong>{{ path.summary.totalHours }} 小时</strong>
          · 当前模式：<strong>{{ path.summary.mode }}</strong>
        </p>
        <p class="mode-reason"><b>模式判定依据</b>{{ path.summary.modeReason }}</p>

        <div class="profile-source">
          <span><b>备考科目</b>{{ path.profile.subjects.join('、') || '未设置' }}</span>
          <span><b>目标院校</b>{{ path.profile.targetUniversities.join('、') || '未设置' }}</span>
          <span><b>目标专业</b>{{ path.profile.targetMajor || '未设置' }}</span>
          <span><b>目标分数</b>{{ path.profile.targetScore ? `${path.profile.targetScore.toFixed(1)} / 9.0` : '未设置' }}</span>
          <span><b>考试日期</b>{{ path.profile.examDate || '未设置' }}</span>
        </div>
        <div
          class="source-note"
          :class="{ 'source-note--complete': path.profile.missingFields.length === 0 }"
        >
          {{ path.summary.dataSourceNote }}
          <router-link v-if="path.profile.missingFields.length" to="/profile">前往个人中心补充</router-link>
        </div>

        <section v-if="timingModules.length" class="path-timing-analysis">
          <div class="path-timing-analysis__heading">
            <div>
              <h3>模块时间效率</h3>
              <p>已作为限时训练与整卷节奏安排的分析依据</p>
            </div>
            <small>1.0× 为模块目标题时</small>
          </div>
          <div class="path-timing-analysis__grid">
            <article v-for="module in timingModules" :key="module.id">
              <div>
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
        </section>
      </header>

      <section
        v-for="phase in path.phases"
        :key="phase.id"
        class="phase-section"
        :class="`phase-section--${phase.id}`"
      >
        <h3>{{ phase.title }}</h3>
        <small class="week-label">{{ phase.weekLabel }}</small>

        <div class="phase-goal">
          <span>目标</span>
          <p>{{ phase.goal }}</p>
          <div v-if="phase.focusTags.length" class="focus-tags">
            <b>本阶段重点</b>
            <span v-for="tag in phase.focusTags" :key="tag">{{ tag }}</span>
          </div>
          <div class="phase-strategy">
            <b>执行策略</b>
            <span>{{ phase.strategy }}</span>
          </div>
        </div>

        <div v-if="phase.tasks.length" class="task-list">
          <div v-for="task in phase.tasks" :key="`${task.period}:${task.title}`" class="task-row">
            <strong>{{ task.period }}</strong>
            <article>
              <h4>{{ task.title }}</h4>
              <p class="task-plan">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="5" cy="7" r="1"></circle>
                  <circle cx="5" cy="12" r="1"></circle>
                  <circle cx="5" cy="17" r="1"></circle>
                  <path d="M9 7h10M9 12h10M9 17h10"></path>
                </svg>
                <span class="task-label">学习安排</span>
                <span>{{ task.completionLabel }}</span>
              </p>
            </article>
          </div>
        </div>

        <div v-if="phase.activities.length" class="task-list">
          <div
            v-for="(activity, activityIndex) in phase.activities"
            :key="activity"
            class="task-row"
          >
            <strong>{{ activityPeriod(activity, activityIndex) }}</strong>
            <article>
              <h4>{{ phase.title }} · 学习安排 {{ activityIndex + 1 }}</h4>
              <p class="task-plan">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="5" cy="7" r="1"></circle>
                  <circle cx="5" cy="12" r="1"></circle>
                  <circle cx="5" cy="17" r="1"></circle>
                  <path d="M9 7h10M9 12h10M9 17h10"></path>
                </svg>
                <span class="task-label">学习安排</span>
                <span>{{ activityContent(activity) }}</span>
              </p>
            </article>
          </div>
        </div>

      </section>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DiagnosticLearningPath, DiagnosticReportOverview } from '@/api/exam'

const props = defineProps<{
  path: DiagnosticLearningPath
  timing?: DiagnosticReportOverview['timing']
}>()

type TimingModule = DiagnosticReportOverview['timing']['modules'][number]

// 只有新版报告且存在模块耗时指数时，才将其作为学习路径的节奏训练依据。
const timingModules = computed(() => {
  if (props.timing?.analysisLevel === undefined || props.timing.analysisLevel === 'unavailable') return []
  return props.timing.modules.filter((module) => module.timeEfficiencyIndex !== null && module.timeEfficiencyIndex !== undefined)
})

// 阶段色条严格按规划周数占比绘制，保证总长度始终为百分之百。
function phasePercent(durationWeeks: number): string {
  if (!props.path.summary.planningWeeks) return '0%'
  return `${(durationWeeks / props.path.summary.planningWeeks) * 100}%`
}

// 阶段活动优先使用文案中的周次前缀，缺失时按活动顺序生成稳定标签。
function activityPeriod(activity: string, index: number): string {
  const matched = activity.match(/^([^：:]{1,20})[：:]/)
  return matched?.[1]?.trim() || `安排 ${index + 1}`
}

// 卡片正文移除已经展示在左侧的周次前缀，避免同一信息重复出现。
function activityContent(activity: string): string {
  return activity.replace(/^([^：:]{1,20})[：:]\s*/, '').trim()
}

// 时间效率指数以 1.0× 为目标，供学生判断当前模块更需要限时训练还是速度保持。
function formatEfficiencyIndex(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(1)}×`
}

// 时间效率颜色只表达相对速度，不直接评价知识掌握水平。
function timingEfficiencyToneClass(value: number | null): string {
  if (value === null) return 'path-timing-analysis__value--empty'
  if (value > 1.25) return 'path-timing-analysis__value--slow'
  if (value < 0.75) return 'path-timing-analysis__value--fast'
  return 'path-timing-analysis__value--target'
}

// 时间效率建议同时参考速度和模块正确率，避免只因做得快就被误判为优势。
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

// 模块正确率统一保留一位小数，和诊断报告的其他作答统计保持一致。
function formatAccuracy(value: number | null): string {
  return value === null ? '-' : `${(value * 100).toFixed(1)}%`
}
</script>

<style scoped lang="scss">
.path-section {
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
  color: var(--color-report-purple);
}

.section-title svg,
.task-row svg {
  width: 21px;
  height: 21px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
}

.section-title h2,
.section-title p {
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

.path-card {
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.path-overview {
  padding: 26px 28px 24px;
}

.phase-track {
  display: flex;
  overflow: hidden;
  height: 10px;
  border-radius: var(--radius-pill);
  background: var(--color-report-track);
}

.phase-track i {
  display: block;
  height: 100%;
}

.phase-track--foundation {
  background: var(--color-report-purple);
}

.phase-track--improvement {
  background: var(--color-report-blue);
}

.phase-track--sprint {
  background: var(--color-report-orange);
}

.phase-labels {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin-top: 10px;
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
}

.phase-labels span:nth-child(2) {
  text-align: center;
}

.phase-labels span:last-child {
  text-align: right;
}

.time-summary {
  margin: 18px 0 0;
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
  text-align: center;
}

.time-summary strong {
  color: var(--color-ink);
}

.mode-reason {
  max-width: 1040px;
  margin: 10px auto 0;
  padding: 9px 12px;
  border-radius: var(--radius-sm);
  background: var(--color-info-bg);
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
  line-height: var(--leading-relaxed);
  text-align: center;
}

.mode-reason b {
  margin-right: 7px;
  color: var(--color-report-blue);
}

.profile-source {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  margin-top: 20px;
}

.profile-source span {
  overflow: hidden;
  padding: 9px 10px;
  border-radius: var(--radius-sm);
  background: var(--color-surface-alt);
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-source b {
  display: block;
  margin-bottom: 3px;
  color: var(--color-ink-muted);
  font-weight: var(--weight-normal);
}

.source-note {
  margin-top: 10px;
  padding: 9px 12px;
  border-radius: var(--radius-sm);
  background: var(--color-warning-bg);
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
}

.source-note--complete {
  background: var(--color-success-bg);
}

.source-note a {
  margin-left: 8px;
  color: var(--color-report-purple);
  font-weight: var(--weight-semi);
}

.path-timing-analysis {
  margin-top: 16px;
  padding: 15px 16px;
  border: 1px solid var(--color-line-soft);
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);
}

.path-timing-analysis__heading {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
}

.path-timing-analysis__heading h3,
.path-timing-analysis__heading p {
  margin: 0;
}

.path-timing-analysis__heading h3 {
  font-size: var(--text-sm);
}

.path-timing-analysis__heading p,
.path-timing-analysis__heading > small {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.path-timing-analysis__heading p {
  margin-top: 3px;
}

.path-timing-analysis__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 9px;
  margin-top: 11px;
}

.path-timing-analysis__grid article {
  padding: 11px 12px;
  border: 1px solid var(--color-line-soft);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}

.path-timing-analysis__grid article > div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.path-timing-analysis__grid article strong {
  font-size: var(--text-sm);
}

.path-timing-analysis__grid article em {
  font-size: var(--text-sm);
  font-style: normal;
  font-weight: var(--weight-semi);
}

.path-timing-analysis__grid article p,
.path-timing-analysis__grid article > small {
  display: block;
  margin: 6px 0 0;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  line-height: var(--leading-normal);
}

.path-timing-analysis__grid article > small {
  color: var(--color-ink-soft);
}

.path-timing-analysis__value--fast {
  color: var(--color-report-green);
}

.path-timing-analysis__value--target {
  color: var(--color-report-blue);
}

.path-timing-analysis__value--slow {
  color: var(--color-report-red);
}

.path-timing-analysis__value--empty {
  color: var(--color-report-slate);
}

.phase-section {
  position: relative;
  padding: 26px 28px 28px;
  border-top: 1px solid var(--color-line-soft);
  border-left: 4px solid var(--color-report-purple);
}

.phase-section--improvement {
  border-left-color: var(--color-report-blue);
}

.phase-section--sprint {
  border-left-color: var(--color-report-orange);
}

.phase-section h3 {
  display: inline-block;
  margin: 0;
  font-size: var(--text-lg);
}

.week-label {
  margin-left: 10px;
  color: var(--color-report-purple);
  font-weight: var(--weight-semi);
}

.phase-section--improvement .week-label {
  color: var(--color-report-blue);
}

.phase-section--sprint .week-label {
  color: var(--color-report-orange);
}

.phase-goal {
  margin-top: 14px;
  padding: 14px 16px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-xs);
}

.phase-goal > span {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.phase-goal p {
  display: inline;
  margin: 0 0 0 8px;
  line-height: var(--leading-relaxed);
}

.focus-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  align-items: center;
  margin-top: 9px;
}

.focus-tags b {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  font-weight: var(--weight-normal);
}

.focus-tags span {
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  background: var(--color-info-bg);
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
}

.phase-strategy {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--color-line-soft);
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
  line-height: var(--leading-relaxed);
}

.phase-strategy b {
  flex: 0 0 auto;
  color: var(--color-report-purple);
}

.task-list {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.task-row {
  display: grid;
  grid-template-columns: 68px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}

.task-row > strong {
  margin-left: 17px;
  padding-top: 15px;
  color: var(--color-report-purple);
  font-size: var(--text-xs);
}

.task-row article {
  padding: 14px 16px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xs);
}

.task-row h4 {
  margin: 0 0 8px;
  font-size: var(--text-sm);
}

.task-row p {
  display: flex;
  gap: 6px;
  align-items: center;
  margin: 5px 0 0;
  font-size: var(--text-xs);
}

.task-plan {
  color: var(--color-ink-soft);
  line-height: var(--leading-relaxed);
}

.task-row svg {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
  color: var(--color-report-blue);
}

.task-label {
  flex: 0 0 auto;
  padding: 2px 6px;
  border-radius: var(--radius-pill);
  background: var(--color-info-bg);
  color: var(--color-report-blue);
  font-weight: var(--weight-semi);
}

</style>
