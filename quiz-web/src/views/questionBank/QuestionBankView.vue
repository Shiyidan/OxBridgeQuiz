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

      <section v-if="!isActiveExamAvailable" class="qb-unavailable" aria-live="polite">
        <span class="qb-unavailable__badge">STEP · COMING SOON</span>
        <h2>STEP 试题库正在推进中</h2>
        <p>STEP 考纲、专项试题与在线练习暂未开放。相关内容准备完成后会在这里统一上线。</p>
        <button type="button" class="button_primary" @click="handleTabClick(DEFAULT_EXAM_TYPE)">
          查看 TMUA 试题库
        </button>
      </section>

      <section v-else class="qb-main">
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
              :class="{ 'qb-difficulty-card--target': targetDifficulty === diff.id }"
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
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import NavBar from '@/components/NavBar.vue'
import type { SyllabusNode } from '@/api/questionBank'
import { getSyllabusData, getQuestionSummaryData } from '@/api/questionBank'
import { checkMemberAccess } from '@/api/member'
import {
  DEFAULT_EXAM_TYPE,
  EXAM_TYPE_OPTIONS,
  getExamUnavailableMessage,
  isExamTypeAvailable,
  type ExamType,
} from '@/constants/examTypes'

const router = useRouter()
const route = useRoute()

type TreeNode = SyllabusNode
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
const targetDifficulty = ref<DifficultyId | null>(null)

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

// 当前考点标题同步反映树选择或学习路径传入的考纲 code。
const activeTopicTitle = computed<string>(() => `${selectedNodeLabel.value} · 试题`)

// 题库接口统一使用当前 tab 的标准考试类型。
const activeExamType = computed<ExamType>(() => activeTabId.value)

// STEP 等未开放类型使用专用空状态，不向题库接口发起无意义请求。
const isActiveExamAvailable = computed(() => isExamTypeAvailable(activeExamType.value))

// 深层考纲节点查找同时返回祖先 code，便于学习路径入口展开对应树路径。
function findTreeNode(
  nodes: TreeNode[],
  code: string,
  parents: string[] = [],
): { node: TreeNode; parents: string[] } | null {
  for (const node of nodes) {
    if (node.code === code) return { node, parents }
    const found = findTreeNode(node.children || [], code, [...parents, node.code])
    if (found) return found
  }
  return null
}

// 首次进入试题库时加载大纲树，并默认查询最外层第一个节点。
onMounted(async () => {
  const requestedExamType = String(route.query.examType || '').toUpperCase()
  if (EXAM_TYPE_OPTIONS.some((item) => item.value === requestedExamType)) {
    activeTabId.value = requestedExamType as ExamType
  }
  if (!isActiveExamAvailable.value) {
    treeData.value = []
    selectedNodeCode.value = ''
    selectedNodeLabel.value = 'STEP'
    resetQuestionSummary()
    return
  }

  try {
    const nodes = await getSyllabusData(activeExamType.value)
    treeData.value = nodes[0]?.children || []
    const requestedCode = String(route.query.code || '').trim()
    const requestedNode = requestedCode ? findTreeNode(treeData.value, requestedCode) : null
    if (requestedCode) {
      selectedNodeCode.value = requestedCode
      selectedNodeLabel.value =
        requestedNode?.node.label || String(route.query.label || requestedCode)
      if (requestedNode) defaultExpanded.value = requestedNode.parents
    } else {
      const first = treeData.value[0]
      if (first) {
        selectedNodeCode.value = first.code
        selectedNodeLabel.value = first.label
      }
    }
    const requestedDifficulty = String(route.query.difficulty || '') as DifficultyId
    targetDifficulty.value = difficulties.value.some((item) => item.id === requestedDifficulty)
      ? requestedDifficulty
      : null
  } catch {
    treeData.value = []
  }

  await loadQuestionSummary()
})

// 轻量接口只拉题量和难度分布，避免列表页首次加载全量题目。
async function loadQuestionSummary(): Promise<void> {
  if (!isActiveExamAvailable.value) {
    resetQuestionSummary()
    return
  }
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

// 考试类型切换时统一清空旧题量，避免暂未开放页面残留上一类型统计。
function resetQuestionSummary(): void {
  totalQuestionCount.value = 0
  difficulties.value = difficulties.value.map((item) => ({ ...item, count: 0 }))
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
  targetDifficulty.value = null
  if (!isActiveExamAvailable.value) {
    treeData.value = []
    selectedNodeCode.value = ''
    selectedNodeLabel.value = tabId
    resetQuestionSummary()
    ElMessage.info(getExamUnavailableMessage(tabId))
    return
  }
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
  if (!isActiveExamAvailable.value) {
    ElMessage.info(getExamUnavailableMessage(activeExamType.value))
    return
  }
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
    query: {
      code: selectedNodeCode.value || '',
      difficulty: diff.id,
      examType: activeExamType.value,
    },
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
.qb-unavailable {
  display: grid;
  justify-items: center;
  min-height: 420px;
  padding: 72px 32px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background:
    radial-gradient(circle at 20% 10%, rgba(99, 102, 241, 0.08), transparent 34%),
    linear-gradient(135deg, #ffffff, #f8fafc);
  text-align: center;
}
.qb-unavailable__badge {
  align-self: end;
  padding: 7px 12px;
  border: 1px solid #dbe3ef;
  border-radius: 999px;
  background: #ffffff;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.qb-unavailable h2 {
  margin: 22px 0 0;
  font-size: 28px;
}
.qb-unavailable p {
  max-width: 560px;
  margin: 12px 0 28px;
  color: #64748b;
  line-height: 1.8;
}
.qb-unavailable .button_primary {
  align-self: start;
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

.qb-difficulty-card--target {
  border-color: var(--color-report-blue);
  box-shadow: 0 0 0 2px var(--color-info-bg);
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
