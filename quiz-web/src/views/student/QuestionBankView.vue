<template>
  <div class="question-bank">
    <NavBar />

    <main class="qb-container">
      <!-- ========== 页头：标题 + 搜索 ========== -->
      <header class="qb-header">
        <div class="qb-header__lead">
          <h1 class="qb-header__title">试题库 (Question Bank)</h1>
          <p class="qb-header__subtitle">包含专属试题练习与全真模拟考试系统。</p>
        </div>
        <div class="qb-search">
          <span class="qb-search__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            v-model="searchKeyword"
            type="text"
            class="qb-search__input"
            placeholder="搜索题目、考点..."
          />
        </div>
      </header>

      <!-- ========== Tab：试题练习 / 模拟考试 ========== -->
      <div class="qb-tabs" role="tablist">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          role="tab"
          class="qb-tab"
          :class="{ 'qb-tab--active': activeTabId === tab.id }"
          :aria-selected="activeTabId === tab.id"
          @click="activeTabId = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- ========== 主体两栏：考点 + 难度卡 ========== -->
      <section class="qb-main">
        <!-- 左侧：考点大纲 -->
        <aside class="qb-sidebar">
          <h3 class="qb-sidebar__title">考点大纲 (SYLLABUS)</h3>
          <ul class="qb-topics">
            <li v-for="topic in topics" :key="topic.id">
              <button
                type="button"
                class="qb-topic"
                :class="{ 'qb-topic--active': activeTopicId === topic.id }"
                @click="handleSelectTopic(topic)"
              >
                {{ topic.name }}
              </button>
            </li>
          </ul>
        </aside>

        <!-- 右侧：选择难度 -->
        <section class="qb-content">
          <header class="qb-content__header">
            <h2 class="qb-content__title">{{ activeTopicTitle }}</h2>
            <span class="qb-content__hint">
              选择难度以生成测试卷 (共{{ totalQuestionCount }}题)
            </span>
          </header>

          <div class="qb-difficulty-grid">
            <article
              v-for="diff in difficulties"
              :key="diff.id"
              class="qb-difficulty-card"
              :data-theme="diff.id"
            >
              <h3 class="qb-difficulty-card__title">
                {{ diff.label }} ({{ diff.englishLabel }})
                <span class="qb-difficulty-card__count">{{ diff.count }} 题</span>
              </h3>
              <p class="qb-difficulty-card__desc">{{ diff.description }}</p>
              <button
                type="button"
                class="qb-difficulty-card__cta"
                :disabled="diff.count === 0"
                @click="handleStartPractice(diff)"
              >
                <svg
                  class="qb-cta__icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <polygon points="6 4 20 12 6 20 6 4" />
                </svg>
                开始练习
              </button>
            </article>
          </div>
        </section>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
// 试题库浏览页（从已发布试卷汇总真实题目，按难度/学科筛选后进入练习）
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import request from '@/utils/request'

const router = useRouter()

interface Topic {
  id: string
  name: string
}

type DifficultyId = 'easy' | 'medium' | 'hard' | 'composite'

interface DifficultyOption {
  id: DifficultyId
  label: string
  englishLabel: string
  description: string
  count: number
}

interface QbTab {
  id: 'practice' | 'mock'
  label: string
}

interface QuestionBankData {
  questions: any[]
  total: number
  difficultyCount: Record<string, number>
  subjects: string[]
}

const tabs: QbTab[] = [
  { id: 'practice', label: '试题练习' },
  { id: 'mock', label: '模拟考试' },
]
const activeTabId = ref<QbTab['id']>('practice')

const topics = ref<Topic[]>([{ id: 'all', name: 'All Topics' }])
const activeTopicId = ref<string>('all')
const totalQuestionCount = ref<number>(0)

const difficultyCount = ref<Record<string, number>>({ easy: 0, medium: 0, hard: 0, composite: 0 })

