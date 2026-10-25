<!-- 试题库工作区：学习与做题共享考纲范围，练习入口独立校验现有做题权益。 -->
<template>
  <div class="question-bank">
    <main class="qb-container" :class="{ 'qb-container--collapsed': syllabusCollapsed }">
      <aside class="qb-sidebar" aria-label="考点大纲">
        <header class="qb-sidebar__header">
          <h2 v-if="!syllabusCollapsed" class="qb-sidebar__title">考点大纲</h2>
          <AppButton
            class="qb-sidebar__toggle"
            type="secondary"
            size="mini"
            :icon="syllabusCollapsed ? ArrowRight : ArrowLeft"
            icon-only
            :aria-label="syllabusCollapsed ? '展开考点大纲' : '收起考点大纲'"
            :aria-expanded="!syllabusCollapsed"
            aria-controls="question-bank-syllabus"
            @click="toggleSyllabus"
          />
        </header>
        <div
          v-show="!syllabusCollapsed"
          id="question-bank-syllabus"
          class="qb-sidebar__tree-scroll"
        >
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
            <template #default="{ data }"><SyllabusTreeNode :node="data" /></template>
          </el-tree>
        </div>
        <span v-show="syllabusCollapsed" class="qb-sidebar__collapsed-label" aria-hidden="true"
          >考纲</span
        >
      </aside>

      <section class="qb-workspace" aria-labelledby="question-bank-title">
        <header class="qb-overview">
          <div>
            <h1 id="question-bank-title">试题库</h1>
            <p>按考点练习，按需学习。</p>
          </div>
          <nav class="qb-shortcuts" aria-label="练习管理">
            <RouterLink to="/practice-notebook"
              ><Reading aria-hidden="true" />我的练习本</RouterLink
            >
            <RouterLink to="/practice-records"><Clock aria-hidden="true" />练习记录</RouterLink>
          </nav>
        </header>

        <el-tabs v-model="activeMode" class="qb-mode-tabs" aria-label="学习与做题">
          <el-tab-pane
            v-for="mode in workspaceModes"
            :key="mode.id"
            :name="mode.id"
            :label="mode.label"
          >
            <section class="qb-content" :aria-label="mode.label">
              <header class="qb-content__header">
                <div class="qb-content__heading">
                  <nav v-if="selectedBreadcrumb.length" class="qb-breadcrumb" aria-label="考纲路径">
                    <template v-for="(item, index) in selectedBreadcrumb" :key="item.code">
                      <ArrowRight v-if="index" aria-hidden="true" />
                      <button
                        v-if="index < selectedBreadcrumb.length - 1"
                        type="button"
                        :title="item.label"
                        @click="handleKnowledgeSelect(item.code)"
                      >
                        {{ item.label }}
                      </button>
                      <span
                        v-else
                        class="qb-breadcrumb__current"
                        aria-current="page"
                        :title="item.label"
                      >
                        {{ item.label }}
                      </span>
                    </template>
                  </nav>
                  <h2 class="qb-content__title">{{ currentScopeCnLabel }}</h2>
                  <p v-if="currentScopeEnLabel !== currentScopeCnLabel" class="qb-content__english">
                    {{ currentScopeEnLabel }}
                  </p>
                </div>
                <AppButton
                  class="qb-secondary"
                  type="secondary"
                  size="small"
                  :icon="Notebook"
                  :disabled="!currentScopeLeafCodes.length"
                  @click="handleOpenAddToNotebook"
                  >加入练习本</AppButton
                >
              </header>

              <template v-if="mode.id === 'learning'">
                <KeepAlive :max="1">
                  <KnowledgeLessonPanel
                    v-if="activeMode === 'learning' && activeKnowledgeLesson"
                    :key="activeKnowledgeLesson.code"
                    :lesson="activeKnowledgeLesson"
                    :selected-code="selectedNodeCode"
                    @select="handleKnowledgeSelect"
                    @practise="openPracticeMode"
                  />
                </KeepAlive>
                <div v-if="!activeKnowledgeLesson" class="qb-learning-index">
                  <template v-if="availableLearningChapters.length">
                    <h3>选择章节开始学习</h3>
                    <div class="qb-chapter-list">
                      <button
                        v-for="chapter in availableLearningChapters"
                        :key="chapter.code"
                        type="button"
                        @click="handleKnowledgeSelect(chapter.code)"
                      >
                        <span
                          >{{ chapter.cn_label }}<small>{{ chapter.en_label }}</small></span
                        >
                        <ArrowRight aria-hidden="true" />
                      </button>
                    </div>
                  </template>
                  <template v-else>
                    <h3>{{ syllabusLoading ? '正在读取考纲…' : '当前范围暂无知识讲解' }}</h3>
                    <p>可以选择其他章节学习，或直接练习当前考点。</p>
                    <AppButton
                      class="qb-secondary"
                      type="secondary"
                      :icon="ArrowRight"
                      icon-position="right"
                      @click="openPracticeMode"
                      >去做题</AppButton
                    >
                  </template>
                </div>
              </template>

              <div
                v-else
                ref="difficultyGridRef"
                class="qb-practice"
                tabindex="-1"
                aria-label="练习设置"
              >
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
                  <AppButton class="qb-secondary" type="secondary" @click="handleContinuePractice"
                    >继续练习</AppButton
                  >
                </div>

                <h3 class="qb-difficulty-heading">练习难度</h3>
                <div class="qb-difficulty-grid" aria-label="选择练习难度">
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
                        :aria-label="diff.label + '难度：立即练习'"
                        :size="compactViewport ? 'mini' : 'medium'"
                        :disabled="
                          summaryLoading ||
                          diff.count === 0 ||
                          Boolean(activePractice) ||
                          Boolean(startingDifficultyId)
                        "
                        :loading="startingDifficultyId === diff.id"
                        @click="handleStartPractice(diff)"
                      >
                        <span v-if="startingDifficultyId === diff.id">正在生成</span>
                        <span v-else-if="summaryLoading">加载中</span>
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
                <p class="qb-practice-summary" aria-live="polite">
                  <template v-if="summaryLoading">正在读取题量…</template>
                  <template v-else-if="summaryFailed">题量暂时无法加载，请重试。</template>
                  <template v-else-if="!hasPracticeQuestions"
                    >当前范围暂无可练习题目，请选择其他考点。</template
                  >
                  <template v-else
                    >每次最多 {{ DIRECT_PRACTICE_QUESTION_COUNT }} 题 ·
                    完成后查看成绩与解析</template
                  >
                </p>
                <AppButton
                  v-if="summaryFailed"
                  class="qb-secondary"
                  type="secondary"
                  @click="loadQuestionSummary"
                  >重新加载</AppButton
                >
              </div>
            </section>
          </el-tab-pane>
        </el-tabs>
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
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight, Clock, Notebook, Reading } from '@element-plus/icons-vue'
import type { TreeInstance } from 'element-plus'
import AppDialog from '@/components/AppDialog.vue'
import DailyCardAccessDialog from '@/components/DailyCardAccessDialog.vue'
import PaymentModal from '@/components/PaymentModal.vue'
import SyllabusTreeNode from '@/components/SyllabusTreeNode.vue'
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

