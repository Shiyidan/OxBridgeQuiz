<!-- 知识点学习页面：负责讲义、学习权益与点亮入口，考纲和个人进度复用公共工作区。 -->
<template>
  <section ref="workspaceRef" class="knowledge-learning" aria-label="知识点学习">
    <LearningScopeHeader
      :breadcrumbs="selectedBreadcrumb"
      :title="currentScopeCnLabel"
      :title-en="currentScopeEnLabel"
      @select="handleKnowledgeSelect"
      :show-title="learningAllowed && !activeKnowledgeLesson"
      :variant="activeKnowledgeLesson ? 'lesson' : 'index'"
    />

    <div v-if="completionError" class="qb-completion-notice" role="status">
      点亮状态暂时无法读取，学习内容仍可正常查看。
      <AppButton size="mini" type="secondary" @click="loadLearningCompletions">重试</AppButton>
    </div>
    <div
      v-if="learningChecking || scopeLoading"
      class="qb-learning-loading"
      role="status"
      aria-label="正在加载学习内容"
      aria-busy="true"
    >
      <el-skeleton :rows="6" />
    </div>
    <div v-else-if="syllabusError" class="qb-learning-error" role="alert">
      <p>考纲暂时无法加载，请重试。</p>
      <AppButton type="secondary" size="small" @click="retrySyllabus">重新加载</AppButton>
    </div>
    <div v-else-if="!selectedNode" class="qb-learning-index" role="status">
      <h3>当前范围暂无知识讲解</h3>
      <p>可以在考纲中选择其他科目或知识点。</p>
    </div>
    <div v-else-if="learningError" class="qb-learning-error" role="alert">
      <p>
        {{
          learningResourceError
            ? '学习资源加载失败，请刷新页面。若仍失败，可尝试强制刷新（Ctrl＋Shift＋R）。'
            : '学习访问状态暂时获取失败，请重试。'
        }}
      </p>
      <AppButton type="secondary" size="small" @click="retryLearningAccess">{{
        learningResourceError ? '刷新页面' : '重新加载'
      }}</AppButton>
    </div>
    <div v-else-if="!learningAllowed" class="qb-locked-learning">
      <LockedLearningPreview class="qb-locked-learning__preview" />
      <div class="qb-locked-learning__veil" aria-hidden="true"></div>
      <section class="qb-learning-gate" aria-label="学习平台权益">
        <div class="qb-learning-gate__heading">
          <span class="qb-learning-gate__lock" aria-hidden="true"><Lock /></span>
          <span class="qb-learning-gate__badge">{{ activeExamType }} · 学习年卡</span>
        </div>
        <h3>解锁知识背后的方法</h3>
        <p class="qb-learning-gate__intro">
          知识点讲解、精选例题与即时自测，串起从理解到应用的完整学习过程。
        </p>
        <div class="qb-learning-gate__features">
          <div>
            <Reading aria-hidden="true" />
            <strong>知识点讲解</strong>
            <p>理清概念与方法，建立知识联系</p>
          </div>
          <div>
            <EditPen aria-hidden="true" />
            <strong>精选例题</strong>
            <p>跟随解题思路，理解关键步骤</p>
          </div>
          <div>
            <CircleCheck aria-hidden="true" />
            <strong>即时自测</strong>
            <p>学完及时检验，找到薄弱环节</p>
          </div>
        </div>
        <div class="qb-learning-gate__footer">
          <AppButton :icon="ArrowRight" icon-position="right" @click="openLearningPayment">
            开通学习平台年卡
          </AppButton>
        </div>
      </section>
    </div>
    <KeepAlive :max="1">
      <KnowledgeLessonPanel
        v-if="learningAllowed && activeKnowledgeLesson"
        :key="JSON.stringify([auth.user?.id, activeExamType, activeKnowledgeLesson.code])"
        :lesson="activeKnowledgeLesson"
        :selected-code="selectedNodeCode"
        :exam-type="activeExamType"
        :completed-codes="completedCodes"
        :completion-disabled="completionDisabled"
        :completion-locked-codes="completionLockedCodes"
        :completion-busy="Boolean(completionSavingCode)"
        @light="toggleLearningCompletion"
        @select="handleKnowledgeSelect"
        @practise="openPracticeMode"
      />
    </KeepAlive>
    <div v-if="learningAllowed && !activeKnowledgeLesson" class="qb-learning-index">
      <template v-if="availableLearningChapters.length">
        <h3>选择章节开始学习</h3>
        <div class="qb-chapter-list">
          <button
            v-for="(chapter, index) in availableLearningChapters"
            :key="chapter.code"
            type="button"
            @click="handleKnowledgeSelect(chapter.code)"
          >
            <span class="qb-chapter-list__number">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="qb-chapter-list__name"
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

    <PaymentModal
      v-model="paymentVisible"
      :default-exam-type="paymentExamType"
      default-plan-id="annual_learning"
      @paid="handlePaymentSuccess"
    />
  </section>
