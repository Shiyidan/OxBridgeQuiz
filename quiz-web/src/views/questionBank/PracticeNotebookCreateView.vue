<!-- 练习本配置页：按全局考试类型创建规则，或恢复已有规则进行编辑。 -->
<template>
  <div class="notebook-create-page">
    <main class="notebook-create-container">
      <header class="create-page-header">
        <div>
          <span class="create-page-header__eyebrow">Create Practice Notebook</span>
          <h1>{{ isEditing ? '编辑练习本' : '新建练习本' }}</h1>
          <p>
            {{
              isEditing
                ? '修改只影响以后生成的练习，历史记录保持不变。'
                : '选择知识点并设置每次练习的题量、难度和时间。'
            }}
          </p>
        </div>
        <button type="button" class="create-page-back" @click="handleCancel">
          <span aria-hidden="true">←</span>
          <span>{{ reportReturnTo ? '返回诊断报告' : '返回练习本' }}</span>
        </button>
      </header>

      <form v-loading="pageLoading" class="notebook-form" @submit.prevent="handleSubmit">
        <section class="form-section form-section--name" aria-labelledby="notebook-name-title">
          <header class="form-section__header">
            <h2 id="notebook-name-title">练习本名称</h2>
          </header>
          <div class="notebook-name-grid">
            <label class="field-block">
              <el-input
                v-model="notebookName"
                :maxlength="PRACTICE_NOTEBOOK_NAME_MAX_LENGTH"
                placeholder="例如：代数与函数强化练习"
                show-word-limit
              />
            </label> 
          </div>
        </section>

        <section class="form-section" aria-labelledby="knowledge-selection-title">
          <header class="form-section__header">
            <h2 id="knowledge-selection-title">选择学科与知识点</h2>
            <p>从真实考纲树中选择。勾选学科或章节会同时选中它下面的全部叶子知识点。</p>
          </header>

          <div class="knowledge-picker">
            <section class="knowledge-pane knowledge-pane--tree" aria-label="考纲知识树">
              <header class="knowledge-pane__header">
                <strong>{{ activeExamType }} 考纲知识树</strong>
                <span>学科 → 章节 → 叶子知识点</span>
              </header>
              <div class="knowledge-tree-tip">
                <span aria-hidden="true">ⓘ</span>
                <span>父子级联：选中父级会选中全部后代；父级出现“—”表示只选中了其中一部分。</span>
              </div>
              <div class="knowledge-tree-scroll">
                <div v-if="syllabusLoading" class="knowledge-status">正在加载考纲...</div>
                <div v-else-if="!syllabusTree.length" class="knowledge-status">
                  当前考试暂无可选择的考纲知识点
                </div>
                <el-tree
                  v-else
                  ref="syllabusTreeRef"
                  :key="treeRenderKey"
                  :data="syllabusTree"
                  :props="treeProps"
                  node-key="code"
                  show-checkbox
                  :default-expanded-keys="defaultExpandedKeys"
                  :check-on-click-node="false"
                  @check="handleTreeCheck"
                >
                  <template #default="{ data }">
                    <div class="syllabus-node">
                      <span class="syllabus-node__copy">
                        <strong>{{ data.label }}</strong>
                        <small>{{ getNodeDescription(data) }}</small>
                      </span>
                      <code>{{ data.code }}</code>
                    </div>
                  </template>
                </el-tree>
              </div>
            </section>

            <section class="knowledge-pane knowledge-pane--selected" aria-label="已选知识点">
              <header class="knowledge-pane__header">
                <strong>已选择的叶子知识点</strong>
                <span>
                  {{ selectedKnowledgePoints.length }} 项 · {{ selectedSubjectCount }} 个学科 ·
                  {{ selectedQuestionTotal === null ? '统计中' : `${selectedQuestionTotal} 道题` }}
                </span>
              </header>
              <div v-if="selectedKnowledgePoints.length" class="selected-groups">
                <div class="selected-subject-tabs" role="tablist" aria-label="已选科目">
                  <button
                    v-for="group in selectedGroups"
                    :key="group.subjectLabel"
                    type="button"
                    role="tab"
                    :class="{ 'is-active': activeSelectedSubject === group.subjectLabel }"
                    :aria-selected="activeSelectedSubject === group.subjectLabel"
                    @click="activeSelectedSubject = group.subjectLabel"
                  >
                    <strong>{{ group.subjectLabel }}</strong>
                    <span>{{ group.items.length }} 项</span>
                  </button>
                </div>
                <section
                  v-if="activeSelectedGroup"
                  :key="activeSelectedGroup.subjectLabel"
                  class="selected-group"
                  role="tabpanel"
                >
                  <article
                    v-for="item in activeSelectedGroup.items"
                    :key="item.code"
                    class="selected-knowledge-item"
                  >
                    <div>
                      <strong>{{ item.label }}</strong>
                      <small>{{ item.parentLabel }} · {{ item.code }}</small>
                    </div>
                    <span class="selected-knowledge-item__tag">
                      {{ item.questionCount === null ? '统计中' : `${item.questionCount} 道题` }}
                    </span>
                    <button
                      type="button"
                      :aria-label="`取消选择 ${item.label}`"
                      @click="handleRemoveKnowledgePoint(item.code)"
                    >
                      ×
                    </button>
                  </article>
                </section>
              </div>
              <div v-else class="selected-empty">
                <span aria-hidden="true">＋</span>
                <strong>尚未选择知识点</strong>
                <p>请在左侧考纲树中勾选学科、章节或叶子知识点。</p>
              </div>
              <button
                v-if="selectedKnowledgePoints.length"
                type="button"
                class="selected-clear"
                @click="handleClearSelected"
              >
                清空当前科目
              </button>
            </section>
          </div>
        </section>

        <section class="form-section" aria-labelledby="practice-settings-title">
          <header class="form-section__header">
            <h2 id="practice-settings-title">每次怎么练</h2>
            <p>这里设置每次生成的一组题，练习本本身没有固定总题数。</p>
          </header>

          <div class="practice-setting-row">
            <div class="practice-setting-row__label">
              <strong>每次题量</strong>
              <small>题目会在已选学科与知识点之间组合。</small>
            </div>
            <div class="choice-group" aria-label="每次题量">
              <button
                v-for="count in questionCountOptions"
                :key="count"
                type="button"
                :class="{ 'is-selected': questionCount === count }"
                :aria-pressed="questionCount === count"
                @click="questionCount = count"
              >
                {{ count }}题
              </button>
            </div>
          </div>

          <div class="practice-setting-row">
            <div class="practice-setting-row__label">
              <strong>难度</strong>
              <small>用常用组合减少复杂设置。</small>
            </div>
            <div class="choice-group" aria-label="练习难度">
              <button
                v-for="option in difficultyOptions"
                :key="option.value"
                type="button"
                :class="{ 'is-selected': difficultyMode === option.value }"
                :aria-pressed="difficultyMode === option.value"
                @click="difficultyMode = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <div class="practice-setting-row">
            <div class="practice-setting-row__label">
              <strong>时间</strong>
              <small>限时只影响本组练习。</small>
            </div>
            <div class="choice-group choice-group--time" aria-label="练习时间">
              <button
                v-for="option in durationOptions"
                :key="option.value"
                type="button"
                :class="{ 'is-selected': durationMode === option.value }"
                :aria-pressed="durationMode === option.value"
                @click="durationMode = option.value"
              >
                {{ option.label }}
              </button>
              <el-input-number
                v-if="durationMode === 'custom'"
                v-model="customDurationMinutes"
                :min="5"
                :max="180"
                :step="5"
                controls-position="right"
                aria-label="自定义练习分钟数"
              />
            </div>
          </div>

          <div class="practice-setting-row">
            <div class="practice-setting-row__label">
              <strong>题目选择</strong>
              <small>关闭后允许出现以前做过的题。</small>
            </div>
            <el-checkbox v-model="unseenFirst">未做过的新题优先</el-checkbox>
          </div>
        </section>

        <footer class="notebook-form__actions">
          <button type="button" class="button_cancel" @click="handleCancel">取消</button>
          <button type="submit" class="button_primary" :disabled="saving || pageLoading">
            {{ saving ? '保存中...' : isEditing ? '保存修改' : '创建练习本' }}
          </button>
        </footer>
      </form>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type TreeInstance } from 'element-plus'
