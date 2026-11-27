<!-- 学习总览：真实知识关系与考纲联动，选中节点后承接学习、练习及相关练习册。 -->
<template>
  <div class="kg-workspace" :class="{ 'has-selection': Boolean(selectedTopic) }">
    <section class="kg-map" aria-label="知识关系图">
      <header class="kg-map-heading">
        <div>
          <h2>知识关联总览</h2>
          <p>
            {{ workspace.subject?.cn_label || '学习平台'
            }}<template v-if="graphReady">
              ·
              {{
                selected
                  ? '完整局部关联'
                  : chapterCode
                    ? chapterName(chapterCode)
                    : graphDetailLabels[displayStats?.level ?? 0]
              }}</template
            >
          </p>
        </div>
        <div class="kg-map-controls">
          <AppButton v-if="graphReady && !overview" type="text" size="mini" @click="openOverview"
            >科目总览</AppButton
          >
          <AppButton
            v-if="graphReady"
            type="text"
            size="mini"
            :icon="RefreshRight"
            icon-only
            aria-label="重置图谱视图"
            @click="resetKey++"
          />
        </div>
      </header>
      <template v-if="graphReady">
        <KnowledgeGraphCanvas
          :nodes="visualNodes"
          :edges="visualEdges"
          :overview="overview"
          :progressive="!selected"
          :reset-key="resetKey"
          :description="canvasDescription"
          @select="selectKnowledge"
          @display="displayStats = $event"
        />
        <footer class="kg-map-footer">
          <span><i class="kg-dot" />未点亮 <i class="kg-dot is-lit" />已点亮</span
          ><span
            >{{ selected ? '点击节点查看关联' : '放大当前区域展开细节' }} · 拖动查看其他区域</span
          ><span>视野内 {{ displayStats?.nodes ?? 0 }} 个知识点</span>
        </footer>
      </template>
      <div v-else class="kg-placeholder" role="status">
        <Share aria-hidden="true" />
        <h3>{{ workspace.subject?.cn_label || auth.activeExamType }}知识图谱待开放</h3>
        <p>可从左侧考纲选择知识点，继续学习或练习。</p>
        <AppButton
          type="secondary"
          size="small"
          @click="openKnowledge(auth.activeExamType === 'ESAT' ? 'learning' : 'practice')"
          >{{ auth.activeExamType === 'ESAT' ? '进入知识点学习' : '进入题库练习' }}</AppButton
        >
      </div>
      <div
        v-if="workspace.completionError || workspace.countsError"
        class="kg-progress-status"
        role="status"
      >
        部分学习进度暂未加载，图谱仍可浏览。<AppButton
          type="text"
          size="mini"
          @click="workspace.loadPersonal"
          >重试</AppButton
        >
      </div>
    </section>
    <aside v-if="selectedTopic" class="kg-detail" aria-label="当前知识点">
      <p class="kg-eyebrow">当前知识点</p>
      <h2>{{ selectedTopic.cn_label }}</h2>
      <p class="kg-english">{{ selectedTopic.en_label }}</p>
      <p class="kg-path">
        {{ workspace.subject?.cn_label
        }}<template v-if="parentTitle"> / {{ parentTitle }}</template>
      </p>
      <LearningLightButton
        :label="selectedTopic.cn_label"
        :active="workspace.completionState(selectedTopic.code).active"
        :partial="workspace.completionState(selectedTopic.code).partial"
        :disabled="
          workspace.completionDisabled || workspace.lockedCodes.includes(selectedTopic.code)
        "
        :busy="workspace.completionSavingCode === selectedTopic.code"
        @toggle="workspace.toggleCompletion(selectedTopic.code)"
      />
      <p class="kg-count">{{ nodeQuestionCount(selectedTopic.code) }}</p>
      <div class="kg-actions">
        <AppButton
          v-if="auth.activeExamType === 'ESAT'"
          :icon="ArrowRight"
          icon-position="right"
          @click="openKnowledge('learning')"
          >学习知识点</AppButton
        >
        <AppButton
          type="secondary"
          :icon="ArrowRight"
          icon-position="right"
          @click="openKnowledge('practice')"
          >做相关试题</AppButton
        >
      </div>
      <section class="kg-notebooks" aria-label="相关练习册">
        <h3>相关练习册</h3>
        <p v-if="!auth.isLoggedIn" class="kg-muted">登录后查看你的练习册</p>
        <p v-else-if="workspace.notebooksLoading" class="kg-muted" role="status">正在加载…</p>
        <div v-else-if="workspace.notebooksError" class="kg-muted">
          练习册暂未加载<AppButton type="text" size="mini" @click="workspace.loadPersonal"
            >重试</AppButton
          >
        </div>
        <template v-else-if="workspace.relatedNotebooks.length">
          <article
            v-for="book in workspace.relatedNotebooks.slice(0, 2)"
            :key="book.id"
            class="kg-notebook"
          >
            <strong><Reading aria-hidden="true" />{{ book.name }}</strong>
            <p>
              涵盖 {{ book.knowledgePointCodes.length }} 个知识点 · 每次 {{ book.questionCount }} 题
            </p>
            <AppButton type="text" size="small" @click="openNotebook(book.id)"
              >{{
                workspace.activePractice?.practiceNotebookId === book.id
                  ? '继续练习'
                  : '查看练习册'
              }}<ArrowRight
            /></AppButton>
          </article>
          <AppButton type="text" size="mini" @click="viewRelatedNotebooks"
            >查看全部相关练习册</AppButton
          >
        </template>
        <p v-else class="kg-muted">还没有包含这个知识点的练习册</p>
        <AppButton
          type="secondary"
          size="small"
          :icon="Plus"
          class="kg-create"
          @click="createNotebook"
          >创建专题练习册</AppButton
        >
      </section>
      <details v-if="neighbours.length" class="kg-neighbours">
        <summary>直接关联的知识点 · {{ neighbours.length }}</summary>
        <AppButton
          v-for="item in neighbours"
          :key="item.node.code"
          type="text"
          size="small"
          @click="selectKnowledge(item.node.code)"
          >{{ nodeTitle(item.node) }}</AppButton
        >
      </details>
    </aside>
  </div>
