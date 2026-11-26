<!-- 学习平台知识图谱：按科目和章节浏览，数学1已提供关联，其他科目保留占位。 -->
<template>
  <main class="kg-page">
    <header class="kg-header">
      <div>
        <p class="kg-eyebrow">{{ auth.activeExamType }} · 学习平台</p>
        <h1>
          知识图谱 <span v-if="supported">{{ subjectName }}</span>
        </h1>
        <p class="kg-subtitle">看清知识之间的联系，找到下一步学习的方向。</p>
      </div>
      <AppButton type="secondary" size="small" :icon="Back" @click="backToLearning"
        >返回学习平台</AppButton
      >
    </header>

    <section v-if="!supported" class="kg-unavailable">
      <Share aria-hidden="true" />
      <h2>当前考试暂无知识图谱</h2>
      <p>目前已开放 ESAT 数学1，可通过顶部考试工作区切换查看。</p>
    </section>

    <template v-else>
      <section class="kg-toolbar" aria-label="图谱筛选">
        <div class="kg-scope">
          <span class="kg-scope__subject">{{ subjectName }}</span>
          <span v-if="graphReady"
            >{{ graph.chapters.length }}章 · {{ graph.nodes.length }}个知识点 ·
            {{ graph.relations.length }}条关联</span
          >
        </div>
        <div class="kg-toolbar-controls">
          <el-radio-group v-model="labelLanguage" size="small" aria-label="知识点名称语言">
            <el-radio-button value="zh">中文</el-radio-button>
            <el-radio-button value="en">English</el-radio-button>
          </el-radio-group>
          <el-select
            v-model="searchCode"
            :disabled="!graphReady"
            filterable
            :filter-method="filterSearch"
            @visible-change="resetSearchFilter"
            clearable
            placeholder="搜索当前科目知识点"
            aria-label="搜索知识点"
            class="kg-search"
            @change="selectSearch"
          >
            <el-option
              v-for="node in filteredSearchNodes"
              :key="node.code"
              :label="nodeTitle(node)"
              :value="node.code"
            >
              <span>{{ nodeTitle(node) }}</span
              ><small class="kg-option-chapter">{{ chapterName(node.chapterCode) }}</small>
            </el-option>
          </el-select>
        </div>
      </section>

      <nav class="kg-chapters" aria-label="选择图谱章节">
        <el-select
          v-model="subjectCode"
          class="kg-subject-select"
          aria-label="选择图谱科目"
          @change="changeSubject"
        >
          <el-option
            v-for="subject in knowledgeGraphSubjects"
            :key="subject.code"
            :label="nodeTitle(subject)"
            :value="subject.code"
          />
        </el-select>
        <div class="kg-chapter-options">
          <AppButton
            v-for="chapter in chapters"
            :key="chapter.code"
            :type="chapterCode === chapter.code ? 'primary' : 'text'"
            size="small"
            @click="openChapter(chapter.code)"
            :aria-pressed="chapterCode === chapter.code"
            >{{ nodeTitle(chapter) }}</AppButton
          >
          <span v-if="!graphReady && chaptersLoading" class="kg-chapter-status" role="status"
            >正在读取章节…</span
          >
          <AppButton
            v-else-if="!graphReady && chaptersError"
            type="text"
            size="small"
            @click="loadChapters"
            >重新加载章节</AppButton
          >
        </div>
      </nav>

      <section
        v-if="!graphReady"
        class="kg-map kg-placeholder"
        :aria-label="`${subjectName}知识图谱占位`"
      />
      <div v-else class="kg-workspace" :class="{ 'is-overview': overview }">
        <section class="kg-map" aria-label="知识关系图">
          <div class="kg-map-heading">
            <div>
              <h2>
                {{
                  selected
                    ? nodeTitle(selected)
                    : chapterCode
                      ? chapterName(chapterCode)
                      : '数学1 · 知识关联'
                }}
              </h2>
              <p>
                {{
                  selected
                    ? '展示直接关联，以及相邻知识点之间已有的联系。'
                    : chapterCode
                      ? '保留章节内的知识网络，可同时查看与其他章节的联系。'
                      : '总览显示核心网络，放大逐步展开细节；点击知识点查看完整局部关联。'
                }}
              </p>
            </div>
            <div class="kg-map-controls">
              <AppButton v-if="!overview" type="text" size="mini" @click="openChapter('')"
                >科目总览</AppButton
              >
              <AppButton type="text" size="mini" :icon="RefreshRight" @click="resetKey++"
                >重置视图</AppButton
              >
            </div>
          </div>
          <div v-if="!overview" class="kg-relation-filters">
            <el-checkbox-group v-model="visibleTypes" aria-label="关系类型">
              <el-checkbox
                v-for="(definition, type) in knowledgeRelationTypes"
                :key="type"
                :value="type"
              >
                <i class="kg-line" :class="`kg-line--${type}`" />{{ definition.label }}
              </el-checkbox>
            </el-checkbox-group>
            <el-checkbox v-if="!selected" v-model="includeCrossChapter">跨章节关联</el-checkbox>
          </div>
          <KnowledgeGraphCanvas
            :nodes="visualNodes"
            :edges="visualEdges"
            :overview="overview"
            :reset-key="resetKey"
            :description="canvasDescription"
            @select="selectVisualNode"
            @display="displayStats = $event"
          />
          <footer class="kg-map-footer">
            <span
              ><template v-if="overview"
                >{{ graphDetailLabels[displayStats?.level ?? 0] }} · </template
              >{{ displayStats?.nodes ?? visualNodes.length }}个知识点 ·
              {{ displayStats?.edges ?? visualEdges.length }}条关联</span
            >
            <span>拖动画布 · 滚轮或双指缩放</span>
            <span><i class="kg-dot" />未点亮 <i class="kg-dot kg-dot--lit" />已点亮</span>
          </footer>
          <div
            v-if="progressLoading || progressError || countsLoading || countsError"
            class="kg-progress-status"
            role="status"
          >
            <span v-if="progressLoading || countsLoading">正在读取个人学习进度…</span>
            <template v-else
              ><span>部分学习进度暂未加载，图谱仍可浏览。</span
              ><AppButton type="text" size="mini" @click="loadProgress">重试</AppButton></template
            >
          </div>
        </section>

        <aside v-if="!overview" class="kg-detail" aria-label="知识点与关联详情">
          <template v-if="selected">
            <div class="kg-detail-heading">
              <p class="kg-eyebrow">{{ chapterName(selected.chapterCode) }}</p>
              <h2>{{ nodeTitle(selected) }}</h2>
              <p
                v-if="!progressLoading && !progressError"
                class="kg-learning-status"
                :class="{ 'is-lit': completedCodes.includes(selected.code) }"
              >
                <Opportunity aria-hidden="true" />{{
                  completedCodes.includes(selected.code) ? '已点亮 · 自评已学完' : '尚未点亮'
                }}
              </p>
              <div class="kg-actions">
                <AppButton size="small" :icon="Reading" @click="openKnowledge('learning')"
                  >去学习</AppButton
                >
                <AppButton
                  type="secondary"
                  size="small"
                  :icon="EditPen"
                  @click="openKnowledge('practice')"
                  >去练习</AppButton
                >
              </div>
            </div>
            <div class="kg-relations" aria-live="polite">
              <p class="kg-list-title">
                直接关联 <span>{{ neighbours.length }}</span>
              </p>
              <p v-if="!neighbours.length" class="kg-empty">
                当前筛选下没有关联，请勾选其他关系类型。
              </p>
              <article v-for="item in neighbours" :key="item.relation.id" class="kg-relation-item">
                <span class="kg-relation-tag" :class="`kg-relation-tag--${item.relation.type}`">{{
                  relationLabel(item)
                }}</span>
                <AppButton type="text" size="small" @click="selectKnowledge(item.node.code)"
                  >{{ nodeTitle(item.node) }} <span aria-hidden="true">↗</span></AppButton
                >
              </article>
            </div>
          </template>
          <template v-else>
            <div class="kg-detail-heading">
              <p class="kg-eyebrow">{{ chapterCode ? '章节知识点' : '学习导航' }}</p>
              <h2>{{ chapterCode ? chapterName(chapterCode) : '让知识连起来' }}</h2>
              <p class="kg-detail-intro">
                {{
                  chapterCode
                    ? '也可以从下方列表选择知识点。'
                    : '先选章节，再查看知识点之间的联系。金黄色节点对应你已点亮的学习记录。'
                }}
              </p>
            </div>
            <div v-if="overview" class="kg-chapter-list">
              <AppButton
                v-for="chapter in graph.chapters"
                :key="chapter.code"
                type="text"
                @click="openChapter(chapter.code)"
                ><span>{{ nodeTitle(chapter) }}</span
                ><small>{{ chapterNodes(chapter.code).length }} 个知识点 →</small></AppButton
              >
            </div>
            <div v-else class="kg-node-list">
              <AppButton
                v-for="node in chapterNodes(chapterCode)"
                :key="node.code"
                type="text"
                size="small"
                @click="selectKnowledge(node.code)"
                ><i
                  class="kg-dot"
                  :class="{ 'kg-dot--lit': completedCodes.includes(node.code) }"
                />{{ nodeTitle(node) }}</AppButton
              >
            </div>
          </template>
          <p class="kg-footnote">
            关联用于学习导航，不代表官方强制先修顺序。点亮状态不等同于测评确认掌握。
          </p>
        </aside>
      </div>
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Back, EditPen, Opportunity, Reading, RefreshRight, Share } from '@element-plus/icons-vue'
import AppButton from '@/components/AppButton.vue'
import KnowledgeGraphCanvas, {
  type GraphVisualNode,
  type GraphVisualEdge,
  type GraphDisplayStats,
} from '@/components/knowledge/KnowledgeGraphCanvas.vue'
import { useAuthStore } from '@/stores/auth'
import { getLearningCompletions, getCompletedQuestionCounts } from '@/api/learningCompletion'
import { getSyllabusData, type SyllabusNode } from '@/api/questionBank'
import { maths1KnowledgeGraph as graph } from '@/content/knowledgeGraph/maths1'
import { knowledgeGraphSubjects } from '@/content/knowledgeGraph/subjects'
import {
  maths1NodeDetailLevel,
  maths1EdgeDetailLevel,
  graphDetailLabels,
} from '@/content/knowledgeGraph/maths1Overview'
import {
  getKnowledgeGraphNeighbours,
  getKnowledgeGraphView,
  type KnowledgeGraphNeighbour,
} from '@/content/knowledgeGraph/navigation'
import {
  knowledgeRelationTypes,
  type KnowledgeRelationType,
  type KnowledgeGraphNode,
  type KnowledgeLabelLanguage,
} from '@/content/knowledgeGraph/types'

