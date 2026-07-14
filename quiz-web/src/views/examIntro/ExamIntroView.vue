<!-- 考试介绍页：向学生展示 TMUA、ESAT、STEP 的考试概述、常见问题和横向对比。 -->
<template>
  <div class="exam-intro-page">
    <NavBar />

    <main>
      <section class="exam-hero">
        <div class="exam-hero__grid" aria-hidden="true"></div>
        <div class="exam-shell exam-hero__content">
          <div class="exam-kicker">
            <span class="exam-kicker__dot"></span>
            SmartKey Exam Intro
          </div>
          <h1>{{ currentExam.title }}</h1>
          <p>{{ currentExam.subtitle }}</p>
        </div>
      </section>

      <div class="exam-shell exam-content">
        <nav class="exam-tabs" aria-label="考试介绍内容">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="exam-tab"
            :class="{ 'exam-tab--active': activeTab === tab.id }"
            type="button"
            :aria-current="activeTab === tab.id ? 'page' : undefined"
            @click="activeTab = tab.id"
          >
            <svg v-if="tab.id === 'overview'" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9"></circle>
              <path d="M12 10v6M12 7.2v.1"></path>
            </svg>
            <svg v-else-if="tab.id === 'faq'" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 5.5h14v11H9l-4 3v-14Z"></path>
              <path d="M9.5 9a2.5 2.5 0 0 1 4.8 1c0 1.7-2.3 1.8-2.3 3M12 14.8v.2"></path>
            </svg>
            <svg v-else viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 19V9M12 19V5M19 19v-7"></path>
              <path d="M3 19h18"></path>
            </svg>
            {{ tab.label }}
          </button>
        </nav>

        <div :key="`${examType}-${activeTab}`" class="exam-panel">
          <template v-if="activeTab === 'overview'">
            <article
              v-for="section in currentExam.overview"
              :key="section.title"
              class="content-card"
            >
              <SectionTitle :title="section.title" />
              <div class="markdown-content" v-html="renderMarkdown(section.markdown)"></div>
            </article>
          </template>

          <template v-else-if="activeTab === 'faq'">
            <section v-for="group in currentExam.faq" :key="group.title" class="faq-group">
              <SectionTitle :title="group.title" />
              <div class="faq-list">
                <details v-for="item in group.items" :key="item.question" class="faq-item">
                  <summary>
                    <span>{{ item.question }}</span>
                    <span class="faq-item__toggle" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="m7 9 5 5 5-5"></path>
                      </svg>
                    </span>
                  </summary>
                  <div
                    class="faq-item__answer markdown-content"
                    v-html="renderMarkdown(item.answer)"
                  ></div>
                </details>
              </div>
            </section>
          </template>

          <template v-else>
            <article v-if="currentExam.comparison" class="content-card">
              <SectionTitle :title="currentExam.comparison.title" />
              <div
                class="markdown-content markdown-content--comparison"
                v-html="renderMarkdown(currentExam.comparison.markdown)"
              ></div>
            </article>
            <article v-if="currentExam.references" class="content-card">
              <SectionTitle :title="currentExam.references.title" />
              <div
                class="markdown-content"
                v-html="renderMarkdown(currentExam.references.markdown)"
              ></div>
            </article>
          </template>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import NavBar from '@/components/NavBar.vue'
import { examIntroData, isExamType, type ExamType } from './examIntroData'

type TabId = 'overview' | 'faq' | 'comparison'

const route = useRoute()
const router = useRouter()
const requestedTab = String(route.query.tab || '')
const activeTab = ref<TabId>(
  requestedTab === 'faq' || requestedTab === 'comparison' ? requestedTab : 'overview',
)
const tabs: Array<{ id: TabId; label: string }> = [
  { id: 'overview', label: '考试概述' },
  { id: 'faq', label: '常见问题' },
  { id: 'comparison', label: '考试对比' },
]

const examType = computed<ExamType>(() => {
  const value = String(route.params.examType || '').toLowerCase()
  return isExamType(value) ? value : 'tmua'
})
const currentExam = computed(() => examIntroData[examType.value])

// 产品提供的 Markdown 是受信任的本地静态内容，渲染时保留表格、列表和原始换行。
function renderMarkdown(markdown: string): string {
  return String(marked.parse(markdown, { async: false, breaks: true, gfm: true })).replace(
    /<a href=/g,
    '<a target="_blank" rel="noopener noreferrer" href=',
  )
}

// 切换考试时回到概述并滚到页首，避免保留上一门考试的阅读位置。
watch(
  () => route.params.examType,
  (value) => {
    const normalized = String(value || '').toLowerCase()
    if (!isExamType(normalized)) {
      router.replace('/exam-intro/tmua')
      return
    }
    activeTab.value = 'overview'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  },
)