import {
  getKnowledgePointQuestionCounts,
  getSyllabusData,
  type SyllabusNode,
} from '@/api/questionBank'
import { useAuthStore, type ActiveExamType } from '@/stores/auth'
import {
  createPracticeNotebook,
  getPracticeNotebook,
  updatePracticeNotebook,
  type PracticeDifficultyMode,
} from '@/api/practiceNotebook'

type DifficultyMode = PracticeDifficultyMode
type DurationMode = 'unlimited' | '20' | '24' | '30' | 'custom'

interface IndexedSyllabusNode {
  node: SyllabusNode
  ancestors: SyllabusNode[]
}

interface SelectedKnowledgePoint {
  code: string
  label: string
  parentLabel: string
  subjectLabel: string
  questionCount: number | null
}

interface SelectedKnowledgeGroup {
  subjectLabel: string
  items: SelectedKnowledgePoint[]
}

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const syllabusTreeRef = ref<TreeInstance>()
const syllabusTree = ref<SyllabusNode[]>([])
const defaultExpandedKeys = ref<string[]>([])
const selectedKnowledgePoints = ref<SelectedKnowledgePoint[]>([])
const selectedQuestionTotal = ref<number | null>(0)
const activeSelectedSubject = ref('')
const syllabusLoading = ref(false)
const treeRenderKey = ref(0)
const notebookName = ref('')
const questionCount = ref(12)
const difficultyMode = ref<DifficultyMode>('mixed')
const durationMode = ref<DurationMode>('24')
const customDurationMinutes = ref(45)
const unseenFirst = ref(true)
const pageLoading = ref(false)
const saving = ref(false)
const pendingCheckedCodes = ref<string[]>([])
const editingExamType = ref<ActiveExamType | null>(null)
const syllabusIndex = new Map<string, IndexedSyllabusNode>()
let syllabusLoadSequence = 0
let knowledgeCountSequence = 0
let knowledgeCountTimer: ReturnType<typeof setTimeout> | null = null
let pageInitialized = false

