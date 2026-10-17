<!-- 试题库首页：按考纲学习知识点、选择难度并校验当前考试的练习权益。 -->
<template>
  <div class="question-bank">
    <main class="qb-container">
      <section class="qb-top-shell" aria-labelledby="question-bank-title">
        <div class="qb-overview">
          <div class="qb-overview__identity">
            <span class="qb-overview__mark" aria-hidden="true"><Reading /></span>
            <div class="qb-overview__copy">
              <span class="qb-overview__eyebrow">Question Bank</span>
              <div class="qb-overview__title-row">
                <h1 id="question-bank-title">试题库</h1>
                <span
                  class="qb-overview__access"
                  :class="{
                    'qb-overview__access--unlocked': questionBankQuota?.unlimited,
                  }"
                >
                  <component
                    :is="questionBankQuota?.unlimited ? CircleCheck : Lock"
                    aria-hidden="true"
                  />
                  {{ questionBankQuota?.unlimited ? '会员练习已解锁' : '会员练习需开通' }}
                </span>
              </div>
              <p>沿考纲学习核心知识，通过例题、自测与专项练习逐步检验掌握情况。</p>
            </div>
          </div>

          <div class="qb-overview__actions">
            <nav class="qb-mode-cards" aria-label="试题库功能">
              <button type="button" class="qb-mode-card qb-mode-card--active" aria-current="page">
                <span class="qb-mode-card__icon" aria-hidden="true"><Reading /></span>
                <span class="qb-mode-card__copy">
                  <strong>学习平台</strong>
                  <small>课程 · 例题 · 自测</small>
                </span>
                <em>当前</em>
              </button>
              <button type="button" class="qb-mode-card" @click="handleOpenPracticeNotebook">
                <span class="qb-mode-card__icon" aria-hidden="true"><Notebook /></span>
                <span class="qb-mode-card__copy">
                  <strong>我的练习本</strong>
                  <small>{{ notebookSummaryText }}</small>
                </span>
                <span v-if="auth.isLoggedIn" class="qb-mode-card__count">{{
                  notebooks.length
                }}</span>
                <ArrowRight v-else class="qb-mode-card__arrow" aria-hidden="true" />
              </button>
            </nav>
            <button type="button" class="qb-record-entry" @click="router.push('/practice-records')">
              <span><Clock aria-hidden="true" />查看练习记录</span>
              <span>复盘正确率与历史练习 <ArrowRight aria-hidden="true" /></span>
            </button>
          </div>
        </div>
      </section>

      <section class="qb-main" :class="{ 'qb-main--collapsed': syllabusCollapsed }">
        <aside class="qb-sidebar">
          <header class="qb-sidebar__header">
            <h3 v-if="!syllabusCollapsed" class="qb-sidebar__title">考点大纲 (SYLLABUS)</h3>
            <button
              type="button"
              class="qb-sidebar__toggle"
              :aria-label="syllabusCollapsed ? '展开考点大纲' : '收起考点大纲'"
              :title="syllabusCollapsed ? '展开考点大纲' : '收起考点大纲'"
              @click="toggleSyllabus"
            >
              <component :is="syllabusCollapsed ? ArrowRight : ArrowLeft" />
            </button>
          </header>
          <div v-show="!syllabusCollapsed" class="qb-sidebar__tree-scroll">
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
            >
              <template #default="{ data }">
                <SyllabusTreeNode :node="data" />
              </template>
            </el-tree>
          </div>
          <div v-show="syllabusCollapsed" class="qb-sidebar__collapsed-label" aria-hidden="true">
            <Notebook />
            <span>考纲</span>
          </div>
        </aside>

        <div class="qb-study-layout">
          <section class="qb-content" :class="{ 'qb-content--learning': activeKnowledgeLesson }">
            <header class="qb-content__header">
              <div>
                <nav v-if="selectedBreadcrumb.length" class="qb-content__breadcrumb" aria-label="考纲路径">
                  <template v-for="item in selectedBreadcrumb" :key="item.code">
                    <button type="button" :title="item.label" @click="handleKnowledgeSelect(item.code)">
                      {{ item.label }}
                    </button>
                    <ArrowRightBold aria-hidden="true" />
                  </template>
                  <span aria-current="location">{{ currentScopeCnLabel }}</span>
                </nav>
                <span v-else class="qb-content__eyebrow">当前学习范围</span>
                <h2 class="qb-content__title">{{ selectedNodeLabel }}</h2>
              </div>
              <div class="qb-content__tools">
                <span class="qb-content__hint">
                  {{ totalQuestionCount }} 题 · 每次最多 {{ DIRECT_PRACTICE_QUESTION_COUNT }} 题
                </span>
                <AppButton
                  class="qb-notebook-action"
                  type="secondary"
                  size="small"
                  :disabled="!currentScopeLeafCodes.length"
                  @click="handleOpenAddToNotebook"
                >加入练习本</AppButton>
              </div>
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
              <AppButton class="qb-continue-action" type="secondary" @click="handleContinuePractice">继续练习</AppButton>
            </div>

            <KnowledgeLessonPanel
              v-if="activeKnowledgeLesson"
              :key="activeKnowledgeLesson.code"
              :lesson="activeKnowledgeLesson"
              :selected-code="selectedNodeCode"
              @select="handleKnowledgeSelect"
              @practise="scrollToDifficulties"
            />

            <div
              ref="difficultyGridRef"
              class="qb-difficulty-grid"
              tabindex="-1"
              aria-label="选择练习难度"
            >
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
                  <AppButton
                    class="qb-difficulty-card__cta"
                    :size="compactViewport ? 'mini' : 'medium'"
                    :disabled="diff.count === 0 || Boolean(activePractice)"
                    :loading="startingDifficultyId === diff.id"
                    @click="handleStartPractice(diff)"
                  >
                    <span v-if="startingDifficultyId === diff.id">正在生成</span>
                    <span v-else-if="diff.count === 0">暂无题目</span>
                    <span v-else>立即练习</span>
                  </AppButton>
                </div>
                <div class="qb-difficulty-card__body">
                  <span class="qb-difficulty-card__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="m7.5 16.5 9-9M9 7.5h7.5V15"
                        stroke="currentColor"
                        stroke-width="1.8"
                      />
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

        </div>
      </section>
    </main>

    <AppDialog
      v-model="selectionDialogVisible"
      title="确认开始练习"
      confirm-text="开始练习"
      cancel-text="取消"
      @confirm="handleConfirmSelectedPractice"
      @cancel="handleCancelSelectedPractice"
    >
      <p>{{ selectionDialogMessage }}</p>
    </AppDialog>

    <AddToPracticeNotebookDialog
      v-model="addNotebookDialogVisible"
      :notebooks="notebooks"
      :selected-notebook-id="selectedNotebookId"
      :scope-codes="currentScopeLeafCodes"
      :scope-cn-label="currentScopeCnLabel"
      :scope-en-label="currentScopeEnLabel"
      :scope-leaf-count="currentScopeLeafCodes.length"
      :loading="notebookLoading"
      :saving="addingToNotebook"
      @select="selectedNotebookId = $event"
      @confirm="handleConfirmAddToNotebook"
      @cancel="handleCancelAddToNotebook"
      @create="handleCreateNotebookFromScope"
    />

    <DailyCardAccessDialog
      v-model="upgradeDialogVisible"
      :exam-type="paymentExamType"
      upgrade-message="试题库为会员专享，开通当前考试类型的会员后即可不限题量练习。"
      @activated="handleDailyCardActivated"
      @upgrade="handleOpenPayment"
      @cancel="handleCancelMembershipAccess"
    />

    <PaymentModal
      :model-value="paymentVisible"
      :default-exam-type="paymentExamType"
      @update:model-value="handlePaymentVisibilityChange"
      @paid="handlePaymentSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import AppButton from '@/components/AppButton.vue'