import { knowledgeLabel, matchesKnowledgeLabel } from '@/content/knowledgeGraph/labels'

const auth = useAuthStore()
const router = useRouter()
const subjectCode = ref(graph.subjectCode)
const syllabus = ref<SyllabusNode[]>([])
const chaptersLoading = ref(false)
const chaptersError = ref(false)
let chaptersRequest = 0
const chapterCode = ref('')
const selectedCode = ref('')
const searchCode = ref<string>()
const labelLanguage = ref<KnowledgeLabelLanguage>('zh')
// 图谱目前仅发布数学1，其余科目不借用数学1的节点、搜索结果或统计数。
const graphReady = computed(() => subjectCode.value === graph.subjectCode)
// 科目名称与节点名称共用语言设置。
const subjectName = computed(() =>
  nodeTitle(knowledgeGraphSubjects.find((subject) => subject.code === subjectCode.value)!),
)
// 未发布图谱的科目仍显示现有考纲章节，不因此生成教学关联。
const chapters = computed(() =>
  graphReady.value
    ? graph.chapters
    : (findSyllabusSubject(syllabus.value, subjectCode.value)?.children ?? []).map((chapter) => ({
        code: chapter.code,
        title: chapter.cn_label,
        titleEn: chapter.en_label,
      })),
)
const searchQuery = ref('')
// 搜索同时匹配两种名称，不受当前显示语言限制。
const filteredSearchNodes = computed(() =>
  graphReady.value
    ? graph.nodes.filter((node) => matchesKnowledgeLabel(node, searchQuery.value))
    : [],
)
// 画布、章节和侧栏共用名称选择规则。
function nodeTitle(node: Pick<KnowledgeGraphNode, 'title' | 'titleEn'>): string {
  return knowledgeLabel(node, labelLanguage.value)
}
// 自定义筛选保留跨语言搜索能力。
function filterSearch(query: string): void {
  searchQuery.value = query
}
// 重新打开下拉时显示全部候选项，避免遗留上次搜索条件。
function resetSearchFilter(open: boolean): void {
  if (open) searchQuery.value = ''
}
// 考纲可能带考试根节点，按正式科目编号定位，避免依赖返回层级。
function findSyllabusSubject(nodes: SyllabusNode[], code: string): SyllabusNode | undefined {
  for (const node of nodes) {
    if (node.code === code) return node
    const found = node.children && findSyllabusSubject(node.children, code)
    if (found) return found
  }
}
// 科目切换清除上一个科目的局部选择，回到新科目总览或空白占位。
function changeSubject(): void {
  openChapter('')
  searchQuery.value = ''
  visibleTypes.value = ['prerequisite', 'application', 'connection']
}
// 章节名称通过现有 API 获取，过期请求不能回填已切换考试的页面。
async function loadChapters(): Promise<void> {
  const request = ++chaptersRequest
  syllabus.value = []
  chaptersLoading.value = supported.value
  chaptersError.value = false
  if (!supported.value) return
  try {
    const nodes = await getSyllabusData(graph.examType)
    if (request === chaptersRequest) syllabus.value = nodes
  } catch {
    if (request === chaptersRequest) chaptersError.value = true
  } finally {
    if (request === chaptersRequest) chaptersLoading.value = false
  }
}
const resetKey = ref(0)
const displayStats = ref<GraphDisplayStats>()
const visibleTypes = ref<KnowledgeRelationType[]>(['prerequisite', 'application', 'connection'])
const includeCrossChapter = ref(true)
const completedCodes = ref<string[]>([])
const progressLoading = ref(false)
const progressError = ref(false)
const completedQuestionCounts = ref<Record<string, number>>({})
const countsLoading = ref(false)
const countsError = ref(false)
let progressRequest = 0
// 当前仅发布数学1，其他考试不能误用 ESAT 编号或个人进度。
const supported = computed(() => auth.activeExamType === graph.examType)
// 节点身份使用正式考纲编号，搜索和画布选择共享同一个选中状态。
const selected = computed(() =>
  graphReady.value ? graph.nodes.find((node) => node.code === selectedCode.value) : undefined,
)
// 总览保留全图数据供画布分层显示，选中节点后完整呈现一层邻居及已有互联。
const overview = computed(() => !chapterCode.value && !selected.value)
// 画布与关联知识点列表使用同一份类型筛选。
const neighbours = computed(() =>
  selected.value ? getKnowledgeGraphNeighbours(graph, selected.value.code, visibleTypes.value) : [],
)
// 节点与连线共享范围规则，防止章节筛选截断跨章联系或把局部网络退化成星形。
const graphView = computed(() =>
  getKnowledgeGraphView(graph, {
    selectedCode: selected.value?.code,
    chapterCode: chapterCode.value,
    types: overview.value ? undefined : visibleTypes.value,
    includeCrossChapter: includeCrossChapter.value,
  }),
)
// 仅展示人工确认的原始关系，不因两个节点都关联中心而自动连接它们。
const visualEdges = computed<GraphVisualEdge[]>(() =>
  graphView.value.relations.map((edge) => ({
    ...edge,
    detailLevel: maths1EdgeDetailLevel(edge.source, edge.target),
  })),
)
// 个人进度仅叠加节点颜色，不写入共享图谱，也不根据先修关系自动点亮。
const visualNodes = computed<GraphVisualNode[]>(() =>
  graphView.value.nodes.map((node) => ({
    id: node.code,
    detailLevel: maths1NodeDetailLevel(node.code),
    name: nodeTitle(node),
    alternateName: labelLanguage.value === 'zh' ? node.titleEn : node.title,
    selected: node.code === selectedCode.value,
    lit: completedCodes.value.includes(node.code),
    learningStatusText: nodeLearningStatus(node.code),
    questionCountText: nodeQuestionCount(node.code),
  })),
)