const notebookId = computed(() => String(route.params.id || '').trim())
const isEditing = computed(
  () => route.name === 'practice-notebook-edit' && Boolean(notebookId.value),
)

// 只接受本站诊断报告路由作为返回地址，避免查询参数被用于任意外部跳转。
const reportReturnTo = computed(() => {
  const value = queryString('returnTo')
  return /^\/exam-result\/[^/]+\/(?:esat|tmua)(?:\?.*)?$/.test(value) ? value : ''
})

const treeProps = { children: 'children', label: 'label' }
const PRACTICE_NOTEBOOK_NAME_MAX_LENGTH = 60
const questionCountOptions = [5, 8, 12, 16, 20]
const difficultyOptions: Array<{ value: DifficultyMode; label: string }> = [
  { value: 'easy', label: '简单为主' },
  { value: 'medium', label: '中等为主' },
  { value: 'hard', label: '困难为主' },
  { value: 'mixed', label: '均衡组合' },
]
const durationOptions: Array<{ value: DurationMode; label: string }> = [
  { value: 'unlimited', label: '不限时' },
  { value: '20', label: '20分钟' },
  { value: '24', label: '24分钟' },
  { value: '30', label: '30分钟' },
  { value: 'custom', label: '自定义' },
]

// 新建页始终读取顶部导航的全局考试类型，不提供第二个考试选择器。
const activeExamType = computed<ActiveExamType>(() => auth.activeExamType)

// 右侧叶子知识点按所属学科分组，保持与左侧考纲层级一致。
const selectedGroups = computed<SelectedKnowledgeGroup[]>(() => {
  const groups = new Map<string, SelectedKnowledgePoint[]>()
  for (const item of selectedKnowledgePoints.value) {
    const currentItems = groups.get(item.subjectLabel) || []
    currentItems.push(item)
    groups.set(item.subjectLabel, currentItems)
  }
  return [...groups.entries()].map(([subjectLabel, items]) => ({ subjectLabel, items }))
})

// 右侧一次只展示当前科目的知识点，科目被清空后自动切换到仍有内容的第一项。
const activeSelectedGroup = computed(() =>
  selectedGroups.value.find((group) => group.subjectLabel === activeSelectedSubject.value),
)

