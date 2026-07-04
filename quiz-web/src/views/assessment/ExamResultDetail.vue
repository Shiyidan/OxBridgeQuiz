<template>
  <div class="practice-report">
    <main class="report-main">
      <div class="report-shell">
        <router-link :to="backTarget" class="back-link">← {{ backLabel }}</router-link>
        <h1 class="report-title">{{ pageTitle }}</h1>

        <div v-if="loading" class="loading-card">加载中...</div>

        <template v-else>
          <template v-if="isPastPaper">
            <section class="evaluation-card">
              <div class="evaluation-icon">✦</div>
              <div>
                <h2>
                  等效标准分评估：{{ examCode }} 预估 {{ standardScore }}（百分位 ~{{
                    percentile
                  }}%）
                </h2>
                <p>{{ evaluationText }}</p>
              </div>
            </section>

            <section class="report-section">
              <h2 class="section-heading">⌁ 总体成绩概览</h2>
              <div class="overview-grid">
                <article class="score-card report-panel">
                  <span class="section-mark" aria-hidden="true"></span>
                  <div class="score-card__head">
                    <span>成绩总览</span>
                    <a href="#question-analysis">查看练习结果</a>
                  </div>
                  <div class="score-main">
                    <strong>{{ correctCount }}</strong>
                    <span>/ {{ totalCount }}</span>
                  </div>
                  <div class="accuracy-row">
                    <span>正确率</span>
                    <strong>{{ accuracyText }}</strong>
                  </div>
                  <div class="accuracy-bar" aria-hidden="true">
                    <span :style="{ width: accuracyText }"></span>
                  </div>
                  <dl class="score-breakdown">
                    <div>
                      <dt>正确</dt>
                      <dd class="is-success">{{ correctCount }} 题</dd>
                    </div>
                    <div>
                      <dt>错误</dt>
                      <dd>{{ wrongCount }} 题</dd>
                    </div>
                    <div>
                      <dt>未答</dt>
                      <dd class="is-muted">{{ skippedCount }} 题</dd>
                    </div>
                  </dl>
                </article>

                <article class="time-card report-panel">
                  <span class="section-mark" aria-hidden="true"></span>
                  <div class="time-card__title">时间与模块分析</div>
                  <div class="time-card__body">
                    <div class="time-summary">
                      <strong>{{ durationMinutes }}</strong
                      ><span>min</span>
                      <p>总用时（规定 {{ paperDurationMinutes }} min）</p>
                      <dl>
                        <div>
                          <dt>平均用时</dt>
                          <dd>{{ averageTimeText }}</dd>
                        </div>
                        <div>
                          <dt>剩余时间</dt>
                          <dd>{{ remainingMinutes }} min</dd>
                        </div>
                        <div>
                          <dt>超时题目</dt>
                          <dd>{{ timeoutQuestionCount }} 题</dd>
                        </div>
                      </dl>
                    </div>
                    <div class="module-bars">
                      <div v-for="item in moduleStats" :key="item.label" class="module-row">
                        <span>{{ item.label }}</span>
                        <div class="bar-track bar-track--ideal">
                          <i :style="{ width: item.idealPercent + '%' }"></i>
                        </div>
                        <div class="bar-track bar-track--actual">
                          <i :style="{ width: item.actualPercent + '%' }"></i>
                        </div>
                      </div>
                      <div class="bar-axis">
                        <span>0</span><span>20</span><span>40</span><span>60</span
                        ><span>{{ paperDurationMinutes }}</span>
                      </div>
                      <div class="bar-legend">
                        <span class="actual-dot"></span>实际用时
                        <span class="ideal-dot"></span>规定时间
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </section>

            <section class="report-section">
              <h2 class="section-heading">▣ 知识点掌握度</h2>
              <article class="knowledge-panel">
                <span class="section-mark" aria-hidden="true"></span>
                <h3>知识点详情</h3>
                <div class="knowledge-list">
                  <template v-for="group in knowledgeGroups" :key="group.title">
                    <div class="knowledge-group">
                      <span class="paper-badge">{{ group.badge }}</span>
                      <strong>{{ group.title }}</strong>
                      <small>{{ group.total }} 个知识点</small>
                    </div>
                    <div
                      v-for="item in group.items"
                      :key="`${group.title}-${item.name}`"
                      class="knowledge-row"
                    >
                      <button type="button">+</button>
                      <strong>{{ item.name }}</strong>
                      <span>{{ item.correct }} / {{ item.total }} 题</span>
                      <div class="knowledge-progress">
                        <i :style="{ width: item.percent + '%' }"></i>
                      </div>
                      <b>{{ item.percent }}%</b>
                    </div>
                  </template>
                </div>
              </article>
            </section>

            <section class="report-section">
              <h2 class="section-heading">◉ AI 提升规划表</h2>
              <article class="improvement-panel">
                <span class="section-mark" aria-hidden="true"></span>
                <div class="improvement-head">
                  <h3>优先级 Top-N 提升清单</h3>
                  <p>按短板分潜力（考点频次×失分空间）排序</p>
                </div>
                <table class="improvement-table">
                  <thead>
                    <tr>
                      <th>排名</th>
                      <th>核心知识点</th>
                      <th>频率</th>
                      <th>当前水平</th>
                      <th>潜在提分</th>
                      <th>建议投入</th>
                      <th>推荐练习路径</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in improvementPlanItems" :key="item.name">
                      <td>{{ item.rank }}</td>
                      <td class="topic-cell">{{ item.name }}</td>
                      <td>{{ item.frequency }}</td>
                      <td>{{ item.level }}%</td>
                      <td class="gain-cell">+{{ item.gain }}</td>
                      <td>{{ item.hours }}</td>
                      <td>
                        <button type="button" class="path-button button_cancel">去完成 →</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </article>
            </section>

            <section class="report-section">
              <article class="learning-path-panel">
                <h2>▣ AI 定制三阶段学习路径</h2>
                <div class="stage-list">
                  <section v-for="stage in learningStages" :key="stage.step" class="stage-item">
                    <div class="stage-index">{{ stage.step }}</div>
                    <div class="stage-content">
                      <h3>
                        {{ stage.title }}
                        <span v-if="stage.badge">{{ stage.badge }}</span>
                      </h3>
                      <p>{{ stage.summary }}</p>
                      <ul>
                        <li v-for="task in stage.tasks" :key="task">{{ task }}</li>
                      </ul>
                    </div>
                  </section>
                </div>
              </article>
            </section>
          </template>

          <section id="question-analysis" class="report-section">
            <h2 v-if="isPastPaper" class="section-heading">试题解析</h2>
            <ExamQuestionAnalysis
              :questions="questions"
              :correct-count="correctCount"
              :exam-title="examTitle"
              :initial-question-id="targetQuestionId"
            />
          </section>
        </template>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