// 试题库首页：按考试、考纲和难度选择题目范围并开始专项练习。
import { computed, nextTick, onActivated, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  ArrowRight,
  ArrowRightBold,
  CircleCheck,
  Clock,
  Lock,
  Notebook,
  Reading,
} from '@element-plus/icons-vue'
import type { TreeInstance } from 'element-plus'
import AppDialog from '@/components/AppDialog.vue'
import DailyCardAccessDialog from '@/components/DailyCardAccessDialog.vue'
import PaymentModal from '@/components/PaymentModal.vue'
import SyllabusTreeNode from '@/components/SyllabusTreeNode.vue'
import KnowledgeLessonPanel from '@/components/knowledge/KnowledgeLessonPanel.vue'
import AddToPracticeNotebookDialog from '@/components/practiceNotebook/AddToPracticeNotebookDialog.vue'
import { findKnowledgeLesson } from '@/content/knowledge'
import { useAuthStore, type ActiveExamType } from '@/stores/auth'
import type { QuestionDifficulty, SyllabusNode } from '@/api/questionBank'
import { getSyllabusData, getQuestionSummaryData } from '@/api/questionBank'
import { getActiveQuestionBankPractice, type ActiveQuestionBankPractice } from '@/api/exam'
import { checkMemberAccess, getMember } from '@/api/member'
import { createLoginRequiredRouteLocation } from '@/utils/authRedirect'
import {
  getPracticeNotebooks,
  updatePracticeNotebook,
  type PracticeNotebookSummary,
} from '@/api/practiceNotebook'

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
  examType: ActiveExamType
}