const difficulties = ref<DifficultyOption[]>([
  { id: 'easy', label: '简单', englishLabel: 'Easy', count: 0, description: '适合巩固基础知识，掌握基本公式的直接应用。在遇到更难的题目之前建立解题自信。' },
  { id: 'medium', label: '中等', englishLabel: 'Medium', count: 0, description: '要求多步推导与综合理解，贴近真实考试标准难度。考察对基础公式的灵活变形应用。' },
  { id: 'hard', label: '困难', englishLabel: 'Hard', count: 0, description: '包含生僻考点、复杂场景变换与严谨证明。冲刺 G5 最高分段必备挑战。' },
  { id: 'composite', label: '复合', englishLabel: 'Composite', count: 0, description: '跨章节综合题型，如代数与几何结合，考察知识点串联能力以及应对高认知负荷状态。' },
])

const searchKeyword = ref<string>('')

onMounted(async () => {
  try {
    const res = await request.get<QuestionBankData>('/papers/question-bank')
    const data = res.data

    totalQuestionCount.value = data.total
    difficultyCount.value = data.difficultyCount

    // 更新难度卡片计数
    difficulties.value = difficulties.value.map(d => ({
      ...d,
      count: data.difficultyCount[d.id] || 0,
    }))

    // 用真实学科构建 topics
    const allTopics: Topic[] = [{ id: 'all', name: 'All Topics' }]
    for (const s of data.subjects) {
      allTopics.push({ id: s, name: s })
    }
    topics.value = allTopics
  } catch {
    // 获取失败保持默认空数据
  }
})

const activeTopicTitle = computed<string>(() => {
  const topic = topics.value.find((t) => t.id === activeTopicId.value)
  if (!topic) return ''
  return topic.id === 'all' ? `综合考点 (${topic.name})` : topic.name
})

const handleSelectTopic = (topic: Topic): void => {
  activeTopicId.value = topic.id
}

const handleStartPractice = (diff: DifficultyOption): void => {
  router.push({
    path: '/practice',
    query: {
      topic: activeTopicId.value,
      difficulty: diff.id,
    },
  })
}
</script>

<style scoped lang="scss">
/* ========== 设计令牌（与 样式开发规范.md 对齐） ========== */
.question-bank {
  --color-primary: #4f46e5;
  --color-primary-light: #6366f1;
  --color-primary-bg: #eef2ff;

  --color-success: #10b981;
  --color-success-bg: #ecfdf5;
  --color-success-border: #a7f3d0;
  --color-warning: #f59e0b;
  --color-warning-bg: #fffbeb;
  --color-warning-border: #fde68a;
  --color-error: #ef4444;
  --color-error-bg: #fef2f2;
  --color-error-border: #fecaca;
  --color-composite: #9333ea;
  --color-composite-bg: #faf5ff;
  --color-composite-border: #e9d5ff;

  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-surface-muted: #f1f5f9;
  --color-border: #e2e8f0;
  --color-border-light: #f1f5f9;

  --color-text: #0f172a;
  --color-text-secondary: #475569;
  --color-text-muted: #94a3b8;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;

  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
  --radius-pill: 999px;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07),
    0 2px 4px -2px rgba(0, 0, 0, 0.05);

  min-height: 100vh;
  background: var(--color-bg);
  color: var(--color-text);
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei',
    Roboto, sans-serif;
}

/* ========== 容器 ========== */
.qb-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--space-12) var(--space-8);
}

/* ========== 页头 ========== */
.qb-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: var(--space-8);
  margin-bottom: var(--space-10);
}

.qb-header__title {
  font-size: 2.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-text);
  margin: 0 0 var(--space-2);
}

.qb-header__subtitle {
  font-size: 0.95rem;
  color: var(--color-text-muted);
  margin: 0;
}

/* ========== 搜索框 ========== */
.qb-search {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  max-width: 320px;
  padding: 10px 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  transition:
    border-color 0.2s,
    box-shadow 0.2s;

  &:focus-within {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
  }
}

.qb-search__icon {
  display: inline-flex;
  width: 18px;
  height: 18px;
  color: var(--color-text-muted);
  flex-shrink: 0;

  svg {
    width: 100%;
    height: 100%;
  }
}

.qb-search__input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.875rem;
  font-family: inherit;
  color: var(--color-text);

  &::placeholder {
    color: var(--color-text-muted);
  }
}

/* ========== Tab ========== */
.qb-tabs {
  display: flex;
  gap: var(--space-8);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-8);
}

