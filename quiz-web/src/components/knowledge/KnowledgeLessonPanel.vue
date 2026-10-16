<!-- 试题库章节学习面板：通用讲解与备考讲义随考纲选择同步。 -->
<template>
  <section class="knowledge-panel" aria-labelledby="knowledge-panel-title">
    <header class="knowledge-header">
      <div class="knowledge-heading">
        <span class="knowledge-book-icon" aria-hidden="true"><Reading /></span>
        <div>
          <span class="knowledge-eyebrow">知识点讲解 <span>LEARN & PRACTISE</span></span>
          <h3 id="knowledge-panel-title">{{ lesson.title }}</h3>
          <p><KnowledgeText :text="lesson.subtitle" /></p>
          <div class="knowledge-header-meta">
            <span>{{ lesson.sections.length }} 个知识点</span>
            <span>{{
              section?.examFocus
                ? '梳理知识 → 例题应用 → 变式巩固'
                : '理解概念 → 拆解例题 → 自测巩固'
            }}</span>
          </div>
        </div>
      </div>
      <div class="knowledge-actions">
        <AppButton
          class="knowledge-primary"
          size="small"
          :icon="Right"
          icon-position="right"
          @click="emit('practise')"
          >去练习</AppButton
        >
        <AppButton
          class="knowledge-secondary"
          type="secondary"
          size="small"
          :aria-expanded="expanded"
          aria-controls="knowledge-panel-body"
          @click="expanded = !expanded"
          >{{ expanded ? '收起讲解' : '展开讲解' }}</AppButton
        >
      </div>
    </header>

    <div v-if="section" v-show="expanded" id="knowledge-panel-body">
      <div class="knowledge-intro">
        <span class="knowledge-label">本节导读</span>
        <p><KnowledgeText :text="lesson.intro" /></p>
      </div>
      <div class="knowledge-navigation">
        <label for="knowledge-point-select">本节知识点</label>
        <el-select
          id="knowledge-point-select"
          :model-value="selectedCode === lesson.code ? '' : section.code"
          :placeholder="`整章阅读 · ${section.title}`"
          aria-label="本节知识点"
          @change="selectSection"
        >
          <el-option
            v-for="(item, index) in lesson.sections"
            :key="item.code"
            :label="`${String(index + 1).padStart(2, '0')} · ${item.title}`"
            :value="item.code"
          />
        </el-select>
        <span class="knowledge-position"
          >{{ sectionIndex + 1 }} / {{ lesson.sections.length }}</span
        >
      </div>

      <p v-if="selectedCode === lesson.code" class="knowledge-range-note">
        当前练习范围为整节；选择具体知识点后，练习范围会同步切换。
      </p>

      <article :key="section.code" class="knowledge-article">
        <div class="knowledge-section-heading">
          <span class="knowledge-section-number" aria-hidden="true">{{
            String(sectionIndex + 1).padStart(2, '0')
          }}</span>
          <div>
            <h4 ref="sectionHeadingRef" tabindex="-1">{{ section.title }}</h4>
            <p class="knowledge-summary"><KnowledgeText :text="section.summary" /></p>
          </div>
        </div>

        <ExamKnowledgeContent
          v-if="section.examFocus"
          :key="`${lesson.code}:${selectedCode}`"
          :section="section"
          :focus="section.examFocus"
        />
        <el-tabs
          v-else
          v-model="activeTab"
          class="knowledge-tabs"
          :class="`knowledge-tabs--${activeTab}`"
          aria-label="讲解内容"
        >
          <el-tab-pane label="概念与方法" name="concept">
            <template #label><Reading aria-hidden="true" /><span>概念与方法</span></template>
            <h5 class="knowledge-subheading"><span>先理解</span><small>把概念说清楚</small></h5>
            <div class="knowledge-copy">
              <p v-for="(paragraph, index) in section.paragraphs" :key="index">
                <KnowledgeText :text="paragraph" />
              </p>
            </div>
            <h5 class="knowledge-subheading knowledge-subheading--rules">
              <span>核心规则</span><small>{{ section.rules.length }} 条要点，逐一掌握</small>
            </h5>
            <div class="knowledge-rules">
              <div v-for="(rule, index) in section.rules" :key="index" class="knowledge-rule">
                <span class="knowledge-rule-number" aria-hidden="true">{{
                  String(index + 1).padStart(2, '0')
                }}</span>
                <div>
                  <strong>{{ rule.title }}</strong>
                  <p><KnowledgeText :text="rule.text" /></p>
                </div>
              </div>
            </div>
            <KnowledgeVisual
              v-if="section.visual"
              :key="section.code"
              :kind="section.visual"
              :topic="section.code"
            />
          </el-tab-pane>
          <el-tab-pane label="例题拆解" name="example">
            <template #label><EditPen aria-hidden="true" /><span>例题拆解</span></template>
            <div class="knowledge-example-prompt">
              <div class="knowledge-card-heading">
                <EditPen aria-hidden="true" /><strong>原创例题</strong
                ><span>先独立尝试，再看步骤</span>
              </div>
              <p class="knowledge-question"><KnowledgeText :text="section.example.question" /></p>
            </div>
            <AppButton
              v-if="!exampleRevealed"
              class="knowledge-example-button"
              type="secondary"
              size="small"
              @click="exampleRevealed = true"
              >查看解题步骤</AppButton
            >
            <div v-else class="knowledge-example-solution">
              <h5 class="knowledge-subheading">
                <span>一步步解题</span><small>理解每一步的理由</small>
              </h5>
              <ol class="knowledge-steps">
                <li v-for="(step, index) in section.example.steps" :key="index">
                  <KnowledgeText :text="step" />
                </li>
              </ol>
              <div class="knowledge-answer">
                <strong>答案</strong><KnowledgeText :text="section.example.answer" />
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="易错与自测" name="check">
            <template #label><CircleCheck aria-hidden="true" /><span>易错与自测</span></template>
            <div class="knowledge-pitfall-card">
              <div class="knowledge-card-heading">
                <Warning aria-hidden="true" /><strong>这些地方容易出错</strong>
              </div>
              <ul class="knowledge-pitfalls">
                <li v-for="(pitfall, index) in section.pitfalls" :key="index">
                  <KnowledgeText :text="pitfall" />
                </li>
              </ul>
            </div>
            <fieldset class="knowledge-check">
              <legend>一分钟自测</legend>
              <p><KnowledgeText :text="section.check.question" /></p>
              <el-radio-group v-model="selectedAnswer" aria-label="自测选项" :disabled="submitted">
                <el-radio
                  v-for="(option, index) in section.check.options"
                  :key="index"
                  :value="index"
                >
                  <span class="knowledge-option-letter"
                    >{{ String.fromCharCode(65 + index) }}.</span
                  >
                  <KnowledgeText :text="option" />
                </el-radio>
              </el-radio-group>
              <AppButton
                v-if="!submitted"
                class="knowledge-primary"
                size="small"
                :disabled="selectedAnswer === null"
                @click="submitted = true"
                >检查答案</AppButton
              >
              <div
                v-else
                class="knowledge-feedback"
                :class="{ 'knowledge-feedback--correct': isCorrect }"
                role="status"
              >
                <strong
                  >{{ isCorrect ? '答对了！' : '再想一想' }} · 正确答案
                  {{ String.fromCharCode(65 + section.check.answerIndex) }}</strong
                >
                <p><KnowledgeText :text="section.check.explanation" /></p>
                <AppButton type="link" size="small" @click="resetCheck">重新作答</AppButton>
              </div>
              <p class="knowledge-check-note">用于检查理解，不计入练习记录。</p>
            </fieldset>
          </el-tab-pane>
        </el-tabs>
      </article>

      <div class="knowledge-memory">
        <div class="knowledge-card-heading">
          <CollectionTag aria-hidden="true" /><strong>{{
            section.examFocus ? '考前速记' : '整节记忆卡'
          }}</strong
          ><span>记住这些关键要点</span>
        </div>
        <ul>
          <li v-for="(tip, index) in lesson.memory" :key="index"><KnowledgeText :text="tip" /></li>
        </ul>
      </div>
      <footer class="knowledge-footer">
        <AppButton
          type="secondary"
          size="small"
          :disabled="sectionIndex === 0"
          @click="moveSection(-1)"
          >上一个知识点</AppButton
        >
        <AppButton
          v-if="sectionIndex < lesson.sections.length - 1"
          class="knowledge-secondary"
          type="secondary"
          size="small"
          @click="moveSection(1)"
          >下一个知识点</AppButton
        >
        <AppButton v-else class="knowledge-primary" size="small" @click="emit('practise')"
          >开始巩固练习</AppButton
        >
      </footer>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onDeactivated, ref, watch } from 'vue'