// 点亮表示用户自评已学完；未登录或读取失败时不能显示成“未学习”。
function nodeLearningStatus(code: string): string {
  if (!auth.isLoggedIn) return '登录后查看学习状态'
  if (progressLoading.value) return '学习状态：加载中…'
  if (progressError.value) return '学习状态：暂未加载'
  return completedCodes.value.includes(code) ? '已学习' : '未学习'
}

// 只有成功读取的空记录才显示零，避免把请求失败误报成从未完成题目。
function nodeQuestionCount(code: string): string {
  if (!auth.isLoggedIn) return '登录后查看完成题数'
  if (countsLoading.value) return '题库已完成：加载中…'
  if (countsError.value) return '题库已完成：暂未加载'
  return `题库已完成：${completedQuestionCounts.value[code] ?? 0} 题`
}
// 画布用简要描述配合旁边的可操作列表，节点不依赖鼠标或颜色才能访问。
const canvasDescription = computed(() =>
  overview.value
    ? `数学1知识图谱，当前为${graphDetailLabels[displayStats.value?.level ?? 0]}，可放大逐步展开全部${graph.nodes.length}个知识点，或搜索知识点进入完整局部关联。`
    : `${selected.value ? nodeTitle(selected.value) : chapterName(chapterCode.value)}：${visualNodes.value.length}个知识点，${visualEdges.value.length}条关联，可在右侧选择关联知识点。`,
)