.qb-tab {
  position: relative;
  padding: var(--space-3) 0;
  font-size: 0.95rem;
  font-weight: 600;
  font-family: inherit;
  color: var(--color-text-muted);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s;

  &::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: transparent;
    border-radius: 2px;
    transition: background 0.2s;
  }

  &:hover {
    color: var(--color-text);
  }

  &--active {
    color: var(--color-primary);

    &::after {
      background: var(--color-primary);
    }
  }
}

/* ========== 主体网格 ========== */
.qb-main {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: var(--space-8);
  align-items: start;
}

/* ========== 左侧：考点大纲 ========== */
.qb-sidebar {
  position: sticky;
  top: 88px;
}

.qb-sidebar__title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 var(--space-4);
  letter-spacing: 0.01em;
}

.qb-topics {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.qb-topic {
  width: 100%;
  padding: 10px 14px;
  text-align: left;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--color-surface-muted);
    color: var(--color-text);
  }

  &--active {
    background: var(--color-primary-bg);
    color: var(--color-primary);
    font-weight: 600;
  }
}

/* ========== 右侧：内容卡 ========== */
.qb-content {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  padding: var(--space-8);
  box-shadow: var(--shadow-sm);
}

.qb-content__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
  gap: var(--space-4);
}

.qb-content__title {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--color-text);
  margin: 0;
}

.qb-content__hint {
  display: inline-block;
  padding: 6px 14px;
  background: var(--color-primary-bg);
  color: var(--color-primary);
  border-radius: var(--radius-pill);
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

/* ========== 难度卡网格 ========== */
.qb-difficulty-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-5);
}

.qb-difficulty-card {
  padding: var(--space-6);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
}

.qb-difficulty-card__title {
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 0 0 var(--space-3);
}

.qb-difficulty-card__desc {
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-5);
  min-height: 2.8em;
}

.qb-difficulty-card__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  padding: 12px 24px;
  font-size: 0.95rem;
  font-weight: 600;
  font-family: inherit;
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }
}

.qb-cta__icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* ========== 难度色彩主题 ========== */
.qb-difficulty-card[data-theme='easy'] {
  background: var(--color-success-bg);
  border-color: var(--color-success-border);

  .qb-difficulty-card__title {
    color: var(--color-success);
  }
  .qb-difficulty-card__cta {
    background: rgba(16, 185, 129, 0.18);
    color: var(--color-success);

    &:hover {
      background: rgba(16, 185, 129, 0.28);
    }
  }
}

.qb-difficulty-card[data-theme='medium'] {
  background: var(--color-warning-bg);
  border-color: var(--color-warning-border);

  .qb-difficulty-card__title {
    color: var(--color-warning);
  }
  .qb-difficulty-card__cta {
    background: rgba(245, 158, 11, 0.18);
    color: var(--color-warning);

    &:hover {
      background: rgba(245, 158, 11, 0.28);
    }
  }
}

.qb-difficulty-card[data-theme='hard'] {
  background: var(--color-error-bg);
  border-color: var(--color-error-border);

  .qb-difficulty-card__title {
    color: var(--color-error);
  }
  .qb-difficulty-card__cta {
    background: rgba(239, 68, 68, 0.16);
    color: var(--color-error);

    &:hover {
      background: rgba(239, 68, 68, 0.26);
    }
  }
}

.qb-difficulty-card[data-theme='composite'] {
  background: var(--color-composite-bg);
  border-color: var(--color-composite-border);

  .qb-difficulty-card__title {
    color: var(--color-composite);
  }
  .qb-difficulty-card__cta {
    background: rgba(147, 51, 234, 0.14);
    color: var(--color-composite);

    &:hover {
      background: rgba(147, 51, 234, 0.24);
    }
  }
}

/* ========== 响应式 ========== */
@media (max-width: 1024px) {
  .qb-main {
    grid-template-columns: 200px 1fr;
    gap: var(--space-6);
  }
}

@media (max-width: 768px) {
  .qb-container {
    padding: var(--space-8) var(--space-4);
  }

  .qb-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-5);
  }

  .qb-search {
    max-width: none;
  }

  .qb-header__title {
    font-size: 1.75rem;
  }

  .qb-main {
    grid-template-columns: 1fr;
  }

  .qb-sidebar {
    position: static;
  }

  .qb-difficulty-grid {
    grid-template-columns: 1fr;
  }

  .qb-content__header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
