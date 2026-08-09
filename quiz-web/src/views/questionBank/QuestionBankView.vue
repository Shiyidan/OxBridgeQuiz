<template>
  <div class="question-bank">
    <main class="qb-container">
      <header class="qb-header">
        <div class="qb-header__lead">
          <span class="page-eyebrow">Question Bank</span>
          <h1 class="qb-header__title">试题库</h1>
          <p class="qb-header__subtitle">包含专项试题练习与全真模拟考试系统。</p>
        </div>
        <div class="qb-header__actions">
          <span v-if="questionBankQuota && !questionBankQuota.unlimited" class="qb-usage-count">
            已练习（{{ questionBankQuota.used }}/{{ questionBankQuota.limit ?? 25 }}）
          </span>
          <router-link to="/practice-records" class="qb-records-entry">
            <span>练习记录</span>
          </router-link>
          <button type="button" class="qb-notebook-entry" @click="handleOpenPracticeNotebook">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M5 4.75A1.75 1.75 0 0 1 6.75 3H19v16H6.75A1.75 1.75 0 0 0 5 20.75v-16Z"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linejoin="round"
              />
              <path d="M5 18.75h14M8.5 7h7" stroke="currentColor" stroke-width="1.6" />
            </svg>
            <span>练习本</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </header>

      <section class="qb-main">
        <aside class="qb-sidebar">
          <h3 class="qb-sidebar__title">考点大纲 (SYLLABUS)</h3>
          <div class="qb-sidebar__tree-scroll">
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
          </div>
        </aside>

        <section class="qb-content">
          <header class="qb-content__header">
            <h2 class="qb-content__title">{{ activeTopicTitle }}</h2>
            <span class="qb-content__hint">
              当前范围共 {{ totalQuestionCount }} 题，每次随机练习最多
              {{ DIRECT_PRACTICE_QUESTION_COUNT }} 题
            </span>
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
              <div class="qb-difficulty-card__visual">
                <span class="qb-difficulty-card__english">{{ diff.englishLabel }}</span>
                <h3 class="qb-difficulty-card__title">{{ diff.label }}难度</h3>
                <span class="qb-difficulty-card__count">题库共 {{ diff.count }} 题</span>
                <button
                  type="button"
                  class="qb-difficulty-card__cta"
                  :disabled="
                    diff.count === 0 ||
                    Boolean(activePractice) ||
                    startingDifficultyId === diff.id
                  "
                  @click="handleStartPractice(diff)"
                >
                  <span v-if="startingDifficultyId === diff.id">正在生成</span>
                  <span v-else-if="diff.count === 0">暂无题目</span>
                  <span v-else>立即练习</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
              <div class="qb-difficulty-card__body">
                <span class="qb-difficulty-card__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="m7.5 16.5 9-9M9 7.5h7.5V15" stroke="currentColor" stroke-width="1.8" />
                    <path
                      d="M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"
                      stroke="currentColor"
                      stroke-width="1.5"
                    />
                  </svg>
                </span>
                <div>
                  <strong>{{ diff.label }}练习</strong>
                  <p class="qb-difficulty-card__desc">{{ diff.description }}</p>
                </div>
              </div>
            </article>
          </div>
        </section>
      </section>
    </main>

    <AppConfirmDialog
      v-model="selectionDialogVisible"
      title="确认开始练习"
      :message="selectionDialogMessage"
      confirm-text="开始练习"
      cancel-text="取消"
      tone="default"
      @confirm="handleConfirmSelectedPractice"
      @cancel="handleCancelSelectedPractice"
    />

    <AppConfirmDialog
      v-model="quotaDialogVisible"
      title="免费练习题量不足"
      :message="quotaDialogMessage"
      confirm-text="开始练习"
      cancel-text="取消"
      @confirm="handleConfirmReducedPractice"
      @cancel="handleCancelReducedPractice"
    />
  </div>
</template>

<script setup lang="ts">
// 试题库首页：按考试、考纲和难度选择题目范围并开始专项练习。
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { TreeInstance } from 'element-plus'
import AppConfirmDialog from '@/components/AppConfirmDialog.vue'
import { useAuthStore, type ActiveExamType } from '@/stores/auth'
import type { QuestionDifficulty, SyllabusNode } from '@/api/questionBank'
import { getSyllabusData, getQuestionSummaryData } from '@/api/questionBank'
import { getActiveQuestionBankPractice, type ActiveQuestionBankPractice } from '@/api/exam'
import { checkMemberAccess } from '@/api/member'
import { createLoginRequiredRouteLocation } from '@/utils/authRedirect'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