</template>
<script setup lang="ts">
import { computed, onActivated, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowRight, Plus, Reading, RefreshRight, Share } from '@element-plus/icons-vue'
import AppButton from '@/components/AppButton.vue'
import LearningLightButton from '@/components/knowledge/LearningLightButton.vue'
import KnowledgeGraphCanvas, {
  type GraphVisualNode,
  type GraphVisualEdge,
  type GraphDisplayStats,
} from '@/components/knowledge/KnowledgeGraphCanvas.vue'
import { useAuthStore } from '@/stores/auth'
import { useLearningWorkspaceStore } from '@/stores/learningWorkspace'
import { getSubjectKnowledgeGraph } from '@/content/knowledgeGraph/registry'
import { graphDetailLabels, type GraphDetailLevel } from '@/content/knowledgeGraph/overview'
import {
  getKnowledgeGraphNeighbours,
  getKnowledgeGraphView,
} from '@/content/knowledgeGraph/navigation'
import type { KnowledgeGraphNode, KnowledgeLabelLanguage } from '@/content/knowledgeGraph/types'
import { knowledgeLabel } from '@/content/knowledgeGraph/labels'
import { createLoginRequiredRouteLocation } from '@/utils/authRedirect'
const auth = useAuthStore()
const workspace = useLearningWorkspaceStore()
const router = useRouter()
const route = useRoute()
const chapterCode = ref('')
const selectedCode = ref('')
const subjectCode = ref('')
const labelLanguage = ref<KnowledgeLabelLanguage>('zh')
// 暂不显示语言入口，保留切换接口供后续统一语言设置调用。
function setLabelLanguage(language: KnowledgeLabelLanguage): void {
  labelLanguage.value = language
}
defineExpose({ setLabelLanguage })
const resetKey = ref(0)
const displayStats = ref<GraphDisplayStats>()
// 只展示当前考试和科目已发布的关系，科目切换不会混用另一科的节点或层级。
const graphDefinition = computed(() =>
  getSubjectKnowledgeGraph(auth.activeExamType, subjectCode.value),
)
// 图谱数据与各科独立配置的教学骨干一同切换。
const graph = computed(() => graphDefinition.value?.graph)
// 未发布关系的科目仍提供已有课程与练习入口。
const graphReady = computed(() => Boolean(graph.value))
// 局部图只从人工确认的关系中取邻接网络。
const selected = computed(() => graph.value?.nodes.find((node) => node.code === selectedCode.value))
// 其他科目虽无图谱，考纲叶子仍可进入学习与练习。
const selectedTopic = computed(() => {
  const node = workspace.index.get(selectedCode.value)?.node
  return node && !node.children?.length ? node : undefined
})
// 路径只展示当前科目下的直接上级，避免重复科目名。
const parentTitle = computed(() => {
  const parent = workspace.index.get(selectedCode.value)?.parents.at(-1)
  return parent && parent !== workspace.subjectCode
    ? workspace.index.get(parent)?.node.cn_label
    : ''
})
// 全科与章节都按视野逐级展开；选中单个知识点时保留完整直接关联。
const overview = computed(() => !chapterCode.value && !selected.value)
// 邻居列表和画布共用原始知识关系。
const neighbours = computed(() =>
  graph.value && selected.value
    ? getKnowledgeGraphNeighbours(graph.value, selected.value.code)
    : [],
)
// 章节范围允许展示真实跨章联系，局部网络保留邻居间已有关系。
const graphView = computed(() =>
  graph.value
    ? getKnowledgeGraphView(graph.value, {
        selectedCode: selected.value?.code,
        chapterCode: chapterCode.value,
        includeCrossChapter: true,
      })
    : { nodes: [], relations: [] },
)
// 章节核心以本章方法为主，总览使用当前科目的教学骨干。
const scopeLevels = computed(
  () =>
    graphDefinition.value?.overview.scopeDetailLevels(
      graphView.value.nodes,
      graphView.value.relations,
      chapterCode.value,
    ) ?? {
      nodeLevels: new Map<string, GraphDetailLevel>(),
      edgeLevels: new Map<string, GraphDetailLevel>(),
    },
)
// 分层仅控制可见性，所有连线仍来自原始数据。
const visualEdges = computed<GraphVisualEdge[]>(() =>
  graphView.value.relations.map((edge) => ({
    ...edge,
    detailLevel: scopeLevels.value.edgeLevels.get(edge.id),
  })),
)
// 状态变更只改变颜色和浮层，不改变节点位置或缩放。
const visualNodes = computed<GraphVisualNode[]>(() =>
  graphView.value.nodes.map((node) => ({
    id: node.code,
    detailLevel: scopeLevels.value.nodeLevels.get(node.code),
    name: nodeTitle(node),
    alternateName: labelLanguage.value === 'zh' ? node.titleEn : node.title,
    selected: node.code === selectedCode.value,
    lit: workspace.completedCodes.includes(node.code),
    learningStatusText: nodeLearningStatus(node.code),
    questionCountText: nodeQuestionCount(node.code),
  })),
)
// 提供不依赖画布颜色的可访问说明。
const canvasDescription = computed(() =>
  selected.value
    ? `${nodeTitle(selected.value)}的完整局部关联，可从考纲或右侧列表继续选择。`
    : `${workspace.subject?.cn_label || '当前科目'}${chapterCode.value ? chapterName(chapterCode.value) : ''}知识图谱，${graphDetailLabels[displayStats.value?.level ?? 0]}，放大当前区域展开细节，拖动查看其他区域。`,
)
// 图谱标签与邻居列表保持语言一致。
function nodeTitle(node: Pick<KnowledgeGraphNode, 'title' | 'titleEn'>): string {
  return knowledgeLabel(node, labelLanguage.value)
}
// 章节名称来自已发布图谱。
function chapterName(code: string): string {
  const chapter = graph.value?.chapters.find((item) => item.code === code)
  return chapter ? nodeTitle(chapter) : ''
}
// 缺失或失败状态不伪造成用户尚未学习。
function nodeLearningStatus(code: string): string {
  if (!auth.isLoggedIn) return '登录后查看学习状态'
  if (workspace.completionLoading) return '学习状态：加载中…'
  if (workspace.completionError) return '学习状态：暂未加载'
  return workspace.completedCodes.includes(code) ? '已学习' : '未学习'
}
// 已完成题数保持服务端原有去重口径，失败不能显示零。
function nodeQuestionCount(code: string): string {
  if (!auth.isLoggedIn) return '登录后查看完成题数'
  if (workspace.countsLoading) return '题库已完成：加载中…'
  if (workspace.countsError) return '题库已完成：暂未加载'
  return `题库已完成：${workspace.counts[code] ?? 0} 题`
}
// 选中图谱节点同步地址和考纲，允许浏览器回退到上一个范围。
function selectKnowledge(code: string): void {
  workspace.select(code)
  void router.push({ path: '/knowledge-graph', query: { code } })
}
// 清除局部范围恢复该科目总览。
function openOverview(): void {
  selectKnowledge(workspace.subjectCode)
}
// 进入已有课程或做题页，继续使用原登录与权益校验。
function openKnowledge(mode: 'learning' | 'practice'): void {
  void router.push({
    path: '/question-bank',
    query: { code: selectedCode.value || chapterCode.value || workspace.subjectCode, mode },
  })
}
// 相关筛选是显式入口，一级练习册导航始终显示全部。
function viewRelatedNotebooks(): void {
  void router.push({ path: '/practice-notebook', query: { knowledgeCode: selectedCode.value } })
}
// 有进行中答卷时继续，否则打开现有管理页查看完整规则和历史。
function openNotebook(id: string): void {
  const active = workspace.activePractice
  if (active?.practiceNotebookId === id)
    void router.push({
      path: '/practice',
      query: { examId: active.examRecordId, from: 'practice-notebook' },
    })
  else
    void router.push({
      path: '/practice-notebook',
      query: { knowledgeCode: selectedCode.value, notebookId: id },
    })
}
// 创建仅预填当前知识点范围，不自动保存或开始练习。
function createNotebook(): void {
  if (!selectedTopic.value) return
  const target = router.resolve({
    path: '/practice-notebook/new',
    query: {
      source: 'knowledge-graph',
      examType: auth.activeExamType,
      name: `${selectedTopic.value.cn_label}专项练习`,
      knowledgePointCodes: selectedTopic.value.code,
      returnTo: router.resolve({
        path: '/knowledge-graph',
        query: { code: selectedTopic.value.code },
      }).fullPath,
    },
  })
  void router.push(
    auth.isLoggedIn ? target.fullPath : createLoginRequiredRouteLocation(target.fullPath),
  )
}
// 只有总览激活时承接新范围，离开后保留画布及相机以便原位返回。
function syncScope(): void {
  if (
    route.name !== 'knowledge-graph' &&
    !(
      route.name === 'question-bank' &&
      !route.query.mode &&
      !route.query.code &&
      !route.query.difficulty
    )
  )
    return
  subjectCode.value = workspace.subjectCode
  const code = workspace.selectedCode
  const node = graph.value?.nodes.find((item) => item.code === code)
  selectedCode.value = workspace.index.get(code)?.node.children?.length ? '' : code
  chapterCode.value = graphReady.value
    ? node?.chapterCode || graph.value?.chapters.find((item) => item.code === code)?.code || ''
    : ''
}
watch(
  () => [route.fullPath, workspace.selectedCode, workspace.subjectCode, workspace.syllabus],
  syncScope,
  { immediate: true },
)
let activatedOnce = false
// 返回时刷新练习册与作答进度，画布实例保持缓存，不重置缩放。
onActivated(() => {
  syncScope()
  if (activatedOnce) void workspace.loadPersonal()
  activatedOnce = true
})
</script>
<style scoped>
.kg-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  height: 100%;
  min-height: 0;
  min-width: 0;
  align-items: stretch;
}
.kg-workspace.has-selection {
  grid-template-columns: minmax(0, 1fr) 278px;
}
.kg-map {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
}
.kg-map-heading {
  display: flex;
  flex-shrink: 0;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  min-height: 64px;
  padding: 0 16px 12px 0;
}
.kg-map-heading h2 {
  margin: 0 0 6px;
  font-size: 19px;
}
.kg-map-heading p {
  margin: 0;
  font-size: 13px;
  color: var(--color-ink-muted);
}
.kg-map-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.kg-map :deep(.graph-canvas-shell) {
  flex: 1;
  min-height: 0;
}
.kg-map :deep(.graph-canvas),
.kg-map :deep(.graph-canvas.is-overview),
.kg-map :deep(.graph-canvas.is-dense) {
  height: 100%;
}
.kg-map-footer {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: auto;
  padding: 6px 18px 0 0;
  font-size: 12px;
  color: var(--color-ink-muted);
}
.kg-map-footer > span:first-child {
  display: flex;
  align-items: center;
  gap: 7px;
}
.kg-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #5574e8;
}
.kg-dot.is-lit {
  background: #e5a800;
  margin-left: 6px;
}
.kg-detail {
  border-left: 1px solid var(--color-line);
  padding: 12px 0 20px 24px;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.kg-eyebrow,
.kg-path {
  color: var(--color-ink-muted);
  font-size: 13px;
  margin: 0 0 12px;
}
.kg-detail h2 {
  margin: 0 0 8px;
  font-size: 23px;
  line-height: 1.45;
}
.kg-english {
  color: var(--color-ink-soft);
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 16px;
}
.kg-count {
  font-size: 14px;
  margin: 12px 0 20px;
}
.kg-actions {
  display: grid;
  gap: 10px;
}
.kg-actions :deep(.app-button),
.kg-create {
  width: 100%;
  margin-left: 0;
}
.kg-notebooks {
  border-top: 1px solid var(--color-line);
  margin-top: 26px;
  padding-top: 22px;
}
.kg-notebooks h3 {
  margin: 0 0 18px;
  font-size: 16px;
}
.kg-notebook {
  margin-bottom: 16px;
}
.kg-notebook strong {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  overflow-wrap: anywhere;
}
.kg-notebook svg {
  width: 17px;
  height: 17px;
  flex-shrink: 0;
  color: #2854d9;
}
.kg-notebook p,
.kg-muted {
  font-size: 13px;
  color: var(--color-ink-muted);
  line-height: 1.7;
}
.kg-create {
  margin-top: 12px;
}
.kg-neighbours {
  margin-top: 24px;
  border-top: 1px solid var(--color-line);
  padding-top: 16px;
  font-size: 13px;
}
.kg-neighbours summary {
  color: var(--color-ink-soft);
  cursor: pointer;
}
.kg-neighbours :deep(.app-button) {
  display: flex;
  margin: 6px 0 0;
  white-space: normal;
  text-align: left;
}
.kg-placeholder {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-ink-muted);
}
.kg-placeholder > svg {
  width: 32px;
  height: 32px;
  color: #aab5c8;
}
.kg-placeholder h3 {
  font-size: 17px;
  color: var(--color-ink-soft);
  margin-bottom: 0;
}
.kg-placeholder p {
  font-size: 14px;
  margin-bottom: 24px;
}
.kg-progress-status {
  flex-shrink: 0;
  margin: 12px 0;
  font-size: 13px;
  color: var(--color-ink-muted);
}
.kg-map-heading h2,
.kg-detail h2,
.kg-notebooks h3 {
  font-weight: 650;
}
.kg-create.app-button.el-button {
  width: 100%;
}
@media (max-width: 1400px) {
  .kg-workspace.has-selection {
    grid-template-columns: minmax(0, 1fr) 245px;
  }
  .kg-detail {
    padding-left: 18px;
  }
  .kg-map-controls {
    gap: 4px;
  }
}
</style>
