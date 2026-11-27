<!-- 学习平台公共外壳：总览、学习、题库和练习册共享导航与考纲上下文。 -->
<template>
  <div class="learning-workspace">
    <NavBar />
    <main class="learning-shell">
      <img :src="learningBackgroundUrl" class="learning-background" alt="" aria-hidden="true" />
      <header class="learning-header">
        <div class="learning-header-copy">
          <h1>学习平台</h1>
          <p>
            {{
              auth.activeExamType === 'ESAT'
                ? '从知识关联出发，按考点学习，按需练习。'
                : '按考点选择试题，使用练习册安排专项训练。'
            }}
          </p>
        </div>
      </header>
      <nav class="learning-tabs" aria-label="学习平台导航">
        <RouterLink
          v-for="tab in tabs"
          :key="tab.key"
          :to="tabLocation(tab.key)"
          :class="{ 'is-active': activeTab === tab.key }"
          :aria-current="activeTab === tab.key ? 'page' : undefined"
          >{{ tab.label }}</RouterLink
        >
        <div class="learning-tabs-actions">
          <span
            v-if="
              auth.activeExamType === 'ESAT' &&
              auth.isLoggedIn &&
              !workspace.completionLoading &&
              !workspace.completionError &&
              workspace.subjectLeaves.length
            "
            class="learning-progress"
            ><Opportunity aria-hidden="true" /> {{ workspace.subject?.cn_label }} · 已点亮
            {{ workspace.completedTotal }} / {{ workspace.subjectLeaves.length }}</span
          >
          <RouterLink
            class="learning-records"
            :class="{ 'is-active': activeViewKey === 'practice-records' }"
            to="/practice-records"
            ><Clock aria-hidden="true" />练习记录</RouterLink
          >
        </div>
      </nav>
      <div
        class="learning-body"
        :class="{
          'has-tree': showTree,
          'tree-collapsed': workspace.collapsed,
          'is-notebook': activeViewKey === 'practice-notebook',
          'is-graph': activeViewKey === 'knowledge-graph',
        }"
      >
        <aside v-if="showTree" class="learning-tree" aria-label="考纲知识树">
          <div class="learning-tree-heading">
            <h2 v-if="!workspace.collapsed">考纲知识树</h2>
            <AppButton
              type="text"
              size="mini"
              :icon="workspace.collapsed ? ArrowRight : ArrowLeft"
              icon-only
              :aria-label="workspace.collapsed ? '展开考纲知识树' : '收起考纲知识树'"
              :aria-expanded="!workspace.collapsed"
              @click="workspace.collapsed = !workspace.collapsed"
            />
          </div>
          <div v-show="!workspace.collapsed" class="learning-tree-subject">
            <el-select
              v-model="workspace.subjectCode"
              class="learning-subject"
              aria-label="选择学习科目"
              placeholder="选择科目"
              :loading="workspace.syllabusLoading"
              :disabled="workspace.syllabusLoading || workspace.syllabusError"
              @change="changeSubject"
            >
              <el-option
                v-for="subject in workspace.subjects"
                :key="subject.code"
                :label="subject.cn_label"
                :value="subject.code"
              />
            </el-select>
          </div>
          <div v-show="!workspace.collapsed" class="learning-tree-scroll">
            <div v-if="workspace.syllabusLoading" class="learning-tree-state" role="status">
              正在加载考纲…
            </div>
            <div v-else-if="workspace.syllabusError" class="learning-tree-state" role="alert">
              <p>考纲暂时无法加载</p>
              <AppButton type="text" size="mini" @click="retrySyllabus">重新加载</AppButton>
            </div>
            <template v-else>
              <el-tree
                ref="treeRef"
                :key="`${auth.activeExamType}:${workspace.subjectCode}`"
                :data="workspace.subject?.children || []"
                :props="treeProps"
                node-key="code"
                :current-node-key="workspace.selectedCode"
                :default-expanded-keys="defaultExpandedKeys"
                highlight-current
                :expand-on-click-node="false"
                @node-click="chooseTreeNode"
              >
                <template #default="{ data }">
                  <div class="learning-tree-item">
                    <span :title="`${data.cn_label} / ${data.en_label}`">{{ data.cn_label }}</span>
                    <LearningLightButton
                      v-if="auth.activeExamType === 'ESAT'"
                      compact
                      :label="data.cn_label"
                      :active="workspace.completionState(data.code).active"
                      :partial="workspace.completionState(data.code).partial"
                      :disabled="
                        workspace.completionDisabled || workspace.lockedCodes.includes(data.code)
                      "
                      :busy="workspace.completionSavingCode === data.code"
                      @toggle="workspace.toggleCompletion(data.code)"
                    />
                  </div>
                </template>
              </el-tree>
              <p v-if="!workspace.subject?.children?.length" class="learning-tree-state">
                当前科目暂无考纲
              </p>
            </template>
          </div>
          <p v-if="!workspace.collapsed" class="learning-tree-hint">
            {{ auth.activeExamType === 'ESAT' ? '按章节定位，也可在图谱中选择' : '按章节选择练习范围' }}
          </p>
        </aside>
        <section class="learning-content" aria-label="学习平台内容">
          <KeepAlive :include="['KnowledgeLearningView', 'QuestionBankView', 'KnowledgeGraphView']"
            ><component :is="activeView" :key="activeViewKey"
          /></KeepAlive>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { TreeInstance } from 'element-plus'
