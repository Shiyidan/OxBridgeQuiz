<!-- 错题解析右侧历史时间轴：倒序展示同一道题历次错误的提交时间、来源与回答状态。 -->
<template>
  <aside class="attempt-timeline" aria-label="历次错误记录">
    <header class="attempt-timeline__header">
      <span>答题轨迹</span>
      <h2>历次作答</h2>
      <p>共 {{ total }} 次记录，最近一次优先</p>
    </header>

    <div v-if="loading" class="attempt-timeline__state">
      <el-skeleton :rows="4" animated />
    </div>
    <div v-else-if="error" class="attempt-timeline__state attempt-timeline__state--error">
      <p>{{ error }}</p>
      <button type="button" @click="$emit('retry')">重新加载</button>
    </div>
    <div v-else-if="!items.length" class="attempt-timeline__state">
      暂无历史作答记录
    </div>
    <el-timeline v-else class="attempt-timeline__list">
      <el-timeline-item
        v-for="(item, index) in items"
        :key="item.id"
        :timestamp="formatAttemptTime(item.submittedAt)"
        :type="isAnsweredAttempt(item) ? 'warning' : 'info'"
        placement="top"
      >
        <article class="attempt-card">
          <div class="attempt-card__meta">
            <span
              class="attempt-card__source"
              :class="`attempt-card__source--${item.sourceType}`"
            >
              {{ item.sourceLabel }}
            </span>
            <span>{{ attemptSequenceLabel(index) }}</span>
          </div>
          <h3 :title="item.sourceTitle">{{ item.sourceTitle }}</h3>
          <p :class="{ 'attempt-card__answer--empty': !isAnsweredAttempt(item) }">
            {{ attemptAnswerLabel(item) }}
          </p>
          <small v-if="item.durationSeconds > 0">
            本题用时 {{ formatDuration(item.durationSeconds) }}
          </small>
        </article>
      </el-timeline-item>
    </el-timeline>
  </aside>
</template>

<script setup lang="ts">
import type { MistakeAttemptHistoryItem } from '@/api/exam'

const props = defineProps<{
  items: MistakeAttemptHistoryItem[]
  total: number
  loading: boolean
  error: string
}>()

defineEmits<{
  retry: []
}>()

const attemptTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

// 时间轴以服务端保存的交卷时间展示，避免把保存时间误称为精确点击答案的时刻。
function formatAttemptTime(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '时间未知' : attemptTimeFormatter.format(date)
}

// 回答状态同时检查状态码和答案内容，兼容早期记录缺少标准状态的情况。
function isAnsweredAttempt(item: MistakeAttemptHistoryItem): boolean {
  return item.answerState === 'answered' && Boolean(item.selectedAnswer)
}

// 倒序列表仍标记其在完整错误历史中的次数，最新一条额外给出明确提示。
function attemptSequenceLabel(index: number): string {
  return index === 0 ? '最近一次' : `第 ${props.total - index} 次`
}

// 未回答和错误选择使用不同文案，避免把跳过题目误解为选择了空答案。
function attemptAnswerLabel(item: MistakeAttemptHistoryItem): string {
  return isAnsweredAttempt(item) ? `回答：${item.selectedAnswer}` : '本次未作答'
}

// 单题用时采用紧凑分秒格式，适配窄侧栏展示。
function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(safeSeconds / 60)
  const remainder = safeSeconds % 60
  return minutes ? `${minutes}分${remainder}秒` : `${remainder}秒`
}
</script>

<style scoped>
.attempt-timeline {
  position: sticky;
  top: 84px;
  min-width: 0;
  max-height: calc(100vh - 108px);
  overflow-x: hidden;
  overflow-y: auto;
  padding: 20px 18px 8px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
  scrollbar-gutter: stable;
}

.attempt-timeline__header {
  margin-bottom: 22px;
}

.attempt-timeline__header > span {
  color: var(--color-report-orange);
  font-size: 11px;
  font-weight: var(--weight-bold);
  letter-spacing: 0.14em;
}

.attempt-timeline__header h2 {
  margin: 6px 0 4px;
  color: var(--color-ink);
  font-size: 18px;
}

.attempt-timeline__header p {
  margin: 0;
  color: var(--color-ink-muted);
  font-size: 12px;
}

.attempt-timeline__state {
  padding: 20px 2px 28px;
  color: var(--color-ink-muted);
  font-size: 13px;
  line-height: 1.6;
  text-align: center;
}

.attempt-timeline__state p {
  margin: 0 0 12px;
}

.attempt-timeline__state button {
  padding: 6px 12px;
  border: 1px solid var(--color-warning);
  border-radius: var(--radius-md);
  background: var(--color-warning-bg);
  color: var(--color-report-orange);
  cursor: pointer;
}

.attempt-timeline__state--error {
  color: var(--color-danger);
}

.attempt-timeline__list {
  padding-left: 2px;
}

.attempt-card {
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--color-line-soft);
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);
}

.attempt-card__meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  color: var(--color-ink-muted);
  font-size: 11px;
}

.attempt-card__source {
  display: inline-flex;
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--color-warning-bg);
  color: var(--color-report-orange);
  font-weight: var(--weight-semi);
}

.attempt-card__source--diagnostic {
  background: #eef4ff;
  color: var(--color-report-blue);
}

.attempt-card__source--question-bank {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.attempt-card__source--mock-exam {
  background: var(--color-report-purple-soft);
  color: var(--color-report-purple);
}

.attempt-card h3 {
  display: -webkit-box;
  overflow: hidden;
  margin: 10px 0 8px;
  color: var(--color-ink);
  font-size: 13px;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.attempt-card p {
  margin: 0;
  color: var(--color-report-orange);
  font-size: 13px;
  font-weight: var(--weight-semi);
}

.attempt-card .attempt-card__answer--empty {
  color: var(--color-ink-muted);
}

.attempt-card small {
  display: block;
  margin-top: 6px;
  color: var(--color-ink-muted);
  font-size: 11px;
}

:deep(.el-timeline) {
  padding-left: 6px;
}

:deep(.el-timeline-item__timestamp) {
  color: var(--color-ink-muted);
  font-size: 11px;
}

:deep(.el-timeline-item__tail) {
  border-left-color: var(--color-line);
}

@media (max-width: 1100px) {
  .attempt-timeline {
    position: static;
    max-height: none;
  }
}
</style>