// 做题页不装载讲解及图示组件，进入学习后再使用原有课程面板。
const KnowledgeLessonPanel = defineAsyncComponent(
  () => import('@/components/knowledge/KnowledgeLessonPanel.vue'),
)

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

type TreeNode = SyllabusNode
type DifficultyId = QuestionDifficulty
type WorkspaceMode = 'learning' | 'practice'

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
const WORKSPACE_MODE_STORAGE_KEY = 'question-bank:mode'
const workspaceModes: { id: WorkspaceMode; label: string }[] = [
  { id: 'learning', label: '学习' },
  { id: 'practice', label: '做题' },
]
const activeMode = ref<WorkspaceMode>('practice')

// 游客可浏览考纲与题量，开始专项练习时再进入登录并回到试题库。
function requireLoginForPracticeAction(): boolean {
  if (auth.isLoggedIn) return false
  const returnTo = router.resolve({
    path: '/question-bank',
    query: {
      code: selectedNodeCode.value,
      mode: activeMode.value,
      difficulty: targetDifficulty.value,
    },
  }).fullPath
  void router.push(createLoginRequiredRouteLocation(returnTo))
  return true
}

const treeData = ref<TreeNode[]>([])
const syllabusTreeRef = ref<TreeInstance>()
const difficultyGridRef = ref<HTMLElement[]>([])
const treeProps = { children: 'children', label: 'label' }
const defaultExpanded = ref<string[]>([])
const selectedNodeCode = ref<string>('')
const selectedNodeLabel = ref<string>('综合考点')
const targetDifficulty = ref<DifficultyId>('medium')
const syllabusLoading = ref(true)
const summaryLoading = ref(true)
const summaryFailed = ref(false)
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