</template>

<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onBeforeUnmount,
  onErrorCaptured,
  ref,
  shallowRef,
  watch,
} from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ArrowRight, CircleCheck, EditPen, Lock, Reading } from '@element-plus/icons-vue'
import AppButton from '@/components/AppButton.vue'
import PaymentModal from '@/components/PaymentModal.vue'
import LearningScopeHeader from '@/components/knowledge/LearningScopeHeader.vue'
import { useLearningScope } from '@/composables/useLearningScope'
import { useLearningWorkspaceStore } from '@/stores/learningWorkspace'
import { useAuthStore, type ActiveExamType } from '@/stores/auth'
import { isFreeLearningScope } from '@/constants/freeLearningAccess'
import { getMember } from '@/api/member'
import type { SyllabusNode } from '@/api/questionBank'

// 授权后同时等待讲义及其样式资源，加载失败使用页面内的恢复入口。
function loadKnowledgeLessonPanel() {
  return import('@/components/knowledge/KnowledgeLessonPanel.vue')
}
const KnowledgeLessonPanel = defineAsyncComponent(loadKnowledgeLessonPanel)
const LockedLearningPreview = defineAsyncComponent(
  () => import('@/components/knowledge/LockedLearningPreview.vue'),
)
const auth = useAuthStore()
const router = useRouter()
const workspace = useLearningWorkspaceStore()
const {
  isActive,
  loading: scopeLoading,
  ready,
  selectedCode: selectedNodeCode,
  selectedNode,
  title: currentScopeCnLabel,
  titleEn: currentScopeEnLabel,
  breadcrumbs: selectedBreadcrumb,
  selectKnowledge: handleKnowledgeSelect,
} = useLearningScope('learning')
const {
  syllabusLoading,
  syllabusError,
  completedCodes,
  completionError,
  completionSavingCode,
  completionDisabled,
  lockedCodes: completionLockedCodes,
} = storeToRefs(workspace)
const workspaceRef = ref<HTMLElement>()
const paymentVisible = ref(false)
const paymentExamType = ref<ActiveExamType>(auth.activeExamType)
const learningChecking = ref(false)
const learningError = ref(false)
const learningResourceError = ref(false)
const learningAllowed = ref(false)
const learningContent = shallowRef<typeof import('@/content/knowledge') | null>(null)
let learningRequest = 0
// 学习页统一承接导航栏的考试类型。
const activeExamType = computed(() => auth.activeExamType)
// 正文和考纲中的灯泡共用按账号隔离的进度。
const toggleLearningCompletion = workspace.toggleCompletion
// 点亮状态读取失败只重试个人上下文，不重复创建页面状态。
const loadLearningCompletions = workspace.loadPersonal