import {
  CircleCheck,
  CollectionTag,
  EditPen,
  Reading,
  Right,
  Warning,
} from '@element-plus/icons-vue'
import AppButton from '@/components/AppButton.vue'
import KnowledgeVisual from './KnowledgeVisual.vue'
import KnowledgeText from './KnowledgeText.vue'
import ExamKnowledgeContent from './ExamKnowledgeContent.vue'
import type { KnowledgeLesson } from '@/content/knowledge/types'

const props = defineProps<{ lesson: KnowledgeLesson; selectedCode: string }>()
const emit = defineEmits<{ select: [code: string]; practise: [] }>()
const expanded = ref(true)
const activeTab = ref('concept')
const exampleRevealed = ref(false)
const selectedAnswer = ref<number | null>(null)
const submitted = ref(false)
const sectionHeadingRef = ref<HTMLElement>()

// 章级入口从首个知识点开始，叶子入口直接定位该知识点。
const sectionIndex = computed(() =>
  Math.max(
    0,
    props.lesson.sections.findIndex((item) => item.code === props.selectedCode),
  ),
)
// 当前讲解只取当前章节内的知识点，不从其他章节回退。
const section = computed(() => props.lesson.sections[sectionIndex.value])
// 自测答案是原创教学内容，在学生提交后提供即时反馈。
const isCorrect = computed(() => selectedAnswer.value === section.value?.check.answerIndex)