// 答题结果详情：诊断测试展示成绩报告，题库练习复用公共逐题解析。
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import ExamQuestionAnalysis from '@/components/report/ExamQuestionAnalysis.vue'
import { getExamResultData, type ExamQuestion } from '@/api/exam'
import { PAPER_TYPE, normalizePaperType } from '@/constants/paperTypes'

interface PaperMeta {
  id: string
  title: string
  paperType: string
  year?: number
  duration?: number
  code?: string | null
}

interface KnowledgeItem {
  name: string
  total: number
  correct: number
  percent: number
}

interface KnowledgeGroup {
  badge: string
  title: string
  total: number
  items: KnowledgeItem[]
}

interface ImprovementPlanItem extends KnowledgeItem {
  rank: number
  frequency: string
  level: number
  gain: string
  hours: string
  priorityScore: number
}

interface LearningStage {
  step: number
  title: string
  badge?: string
  summary: string
  tasks: string[]
}

type ReportQuestion = ExamQuestion & { id: string }

const route = useRoute()
const examId = computed(() => route.params.id as string)
const targetQuestionId = computed(() => route.query.questionId as string | undefined)
const loading = ref(true)
const totalCount = ref(0)
const correctCount = ref(0)
const questions = ref<ReportQuestion[]>([])
const paper = ref<PaperMeta | null>(null)
const startedAt = ref<string>('')
const submittedAt = ref<string>('')

