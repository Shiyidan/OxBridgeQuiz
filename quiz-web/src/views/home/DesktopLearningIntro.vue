<!-- 桌面首页学习介绍：复用真实课程图解与讲解，以知识关系承接专项练习。 -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Connection, Reading, CircleCheck, Right, TopRight, ArrowRight } from '@element-plus/icons-vue'
import AppButton from '@/components/AppButton.vue'
import KnowledgeText from '@/components/knowledge/KnowledgeText.vue'
import TmuaQuadraticDiagram from '@/components/knowledge/TmuaQuadraticDiagram.vue'
import KnowledgeVisual from '@/components/knowledge/KnowledgeVisual.vue'
import { homeLearningSubjects } from './homeLearningSubjects'
import { useAuthStore, type ActiveExamType } from '@/stores/auth'
import KnowledgePracticePreview from './KnowledgePracticePreview.vue'
import type { HomeKnowledgeTopic, HomePracticeDifficulty } from './knowledgePracticeExamples'

const emit = defineEmits<{ navigate: [path: string] }>()
const auth = useAuthStore()
const stage = ref('concept')
const stages = [
  { id: 'concept', label: '概念与方法', icon: Connection, description: '理解定义与核心性质' },
  { id: 'examples', label: '精选例题', icon: Reading, description: '沿着真题理解解题思路' },
  { id: 'check', label: '易错与自测', icon: CircleCheck, description: '检查理解，再进入练习' },
]
const subjects = homeLearningSubjects.filter((subject) => subject.exam === 'ESAT')
const selectedSubjectId = ref('tmua')
// 科目选择仅影响首页预览；点击明确的学习或练习入口时才更新平台考试上下文。
const activeSubject = computed(
  () => homeLearningSubjects.find((subject) => subject.id === selectedSubjectId.value)!,
)
// 每科只展示所选讲义的第一节，图解、例题与自查共享同一份真实课程内容。
const lesson = computed(() => activeSubject.value.lesson.sections[0]!)
// 精选例题沿用该节既有题源及解析，不复用其他学科的示例。
const example = computed(() => lesson.value.examFocus?.examples[0])
// 自查只取当前课程的三项关键检查点。
const checklist = computed(() => lesson.value.examFocus?.checklist.slice(0, 3) || [])
const checkedItems = ref<number[]>([])
// 更换科目时回到概念页并清空旧自查，避免上一科的内容状态残留。
watch(selectedSubjectId, () => {
  stage.value = 'concept'
  checkedItems.value = []
})
const difficulty = ref<HomePracticeDifficulty>('medium')
const difficulties: Array<{ id: HomePracticeDifficulty; label: string }> = [
  { id: 'easy', label: '简单' },
  { id: 'medium', label: '中等' },
  { id: 'hard', label: '困难' },
]
const knowledgeNodes: Array<{
  id: HomeKnowledgeTopic
  label: string
  code: string
  x: number
  y: number
}> = [
  {
    id: 'functions',
    label: '函数',
    code: '221007',
    x: 50,
    y: 49,
  },
  {
    id: 'domain',
    label: '定义域',
    code: '221007',
    x: 29,
    y: 29,
  },
  {
    id: 'graph',
    label: '图像',
    code: '221003',
    x: 72,
    y: 28,
  },
  {
    id: 'equations',
    label: '方程',
    code: '221003',
    x: 80,
    y: 67,
  },
  {
    id: 'composite',
    label: '复合函数',
    code: '221007',
    x: 36,
    y: 80,
  },
  {
    id: 'inequalities',
    label: '不等式',
    code: '221005',
    x: 19,
    y: 60,
  },
]
const selectedNodeId = ref<HomeKnowledgeTopic>('functions')
// 当前节点决定学习入口与专项练习的考纲范围。
const selectedNode = computed(
  () => knowledgeNodes.find((node) => node.id === selectedNodeId.value)!,
)

// 课程入口同步考试上下文，再由首页容器保留原有登录与导航流程。
function enterLearning(code = lesson.value.code, exam: ActiveExamType = activeSubject.value.exam) {
  auth.setActiveExamType(exam)
  emit('navigate', `/question-bank?mode=learning&code=${code}`)
}