const DIRECT_PRACTICE_QUESTION_COUNT = 5
const SYLLABUS_COLLAPSED_STORAGE_KEY = 'question-bank:syllabus-collapsed'

// 游客可浏览考纲与题量，开始专项练习时再进入登录并回到试题库。
function requireLoginForPracticeAction(): boolean {
  if (auth.isLoggedIn) return false
  void router.push(createLoginRequiredRouteLocation('/question-bank'))
  return true
}

const treeData = ref<TreeNode[]>([])
const syllabusTreeRef = ref<TreeInstance>()
const difficultyGridRef = ref<HTMLElement>()
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
const upgradeDialogVisible = ref(false)
const paymentVisible = ref(false)
const paymentExamType = ref<ActiveExamType>(auth.activeExamType)
const pendingDirectPractice = ref<PendingDirectPractice | null>(null)
const syllabusCollapsed = ref(false)
const notebooks = ref<PracticeNotebookSummary[]>([])
const notebookLoading = ref(false)
const notebookHasActivePractice = ref(false)
const addNotebookDialogVisible = ref(false)
const selectedNotebookId = ref('')
const addingToNotebook = ref(false)
let examContentInitialized = false
let examLoadSequence = 0
let summaryLoadSequence = 0
let practiceLoadSequence = 0
let notebookLoadSequence = 0

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

// 题库统一读取顶部导航的全局考试类型，不再维护页面级考试选择。
const activeExamType = computed<ActiveExamType>(() => auth.activeExamType)

// 讲解只绑定当前考纲真实存在的节点；可选知识点也以当前已加载考纲为准。
const activeKnowledgeLesson = computed(() => {
  const lesson = findKnowledgeLesson(activeExamType.value, selectedNodeCode.value)
  if (!lesson || !findTreeNode(treeData.value, selectedNodeCode.value)) return null
  const sections = lesson.sections.filter((section) => findTreeNode(treeData.value, section.code))
  return sections.length ? { ...lesson, sections } : null
})

// 当前树节点同时提供双语标题，右侧练习本弹窗不再从混合 label 反向拆分。
const selectedTreeNode = computed(
  () => findTreeNode(treeData.value, selectedNodeCode.value)?.node || null,
)

// 中文范围名称优先使用新版考纲字段，兼容无匹配节点时的页面标题。
const currentScopeCnLabel = computed(
  () => selectedTreeNode.value?.cn_label || selectedNodeLabel.value,
)

// 顶部路径沿用当前考纲树的祖先节点，父级可直接返回对应的学习和练习范围。
const selectedBreadcrumb = computed(() => {
  const match = findTreeNode(treeData.value, selectedNodeCode.value)
  if (!match) return []
  return match.parents.flatMap((code) => {
    const node = findTreeNode(treeData.value, code)?.node
    return node ? [{ code: node.code, label: node.cn_label || node.label }] : []
  })
})

// 英文范围名称随考纲节点直接读取，供加入练习本弹窗双语展示。
const currentScopeEnLabel = computed(
  () => selectedTreeNode.value?.en_label || selectedNodeLabel.value,
)

// 章节或学科范围统一展开为叶子知识点，保证练习本保存的都是可组卷节点。
const currentScopeLeafCodes = computed<string[]>(() => {
  const root = selectedTreeNode.value
  if (!root) return []
  const codes: string[] = []
  const appendLeaves = (node: TreeNode): void => {
    if (!node.children?.length) {
      codes.push(node.code)
      return
    }
    node.children.forEach(appendLeaves)
  }
  appendLeaves(root)
  return Array.from(new Set(codes))
})

// 右侧练习本摘要合并总数和当前是否存在练习本进行中任务。
const notebookSummaryText = computed(() => {
  if (!auth.isLoggedIn) return '登录后创建和管理'
  if (notebookLoading.value) return '正在读取...'
  const activeText = notebookHasActivePractice.value ? ' · 1 项进行中' : ''
  return `${notebooks.value.length} 本练习本${activeText}`
})

// 解锁状态以当前考试的有效会员上下文为准。
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

// 收起状态只影响本机布局，重新展开后 Element Plus 树会恢复原选择与展开路径。
function toggleSyllabus(): void {
  syllabusCollapsed.value = !syllabusCollapsed.value
  window.localStorage.setItem(SYLLABUS_COLLAPSED_STORAGE_KEY, syllabusCollapsed.value ? '1' : '0')
  if (!syllabusCollapsed.value) void expandDefaultSyllabusNodes()
}