const SectionTitle = defineComponent({
  name: 'SectionTitle',
  props: { title: { type: String, required: true } },
  setup(props) {
    return () =>
      h('div', { class: 'section-title' }, [
        h('span', { class: 'section-title__bar', 'aria-hidden': 'true' }),
        h('h2', props.title),
      ])
  },
})
</script>

<style scoped>
.exam-intro-page {
  min-width: var(--fluid-page-min-width);
  min-height: 100vh;
  background: var(--color-hover);
}

.exam-shell {
  width: var(--fluid-shell-width);
  margin: 0 auto;
}

.exam-hero {
  position: relative;
  min-height: 330px;
  padding: 64px 0 96px;
  overflow: hidden;
  border-bottom: 1px solid var(--color-line);
}

.exam-hero__grid {
  position: absolute;
  inset: 0;
  opacity: 0.55;
  background-image:
    linear-gradient(var(--color-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-line) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(ellipse 80% 70% at 50% 38%, black 25%, transparent 78%);
}

.exam-hero__content {
  position: relative;
  z-index: 1;
}

.exam-kicker {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 30px;
  color: var(--color-ink-soft);
  font-size: 13px;
  font-weight: var(--weight-medium);
  letter-spacing: 0.04em;
}

.exam-kicker__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-ink);
}

.exam-hero h1 {
  max-width: 840px;
  margin: 0 0 22px;
  color: var(--color-ink);
  font-size: clamp(44px, 3.1vw, 60px);
  font-weight: var(--weight-bold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
}

.exam-hero p {
  max-width: 720px;
  margin: 0;
  color: var(--color-ink-soft);
  font-size: var(--text-lg);
  line-height: var(--leading-relaxed);
}

.exam-content {
  position: relative;
  z-index: 2;
  margin-top: -40px;
  padding-bottom: 96px;
}

.exam-tabs {
  display: flex;
  align-items: stretch;
  gap: 4px;
  margin-bottom: 40px;
  padding: 0 24px;
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.exam-tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-width: 156px;
  height: 64px;
  padding: 0 22px;
  border: 0;
  background: transparent;
  color: var(--color-ink-muted);
  font: inherit;
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  cursor: pointer;
  transition: color var(--duration-base) ease;
}

.exam-tab::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 2px;
  background: transparent;
}

.exam-tab svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.exam-tab:hover,
.exam-tab--active {
  color: var(--color-ink);
}

.exam-tab--active::after {
  background: var(--color-ink);
}

.exam-panel {
  animation: panel-in var(--duration-slow) var(--ease-out);
}

.content-card {
  margin-bottom: 32px;
  padding: 40px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--duration-slow) ease;
}

.content-card:hover {
  box-shadow: var(--shadow-md);
}

:deep(.section-title) {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 30px;
}

:deep(.section-title__bar) {
  width: 6px;
  height: 25px;
  border-radius: var(--radius-pill);
  background: var(--color-ink);
}

:deep(.section-title h2) {
  margin: 0;
  color: var(--color-ink);
  font-size: var(--text-2xl);
  line-height: var(--leading-snug);
  letter-spacing: var(--tracking-tight);
}

.section-lead {
  max-width: 820px;
  margin: -8px 0 26px;
  color: var(--color-ink-soft);
  font-size: 15px;
  line-height: var(--leading-relaxed);
}

:deep(.markdown-content) {
  overflow-x: auto;
  color: var(--color-ink-soft);
  font-size: 15px;
  line-height: var(--leading-relaxed);
}

:deep(.markdown-content > :first-child) {
  margin-top: 0;
}

:deep(.markdown-content > :last-child) {
  margin-bottom: 0;
}

:deep(.markdown-content p) {
  margin: 0 0 18px;
}

:deep(.markdown-content strong) {
  color: var(--color-ink);
  font-weight: var(--weight-semi);
}

:deep(.markdown-content ul),
:deep(.markdown-content ol) {
  display: grid;
  gap: 10px;
  margin: 0 0 22px;
  padding-left: 22px;
}

:deep(.markdown-content li) {
  padding-left: 2px;
}

:deep(.markdown-content blockquote) {
  margin: 22px 0;
  padding: 16px 20px;
  border-left: 4px solid var(--color-ink);
  border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
  background: var(--color-surface-alt);
}

:deep(.markdown-content blockquote p) {
  margin: 0;
}

:deep(.markdown-content table) {
  width: 100%;
  margin: 22px 0;
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-collapse: separate;
  border-spacing: 0;
  border-radius: var(--radius-lg);
  table-layout: auto;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
}

:deep(.markdown-content th),
:deep(.markdown-content td) {
  min-width: 140px;
  padding: 15px 18px;
  border-right: 1px solid var(--color-line-soft);
  border-bottom: 1px solid var(--color-line-soft);
  text-align: left;
  vertical-align: top;
  line-height: var(--leading-relaxed);
}