// 练习入口只选择范围与难度，进入现有练习页后由用户开始作答。
function enterPractice(code = selectedNode.value.code, exam: ActiveExamType = 'TMUA') {
  auth.setActiveExamType(exam)
  emit('navigate', `/question-bank?mode=practice&code=${code}&difficulty=${difficulty.value}`)
}

// 自查使用课程已有检查清单，仅保留本次页面内的确认状态。
function toggleCheck(index: number) {
  checkedItems.value = checkedItems.value.includes(index)
    ? checkedItems.value.filter((item) => item !== index)
    : [...checkedItems.value, index]
}
</script>

<template>
  <section id="home-learning-intro" class="learning-intro" aria-labelledby="learning-intro-title">
    <div class="learning-container">
      <header class="section-heading">
        <div>
          <h2 id="learning-intro-title">看懂，再练透。</h2>
          <p>从概念与图解，到真题推理与即时自测。</p>
        </div>
        <AppButton type="text" :icon="Right" icon-position="right" @click="enterLearning()"
          >进入学习</AppButton
        >
      </header>

      <div class="subject-nav" role="group" aria-label="选择学习预览科目">
        <span class="exam-label" :class="{ 'exam-label--active': activeSubject.exam === 'ESAT' }"
          >ESAT</span
        >
        <AppButton
          v-for="subject in subjects"
          :key="subject.id"
          type="text"
          size="small"
          :aria-label="`预览${subject.label}`"
          :aria-pressed="selectedSubjectId === subject.id"
          :class="{ 'subject-active': selectedSubjectId === subject.id }"
          @click="selectedSubjectId = subject.id"
          >{{ subject.label }}</AppButton
        >
        <span class="subject-divider" aria-hidden="true"></span>
        <AppButton
          type="text"
          size="small"
          aria-label="预览TMUA"
          :aria-pressed="selectedSubjectId === 'tmua'"
          :class="{ 'subject-active': selectedSubjectId === 'tmua' }"
          @click="selectedSubjectId = 'tmua'"
          >TMUA</AppButton
        >
        <span class="current-subject">代数与函数</span>
      </div>

      <div class="lesson-workspace">
        <header class="workspace-heading">
          <span><i aria-hidden="true"></i> 试题库</span>
          <div class="workspace-modes">
            <span class="current-mode">学习</span>
            <span class="workspace-practice-label">做题</span>
          </div>
        </header>
        <div class="lesson-tabs" role="group" aria-label="切换课程内容">
          <AppButton
            v-for="item in stages"
            :key="item.id"
            type="text"
            size="small"
            :aria-pressed="stage === item.id"
            :class="{ active: stage === item.id }"
            @click="stage = item.id"
            >{{ item.label }}</AppButton
          >
        </div>
        <div class="lesson-body">
          <aside class="chapter-nav" :aria-label="`${activeSubject.label}考纲展示`">
            <span class="chapter-caption">考纲节选</span>
            <ul class="chapter-tree">
              <li v-for="chapter in activeSubject.chapters" :key="chapter.code">
                <span
                  class="chapter-heading"
                  :class="{ 'chapter-heading--open': chapter.children }"
                >
                  <ArrowRight class="chapter-chevron" aria-hidden="true" />
                  {{ chapter.label }}
                </span>
                <ul v-if="chapter.children" class="chapter-children">
                  <li v-for="child in chapter.children" :key="child.code">
                    <span
                      class="chapter-label"
                      :class="{ 'selected-chapter': child.code === lesson.code }"
                      :aria-current="child.code === lesson.code ? 'true' : undefined"
                      >{{ child.label }}</span
                    >
                  </li>
                </ul>
              </li>
            </ul>
          </aside>
          <div class="lesson-content">
            <div
              v-show="stage === 'concept'"
              :key="selectedSubjectId"
              class="subject-preview"
              :class="`subject-preview--${selectedSubjectId}`"
              :tabindex="selectedSubjectId === 'tmua' ? undefined : 0"
              :aria-label="`${lesson.title}互动图解`"
            >
              <TmuaQuadraticDiagram v-if="selectedSubjectId === 'tmua'" compact />
              <KnowledgeVisual
                v-else-if="lesson.visual"
                :kind="lesson.visual"
                :topic="lesson.code"
              />
            </div>
            <div v-if="stage === 'examples' && example" class="example-panel">
              <div class="example-intro">
                <span class="panel-eyebrow">精选例题 · 解析思路</span>
                <h3>{{ example.title }}</h3>
                <p>{{ lesson.title }}</p>
                <AppButton
                  type="text"
                  size="small"
                  :icon="TopRight"
                  icon-position="right"
                  @click="enterLearning()"
                  >查看完整题目与解析</AppButton
                >
              </div>
              <ol class="example-steps">
                <li v-for="(step, index) in example.steps.slice(0, 3)" :key="index">
                  <span class="step-number">0{{ index + 1 }}</span
                  ><KnowledgeText :text="step" />
                </li>
              </ol>
            </div>
            <div v-if="stage === 'check'" class="check-panel">
              <div class="check-intro">
                <span class="panel-eyebrow">先排查易错点</span>
                <h3>关键概念想清楚了吗？</h3>
                <p><KnowledgeText :text="lesson.pitfalls[0] || lesson.summary" /></p>
                <span class="check-progress" aria-live="polite"
                  >理解自查 · 已确认 {{ checkedItems.length }} / {{ checklist.length }} 项</span
                >
              </div>
              <div class="check-list" role="group" :aria-label="`${lesson.title}理解自查`">
                <button
                  v-for="(item, index) in checklist"
                  :key="index"
                  type="button"
                  :aria-pressed="checkedItems.includes(index)"
                  :class="{ checked: checkedItems.includes(index) }"
                  @click="toggleCheck(index)"
                >
                  <span class="check-box" aria-hidden="true">{{
                    checkedItems.includes(index) ? '✓' : ''
                  }}</span>
                  <KnowledgeText :text="item" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <footer class="lesson-footer">
          <button
            v-for="(item, index) in stages"
            :key="item.id"
            type="button"
            class="learning-step"
            @click="stage = item.id"
          >
            <component :is="item.icon" class="step-icon" aria-hidden="true" />
            <span
              ><strong>{{
                index === 0 ? '概念图解' : index === 2 ? '即时自测' : item.label
              }}</strong
              ><small>{{ item.description }}</small></span
            >
            <Right v-if="index < 2" class="step-arrow" aria-hidden="true" />
          </button>
          <AppButton
            class="practice-button"
            :icon="TopRight"
            icon-position="right"
            @click="enterPractice(lesson.code, activeSubject.exam)"
            >去练习</AppButton
          >
        </footer>
      </div>

      <section class="knowledge-section" aria-labelledby="knowledge-map-title">
        <header class="knowledge-heading">
          <div>
            <h3 id="knowledge-map-title">把理解，转化成解题能力。</h3>
            <p>知识关系示意</p>
          </div>
          <p class="map-hint">选择知识点，试一道概念题</p>
        </header>
        <div class="knowledge-map" role="group" aria-label="函数相关知识点">
          <svg
            class="knowledge-lines"
            viewBox="0 0 1000 200"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <ellipse cx="500" cy="100" rx="365" ry="66" class="map-orbit" />
            <ellipse
              cx="500"
              cy="100"
              rx="290"
              ry="57"
              transform="rotate(-7 500 100)"
              class="map-orbit map-orbit--dotted"
            />
            <path
              d="M190 120 Q320 -16 500 98 Q650 192 800 134 M290 58 Q390 148 500 98 Q625 0 720 56 M360 160 Q410 136 500 98"
              class="map-link"
            />
            <path
              d="M190 120 Q350 180 500 98 Q665 38 800 134 M290 58 Q310 142 360 160 M720 56 Q750 100 800 134"
              class="map-link map-link--faint"
            />
            <circle cx="500" cy="98" r="30" class="map-center-ring" />
            <text x="330" y="100" class="math-label">y = f(x)</text>
            <text x="650" y="100" class="math-label">Δx</text>
          </svg>
          <button
            v-for="node in knowledgeNodes"
            :key="node.id"
            type="button"
            class="knowledge-node"
            :class="{ 'knowledge-node--active': selectedNodeId === node.id }"
            :style="{ left: `${node.x}%`, top: `${node.y}%` }"
            :aria-pressed="selectedNodeId === node.id"
            @click="selectedNodeId = node.id"
          >
            <span>{{ node.label }}</span
            ><i aria-hidden="true"></i>
          </button>
        </div>
        <div class="knowledge-toolbar">
          <div class="current-knowledge">
            <span>当前知识点</span><strong>{{ selectedNode.label }}</strong>
          </div>
          <div class="difficulty-options" role="group" aria-label="选择专项练习难度">
            <span>难度</span>
            <AppButton
              v-for="item in difficulties"
              :key="item.id"
              type="text"
              size="small"
              :class="{ active: difficulty === item.id }"
              :aria-pressed="difficulty === item.id"
              @click="difficulty = item.id"
              >{{ item.label }}</AppButton
            >
          </div>
        </div>
        <KnowledgePracticePreview
          :topic="selectedNodeId"
          :topic-label="selectedNode.label"
          :difficulty="difficulty"
          @learn="enterLearning(selectedNode.code, 'TMUA')"
          @practice="enterPractice()"
        />
      </section>
    </div>
  </section>