// 登录用户进入学习平台后读取练习本摘要，为顶部入口和加入弹窗提供真实数据。
async function loadNotebookSummary(): Promise<void> {
  const requestSequence = ++notebookLoadSequence
  const requestedExamType = activeExamType.value
  notebooks.value = []
  notebookHasActivePractice.value = false
  if (!auth.isLoggedIn) return
  notebookLoading.value = true
  try {
    const result = await getPracticeNotebooks(requestedExamType)
    if (requestSequence !== notebookLoadSequence || requestedExamType !== activeExamType.value) {
      return
    }
    notebooks.value = result.notebooks
    notebookHasActivePractice.value = result.activePractice?.source === 'notebook'
  } catch {
    if (requestSequence === notebookLoadSequence) {
      notebooks.value = []
      notebookHasActivePractice.value = false
    }
  } finally {
    if (requestSequence === notebookLoadSequence) notebookLoading.value = false
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

// 面板内换知识点复用树选择流程，使正文、左侧高亮和下方取题范围保持一致。
async function handleKnowledgeSelect(code: string): Promise<void> {
  const match = findTreeNode(treeData.value, code)
  if (!match) return
  for (const parent of match.parents) syllabusTreeRef.value?.getNode(parent)?.expand()
  syllabusTreeRef.value?.setCurrentKey(code)
  await handleTreeNodeClick(match.node)
}

// 学完后直接定位既有难度入口，并尊重系统减少动态效果的偏好。
function scrollToDifficulties(): void {
  difficultyGridRef.value?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start',
  })
  difficultyGridRef.value?.focus({ preventScroll: true })
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
  selectionDialogVisible.value = false
  upgradeDialogVisible.value = false
  pendingDirectPractice.value = null
  addNotebookDialogVisible.value = false
  selectedNotebookId.value = ''
  notebookLoadSequence += 1
  notebooks.value = []
  if (!paymentVisible.value) paymentExamType.value = activeExamType.value
  if (examContentInitialized) {
    void loadExamContent(false)
    void loadNotebookSummary()
  }
})

// 窄屏卡片使用 Mini，随窗口变化同步组件尺寸，不覆盖按钮内部样式。
const compactViewport = ref(false)
let compactViewportQuery: MediaQueryList | undefined
function syncCompactViewport(): void {
  compactViewport.value = compactViewportQuery?.matches ?? false
}
onMounted(() => {
  syllabusCollapsed.value = window.localStorage.getItem(SYLLABUS_COLLAPSED_STORAGE_KEY) === '1'
  compactViewportQuery = window.matchMedia('(max-width: 780px)')
  syncCompactViewport()
  compactViewportQuery.addEventListener('change', syncCompactViewport)
})
onBeforeUnmount(() => {
  compactViewportQuery?.removeEventListener('change', syncCompactViewport)
})

// 首次进入先完成个人考试偏好初始化，再按最终全局类型加载题库。
onMounted(async () => {
  try {
    await auth.ensureMemberContext()
  } catch {
    // 偏好加载失败时继续使用全局默认 TMUA，公共请求层负责错误提示。
  }
  examContentInitialized = true
  await Promise.all([loadExamContent(true), loadNotebookSummary()])
})

// 从新建或编辑练习本返回 KeepAlive 页面时刷新摘要，保证数量和配置立即同步。
onActivated(() => {
  if (examContentInitialized) void loadNotebookSummary()
})

// 练习本作为同一学习工作区的下一页，由外层布局提供向左滑动切换。
function handleOpenPracticeNotebook(): void {
  void router.push('/practice-notebook')
}

// 打开弹窗时优先选择尚未包含当前范围的练习本，已完整包含的练习本仍可见但不可重复加入。
async function handleOpenAddToNotebook(): Promise<void> {
  if (requireLoginForPracticeAction()) return
  if (!currentScopeLeafCodes.value.length) {
    ElMessage.info('当前考纲范围没有可加入的叶子知识点')
    return
  }
  addNotebookDialogVisible.value = true
  await loadNotebookSummary()
  selectedNotebookId.value =
    notebooks.value.find(
      (notebook) =>
        !currentScopeLeafCodes.value.every((code) => notebook.knowledgePointCodes.includes(code)),
    )?.id || ''
}

// 取消加入时清空本次选择，避免再次打开误用上一次目标练习本。
function handleCancelAddToNotebook(): void {
  addNotebookDialogVisible.value = false
  selectedNotebookId.value = ''
}