import { ArrowLeft, ArrowRight, Clock, Opportunity } from '@element-plus/icons-vue'
import NavBar from '@/components/NavBar.vue'
import learningBackgroundUrl from '@/assets/home/hero-learning-wave.webp'
import AppButton from '@/components/AppButton.vue'
import LearningLightButton from '@/components/knowledge/LearningLightButton.vue'
import { useAuthStore } from '@/stores/auth'
import { useLearningWorkspaceStore } from '@/stores/learningWorkspace'
import type { SyllabusNode } from '@/api/questionBank'
import { resolveLearningWorkspaceTask } from '@/utils/learningWorkspaceRoute'
import KnowledgeLearningView from './KnowledgeLearningView.vue'
import QuestionBankView from './QuestionBankView.vue'
import PracticeNotebookView from './PracticeNotebookView.vue'
import PracticeRecordsView from './PracticeRecordsView.vue'
const KnowledgeGraphView = defineAsyncComponent(() => import('./KnowledgeGraphView.vue'))
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const workspace = useLearningWorkspaceStore()
const treeRef = ref<TreeInstance>()
const treeProps = { children: 'children', label: 'cn_label' }
type WorkspaceTab = 'overview' | 'learning' | 'practice' | 'notebooks'
// ESAT 默认展示图谱，TMUA 的旧图谱链接在转入题库期间也不挂载图谱页面。
const activeViewKey = computed(() => {
  if (String(route.name).startsWith('practice-notebook')) return 'practice-notebook'
  if (route.name === 'knowledge-graph')
    return auth.activeExamType === 'ESAT' ? 'knowledge-graph' : 'question-bank'
  if (route.name === 'question-bank') {
    const task = resolveLearningWorkspaceTask(auth.activeExamType, route.query)
    if (task === 'overview') return 'knowledge-graph'
    return task === 'learning' ? 'knowledge-learning' : 'question-bank'
  }
  return String(route.name)
})
// 子任务只替换内容区，保留共同导航与图谱缓存。
const activeView = computed(() => {
  if (activeViewKey.value === 'knowledge-graph') return KnowledgeGraphView
  if (activeViewKey.value === 'knowledge-learning') return KnowledgeLearningView
  if (activeViewKey.value === 'practice-notebook') return PracticeNotebookView
  if (activeViewKey.value === 'practice-records') return PracticeRecordsView
  return QuestionBankView
})
// 管理和配置任务使用完整宽度，创建页自己的多选考纲保持独立。
const showTree = computed(() =>
  ['knowledge-graph', 'knowledge-learning', 'question-bank'].includes(activeViewKey.value),
)
// 每次进入科目先展开第一章；后续选择仍由祖先展开逻辑定位。
const defaultExpandedKeys = computed(() => {
  const firstChapter = workspace.subject?.children?.[0]
  return firstChapter ? [firstChapter.code] : []
})
// TMUA 仅展示题库与练习册，ESAT 保留完整学习导航。
const tabs = computed(() => [
  ...(auth.activeExamType === 'ESAT'
    ? [
        { key: 'overview' as const, label: '学习总览' },
        { key: 'learning' as const, label: '知识点学习' },
      ]
    : []),
  { key: 'practice' as const, label: '题库练习' },
  { key: 'notebooks' as const, label: '我的练习册' },
])
// 页签由路由派生，前进后退与页内切换一致。
const activeTab = computed<WorkspaceTab | ''>(() => {
  if (activeViewKey.value === 'knowledge-graph') return 'overview'
  if (activeViewKey.value.startsWith('practice-notebook')) return 'notebooks'
  if (activeViewKey.value === 'practice-records') return ''
  return activeViewKey.value === 'knowledge-learning' ? 'learning' : 'practice'
})
// 学习和做题承接考点，练习册入口默认展示全部。
function tabLocation(tab: WorkspaceTab) {
  const code = workspace.selectedCode || workspace.subjectCode
  if (tab === 'notebooks') return { path: '/practice-notebook' }
  if (tab === 'overview') return { path: '/knowledge-graph', query: code ? { code } : {} }
  return { path: '/question-bank', query: { mode: tab, ...(code ? { code } : {}) } }
}
// 考纲选择同步地址，子页面据此刷新正文和题量。
function chooseKnowledge(code: string): void {
  workspace.select(code)
  const path = activeViewKey.value === 'knowledge-graph' ? '/knowledge-graph' : '/question-bank'
  const mode = activeTab.value === 'practice' ? 'practice' : 'learning'
  void router.push({ path, query: { code, ...(path === '/question-bank' ? { mode } : {}) } })
}
// 章节单击即展开，箭头仍能单独控制分支。
function chooseTreeNode(node: SyllabusNode): void {
  treeRef.value?.getNode(node.code)?.expand()
  chooseKnowledge(node.code)
}
// 改变科目不隐式过滤个人练习册。
function changeSubject(code: string): void {
  workspace.selectSubject(code)
  if (showTree.value) chooseKnowledge(code)
}
// 只重试考纲读取，不刷新整页。
function retrySyllabus(): void {
  void workspace.loadSyllabus(true).catch(() => undefined)
}
// 等待考试偏好确认后处理旧入口，避免在 ESAT 偏好恢复前按初始 TMUA 值跳转。
watch(
  () => [auth.activeExamType, route.fullPath] as const,
  async () => {
    const path = route.fullPath
    await auth.ensureMemberContext().catch(() => undefined)
    if (auth.activeExamType !== 'TMUA' || route.fullPath !== path) return
    if (
      route.name === 'knowledge-graph' ||
      (route.name === 'question-bank' && ['learning', 'overview'].includes(String(route.query.mode)))
    ) {
      await router.replace({
        path: '/question-bank',
        query: { ...route.query, mode: 'practice' },
        hash: route.hash,
      })
    }
  },
  { immediate: true },
)
// 异步考纲就绪后恢复深链接和历史导航的选中范围。
watch(
  () => [route.name, route.query.code, workspace.syllabus] as const,
  () => {
    if (!showTree.value) return
    const code = typeof route.query.code === 'string' ? route.query.code : ''
    if (code) workspace.select(code)
  },
  { immediate: true },
)
// 跨章节跳转展开祖先，保留其他分支的展开状态。
watch(
  () => [workspace.selectedCode, workspace.subjectCode, workspace.syllabus, treeRef.value],
  async () => {
    await nextTick()
    const item = workspace.index.get(workspace.selectedCode)
    item?.parents.forEach((code) => treeRef.value?.getNode(code)?.expand())
    treeRef.value?.setCurrentKey(workspace.selectedCode)
  },
  { immediate: true, flush: 'post' },
)
onMounted(async () => {
  await auth.ensureMemberContext().catch(() => undefined)
  await workspace.loadSyllabus().catch(() => undefined)
})
</script>