// 路径包含祖先与当前节点，切换章节或知识点时同步更新末项；父级保留返回入口。
const selectedBreadcrumb = computed(() => {
  const match = findTreeNode(treeData.value, selectedNodeCode.value)
  if (!match) return []
  return [...match.parents, match.node.code].flatMap((code) => {
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

// 学科总节点列出已有讲解的章节，避免让学生在学习模式下看到空白页。
const availableLearningChapters = computed(() => {
  const chapters: TreeNode[] = []
  // 已匹配章节时不再展开其叶子，避免同一讲义在入口重复出现。
  const visit = (nodes: TreeNode[]): void => {
    for (const node of nodes) {
      if (findKnowledgeLesson(activeExamType.value, node.code)) chapters.push(node)
      else visit(node.children || [])
    }
  }
  visit(selectedTreeNode.value?.children || [])
  return chapters
})

// 推荐卡片按既有难度编码定位，不改变服务端组卷及权益规则。
const selectedDifficulty = computed(() =>
  difficulties.value.find((item) => item.id === targetDifficulty.value),
)

// 所有难度均无题时显示空范围提示，加载失败则使用独立的重试状态。
const hasPracticeQuestions = computed(() => difficulties.value.some((item) => item.count > 0))

// 模式偏好只保存布局选择，不代表购买资格；显式链接优先于本机偏好。
function restoreWorkspaceMode(): void {
  const requested = String(route.query.mode || '')
  let saved: string | null = null
  try {
    saved = window.localStorage.getItem(WORKSPACE_MODE_STORAGE_KEY)
  } catch {
    // 浏览器禁用存储时仍可正常切换模式。
  }
  activeMode.value =
    requested === 'learning' || requested === 'practice'
      ? requested
      : route.query.difficulty
        ? 'practice'
        : saved === 'learning'
          ? 'learning'
          : 'practice'
}

// 记住上次使用的入口，学习与做题切换不重置考点、不创建答卷。
watch(activeMode, (mode) => {
  try {
    window.localStorage.setItem(WORKSPACE_MODE_STORAGE_KEY, mode)
  } catch {
    // 存储不可用时保留本次页面内的选择。
  }
  if (route.query.mode && route.query.mode !== mode) {
    void router.replace({ query: { ...route.query, mode } })
  }
})

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
  try {
    window.localStorage.setItem(SYLLABUS_COLLAPSED_STORAGE_KEY, syllabusCollapsed.value ? '1' : '0')
  } catch {
    // 存储不可用不影响展开和收起操作。
  }
  if (!syllabusCollapsed.value) void expandDefaultSyllabusNodes()
}

// 登录用户进入学习平台后读取练习本摘要，为顶部入口和加入弹窗提供真实数据。
async function loadNotebookSummary(): Promise<void> {
  const requestSequence = ++notebookLoadSequence
  const requestedExamType = activeExamType.value
  notebooks.value = []
  if (!auth.isLoggedIn) return
  notebookLoading.value = true
  try {
    const result = await getPracticeNotebooks(requestedExamType)
    if (requestSequence !== notebookLoadSequence || requestedExamType !== activeExamType.value) {
      return
    }
    notebooks.value = result.notebooks
  } catch {
    if (requestSequence === notebookLoadSequence) {
      notebooks.value = []
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
  summaryFailed.value = false
  summaryLoading.value = Boolean(requestedNodeCode)
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
    if (data.difficultyCount) {
      difficulties.value = difficulties.value.map((d) => ({
        ...d,
        count: data.difficultyCount[d.id] || 0,
      }))
    }
    if (!selectedDifficulty.value?.count) {
      targetDifficulty.value = difficulties.value.find((item) => item.count > 0)?.id || 'medium'
    }
  } catch {
    if (requestSequence === summaryLoadSequence) {
      resetQuestionSummary()
      summaryFailed.value = true
    }
  } finally {
    if (requestSequence === summaryLoadSequence) summaryLoading.value = false
  }
}

// 汇总筛选变化或请求失败时统一清空总数与各难度数量，使练习按钮同步失效。
function resetQuestionSummary(): void {
  difficulties.value = difficulties.value.map((item) => ({ ...item, count: 0 }))
}

// 大纲选择同步到地址，刷新或登录返回时仍能恢复当前知识点。
const handleTreeNodeClick = async (node: TreeNode): Promise<void> => {
  selectedNodeCode.value = node.code
  selectedNodeLabel.value = node.label
  if (route.query.code !== node.code) {
    void router.replace({ query: { ...route.query, code: node.code } })
  }
  await loadQuestionSummary()
}

// 同一工作区的链接也可能指定新范围，KeepAlive 恢复时只处理实际变化的上下文。
watch(
  () => [route.path, route.query.code, route.query.mode, route.query.difficulty],
  (nextContext, previousContext) => {
    if (route.path !== '/question-bank' || !examContentInitialized || syllabusLoading.value) return
    if (route.query.mode === 'learning' || route.query.mode === 'practice') {
      activeMode.value = route.query.mode
    }
    const difficulty = String(route.query.difficulty || '')
    if (
      nextContext[3] !== previousContext[3] &&
      difficulties.value.some((item) => item.id === difficulty)
    ) {
      targetDifficulty.value = difficulty as DifficultyId
    }
    const code = String(route.query.code || '')
    if (code && code !== selectedNodeCode.value) void handleKnowledgeSelect(code)
  },
)

// 面板内换知识点复用树选择流程，使正文、左侧高亮和下方取题范围保持一致。
async function handleKnowledgeSelect(code: string): Promise<void> {
  const match = findTreeNode(treeData.value, code)
  if (!match) return
  for (const parent of match.parents) syllabusTreeRef.value?.getNode(parent)?.expand()
  syllabusTreeRef.value?.setCurrentKey(code)
  await handleTreeNodeClick(match.node)
}

// 学完后切到同一考点的做题模式，再聚焦设置区；切换本身不生成练习。
async function openPracticeMode(): Promise<void> {
  activeMode.value = 'practice'
  await nextTick()
  const panel = difficultyGridRef.value[0]
  panel?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start',
  })
  panel?.focus({ preventScroll: true })
}

// 全局考试类型变化后重置旧考试数据，并只接受本次切换对应的异步响应。
async function loadExamContent(useRouteContext: boolean): Promise<void> {
  const requestSequence = ++examLoadSequence
  const requestedExamType = activeExamType.value
  syllabusLoading.value = true
  summaryLoading.value = true
  summaryFailed.value = false
  summaryLoadSequence += 1
  practiceLoadSequence += 1
  treeData.value = []
  defaultExpanded.value = []
  selectedNodeCode.value = ''
  selectedNodeLabel.value = '综合考点'
  activePractice.value = null
  resetQuestionSummary()
  if (!useRouteContext) targetDifficulty.value = 'medium'

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
        : 'medium'
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
  } finally {
    if (requestSequence === examLoadSequence) {
      syllabusLoading.value = false
      if (!selectedNodeCode.value) summaryLoading.value = false
    }
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

onMounted(() => {
  restoreWorkspaceMode()
  try {
    syllabusCollapsed.value = window.localStorage.getItem(SYLLABUS_COLLAPSED_STORAGE_KEY) === '1'
  } catch {
    // 无本地偏好时保持考纲展开。
  }
})

// 窄屏卡片使用 Mini，随窗口变化同步组件尺寸，不覆盖按钮内部样式。
const compactViewport = ref(false)
let compactViewportQuery: MediaQueryList | undefined
// 窄屏使用公共按钮的紧凑尺寸，避免三张并排卡片裁切练习入口。
function syncCompactViewport(): void {
  compactViewport.value = compactViewportQuery?.matches ?? false
}
onMounted(() => {
  compactViewportQuery = window.matchMedia('(max-width: 860px)')
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
  if (examContentInitialized) {
    void loadNotebookSummary()
    void loadActivePractice()
  }
})

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
    query: {
      code: selectedNodeCode.value,
      mode: activeMode.value,
      difficulty: targetDifficulty.value,
    },
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

// 答题页使用点击开始时冻结的范围，确认弹窗期间切换树节点不会改变本次练习归属。
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

// 开始按钮先确认知识点和默认五题计划，匹配不足时展示实际可生成题量。
function handleStartPractice(diff: DifficultyOption): void {
  if (summaryLoading.value || startingDifficultyId.value || !diff.count) return
  targetDifficulty.value = diff.id
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
  background: var(--color-surface);
  color: var(--color-ink);
}

/* 考纲与正文作为整体保留左右 50px 留白，折叠只收窄目录列。 */
.qb-container {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  align-items: start;
  gap: 40px;
  margin: 0 50px;
  padding: 32px 0 72px;
}
.qb-container--collapsed {
  grid-template-columns: 44px minmax(0, 1fr);
}
.qb-sidebar {
  position: sticky;
  top: calc(var(--nav-height) + 20px);
  display: flex;
  flex-direction: column;
  min-width: 0;
  max-height: calc(100dvh - var(--nav-height) - 40px);
  padding: 12px 8px;
  border-radius: 8px;
  background: #f7f9fc;
}
.qb-sidebar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 8px 12px;
}
.qb-sidebar__title {
  margin: 0;
  color: var(--color-ink-soft);
  font-size: 16px;
  font-weight: 600;
}
.qb-sidebar__toggle.app-button.el-button {
  --button-min-width: 28px;
  flex-shrink: 0;
}
.qb-sidebar__tree-scroll {
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}
.qb-sidebar__tree-scroll :deep(.el-tree) {
  background: transparent;
}
.qb-sidebar__tree-scroll :deep(.el-tree-node__content) {
  min-height: 58px;
  height: auto;
  padding-right: 8px;
  border-radius: 5px;
}
.qb-sidebar__tree-scroll :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background: var(--color-learning-blue-soft);
  color: var(--color-learning-blue);
  box-shadow: inset 3px 0 var(--color-learning-blue);
}
.qb-sidebar__tree-scroll
  :deep(.el-tree-node.is-current > .el-tree-node__content .syllabus-tree-node__cn) {
  color: var(--color-learning-blue);
}
.qb-sidebar__collapsed-label {
  padding-top: 12px;
  text-align: center;
  color: var(--color-ink-muted);
  font-size: 12px;
}
.qb-container--collapsed .qb-sidebar {
  padding: 8px;
}
.qb-container--collapsed .qb-sidebar__header {
  padding: 0;
}
.qb-workspace {
  min-width: 0;
}
.qb-overview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 30px;
}
.qb-overview h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.35;
}
.qb-overview p {
  margin: 6px 0 0;
  color: var(--color-ink-muted);
  font-size: 15px;
}
.qb-shortcuts {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 20px;
  margin-right: 64px;
}
.qb-shortcuts a {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-ink-soft);
  font-size: 14px;
  text-decoration: none;
}
.qb-shortcuts a + a {
  padding-left: 20px;
  border-left: 1px solid var(--color-line);
}
.qb-shortcuts svg {
  width: 19px;
  height: 19px;
}
.qb-shortcuts a:hover {
  color: var(--color-learning-blue);
}
.qb-mode-tabs {
  --el-color-primary: var(--color-learning-blue);
}
.qb-mode-tabs :deep(> .el-tabs__header) {
  margin: 0;
}
.qb-mode-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background: var(--color-line);
}
.qb-mode-tabs :deep(.el-tabs__item) {
  height: 54px;
  padding: 0 24px;
  font-size: 18px;
  font-weight: 600;
}
.qb-mode-tabs :deep(.el-tabs__active-bar) {
  height: 3px;
}
.qb-mode-tabs :deep(> .el-tabs__content) {
  overflow: visible;
}
.qb-content {
  padding-top: 32px;
}
.qb-content__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
}
.qb-content__heading {
  min-width: 0;
}
.qb-breadcrumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  color: var(--color-ink-muted);
  font-size: 14px;
}
.qb-breadcrumb button {
  max-width: 240px;
  padding: 0;
  overflow: hidden;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: pointer;
}
.qb-breadcrumb button:hover {
  color: var(--color-learning-blue);
}
.qb-breadcrumb__current {
  min-width: 0;
  max-width: 100%;
  color: var(--color-ink);
  overflow-wrap: anywhere;
}
.qb-breadcrumb svg {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}
.qb-content__title {
  margin: 0;
  font-size: 28px;
  line-height: 1.45;
  font-weight: 700;
  overflow-wrap: anywhere;
}
.qb-content__english {
  margin: 6px 0 0;
  color: var(--color-ink-muted);
  font-size: 17px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.qb-practice {
  min-width: 0;
  outline: none;
  scroll-margin-top: calc(var(--nav-height) + 20px);
}
/* 做题模式沿用原试题库三色难度卡片，每张卡片独立发起该难度的练习。 */
.qb-difficulty-heading {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 600;
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
@media (max-width: 860px) {
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

.qb-practice-summary {
  margin: 22px 0 0;
  color: var(--color-ink-muted);
  font-size: 14px;
  line-height: 1.6;
}
.qb-practice-summary + .app-button {
  margin-top: 12px;
}
.qb-primary.app-button.el-button {
  --app-button-bg: var(--color-learning-blue);
  --app-button-border: var(--color-learning-blue);
  --app-button-hover-bg: #1945ab;
  --app-button-hover-border: #1945ab;
  --app-button-active-bg: #173e99;
  --app-button-active-border: #173e99;
}
.qb-secondary.app-button.el-button {
  --app-button-bg: var(--color-surface);
  --app-button-color: var(--color-learning-blue);
  --app-button-border: var(--color-learning-blue-line);
  --app-button-hover-bg: var(--color-learning-blue-soft);
  --app-button-hover-border: var(--color-learning-blue);
  --app-button-active-bg: var(--color-learning-blue-soft);
  --app-button-active-border: var(--color-learning-blue);
}
.qb-active-practice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  margin-bottom: 24px;
  border-radius: 5px;
  background: var(--color-learning-blue-soft);
}
.qb-active-practice > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
}
.qb-active-practice span {
  color: var(--color-ink-soft);
  font-size: 13px;
}
.qb-learning-index {
  padding: 8px 0 24px;
}
.qb-learning-index h3 {
  margin: 0 0 16px;
  font-size: 17px;
  font-weight: 600;
}
.qb-learning-index p {
  color: var(--color-ink-muted);
  margin: 0 0 20px;
}
.qb-chapter-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 32px;
}
.qb-chapter-list button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 0;
  border: 0;
  border-bottom: 1px solid var(--color-line);
  background: none;
  color: var(--color-ink);
  text-align: left;
  font: inherit;
  cursor: pointer;
}
.qb-chapter-list button:hover {
  color: var(--color-learning-blue);
}
.qb-chapter-list small {
  display: block;
  margin-top: 4px;
  color: var(--color-ink-muted);
  font-size: 13px;
}
.qb-chapter-list svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
.qb-shortcuts a:focus-visible,
.qb-breadcrumb button:focus-visible,
.qb-chapter-list button:focus-visible {
  outline: 2px solid var(--color-learning-blue);
  outline-offset: 3px;
}
@media (max-width: 1100px) {
  .qb-container {
    grid-template-columns: 230px minmax(0, 1fr);
    gap: 24px;
  }
  .qb-container--collapsed {
    grid-template-columns: 44px minmax(0, 1fr);
  }
  .qb-overview {
    align-items: flex-start;
    flex-direction: column;
    gap: 18px;
  }
  .qb-content__header {
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .qb-content__title {
    font-size: 25px;
  }
}
@media (max-width: 860px) {
  .qb-container,
  .qb-container--collapsed {
    grid-template-columns: minmax(0, 1fr);
    margin-inline: 16px;
    gap: 24px;
    padding-top: 20px;
  }
  .qb-sidebar {
    position: static;
    max-height: 260px;
  }
  .qb-sidebar__header {
    padding-bottom: 8px;
    flex-direction: row-reverse;
    justify-content: flex-end;
  }
  .qb-container--collapsed .qb-sidebar__header {
    justify-content: flex-end;
  }
  .qb-container--collapsed .qb-sidebar {
    /* 窄屏展开入口放在左侧，避开页面右上角的悬浮咨询入口。 */
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
    padding: 8px 12px;
  }
  .qb-sidebar__collapsed-label {
    padding: 0;
    font-size: 14px;
  }
  .qb-overview {
    gap: 16px;
    margin-bottom: 18px;
  }
  .qb-shortcuts {
    margin-right: 0;
  }
  .qb-overview h1 {
    font-size: 28px;
  }
  .qb-content {
    padding-top: 24px;
  }
  .qb-content__title {
    font-size: 23px;
  }
  .qb-content__header {
    gap: 12px;
    margin-bottom: 18px;
  }
  .qb-content__english {
    font-size: 15px;
  }
  .qb-difficulty-grid {
    gap: 8px;
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
  .qb-chapter-list {
    grid-template-columns: minmax(0, 1fr);
  }
  .qb-active-practice {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