// 加入只补充缺失叶子节点，练习本原有难度、题量、时间和未做优先设置保持不变。
async function handleConfirmAddToNotebook(): Promise<void> {
  const notebook = notebooks.value.find((item) => item.id === selectedNotebookId.value)
  if (!notebook || addingToNotebook.value) return
  const missingCodes = currentScopeLeafCodes.value.filter(
    (code) => !notebook.knowledgePointCodes.includes(code),
  )
  if (!missingCodes.length) {
    ElMessage.info('该练习本已包含当前知识点')
    return
  }
  addingToNotebook.value = true
  try {
    const updated = await updatePracticeNotebook(notebook.id, {
      name: notebook.name,
      examType: notebook.examType,
      knowledgePointCodes: Array.from(new Set([...notebook.knowledgePointCodes, ...missingCodes])),
      questionCount: notebook.questionCount,
      difficultyMode: notebook.difficultyMode,
      durationMinutes: notebook.durationMinutes,
      unseenFirst: notebook.unseenFirst,
    })
    notebooks.value = notebooks.value.map((item) =>
      item.id === updated.id ? { ...item, ...updated } : item,
    )
    addNotebookDialogVisible.value = false
    selectedNotebookId.value = ''
    ElMessage.success(`已将 ${missingCodes.length} 个知识点加入“${updated.name}”`)
  } catch {
    // 公共请求层统一提示失败原因，弹窗保持当前选择以便重试。
  } finally {
    addingToNotebook.value = false
  }
}

// 新建入口携带当前范围并返回试题库，创建页仍由用户确认难度、题量和时间。
function handleCreateNotebookFromScope(): void {
  const returnTo = router.resolve({
    path: '/question-bank',
    query: { code: selectedNodeCode.value },
  }).fullPath
  addNotebookDialogVisible.value = false
  void router.push({
    path: '/practice-notebook/new',
    query: {
      source: 'question-bank',
      examType: activeExamType.value,
      name: `${currentScopeCnLabel.value}练习本`,
      knowledgePointCodes: currentScopeLeafCodes.value.join(','),
      returnTo,
    },
  })
}

// 移动端仅开放题库与考纲浏览，正式练习统一提示切换到电脑端。
function requireDesktopForQuestionBankPractice(): boolean {
  const isMobileViewport =
    window.matchMedia('(max-width: 780px)').matches || window.screen.width <= 780
  if (!isMobileViewport) return false
  ElMessage.info('试题练习需使用电脑端答题，请在电脑端打开后开始练习。')
  return true
}

// 续答只携带 ExamRecord ID，题目集合和保存进度全部由服务端会话恢复。
function handleContinuePractice(): void {
  if (!activePractice.value) return
  if (requireDesktopForQuestionBankPractice()) return
  void router.push({
    path: '/practice',
    query: { examId: activePractice.value.examRecordId },
  })
}

// 答题页使用点击卡片时冻结的范围，确认弹窗期间切换树节点不会改变本次练习归属。
function navigateToPractice(practice: PendingDirectPractice): void {
  if (requireDesktopForQuestionBankPractice()) return
  void router.push({
    path: '/practice',
    query: {
      code: practice.code,
      difficulty: practice.difficulty,
      examType: practice.examType,
    },
  })
}

// 难度卡片先确认知识点和默认五题计划，匹配不足时展示实际可生成题量。
function handleStartPractice(diff: DifficultyOption): void {
  if (requireDesktopForQuestionBankPractice()) return
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
    examType: activeExamType.value,
  }
  const practiceCountMessage =
    diff.count > plannedQuestionCount
      ? `题库共${diff.count}题，本次随机练习${plannedQuestionCount}题`
      : `本次练习全部${plannedQuestionCount}题`
  selectionDialogMessage.value = `您已选择${pendingDirectPractice.value.label}，${practiceCountMessage}，开始练习？`
  selectionDialogVisible.value = true
}

