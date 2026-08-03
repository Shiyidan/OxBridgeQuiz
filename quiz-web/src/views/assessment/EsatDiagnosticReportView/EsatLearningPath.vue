<!-- ESAT 学习路径模块：资料完整时展示阶段路线，资料不足时降级为 7 天启动计划。 -->
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
        <h2>{{ pathTitle }}</h2>
        <p>{{ pathSubtitle }}</p>
      </div>
      <small class="path-source">{{ pathSourceLabel }}</small>
    </div>

    <article class="path-card">
      <header class="path-overview">
        <div v-if="!hasStructuredStarterPlan" class="phase-track" aria-hidden="true">
          <i
            v-for="phase in path.phases"
            :key="phase.id"
            :class="`phase-track--${phase.id}`"
            :style="{ width: phasePercent(phase.durationWeeks) }"
          ></i>
        </div>
        <div
          v-if="!hasStructuredStarterPlan"
          class="phase-labels"
          :class="{ 'phase-labels--single': path.phases.length === 1 }"
          :style="{ gridTemplateColumns: `repeat(${Math.max(path.phases.length, 1)}, minmax(0, 1fr))` }"
        >
          <span v-for="phase in path.phases" :key="phase.id">
            {{ phase.title }}（{{ phase.durationWeeks }}周）
          </span>
        </div>
        <p class="time-summary">
          规划周期：<strong>{{ path.summary.planningWeeks }} 周</strong>
          · 每周投入：<strong>{{ path.summary.weeklyHours }} 小时</strong>
          · 总可投入时长：<strong>{{ path.summary.totalHours }} 小时</strong>
          · 当前模式：<strong>{{ modeLabel }}</strong>
        </p>
        <p class="mode-reason"><b>模式判定依据</b>{{ path.summary.modeReason }}</p>

        <div class="profile-source">
          <span><b>本次规划科目</b>{{ path.profile.subjects.join('、') || '未设置' }}</span>
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

      </header>

      <EsatStarterPlan
        v-if="hasStructuredStarterPlan && path.starterPlan"
        :plan="path.starterPlan"
      />

      <template v-if="!hasStructuredStarterPlan">
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

        <div v-if="phase.activities.length && !isStarterPlan" class="task-list">
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
      </template>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DiagnosticLearningPath } from '@/api/exam'
import EsatStarterPlan from './EsatStarterPlan.vue'

const props = defineProps<{
  path: DiagnosticLearningPath
}>()

// 缺少考试日期或每周时长时只提供可立即执行的一周启动方案，避免制造虚假的长期精确感。
const isStarterPlan = computed(
  () => props.path.summary.planningScope === 'starter' || props.path.summary.mode === 'Starter',
)

// 新版启动计划使用独立七日结构，避免再被通用阶段任务压缩成重复的“本周”卡片。
const hasStructuredStarterPlan = computed(
  () => isStarterPlan.value && props.path.starterPlan?.days.length === 7,
)

// 路径标题明确表达方案范围，不再把所有规则回退结果统一称为 AI 定制。
const pathTitle = computed(() => (isStarterPlan.value ? '7 天启动计划' : '阶段备考路线'))
const pathSubtitle = computed(() =>
  isStarterPlan.value
    ? '资料尚未完整时，先执行一周，再补充考试日期与每周时长生成完整路线'
    : '依据备考资料、本次能力矩阵与优先补弱项组织',
)
const pathSourceLabel = computed(() =>
  props.path.summary.analysisSource === 'deepseek'
    ? 'AI 辅助组织'
    : props.path.summary.analysisSource === 'mixed'
      ? 'AI + 规则校验'
      : '规则计划',
)

// 英文模式名保留在接口层，页面使用更容易理解的中文标签。
const modeLabel = computed(() => {
  if (props.path.summary.mode === 'Starter') return '启动'
  if (props.path.summary.mode === 'Intensive') return '强化'
  if (props.path.summary.mode === 'Extended') return '长期'
  return '标准'
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

.path-source {
  margin-left: auto;
  padding: 6px 10px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-pill);
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  white-space: nowrap;
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

.phase-labels--single span:last-child {
  text-align: left;
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

.phase-section {
  position: relative;
  padding: 26px 28px 28px;
  border-top: 1px solid var(--color-line-soft);
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

@media (max-width: 760px) {
  .section-title {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .path-source {
    width: 100%;
    margin-left: 46px;
  }

  .path-overview,
  .phase-section {
    padding-right: 20px;
    padding-left: 20px;
  }

  .profile-source {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .task-row {
    grid-template-columns: 1fr;
  }

  .task-row > strong {
    margin-left: 0;
    padding-top: 0;
  }
}

</style>
