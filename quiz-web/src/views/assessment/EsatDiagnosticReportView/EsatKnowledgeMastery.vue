<!-- ESAT 知识点掌握度模块：按考试模块、二级 topic、三级 knowledge point 展示考纲映射表现。 -->
<template>
  <section class="knowledge-section">
    <div class="section-title">
      <span aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5z"></path>
          <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z"></path>
        </svg>
      </span>
      <div>
        <h2>知识点掌握度</h2>
        <p>按 ESAT 考纲二级知识点汇总，展开可查看三级知识点</p>
      </div>
    </div>

    <article class="knowledge-card">
      <h3>知识点详情</h3>

      <div class="module-list">
        <section
          v-for="(module, moduleIndex) in knowledgeMastery.modules"
          :key="module.id"
          class="module-group"
          :class="{ 'module-group--expanded': isModuleExpanded(module.id) }"
        >
          <button
            type="button"
            class="module-heading"
            :aria-expanded="isModuleExpanded(module.id)"
            @click="toggleModule(module.id)"
          >
            <span class="module-badge">{{ moduleBadge(module.id, moduleIndex) }}</span>
            <strong>{{ module.label }}</strong>
            <small>{{ module.knowledgePointCount }} 个知识点</small>
            <span class="module-result">
              {{ module.correct }}/{{ module.total }} 题
              <b>{{ formatAccuracy(module.accuracy) }}</b>
            </span>
            <svg class="chevron" viewBox="0 0 20 20" aria-hidden="true">
              <path d="m6 8 4 4 4-4"></path>
            </svg>
          </button>

          <div v-if="isModuleExpanded(module.id)" class="topic-list">
            <div v-for="topic in module.topics" :key="topic.code" class="topic-group">
              <div class="topic-summary">
                <button
                  type="button"
                  class="expand-button"
                  :class="{ 'expand-button--active': isTopicExpanded(module.id, topic.code) }"
                  :disabled="topic.children.length === 0"
                  :aria-label="`${isTopicExpanded(module.id, topic.code) ? '收起' : '展开'}${topic.label}`"
                  :aria-expanded="isTopicExpanded(module.id, topic.code)"
                  @click="toggleTopic(module.id, topic.code, topic.children.length)"
                >
                  <span></span>
                  <i></i>
                </button>
                <div class="topic-name">
                  <strong>{{ topic.label }}</strong>
                  <small>（{{ topic.knowledgePointCount }} 个知识点）</small>
                </div>
                <span class="question-count">{{ topic.correct }} / {{ topic.total }} 题</span>
                <div class="mastery-track" aria-hidden="true">
                  <i :style="{ width: masteryWidth(topic.accuracy) }"></i>
                </div>
                <strong class="accuracy-value">{{ formatAccuracy(topic.accuracy) }}</strong>
              </div>

              <div v-if="isTopicExpanded(module.id, topic.code)" class="child-list">
                <div v-for="point in topic.children" :key="point.code" class="child-row">
                  <div class="child-name">
                    <span aria-hidden="true"></span>
                    <div>
                      <strong>{{ point.label }}</strong>
                      <small>{{ point.code }}</small>
                    </div>
                  </div>
                  <span class="question-count">{{ point.correct }} / {{ point.total }} 题</span>
                  <div class="mastery-track mastery-track--child" aria-hidden="true">
                    <i :style="{ width: masteryWidth(point.accuracy) }"></i>
                  </div>
                  <strong class="accuracy-value">{{ formatAccuracy(point.accuracy) }}</strong>
                </div>
              </div>
            </div>

            <div v-if="module.topics.length === 0" class="empty-topics">
              当前模块没有已映射的二级知识点。
            </div>
          </div>
        </section>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { DiagnosticKnowledgeMastery } from '@/api/exam'

const props = defineProps<{ knowledgeMastery: DiagnosticKnowledgeMastery }>()
const expandedModuleIds = ref<string[]>(props.knowledgeMastery.modules[0]?.id ? [props.knowledgeMastery.modules[0].id] : [])
const expandedTopicKeys = ref<string[]>([])

// 模块展开状态独立保存，允许三个考试模块同时展开或全部收起。
function isModuleExpanded(moduleId: string): boolean {
  return expandedModuleIds.value.includes(moduleId)
}

// 模块标题切换自身状态，不影响其他考试模块的展开结果。
function toggleModule(moduleId: string): void {
  expandedModuleIds.value = isModuleExpanded(moduleId)
    ? expandedModuleIds.value.filter((id) => id !== moduleId)
    : [...expandedModuleIds.value, moduleId]
}

// 三级知识点展开键包含模块 ID，避免不同模块出现相同 topicCode 时互相影响。
function topicKey(moduleId: string, topicCode: string): string {
  return `${moduleId}:${topicCode}`
}

// 二级知识点是否展开只由自身的复合键决定。
function isTopicExpanded(moduleId: string, topicCode: string): boolean {
  return expandedTopicKeys.value.includes(topicKey(moduleId, topicCode))
}