// 章节名称与节点范围均来自同一份已验证图谱元数据。
function chapterName(code: string): string {
  const chapter = graph.chapters.find((chapter) => chapter.code === code)
  return chapter ? nodeTitle(chapter) : ''
}
// 列表和画布按同一章节筛选，保持考纲顺序。
function chapterNodes(code: string) {
  return graph.nodes.filter((node) => node.chapterCode === code)
}
// 切换章节回到完整局部图，并清除上一个知识点的跨章聚焦。
function openChapter(code: string): void {
  chapterCode.value = code
  selectedCode.value = ''
  searchCode.value = undefined
  resetKey.value++
}
// 选择知识点同时定位所属章节，关联中的跨章节点也可继续探索。
function selectKnowledge(code: string): void {
  const node = graph.nodes.find((item) => item.code === code)
  if (!node) return
  selectedCode.value = code
  chapterCode.value = node.chapterCode
  searchCode.value = code
}
// 搜索选择沿用节点导航，清空搜索则返回当前章节。
function selectSearch(code: string | undefined): void {
  if (code) selectKnowledge(code)
  else selectedCode.value = ''
}
// 全局网络和章节局部图的圆点都表示同一个知识点身份。
function selectVisualNode(code: string): void {
  selectKnowledge(code)
}
// 说明当前节点在关系中的位置，避免将后续应用误读为自身的先修基础。
function relationLabel(item: KnowledgeGraphNeighbour): string {
  if (item.relation.type === 'connection') return '关联理解'
  if (item.relation.type === 'prerequisite')
    return item.direction === 'incoming' ? '前置基础' : '后续学习'
  return item.direction === 'incoming' ? '可用方法' : '应用去向'
}
// 学习与练习继续经过原工作区的登录及权益流程，不从图谱直接打开付费正文。
function openKnowledge(mode: 'learning' | 'practice'): void {
  if (!supported.value || !selected.value) return
  void router.push({ path: '/question-bank', query: { code: selected.value.code, mode } })
}
// 返回平台时保留当前科目、章节或知识点。
function backToLearning(): void {
  void router.push({
    path: '/question-bank',
    query: supported.value
      ? { mode: 'learning', code: selectedCode.value || chapterCode.value || subjectCode.value }
      : undefined,
  })
}
// 账号或考试切换立即清除两类个人进度；独立失败不互相覆盖，旧响应不能串到新账号。
async function loadProgress(): Promise<void> {
  const request = ++progressRequest
  completedCodes.value = []
  completedQuestionCounts.value = {}
  progressError.value = false
  progressLoading.value = false
  countsError.value = false
  countsLoading.value = false
  if (!supported.value || !auth.isLoggedIn) return
  progressLoading.value = true
  countsLoading.value = true
  const examType = auth.activeExamType
  await Promise.allSettled([
    getLearningCompletions(examType)
      .then((result) => {
        if (request === progressRequest)
          completedCodes.value = result.items.map((item) => item.code)
      })
      .catch(() => {
        if (request === progressRequest) progressError.value = true
      })
      .finally(() => {
        if (request === progressRequest) progressLoading.value = false
      }),
    getCompletedQuestionCounts(examType)
      .then((result) => {
        if (request === progressRequest) completedQuestionCounts.value = result.counts
      })
      .catch(() => {
        if (request === progressRequest) countsError.value = true
      })
      .finally(() => {
        if (request === progressRequest) countsLoading.value = false
      }),
  ])
}
watch(
  supported,
  () => {
    void loadChapters()
  },
  { immediate: true },
)
watch(
  () => [auth.user?.id, auth.isLoggedIn, auth.activeExamType],
  () => {
    void loadProgress()
  },
  { immediate: true, flush: 'sync' },
)
onBeforeUnmount(() => {
  progressRequest++
  chaptersRequest++
})
</script>