</template>

<style scoped>
.learning-intro {
  padding: 64px 48px 48px;
  color: #17252e;
  background: linear-gradient(180deg, #fff 65%, #f6faff);
  scroll-margin-top: var(--home-header-height, 72px);
}
.learning-container {
  max-width: 1370px;
  margin: 0 auto;
}
.section-heading,
.knowledge-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}
.section-heading h2 {
  margin: 0;
  font-size: clamp(30px, 2.8vw, 40px);
  line-height: 1.3;
  letter-spacing: -0.04em;
  font-weight: 750;
}
.section-heading p,
.knowledge-heading p {
  margin: 10px 0 0;
  color: #738498;
  font-size: 14px;
}
.learning-intro :deep(.app-button--text) {
  --app-button-color: #6d7e91;
  --app-button-hover-bg: #f0f6fc;
  --app-button-hover-border: transparent;
  --app-button-hover-color: #17252e;
}
.section-heading > :deep(.app-button) {
  --app-button-color: #17252e;
  font-weight: 650;
}
.subject-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(12px, 2vw, 30px);
  margin: 30px 0 18px;
  font-size: 13px;
}
.exam-label {
  font-size: 12px;
  color: #17252e;
  font-weight: 750;
  letter-spacing: 0.04em;
}
.exam-label--active {
  background: #edfbc0;
  padding: 6px 13px;
  border-radius: 5px;
}
.subject-divider {
  width: 1px;
  height: 17px;
  background: #dce4ed;
  margin: 0 8px;
}
.current-subject {
  color: #60758a;
}
.subject-nav :deep(.app-button.el-button.subject-active) {
  --app-button-bg: #edfbc0;
  --app-button-color: #24342e;
  --app-button-hover-bg: #e6f6b2;
  border-radius: 5px;
}
.workspace-practice-label {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 5px;
  color: #17252e;
  font-size: 12px;
  font-weight: 600;
}
.lesson-workspace {
  overflow: hidden;
  border: 1px solid #e0e8f0;
  border-radius: 17px;
  background: #fff;
  box-shadow: 0 5px 26px #284f7510;
}
.workspace-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 43px;
  border-bottom: 1px solid #eef2f6;
  padding: 0 24px;
  font-size: 12px;
  color: #8797a7;
}
.workspace-heading i {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #7ab6fc;
  margin-right: 8px;
}
.workspace-modes {
  display: flex;
  align-items: stretch;
  height: 100%;
  gap: 35px;
}
.current-mode {
  display: flex;
  align-items: center;
  padding: 0 28px;
  border-bottom: 2px solid #d1f353;
  color: #17252e;
  font-weight: 650;
}
.lesson-tabs {
  display: flex;
  align-items: center;
  gap: 24px;
  height: 48px;
  padding: 0 24px;
  border-bottom: 1px solid #eef2f6;
}
.lesson-tabs :deep(.app-button),
.difficulty-options :deep(.app-button) {
  border-radius: 0;
  height: 100%;
  padding: 0 5px;
  position: relative;
  font-weight: 650;
}
.lesson-tabs :deep(.active),
.difficulty-options :deep(.active) {
  --app-button-color: #17252e;
}
.lesson-tabs :deep(.active)::after,
.difficulty-options :deep(.active)::after {
  content: '';
  position: absolute;
  left: 5px;
  right: 5px;
  bottom: 0;
  height: 2px;
  background: #c9ed49;
}
.lesson-body {
  display: grid;
  grid-template-columns: 210px minmax(0, 1fr);
  min-height: 270px;
  padding: 12px 0;
}
.chapter-nav {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-right: 1px solid #edf1f5;
}
.chapter-caption {
  padding-left: 5px;
  font-size: 10px;
  letter-spacing: 0.1em;
  color: #8b9aaa;
}
.chapter-tree,
.chapter-children {
  list-style: none;
  padding: 0;
  margin: 0;
}
.chapter-heading {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 3px;
  font-size: 12px;
  line-height: 1.6;
  color: #718397;
}
.chapter-heading--open {
  color: #243646;
  font-weight: 650;
}
.chapter-chevron {
  width: 10px;
  height: 10px;
  margin-top: 4px;
  flex-shrink: 0;
  color: #a3b2c2;
}
.chapter-heading--open .chapter-chevron {
  transform: rotate(90deg);
  color: #718397;
}
.chapter-children {
  margin: 1px 0 5px 8px;
  border-left: 1px solid #e5edf4;
}
.chapter-label {
  display: block;
  padding: 6px 10px 6px 16px;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.8;
  color: #718397;
}
.selected-chapter {
  padding-left: 15px;
  margin-left: -1px;
  border-left: 2px solid #c8ef39;
  color: #32472a;
  font-weight: 700;
  background: linear-gradient(90deg, #f5fbe8, transparent);
}
.lesson-content {
  min-width: 0;
  align-self: center;
}
/* 首页只改变图解容器的排版，图形、参数与联动仍由学习平台组件负责。 */
.subject-preview:not(.subject-preview--tmua) {
  max-height: 460px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #c9dced transparent;
}
.subject-preview:not(.subject-preview--tmua) :deep(figure) {
  margin: 0;
  padding: 20px 24px;
  border: 0;
  border-radius: 0;
  background: transparent;
}
.subject-preview:not(.subject-preview--tmua) :deep(figcaption h5) {
  font-size: 18px;
  margin: 7px 0;
}
.subject-preview:not(.subject-preview--tmua) :deep(figcaption p) {
  font-size: 12px;
  line-height: 1.7;
}
.subject-preview:not(.subject-preview--tmua) :deep(.app-button.el-button) {
  min-width: 0;
  height: 28px;
  padding: 0 9px;
  font-size: 11px;
}
.subject-preview:not(.subject-preview--tmua) :deep(.controls),
.subject-preview:not(.subject-preview--tmua) :deep(.atomic-controls) {
  gap: 6px;
  margin: 8px 0;
}
.subject-preview:not(.subject-preview--tmua) :deep(.insight),
.subject-preview:not(.subject-preview--tmua) :deep(.note),
.subject-preview:not(.subject-preview--tmua) :deep(.atomic-note),
.subject-preview:not(.subject-preview--tmua) :deep(.atomic-explanation) {
  font-size: 12px;
  line-height: 1.8;
}
.subject-preview--mathematics1 :deep(figure),
.subject-preview--mathematics2 :deep(figure),
.subject-preview--physics :deep(figure),
.subject-preview--chemistry :deep(figure) {
  display: grid;
  grid-template-columns: minmax(240px, 0.9fr) minmax(300px, 1.1fr);
  column-gap: 28px;
  align-items: center;
}
.subject-preview--mathematics1 :deep(figure > *),
.subject-preview--mathematics2 :deep(figure > *),
.subject-preview--physics :deep(figure > *),
.subject-preview--chemistry :deep(figure > *) {
  grid-column: 1;
  min-width: 0;
}
.subject-preview--mathematics2 :deep(figure > svg),
.subject-preview--physics :deep(figure > svg),
.subject-preview--chemistry :deep(.atomic-scene) {
  grid-column: 2;
  grid-row: 1 / span 8;
  width: 100%;
  max-height: 300px;
  margin: 0;
}
.subject-preview--mathematics1 :deep(.ratio-story) {
  grid-column: 2;
  grid-row: 1 / span 2;
}
.subject-preview--mathematics1 :deep(figure > svg) {
  grid-column: 2;
  grid-row: 3 / span 3;
  max-height: 150px;
}
.subject-preview--mathematics1 :deep(.quantity) {
  flex-basis: 70px;
  padding: 12px 6px;
}
.subject-preview--mathematics1 :deep(.quantity strong) {
  font-size: 16px;
}
.subject-preview--chemistry :deep(.atomic-scene svg) {
  max-height: 260px;
}
.subject-preview--biology :deep(.atlas-workspace) {
  grid-template-columns: minmax(250px, 1.1fr) minmax(240px, 1fr);
  gap: 20px;
}
.subject-preview--biology :deep(.cell-illustration) {
  max-height: 260px;
}
.subject-preview--biology :deep(.structure-detail) {
  padding: 12px;
}
.subject-preview--biology :deep(.structure-detail dd),
.subject-preview--biology :deep(.detail-trap),
.subject-preview--biology :deep(.atlas-reading),
.subject-preview--biology :deep(.atlas-caution),
.subject-preview--biology :deep(.atlas-microdetail) {
  font-size: 11px;
  line-height: 1.8;
}
.lesson-footer {
  display: grid;
  grid-template-columns: repeat(3, 1fr) auto;
  align-items: center;
  gap: 22px;
  padding: 21px 28px;
  border-top: 1px solid #edf2f7;
  background: linear-gradient(100deg, #fbfdff, #fff);
}
.learning-step {
  display: flex;
  align-items: center;
  gap: 14px;
  border: 0;
  padding: 0;
  text-align: left;
  background: transparent;
  color: #17252e;
  cursor: pointer;
  font-family: inherit;
}
.step-icon {
  width: 27px;
  height: 27px;
  flex-shrink: 0;
  color: #4a96ff;
}
.learning-step strong,
.learning-step small {
  display: block;
}
.learning-step strong {
  font-size: 13px;
  margin-bottom: 5px;
}
.learning-step small {
  font-size: 11px;
  color: #7c8d9f;
}
.step-arrow {
  width: 15px;
  height: 15px;
  margin-left: auto;
  color: #97acbe;
}
.practice-button {
  --app-button-bg: #17252e;
  --app-button-border: #17252e;
  min-width: 118px;
}
.practice-button :deep(.el-icon) {
  color: #d4f54c;
}
.example-panel,
.check-panel {
  display: grid;
  grid-template-columns: 1fr 1.65fr;
  gap: 34px;
  padding: 24px 32px;
}
.panel-eyebrow {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: #4e90da;
}
.example-panel h3,
.check-panel h3 {
  font-size: 20px;
  margin: 12px 0;
  line-height: 1.5;
}
.example-intro > p,
.check-intro > p {
  color: #7c8c9c;
  font-size: 12px;
  line-height: 1.8;
}
.example-intro > :deep(.app-button) {
  margin-top: 12px;
  padding: 0;
}
.example-steps {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 12px;
}
.example-steps li {
  display: flex;
  gap: 12px;
  font-size: 12px;
  line-height: 1.85;
  color: #53697c;
}
.step-number {
  color: #4c97f3;
  font-size: 12px;
  padding-top: 2px;
}
.check-list {
  display: grid;
  gap: 10px;
}
.check-list button {
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  padding: 10px 12px;
  font: inherit;
  font-size: 12px;
  line-height: 1.8;
  color: #5d7284;
  border: 1px solid #e7edf5;
  background: #fafcfe;
  border-radius: 7px;
  cursor: pointer;
}
.check-list button.checked {
  border-color: #aed5fc;
  background: #f0f7ff;
  color: #245e92;
}
.check-box {
  flex-shrink: 0;
  width: 17px;
  height: 17px;
  border: 1px solid #c7d7e8;
  border-radius: 4px;
  text-align: center;
  line-height: 17px;
  color: #2f80d8;
  background: white;
}
.check-progress {
  display: inline-block;
  margin-top: 15px;
  font-size: 11px;
  color: #3984c6;
}
.knowledge-section {
  margin-top: 46px;
}
.knowledge-heading h3 {
  margin: 0;
  font-size: clamp(23px, 2vw, 28px);
  letter-spacing: -0.025em;
}
.knowledge-heading p {
  font-size: 12px;
}
.knowledge-heading .map-hint {
  align-self: center;
  font-size: 11px;
}
.knowledge-map {
  position: relative;
  height: 195px;
  max-width: 1100px;
  margin: 2px auto 0;
  background: radial-gradient(ellipse at 50% 50%, #ecf6ff70, transparent 62%);
}
.knowledge-lines {
  width: 100%;
  height: 100%;
  overflow: visible;
}
.map-orbit {
  fill: none;
  stroke: #d9ebff;
  stroke-width: 1;
}
.map-orbit--dotted {
  stroke-dasharray: 2 8;
}
.map-link {
  fill: none;
  stroke: #bddbff;
  stroke-width: 1.4;
  stroke-dasharray: 1000;
  animation: reveal-connection 1.8s ease-out both;
}
.map-link--faint {
  stroke: #dfedfc;
  stroke-width: 1;
}
.map-center-ring {
  fill: none;
  stroke: #d5e9fc;
  stroke-width: 1;
  stroke-dasharray: 3 5;
}
.math-label {
  fill: #91a6bd;
  font:
    italic 14px Georgia,
    serif;
}
.knowledge-node {
  position: absolute;
  width: 100px;
  height: 52px;
  transform: translate(-50%, -38px);
  border: 0;
  background: transparent;
  cursor: pointer;
  font: inherit;
  color: #243646;
}
.knowledge-node span {
  display: block;
  font-size: 14px;
  font-weight: 650;
  margin-bottom: 9px;
}
.knowledge-node i {
  display: block;
  width: 9px;
  height: 9px;
  margin: 0 auto;
  border-radius: 50%;
  background: #4f9cff;
  border: 2px solid #fff;
  box-shadow: 0 0 0 4px #4f9cff22;
  transition:
    background 0.25s,
    box-shadow 0.25s;
}
.knowledge-node--active span {
  color: #182a28;
}
.knowledge-node--active i {
  background: #99ce00;
  box-shadow:
    0 0 0 4px #d0ef6270,
    0 0 24px 12px #d6fa6c75;
}
.knowledge-node:hover i {
  box-shadow:
    0 0 0 6px #4f9cff25,
    0 0 20px #71aef888;
}
.knowledge-toolbar {
  display: grid;
  grid-template-columns: minmax(190px, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 20px;
  padding: 0 20px;
  border-top: 1px solid #e5edf6;
  min-height: 53px;
}
.current-knowledge {
  display: flex;
  align-items: center;
  gap: 25px;
  min-width: 190px;
}
.current-knowledge span,
.difficulty-options > span {
  color: #7b8da0;
  font-size: 12px;
}
.current-knowledge strong {
  font-size: 13px;
}
.difficulty-options {
  display: flex;
  align-items: center;
  gap: 25px;
  align-self: stretch;
}
.learning-intro button:focus-visible {
  outline: 2px solid #438ff1;
  outline-offset: 4px;
}
@keyframes reveal-connection {
  from {
    stroke-dashoffset: 1000;
  }
  to {
    stroke-dashoffset: 0;
  }
}
@media (max-width: 1200px) {
  .learning-intro {
    padding: 48px 32px 40px;
  }
  .lesson-body {
    grid-template-columns: 180px minmax(0, 1fr);
  }
  .chapter-nav {
    padding: 12px 10px;
  }
  .lesson-footer {
    gap: 14px;
    padding: 20px;
  }
  .learning-step {
    gap: 10px;
  }
  .learning-step small {
    font-size: 10px;
  }
}
@media (max-width: 1050px) {
  .lesson-body {
    display: block;
  }
  .chapter-nav {
    display: none;
  }
  .subject-nav {
    gap: 10px;
  }
  .difficulty-options {
    gap: 16px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .map-link {
    animation: none;
  }
  .knowledge-node i {
    transition: none;
  }
}
</style>
