<template>
  <div class="question-bank">
    <NavBar />
    <main class="qb-container">
      <header class="qb-header">
        <div class="qb-header__lead">
          <h1 class="qb-header__title">试题库 (Question Bank)</h1>
          <p class="qb-header__subtitle">包含专项试题练习与全真模拟考试系统。</p>
        </div>
        <div class="qb-search">
          <input
            v-model="searchKeyword"
            type="text"
            class="qb-search__input"
            placeholder="搜索题目、考点..."
          />
        </div>
      </header>

      <div class="qb-tabs" role="tablist">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          role="tab"
          class="qb-tab"
          :class="{ 'qb-tab--active': activeTabId === tab.id }"
          :aria-selected="activeTabId === tab.id"
          @click="handleTabClick(tab.id)"
        >
          {{ tab.label }}
        </button>
      </div>

      <section class="qb-main">
        <aside class="qb-sidebar">
          <h3 class="qb-sidebar__title">考点大纲 (SYLLABUS)</h3>
          <el-tree
            :data="treeData"
            :props="treeProps"
            node-key="code"
            :default-expanded-keys="defaultExpanded"
            :current-node-key="selectedNodeCode"
            highlight-current
            @node-click="handleTreeNodeClick"
          />
        </aside>

        <section class="qb-content">
          <header class="qb-content__header">
            <h2 class="qb-content__title">{{ activeTopicTitle }}</h2>
            <span class="qb-content__hint"
              >选择难度以生成测试卷 (共 {{ totalQuestionCount }} 题)</span
            >
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
                class="qb-difficulty-card__cta button_primary"
                :disabled="diff.count === 0"
                @click="handleStartPractice(diff)"
              >
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
// 试题库浏览页：从已发布试卷汇总真实题目，按难度和学科筛选后进入练习。
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import NavBar from '@/components/NavBar.vue'
import type { SyllabusNode } from '@/api/questionBank'
import { getSyllabusData, getQuestionSummaryData } from '@/api/questionBank'
import { checkMemberAccess } from '@/api/member'
import { DEFAULT_EXAM_TYPE, EXAM_TYPE_OPTIONS, type ExamType } from '@/constants/examTypes'

const router = useRouter()

interface TreeNode extends SyllabusNode {}
type DifficultyId = 'easy' | 'medium' | 'hard' | 'composite'

interface DifficultyOption {
  id: DifficultyId
  label: string
  englishLabel: string
  description: string
  count: number
}

interface QbTab {
  id: ExamType
  label: string
}

const tabs: QbTab[] = EXAM_TYPE_OPTIONS.map((item) => ({
  id: item.value,
  label: item.label,
}))
const activeTabId = ref<QbTab['id']>(DEFAULT_EXAM_TYPE)
const treeData = ref<TreeNode[]>([])
const treeProps = { children: 'children', label: 'label' }
const defaultExpanded = ref<string[]>(['110000'])
const selectedNodeCode = ref<string>('110000')
const selectedNodeLabel = ref<string>('综合考点')
const totalQuestionCount = ref<number>(0)
const searchKeyword = ref<string>('')

const difficulties = ref<DifficultyOption[]>([
  {
    id: 'easy',
    label: '简单',
    englishLabel: 'Easy',
    count: 0,
    description: '适合巩固基础知识，掌握基本公式的直接应用。',
  },
  {
    id: 'medium',
    label: '中等',
    englishLabel: 'Medium',
    count: 0,
    description: '要求多步推导与综合理解，贴近真实考试标准难度。',
  },
  {
    id: 'hard',
    label: '困难',
    englishLabel: 'Hard',
    count: 0,
    description: '包含复杂场景变换与严谨证明，适合冲刺高分段。',
  },
  {
    id: 'composite',
    label: '复合',
    englishLabel: 'Composite',
    count: 0,
    description: '跨章节综合题型，考察知识点串联能力。',
  },
])

const activeTopicTitle = computed<string>(() => `${selectedNodeLabel.value} · 试题`)
const activeExamType = computed<ExamType>(() => activeTabId.value)

