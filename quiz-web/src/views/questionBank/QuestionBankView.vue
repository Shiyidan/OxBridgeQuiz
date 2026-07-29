<template>
  <div class="question-bank">
    <NavBar />
    <main class="qb-container">
      <header class="qb-header">
        <div class="qb-header__lead">
          <span class="page-eyebrow">Question Bank</span>
          <h1 class="qb-header__title">试题库</h1>
          <p class="qb-header__subtitle">包含专项试题练习与全真模拟考试系统。</p>
        </div>
      </header>

      <section class="qb-main">
        <aside class="qb-sidebar">
          <h3 class="qb-sidebar__title">考点大纲 (SYLLABUS)</h3>
          <el-tree
            ref="syllabusTreeRef"
            :key="activeExamType"
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

          <div v-if="activePractice" class="qb-active-practice" role="status">
            <div>
              <strong>你有一份 {{ activePractice.examType }} 练习尚未交卷</strong>
              <span
                >已答 {{ activePractice.answeredCount }}/{{
                  activePractice.totalQuestions
                }}
                题</span
              >
            </div>
            <button type="button" class="button_primary" @click="handleContinuePractice">
              继续练习
            </button>
          </div>

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
                :disabled="diff.count === 0 || Boolean(activePractice)"
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
// 试题库首页：按考试、考纲和难度选择题目范围并开始专项练习。
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { TreeInstance } from 'element-plus'
import NavBar from '@/components/NavBar.vue'
import { useAuthStore, type ActiveExamType } from '@/stores/auth'
import type { SyllabusNode } from '@/api/questionBank'
import { getSyllabusData, getQuestionSummaryData } from '@/api/questionBank'
import { getActiveQuestionBankPractice, type ActiveQuestionBankPractice } from '@/api/exam'
import { checkMemberAccess } from '@/api/member'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

type TreeNode = SyllabusNode
type DifficultyId = 'easy' | 'medium' | 'hard' | 'composite'

interface DifficultyOption {
  id: DifficultyId
  label: string
  englishLabel: string
  description: string
  count: number
}

const treeData = ref<TreeNode[]>([])
const syllabusTreeRef = ref<TreeInstance>()
const treeProps = { children: 'children', label: 'label' }
const defaultExpanded = ref<string[]>([])
const selectedNodeCode = ref<string>('')
const selectedNodeLabel = ref<string>('综合考点')
const totalQuestionCount = ref<number>(0)
const targetDifficulty = ref<DifficultyId | null>(null)
const activePractice = ref<ActiveQuestionBankPractice | null>(null)
let examContentInitialized = false
let examLoadSequence = 0
let summaryLoadSequence = 0
let practiceLoadSequence = 0

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

// 题库统一读取顶部导航的全局考试类型，不再维护页面级考试选择。
const activeExamType = computed<ActiveExamType>(() => auth.activeExamType)

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

// 考纲包含考试分组层时继续展开首个学科，让 ESAT 与 TMUA 默认显示相同知识点层级。
function resolveDefaultExpandedCodes(nodes: TreeNode[], examType: ActiveExamType): string[] {
  const first = nodes[0]
  if (!first) return []

  const expandedCodes = [first.code]
  const firstSubject = first.children?.[0]
  const isExamGroup = first.label.toUpperCase().includes(examType)
  if (isExamGroup && firstSubject) expandedCodes.push(firstSubject.code)
  return expandedCodes
}

// 异步考纲渲染完成后显式展开目标层级，避免 Element Plus 忽略后更新的默认展开项。
async function expandDefaultSyllabusNodes(): Promise<void> {
  await nextTick()
  for (const code of defaultExpanded.value) {
    syllabusTreeRef.value?.getNode(code)?.expand()
  }
}