type TreeNode = SyllabusNode
type DifficultyId = QuestionDifficulty

interface DifficultyOption {
  id: DifficultyId
  label: string
  englishLabel: string
  description: string
  count: number
}

interface PendingDirectPractice {
  code: string
  label: string
  difficulty: DifficultyId
  questionCount: number
}

const DIRECT_PRACTICE_QUESTION_COUNT = 5

// 游客可浏览考纲与题量，开始专项练习时再进入登录并回到试题库。
function requireLoginForPracticeAction(): boolean {
  if (auth.isLoggedIn) return false
  void router.push(createLoginRequiredRouteLocation('/question-bank'))
  return true
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
const startingDifficultyId = ref<DifficultyId | null>(null)
const selectionDialogVisible = ref(false)
const selectionDialogMessage = ref('')
const quotaDialogVisible = ref(false)
const quotaDialogMessage = ref('')
const pendingDirectPractice = ref<PendingDirectPractice | null>(null)
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
])

// 当前考点标题同步反映树选择或学习路径传入的考纲 code。
const activeTopicTitle = computed<string>(() => `${selectedNodeLabel.value} · 试题`)

// 题库统一读取顶部导航的全局考试类型，不再维护页面级考试选择。
const activeExamType = computed<ActiveExamType>(() => auth.activeExamType)

// 免费额度展示沿用服务端会员上下文，题库专项与练习本的已交卷题量共用同一统计结果。
const questionBankQuota = computed(
  () => auth.memberContext?.quotas?.[activeExamType.value]?.questionBank || null,
)

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
  if (!auth.isLoggedIn) return
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

// 练习本作为同一学习工作区的下一页，由外层布局提供向左滑动切换。
function handleOpenPracticeNotebook(): void {
  void router.push('/practice-notebook')
}

// 续答只携带 ExamRecord ID，题目集合和保存进度全部由服务端会话恢复。
function handleContinuePractice(): void {
  if (!activePractice.value) return
  void router.push({
    path: '/practice',
    query: { examId: activePractice.value.examRecordId },
  })
}

// 答题页使用点击卡片时冻结的范围，确认弹窗期间切换树节点不会改变本次练习归属。
function navigateToPractice(practice: PendingDirectPractice): void {
  void router.push({
    path: '/practice',
    query: {
      code: practice.code,
      difficulty: practice.difficulty,
      examType: activeExamType.value,
    },
  })
}

// 难度卡片先确认知识点和默认五题计划，匹配不足时展示实际可生成题量。
function handleStartPractice(diff: DifficultyOption): void {
  if (requireLoginForPracticeAction()) return
  if (activePractice.value) {
    ElMessage.info('请先继续并完成当前练习')
    return
  }

  const plannedQuestionCount = Math.min(diff.count, DIRECT_PRACTICE_QUESTION_COUNT)
  pendingDirectPractice.value = {
    code: selectedNodeCode.value,
    label: selectedNodeLabel.value,
    difficulty: diff.id,
    questionCount: plannedQuestionCount,
  }
  const practiceCountMessage = diff.count > plannedQuestionCount
    ? `题库共${diff.count}题，本次随机练习${plannedQuestionCount}题`
    : `本次练习全部${plannedQuestionCount}题`
  selectionDialogMessage.value = `您已选择${pendingDirectPractice.value.label}，${practiceCountMessage}，开始练习？`
  selectionDialogVisible.value = true
}

// 用户确认所选范围后再预检额度，部分不足时进入第二层缩量确认。
async function handleConfirmSelectedPractice(): Promise<void> {
  if (requireLoginForPracticeAction()) return
  const pending = pendingDirectPractice.value
  if (!pending) return
  startingDifficultyId.value = pending.difficulty
  try {
    const access = await checkMemberAccess({
      action: 'question-bank',
      examType: activeExamType.value,
      questionCount: pending.questionCount,
    })
    if (access.allowed) {
      pendingDirectPractice.value = null
      navigateToPractice(pending)
      return
    }

    const remaining = Math.max(0, access.remaining ?? 0)
    if (remaining === 0) {
      pendingDirectPractice.value = null
      ElMessage.warning('当前免费练习题量已用完，请开通会员后继续')
      return
    }

    pendingDirectPractice.value = { ...pending, questionCount: remaining }
    quotaDialogMessage.value = `当前免费练习题量不足，还可免费练习${remaining}道，是否开始`
    quotaDialogVisible.value = true
  } catch {
    // 公共请求层已统一展示网络或服务端错误，此处只阻止按钮事件产生未处理异常。
  } finally {
    startingDifficultyId.value = null
  }
}