// 用户确认范围后检查当前考试会员，未解锁时提供日卡和开通入口。
async function handleConfirmSelectedPractice(): Promise<void> {
  // AppDialog 由页面主动关闭；先退出范围确认，再承接会员提示。
  selectionDialogVisible.value = false
  if (requireDesktopForQuestionBankPractice()) {
    pendingDirectPractice.value = null
    return
  }
  if (requireLoginForPracticeAction()) return
  const pending = pendingDirectPractice.value
  if (!pending) return
  startingDifficultyId.value = pending.difficulty
  try {
    const access = await checkMemberAccess({
      action: 'question-bank',
      examType: pending.examType,
      questionCount: pending.questionCount,
    })
    if (access.allowed) {
      pendingDirectPractice.value = null
      navigateToPractice(pending)
      return
    }

    paymentExamType.value = pending.examType
    upgradeDialogVisible.value = true
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

// 免费日卡启用后继续使用此前冻结的练习参数，并重新由服务端校验会员权益。
async function handleDailyCardActivated(): Promise<void> {
  await handleConfirmSelectedPractice()
}

// 关闭权益拦截时清理此前冻结的练习参数，避免下次误续接旧操作。
function handleCancelMembershipAccess(): void {
  pendingDirectPractice.value = null
}

// 没有可用日卡或用户主动升级时再进入支付，并结束当前免费练习尝试。
function handleOpenPayment(): void {
  upgradeDialogVisible.value = false
  paymentVisible.value = true
}

// 未完成购买便关闭收银台时结束此前冻结的练习意图。
function handlePaymentVisibilityChange(visible: boolean): void {
  paymentVisible.value = visible
  if (!visible) pendingDirectPractice.value = null
}

// 支付完成后刷新当前考试会员资格，当前页面无需重新登录即可继续练习。
async function handlePaymentSuccess(): Promise<void> {
  paymentVisible.value = false
  try {
    auth.setMemberContext(await getMember())
    if (pendingDirectPractice.value) {
      await handleConfirmSelectedPractice()
    } else {
      await loadExamContent(false)
    }
  } catch {
    // 支付组件已确认成功，公共请求层负责提示权益刷新失败。
  }
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

/* 讲解较长时回到正常文档流，避免整个内容区吸顶后遮挡阅读与练习入口。 */
.qb-content--learning {
  position: static;
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
  overflow-x: hidden;
  overflow-y: visible;
}

.qb-sidebar__tree-scroll :deep(.el-tree) {
  width: 100%;
  background: transparent;
  color: var(--color-ink-soft);
}

.qb-sidebar__tree-scroll :deep(.el-tree-node),
.qb-sidebar__tree-scroll :deep(.el-tree-node__content) {
  width: 100%;
  min-width: 100%;
}

.qb-sidebar__tree-scroll :deep(.el-tree-node__content) {
  box-sizing: border-box;
  min-height: 52px;
  padding-right: 12px;
  border-radius: var(--radius-sm);
}

.qb-sidebar__tree-scroll :deep(.el-tree-node__expand-icon) {
  flex: 0 0 auto;
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
  scroll-margin-top: calc(var(--nav-height) + 24px);
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
  border-radius: 10px;
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

@media (max-width: 780px), (max-device-width: 780px) {
  .question-bank {
    min-width: 0;
  }

  .qb-container {
    width: auto;
    max-width: calc(100vw - 32px);
    margin: 0 16px;
    padding: 26px 0 48px;
  }

  .qb-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 14px;
  }

  .qb-header__title {
    font-size: 24px;
  }

  .qb-header__actions {
    width: 100%;
    justify-content: flex-start;
    gap: 10px;
  }

  .qb-main {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }

  .qb-sidebar,
  .qb-content {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    padding: 12px;
    border-radius: 10px;
  }

  .qb-content {
    overflow: hidden;
  }

  .qb-sidebar {
    position: static;
    max-height: 260px;
    overflow: hidden;
  }

  .qb-sidebar__title {
    margin-bottom: 10px;
    font-size: 10px;
    line-height: 1.45;
  }

  .qb-sidebar__tree-scroll {
    max-height: 206px;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .qb-sidebar__tree-scroll :deep(.el-tree) {
    font-size: 12px;
  }

  .qb-sidebar__tree-scroll :deep(.el-tree-node__content) {
    min-height: 46px;
    padding-right: 6px;
  }

  .qb-content__header {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 12px;
  }

  .qb-content__title {
    font-size: 15px;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }

  .qb-content__hint {
    font-size: 10px;
    line-height: 1.45;
  }

  .qb-active-practice {
    align-items: stretch;
    flex-direction: column;
    gap: 10px;
    padding: 10px;
  }

  .qb-difficulty-grid {
    width: 100%;
    min-width: 0;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .qb-difficulty-card {
    border-radius: 10px;
  }

  .qb-difficulty-card:hover {
    transform: none;
  }

  .qb-difficulty-card__visual {
    min-height: 0;
    padding: 10px 8px;
  }

  .qb-difficulty-card__english {
    margin-bottom: 4px;
    font-size: 8px;
  }

  .qb-difficulty-card__title {
    font-size: 14px;
    white-space: nowrap;
  }

  .qb-difficulty-card__body {
    display: none;
  }

  .qb-difficulty-card__icon {
    display: none;
  }

  .qb-difficulty-card__body strong {
    margin: 0 0 4px;
    font-size: 12px;
  }

  .qb-difficulty-card__desc {
    font-size: 10px;
    line-height: 1.5;
  }
}
/* 难度入口沿用卡片主题色，按钮尺寸、加载和禁用交互仍由 AppButton 提供。 */
.qb-difficulty-card__cta.app-button.el-button {
  --app-button-bg: var(--difficulty-accent);
  --app-button-border: var(--difficulty-accent);
  --app-button-hover-bg: var(--difficulty-accent-dark);
  --app-button-hover-border: var(--difficulty-accent-dark);
  --app-button-active-bg: var(--difficulty-accent-dark);
  --app-button-active-border: var(--difficulty-accent-dark);
}

.qb-difficulty-card__cta {
  position: absolute;
  right: 18px;
  bottom: 18px;
}
@media (max-width: 780px) {
  .qb-difficulty-card__cta {
    position: static;
  }
  .qb-difficulty-card__visual {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .qb-difficulty-grid {
    grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
  }
}

/* 顶部沿用导航栏宽度，考纲与正文的整体留白由学习工作区控制。 */
.qb-container {
  width: 100%;
  padding: 28px 0 72px;
}

.qb-top-shell {
  width: var(--fluid-shell-width);
  margin: 0 auto 16px;
}

.qb-overview {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(430px, 0.88fr);
  gap: 28px;
  align-items: center;
}

.qb-overview__identity {
  display: flex;
  align-items: center;
  gap: 18px;
  min-width: 0;
}

.qb-overview__mark {
  display: inline-flex;
  width: 58px;
  height: 58px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: var(--color-learning-blue-soft);
  color: var(--color-learning-blue);
}

.qb-overview__mark svg {
  width: 27px;
  height: 27px;
}

.qb-overview__copy {
  min-width: 0;
}

.qb-overview__eyebrow {
  display: block;
  margin-bottom: 5px;
  color: var(--color-learning-blue);
  font-size: 11px;
  font-weight: var(--weight-semi);
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.qb-overview__title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.qb-overview__title-row h1 {
  margin: 0;
  color: var(--color-ink);
  font-size: 30px;
  line-height: 1.2;
}

.qb-overview__access {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 10px;
  border: 1px solid var(--color-learning-amber-line);
  border-radius: 5px;
  background: var(--color-learning-amber-soft);
  color: var(--color-learning-amber);
  font-size: 12px;
  font-weight: var(--weight-semi);
}

.qb-overview__access--unlocked {
  border-color: var(--color-learning-teal-line);
  background: var(--color-learning-teal-soft);
  color: var(--color-learning-teal);
}

.qb-overview__access svg {
  width: 15px;
  height: 15px;
}

.qb-overview__copy p {
  max-width: 520px;
  margin: 8px 0 0;
  color: var(--color-ink-soft);
  font-size: 13px;
  line-height: 1.65;
}

.qb-overview__actions {
  display: grid;
  gap: 8px;
}

.qb-mode-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.qb-mode-card {
  position: relative;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  min-width: 0;
  min-height: 66px;
  padding: 10px 12px;
  border: 1px solid var(--color-line);
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.88);
  color: var(--color-ink);
  cursor: pointer;
  font: inherit;
  text-align: left;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.qb-mode-card:hover {
  border-color: var(--color-learning-blue-line);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.qb-mode-card:focus-visible,
.qb-record-entry:focus-visible {
  outline: 2px solid var(--color-learning-blue);
  outline-offset: 2px;
}

.qb-mode-card--active {
  border-color: var(--color-learning-blue-line);
  background: var(--color-learning-blue-soft);
  color: var(--color-learning-blue);
  cursor: default;
}

.qb-mode-card--active:hover {
  border-color: var(--color-learning-blue-line);
  box-shadow: none;
  transform: none;
}

.qb-mode-card__icon {
  display: inline-flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  background: var(--color-learning-blue-soft);
  color: var(--color-learning-blue);
}

.qb-mode-card--active .qb-mode-card__icon {
  background: var(--color-surface);
  color: var(--color-learning-blue);
}

.qb-mode-card__icon svg {
  width: 17px;
  height: 17px;
}

.qb-mode-card__copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
}

.qb-mode-card__copy strong {
  font-size: 13px;
}

.qb-mode-card__copy small {
  overflow: hidden;
  color: var(--color-ink-muted);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qb-mode-card--active .qb-mode-card__copy small {
  color: var(--color-ink-soft);
}

.qb-mode-card em,
.qb-mode-card__count {
  padding: 2px 6px;
  border-radius: 5px;
  font-size: 10px;
  font-style: normal;
  font-weight: var(--weight-semi);
}

.qb-mode-card em {
  background: var(--color-surface);
  color: var(--color-learning-blue);
}

.qb-mode-card__count {
  min-width: 22px;
  background: var(--color-learning-blue-soft);
  color: var(--color-learning-blue);
  text-align: center;
}

.qb-mode-card__arrow {
  width: 14px;
  color: var(--color-ink-muted);
}

.qb-record-entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid var(--color-line);
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.7);
  color: var(--color-ink-soft);
  cursor: pointer;
  font: inherit;
  font-size: 11px;
}

.qb-record-entry:hover {
  border-color: var(--color-learning-blue-line);
  color: var(--color-learning-blue);
}

.qb-record-entry span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.qb-record-entry span:last-child {
  color: var(--color-ink-muted);
  font-size: 10px;
}

.qb-record-entry svg {
  width: 13px;
  height: 13px;
}

.qb-main {
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 16px;
  /* 考纲和正文作为整体，距离页面左右边缘各留 50px。 */
  margin-inline: 50px;
  transition: grid-template-columns 180ms ease;
}

.qb-main--collapsed {
  grid-template-columns: 48px minmax(0, 1fr);
}

.qb-sidebar {
  top: 16px;
  max-height: calc(100vh - var(--nav-height) - 32px);
  padding: 12px;
  border-radius: 10px;
}

.qb-sidebar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 32px;
}

.qb-sidebar__title {
  margin: 0;
  font-size: 12px;
}

.qb-sidebar__toggle {
  display: inline-flex;
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-line);
  border-radius: 6px;
  background: var(--color-surface);
  color: var(--color-ink-soft);
  cursor: pointer;
}

.qb-sidebar__toggle:hover {
  border-color: var(--color-learning-blue-line);
  color: var(--color-learning-blue);
}

.qb-sidebar__toggle :deep(svg) {
  width: 15px;
  height: 15px;
}

.qb-sidebar__tree-scroll {
  margin-top: 8px;
}

.qb-sidebar__collapsed-label {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 8px;
  padding-top: 16px;
  color: var(--color-ink-muted);
  font-size: 11px;
}

.qb-sidebar__collapsed-label svg {
  width: 18px;
  height: 18px;
  color: var(--color-learning-blue);
}

.qb-study-layout {
  display: grid;
  min-width: 0;
  grid-template-columns: minmax(0, 1fr);
}

.qb-content,
.qb-content--learning {
  position: static;
  top: auto;
  min-width: 0;
  padding: 18px;
  border-radius: 10px;
}

.qb-content__header {
  align-items: center;
  margin-bottom: 14px;
  padding-bottom: 12px;
}
.qb-content--learning .qb-content__header {
  margin-bottom: 4px;
  padding-bottom: 0;
}
.qb-content__tools {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px 16px;
}

.qb-content__eyebrow {
  display: block;
  margin-bottom: 3px;
  color: var(--color-ink-muted);
  font-size: 11px;
}
.qb-content__breadcrumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 5px;
  color: var(--color-ink-muted);
  font-size: 12px;
  line-height: 1.5;
}
.qb-content__breadcrumb button {
  max-width: 180px;
  overflow: hidden;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}
.qb-content__breadcrumb button:hover,
.qb-content__breadcrumb button:focus-visible {
  color: var(--color-learning-blue);
}
.qb-content__breadcrumb button:focus-visible {
  outline: 2px solid var(--color-learning-blue);
  outline-offset: 2px;
}
.qb-content__breadcrumb svg {
  width: 10px;
  height: 10px;
  flex: 0 0 auto;
  color: var(--color-ink-muted);
}
.qb-content__breadcrumb [aria-current] {
  max-width: min(280px, 100%);
  overflow: hidden;
  color: var(--color-ink-soft);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qb-content__title {
  font-size: 20px;
}

.qb-content__hint {
  font-size: 12px;
  white-space: nowrap;
}
.qb-content :deep(.qb-notebook-action.app-button.el-button),
.qb-content :deep(.qb-continue-action.app-button.el-button) {
  --app-button-bg: var(--color-learning-blue-soft);
  --app-button-color: var(--color-learning-blue);
  --app-button-border: var(--color-learning-blue-line);
  --app-button-hover-bg: var(--color-learning-blue-line);
  --app-button-hover-border: var(--color-learning-blue);
  --app-button-active-bg: var(--color-learning-blue-line);
  --app-button-active-border: var(--color-learning-blue);
}

.qb-active-practice {
  margin-bottom: 14px;
  padding: 12px 14px;
}

.qb-difficulty-grid {
  gap: 12px;
}

@media (max-width: 1040px) {
  .qb-overview {
    grid-template-columns: minmax(0, 1fr);
  }

}

@media (max-width: 900px) {
  .qb-main,
  .qb-main--collapsed {
    grid-template-columns: minmax(0, 1fr);
  }

  .qb-sidebar {
    position: static;
    max-height: none;
  }

  .qb-main--collapsed .qb-sidebar {
    display: none;
  }
}

@media (max-width: 780px), (max-device-width: 780px) {
  .qb-container {
    width: auto;
    padding: 16px 12px 36px;
  }

  .qb-main {
    margin-inline: 0;
  }

  .qb-top-shell {
    width: 100%;
  }

  .qb-overview {
    gap: 18px;
  }

  .qb-overview__identity {
    align-items: flex-start;
  }

  .qb-overview__mark {
    width: 48px;
    height: 48px;
  }

  .qb-overview__title-row h1 {
    font-size: 25px;
  }

  .qb-mode-cards {
    grid-template-columns: minmax(0, 1fr);
  }

  .qb-record-entry span:last-child {
    display: none;
  }

  .qb-study-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .qb-content,
  .qb-content--learning {
    padding: 12px;
  }

  .qb-content__header {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }
}
</style>