// 在考试、账号、范围和可见任务变化时撤销旧授权，迟到的响应不得恢复旧讲义。
async function refreshLearningAccess(): Promise<void> {
  const request = ++learningRequest
  const exam = activeExamType.value
  const code = selectedNodeCode.value
  learningAllowed.value = false
  learningContent.value = null
  learningChecking.value = false
  learningError.value = false
  learningResourceError.value = false
  if (!isActive.value || !ready.value) return
  const freeScope = isFreeLearningScope(exam, code)
  if (!freeScope && !auth.isLoggedIn) return
  learningChecking.value = true
  try {
    const context = auth.isLoggedIn ? await getMember() : null
    const memberAllowed = Boolean(context?.isAdmin || context?.quotas[exam]?.learningAccess)
    if (request !== learningRequest) return
    workspace.memberAllowed = memberAllowed
    if (!freeScope && !memberAllowed) return
    const [content] = await Promise.all([
      memberAllowed ? import('@/content/knowledge') : import('@/content/knowledge/freeLessons'),
      loadKnowledgeLessonPanel(),
    ]).catch((error: unknown) => {
      if (request === learningRequest) learningResourceError.value = true
      throw error
    })
    if (request !== learningRequest) return
    learningContent.value = content
    learningAllowed.value = true
  } catch {
    if (request === learningRequest) learningError.value = true
  } finally {
    if (request === learningRequest) learningChecking.value = false
  }
}
// 接口错误保留页面重试；浏览器模块缓存失败则重新加载当前地址。
function retryLearningAccess(): void {
  if (learningResourceError.value) window.location.reload()
  else void refreshLearningAccess()
}
// 考纲失败与会员门槛分开呈现，避免读取失败时误导用户购买。
function retrySyllabus(): void {
  void workspace.loadSyllabus(true).catch(() => undefined)
}
// 图示按需加载失败同样回到学习资源恢复入口。
onErrorCaptured((error) => {
  if (
    !isActive.value ||
    !/Failed to fetch dynamically imported module|Unable to preload CSS|Importing a module script failed|error loading dynamically imported module|Loading chunk .+ failed/i.test(
      error.message,
    )
  )
    return
  learningRequest += 1
  learningChecking.value = false
  learningAllowed.value = false
  learningContent.value = null
  learningResourceError.value = true
  learningError.value = true
  return false
})
// 缓存中的学习页不会响应题库的选择；退出、切换账号仍立即令授权请求失效。
watch(
  () =>
    [
      isActive.value,
      ready.value,
      activeExamType.value,
      selectedNodeCode.value,
      auth.isLoggedIn,
      auth.user?.id,
    ] as const,
  () => {
    void refreshLearningAccess()
  },
  { immediate: true, flush: 'sync' },
)
// 支付弹窗不能跟随账号或考试切换遗留到下一个任务。
watch(
  () => [isActive.value, activeExamType.value, auth.user?.id],
  () => {
    paymentVisible.value = false
  },
)
// 切换考点回到正文顶部，不依赖题库统计接口。
watch(selectedNodeCode, async (code, previous) => {
  if (!isActive.value || !previous || code === previous) return
  await nextTick()
  if (isActive.value && selectedNodeCode.value === code)
    workspaceRef.value?.scrollIntoView({ behavior: 'auto', block: 'start' })
})
onBeforeUnmount(() => {
  learningRequest += 1
})

// 学习购买固定进入学习年卡，练习套餐由题库页单独管理。
function openLearningPayment(): void {
  paymentExamType.value = activeExamType.value
  paymentVisible.value = true
}
// 支付成功重新读取共享权益和学习授权，不触发任何取题操作。
async function handlePaymentSuccess(): Promise<void> {
  paymentVisible.value = false
  const userId = auth.user?.id
  const exam = activeExamType.value
  try {
    const context = await getMember()
    if (auth.user?.id !== userId || activeExamType.value !== exam) return
    auth.setMemberContext(context)
    await workspace.loadPersonal()
    await refreshLearningAccess()
  } catch {
    // 公共请求层提示权益刷新失败；当前授权不会因此自动放行。
  }
}
// 讲义只包含当前考纲实际存在的章节，避免内容索引与考纲版本不一致。
const activeKnowledgeLesson = computed(() => {
  if (!learningAllowed.value || !selectedNode.value) return null
  const lesson = learningContent.value?.findKnowledgeLesson(
    activeExamType.value,
    selectedNodeCode.value,
  )
  if (!lesson) return null
  const sections = lesson.sections.filter((section) => workspace.index.has(section.code))
  return sections.length ? { ...lesson, sections } : null
})
// 科目入口列出已有讲解的章节，每份讲义只出现一次。
const availableLearningChapters = computed(() => {
  if (!learningAllowed.value || !learningContent.value) return []
  const chapters: SyllabusNode[] = []
  // 找到章节讲义即停止下钻，避免其子知识点重复列出。
  function visit(nodes: SyllabusNode[]): void {
    for (const node of nodes) {
      if (learningContent.value?.findKnowledgeLesson(activeExamType.value, node.code))
        chapters.push(node)
      else visit(node.children || [])
    }
  }
  visit(selectedNode.value?.children || [])
  return chapters
})
// 学完进入同一考点的练习设置；这里只导航，不创建答卷。
function openPracticeMode(): void {
  void router.push({
    path: '/question-bank',
    query: { mode: 'practice', code: selectedNodeCode.value },
  })
}
</script>