// 取消首次确认时清理冻结的知识点和难度计划。
function handleCancelSelectedPractice(): void {
  pendingDirectPractice.value = null
}

// 确认后按服务端返回的剩余额度缩量进入练习，创建时仍由后端事务再次校验。
function handleConfirmReducedPractice(): void {
  const pending = pendingDirectPractice.value
  pendingDirectPractice.value = null
  if (!pending) return
  navigateToPractice(pending)
}

// 取消缩量练习时只清理本次待开始参数，不改变已有选择。
function handleCancelReducedPractice(): void {
  pendingDirectPractice.value = null
}
</script>

<style scoped lang="scss">
.question-bank {
  min-height: calc(100vh - var(--nav-height));
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
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.qb-header__actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 16px;
}

.qb-usage-count {
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
  white-space: nowrap;
}

.qb-records-entry {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 2px 6px;
  border-bottom: 1px solid currentColor;
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  line-height: 1;
  white-space: nowrap;
  transition:
    color var(--duration-base) ease,
    transform var(--duration-fast) ease;
}

.qb-records-entry:hover,
.qb-records-entry:focus-visible {
  color: var(--color-ink);
  transform: translateX(2px);
}

.qb-notebook-entry {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 10px;
  min-width: 148px;
  height: 46px;
  padding: 0 16px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-ink);
  font: inherit;
  font-weight: var(--weight-semi);
  cursor: pointer;
  transition:
    border-color var(--duration-base) ease,
    background var(--duration-base) ease,
    transform var(--duration-fast) ease;
}

.qb-notebook-entry:hover,
.qb-notebook-entry:focus-visible {
  border-color: var(--color-ink);
  background: var(--color-hover);
  transform: translateX(2px);
}