const isPastPaper = computed(
  () => normalizePaperType(paper.value?.paperType) === PAPER_TYPE.REAL_PAPER,
)
const backTarget = computed(() => (isPastPaper.value ? '/assessment' : '/question-bank'))
const backLabel = computed(() => (isPastPaper.value ? '返回无限模考' : '返回试题库'))
const examCode = computed(() => paper.value?.code?.toUpperCase() || 'TMUA')
const examTitle = computed(() => paper.value?.title || questions.value[0]?.subject || '题库练习')
const pageTitle = computed(() => {
  if (!isPastPaper.value) return '练习结果报告'
  const year = paper.value?.year || new Date().getFullYear()
  return `${examCode.value} 全真模拟卷 ${year} · 成绩报告`
})
const wrongCount = computed(
  () => questions.value.filter((q) => q.selectedAnswer && !q.isCorrect).length,
)
const skippedCount = computed(() => questions.value.filter((q) => !q.selectedAnswer).length)
const accuracy = computed(() => (totalCount.value ? correctCount.value / totalCount.value : 0))
const accuracyText = computed(() => `${(accuracy.value * 100).toFixed(1)}%`)
const standardScore = computed(() => (accuracy.value * 8.8 + 1.2).toFixed(1))
const percentile = computed(() => Math.max(1, Math.min(99, Math.round(accuracy.value * 92))))
const paperDurationMinutes = computed(() => Math.max(1, paper.value?.duration || 120))
const durationSeconds = computed(() => secondsBetween(startedAt.value, submittedAt.value))
const trackedDurationSeconds = computed(() =>
  questions.value.reduce((sum, question) => sum + Math.max(0, question.durationSeconds || 0), 0),
)
const reportDurationSeconds = computed(() => trackedDurationSeconds.value || durationSeconds.value)
const durationMinutes = computed(() => Math.max(1, Math.round(reportDurationSeconds.value / 60)))
const remainingMinutes = computed(() =>
  Math.max(0, paperDurationMinutes.value - durationMinutes.value),
)
const averageTimeText = computed(() => {
  if (!totalCount.value) return '-'
  return `${(reportDurationSeconds.value / totalCount.value / 60).toFixed(1)} min/题`
})
const timeoutQuestionCount = computed(() => {
  if (!totalCount.value) return 0
  const idealSeconds = (paperDurationMinutes.value * 60) / totalCount.value
  return questions.value.filter((question) => (question.durationSeconds || 0) > idealSeconds).length
})
const evaluationText = computed(() => {
  const weak = weakestKnowledge.value?.name || '错题集中知识点'
  return `整体表现${accuracy.value >= 0.75 ? '良好' : '仍有提升空间'}，正确率 ${accuracyText.value}。建议优先强化 ${weak}，再结合逐题解析复盘解题路径和时间分配。`
})
const moduleStats = computed(() => buildModuleStats())
const knowledgeGroups = computed(() => buildKnowledgeGroups())
const weakestKnowledge = computed(
  () =>
    knowledgeGroups.value.flatMap((group) => group.items).sort((a, b) => a.percent - b.percent)[0],
)
const improvementPlanItems = computed(() => buildImprovementPlanItems())
const learningStages = computed(() => buildLearningStages())

// 报告详情统一加载考试记录，再根据 paperType 区分诊断报告和题库练习。
onMounted(async () => {
  try {
    const data = await getExamResultData(examId.value)
    totalCount.value = data.examRecord.totalQuestions
    correctCount.value = data.examRecord.correctCount
    paper.value = data.examRecord.paper || null
    startedAt.value = data.examRecord.startedAt
    submittedAt.value = data.examRecord.submittedAt
    questions.value = (data.questions || []).map((q, i) => ({
      ...q,
      id: q.id || q.questionId || `result-q-${i + 1}`,
      number: i + 1,
      images: q.images || [],
    }))
  } finally {
    loading.value = false
  }
})

// 两个 ISO 时间都存在时计算真实用时，异常数据回退为 0。
function secondsBetween(start: string, end: string): number {
  const startMs = new Date(start).getTime()
  const endMs = new Date(end).getTime()
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) return 0
  return Math.round((endMs - startMs) / 1000)
}

// 当前没有逐题计时数据时，按题量比例估算模块用时用于报告概览。
function buildModuleStats() {
  const groups = splitQuestionModules()
  return groups.map((group) => {
    const ratio = totalCount.value ? group.questions.length / totalCount.value : 0
    const ideal = Math.round(paperDurationMinutes.value * ratio)
    const trackedSeconds = group.questions.reduce(
      (sum, question) => sum + Math.max(0, question.durationSeconds || 0),
      0,
    )
    const actual = Math.round((trackedSeconds || reportDurationSeconds.value * ratio) / 60)
    return {
      label: group.label,
      actual,
      ideal,
      actualPercent: Math.min(100, (actual / paperDurationMinutes.value) * 100),
      idealPercent: Math.min(100, (ideal / paperDurationMinutes.value) * 100),
    }
  })
}