<style scoped>
.learning-workspace {
  min-height: 100vh;
  min-width: var(--fluid-page-min-width);
  background: var(--color-surface);
  color: var(--color-ink);
}
.learning-shell {
  position: relative;
  isolation: isolate;
  max-width: 1840px;
  margin: 0 auto;
  padding: 44px clamp(24px, 2vw, 32px) 72px;
}
/* 与诊断、模考共用背景素材，固定装饰层不参与滚动和点击。 */
.learning-shell::before {
  content: '';
  position: fixed;
  inset: var(--nav-height) 0 0;
  z-index: -2;
  background: var(--module-background-glow);
  pointer-events: none;
}
.learning-background {
  position: fixed;
  inset: var(--nav-height) 0 0;
  z-index: -1;
  width: 100%;
  height: calc(100dvh - var(--nav-height));
  object-fit: cover;
  object-position: 62% center;
  opacity: 0.22;
  mix-blend-mode: multiply;
  mask-image: linear-gradient(to bottom, transparent, #000 18%, #000 82%, transparent);
  pointer-events: none;
}
.learning-header {
  display: flex;
  align-items: center;
  gap: 24px;
  width: var(--fluid-shell-width);
  margin: 0 auto 28px;
}
.learning-header-copy {
  min-width: 0;
}
.learning-header h1 {
  margin: 0;
  color: var(--color-module-heading);
  font-size: 38px;
  line-height: 1.3;
  font-weight: 750;
  letter-spacing: -0.035em;
}
.learning-header-copy > p {
  margin: 14px 0 0;
  color: var(--color-module-muted);
  font-size: 17px;
  line-height: 1.5;
}
.learning-subject {
  width: 100%;
}
.learning-tree-subject {
  padding: 0 8px 12px;
  flex-shrink: 0;
}
.learning-progress {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--color-module-muted);
  padding-bottom: 6px;
  white-space: nowrap;
}
.learning-progress svg {
  width: 20px;
  color: #e5a800;
}
.learning-tabs {
  display: flex;
  align-items: center;
  gap: 38px;
  width: var(--fluid-shell-width);
  border-bottom: 1px solid var(--color-module-line);
  margin: 0 auto 24px;
}
.learning-tabs a {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 14px 2px 17px;
  border-bottom: 3px solid transparent;
  text-decoration: none;
  color: var(--color-ink);
  font-size: 17px;
  font-weight: 600;
}
.learning-tabs a.is-active {
  border-color: #2854d9;
  color: #2854d9;
}
.learning-tabs a:hover {
  color: #2854d9;
}
.learning-tabs a:focus-visible {
  outline: 2px solid var(--color-module-focus);
  outline-offset: 4px;
  border-radius: var(--radius-sm);
}
.learning-tabs-actions {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-left: auto;
}
.learning-tabs .learning-records {
  color: #2854d9;
  font-size: 14px;
  font-weight: 400;
}
.learning-records svg {
  width: 18px;
  height: 18px;
}
.learning-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: clamp(20px, 1.5vw, 24px);
}
.learning-body.is-notebook {
  width: var(--fluid-shell-width);
  margin-inline: auto;
}
.learning-body.has-tree {
  grid-template-columns: clamp(218px, 15.25vw, 244px) minmax(0, 1fr);
}
.learning-body.tree-collapsed.has-tree {
  grid-template-columns: 42px minmax(0, 1fr);
}
.learning-tree {
  position: sticky;
  top: calc(var(--nav-height) + 16px);
  display: flex;
  flex-direction: column;
  height: 740px;
  background: var(--color-module-control);
  border: 1px solid var(--color-module-line);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  padding: 14px 10px;
  min-width: 0;
}
.learning-tree-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px 14px;
  flex-shrink: 0;
}
.learning-tree-heading h2 {
  font-size: 16px;
  margin: 0;
}
.learning-tree-scroll {
  min-height: 0;
  flex: 1;
  overflow: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}