:deep(.markdown-content th) {
  background: var(--color-surface-alt);
  color: var(--color-ink);
  font-size: 13px;
  font-weight: var(--weight-semi);
}

:deep(.markdown-content td) {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
}

:deep(.markdown-content tr:last-child td) {
  border-bottom: 0;
}

:deep(.markdown-content th:last-child),
:deep(.markdown-content td:last-child) {
  border-right: 0;
}

:deep(.markdown-content pre) {
  margin: 20px 0;
  padding: 22px 24px;
  overflow-x: auto;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface-alt);
  color: var(--color-ink-soft);
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.8;
}

:deep(.markdown-content code) {
  font-family: var(--font-mono);
}

:deep(.markdown-content a) {
  color: var(--color-ink);
  text-decoration: underline;
  text-underline-offset: 3px;
}

:deep(.markdown-content hr) {
  margin: 28px 0;
  border: 0;
  border-top: 1px solid var(--color-line);
}

:deep(.markdown-content--comparison table) {
  min-width: 980px;
}

.table-wrap {
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
}

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

th,
td {
  padding: 16px 22px;
  border-bottom: 1px solid var(--color-line-soft);
  text-align: left;
  vertical-align: top;
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

th {
  background: var(--color-surface-alt);
  color: var(--color-ink);
  font-weight: var(--weight-semi);
}

td {
  color: var(--color-ink-soft);
}

th:first-child,
td:first-child {
  width: 23%;
}

tr:last-child td {
  border-bottom: 0;
}

.table-label {
  color: var(--color-ink);
  font-weight: var(--weight-semi);
}

.notice-box {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-top: 24px;
  padding: 18px 20px;
  border-left: 4px solid var(--color-ink);
  border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
  background: var(--color-surface-alt);
}

.notice-box__mark {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 22px;
  height: 22px;
  border: 1px solid var(--color-ink);
  border-radius: 50%;
  color: var(--color-ink);
  font-size: 12px;
  font-weight: var(--weight-bold);
}

.notice-box p,
.timeline-tip {
  margin: 0;
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

.purpose-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 28px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.purpose-list li {
  position: relative;
  padding: 18px 20px 18px 48px;
  border: 1px solid var(--color-line-soft);
  border-radius: var(--radius-lg);
  color: var(--color-ink-soft);
  font-size: 15px;
  line-height: var(--leading-relaxed);
}

.purpose-list li::before {
  content: '✓';
  position: absolute;
  top: 18px;
  left: 20px;
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-ink);
  color: var(--color-ink-inverse);
  font-size: 11px;
  font-weight: var(--weight-bold);
}

.paper-list {
  display: grid;
  gap: 16px;
}

.paper-item {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 24px;
  padding: 24px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
}

.paper-item__number {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  background: var(--color-ink);
  color: var(--color-ink-inverse);
  font-family: var(--font-mono);
  font-size: var(--text-lg);
  font-weight: var(--weight-semi);
}

.paper-item h3 {
  margin: 2px 0 18px;
  color: var(--color-ink);
  font-size: var(--text-lg);
}

.paper-item dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 24px;
  margin: 0;
}

.paper-item dl div {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 10px;
}

.paper-item dt,
.paper-item dd {
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

.paper-item dt {
  color: var(--color-ink-muted);
}

.paper-item dd {
  color: var(--color-ink-soft);
}

.timeline-tip {
  margin-top: 22px;
}

.timeline-tip strong {
  color: var(--color-ink);
}

.faq-group {
  margin-bottom: 46px;
}

.faq-group :deep(.section-title) {
  padding: 0 4px;
  margin-bottom: 22px;
}

.faq-list {
  display: grid;
  gap: 14px;
}

.faq-item {
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--duration-slow) ease;
}

.faq-item:hover {
  box-shadow: var(--shadow-md);
}

.faq-item summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 74px;
  padding: 20px 28px;
  color: var(--color-ink);
  font-size: var(--text-base);
  font-weight: var(--weight-semi);
  cursor: pointer;
  list-style: none;
}

.faq-item summary::-webkit-details-marker {
  display: none;
}

.faq-item__toggle {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-hover);
  transition: background var(--duration-base) ease;
}

.faq-item__toggle svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: var(--color-ink-soft);
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform var(--duration-slow) var(--ease-out);
}

.faq-item[open] .faq-item__toggle svg {
  transform: rotate(180deg);
}

.faq-item__answer {
  padding: 0 28px 24px;
}

.faq-item__answer p {
  margin: 0;
  padding-top: 18px;
  border-top: 1px solid var(--color-line-soft);
  color: var(--color-ink-soft);
  font-size: 15px;
  line-height: var(--leading-relaxed);
}

.comparison-table th:first-child,
.comparison-table td:first-child {
  width: 18%;
}

.notice-box--comparison {
  margin-top: 30px;
}

@keyframes panel-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