.qb-notebook-entry svg {
  width: 20px;
  height: 20px;
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

.qb-content {
  position: sticky;
  top: calc(var(--nav-height) + 24px);
  z-index: 1;
}

.qb-sidebar__title {
  margin: 0 0 16px;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.qb-sidebar__tree-scroll {
  width: 100%;
  padding-bottom: 8px;
  overflow-x: auto;
  overflow-y: visible;
  scrollbar-width: thin;
  scrollbar-color: var(--color-ink-muted) var(--color-line-soft);
}

.qb-sidebar__tree-scroll::-webkit-scrollbar {
  height: 8px;
}

.qb-sidebar__tree-scroll::-webkit-scrollbar-track {
  border-radius: var(--radius-pill);
  background: var(--color-line-soft);
}

.qb-sidebar__tree-scroll::-webkit-scrollbar-thumb {
  border-radius: var(--radius-pill);
  background: var(--color-ink-muted);
}

.qb-sidebar__tree-scroll :deep(.el-tree) {
  display: inline-block;
  width: max-content;
  min-width: 100%;
  background: transparent;
  color: var(--color-ink-soft);
}

.qb-sidebar__tree-scroll :deep(.el-tree-node),
.qb-sidebar__tree-scroll :deep(.el-tree-node__content) {
  width: max-content;
  min-width: 100%;
}

.qb-sidebar__tree-scroll :deep(.el-tree-node__content) {
  min-height: 36px;
  padding-right: 12px;
  border-radius: var(--radius-sm);
}

.qb-sidebar__tree-scroll :deep(.el-tree-node__content:hover) {
  background: var(--color-hover);
}

.qb-sidebar__tree-scroll :deep(.el-tree-node.is-current > .el-tree-node__content) {
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.qb-difficulty-card {
  --difficulty-accent: #3483f7;
  --difficulty-accent-dark: #2368d1;
  --difficulty-gradient-start: #86b8ff;
  --difficulty-gradient-end: #e9f3ff;
  --difficulty-glow: rgb(255 255 255 / 68%);

  position: relative;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: 16px;
  background: var(--color-surface);
  box-shadow: 0 10px 26px rgb(15 23 42 / 7%);
  transition:
    border-color var(--duration-base) ease,
    box-shadow var(--duration-base) ease,
    transform var(--duration-base) ease;
}

.qb-difficulty-card[data-theme='medium'] {
  --difficulty-accent: #7068eb;
  --difficulty-accent-dark: #5148cb;
  --difficulty-gradient-start: #b2abff;
  --difficulty-gradient-end: #eeedff;
  --difficulty-glow: rgb(255 255 255 / 62%);
}

.qb-difficulty-card[data-theme='hard'] {
  --difficulty-accent: #e25f62;
  --difficulty-accent-dark: #c34449;
  --difficulty-gradient-start: #f1a09e;
  --difficulty-gradient-end: #fff0eb;
  --difficulty-glow: rgb(255 255 255 / 60%);
}

.qb-difficulty-card:hover {
  border-color: color-mix(in srgb, var(--difficulty-accent) 48%, var(--color-line));
  box-shadow: 0 16px 34px rgb(15 23 42 / 12%);
  transform: translateY(-3px);
}

.qb-difficulty-card--target {
  border-color: var(--difficulty-accent);
  box-shadow:
    0 0 0 2px color-mix(in srgb, var(--difficulty-accent) 24%, transparent),
    0 14px 32px rgb(15 23 42 / 11%);
}

.qb-difficulty-card__visual {
  position: relative;
  min-height: 178px;
  padding: 24px 22px;
  overflow: hidden;
  background:
    radial-gradient(circle at 84% 25%, var(--difficulty-glow) 0 12%, transparent 36%),
    linear-gradient(118deg, var(--difficulty-gradient-start), var(--difficulty-gradient-end));
  isolation: isolate;
}

.qb-difficulty-card__visual::before,
.qb-difficulty-card__visual::after {
  position: absolute;
  z-index: -1;
  border: 1px solid rgb(255 255 255 / 46%);
  border-radius: 28px;
  background: rgb(255 255 255 / 14%);
  content: '';
  transform: rotate(24deg);
}

.qb-difficulty-card__visual::before {
  width: 128px;
  height: 128px;
  top: -56px;
  right: -36px;
}

.qb-difficulty-card__visual::after {
  width: 80px;
  height: 80px;
  right: 34px;
  bottom: -52px;
}

.qb-difficulty-card__english {
  display: block;
  margin-bottom: 7px;
  color: color-mix(in srgb, var(--difficulty-accent-dark) 76%, var(--color-ink));
  font-size: 11px;
  font-weight: var(--weight-bold);
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.qb-difficulty-card__title {
  margin: 0;
  color: #fff;
  font-size: clamp(25px, 2.2vw, 34px);
  font-weight: var(--weight-bold);
  letter-spacing: 0.02em;
  line-height: 1.2;
  text-shadow: 0 2px 5px rgb(41 68 120 / 28%);
}

.qb-difficulty-card__count {
  display: inline-flex;
  margin-top: 14px;
  padding: 5px 9px;
  border: 1px solid rgb(255 255 255 / 55%);
  border-radius: 6px;
  background: rgb(255 255 255 / 56%);
  color: var(--difficulty-accent-dark);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
  line-height: 1;
  backdrop-filter: blur(5px);
}

.qb-difficulty-card__cta {
  position: absolute;
  right: 18px;
  bottom: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-width: 126px;
  height: 43px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  background: var(--difficulty-accent);
  box-shadow: 0 8px 18px color-mix(in srgb, var(--difficulty-accent) 32%, transparent);
  color: #fff;
  font: inherit;
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  cursor: pointer;
  transition:
    background var(--duration-base) ease,
    box-shadow var(--duration-base) ease,
    transform var(--duration-fast) ease;
}

.qb-difficulty-card__cta:not(:disabled):hover,
.qb-difficulty-card__cta:not(:disabled):focus-visible {
  background: var(--difficulty-accent-dark);
  box-shadow: 0 10px 22px color-mix(in srgb, var(--difficulty-accent) 42%, transparent);
  transform: translateY(-1px);
}

.qb-difficulty-card__cta:disabled {
  box-shadow: none;
  cursor: not-allowed;
  opacity: 0.54;
}

.qb-difficulty-card__body {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 12px;
  min-height: 128px;
  padding: 22px;
  background: var(--color-surface);
}

.qb-difficulty-card__icon {
  display: inline-grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 7px;
  background: var(--difficulty-accent);
  color: #fff;
}

.qb-difficulty-card__icon svg {
  width: 18px;
  height: 18px;
}

.qb-difficulty-card__body strong {
  display: block;
  margin: 3px 0 7px;
  color: var(--color-ink);
  font-size: var(--text-base);
}

.qb-difficulty-card__desc {
  margin: 0;
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

@media (max-width: 1200px) {
  .qb-difficulty-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .qb-header {
    align-items: flex-start;
  }

  .qb-main {
    grid-template-columns: 1fr;
  }

  .qb-content {
    position: static;
  }

  .qb-difficulty-grid {
    grid-template-columns: 1fr;
  }
}
</style>