// 首次进入试题库时加载大纲树，并默认查询最外层第一个节点。
onMounted(async () => {
  try {
    const nodes = await getSyllabusData(activeExamType.value)
    treeData.value = nodes[0]?.children || []
    const first = treeData.value[0]
    if (first) {
      selectedNodeCode.value = first.code
      selectedNodeLabel.value = first.label
    }
  } catch {
    treeData.value = []
  }

  await loadQuestionSummary()
})

// 轻量接口只拉题量和难度分布，避免列表页首次加载全量题目。
async function loadQuestionSummary(): Promise<void> {
  try {
    const data = await getQuestionSummaryData(selectedNodeCode.value, activeExamType.value)
    totalQuestionCount.value = data.total
    if (data.difficultyCount) {
      difficulties.value = difficulties.value.map((d) => ({
        ...d,
        count: data.difficultyCount[d.id] || 0,
      }))
    }
  } catch {
    totalQuestionCount.value = 0
  }
}

// 点击大纲节点后刷新统计卡片，后续练习入口沿用当前节点 code。
const handleTreeNodeClick = async (node: TreeNode): Promise<void> => {
  selectedNodeCode.value = node.code
  selectedNodeLabel.value = node.label
  await loadQuestionSummary()
}

// 切换考试类型后重置大纲入口，避免沿用上一考试类型的节点 code。
async function handleTabClick(tabId: QbTab['id']): Promise<void> {
  activeTabId.value = tabId
  try {
    const nodes = await getSyllabusData(activeExamType.value)
    treeData.value = nodes[0]?.children || []
    const first = treeData.value[0]
    selectedNodeCode.value = first?.code || ''
    selectedNodeLabel.value = first?.label || '综合考点'
  } catch {
    treeData.value = []
    selectedNodeCode.value = ''
    selectedNodeLabel.value = '综合考点'
  }
  await loadQuestionSummary()
}

// 难度卡片进入在线练习页，题目数据由 code 和 difficulty 延迟加载。
const handleStartPractice = async (diff: DifficultyOption): Promise<void> => {
  const access = await checkMemberAccess({
    action: 'question-bank',
    examType: activeExamType.value,
    questionCount: diff.count,
  })
  if (!access.allowed) {
    const remainingText = access.remaining === null ? '0' : String(access.remaining)
    ElMessage.warning(`当前试题库额度不足，剩余 ${remainingText} 题，请开通会员后继续`)
    return
  }
  router.push({
    path: '/practice',
    query: { code: selectedNodeCode.value || '', difficulty: diff.id, examType: activeExamType.value },
  })
}
</script>

<style scoped lang="scss">
.question-bank {
  min-height: 100vh;
  background: #f8fafc;
  color: #0f172a;
}
.qb-container {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  padding: 36px var(--container-px-desktop) 72px;
}
.qb-header {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: center;
  margin-bottom: 24px;
}
.qb-header__title {
  margin: 0;
  font-size: 32px;
  letter-spacing: 0;
}
.qb-header__subtitle {
  margin: 8px 0 0;
  color: #64748b;
}
.qb-search__input {
  width: 260px;
  height: 40px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0 12px;
}
.qb-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
}
.qb-tab {
  height: 38px;
  padding: 0 18px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #fff;
  cursor: pointer;
}
.qb-tab--active {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}
.qb-main {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 24px;
}
.qb-sidebar,
.qb-content {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 24px;
}
.qb-sidebar__title {
  margin: 0 0 16px;
  font-size: 14px;
  color: #64748b;
}
.qb-content__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}
.qb-content__title {
  margin: 0;
  font-size: 22px;
}
.qb-content__hint {
  color: #64748b;
  font-size: 14px;
}
.qb-difficulty-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}
.qb-difficulty-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  background: #fff;
}
.qb-difficulty-card__title {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 12px;
  font-size: 18px;
}
.qb-difficulty-card__count {
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
}
.qb-difficulty-card__desc {
  min-height: 48px;
  color: #64748b;
  line-height: 1.6;
}
.qb-difficulty-card__cta {
  height: 40px;
  padding: 0 18px;
}
</style>