// 切换讲解时回到概念页并清空上个知识点的作答与例题展开状态。
watch(
  () => [props.lesson.code, props.selectedCode],
  () => {
    expanded.value = true
    activeTab.value = 'concept'
    exampleRevealed.value = false
    resetCheck()
  },
)

// 自测只存在当前面板，不创建考试记录或改变用户练习统计。
function resetCheck(): void {
  selectedAnswer.value = null
  submitted.value = false
}

// 学习工作区缓存题库页面，但离开后不保留本次即时自测结果。
onDeactivated(resetCheck)

// 将面板内选择交回页面，让考纲高亮、题量和练习范围一起更新。
async function selectSection(code: string): Promise<void> {
  emit('select', code)
  await nextTick()
  sectionHeadingRef.value?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start',
  })
  sectionHeadingRef.value?.focus({ preventScroll: true })
}

// 顺序学习使用同一考纲选择流程，防止读到下一点但练习仍停在上一点。
function moveSection(offset: number): void {
  const nextSection = props.lesson.sections[sectionIndex.value + offset]
  if (nextSection) void selectSection(nextSection.code)
}
</script>

<style scoped>
.knowledge-panel {
  min-width: 0;
  margin-bottom: 28px;
  overflow: hidden;
  border: 1px solid var(--color-learning-blue-line);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
}
.knowledge-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 20px;
  padding: 28px;
  border-top: 4px solid var(--color-learning-blue);
  border-bottom: 1px solid var(--color-learning-blue-line);
  background: linear-gradient(115deg, var(--color-learning-blue-soft), var(--color-surface));
}
.knowledge-heading {
  display: flex;
  gap: 16px;
  min-width: 0;
}
.knowledge-heading > div {
  min-width: 0;
}
.knowledge-book-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  background: var(--color-learning-blue);
  color: var(--color-ink-inverse);
}
.knowledge-book-icon svg {
  width: 26px;
  height: 26px;
}
.knowledge-eyebrow {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 12px;
  color: var(--color-learning-blue);
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
}
.knowledge-eyebrow span {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
}
.knowledge-header h3 {
  margin: 8px 0;
  font-size: var(--text-3xl);
  font-weight: var(--weight-bold);
  line-height: var(--leading-snug);
  color: var(--color-ink);
}
.knowledge-header p {
  margin: 0;
  color: var(--color-ink-soft);
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
}
.knowledge-header-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  margin-top: 16px;
  font-size: var(--text-xs);
  color: var(--color-ink-soft);
}
.knowledge-header-meta span:first-child {
  padding: 3px 10px;
  border: 1px solid var(--color-learning-blue-line);
  border-radius: var(--radius-pill);
  background: var(--color-surface);
  color: var(--color-learning-blue);
  font-weight: var(--weight-semi);
}
.knowledge-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
#knowledge-panel-body {
  padding: 0 28px 24px;
}
.knowledge-intro {
  margin: 24px 0;
  padding-left: 16px;
  border-left: 3px solid var(--color-learning-blue-line);
}
.knowledge-label {
  color: var(--color-learning-blue);
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
}
.knowledge-intro p {
  margin: 8px 0 0;
  font-size: var(--text-sm);
  color: var(--color-ink-soft);
  line-height: var(--leading-relaxed);
}
.knowledge-navigation {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  background: var(--color-learning-blue-soft);
}
.knowledge-navigation label {
  flex-shrink: 0;
  font-size: var(--text-sm);
  color: var(--color-learning-blue);
  font-weight: var(--weight-semi);
}
.knowledge-navigation :deep(.el-select) {
  flex: 1;
  min-width: 0;
}
.knowledge-navigation :deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1px var(--color-learning-blue) inset;
}
.knowledge-position {
  flex-shrink: 0;
  color: var(--color-learning-blue);
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  font-family: var(--font-mono);
}
.knowledge-range-note {
  margin: 10px 0 0;
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
  line-height: var(--leading-relaxed);
}
.knowledge-article {
  margin-top: 32px;
  color: var(--color-ink-soft);
  line-height: var(--leading-relaxed);
  overflow-wrap: anywhere;
}
.knowledge-section-heading {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 24px;
}
.knowledge-section-heading > div {
  min-width: 0;
}
.knowledge-section-number {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border: 1px solid var(--color-learning-blue-line);
  border-radius: var(--radius-md);
  background: var(--color-learning-blue-soft);
  color: var(--color-learning-blue);
  font-family: var(--font-mono);
  font-size: var(--text-lg);
  font-weight: var(--weight-semi);
}
.knowledge-article h4 {
  margin: 0 0 8px;
  color: var(--color-ink);
  font-size: var(--text-2xl);
  font-weight: var(--weight-semi);
  line-height: var(--leading-snug);
  scroll-margin-top: calc(var(--nav-height) + 24px);
}
.knowledge-article h4:focus-visible {
  outline: 2px solid var(--color-learning-blue);
  outline-offset: 4px;
  border-radius: var(--radius-sm);
}
.knowledge-summary {
  margin: 0;
  font-size: var(--text-sm);
}
.knowledge-tabs :deep(.el-tabs__header) {
  margin-bottom: 24px;
}
.knowledge-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background: var(--color-learning-blue-line);
}
.knowledge-tabs :deep(.el-tabs__item) {
  gap: 7px;
  height: 46px;
  padding: 0 20px;
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
}
.knowledge-tabs :deep(.el-tabs__item svg) {
  width: 17px;
  height: 17px;
}
.knowledge-tabs :deep(.el-tabs__item.is-active),
.knowledge-tabs :deep(.el-tabs__item:hover) {
  color: var(--color-learning-blue);
  font-weight: var(--weight-semi);
}
.knowledge-tabs :deep(.el-tabs__active-bar) {
  height: 3px;
  background: var(--color-learning-blue);
  border-radius: var(--radius-pill);
}
.knowledge-tabs--example :deep(.el-tabs__item.is-active) {
  color: var(--color-learning-teal);
}
.knowledge-tabs--example :deep(.el-tabs__active-bar) {
  background: var(--color-learning-teal);
}
.knowledge-tabs--check :deep(.el-tabs__item.is-active) {
  color: var(--color-learning-amber);
}
.knowledge-tabs--check :deep(.el-tabs__active-bar) {
  background: var(--color-learning-amber);
}
.knowledge-subheading {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px 12px;
  margin: 0 0 12px;
  font-size: var(--text-base);
  color: var(--color-learning-blue);
  font-weight: var(--weight-semi);
}
.knowledge-subheading small {
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
  font-weight: var(--weight-normal);
}
.knowledge-subheading--rules {
  margin-top: 28px;
}
.knowledge-copy p {
  margin: 0 0 16px;
  font-size: var(--text-base);
  line-height: 1.85;
}
.knowledge-rules {
  display: grid;
  gap: 12px;
}
.knowledge-rule {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px;
  border: 1px solid var(--color-learning-blue-line);
  border-radius: var(--radius-md);
  background: linear-gradient(100deg, var(--color-learning-blue-soft), var(--color-surface) 70%);
}
.knowledge-rule > div {
  min-width: 0;
}
.knowledge-rule-number {
  flex-shrink: 0;
  margin-top: 1px;
  color: var(--color-learning-blue);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
}
.knowledge-rule strong {
  color: var(--color-learning-blue);
  font-size: var(--text-base);
  font-weight: var(--weight-semi);
}
.knowledge-rule p {
  margin: 8px 0 0;
  font-size: var(--text-sm);
  line-height: 1.85;
}
.knowledge-card-heading {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: var(--text-base);
}
.knowledge-card-heading > svg {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}
.knowledge-card-heading strong {
  font-weight: var(--weight-semi);
}
.knowledge-card-heading > span {
  margin-left: auto;
  font-size: var(--text-xs);
  font-weight: var(--weight-normal);
}
.knowledge-example-prompt {
  padding: 22px;
  margin-bottom: 20px;
  background: var(--color-learning-teal-soft);
  border: 1px solid var(--color-learning-teal-line);
  border-radius: var(--radius-lg);
}
.knowledge-example-prompt .knowledge-card-heading {
  color: var(--color-learning-teal);
}
.knowledge-question {
  margin: 16px 0 0;
  color: var(--color-ink);
  font-size: var(--text-base);
}
.knowledge-example-solution .knowledge-subheading {
  color: var(--color-learning-teal);
}
.knowledge-steps {
  list-style: none;
  counter-reset: solution-step;
  padding: 0;
  margin: 16px 0 22px;
  font-size: var(--text-sm);
}
.knowledge-steps li {
  counter-increment: solution-step;
  position: relative;
  min-height: 38px;
  padding: 0 0 20px 44px;
}
.knowledge-steps li:not(:last-child)::after {
  position: absolute;
  left: 14px;
  top: 32px;
  bottom: 4px;
  width: 1px;
  background: var(--color-learning-teal-line);
  content: '';
}
.knowledge-steps li::before {
  content: counter(solution-step);
  position: absolute;
  top: 0;
  left: 0;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: var(--radius-pill);
  background: var(--color-learning-teal-soft);
  color: var(--color-learning-teal);
  font-family: var(--font-mono);
  font-weight: var(--weight-semi);
}
.knowledge-answer {
  display: flex;
  gap: 16px;
  padding: 16px 18px;
  background: var(--color-learning-teal-soft);
  border-left: 3px solid var(--color-learning-teal);
  border-radius: var(--radius-sm);
  font-size: var(--text-base);
}
.knowledge-answer strong {
  flex-shrink: 0;
  color: var(--color-learning-teal);
}
.knowledge-pitfall-card {
  padding: 20px;
  background: var(--color-learning-amber-soft);
  border: 1px solid var(--color-learning-amber-line);
  border-radius: var(--radius-lg);
}
.knowledge-pitfall-card .knowledge-card-heading {
  color: var(--color-learning-amber);
}
.knowledge-pitfalls {
  padding-left: 20px;
  margin: 12px 0 0;
  font-size: var(--text-sm);
}
.knowledge-pitfalls li {
  padding-left: 4px;
  margin: 10px 0;
}
.knowledge-pitfalls li:last-child {
  margin-bottom: 0;
}
.knowledge-pitfalls li::marker {
  color: var(--color-learning-amber);
}
.knowledge-check {
  min-width: 0;
  margin: 28px 0 0;
  padding: 20px;
  border: 1px solid var(--color-learning-blue-line);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
}
.knowledge-check legend {
  padding: 0 10px;
  color: var(--color-learning-blue);
  font-size: var(--text-lg);
  font-weight: var(--weight-semi);
}
.knowledge-check > p {
  margin: 0 0 18px;
  color: var(--color-ink);
  font-size: var(--text-base);
}
.knowledge-check :deep(.el-radio-group) {
  display: grid;
  gap: 10px;
  margin-bottom: 20px;
}
.knowledge-check :deep(.el-radio) {
  height: auto;
  min-height: 44px;
  margin-right: 0;
  white-space: normal;
  align-items: flex-start;
  padding: 12px 14px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
}
.knowledge-check :deep(.el-radio:not(.is-disabled):hover),
.knowledge-check :deep(.el-radio.is-checked) {
  background: var(--color-learning-blue-soft);
  border-color: var(--color-learning-blue-line);
}
.knowledge-check :deep(.el-radio.is-checked .el-radio__label) {
  color: var(--color-learning-blue);
}
.knowledge-check :deep(.el-radio__input) {
  margin-top: 5px;
}
.knowledge-check :deep(.el-radio__input.is-checked .el-radio__inner) {
  background: var(--color-learning-blue);
  border-color: var(--color-learning-blue);
}
.knowledge-check :deep(.el-radio__input.is-disabled + .el-radio__label) {
  color: var(--color-ink-soft);
}
.knowledge-check :deep(.el-radio__label) {
  min-width: 0;
  line-height: var(--leading-relaxed);
}
.knowledge-option-letter {
  margin-right: 8px;
  font-family: var(--font-mono);
  font-weight: var(--weight-semi);
}
.knowledge-feedback {
  padding: 18px;
  border: 1px solid var(--color-learning-amber-line);
  border-radius: var(--radius-md);
  background: var(--color-learning-amber-soft);
}
.knowledge-feedback strong {
  color: var(--color-learning-amber);
}
.knowledge-feedback--correct {
  background: var(--color-learning-teal-soft);
  border-color: var(--color-learning-teal-line);
}
.knowledge-feedback--correct strong {
  color: var(--color-learning-teal);
}
.knowledge-feedback p {
  margin: 10px 0;
}
.knowledge-check .knowledge-check-note {
  margin: 16px 0 0;
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
}
.knowledge-memory {
  margin-top: 28px;
  padding: 22px;
  background: var(--color-learning-violet-soft);
  border: 1px solid var(--color-learning-violet-line);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  color: var(--color-ink-soft);
}
.knowledge-memory .knowledge-card-heading {
  color: var(--color-learning-violet);
}
.knowledge-memory ul {
  padding-left: 20px;
  margin: 14px 0 0;
}
.knowledge-memory li {
  padding-left: 4px;
}
.knowledge-memory li + li {
  margin-top: 10px;
}
.knowledge-memory li::marker {
  color: var(--color-learning-violet);
}
.knowledge-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
  margin-top: 24px;
}
.knowledge-panel :deep(.formula-block--display) {
  max-width: 100%;
  overflow-x: auto;
}
.knowledge-panel :deep(.knowledge-primary.app-button.el-button) {
  --app-button-bg: var(--color-learning-blue);
  --app-button-border: var(--color-learning-blue);
  --app-button-color: var(--color-ink-inverse);
  --app-button-hover-bg: var(--color-learning-blue);
  --app-button-hover-border: var(--color-learning-blue);
  --app-button-active-bg: var(--color-learning-blue);
  --app-button-active-border: var(--color-learning-blue);
}
.knowledge-panel :deep(.knowledge-secondary.app-button.el-button) {
  --app-button-border: var(--color-learning-blue-line);
  --app-button-color: var(--color-learning-blue);
  --app-button-hover-bg: var(--color-learning-blue-soft);
  --app-button-hover-border: var(--color-learning-blue);
  --app-button-active-bg: var(--color-learning-blue-soft);
  --app-button-active-border: var(--color-learning-blue);
}
.knowledge-panel :deep(.knowledge-example-button.app-button.el-button) {
  --app-button-border: var(--color-learning-teal-line);
  --app-button-color: var(--color-learning-teal);
  --app-button-hover-bg: var(--color-learning-teal-soft);
  --app-button-hover-border: var(--color-learning-teal);
  --app-button-active-bg: var(--color-learning-teal-soft);
  --app-button-active-border: var(--color-learning-teal);
}
.knowledge-panel :deep(.app-button.el-button:focus-visible) {
  outline-color: var(--color-learning-blue);
}
@media (max-width: 780px) {
  .knowledge-header {
    padding: 20px 16px;
  }
  .knowledge-heading {
    gap: 12px;
  }
  .knowledge-book-icon {
    width: 38px;
    height: 38px;
  }
  .knowledge-book-icon svg {
    width: 22px;
    height: 22px;
  }
  .knowledge-header h3 {
    font-size: var(--text-2xl);
  }
  .knowledge-eyebrow span {
    display: none;
  }
  .knowledge-header p {
    font-size: var(--text-sm);
  }
  #knowledge-panel-body {
    padding: 0 16px 20px;
  }
  .knowledge-navigation {
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px;
  }
  .knowledge-navigation label {
    width: 100%;
  }
  .knowledge-article {
    margin-top: 24px;
  }
  .knowledge-article h4 {
    font-size: var(--text-xl);
  }
  .knowledge-section-heading {
    gap: 10px;
  }
  .knowledge-section-number {
    width: 34px;
    height: 34px;
    font-size: var(--text-base);
  }
  .knowledge-tabs :deep(.el-tabs__item) {
    gap: 4px;
    padding: 0 12px;
  }
  .knowledge-tabs :deep(.el-tabs__item svg) {
    display: none;
  }
  .knowledge-rule {
    padding: 14px 12px;
    gap: 10px;
  }
  .knowledge-memory,
  .knowledge-check,
  .knowledge-pitfall-card,
  .knowledge-example-prompt {
    padding: 16px 12px;
  }
  .knowledge-card-heading > span {
    width: 100%;
    margin-left: 28px;
  }
}
</style>