// 已选学科数量由叶子知识点分组派生，避免父级半选状态造成重复统计。
const selectedSubjectCount = computed(() => selectedGroups.value.length)

watch(
  selectedGroups,
  (groups) => {
    if (!groups.length) {
      activeSelectedSubject.value = ''
      return
    }
    if (!groups.some((group) => group.subjectLabel === activeSelectedSubject.value)) {
      activeSelectedSubject.value = groups[0]?.subjectLabel || ''
    }
  },
  { immediate: true },
)

// 建立每个考纲节点到祖先路径的索引，供右侧列表显示学科和直接父级。
function indexSyllabusNodes(nodes: SyllabusNode[], ancestors: SyllabusNode[] = []): void {
  for (const node of nodes) {
    syllabusIndex.set(node.code, { node, ancestors })
    if (node.children?.length) indexSyllabusNodes(node.children, [...ancestors, node])
  }
}

// 递归统计节点下叶子知识点数量，供左侧树展示层级摘要。
function countLeafNodes(node: SyllabusNode): number {
  if (!node.children?.length) return 1
  return node.children.reduce((total, child) => total + countLeafNodes(child), 0)
}

// 报告可以推荐章节级知识点；创建页将其展开为后端允许保存的叶子知识点代码。
function resolveLeafKnowledgePointCodes(codes: string[]): string[] {
  const leafCodes: string[] = []

  // 递归只收集最终可用于组卷的叶子节点，父级本身不进入保存参数。
  const appendLeaves = (node: SyllabusNode): void => {
    if (!node.children?.length) {
      leafCodes.push(node.code)
      return
    }
    node.children.forEach(appendLeaves)
  }
  for (const code of codes) {
    const indexedNode = syllabusIndex.get(code)?.node
    if (indexedNode) appendLeaves(indexedNode)
  }
  return Array.from(new Set(leafCodes))
}

// 节点副标题区分学科、章节和叶子知识点，帮助用户理解父子级联范围。
function getNodeDescription(node: SyllabusNode): string {
  if (!node.children?.length) {
    const parent = syllabusIndex.get(node.code)?.ancestors.at(-1)
    return `${parent?.label || '当前章节'} · 叶子知识点`
  }
  const leafCount = countLeafNodes(node)
  const containsChapter = node.children.some((child) => Boolean(child.children?.length))
  return containsChapter
    ? `${node.children.length}个章节 · ${leafCount}个叶子知识点`
    : `${leafCount}个叶子知识点`
}

// Element Plus 树的勾选结果只提取叶子节点，父级和半选节点不写入右侧清单。
function syncSelectedKnowledgePoints(): void {
  const checkedLeaves = (syllabusTreeRef.value?.getCheckedNodes(true, false) ||
    []) as SyllabusNode[]
  const existingCounts = new Map(
    selectedKnowledgePoints.value.map((item) => [item.code, item.questionCount]),
  )
  selectedKnowledgePoints.value = checkedLeaves.map((node) => {
    const ancestors = syllabusIndex.get(node.code)?.ancestors || []
    return {
      code: node.code,
      label: node.label,
      subjectLabel: ancestors[0]?.label || node.label,
      parentLabel: ancestors.at(-1)?.label || ancestors[0]?.label || '当前学科',
      questionCount: existingCounts.get(node.code) ?? null,
    }
  })
  scheduleKnowledgeCountLoad()
}

// 批量题量请求完成后同时更新右侧各知识点题量和跨知识点去重总数。
async function loadKnowledgePointCounts(
  requestSequence: number,
  codes: string[],
  examType: ActiveExamType,
): Promise<void> {
  try {
    const data = await getKnowledgePointQuestionCounts(codes, examType)
    if (requestSequence !== knowledgeCountSequence || examType !== activeExamType.value) return
    selectedKnowledgePoints.value = selectedKnowledgePoints.value.map((item) => ({
      ...item,
      questionCount: data.counts[item.code] || 0,
    }))
    selectedQuestionTotal.value = data.total
  } catch {
    if (requestSequence !== knowledgeCountSequence) return
    selectedKnowledgePoints.value = selectedKnowledgePoints.value.map((item) => ({
      ...item,
      questionCount: 0,
    }))
    selectedQuestionTotal.value = 0
  }
}

