<!-- 诊断报告 V1 七日计划：兼容展示历史逐日任务、产出与未达标分支。 -->
<template>
  <section class="starter-plan" aria-labelledby="starter-plan-heading">
    <header class="starter-plan__summary">
      <div>
        <p id="starter-plan-heading">本周执行路径</p>
        <strong>{{ plan.totalPlannedMinutes }} 分钟，分配到 7 个不同学习环节</strong>
      </div>
      <div class="starter-plan__meta">
        <span>{{ budgetSourceLabel }}</span>
        <span>{{ sourceLabel }}</span>
      </div>
    </header>

    <p class="starter-plan__boundary">{{ plan.evidenceBoundary }}</p>

    <div class="starter-plan__days">
      <details
        v-for="day in plan.days"
        :key="day.day"
        class="starter-day"
        :class="`starter-day--${day.role}`"
        :open="day.day === 1"
      >
        <summary>
          <span class="starter-day__number">{{ day.day }}</span>
          <span class="starter-day__heading">
            <small>第 {{ day.day }} 天 · {{ roleLabel(day.role) }}</small>
            <strong>{{ day.title }}</strong>
            <span class="starter-day__focus">{{ focusLabel(day) }}</span>
          </span>
          <span class="starter-day__duration">{{ day.durationMinutes }} 分钟</span>
          <svg class="starter-day__chevron" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m8 10 4 4 4-4"></path>
          </svg>
        </summary>

        <div class="starter-day__content">
          <div class="starter-day__rationale">
            <span>为什么今天做</span>
            <p>{{ day.diagnosticRationale }}</p>
          </div>

          <ol class="starter-day__steps">
            <li v-for="(step, index) in day.steps" :key="`${day.day}:${index}`">
              <span>{{ index + 1 }}</span>
              <div>
                <p>{{ step.action }}</p>
                <small>留下：{{ step.output }}</small>
              </div>
            </li>
          </ol>

          <dl class="starter-day__outcomes">
            <div>
              <dt>当天产出</dt>
              <dd>{{ day.deliverable }}</dd>
            </div>
            <div>
              <dt>完成标准</dt>
              <dd>{{ day.successCriteria }}</dd>
            </div>
            <div>
              <dt>未达标时</dt>
              <dd>{{ day.ifNotMet }}</dd>
            </div>
          </dl>
        </div>
      </details>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type {
  DiagnosticStarterPlan,
  DiagnosticStarterPlanDay,
  DiagnosticStarterPlanDayRole,
} from '@/api/exam'

const props = defineProps<{ plan: DiagnosticStarterPlan }>()

const ROLE_LABELS: Record<DiagnosticStarterPlanDayRole, string> = {
  evidence_audit: '证据核对',
  method_rebuild: '方法重建',
  retrieval_practice: '独立检索',
  secondary_transfer: '第二项迁移',
  third_or_deepen: '第三项 / 深化',
  interleaved_timed: '交错训练',
  weekly_retest: '复测与决策',
}

// 预算标签说明计划采用个人资料还是保守默认值，避免默认时长看起来像学生已填写的数据。
const budgetSourceLabel = computed(() =>
  props.plan.budgetSource === 'profile' ? '按个人每周时长分配' : '按默认 5 小时分配',
)

// 混合来源表示部分日计划通过模型校验，未通过部分仍由完整规则方案接管。
const sourceLabel = computed(() => {
  if (props.plan.analysisSource === 'deepseek') return 'AI 辅助细化'
  if (props.plan.analysisSource === 'mixed') return 'AI + 规则校验'
  return '专业规则方案'
})

// 页面将内部角色枚举转换为学生可理解的学习环节名称。
function roleLabel(role: DiagnosticStarterPlanDayRole): string {
  return ROLE_LABELS[role]
}

// 多知识点日只展示去重后的短标签，详细模块和难度保留在计划数据中。
function focusLabel(day: DiagnosticStarterPlanDay): string {
  return Array.from(new Set(day.focus.map((item) => item.topicLabel))).join(' · ')
}
</script>

<style scoped lang="scss">
.starter-plan {
  border-top: 1px solid var(--color-line-soft);
}

.starter-plan__summary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 25px 28px 20px;
}

.starter-plan__summary p,
.starter-plan__summary strong,
.starter-plan__boundary,
.starter-day__rationale p,
.starter-day__steps p {
  margin: 0;
}