// 进行中练习由服务端唯一活动键决定，切换考试类型后重新读取对应会话。
async function loadActivePractice(): Promise<void> {
  const requestSequence = ++practiceLoadSequence
  const requestedExamType = activeExamType.value
  activePractice.value = null
  try {
    const practice = await getActiveQuestionBankPractice(requestedExamType)
    if (requestSequence !== practiceLoadSequence || requestedExamType !== activeExamType.value) {
      return
    }
    activePractice.value = practice
  } catch {
    if (requestSequence === practiceLoadSequence) activePractice.value = null
  }
}

// 轻量接口只拉题量和难度分布，避免列表页首次加载全量题目。
async function loadQuestionSummary(): Promise<void> {
  const requestSequence = ++summaryLoadSequence
  const requestedExamType = activeExamType.value
  const requestedNodeCode = selectedNodeCode.value
  resetQuestionSummary()
  if (!requestedNodeCode) return
  try {
    const data = await getQuestionSummaryData(requestedNodeCode, requestedExamType)
    if (
      requestSequence !== summaryLoadSequence ||
      requestedExamType !== activeExamType.value ||
      requestedNodeCode !== selectedNodeCode.value
    ) {
      return
    }
    totalQuestionCount.value = data.total
    if (data.difficultyCount) {
      difficulties.value = difficulties.value.map((d) => ({
        ...d,
        count: data.difficultyCount[d.id] || 0,
      }))
    }
  } catch {
    if (requestSequence === summaryLoadSequence) resetQuestionSummary()
  }
}

// 汇总筛选变化或请求失败时统一清空总数与各难度数量，使练习按钮同步失效。
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

// 全局考试类型变化后重置旧考试数据，并只接受本次切换对应的异步响应。
async function loadExamContent(useRouteContext: boolean): Promise<void> {
  const requestSequence = ++examLoadSequence
  const requestedExamType = activeExamType.value
  summaryLoadSequence += 1
  practiceLoadSequence += 1
  treeData.value = []
  defaultExpanded.value = []
  selectedNodeCode.value = ''
  selectedNodeLabel.value = '综合考点'
  activePractice.value = null
  resetQuestionSummary()
  if (!useRouteContext) targetDifficulty.value = null

  try {
    const nodes = await getSyllabusData(requestedExamType)
    if (requestSequence !== examLoadSequence || requestedExamType !== activeExamType.value) return

    const nextTreeData = nodes[0]?.children || []
    treeData.value = nextTreeData
    const requestedCode = useRouteContext ? String(route.query.code || '').trim() : ''
    const requestedNode = requestedCode ? findTreeNode(nextTreeData, requestedCode) : null
    const firstNode = nextTreeData[0]
    if (requestedNode) {
      defaultExpanded.value = requestedNode.parents
      selectedNodeCode.value = requestedNode.node.code
      selectedNodeLabel.value = requestedNode.node.label
    } else if (firstNode) {
      defaultExpanded.value = resolveDefaultExpandedCodes(nextTreeData, requestedExamType)
      selectedNodeCode.value = firstNode.code
      selectedNodeLabel.value = firstNode.label
    }

    if (useRouteContext) {
      const requestedDifficulty = String(route.query.difficulty || '') as DifficultyId
      targetDifficulty.value = difficulties.value.some((item) => item.id === requestedDifficulty)
        ? requestedDifficulty
        : null
    }

    await expandDefaultSyllabusNodes()
    if (requestSequence !== examLoadSequence || requestedExamType !== activeExamType.value) return
    await Promise.all([loadQuestionSummary(), loadActivePractice()])
  } catch {
    if (requestSequence !== examLoadSequence || requestedExamType !== activeExamType.value) return
    treeData.value = []
    defaultExpanded.value = []
    selectedNodeCode.value = ''
    selectedNodeLabel.value = '综合考点'
    resetQuestionSummary()
    await loadActivePractice()
  }
}

// 导航栏切换考试类型时重新查询该考试的大纲、题量统计与进行中练习。
watch(activeExamType, () => {
  if (examContentInitialized) void loadExamContent(false)
})