// 勾选变化使用短防抖合并为一次批量统计，父级级联不会产生逐知识点请求。
function scheduleKnowledgeCountLoad(): void {
  if (knowledgeCountTimer) clearTimeout(knowledgeCountTimer)
  const requestSequence = ++knowledgeCountSequence
  const codes = selectedKnowledgePoints.value.map((item) => item.code)
  if (!codes.length) {
    selectedQuestionTotal.value = 0
    knowledgeCountTimer = null
    return
  }
  selectedQuestionTotal.value = null
  const requestedExamType = activeExamType.value
  knowledgeCountTimer = setTimeout(() => {
    knowledgeCountTimer = null
    void loadKnowledgePointCounts(requestSequence, codes, requestedExamType)
  }, 180)
}

// 左侧每次级联勾选完成后刷新右侧叶子知识点列表。
function handleTreeCheck(): void {
  syncSelectedKnowledgePoints()
}

// 右侧取消单个知识点时同步撤销左侧勾选及其父级选中状态。
function handleRemoveKnowledgePoint(code: string): void {
  syllabusTreeRef.value?.setChecked(code, false, false)
  syncSelectedKnowledgePoints()
}

// 清空操作只取消当前科目的知识点，其他科目配置和左侧勾选保持不变。
function handleClearSelected(): void {
  const currentItems = activeSelectedGroup.value?.items || []
  for (const item of currentItems) {
    syllabusTreeRef.value?.setChecked(item.code, false, false)
  }
  syncSelectedKnowledgePoints()
}

// 当前考试变化后重新读取对应考纲，并清空另一考试下的已选知识点。
async function loadSyllabus(): Promise<void> {
  const requestSequence = ++syllabusLoadSequence
  const requestedExamType = activeExamType.value
  syllabusLoading.value = true
  syllabusTree.value = []
  selectedKnowledgePoints.value = []
  scheduleKnowledgeCountLoad()
  syllabusIndex.clear()
  try {
    const nodes = await getSyllabusData(requestedExamType)
    if (requestSequence !== syllabusLoadSequence || requestedExamType !== activeExamType.value)
      return
    const visibleNodes = nodes[0]?.children?.length ? nodes[0].children : nodes
    syllabusTree.value = visibleNodes
    indexSyllabusNodes(visibleNodes)
    defaultExpandedKeys.value = visibleNodes[0] ? [visibleNodes[0].code] : []
    treeRenderKey.value += 1

    // 树在加载态下使用 v-if 隐藏，先结束加载让组件真正挂载，再恢复报告预选项。
    syllabusLoading.value = false
    await nextTick()
    if (requestSequence !== syllabusLoadSequence || requestedExamType !== activeExamType.value)
      return
    const checkedLeafCodes = resolveLeafKnowledgePointCodes(pendingCheckedCodes.value)
    syllabusTreeRef.value?.setCheckedKeys(checkedLeafCodes)
    if (checkedLeafCodes.length) syncSelectedKnowledgePoints()
  } catch {
    if (requestSequence === syllabusLoadSequence) syllabusTree.value = []
  } finally {
    if (requestSequence === syllabusLoadSequence) syllabusLoading.value = false
  }
}

// 从报告进入时返回原报告，其余入口仍回练习本列表。
function handleCancel(): void {
  void router.push(reportReturnTo.value || '/practice-notebook')
}

// Vue Router 查询参数统一收敛为单个字符串，数组只读取第一项。
function queryString(key: string): string {
  const value = route.query[key]
  return String(Array.isArray(value) ? value[0] || '' : value || '').trim()
}