.learning-tree-scroll :deep(.el-tree) {
  background: transparent;
}
.learning-tree-scroll :deep(.el-tree-node__content) {
  height: 39px;
  padding-right: 3px;
  border-radius: 4px;
}
.learning-tree-scroll :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background: #edf3ff;
  color: #2854d9;
  box-shadow: inset 3px 0 #2854d9;
}
.learning-tree-item {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  font-size: 14px;
}
.learning-tree-item > span:first-child {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.learning-tree-item :deep(.learning-light) {
  flex: 0 0 32px;
}
.learning-tree-scroll :deep(.el-tree-node.is-current > .el-tree-node__content .learning-tree-item) {
  font-weight: 600;
}
.learning-tree-hint {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--color-ink-muted);
  line-height: 1.6;
  padding: 20px 8px 0;
  margin: 0;
}
.learning-tree-state {
  padding: 16px 8px;
  color: var(--color-ink-muted);
  font-size: 13px;
}
.tree-collapsed .learning-tree {
  padding: 8px 4px;
  height: 50px;
}
.tree-collapsed .learning-tree-heading {
  padding: 0;
  justify-content: center;
}
.learning-content {
  min-width: 0;
  padding: 24px;
  border: 1px solid var(--color-module-line);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}
.is-notebook > .learning-content {
  padding: 20px;
}
.is-graph > .learning-content {
  position: sticky;
  top: calc(var(--nav-height) + 16px);
  height: 740px;
  min-height: 0;
  padding-bottom: 10px;
}
.learning-workspace :deep(.app-button.el-button.app-button--primary) {
  --app-button-bg: #2854d9;
  --app-button-border: #2854d9;
  --app-button-hover-bg: #2149c1;
  --app-button-hover-border: #2149c1;
  --app-button-active-bg: #1b3fae;
  --app-button-active-border: #1b3fae;
}
.learning-workspace :deep(.app-button.el-button.app-button--secondary:not(.app-button--icon-only)) {
  --app-button-border: #cedaff;
  --app-button-color: #2854d9;
  --app-button-hover-bg: #f3f6ff;
  --app-button-hover-border: #2854d9;
}
.learning-workspace :deep(.learning-light .app-button.el-button.app-button--secondary) {
  --app-button-color: #7a8798;
}
.learning-workspace :deep(.learning-light .app-button.el-button.app-button--secondary.is-lit) {
  --app-button-color: #e5a800;
}
.learning-workspace
  :deep(.learning-light .app-button.el-button.app-button--secondary.is-partial:not(.is-lit)) {
  --app-button-color: #a66a08;
}
</style>