// 套卷未显式提供 Paper1/Paper2 时，按题号顺序拆成两个模块。
function splitQuestionModules() {
  const midpoint = Math.ceil(questions.value.length / 2)
  return [
    { label: 'Paper 1', questions: questions.value.slice(0, midpoint) },
    { label: 'Paper 2', questions: questions.value.slice(midpoint) },
  ].filter((group) => group.questions.length)
}

// 诊断报告按知识点聚合正确率，用于呈现掌握度列表。
function buildKnowledgeGroups(): KnowledgeGroup[] {
  return splitQuestionModules().map((module, index) => {
    const map = new Map<string, { total: number; correct: number }>()
    for (const question of module.questions) {
      const points = normalizeKnowledgePoints(question)
      for (const point of points) {
        const item = map.get(point) || { total: 0, correct: 0 }
        item.total += 1
        if (question.isCorrect) item.correct += 1
        map.set(point, item)
      }
    }

    const items = Array.from(map.entries())
      .map(([name, item]) => ({
        name,
        total: item.total,
        correct: item.correct,
        percent: item.total ? Math.round((item.correct / item.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)

    return {
      badge: `P${index + 1}`,
      title: `${module.label}：数学思维`,
      total: items.length,
      items: items.length
        ? items
        : [
            {
              name: '综合能力',
              total: module.questions.length,
              correct: module.questions.filter((q) => q.isCorrect).length,
              percent: module.questions.length
                ? Math.round(
                    (module.questions.filter((q) => q.isCorrect).length / module.questions.length) *
                      100,
                  )
                : 0,
            },
          ],
    }
  })
}

// AI 提升表按出现频率和失分空间排序，优先暴露最值得投入的知识点。
function buildImprovementPlanItems(): ImprovementPlanItem[] {
  const allItems = knowledgeGroups.value.flatMap((group) => group.items)
  return allItems
    .map((item) => {
      const missRate = 1 - item.percent / 100
      const frequency = totalCount.value ? item.total / totalCount.value : 0
      const priorityScore = Number((frequency * missRate * 10).toFixed(2))
      const gain = Math.max(0.6, Math.min(3.2, priorityScore + missRate * 1.8)).toFixed(1)
      const hoursBase = Math.max(2, Math.ceil(item.total * missRate * 2))
      return {
        ...item,
        rank: 0,
        frequency: frequency.toFixed(2),
        level: item.percent,
        gain,
        hours: `${hoursBase}-${hoursBase + 1}h`,
        priorityScore,
      }
    })
    .sort((a, b) => b.priorityScore - a.priorityScore || a.percent - b.percent)
    .slice(0, 4)
    .map((item, index) => ({ ...item, rank: index + 1 }))
}

// 三阶段路径沿用提升表中的短板知识点，生成紧急补缺、系统补强和考前突破三段计划。
function buildLearningStages(): LearningStage[] {
  const weakTopics = improvementPlanItems.value.map((item) => item.name)
  const first = weakTopics[0] || '高频失分知识点'
  const second = weakTopics[1] || '相关综合题型'
  const third = weakTopics[2] || '真题节奏控制'

  return [
    {
      step: 1,
      title: '紧急修补（第1周）',
      summary: `优先解决 ${first} 等高频严重失分项，目标相关知识点正确率回升至 70%+`,
      tasks: [
        `Day 1-2：${first} → 完成专项练习册 [LOG-01]`,
        `Day 3-4：${second} 突破 → 攻克错题本并进行错题举一反三`,
        `Day 5-7：${third} 应用 → 穿插完成 1 套数学单科真卷`,
      ],
    },
    {
      step: 2,
      title: '系统补强（第2-3周）',
      badge: '预计 10-12 小时',
      summary: '中优先级知识点覆盖及跨模块综合运用',
      tasks: [
        `第 2 周：围绕 ${weakTopics.slice(0, 2).join('、') || '核心短板'} 做变式训练`,
        '第 3 周：进行 2 次严格限时（120分钟）的仿真全真模拟以调节考试配速',
      ],
    },
    {
      step: 3,
      title: '考前突破（第4周）',
      badge: '压轴阶段',
      summary: '节奏适应与真题洗礼，重点在于巩固优势与查漏',
      tasks: [
        '第 4 周：完全按考场节奏刷 2 套历年真题卷',
        '回顾错题本中的高频标记错题，建立考心手感。',
      ],
    },
  ]
}

function normalizeKnowledgePoints(question: ReportQuestion): string[] {
  const raw = question.knowledge_points
  if (!Array.isArray(raw) || !raw.length) return [question.subject || '综合能力']
  return raw.map((item: any) => item?.label || item?.code).filter(Boolean)
}
</script>

<style scoped lang="scss">
.practice-report {
  width: 100%;
  min-height: 100vh;
  background: #f8fafc;
  color: #273437;
}

.report-main {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  padding: 40px var(--container-px-desktop) 72px;
}

.report-shell {
  max-width: 100%;
  min-width: 0;
}

.back-link {
  color: #8a999d;
  text-decoration: none;
  font-weight: 700;
}

.report-title {
  margin: 22px 0 28px;
  font-size: 30px;
  letter-spacing: 0;
}

.loading-card,
.evaluation-card,
.report-panel,
.knowledge-panel {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.loading-card {
  padding: 40px;
  color: #64748b;
  text-align: center;
}

.evaluation-card {
  display: flex;
  gap: 18px;
  align-items: flex-start;
  margin-bottom: 64px;
  padding: 24px 28px;
  background: #edf7fd;
  border-color: #cfe2ee;
}

.evaluation-icon {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: #d7eaf3;
  color: #7a969f;
  font-size: 26px;
}

.evaluation-card h2 {
  margin: 0 0 10px;
  color: #174264;
  font-size: 18px;
}

.evaluation-card p {
  margin: 0;
  color: #527082;
  line-height: 1.75;
}

.report-section {
  min-width: 0;
  margin-top: 44px;
}

.report-section:first-of-type {
  margin-top: 0;
}

.section-heading {
  margin: 0 0 24px;
  color: #344246;
  font-size: 24px;
  letter-spacing: 0;
}

.overview-grid {
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 24px;
  min-width: 0;
}

.report-panel {
  min-width: 0;
  padding: 28px 32px;
}

.section-mark {
  display: block;
  width: 48px;
  height: 2px;
  margin-bottom: 16px;
  background: #3b7192;
}

.score-card__head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  color: #64748b;
  font-weight: 700;
}

.score-card__head a {
  color: #1f2937;
  text-decoration: none;
}

.score-main {
  margin: 34px 0 22px;
}

.score-main strong {
  font-size: 52px;
  line-height: 1;
}

.score-main span {
  color: #9aabae;
  font-size: 24px;
  font-weight: 700;
}

.accuracy-row,
.score-breakdown div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.accuracy-row {
  color: #64748b;
  font-weight: 700;
}

.accuracy-bar {
  height: 10px;
  margin: 12px 0 18px;
  border-radius: 999px;
  background: #edf1f2;
  overflow: hidden;
}

.accuracy-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #4f86a6;
}

.score-breakdown {
  display: grid;
  gap: 12px;
  margin: 0;
}

.score-breakdown dt,
.score-breakdown dd {
  margin: 0;
}

.score-breakdown dt {
  color: #6b7c80;
}

.score-breakdown dd {
  color: #273437;
  font-weight: 800;
}

.score-breakdown .is-success {
  color: #13a56b;
}

.score-breakdown .is-muted {
  color: #4f86a6;
}

.time-card__title {
  color: #64748b;
  font-weight: 800;
}

.time-card__body {
  display: grid;
  grid-template-columns: 230px minmax(0, 1fr);
  gap: 36px;
  align-items: center;
  margin-top: 28px;
}

.time-summary strong {
  font-size: 36px;
}

.time-summary > span {
  margin-left: 8px;
  color: #7d8b8f;
  font-weight: 700;
}

.time-summary p {
  margin: 6px 0 24px;
  color: #91a0a4;
}

.time-summary dl {
  display: grid;
  gap: 12px;
  margin: 0;
}

.time-summary div {
  display: flex;
  justify-content: space-between;
}

.time-summary dt,
.time-summary dd {
  margin: 0;
}

.time-summary dt {
  color: #7d8b8f;
}

.time-summary dd {
  color: #273437;
  font-weight: 800;
}

.module-bars {
  display: grid;
  gap: 12px;
}

.module-row {
  display: grid;
  grid-template-columns: 70px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
}

.module-row span {
  color: #6b7c80;
  font-size: 14px;
  text-align: right;
}

.bar-track {
  height: 14px;
  border-radius: 4px;
  background: #edf1f2;
  overflow: hidden;
}

.bar-track i {
  display: block;
  height: 100%;
  border-radius: inherit;
}

.bar-track--ideal i {
  background: #dce5ed;
}

.bar-track--actual i {
  background: #c79235;
}

.bar-axis,
.bar-legend {
  margin-left: 82px;
  display: flex;
  justify-content: space-between;
  color: #8a999d;
  font-size: 13px;
}

.bar-legend {
  justify-content: center;
  gap: 8px;
}

.actual-dot,
.ideal-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.actual-dot {
  background: #c79235;
}

.ideal-dot {
  background: #dce5ed;
}

.knowledge-panel {
  border-color: #abc8d6;
  overflow: hidden;
  max-width: 100%;
}

.knowledge-panel > .section-mark {
  margin: 0 0 0 24px;
  transform: translateY(-1px);
}

.knowledge-panel h3 {
  margin: 28px 24px 22px;
  font-size: 16px;
}

.knowledge-list {
  border-top: 1px solid #eef2f4;
}

.knowledge-group,
.knowledge-row {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) 90px 150px 52px;
  gap: 14px;
  align-items: center;
  padding: 14px 24px;
  border-bottom: 1px solid #eef2f4;
}

.knowledge-group {
  background: #f8fbfd;
  grid-template-columns: 40px minmax(0, 1fr) auto;
}

.paper-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 22px;
  border-radius: 5px;
  background: #d8edf8;
  color: #40718c;
  font-weight: 800;
  font-size: 12px;
}

.knowledge-group small,
.knowledge-row span {
  color: #91a0a4;
}

.knowledge-row button {
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 5px;
  background: #f1f5f6;
  color: #8a999d;
  cursor: default;
}

.knowledge-progress {
  height: 8px;
  border-radius: 999px;
  background: #edf1f2;
  overflow: hidden;
}

.knowledge-progress i {
  display: block;
  height: 100%;
  background: #4f86a6;
}

.knowledge-row b {
  text-align: right;
  color: #344246;
}

.improvement-panel {
  border: 1px solid #abc8d6;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
  max-width: 100%;
}

.improvement-panel > .section-mark {
  margin: 0 0 0 24px;
  transform: translateY(-1px);
}

.improvement-head {
  padding: 28px 28px 24px;
}

.improvement-head h3 {
  margin: 0 0 8px;
  color: #344246;
  font-size: 17px;
}

.improvement-head p {
  margin: 0;
  color: #91a0a4;
}

.improvement-table {
  width: 100%;
  border-collapse: collapse;
}

.improvement-table th {
  padding: 16px 24px;
  background: #f0f5f4;
  color: #7a8a8d;
  font-size: 13px;
  text-align: left;
}

.improvement-table td {
  padding: 18px 24px;
  border-top: 1px solid #f1f3f3;
  color: #344246;
  font-weight: 700;
}

.improvement-table tbody tr:nth-child(odd) {
  background: #fff;
}

.improvement-table tbody tr:nth-child(even) {
  background: #fbfaf8;
}

.topic-cell {
  color: #356d8b;
}

.gain-cell {
  color: #0ca678;
}

.path-button {
  min-width: 78px;
  height: 44px;
  font-weight: 700;
}

.path-button::before {
  content: '';
  display: block;
  width: 42px;
  height: 2px;
  margin: 0 auto 8px;
  background: #4f86a6;
}

.learning-path-panel {
  min-height: 560px;
  padding: 38px 48px 52px;
  border-radius: 8px;
  background: #263d3d;
  color: #dce8e8;
  box-shadow: inset -180px 0 220px rgba(34, 64, 75, 0.22);
}

.learning-path-panel h2 {
  margin: 0 0 34px;
  color: #f3f8f8;
  font-size: 24px;
  letter-spacing: 0;
}

.stage-list {
  display: grid;
  gap: 34px;
}

.stage-item {
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr);
  gap: 22px;
  position: relative;
}

.stage-item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 26px;
  top: 54px;
  bottom: -34px;
  width: 1px;
  background: rgba(220, 232, 232, 0.18);
}

.stage-index {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #4f86a6;
  color: #f8fbfd;
  font-weight: 900;
}

.stage-content h3 {
  margin: 0 0 8px;
  color: #f3f8f8;
  font-size: 21px;
}

.stage-content h3 span {
  display: inline-flex;
  margin-left: 10px;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(79, 134, 166, 0.2);
  color: #8ec7df;
  font-size: 12px;
}

.stage-content p {
  margin: 0 0 18px;
  color: #9db0b0;
  font-size: 15px;
}

.stage-content ul {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.stage-content li {
  color: #c8d7d7;
  font-weight: 700;
}

.stage-content li::before {
  content: '⌁';
  margin-right: 12px;
  color: #9db0b0;
}
</style>