// 诊断报告建议映射到练习本已有的稳定选项，页面不会仅凭链接自动保存。
function applyDiagnosticReportPrefill(): void {
  if (queryString('source') !== 'diagnostic-report' || isEditing.value) return

  const examType = queryString('examType').toUpperCase()
  if (examType === 'ESAT' || examType === 'TMUA') {
    auth.setActiveExamType(examType)
  }

  const suggestedName = queryString('name')
  if (suggestedName) {
    notebookName.value = suggestedName.slice(0, PRACTICE_NOTEBOOK_NAME_MAX_LENGTH)
  }

  const requestedCount = Number(queryString('questionCount'))
  if (Number.isFinite(requestedCount)) {
    questionCount.value = questionCountOptions.reduce((nearest, option) => (
      Math.abs(option - requestedCount) < Math.abs(nearest - requestedCount) ? option : nearest
    ))
  }

  const difficultyMap: Record<string, DifficultyMode> = {
    low: 'easy',
    medium: 'medium',
    high: 'hard',
  }
  difficultyMode.value = difficultyMap[queryString('difficulty')] || difficultyMode.value

  const requestedDuration = Math.round(Number(queryString('durationMinutes')))
  if (Number.isFinite(requestedDuration) && requestedDuration >= 5) {
    const normalizedDuration = Math.min(180, requestedDuration)
    const knownDuration = String(normalizedDuration)
    durationMode.value = ['20', '24', '30'].includes(knownDuration)
      ? (knownDuration as DurationMode)
      : 'custom'
    customDurationMinutes.value = normalizedDuration
  }

  pendingCheckedCodes.value = queryString('knowledgePointCodes')
    .split(',')
    .map((code) => code.trim())
    .filter(Boolean)
}

// 表单保存真实配置；后端再次校验知识点归属和稳定选项，成功后回到当前考试列表。
async function handleSubmit(): Promise<void> {
  if (saving.value) return
  if (!notebookName.value.trim()) {
    ElMessage.warning('请输入练习本名称')
    return
  }
  if (!selectedKnowledgePoints.value.length) {
    ElMessage.warning('请至少选择一个叶子知识点')
    return
  }
  if (selectedQuestionTotal.value !== null && selectedQuestionTotal.value < questionCount.value) {
    ElMessage.warning(`当前范围只有 ${selectedQuestionTotal.value} 道题，请减少题量或增加知识点`)
    return
  }
  const durationMinutes =
    durationMode.value === 'unlimited'
      ? null
      : durationMode.value === 'custom'
        ? customDurationMinutes.value
        : Number(durationMode.value)
  const payload = {
    name: notebookName.value.trim(),
    examType: activeExamType.value,
    knowledgePointCodes: selectedKnowledgePoints.value.map((item) => item.code),
    questionCount: questionCount.value,
    difficultyMode: difficultyMode.value,
    durationMinutes,
    unseenFirst: unseenFirst.value,
  }
  saving.value = true
  try {
    if (isEditing.value) await updatePracticeNotebook(notebookId.value, payload)
    else await createPracticeNotebook(payload)
    ElMessage.success(isEditing.value ? '练习本已更新' : '练习本已创建')
    await router.push('/practice-notebook')
  } catch {
    // 公共请求层展示后端业务提示；表单内容保留供用户修改或重试。
  } finally {
    saving.value = false
  }
}

// 编辑中的练习本不能转换考试类型；导航切换后退出编辑并进入新考试列表。
watch(activeExamType, () => {
  if (!pageInitialized) return
  if (isEditing.value && editingExamType.value && activeExamType.value !== editingExamType.value) {
    ElMessage.info('练习本考试类型不可修改，已返回新的考试类型列表')
    void router.push('/practice-notebook')
    return
  }
  pendingCheckedCodes.value = []
  void loadSyllabus()
})

// 编辑页先恢复保存配置，再加载对应考纲并重建勾选；新建页直接使用导航考试类型。
onMounted(async () => {
  pageLoading.value = true
  try {
    await auth.ensureMemberContext()
  } catch {
    // 会员上下文失败时继续使用全局默认 TMUA，公共请求层负责展示请求错误。
  }
  try {
    if (isEditing.value) {
      const notebook = await getPracticeNotebook(notebookId.value)
      editingExamType.value = notebook.examType
      if (activeExamType.value !== notebook.examType) auth.setActiveExamType(notebook.examType)
      notebookName.value = notebook.name
      questionCount.value = notebook.questionCount
      difficultyMode.value = notebook.difficultyMode
      durationMode.value =
        notebook.durationMinutes === null
          ? 'unlimited'
          : ['20', '24', '30'].includes(String(notebook.durationMinutes))
            ? (String(notebook.durationMinutes) as DurationMode)
            : 'custom'
      if (durationMode.value === 'custom' && notebook.durationMinutes) {
        customDurationMinutes.value = notebook.durationMinutes
      }
      unseenFirst.value = notebook.unseenFirst
      pendingCheckedCodes.value = notebook.knowledgePointCodes
    } else {
      applyDiagnosticReportPrefill()
    }
    await loadSyllabus()
    // 初次考纲与报告预选项恢复完成后，才允许顶部考试切换监听接管页面状态。
    pageInitialized = true
  } catch {
    if (isEditing.value) await router.replace('/practice-notebook')
  } finally {
    pageLoading.value = false
  }
})