.starter-plan__summary p {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.starter-plan__summary strong {
  display: block;
  margin-top: 5px;
  font-size: var(--text-base);
}

.starter-plan__meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 7px;
}

.starter-plan__meta span {
  padding: 5px 9px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-pill);
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.starter-plan__boundary {
  margin: 0 28px 22px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: var(--color-info-bg);
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
  line-height: var(--leading-relaxed);
}

.starter-plan__days {
  padding: 0 28px 30px;
}

.starter-day {
  position: relative;
  border-top: 1px solid var(--color-line-soft);
}

.starter-day:last-child {
  border-bottom: 1px solid var(--color-line-soft);
}

.starter-day::before {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 18px;
  width: 1px;
  background: var(--color-line);
  content: '';
}

.starter-day summary {
  position: relative;
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto 20px;
  gap: 14px;
  align-items: center;
  min-height: 92px;
  padding: 14px 4px 14px 0;
  cursor: pointer;
  list-style: none;
}

.starter-day summary::-webkit-details-marker {
  display: none;
}

.starter-day summary:focus-visible {
  border-radius: var(--radius-sm);
  outline: 2px solid var(--color-report-purple);
  outline-offset: 3px;
}

.starter-day__number {
  position: relative;
  z-index: 1;
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid var(--color-line);
  border-radius: 50%;
  background: var(--color-surface);
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
}

.starter-day[open] .starter-day__number,
.starter-day--interleaved_timed .starter-day__number,
.starter-day--weekly_retest .starter-day__number {
  border-color: var(--color-report-purple);
  background: var(--color-report-purple);
  color: var(--color-ink-inverse);
}

.starter-day__heading {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.starter-day__heading small {
  color: var(--color-report-purple);
  font-size: var(--text-xs);
}

.starter-day__heading strong {
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
}

.starter-day__focus {
  overflow: hidden;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.starter-day__duration {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  white-space: nowrap;
}

.starter-day__chevron {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: var(--color-ink-muted);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
  transition: transform 180ms ease;
}

.starter-day[open] .starter-day__chevron {
  transform: rotate(180deg);
}

.starter-day__content {
  margin: 0 0 22px 52px;
  padding: 20px 22px 22px;
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);
}

.starter-day__rationale {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  gap: 14px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-line-soft);
}

.starter-day__rationale span,
.starter-day__outcomes dt {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.starter-day__rationale p {
  max-width: 72ch;
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

.starter-day__steps {
  display: grid;
  gap: 14px;
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
}

.starter-day__steps li {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}

.starter-day__steps li > span {
  display: grid;
  width: 22px;
  height: 22px;
  place-items: center;
  border-radius: 50%;
  background: var(--color-ink);
  color: var(--color-ink-inverse);
  font-size: 11px;
}

.starter-day__steps p {
  color: var(--color-ink);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
}

.starter-day__steps small {
  display: block;
  margin-top: 4px;
  color: var(--color-ink-muted);
  line-height: var(--leading-normal);
}

.starter-day__outcomes {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  margin: 20px 0 0;
  padding-top: 16px;
  border-top: 1px solid var(--color-line-soft);
}

.starter-day__outcomes div {
  padding: 0 16px;
  border-left: 1px solid var(--color-line-soft);
}

.starter-day__outcomes div:first-child {
  padding-left: 0;
  border-left: 0;
}

.starter-day__outcomes dd {
  margin: 5px 0 0;
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
  line-height: var(--leading-relaxed);
}

@media (max-width: 760px) {
  .starter-plan__summary {
    flex-direction: column;
    padding: 22px 20px 16px;
  }

  .starter-plan__meta {
    justify-content: flex-start;
  }

  .starter-plan__boundary {
    margin: 0 20px 18px;
  }

  .starter-plan__days {
    padding: 0 20px 24px;
  }

  .starter-day summary {
    grid-template-columns: 38px minmax(0, 1fr) 18px;
  }

  .starter-day__duration {
    grid-column: 2;
    grid-row: 2;
  }

  .starter-day__chevron {
    grid-column: 3;
    grid-row: 1;
  }

  .starter-day__content {
    margin-left: 0;
    padding: 18px;
  }

  .starter-day__rationale,
  .starter-day__outcomes {
    grid-template-columns: 1fr;
  }

  .starter-day__outcomes {
    gap: 12px;
  }

  .starter-day__outcomes div {
    padding: 0;
    border-left: 0;
  }
}
</style>