<style scoped>
.kg-page {
  width: min(1600px, calc(100% - 80px));
  margin: 0 auto;
  padding: 32px 0 48px;
  color: var(--color-ink);
}
.kg-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 26px;
}
.kg-eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  letter-spacing: 1px;
  color: #64748b;
}
.kg-header h1 {
  margin: 0;
  font-size: 30px;
  line-height: 1.4;
}
.kg-header h1 span {
  font-size: 15px;
  vertical-align: middle;
  margin-left: 10px;
  color: #2852d5;
  background: #edf2ff;
  padding: 4px 10px;
  border-radius: 5px;
}
.kg-subtitle {
  margin: 8px 0 0;
  color: #66758a;
  font-size: 14px;
}
.kg-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
.kg-scope {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 13px;
  color: #6b778c;
}
.kg-scope__subject {
  font-size: 16px;
  font-weight: 650;
  color: #25334a;
}
.kg-toolbar-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  min-width: 0;
}
.kg-search {
  width: 330px;
}
.kg-option-chapter {
  margin-left: 18px;
  color: #8793a5;
}
.kg-chapters {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin: 20px 0 18px;
}
.kg-subject-select {
  width: 160px;
  flex: 0 0 160px;
}
.kg-subject-select :deep(.el-select__wrapper) {
  min-height: 34px;
  border-radius: 6px;
  font-weight: 600;
}
.kg-chapter-options {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
  min-width: 0;
}
.kg-chapter-options :deep(.app-button) {
  max-width: 100%;
  height: auto;
  min-height: 34px;
  white-space: normal;
  text-align: left;
}
.kg-chapter-options :deep(.app-button__label) {
  overflow-wrap: anywhere;
  line-height: 1.5;
  padding: 4px 0;
}
.kg-chapter-status {
  color: #728096;
  font-size: 12px;
  line-height: 34px;
}
.kg-placeholder {
  min-height: clamp(480px, 65vh, 720px);
}
.kg-map-controls {
  display: flex;
  flex-shrink: 0;
  gap: 6px;
}
.kg-chapters :deep(.app-button--primary),
.kg-actions :deep(.app-button--primary) {
  --app-button-bg: #2852d5;
  --app-button-border: #2852d5;
  --app-button-hover-bg: #2147bd;
}
.kg-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 20px;
  align-items: start;
}
.kg-workspace.is-overview {
  grid-template-columns: minmax(0, 1fr);
}
.kg-map {
  border: 1px solid #eef0f6;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 8px 30px #283c6b05;
}
.kg-map-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 22px 24px 12px;
  background: #fff;
}
.kg-map-heading h2 {
  font-size: 17px;
  margin: 0 0 6px;
}
.kg-map-heading p {
  margin: 0;
  font-size: 12px;
  color: #728096;
  line-height: 1.7;
}
.kg-map-heading :deep(.app-button) {
  flex-shrink: 0;
}
.kg-relation-filters {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0 14px;
  padding: 0 24px;
  background: #fff;
}
.kg-relation-filters :deep(.el-checkbox) {
  margin-right: 20px;
}
.kg-line {
  display: inline-block;
  width: 15px;
  border-top: 1px solid #9aaddb;
  vertical-align: middle;
  margin-right: 6px;
}
.kg-line--application {
  border-color: #15968c;
}
.kg-line--connection {
  border-color: #9298a5;
  border-top-style: dashed;
}
.kg-map-footer {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 15px 24px;
  border-top: 1px solid #e8edf5;
  color: #7c889b;
  font-size: 12px;
  background: #fff;
}
.kg-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #5574e8;
  margin-right: 5px;
  flex-shrink: 0;
}
.kg-dot--lit {
  background: #e5a800;
}
.kg-map-footer .kg-dot--lit {
  margin-left: 12px;
}
.kg-progress-status {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 24px;
  background: #fff9e9;
  color: #73603b;
  font-size: 12px;
}
.kg-detail {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  overflow: hidden;
}
.kg-detail-heading {
  padding: 23px 22px 20px;
  border-bottom: 1px solid #edf0f5;
}
.kg-detail h2 {
  margin: 0;
  font-size: 20px;
  line-height: 1.5;
}
.kg-detail-intro {
  font-size: 13px;
  line-height: 1.9;
  color: #6b778c;
  margin: 12px 0 0;
}
.kg-learning-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #8793a5;
  margin: 12px 0;
}
.kg-learning-status svg {
  width: 17px;
  height: 17px;
}
.kg-learning-status.is-lit {
  color: #ac7b00;
}
.kg-actions {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}
.kg-relations {
  padding: 0 22px;
  max-height: 440px;
  overflow-y: auto;
}
.kg-list-title {
  font-size: 13px;
  font-weight: 600;
  color: #526078;
  margin: 20px 0 2px;
}
.kg-list-title span {
  margin-left: 6px;
  font-weight: 400;
}
.kg-relation-item {
  padding: 17px 0;
  border-bottom: 1px solid #edf0f5;
}
.kg-relation-item:last-child {
  border-bottom: 0;
}
.kg-relation-tag {
  display: block;
  color: #637089;
  font-size: 11px;
  margin-bottom: 5px;
}
.kg-relation-tag--prerequisite {
  color: #5274b8;
}
.kg-relation-tag--application {
  color: #14877e;
}
.kg-relation-item :deep(.app-button) {
  padding: 0;
  min-height: 28px;
  height: auto;
  white-space: normal;
  text-align: left;
  color: #253b67;
  font-size: 14px;
}
.kg-relation-item p {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.9;
  color: #6d788a;
}
.kg-chapter-list,
.kg-node-list {
  display: flex;
  flex-direction: column;
  padding: 12px;
  max-height: 460px;
  overflow-y: auto;
}
.kg-chapter-list :deep(.app-button),
.kg-node-list :deep(.app-button) {
  width: 100%;
  justify-content: flex-start;
  height: auto;
  min-height: 42px;
  white-space: normal;
  text-align: left;
}
.kg-chapter-list :deep(.app-button__label) {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.kg-chapter-list small {
  color: #8793a5;
  font-size: 11px;
  font-weight: 400;
}
.kg-node-list :deep(.app-button) {
  font-size: 13px;
  line-height: 1.6;
}
.kg-footnote {
  border-top: 1px solid #edf0f5;
  background: #fafbfd;
  margin: 0;
  padding: 15px 22px;
  color: #929aab;
  font-size: 11px;
  line-height: 1.8;
}
.kg-empty {
  font-size: 13px;
  color: #7c889b;
  line-height: 1.8;
  padding: 20px 0;
}
.kg-unavailable {
  text-align: center;
  padding: 80px 20px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}
.kg-unavailable svg {
  width: 40px;
  height: 40px;
  color: #8c9bb3;
}
.kg-unavailable h2 {
  font-size: 20px;
}
.kg-unavailable p {
  color: #778498;
  font-size: 14px;
}
@media (max-width: 1100px) {
  .kg-page {
    width: calc(100% - 40px);
  }
  .kg-workspace {
    grid-template-columns: minmax(0, 1fr) 300px;
    gap: 14px;
  }
}
@media (max-width: 860px) {
  .kg-page {
    width: calc(100% - 32px);
    padding-top: 22px;
  }
  .kg-workspace {
    grid-template-columns: 1fr;
  }
  .kg-relations,
  .kg-node-list {
    max-height: none;
  }
  .kg-chapter-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .kg-toolbar {
    align-items: stretch;
    flex-direction: column;
    gap: 14px;
  }
  .kg-search {
    width: 100%;
  }
  .kg-header h1 {
    font-size: 25px;
  }
}
@media (max-width: 480px) {
  .kg-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 14px;
  }
  .kg-map-heading {
    padding: 18px 14px 10px;
  }
  .kg-map-heading h2 {
    font-size: 16px;
  }
  .kg-relation-filters {
    padding: 0 14px;
  }
  .kg-relation-filters :deep(.el-checkbox) {
    margin-right: 10px;
  }
  .kg-relation-filters :deep(.el-checkbox__label) {
    font-size: 12px;
  }
  .kg-map-footer {
    padding: 12px 14px;
  }
  .kg-chapter-list {
    grid-template-columns: 1fr;
  }
  .kg-chapters {
    gap: 10px;
  }
  .kg-subject-select {
    width: 120px;
    flex-basis: 120px;
  }
  .kg-placeholder {
    min-height: 380px;
  }
  .kg-chapters :deep(.app-button) {
    padding: 0 10px;
  }
}
</style>