// 离开新建页时取消尚未发出的统计请求定时器。
onBeforeUnmount(() => {
  if (knowledgeCountTimer) clearTimeout(knowledgeCountTimer)
  knowledgeCountTimer = null
  knowledgeCountSequence += 1
})
</script>

<style scoped>
.notebook-create-page {
  min-height: calc(100vh - var(--nav-height));
  color: var(--color-ink);
}

.notebook-create-container {
  width: var(--fluid-shell-width);
  margin: 0 auto;
  padding: 40px 0 96px;
}

.create-page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.create-page-header__eyebrow {
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

.create-page-header__eyebrow::before {
  width: 24px;
  height: 1px;
  background: var(--color-ink);
  content: '';
}

.create-page-header h1 {
  margin: 0;
  font-size: var(--text-4xl);
  font-weight: var(--weight-bold);
}

.create-page-header p {
  margin: 10px 0 0;
  color: var(--color-ink-soft);
}

.create-page-back {
  height: 46px;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-ink);
  font: inherit;
  font-weight: var(--weight-semi);
  cursor: pointer;
}

.create-page-back:hover,
.create-page-back:focus-visible {
  border-color: var(--color-ink);
  background: var(--color-hover);
}

.notebook-form {
  padding: 0 28px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.form-section {
  padding: 32px 0;
  border-bottom: 1px solid var(--color-line);
}

.form-section__header {
  margin-bottom: 24px;
}

.form-section__header h2 {
  margin: 0 0 6px;
  font-size: var(--text-2xl);
  font-weight: var(--weight-bold);
}

.notebook-name-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.field-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--color-ink);
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
}

.field-block :deep(.el-input__wrapper) {
  min-height: 54px;
  border-radius: var(--radius-md);
  box-shadow: 0 0 0 1px var(--color-line) inset;
}

.field-block :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--color-ink) inset;
}

.knowledge-picker {
  height: 520px;
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(380px, 2fr);
  border: 1px solid var(--color-line);
  overflow: hidden;
}

.knowledge-pane {
  height: 100%;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-surface);
}

.knowledge-pane--tree {
  border-right: 1px solid var(--color-line);
}

.knowledge-pane__header {
  min-height: 52px;
  padding: 0 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid var(--color-line);
}

.knowledge-pane__header strong {
  font-size: var(--text-sm);
}

.knowledge-pane__header span {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  white-space: nowrap;
}

.knowledge-tree-tip {
  min-height: 44px;
  padding: 0 18px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
}

.knowledge-tree-scroll {
  min-height: 0;
  flex: 1;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-gutter: stable;
  overscroll-behavior: contain;
}