<style scoped>
.knowledge-learning {
  min-width: 0;
  min-height: calc(100vh - var(--nav-height));
  padding-bottom: 40px;
  color: var(--color-ink);
  --el-color-primary: var(--color-learning-blue);
  scroll-margin-top: calc(var(--nav-height) + 20px);
}
/* 保留原学习子页签的字号和间距，不再依赖外层隐藏页签的样式穿透。 */
.knowledge-learning :deep(.knowledge-tabs .el-tabs__item) {
  height: 54px;
  padding: 0 24px;
  font-size: 18px;
  font-weight: 600;
}
.qb-completion-notice {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px 0;
  color: var(--color-ink-muted);
  font-size: 14px;
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
.qb-learning-loading {
  min-height: 400px;
  padding: 24px 0;
}
.qb-learning-error {
  padding: 24px 0;
  color: var(--color-ink-muted);
}
.qb-learning-error p {
  margin: 0 0 16px;
}
.qb-locked-learning {
  position: relative;
  isolation: isolate;
  display: grid;
  align-items: center;
  min-height: 560px;
  overflow: hidden;
  border-radius: 16px;
}
.qb-locked-learning__preview {
  position: absolute;
  inset: 0;
  z-index: -2;
  filter: blur(9px);
  opacity: 0.65;
}
.qb-locked-learning__veil {
  position: absolute;
  inset: 0;
  z-index: -1;
  background: rgb(246 249 253 / 30%);
}
.qb-learning-gate {
  width: calc(100% - 64px);
  box-sizing: border-box;
  max-width: 720px;
  margin: 80px auto;
  padding: 24px 28px;
  border: 1px solid var(--color-learning-blue-line);
  border-radius: 16px;
  background: var(--color-surface);
  box-shadow: 0 16px 48px rgb(31 52 78 / 10%);
}
.qb-learning-gate__heading {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.qb-learning-gate__lock {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-learning-blue-line);
  border-radius: 12px;
  background: var(--color-surface);
  color: var(--color-learning-blue);
}
.qb-learning-gate__lock svg {
  width: 22px;
  height: 22px;
}
.qb-learning-gate__badge {
  color: var(--color-learning-blue);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
}
.qb-learning-gate h3 {
  margin: 0;
  font-size: 23px;
  font-weight: 650;
  line-height: 1.4;
}
.qb-learning-gate__intro {
  margin: 12px 0 0;
  color: var(--color-ink-soft);
  font-size: 14px;
  line-height: 1.8;
}
.qb-learning-gate__features {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  margin: 22px 0;
}
.qb-learning-gate__features > div {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  align-content: start;
  gap: 8px 10px;
}
.qb-learning-gate__features svg {
  width: 20px;
  height: 20px;
  color: var(--color-learning-blue);
}
.qb-learning-gate__features strong {
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
}
.qb-learning-gate__features p {
  grid-column: 2;
  margin: 0;
  color: var(--color-ink-muted);
  font-size: 12px;
  line-height: 1.7;
}
.qb-learning-gate__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 16px;
  padding-top: 18px;
  border-top: 1px solid var(--color-learning-blue-line);
}
@media (max-width: 640px) {
  .qb-learning-gate {
    width: calc(100% - 24px);
    margin-block: 48px;
  }
  .qb-learning-gate__features {
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
    margin-block: 24px;
  }
}
.qb-learning-index {
  padding: 0 0 24px;
}
.qb-learning-index h3 {
  margin: 0 0 10px;
  font-size: 16px;
  font-weight: 600;
}
.qb-learning-index p {
  color: var(--color-ink-muted);
  margin: 0 0 20px;
}
.qb-chapter-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 24px;
  border-top: 1px solid var(--color-line);
}
.qb-chapter-list button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  padding: 12px 10px;
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
  background: var(--color-learning-blue-soft);
}
.qb-chapter-list__number {
  align-self: flex-start;
  padding-top: 2px;
  color: var(--color-ink-muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.qb-chapter-list__name {
  flex: 1;
  min-width: 0;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.qb-chapter-list small {
  display: block;
  margin-top: 2px;
  color: var(--color-ink-muted);
  font-size: 13px;
  font-weight: 400;
}
.qb-chapter-list svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
.qb-chapter-list button:focus-visible {
  outline: 2px solid var(--color-learning-blue);
  outline-offset: 3px;
}
</style>