// 首次进入先完成个人考试偏好初始化，再按最终全局类型加载题库。
onMounted(async () => {
  try {
    await auth.ensureMemberContext()
  } catch {
    // 偏好加载失败时继续使用全局默认 TMUA，公共请求层负责错误提示。
  }
  examContentInitialized = true
  await loadExamContent(true)
})

// 续答只携带 ExamRecord ID，题目集合和保存进度全部由服务端会话恢复。
function handleContinuePractice(): void {
  if (!activePractice.value) return
  void router.push({
    path: '/practice',
    query: { examId: activePractice.value.examRecordId },
  })
}

// 难度卡片进入在线练习页，题目数据由 code 和 difficulty 延迟加载。
const handleStartPractice = async (diff: DifficultyOption): Promise<void> => {
  if (activePractice.value) {
    ElMessage.info('请先继续并完成当前练习')
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
  min-width: var(--fluid-page-min-width);
  background: var(--color-bg);
  color: var(--color-ink);
}

.qb-container {
  width: var(--fluid-shell-width);
  margin: 0 auto;
  padding: 40px 0 96px;
}

.qb-header {
  margin-bottom: 24px;
}

.page-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.page-eyebrow::before {
  width: 24px;
  height: 1px;
  background: var(--color-ink);
  content: '';
}

.qb-header__title {
  margin: 0;
  color: var(--color-ink);
  font-size: var(--text-4xl);
  font-weight: var(--weight-bold);
  letter-spacing: 0;
}

.qb-header__subtitle {
  max-width: 560px;
  margin: 10px 0 0;
  color: var(--color-ink-soft);
  line-height: var(--leading-relaxed);
}

.qb-main {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.qb-active-practice,
.qb-active-practice > div {
  display: flex;
  align-items: center;
}

.qb-active-practice {
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
  padding: 16px 18px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);
}

.qb-active-practice > div {
  align-items: flex-start;
  flex-direction: column;
  gap: 4px;
}

.qb-active-practice span {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
}

.qb-sidebar,
.qb-content {
  padding: 24px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.qb-sidebar {
  position: sticky;
  top: calc(var(--nav-height) + 24px);
}

.qb-sidebar__title {
  margin: 0 0 16px;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.qb-sidebar :deep(.el-tree) {
  background: transparent;
  color: var(--color-ink-soft);
}

.qb-sidebar :deep(.el-tree-node__content) {
  min-height: 36px;
  border-radius: var(--radius-sm);
}

.qb-sidebar :deep(.el-tree-node__content:hover) {
  background: var(--color-hover);
}

.qb-sidebar :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background: var(--color-surface-alt);
  color: var(--color-ink);
  font-weight: var(--weight-semi);
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
  color: var(--color-ink);
  font-size: var(--text-xl);
  font-weight: var(--weight-bold);
}

.qb-content__hint {
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
}

.qb-difficulty-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.qb-difficulty-card {
  min-height: 190px;
  padding: 20px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  transition:
    border-color var(--duration-base) ease,
    transform var(--duration-fast) ease;
}

.qb-difficulty-card:hover {
  border-color: var(--color-ink);
  transform: translateY(-1px);
}

.qb-difficulty-card--target {
  border-color: var(--color-ink);
  box-shadow: 0 0 0 2px var(--color-hover);
}

.qb-difficulty-card__title {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 12px;
  color: var(--color-ink);
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
}

.qb-difficulty-card__count {
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
}

.qb-difficulty-card__desc {
  min-height: 48px;
  margin: 0 0 24px;
  color: var(--color-ink-soft);
  line-height: var(--leading-relaxed);
}

.qb-difficulty-card__cta {
  min-width: 112px;
  height: var(--height-button);
  padding: 0 18px;
  border-radius: var(--radius-md);
}

@media (max-width: 900px) {
  .qb-main {
    grid-template-columns: 1fr;
  }

  .qb-sidebar {
    position: static;
  }

  .qb-difficulty-grid {
    grid-template-columns: 1fr;
  }
}
</style>