// 没有三级节点的二级知识点禁用展开，其余节点可独立切换。
function toggleTopic(moduleId: string, topicCode: string, childCount: number): void {
  if (!childCount) return
  const key = topicKey(moduleId, topicCode)
  expandedTopicKeys.value = expandedTopicKeys.value.includes(key)
    ? expandedTopicKeys.value.filter((item) => item !== key)
    : [...expandedTopicKeys.value, key]
}

// 模块缩写使用 ESAT 固定业务标识，未知模块按页面顺序生成兜底标识。
function moduleBadge(moduleId: string, index: number): string {
  const badges: Record<string, string> = {
    maths1: 'M1',
    maths2: 'M2',
    physics: 'PH',
    chemistry: 'CH',
    biology: 'BI',
  }
  return badges[moduleId] || `P${index + 1}`
}

// 掌握率按原型显示整数百分比，样本量仍通过题数单独呈现。
function formatAccuracy(value: number | null): string {
  return value === null ? '-' : `${Math.round(value * 100)}%`
}

// 进度条宽度限制在合法百分比内，防止异常数据破坏布局。
function masteryWidth(value: number | null): string {
  return `${Math.max(0, Math.min(100, (value || 0) * 100))}%`
}
</script>

<style scoped lang="scss">
.knowledge-section {
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
}

.section-title svg {
  width: 22px;
  height: 22px;
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

.knowledge-card {
  padding: 28px 30px 30px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.knowledge-card > h3 {
  margin: 0 0 20px;
  font-size: var(--text-base);
}

.module-list {
  display: grid;
  gap: 10px;
}

.module-group {
  overflow: hidden;
  border: 1px solid var(--color-line-soft);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.module-group--expanded {
  border-color: var(--color-line);
}

.module-heading {
  display: flex;
  width: 100%;
  min-height: 52px;
  gap: 12px;
  align-items: center;
  padding: 10px 14px;
  border: 0;
  background: var(--color-surface-alt);
  color: var(--color-ink);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
}

.module-heading:hover {
  background: var(--color-hover);
}

.module-badge {
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  background: var(--color-info-bg);
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
  letter-spacing: 0.04em;
}

.module-heading > strong {
  font-size: var(--text-base);
}

.module-heading > small {
  color: var(--color-ink-muted);
}

.module-result {
  display: flex;
  gap: 18px;
  align-items: center;
  margin-left: auto;
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
}

.module-result b {
  min-width: 44px;
  color: var(--color-ink);
  text-align: right;
}

.chevron {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: var(--color-ink-muted);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
  transition: transform var(--duration-base) var(--ease-out);
}

.module-group--expanded .chevron {
  transform: rotate(180deg);
}

.topic-list {
  padding: 8px 16px 14px;
}

.topic-group + .topic-group {
  border-top: 1px solid var(--color-line-soft);
}

.topic-summary {
  display: grid;
  grid-template-columns: 30px minmax(260px, 1.35fr) 88px minmax(220px, 2fr) 54px;
  gap: 14px;
  align-items: center;
  min-height: 52px;
}

.expand-button {
  position: relative;
  width: 25px;
  height: 25px;
  padding: 0;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  cursor: pointer;
}

.expand-button:hover:not(:disabled) {
  border-color: var(--color-report-slate);
  background: var(--color-hover);
}

.expand-button:disabled {
  cursor: default;
  opacity: 0.45;
}

.expand-button span,
.expand-button i {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 9px;
  height: 1px;
  background: var(--color-report-slate);
  transform: translate(-50%, -50%);
}

.expand-button i {
  transform: translate(-50%, -50%) rotate(90deg);
  transition: transform var(--duration-fast) ease;
}

.expand-button--active i {
  transform: translate(-50%, -50%) rotate(0deg);
}

.topic-name {
  min-width: 0;
}

.topic-name strong {
  font-weight: var(--weight-normal);
}

.topic-name small,
.question-count {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.question-count {
  text-align: right;
}

.mastery-track {
  overflow: hidden;
  height: 8px;
  border-radius: var(--radius-pill);
  background: var(--color-report-track);
}

.mastery-track i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-report-slate);
  opacity: 0.48;
}

.accuracy-value {
  text-align: right;
}

.child-list {
  margin: 0 0 8px 38px;
  padding: 4px 12px 6px 16px;
  border-left: 1px solid var(--color-line);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  background: var(--color-surface-alt);
}

.child-row {
  display: grid;
  grid-template-columns: minmax(260px, 1.35fr) 88px minmax(220px, 2fr) 54px;
  gap: 14px;
  align-items: center;
  min-height: 48px;
}

.child-row + .child-row {
  border-top: 1px solid var(--color-line-soft);
}

.child-name {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
}

.child-name > span {
  width: 6px;
  height: 6px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--color-report-slate);
  opacity: 0.55;
}

.child-name strong,
.child-name small {
  display: block;
}

.child-name strong {
  overflow: hidden;
  font-size: var(--text-sm);
  font-weight: var(--weight-normal);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.child-name small {
  margin-top: 2px;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.mastery-track--child i {
  opacity: 0.32;
}

.empty-topics {
  padding: 24px;
  color: var(--color-ink-muted);
  text-align: center;
}
</style>