.selected-groups {
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.knowledge-status,
.selected-empty {
  min-height: 220px;
  padding: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: var(--color-ink-muted);
  text-align: center;
}

.knowledge-tree-scroll :deep(.el-tree) {
  background: transparent;
  color: var(--color-ink);
}

.knowledge-tree-scroll :deep(.el-tree-node__content) {
  min-height: 58px;
  height: auto;
  padding-right: 16px;
  border-bottom: 1px solid var(--color-line-soft);
}

.knowledge-tree-scroll :deep(.el-tree-node__content:hover) {
  background: var(--color-hover);
}

.knowledge-tree-scroll :deep(.el-tree-node.is-checked > .el-tree-node__content) {
  background: rgba(42, 157, 143, 0.12);
}

.knowledge-tree-scroll :deep(.el-checkbox__input.is-checked .el-checkbox__inner),
.knowledge-tree-scroll :deep(.el-checkbox__input.is-indeterminate .el-checkbox__inner) {
  border-color: var(--color-success);
  background: var(--color-success);
}

.syllabus-node {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.syllabus-node__copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.syllabus-node__copy strong {
  overflow: hidden;
  font-size: var(--text-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.syllabus-node__copy small,
.selected-knowledge-item small {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.syllabus-node code {
  flex: 0 0 auto;
  color: var(--color-ink-muted);
  font-family: inherit;
  font-size: 11px;
}

.selected-subject-tabs {
  min-height: 52px;
  display: flex;
  align-items: center;
  overflow-x: auto;
  overflow-y: hidden;
  border-bottom: 1px solid var(--color-line-soft);
  scrollbar-width: thin;
}

.selected-subject-tabs button {
  min-width: max-content;
  min-height: 52px;
  padding: 0 18px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: 0;
  border-right: 1px solid var(--color-line-soft);
  background: transparent;
  color: var(--color-ink-soft);
  cursor: pointer;
}

.selected-subject-tabs button:hover {
  background: var(--color-hover);
}

.selected-subject-tabs button.is-active {
  box-shadow: 0 -2px 0 #8b919b inset;
  background: #f0f1f3;
  color: var(--color-ink);
}

.selected-subject-tabs strong {
  font-size: var(--text-sm);
  white-space: nowrap;
}

.selected-subject-tabs span {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  white-space: nowrap;
}

.selected-group {
  min-height: 0;
  flex: 1;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-gutter: stable;
  overscroll-behavior: contain;
}

.selected-knowledge-item {
  min-height: 64px;
  padding: 10px 18px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 28px;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--color-line-soft);
}

.selected-knowledge-item > div {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.selected-knowledge-item > div strong {
  overflow: hidden;
  font-size: var(--text-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-knowledge-item__tag {
  padding: 6px 10px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-pill);
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
  white-space: nowrap;
}

.selected-knowledge-item button {
  width: 28px;
  height: 28px;
  border: 0;
  background: transparent;
  color: var(--color-ink-muted);
  font-size: 20px;
  cursor: pointer;
}

.selected-knowledge-item button:hover {
  color: var(--color-ink);
}

.selected-empty {
  flex: 1;
}

.selected-empty > span {
  font-size: 28px;
}

.selected-empty strong {
  margin-top: 10px;
  color: var(--color-ink-soft);
}

.selected-empty p {
  max-width: 300px;
  margin: 6px 0 0;
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

.selected-clear {
  margin: 12px 18px;
  align-self: flex-end;
  border: 0;
  background: transparent;
  color: var(--color-ink-soft);
  font: inherit;
  font-size: var(--text-sm);
  cursor: pointer;
}

.selected-clear:hover {
  color: var(--color-ink);
  text-decoration: underline;
}

.practice-setting-row {
  min-height: 88px;
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid var(--color-line);
}

.practice-setting-row:last-child {
  border-bottom: 0;
}

.practice-setting-row__label {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.practice-setting-row__label strong {
  font-size: var(--text-sm);
}

.practice-setting-row__label small {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.choice-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.choice-group button {
  min-width: 66px;
  height: 40px;
  padding: 0 14px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-ink);
  font: inherit;
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  cursor: pointer;
}

.choice-group button:hover {
  border-color: var(--color-ink);
}

.choice-group button.is-selected {
  border-color: var(--color-ink);
  background: var(--color-ink);
  color: var(--color-ink-inverse);
}

.choice-group--time :deep(.el-input-number) {
  width: 150px;
}

.practice-setting-row :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  border-color: var(--color-success);
  background: var(--color-success);
}

.practice-setting-row :deep(.el-checkbox__label) {
  color: var(--color-ink);
}

.notebook-form__actions {
  padding: 24px 0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.notebook-form__actions button {
  min-width: 116px;
}

@media (max-width: 1000px) {
  .knowledge-picker {
    height: auto;
    grid-template-columns: 1fr;
  }

  .knowledge-pane--tree {
    height: 520px;
    border-right: 0;
    border-bottom: 1px solid var(--color-line);
  }

  .knowledge-pane--selected {
    min-height: 320px;
    max-height: 520px;
  }
}

@media (max-width: 760px) {
  .create-page-header,
  .notebook-name-grid {
    align-items: flex-start;
    grid-template-columns: 1fr;
  }

  .practice-setting-row {
    padding: 18px 0;
    grid-template-columns: 1fr;
  }
}
</style>
