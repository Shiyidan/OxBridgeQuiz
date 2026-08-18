<!-- 诊断报告 V2：按“整体评估—详细分析—提升路径”还原统一的 ESAT/TMUA 报告体验。 -->
<template>
  <article class="v2-report">
    <header class="report-head">
      <div>
        <h1>{{ report.header.title }}</h1>
      </div>
    </header>

    <div class="head-summary-row">
      <p class="report-subtitle">{{ reportSubtitle }}</p>
      <div class="head-actions">
        <button type="button" class="button button--primary" @click="emit('questionAnalysis')">
          查看题目解析
        </button>
      </div>
    </div>

    <div class="data-window">
      <strong>● 单次诊断快照</strong>
      <span>
        本报告仅基于当前答卷的 {{ report.assessment.basedOnQuestions }} 道题生成，
        不使用其他测试的历史表现
      </span>
      <small>版本号-V2</small>
    </div>

    <nav class="primary-tabs" aria-label="诊断报告内容定位">
      <button
        v-for="item in primaryTabs"
        :key="item.id"
        type="button"
        :class="{ active: activePrimaryTab === item.id }"
        @click="scrollToSection(item.id)"
      >
        {{ item.label }}
      </button>
    </nav>

    <section ref="overallSection" class="report-block" data-section="overall">
      <header class="block-heading">
        <div>
          <h2>整体评估</h2>
          <p>我现在什么水平 · 本次最值得关注什么</p>
        </div>
      </header>

      <div class="opening-grid">
        <div class="opening-copy">
          <div class="hero-card">
            <span>核心结论</span>
            <h3>{{ coreHeadline }}</h3>
            <em>{{ strategyLabel }}</em>
          </div>
          <p>{{ coreExplanation }}</p>
          <div class="opening-actions">
            <button
              v-if="primaryPractice"
              type="button"
              class="button button--primary"
              @click="emitPractice(primaryPractice)"
            >
              {{ primaryPracticeButtonLabel }}
            </button>
            <button type="button" class="button" @click="scrollToSection('plan')">
              查看提升路径
            </button>
          </div>
        </div>

        <div class="position-panel">
          <div class="panel-title">
            <h3>当前定位（平台预估）</h3>
            <span>{{ scoreEntries.length }} 项</span>
          </div>
          <div class="score-lanes">
            <article
              v-for="entry in scoreEntries"
              :key="entry.id"
              class="score-lane"
              :class="{ focus: entry.id === focusScoreId }"
            >
              <div class="score-lane__top">
                <strong>{{ entry.label }}</strong>
                <b>{{ formatScoreRange(entry.scoreRange, entry.score) }}</b>
              </div>
              <div class="score-scale" aria-hidden="true">
                <span class="score-scale__track"></span>
                <span
                  v-if="entry.scoreRange"
                  class="score-scale__band"
                  :style="scoreBandStyle(entry.scoreRange)"
                ></span>
                <i v-for="tick in [1, 3, 5, 7, 9]" :key="tick" :style="scoreTickStyle(tick)">
                  {{ tick }}.0
                </i>
              </div>
              <p>{{ entry.summary }}</p>
            </article>
          </div>
          <p class="position-note">
            {{ report.assessment.methodNote }} 分数均为平台区间估算，不等同于官方成绩。
          </p>
        </div>
      </div>

      <section class="content-section">
        <header class="section-heading">
          <span>01</span>
          <div>
            <h3>{{ referenceSectionTitle }}</h3>
            <p>{{ referenceSectionDescription }}</p>
          </div>
        </header>
        <div class="distribution-card">
          <div class="distribution-main">
            <div class="pill-tabs" role="tablist" aria-label="分数参照切换">
              <button
                v-for="entry in scoreEntries"
                :key="entry.id"
                type="button"
                role="tab"
                :aria-selected="activeScoreId === entry.id"
                :class="{ active: activeScoreId === entry.id }"
                @click="activeScoreId = entry.id"
              >
                {{ entry.shortLabel }}
              </button>
            </div>
            <h4>{{ activeScoreEntry?.label }}：你的平台估分区间</h4>
            <p>{{ distributionDescription }}</p>
            <EsatScoreDistributionChart
              v-if="report.reportKind === 'esat' && activeScoreEntry?.moduleId"
              :module-id="activeScoreEntry.moduleId"
              :score="activeScoreEntry.score"
            />
            <TmuaScoreComparisonChart
              v-else-if="report.reportKind === 'tmua'"
              :modules="report.assessment.modules"
              :overall-score="report.assessment.score"
              :overall-score-range="report.assessment.scoreRange"
              :active-module-id="activeScoreEntry?.moduleId || null"
            />
            <div v-else class="reference-ruler">
              <div class="reference-ruler__labels">
                <span>1.0</span><span>4.0</span><span>7.0</span><span>9.0</span>
              </div>
              <div class="reference-ruler__track">
                <span
                  v-if="activeScoreEntry?.scoreRange"
                  class="reference-ruler__band"
                  :style="scoreBandStyle(activeScoreEntry.scoreRange)"
                ></span>
              </div>
            </div>
          </div>
          <aside class="distribution-reading">
            <h4>怎么读这部分</h4>
            <div class="reading-point">
              <strong>你现在的位置</strong>
              <p>{{ activeScoreEntry?.summary }}</p>
            </div>
            <div class="reading-point">
              <strong>证据范围</strong>
              <p>
                当前结论基于 {{ activeScoreEntry?.correct ?? 0 }}/{{ activeScoreEntry?.total ?? 0 }}
                题作答，并受当前题量与试卷难度影响。
              </p>
            </div>
            <div class="reading-point reading-point--accent">
              <strong>下一步</strong>
              <p>{{ activeScoreEntry?.focusSuggestion || '继续查看详细分析，核对知识领域和时间证据。' }}</p>
            </div>
          </aside>
        </div>
      </section>
    </section>

    <section ref="detailSection" class="report-block" data-section="detail">
      <header class="block-heading">
        <div>
          <h2>详细分析</h2>
          <p>科目与知识点 · 本次测试具体发生了什么</p>
        </div>
      </header>
      <div class="summary-panel">
        <p>{{ detailSummary }}</p>
        <div class="summary-stats">
          <div><span>本次正确率</span><b>{{ accuracyLabel }}</b></div>
          <div><span>主要失分区域</span><b>{{ primaryGapLabel }}</b></div>
          <div><span>时间证据</span><b>{{ timingStatusLabel }}</b></div>
        </div>
      </div>

      <div class="section-switcher">
        <aside class="section-rail" role="tablist" aria-label="详细分析内容">
          <button
            v-for="item in detailTabs"
            :key="item.id"
            type="button"
            role="tab"
            :aria-selected="activeDetailTab === item.id"
            :class="{ active: activeDetailTab === item.id }"
            @click="activeDetailTab = item.id"
          >
            <span>{{ item.index }}</span>
            <strong>{{ item.label }}</strong>
            <small>{{ item.summary }}</small>
          </button>
        </aside>

        <div class="section-panel">
          <template v-if="activeDetailTab === 'knowledge'">
            <header class="panel-heading"><span>02</span><h3>科目与知识点：本次作答表现</h3></header>
            <p class="panel-intro">按本次实际覆盖题量展示事实；题量少时只标记小样本参考或样本不足。</p>
            <div v-if="knowledgeModules.length" class="module-cards">
              <article
                v-for="module in knowledgeModules"
                :key="module.id"
                class="module-card"
                :class="{ focus: module.id === focusModuleId }"
              >
                <div class="module-card__head">
                  <div><strong>{{ module.label }}</strong><small>{{ module.total }} 题</small></div>
                  <b>{{ formatAccuracy(module.accuracy) }}</b>
                  <em>{{ module.id === focusModuleId ? '当前重点' : '作答事实' }}</em>
                </div>
                <p>{{ moduleComment(module.id) }}</p>
                <div class="topic-list">
                  <div v-for="topic in module.topics.filter((item) => item.total >= 3)" :key="topic.code">
                    <span>{{ topic.label }}</span>
                    <div><i :style="{ width: `${knowledgeAccuracyBarWidth(topic.accuracy)}%` }"></i></div>
                    <small>{{ topic.correct }}/{{ topic.total }} · {{ topicEvidenceLabel(topic.total) }}</small>
                  </div>
                </div>
                <p v-if="module.topics.some((item) => item.total < 3)" class="sample-note">
                  样本不足或本次未覆盖：
                  {{ module.topics.filter((item) => item.total < 3).map((item) => item.label).join('、') }}
                </p>
              </article>
            </div>
            <div v-else class="empty-panel">当前答卷缺少可展示的知识领域映射。</div>
          </template>

          <template v-else-if="activeDetailTab === 'errors'">
            <header class="panel-heading"><span>03</span><h3>失分结构：错误集中在哪里</h3></header>
            <p class="panel-intro">这里只展示可确认的错题分布；可能错误原因统一标为“建议核对”，不作为个人错因结论。</p>
            <div class="error-layout">
              <div>
                <h4>{{ errorHeadline }}</h4>
                <div v-if="lossItems.length" class="loss-list">
                  <div v-for="item in lossItems" :key="item.key">
                    <strong>{{ item.label }}</strong>
                    <div><i :style="{ width: `${item.bar}%` }"></i></div>
                    <span>错 {{ item.wrong }}/{{ item.total }}</span>
                  </div>
                </div>
                <div v-else class="empty-panel">本次没有足量知识领域证据可形成失分聚合。</div>
              </div>
              <aside>
                <div class="reading-point">
                  <strong>可确认事实</strong>
                  <p>本次错 {{ report.overview?.wrong ?? 0 }} 题，未作答 {{ report.overview?.unanswered ?? 0 }} 题。</p>
                </div>
                <div v-if="possibleErrorPatterns.length" class="reading-point reading-point--warning">
                  <strong>建议逐题核对</strong>
                  <ul><li v-for="item in possibleErrorPatterns" :key="item">{{ item }}</li></ul>
                </div>
                <button type="button" class="text-action" @click="emit('questionAnalysis')">进入题目解析 →</button>
              </aside>
            </div>
          </template>

          <template v-else>
            <header class="panel-heading"><span>04</span><h3>时间把控：本次限时节奏复盘</h3></header>
            <p class="panel-intro">先看计时覆盖度，再决定可以形成多完整的时间结论。</p>
            <div v-if="timingAvailable" class="timing-layout">
              <div>
                <h4>{{ timingHeadline }}</h4>
                <div class="timing-list">
                  <div v-for="item in report.overview?.timing.modules || []" :key="item.id">
                    <strong>{{ item.label }}</strong>
                    <div><i :style="{ width: `${timingBarWidth(item.actualDurationSeconds, item.plannedDurationSeconds)}%` }"></i></div>
                    <span>{{ formatDuration(item.actualDurationSeconds) }} / {{ formatDuration(item.plannedDurationSeconds) }}</span>
                    <small>{{ formatAccuracy(item.accuracy ?? null) }} 正确率</small>
                  </div>
                </div>
                <div class="summary-stats timing-stats">
                  <div><span>计时覆盖</span><b>{{ formatPercent(report.overview?.timing.timingCoverage) }}</b></div>
                  <div><span>平均题时</span><b>{{ formatSeconds(report.overview?.timing.averageDurationSeconds) }}</b></div>
                  <div><span>未作答</span><b>{{ report.overview?.unanswered ?? 0 }} 题</b></div>
                  <div><span>超时样本</span><b>{{ report.overview?.timing.overtimeQuestionCount ?? 0 }} 题</b></div>
                </div>
              </div>
              <aside>
                <div class="reading-point"><strong>当前判断</strong><p>{{ timingFinding }}</p></div>
                <div class="reading-point reading-point--accent"><strong>训练指向</strong><p>{{ timingDirection }}</p></div>
              </aside>
            </div>
            <div v-else class="empty-panel">逐题计时覆盖不足，当前只保留总用时事实，不形成个人节奏判断。</div>
          </template>
        </div>
      </div>
    </section>

    <section ref="planSection" class="report-block" data-section="plan">
      <header class="block-heading">
        <div>
          <h2>提升路径</h2>
          <p>接下来怎么做 · 把证据转成可执行行动</p>
        </div>
      </header>
      <div class="summary-panel">
        <p>{{ planSummary }}</p>
        <div class="summary-stats">
          <div><span>优先方向</span><b>{{ priorityDirectionCount }} 项</b></div>
          <div><span>规划周期</span><b>{{ planningPeriodLabel }}</b></div>
          <div><span>下一行动</span><b>{{ report.nextAction ? '已生成' : '复盘错题' }}</b></div>
        </div>
      </div>

      <div class="section-switcher">
        <aside class="section-rail" role="tablist" aria-label="提升路径内容">
          <button
            v-for="item in planTabs"
            :key="item.id"
            type="button"
            role="tab"
            :aria-selected="activePlanTab === item.id"
            :class="{ active: activePlanTab === item.id }"
            @click="activePlanTab = item.id"
          >
            <span>{{ item.index }}</span>
            <strong>{{ item.label }}</strong>
            <small>{{ item.summary }}</small>
          </button>
        </aside>

        <div class="section-panel">
          <template v-if="activePlanTab === 'priorities'">
            <header class="panel-heading"><span>05</span><h3>主攻方向：按本次证据排序</h3></header>
            <p class="panel-intro">最多展示三项；没有高、中置信度方向时降级为可验证行动，不把小样本写成确定短板。</p>
            <div v-if="priorityItems.length" class="priority-list">
              <article v-for="item in priorityItems" :key="item.rank">
                <span>{{ item.rank }}</span>
                <div>
                  <strong>{{ item.topicLabel }}</strong>
                  <small>{{ item.moduleLabel }} · {{ item.difficultyLabel }} · {{ item.suggestedHours }}</small>
                  <button type="button" @click="emitPracticeFromGap(item)">创建练习 →</button>
                </div>
                <p>{{ item.priorityReason }}</p>
                <em>{{ item.correct }}/{{ item.total }} 题正确</em>
              </article>
            </div>
            <div v-else-if="moduleSignals.length" class="priority-list">
              <article v-for="(item, index) in moduleSignals.slice(0, 3)" :key="item.moduleId">
                <span>{{ index + 1 }}</span>
                <div>
                  <strong>{{ item.moduleLabel }}</strong>
                  <small>模块级{{ item.level === 'clear' ? '明确短板' : '相对短板' }} · {{ confidenceLabel(item.confidence) }}</small>
                  <button v-if="index === 0 && primaryPractice" type="button" @click="emitPractice(primaryPractice)">
                    创建校准练习 →
                  </button>
                </div>
                <p>{{ moduleSignalReason(item) }}</p>
                <em>{{ item.correct }}/{{ item.total }} 题正确</em>
              </article>
            </div>
            <div v-else-if="report.nextAction" class="priority-list">
              <article>
                <span>1</span>
                <div>
                  <strong>{{ report.nextAction.title }}</strong>
                  <small>{{ report.nextAction.moduleLabel }} · {{ report.nextAction.difficultyLabel }} · 降级指引</small>
                  <button v-if="primaryPractice" type="button" @click="emitPractice(primaryPractice)">
                    {{ primaryPracticeButtonLabel }} →
                  </button>
                </div>
                <p>{{ report.nextAction.whyNow }}</p>
                <em>{{ fallbackPriorityEvidence }}</em>
              </article>
            </div>
            <div v-else class="priority-list">
              <article>
                <span>1</span>
                <div>
                  <strong>{{ fallbackPriorityTitle }}</strong>
                  <small>观察指引 · 等待更多证据</small>
                </div>
                <p>{{ fallbackPriorityGuidance }}</p>
                <em>下次复测</em>
              </article>
            </div>
          </template>

          <template v-else-if="activePlanTab === 'learning'">
            <header class="panel-heading"><span>07</span><h3>{{ learningPlanTitle }}</h3></header>
            <p class="panel-intro">{{ learningPlanIntro }}</p>
            <div v-if="starterDays.length" class="starter-grid">
              <article v-for="day in starterDays" :key="day.day">
                <div class="starter-day-heading">
                  <span>Day {{ day.day }}</span>
                  <h4>{{ day.title }}</h4>
                </div>
                <p>{{ day.diagnosticRationale }}</p>
                <strong>{{ day.durationMinutes }} 分钟 · {{ day.successCriteria }}</strong>
              </article>
            </div>
            <div v-else-if="learningPhases.length" class="phase-grid">
              <article
                v-for="(phase, phaseIndex) in learningPhases"
                :key="phase.id"
                :class="`phase-card--${phase.id}`"
              >
                <span class="phase-period">{{ phasePeriodLabel(phase, phaseIndex) }}</span>
                <h4>{{ phaseDisplayTitle(phase) }}</h4>
                <p class="phase-goal"><strong>目标：</strong>{{ phase.goal }}</p>
                <ul>
                  <li
                    v-for="(item, itemIndex) in phaseActionItems(phase)"
                    :key="`${phase.id}-${itemIndex}-${item}`"
                  >
                    {{ item }}
                  </li>
                </ul>
                <div class="phase-checkpoint">
                  <strong>检查点：</strong>{{ phaseCheckpoint(phase) }}
                </div>
              </article>
            </div>
            <div v-else class="empty-panel">当前资料不足以生成阶段计划，请先查看下一步行动。</div>
          </template>

          <template v-else>
            <header class="panel-heading"><span>06</span><h3>下一步：今天和本周先做什么</h3></header>
            <p class="panel-intro">行动只承接当前报告可以验证的证据，不自动创建练习本。</p>
            <div class="action-list">
              <article v-if="report.nextAction" class="primary">
                <span>今天</span>
                <div class="action-copy">
                  <div class="action-heading">
                    <strong>{{ report.nextAction.title }}</strong>
                    <small>{{ report.nextAction.suggestedMinutes }} 分钟 · {{ report.nextAction.suggestedQuestionCount }} 题</small>
                  </div>
                  <p>{{ report.nextAction.whyNow }}</p>
                </div>
                <button
                  v-if="primaryPractice"
                  type="button"
                  @click="emitPractice(primaryPractice)"
                >
                  创建练习 →
                </button>
              </article>
              <article>
                <span>今天</span>
                <div class="action-copy">
                  <div class="action-heading">
                    <strong>复盘本次错题</strong>
                    <small>{{ report.overview?.wrong ?? 0 }} 道错题</small>
                  </div>
                  <p>先核对错误发生在哪一步，再决定是否进入专项练习。</p>
                </div>
                <button type="button" @click="emit('questionAnalysis')">题目解析 →</button>
              </article>
              <article v-if="firstPlanTask">
                <span>本周</span>
                <div class="action-copy">
                  <div class="action-heading">
                    <strong>{{ firstPlanTask.title }}</strong>
                    <small>{{ firstPlanTask.completionLabel }}</small>
                  </div>
                  <p>完成后按计划中的检查标准判断是否继续加量。</p>
                </div>
                <button type="button" @click="activePlanTab = 'learning'">查看计划 →</button>
              </article>
            </div>
          </template>
        </div>
      </div>
    </section>

  </article>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type {
  DiagnosticAiImprovementPlan,
  DiagnosticAssessmentModule,
  DiagnosticLearningPath,
  DiagnosticReportMeta,
  DiagnosticReportSummary,
} from '@/api/exam'
import EsatScoreDistributionChart from '../shared/EsatScoreDistributionChart.vue'
import TmuaScoreComparisonChart from '../shared/TmuaScoreComparisonChart.vue'

interface PracticePrefill {
  name: string
  knowledgePointCodes: string[]
  difficulty: 'low' | 'medium' | 'high'
  questionCount: number
  durationMinutes: number
}

interface ScoreEntry {
  id: string
  moduleId: string | null
  label: string
  shortLabel: string
  correct: number
  total: number
  score: number | null
  scoreRange: [number, number] | null
  summary: string
  focusSuggestion: string
}

type LearningPhase = DiagnosticLearningPath['phases'][number]
type ModuleWeaknessSignal = NonNullable<DiagnosticAiImprovementPlan['weaknessProfile']>['moduleSignals'][number]

const props = defineProps<{
  report: DiagnosticReportSummary
  meta: DiagnosticReportMeta
}>()

const emit = defineEmits<{
  questionAnalysis: []
  practice: [prefill: PracticePrefill]
}>()

const primaryTabs = [
  { id: 'overall', label: '整体评估' },
  { id: 'detail', label: '详细分析' },
  { id: 'plan', label: '提升路径' },
] as const

const activePrimaryTab = ref<(typeof primaryTabs)[number]['id']>('overall')
const activeDetailTab = ref<'knowledge' | 'errors' | 'timing'>('knowledge')
const activePlanTab = ref<'priorities' | 'learning' | 'next'>('priorities')
const activeScoreId = ref('')
const overallSection = ref<HTMLElement | null>(null)
const detailSection = ref<HTMLElement | null>(null)
const planSection = ref<HTMLElement | null>(null)
let sectionObserver: IntersectionObserver | null = null

const overview = computed(() => props.report.overview)
const gaps = computed(() => props.report.aiImprovementPlan?.highRoiGaps || [])
const weaknessProfile = computed(() => props.report.aiImprovementPlan?.weaknessProfile)
const moduleSignals = computed(() => weaknessProfile.value?.moduleSignals || [])
const difficultySignals = computed(() => weaknessProfile.value?.difficultySignals || [])
const calibrationSignals = computed(() => weaknessProfile.value?.calibrationSignals || [])
const sequenceSignals = computed(() => weaknessProfile.value?.sequenceSignals || [])
const diagnosisMode = computed(() => {
  if (weaknessProfile.value?.diagnosisMode) return weaknessProfile.value.diagnosisMode
  if (gaps.value.length || moduleSignals.value.length || difficultySignals.value.length) return 'weakness_attack'
  return (overview.value?.wrong ?? 0) > 0 ? 'balanced_improvement' : 'stable_progress'
})
const knowledgeModules = computed(() => props.report.knowledgeMastery?.modules || [])
const learningPhases = computed(() => props.report.learningPath?.phases || [])
const starterDays = computed(() => props.report.learningPath?.starterPlan?.days || [])
const priorityItems = computed(() => gaps.value.slice(0, 3))
const priorityDirectionCount = computed(() => (
  priorityItems.value.length || Math.min(3, moduleSignals.value.length) || 1
))
const learningPlanTitle = computed(() => starterDays.value.length
  ? '学习计划：先完成 7 天启动校准'
  : '学习计划：以考试日为锚倒排')
const learningPlanIntro = computed(() => {
  const path = props.report.learningPath
  if (!path) return '当前没有足够资料生成学习计划。'
  if (starterDays.value.length) {
    const missing = path.profile.missingFields.join('、') || '完整备考资料'
    return `当前报告缺少${missing}，先按现有诊断证据安排 7 天启动计划，不虚构长期日期和任务量。`
  }
  const examAnchor = path.profile.examDate ? `${path.profile.examDate} 考试日` : '目标考试窗口'
  return `已按 ${examAnchor}、每周 ${path.summary.weeklyHours} 小时和本次主攻方向，将 ${path.summary.planningWeeks} 周拆为补漏、提速和模考冲刺三阶段，每段结束都设置检查点。`
})

const uniqueGapModules = computed(() => [...new Set([
  ...gaps.value.map((item) => item.moduleLabel),
  ...moduleSignals.value.map((item) => item.moduleLabel),
])])
const focusModuleId = computed(() => (
  gaps.value[0]?.moduleId
  || weaknessProfile.value?.primaryModule?.moduleId
  || weakestAssessmentModule.value?.id
  || ''
))
const focusScoreId = computed(() => {
  if (props.report.reportKind === 'tmua' && scoreEntries.value.some((item) => item.id === 'overall')) return 'overall'
  return focusModuleId.value
})

const weakestAssessmentModule = computed(() => {
  return [...props.report.assessment.modules].sort((a, b) => moduleAccuracy(a) - moduleAccuracy(b))[0] || null
})

const scoreEntries = computed<ScoreEntry[]>(() => {
  const entries = props.report.assessment.modules.map((module) => scoreEntryFromModule(module))
  if (props.report.reportKind !== 'tmua' || !props.report.assessment.scoreRange) return entries
  return [
    {
      id: 'overall',
      moduleId: null,
      label: 'TMUA 综合分',
      shortLabel: '综合分',
      correct: overview.value?.correct || 0,
      total: overview.value?.totalQuestions || props.report.assessment.basedOnQuestions,
      score: props.report.assessment.score,
      scoreRange: props.report.assessment.scoreRange,
      summary: props.report.assessment.positioning?.competitiveness || 'TMUA 官方只提供双 Paper 合并后的综合分。',
      focusSuggestion: gaps.value[0]?.priorityReason || '结合两卷作答事实确定下一步重点。',
    },
    ...entries,
  ]
})

watch(
  scoreEntries,
  (entries) => {
    if (!entries.some((item) => item.id === activeScoreId.value)) activeScoreId.value = entries[0]?.id || ''
  },
  { immediate: true },
)

const activeScoreEntry = computed(() => scoreEntries.value.find((item) => item.id === activeScoreId.value) || scoreEntries.value[0] || null)

// 均衡提分模式用同一组模块事实形成首页总证据，避免退回“没有结论”的系统口吻。
const balancedModuleEvidence = computed(() => {
  const modules = props.report.assessment.modules
  if (!modules.length) return `本次共答对 ${overview.value?.correct ?? 0}/${overview.value?.totalQuestions ?? 0} 题`
  const sameResult = modules.every((module) => (
    module.correct === modules[0]?.correct && module.total === modules[0]?.total
  ))
  const labels = modules.map((module) => module.label.replace(/\s*·.*$/, ''))
  if (sameResult && modules[0]) return `${labels.join(' 与 ')} 均答对 ${modules[0].correct}/${modules[0].total} 题`
  return modules.map((module, index) => `${labels[index]}答对 ${module.correct}/${module.total} 题`).join('，')
})

// 前后段证据直接展示题目位置与正确数，不把后段下降擅自归因为疲劳或时间不足。
const sequenceEvidence = computed(() => sequenceSignals.value.map((signal) => {
  const label = signal.moduleLabel.replace(/\s*·.*$/, '')
  return `${label}前 ${signal.earlyTotal} 题答对 ${signal.earlyCorrect} 题、后 ${signal.lateTotal} 题答对 ${signal.lateCorrect} 题`
}).join('；'))

const strategyLabel = computed(() => {
  if (sequenceSignals.value.length) return '后段稳定性'
  if (moduleSignals.value.length >= 2 || uniqueGapModules.value.length >= 2) return '双重点提升'
  if (gaps.value.length || moduleSignals.value.length || difficultySignals.value.length) return '单重点提升'
  if (diagnosisMode.value === 'balanced_improvement') return '均衡提分'
  return '稳定进阶'
})

const coreHeadline = computed(() => {
  if (sequenceSignals.value.length) {
    const signals = sequenceSignals.value
    const firstSignal = signals[0]!
    const samePattern = signals.length > 1 && signals.every((signal) => (
      signal.earlyCorrect === firstSignal.earlyCorrect
      && signal.earlyTotal === firstSignal.earlyTotal
      && signal.lateCorrect === firstSignal.lateCorrect
      && signal.lateTotal === firstSignal.lateTotal
    ))
    if (samePattern && firstSignal.earlyCorrect === firstSignal.earlyTotal && firstSignal.lateCorrect === 0) {
      return `两卷前 ${firstSignal.earlyTotal} 题全对、后 ${firstSignal.lateTotal} 题全错，后段作答是当前首要问题`
    }
    const labels = signals.map((signal) => signal.moduleLabel.replace(/\s*·.*$/, '')).join('与')
    return `${labels}后段正确率明显下滑，优先解决后段连续失分`
  }
  if (uniqueGapModules.value.length >= 2) {
    return `${uniqueGapModules.value.slice(0, 2).join('与')}需要优先处理，其他模块先保持节奏`
  }
  const moduleSignal = moduleSignals.value[0]
  if (gaps.value[0] && moduleSignal) {
    return `${moduleSignal.moduleLabel}是本次明确短板，先处理${gaps.value[0].topicLabel}`
  }
  if (gaps.value[0]) return `${gaps.value[0].topicLabel}是本次最值得优先处理的方向`
  if (moduleSignal?.level === 'relative') return `${moduleSignal.moduleLabel}是本次相对其他模块更需要优先处理的方向`
  if (moduleSignal) return `${moduleSignal.moduleLabel}是本次有明确证据支持的主要短板`
  if (difficultySignals.value[0]) {
    return `${difficultySignals.value[0].moduleLabel}的${difficultySignals.value[0].difficultyLabel}是本次优先提升层`
  }
  if (diagnosisMode.value === 'balanced_improvement') {
    return props.report.reportKind === 'tmua'
      ? '双卷表现均衡，下一阶段的提分关键是收口分散失分'
      : '各模块暂未形成集中短板，下一阶段重点是收口分散失分'
  }
  return '本次整体表现稳定，下一阶段重点是保持正确率与限时节奏'
})

const coreExplanation = computed(() => {
  if (sequenceSignals.value.length) {
    const lateWrong = sequenceSignals.value.reduce((sum, signal) => sum + signal.lateTotal - signal.lateCorrect, 0)
    const action = props.report.nextAction
    const training = action?.actionType === 'mixed_timed_practice'
      ? `接下来完成 ${action.suggestedQuestionCount} 道中高难度跨知识点限时训练，目标至少答对 4 道。`
      : '接下来先复盘对应错题，再完成一组中高难度跨知识点限时训练。'
    return `${sequenceEvidence.value}。${lateWrong} 道后段错题跨越多个知识点，当前最明确的共同失分特征是题目位置。先核对每题的条件拆解、分情况覆盖和最终验算，${training}`
  }
  const moduleSignal = moduleSignals.value.find((item) => item.moduleId === focusModuleId.value)
  const difficultySignal = difficultySignals.value.find((item) => item.moduleId === focusModuleId.value)
  if (moduleSignal) {
    const accuracy = Math.round(moduleSignal.accuracy * 100)
    const gap = moduleSignal.gapToNext === null
      ? ''
      : `，与下一模块相差 ${Math.round(moduleSignal.gapToNext * 100)} 个百分点`
    const difficulty = difficultySignal
      ? `；其中${difficultySignal.difficultyLabel}答对 ${difficultySignal.correct}/${difficultySignal.total} 题，是当前主要薄弱层`
      : ''
    return `${moduleSignal.moduleLabel}本次答对 ${moduleSignal.correct}/${moduleSignal.total} 题，正确率 ${accuracy}%${gap}${difficulty}。`
  }
  if (difficultySignal) {
    return `${difficultySignal.moduleLabel}的${difficultySignal.difficultyLabel}答对 ${difficultySignal.correct}/${difficultySignal.total} 题，是当前最值得优先处理的难度层。`
  }
  if (diagnosisMode.value === 'balanced_improvement') {
    const wrongCount = overview.value?.wrong ?? 0
    const nextAction = props.report.nextAction
    const action = nextAction
      ? `先复盘错题并用小题组校准${nextAction.topicLabel}；再根据结果决定专项补弱或整卷训练。`
      : '先逐题复盘分散失分，再通过下一套限时卷决定是否需要专项补弱。'
    return `${balancedModuleEvidence.value}，当前没有明显的卷间失衡。${wrongCount} 道错题暂未形成集中短板，${action}`
  }
  if (diagnosisMode.value === 'stable_progress') {
    return `${balancedModuleEvidence.value}，当前表现稳定。下一步继续用限时训练验证正确率和作答节奏。`
  }
  const module = props.report.assessment.modules.find((item) => item.id === focusModuleId.value)
  if (module?.diagnosticAnalysis?.summary) return module.diagnosticAnalysis.summary
  if (props.report.nextAction) return `${props.report.nextAction.whyNow} 建议先完成一组短训练，再根据结果决定是否继续。`
  return `本次共答对 ${overview.value?.correct ?? 0}/${overview.value?.totalQuestions ?? props.report.assessment.basedOnQuestions} 题。报告只陈述当前答卷能够支持的结论。`
})

const primaryPractice = computed<PracticePrefill | null>(() => {
  const action = props.report.nextAction
  if (!action) return null
  return {
    name: `专项练习：${action.topicLabel}`,
    knowledgePointCodes: action.knowledgePointCodes?.length
      ? action.knowledgePointCodes
      : [action.topicCode],
    difficulty: action.difficulty,
    questionCount: action.suggestedQuestionCount,
    durationMinutes: action.suggestedMinutes,
  }
})

const primaryPracticeButtonLabel = computed(() => {
  if (props.report.nextAction?.actionType === 'calibration_test') return '创建校准练习'
  if (props.report.nextAction?.actionType === 'mixed_timed_practice') return '创建后段训练'
  return '创建主攻练习'
})

// 高 ROI 与模块信号都缺失时，使用下一行动的真实证据说明降级指引，避免伪装成确定短板。
const fallbackPriorityEvidence = computed(() => {
  const evidence = props.report.nextAction?.evidence
  if (!evidence || evidence.total <= 0) return '待下一次训练验证'
  return `${evidence.correct}/${evidence.total} 题正确 · ${confidenceLabel(evidence.confidence)}`
})

// 完全没有可生成行动的数据时，仍根据是否存在错题给出最保守的复测方向。
const fallbackPriorityTitle = computed(() => (
  (overview.value?.wrong ?? 0) > 0 ? '先完成本次错题复盘' : '进行限时稳定性复测'
))

// 最低级降级文案只安排可验证动作，不新增知识点、能力或过程归因。
const fallbackPriorityGuidance = computed(() => (
  (overview.value?.wrong ?? 0) > 0
    ? '当前失分还不能聚合为高、中置信度方向。先逐题核对第一个错误步骤，再用下一套同结构限时练习检查是否重复出现。'
    : '本次没有观察到需要补弱的失分。下一次使用同结构限时练习复测正确率和后段稳定性，再决定是否进入专项训练。'
))

const reportSubtitle = computed(() => {
  const target = props.report.learningPath?.profile.targetUniversities.join('、')
  const major = props.report.learningPath?.profile.targetMajor
  const targetText = [target, major].filter(Boolean).join(' · ')
  return `${formatDateTime(props.meta.completedAt)}${targetText ? ` · 目标：${targetText}` : ''}`
})

const referenceSectionTitle = computed(() => props.report.reportKind === 'esat'
  ? '官方历史分布参照'
  : '综合分与 Paper 区间参照')
const referenceSectionDescription = computed(() => props.report.reportKind === 'esat'
  ? '按模块查看当前区间与已审核的公开历史分布；无可靠人群数据时不推断排名。'
  : '综合分展示平台估分区间，Paper 只作内部诊断对照，不展示未经审核的官方分位。')

const distributionDescription = computed(() => {
  const entry = activeScoreEntry.value
  if (!entry) return '暂无可用估分区间。'
  if (props.report.reportKind === 'tmua' && entry.id !== 'overall') {
    return 'Paper 表现只用于平台内部诊断对照，不作为官方 Paper 分数或排名。'
  }
  return `色带表示 ${entry.label} 的平台预估区间；公开分布只作为历史参照，不代表当前个人排名。`
})

const accuracyLabel = computed(() => overview.value?.accuracy === null || overview.value?.accuracy === undefined
  ? '暂无'
  : `${overview.value.accuracy.toFixed(1)}%（${overview.value.totalQuestions} 题）`)
const primaryGapLabel = computed(() => (
  sequenceSignals.value.length
    ? '后段连续失分'
    : gaps.value[0]?.topicLabel
  || difficultySignals.value[0]?.difficultyLabel
  || moduleSignals.value[0]?.moduleLabel
  || props.report.nextAction?.topicLabel
  || calibrationSignals.value[0]?.topicLabel
  || `${overview.value?.wrong ?? 0} 道错题待复盘`
))
const timingStatusLabel = computed(() => {
  const level = overview.value?.timing.analysisLevel
  if (level === 'complete') return '完整计时分析'
  if (level === 'reference') return '部分样本参考'
  return '计时样本不足'
})
const detailSummary = computed(() => {
  const evidenceSummary = sequenceSignals.value.length
    ? `${sequenceEvidence.value}，后段正确率断层是本次最明确的失分结构。`
    : gaps.value[0]
    ? `${gaps.value[0].topicLabel} 是当前证据最集中的失分区域。`
    : moduleSignals.value[0]
      ? `${moduleSignals.value[0].moduleLabel} 已形成模块级短板证据，知识点样本不足时继续以校准方式处理。`
      : diagnosisMode.value === 'balanced_improvement'
        ? '当前失分较分散，先完成错题收口并校准第一观察方向。'
        : '当前整体表现稳定，继续通过限时作答验证正确率与节奏。'
  return `本次答对 ${overview.value?.correct ?? 0} 题、错 ${overview.value?.wrong ?? 0} 题、未作答 ${overview.value?.unanswered ?? 0} 题。${evidenceSummary}`
})
const planSummary = computed(() => props.report.learningPath?.summary.modeReason || (gaps.value.length ? `先处理 ${gaps.value.slice(0, 2).map((item) => item.topicLabel).join('、')}，再根据复盘结果调整投入。` : '先回收本次错题，并用短训练校准小样本信号。'))
const planningPeriodLabel = computed(() => {
  const summary = props.report.learningPath?.summary
  if (!summary) return '待补充资料'
  return summary.planningScope === 'starter' ? '7 天启动' : `${summary.planningWeeks} 周`
})
const firstPlanTask = computed(() => learningPhases.value.flatMap((phase) => phase.tasks)[0] || null)

const lossItems = computed(() => {
  if (sequenceSignals.value.length) {
    return sequenceSignals.value.map((item) => ({
      key: `sequence:${item.moduleId}`,
      label: `${item.moduleLabel.replace(/\s*·.*$/, '')} · 后 ${item.lateTotal} 题`,
      wrong: item.lateTotal - item.lateCorrect,
      total: item.lateTotal,
      bar: Math.max(8, Math.round(((item.lateTotal - item.lateCorrect) / item.lateTotal) * 100)),
    }))
  }
  if (gaps.value.length) {
    return gaps.value.slice(0, 4).map((item) => ({
      key: `${item.moduleId}:${item.topicCode}:${item.difficulty}`,
      label: `${item.moduleLabel} · ${item.topicLabel}`,
      wrong: Math.max(0, item.total - item.correct),
      total: item.total,
      bar: item.total ? Math.max(8, Math.round(((item.total - item.correct) / item.total) * 100)) : 8,
    }))
  }
  if (moduleSignals.value.length) {
    return moduleSignals.value.slice(0, 4).map((item) => ({
      key: `module:${item.moduleId}`,
      label: `${item.moduleLabel} · 模块整体`,
      wrong: Math.max(0, item.total - item.correct),
      total: item.total,
      bar: item.total ? Math.max(8, Math.round(((item.total - item.correct) / item.total) * 100)) : 8,
    }))
  }
  return calibrationSignals.value.slice(0, 4).map((item) => ({
    key: `calibration:${item.moduleId}:${item.topicCode}`,
    label: `${item.moduleLabel} · ${item.topicLabel}（待校准）`,
    wrong: item.wrongCount,
    total: item.total,
    bar: item.total ? Math.max(8, Math.round((item.wrongCount / item.total) * 100)) : 8,
  }))
})
const possibleErrorPatterns = computed(() => [...new Set(gaps.value.flatMap((item) => item.possibleErrorPatterns || []))].slice(0, 4))
const errorHeadline = computed(() => sequenceSignals.value.length
  ? `失分集中在${sequenceSignals.value.length > 1 ? '两卷' : sequenceSignals.value[0]?.moduleLabel || '当前模块'}后段，而不是单一知识点`
  : gaps.value[0]
    ? `失分最集中在 ${gaps.value[0].moduleLabel} 的 ${gaps.value[0].topicLabel}`
  : moduleSignals.value[0]
    ? `当前先处理 ${moduleSignals.value[0].moduleLabel} 的模块级失分`
    : calibrationSignals.value[0]
      ? `本次失分较分散，先校准 ${props.report.nextAction?.topicLabel || calibrationSignals.value[0].topicLabel}`
      : '先逐题回收分散失分，再用下一套限时卷验证改进')

const timingAvailable = computed(() => overview.value?.timing.analysisLevel !== 'unavailable' && Boolean(overview.value?.timing.modules.length))
const timingHeadline = computed(() => {
  const timing = overview.value?.timing
  if (!timing) return '当前没有可靠计时数据'
  if (timing.pacingStatus === 'overtime') return '本次总用时超过计划，需要先核对超时集中位置'
  if (timing.pacingStatus === 'incomplete') return '本次存在未完成题目，需要结合后段用时一起复盘'
  return '本次整体用时在计划范围内，重点看各模块分配是否均衡'
})
const timingFinding = computed(() => {
  const timing = overview.value?.timing
  if (!timing) return '暂无可靠时间判断。'
  const slowWrong = timing.quadrants?.find((item) => item.id === 'slow_wrong')?.count || 0
  if (slowWrong) return `有 ${slowWrong} 道题同时表现为用时较长且作答错误，建议在题目解析中核对卡住的位置。`
  return '当前没有足量证据支持“不会跳题”或“注意力不足”等过程归因。'
})
const timingDirection = computed(() => gaps.value[0]
  ? `先在 ${gaps.value[0].topicLabel} 中完成一组限时训练，并记录超时题的第一处失败步骤。`
  : '保持当前节奏，用下一次限时练习继续校准。')

const detailTabs = computed(() => [
  { id: 'knowledge' as const, index: '02', label: '科目与知识点', summary: `${knowledgeModules.value.length} 个模块的本次覆盖事实` },
  { id: 'errors' as const, index: '03', label: '失分结构', summary: primaryGapLabel.value },
  { id: 'timing' as const, index: '04', label: '时间把控', summary: timingStatusLabel.value },
])
const planTabs = computed(() => [
  { id: 'priorities' as const, index: '05', label: '主攻方向', summary: sequenceSignals.value.length ? '后段稳定性优先' : priorityItems.value.length || moduleSignals.value.length ? `${Math.max(priorityItems.value.length, moduleSignals.value.length)} 项按证据排序` : props.report.nextAction?.title || fallbackPriorityTitle.value },
  { id: 'next' as const, index: '06', label: '下一步', summary: props.report.nextAction?.title || '复盘本次错题' },
  { id: 'learning' as const, index: '07', label: '学习计划', summary: planningPeriodLabel.value },
])

onMounted(() => {
  const sections = [overallSection.value, detailSection.value, planSection.value].filter((item): item is HTMLElement => Boolean(item))
  sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
    const id = visible?.target.getAttribute('data-section')
    if (id === 'overall' || id === 'detail' || id === 'plan') activePrimaryTab.value = id
  }, { rootMargin: '-20% 0px -65% 0px', threshold: [0.05, 0.2, 0.5] })
  sections.forEach((section) => sectionObserver?.observe(section))
})

onBeforeUnmount(() => sectionObserver?.disconnect())

// 阶段名称统一为原型中的补漏、提速和模考冲刺，不展示内部阶段编号。
function phaseDisplayTitle(phase: LearningPhase): string {
  const titles: Record<LearningPhase['id'], string> = {
    foundation: '补漏期',
    improvement: '提速期',
    sprint: '模考冲刺期',
  }
  return titles[phase.id]
}

// 日期范围使用报告生成快照作为起点，跨年时补充年份以避免歧义。
function formatPlanDate(date: Date, includeYear: boolean): string {
  const monthAndDay = `${date.getMonth() + 1}/${date.getDate()}`
  return includeYear ? `${date.getFullYear()}/${monthAndDay}` : monthAndDay
}

// 只有资料中存在精确考试日时才展示日期区间，否则沿用后端生成的周次范围。
function phasePeriodLabel(phase: LearningPhase, phaseIndex: number): string {
  const examDate = props.report.learningPath?.profile.examDate || ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(examDate)) return phase.weekLabel
  const generatedAt = new Date(props.meta.completedAt)
  const targetDate = new Date(`${examDate}T00:00:00`)
  if (Number.isNaN(generatedAt.getTime()) || Number.isNaN(targetDate.getTime())) {
    return phase.weekLabel
  }
  const planStart = new Date(generatedAt.getFullYear(), generatedAt.getMonth(), generatedAt.getDate())
  const elapsedWeeks = learningPhases.value
    .slice(0, phaseIndex)
    .reduce((total, item) => total + item.durationWeeks, 0)
  const startDate = new Date(planStart)
  startDate.setDate(startDate.getDate() + elapsedWeeks * 7)
  if (startDate > targetDate) return phase.weekLabel
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + phase.durationWeeks * 7 - 1)
  if (endDate > targetDate) endDate.setTime(targetDate.getTime())
  const includeYear = startDate.getFullYear() !== endDate.getFullYear()
  return `${formatPlanDate(startDate, includeYear)} – ${formatPlanDate(endDate, includeYear)}`
}

// 阶段卡先展示绑定主攻缺口的任务，再补充该阶段的通用训练活动。
function phaseActionItems(phase: LearningPhase): string[] {
  const taskItems = phase.tasks.map((task) => `${task.period}：${task.title}；${task.completionLabel}`)
  const items = Array.from(new Set([...taskItems, ...phase.activities].filter(Boolean))).slice(0, 4)
  return items.length ? items : [phase.strategy]
}

// 历史 V2 报告没有 checkpoint 字段时使用受控模板补齐，不把执行策略冒充检查结果。
function phaseCheckpoint(phase: LearningPhase): string {
  if (phase.checkpoint) return phase.checkpoint
  if (phase.id === 'foundation') return '完成主攻任务复测；达到阶段目标后进入提速，未达标内容继续保留。'
  if (phase.id === 'improvement') return '完成两次模块限时训练；结果稳定后进入模考冲刺，未稳定项继续保留。'
  return '用最近两套完整模考检查整卷节奏和错题回收是否稳定。'
}

// 模块固定得分率只用于选择页面重点，不改变后端报告中的任何判断。
function moduleAccuracy(module: DiagnosticAssessmentModule): number {
  return module.total > 0 ? module.correct / module.total : 1
}

// 统一把后端模块快照转成 V2 定位卡所需的只读结构。
function scoreEntryFromModule(module: DiagnosticAssessmentModule): ScoreEntry {
  return {
    id: module.id,
    moduleId: module.id,
    label: module.label,
    shortLabel: module.label.replace(/^TMUA\s*/i, '').replace(/ · .+$/, ''),
    correct: module.correct,
    total: module.total,
    score: module.score,
    scoreRange: module.scoreRange,
    summary: module.diagnosticAnalysis?.summary || module.summary,
    focusSuggestion: module.diagnosticAnalysis?.focusSuggestion || '',
  }
}

// 页内主导航只改变阅读位置，不创建新的路由历史。
function scrollToSection(id: 'overall' | 'detail' | 'plan'): void {
  activePrimaryTab.value = id
  const target = id === 'overall' ? overallSection.value : id === 'detail' ? detailSection.value : planSection.value
  void nextTick(() => target?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

// 主行动将报告中已有的受控参数交给练习本创建页，最终仍由学生确认保存。
function emitPractice(prefill: PracticePrefill): void {
  emit('practice', prefill)
}

// 置信度使用面向学生的简短标签，避免页面暴露内部枚举值。
function confidenceLabel(confidence: ModuleWeaknessSignal['confidence']): string {
  if (confidence === 'high') return '高置信度'
  if (confidence === 'medium') return '中置信度'
  return '低置信度'
}

// 模块主攻理由只组合程序提供的正确率和相对差距，不在前端重新判断短板等级。
function moduleSignalReason(item: ModuleWeaknessSignal): string {
  const accuracy = Math.round(item.accuracy * 100)
  const relative = item.gapToNext === null
    ? ''
    : `，与下一模块相差 ${Math.round(item.gapToNext * 100)} 个百分点`
  return `本次答对 ${item.correct}/${item.total} 题，正确率 ${accuracy}%${relative}。`
}

// 优先方向卡使用本次真实题量生成保守的练习预填，不静默保存练习本。
function emitPracticeFromGap(item: DiagnosticAiImprovementPlan['highRoiGaps'][number]): void {
  emit('practice', {
    name: `专项练习：${item.topicLabel}`,
    knowledgePointCodes: [item.topicCode],
    difficulty: item.difficulty,
    questionCount: Math.max(8, Math.min(20, item.total || 8)),
    durationMinutes: 24,
  })
}

// 估分区间映射到 1.0—9.0 标尺，仅用于展示后端已经生成的区间。
function scoreBandStyle(range: [number, number]): Record<string, string> {
  const left = Math.max(0, Math.min(100, ((range[0] - 1) / 8) * 100))
  const right = Math.max(left, Math.min(100, ((range[1] - 1) / 8) * 100))
  return { left: `${left}%`, width: `${Math.max(2, right - left)}%` }
}

// 标尺刻度使用固定量尺位置，避免组件内散落重复计算。
function scoreTickStyle(score: number): Record<string, string> {
  return { left: `${((score - 1) / 8) * 100}%` }
}

// 区间优先展示；旧快照缺区间时才显示点估分并明确为预估。
function formatScoreRange(range: [number, number] | null, score: number | null): string {
  if (range) return `${range[0].toFixed(1)}–${range[1].toFixed(1)}`
  return score === null ? '暂无' : `${score.toFixed(1)}（预估）`
}

// 历史报告的正确率可能使用 0—1 或 0—100，展示前统一换算并限制在百分比范围内。
function normalizePercentage(value: number): number {
  const percentage = value <= 1 ? value * 100 : value
  return Math.min(100, Math.max(0, percentage))
}

// 百分比只格式化后端已有值，不进行新的能力估计。
function formatAccuracy(value: number | null): string {
  return value === null ? '暂无' : `${normalizePercentage(value).toFixed(1)}%`
}

// 比例字段兼容 0—1 与 0—100 两种历史快照格式。
function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '暂无'
  return `${normalizePercentage(value).toFixed(0)}%`
}

// 知识点进度条按正确率展示，零正确不造假进度，非零极小值保留最低可见宽度。
function knowledgeAccuracyBarWidth(value: number | null): number {
  if (value === null) return 0
  const percentage = normalizePercentage(value)
  return percentage > 0 ? Math.max(4, percentage) : 0
}

// 知识领域按 V2 证据规则区分足量、小样本参考与样本不足。
function topicEvidenceLabel(total: number): string {
  if (total >= 5) return '可比较'
  if (total >= 3) return '小样本参考'
  return '样本不足'
}

// 模块点评优先复用生成时保存的诊断文案，缺失时回退到固定作答事实。
function moduleComment(moduleId: string): string {
  const module = props.report.assessment.modules.find((item) => item.id === moduleId)
  return module?.diagnosticAnalysis?.summary || module?.summary || '当前模块暂无补充点评。'
}

// 时间条以计划用时为满格，上限限制为 100%，超时状态由文字单独说明。
function timingBarWidth(actual: number, planned: number): number {
  return planned > 0 ? Math.min(100, Math.round((actual / planned) * 100)) : 0
}

// 用时在报告中统一显示为分钟或分秒，避免暴露原始秒数阅读负担。
function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return '暂无'
  const minutes = Math.floor(seconds / 60)
  const remaining = Math.round(seconds % 60)
  return remaining ? `${minutes}分${remaining}秒` : `${minutes}分钟`
}

// 平均题时保留整数秒即可满足节奏判断展示。
function formatSeconds(seconds: number | null | undefined): string {
  return seconds === null || seconds === undefined ? '暂无' : `${Math.round(seconds)} 秒`
}

// 报告生成时间按中文本地时间展示，历史快照仍使用服务端保存的完成时间。
function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date)
}
</script>

<style scoped lang="scss">
.v2-report {
  --v2-ink: #1c2b26;
  --v2-muted: #5d6b63;
  --v2-line: #dfe6e1;
  --v2-soft: #f1f5f1;
  --v2-teal: #2e7d5b;
  --v2-teal-soft: #e9f3ed;
  --v2-forest: #1e4d3b;
  --v2-amber: #bd7420;
  --v2-amber-soft: #fdf1e1;
  color: var(--v2-ink);
}

button { font: inherit; }

.report-head, .opening-grid, .panel-title, .score-lane__top, .module-card__head,
.block-heading, .section-heading, .panel-heading { display: flex; }

.report-head { align-items: flex-start; gap: 24px; }
.report-head h1 { margin: 0; font-size: clamp(25px, 3vw, 32px); }
.head-summary-row { display: flex; align-items: center; gap: 24px; margin-top: 14px; }
.report-subtitle { margin: 0; color: var(--v2-muted); font-size: 13px; }
.head-actions { display: flex; flex: 0 0 auto; justify-content: flex-end; margin-left: auto; }
.button { padding: 10px 16px; border: 1px solid #cbd4cf; border-radius: 10px; background: #fff; color: var(--v2-ink); cursor: pointer; font-weight: 700; }
.button--primary { border-color: var(--v2-forest); background: var(--v2-forest); color: #fff; }
.button:hover, .button:focus-visible { transform: translateY(-1px); outline: 2px solid transparent; box-shadow: 0 8px 20px rgba(28,43,38,.12); }

.data-window { display: flex; align-items: center; gap: 14px; margin-top: 18px; padding: 13px 16px; border: 1px solid var(--v2-line); border-left: 4px solid var(--v2-teal); border-radius: 10px; background: #fff; color: #286d56; font-size: 12px; }
.data-window small { margin-left: auto; color: var(--v2-muted); }

.primary-tabs { position: sticky; top: var(--nav-height); z-index: 90; display: flex; gap: 28px; margin-top: 24px; border-bottom: 1px solid var(--v2-line); background: rgba(244,247,244,.98); box-shadow: 0 8px 16px rgba(28,43,38,.06); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
.primary-tabs button { padding: 14px 2px 12px; border: 0; border-bottom: 3px solid transparent; background: transparent; color: #758195; cursor: pointer; }
.primary-tabs button.active { border-bottom-color: var(--v2-teal); color: var(--v2-ink); font-weight: 800; }

.report-block { padding-top: 24px; scroll-margin-top: calc(var(--nav-height) + 58px); }
.block-heading { align-items: baseline; gap: 18px; margin: 10px 0 20px; padding: 18px 0 4px; border-top: 3px solid var(--v2-ink); }
.block-heading h2 { margin: 0; padding-left: 12px; border-left: 4px solid var(--v2-teal); font-size: 25px; }
.block-heading p { margin: 4px 0 0; color: var(--v2-muted); font-size: 12px; }

.opening-grid { display: grid; grid-template-columns: minmax(0,1.05fr) minmax(430px,.95fr); gap: 42px; align-items: stretch; }
.opening-copy { align-self: center; padding-left: 26px; border-left: 4px solid var(--v2-teal); }
.hero-card { padding: 26px 30px; border-radius: 16px; background: var(--v2-forest); color: #fff; }
.hero-card > span { color: #9fd8bc; font-size: 11px; font-weight: 800; letter-spacing: .16em; }
.hero-card h3 { margin: 12px 0 16px; font-size: clamp(23px, 2.5vw, 30px); line-height: 1.4; }
.hero-card em { display: inline-flex; padding: 7px 11px; border-radius: 999px; background: rgba(255,255,255,.14); color: #dcefe3; font-size: 11px; font-style: normal; font-weight: 800; }
.opening-copy > p { margin: 18px 0 0; color: #526074; font-size: 14px; line-height: 1.85; }
.opening-actions { display: flex; gap: 10px; margin-top: 22px; }

.position-panel { padding: 24px 26px; border: 1px solid var(--v2-line); border-radius: 16px; background: #fff; box-shadow: 0 1px 3px rgba(28,43,38,.05); }
.panel-title { align-items: flex-end; justify-content: space-between; margin-bottom: 10px; }
.panel-title h3 { margin: 0; font-size: 20px; }
.panel-title span { color: var(--v2-muted); font-size: 10px; }
.score-lane { margin-top: 8px; padding: 14px; border-left: 4px solid #cfd7d2; background: #fbfcfb; }
.score-lane.focus { border-left-color: var(--v2-amber); background: #fff8eb; }
.score-lane__top { align-items: baseline; justify-content: space-between; gap: 12px; }
.score-lane__top strong { font-size: 14px; }
.score-lane__top b { font-size: 21px; }
.score-lane > p { margin: 7px 0 0; color: var(--v2-muted); font-size: 11px; line-height: 1.6; }
.score-scale { position: relative; height: 33px; margin-top: 9px; }
.score-scale__track, .score-scale__band { position: absolute; top: 10px; height: 6px; border-radius: 4px; }
.score-scale__track { right: 0; left: 0; background: #e4e9e6; }
.score-scale__band { background: var(--v2-teal); }
.score-lane.focus .score-scale__band { background: var(--v2-amber); }
.score-scale i { position: absolute; top: 22px; transform: translateX(-50%); color: #8a948f; font-size: 9px; font-style: normal; }
.position-note { margin: 12px 0 0; padding-top: 9px; border-top: 1px dashed var(--v2-line); color: #7b8780; font-size: 10.5px; line-height: 1.65; }

.content-section { padding-top: 30px; }
.section-heading { gap: 16px; margin-bottom: 16px; }
.section-heading > span, .panel-heading > span { color: var(--v2-teal); font-size: 12px; font-weight: 800; }
.section-heading h3, .section-heading p, .panel-heading h3 { margin: 0; }
.section-heading h3 { padding-left: 12px; border-left: 4px solid var(--v2-teal); font-size: 20px; }
.section-heading p { margin-top: 5px; color: var(--v2-muted); font-size: 12px; }
.distribution-card { display: grid; grid-template-columns: minmax(0,1.2fr) minmax(310px,.8fr); gap: 18px; }
.distribution-main, .distribution-reading { padding: 22px; border: 1px solid var(--v2-line); border-radius: 14px; background: #fff; }
.distribution-main h4, .distribution-reading h4 { margin: 14px 0 7px; font-size: 18px; }
.distribution-main > p { margin: 0 0 14px; color: var(--v2-muted); font-size: 11px; line-height: 1.7; }
.pill-tabs { display: flex; gap: 8px; overflow-x: auto; }
.pill-tabs button { flex: none; padding: 7px 14px; border: 1px solid var(--v2-line); border-radius: 5px; background: #fff; color: var(--v2-muted); cursor: pointer; font-size: 12px; }
.pill-tabs button.active { border-color: var(--v2-forest); background: var(--v2-forest); color: #fff; font-weight: 700; }
.reading-point { margin-top: 12px; padding: 13px 15px; border-left: 3px solid var(--v2-teal); border-radius: 0 8px 8px 0; background: var(--v2-soft); }
.reading-point strong { font-size: 13px; }
.reading-point p, .reading-point ul { margin: 5px 0 0; color: #536074; font-size: 12px; line-height: 1.7; }
.reading-point--accent { border-left-color: var(--v2-amber); background: var(--v2-amber-soft); }
.reading-point--warning { border-left-color: var(--v2-amber); }
.reference-ruler { margin: 28px 8px 14px; }
.reference-ruler__labels { display: flex; justify-content: space-between; color: #758195; font-size: 10px; }
.reference-ruler__track { position: relative; height: 18px; margin-top: 10px; border-radius: 9px; background: #e4e9e6; }
.reference-ruler__median, .reference-ruler__high { position: absolute; top: -7px; width: 2px; height: 32px; background: #78837d; }
.reference-ruler__median { left: 43.75%; }.reference-ruler__high { left: 75%; }
.reference-ruler__band { position: absolute; top: 3px; height: 12px; border-radius: 6px; background: rgba(46,125,91,.5); }

.summary-panel { padding: 15px 18px; border: 1px solid var(--v2-line); border-radius: 14px; background: #fff; }
.summary-panel > p { margin: 0; font-size: 13.5px; font-weight: 650; line-height: 1.8; }
.summary-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-top: 12px; }
.summary-stats > div { padding: 10px 13px; border: 1px solid var(--v2-line); border-radius: 7px; background: var(--v2-soft); }
.summary-stats span { display: block; color: var(--v2-muted); font-size: 10.5px; }
.summary-stats b { display: block; margin-top: 4px; font-size: 14px; }

.section-switcher { display: grid; grid-template-columns: 280px minmax(0,1fr); gap: 28px; align-items: start; margin-top: 18px; }
.section-rail { display: flex; flex-direction: column; gap: 10px; }
.section-rail button { padding: 13px 14px; border: 1px solid var(--v2-line); border-radius: 12px; background: #fff; color: var(--v2-ink); cursor: pointer; text-align: left; }
.section-rail button.active { border-color: var(--v2-teal); border-left-width: 3px; background: var(--v2-teal-soft); }
.section-rail span { color: var(--v2-teal); font-size: 11px; font-weight: 800; }
.section-rail strong, .section-rail small { display: block; }
.section-rail strong { margin: 4px 0; font-size: 15px; }
.section-rail small { overflow: hidden; color: #667286; font-size: 11px; line-height: 1.5; text-overflow: ellipsis; white-space: nowrap; }
.section-panel { min-width: 0; }
.panel-heading { align-items: baseline; gap: 10px; }
.panel-heading h3 { font-size: 20px; }
.panel-intro { margin: 7px 0 15px; color: var(--v2-muted); font-size: 11.5px; line-height: 1.7; }
.empty-panel { padding: 28px; border: 1px dashed #cbd4cf; border-radius: 12px; background: var(--v2-soft); color: var(--v2-muted); text-align: center; }

.module-cards { display: grid; gap: 14px; }
.module-card { padding: 18px 20px; border: 1px solid var(--v2-line); border-radius: 14px; background: #fff; }
.module-card.focus { border-left: 3px solid var(--v2-amber); }
.module-card__head { align-items: baseline; gap: 15px; }
.module-card__head div { display: flex; gap: 8px; align-items: baseline; }
.module-card__head small { color: var(--v2-muted); }
.module-card__head b { font-size: 16px; }
.module-card__head em { margin-left: auto; padding: 4px 9px; border-radius: 999px; background: var(--v2-soft); color: var(--v2-muted); font-size: 10px; font-style: normal; }
.module-card.focus .module-card__head em { background: var(--v2-amber-soft); color: #8b5616; }
.module-card > p { margin: 10px 0 0; color: #536074; font-size: 12px; line-height: 1.7; }
.topic-list { display: grid; gap: 9px; margin-top: 14px; }
.topic-list > div { display: grid; grid-template-columns: minmax(130px,1fr) minmax(120px,1.3fr) 150px; gap: 12px; align-items: center; font-size: 12px; }
.topic-list > div > div, .loss-list > div > div, .timing-list > div > div { height: 8px; overflow: hidden; border-radius: 4px; background: var(--v2-soft); }
.topic-list i, .loss-list i, .timing-list i { display: block; height: 100%; border-radius: 4px; background: var(--v2-teal); }
.topic-list small { color: var(--v2-muted); }
.sample-note { padding-top: 9px; border-top: 1px dashed var(--v2-line); font-size: 11px !important; }

.error-layout, .timing-layout { display: grid; grid-template-columns: minmax(0,1.1fr) minmax(280px,.9fr); gap: 28px; }
.error-layout h4, .timing-layout h4 { margin: 0 0 14px; font-size: 18px; }
.loss-list, .timing-list { border-top: 1px solid var(--v2-ink); }
.loss-list > div { display: grid; grid-template-columns: minmax(150px,1fr) minmax(130px,1.3fr) 80px; gap: 12px; align-items: center; padding: 13px 0; border-bottom: 1px solid var(--v2-line); font-size: 12px; }
.loss-list i { background: var(--v2-amber); }
.reading-point ul { padding-left: 18px; }
.text-action { margin-top: 14px; border: 0; background: transparent; color: var(--v2-teal); cursor: pointer; font-weight: 800; }
.timing-list > div { display: grid; grid-template-columns: 110px minmax(100px,1fr) 150px; gap: 10px; align-items: center; padding: 11px 0; border-bottom: 1px solid var(--v2-line); font-size: 12px; }
.timing-list small { grid-column: 1/-1; color: var(--v2-muted); }
.timing-list i { background: var(--v2-teal); }
.timing-stats { grid-template-columns: repeat(4,1fr); }

.priority-list, .action-list { display: grid; gap: 12px; }
.priority-list article { display: grid; grid-template-columns: 46px minmax(190px,.8fr) minmax(240px,1.4fr) auto; gap: 18px; align-items: center; padding: 16px 18px; border: 1px solid var(--v2-line); border-radius: 12px; background: #fff; }
.priority-list article > span, .action-list article > span { display: grid; width: 42px; height: 42px; place-items: center; border-radius: 50%; background: var(--v2-forest); color: #fff; font-weight: 800; }
.priority-list article:nth-child(2) > span { background: var(--v2-amber); }
.priority-list article div strong, .priority-list article div small { display: block; }
.priority-list article small { margin-top: 4px; color: var(--v2-muted); font-size: 10px; }
.priority-list article p { margin: 0; color: #536074; font-size: 12px; line-height: 1.65; }
.priority-list article em { padding: 5px 9px; border-radius: 999px; background: var(--v2-soft); color: var(--v2-muted); font-size: 10px; font-style: normal; white-space: nowrap; }
.priority-list article button { margin-top: 7px; border: 0; background: transparent; color: var(--v2-teal); cursor: pointer; font-size: 11px; font-weight: 800; }
.action-list article { display: grid; grid-template-columns: 58px minmax(0,1fr) auto; gap: 22px; align-items: center; padding: 20px 22px; border: 1px solid var(--v2-line); border-radius: 12px; background: #fff; }
.action-list article.primary { border-color: #bcd8c9; background: var(--v2-teal-soft); }
.action-list article > span { width: auto; height: auto; min-height: 32px; padding: 6px 10px; border-radius: 5px; background: #c5e1d3; color: var(--v2-forest); font-size: 11px; font-weight: 700; }
.action-copy { min-width: 0; }
.action-heading { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; }
.action-heading strong { color: var(--v2-ink); font-size: 19px; font-weight: 600; line-height: 1.45; }
.action-heading small { color: var(--v2-muted); font-size: 11px; white-space: nowrap; }
.action-copy p { margin: 8px 0 0; color: #536074; font-size: 12px; line-height: 1.65; }
.action-list article button { border: 0; background: transparent; color: var(--v2-teal); cursor: pointer; font-size: 11px; font-weight: 800; white-space: nowrap; }

.phase-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 0; border-top: 1px solid var(--v2-ink); }
.phase-grid article, .starter-grid article { padding: 20px; border: 1px solid var(--v2-line); border-radius: 12px; background: #fff; }
.phase-grid article { --phase-accent: var(--v2-teal); position: relative; display: flex; min-width: 0; min-height: 390px; padding: 36px 28px 24px; flex-direction: column; border-radius: 14px; }
.phase-grid article::before { position: absolute; top: 0; left: 0; width: 54px; height: 5px; border-radius: 14px 0 4px; background: var(--phase-accent); content: ''; }
.phase-grid article.phase-card--improvement { --phase-accent: #6f5bd3; }
.phase-grid article.phase-card--sprint { --phase-accent: #bd741f; }
.phase-grid span, .starter-grid span { color: var(--v2-teal); font-size: 11px; font-weight: 800; }
.phase-grid .phase-period { color: #4e5b68; font-size: 12px; letter-spacing: .02em; }
.phase-grid h4 { margin: 14px 0 6px; font-size: 22px; line-height: 1.35; }
.phase-grid p, .starter-grid p { color: #536074; font-size: 12px; line-height: 1.65; }
.phase-grid .phase-goal { min-height: 48px; margin: 0; font-size: 13px; }
.phase-goal strong { color: #445164; }
.phase-grid ul { display: grid; gap: 12px; margin: 18px 0; padding: 0; color: #43516a; font-size: 12px; line-height: 1.65; list-style: none; }
.phase-grid li { position: relative; padding-left: 18px; }
.phase-grid li::before { position: absolute; top: .65em; left: 0; width: 7px; height: 7px; border-radius: 50%; background: var(--phase-accent); content: ''; }
.phase-checkpoint { margin-top: auto; padding: 14px 16px; background: #f2f5f2; color: #40506a; font-size: 11px; line-height: 1.65; }
.phase-checkpoint strong { color: var(--v2-ink); }
.starter-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
.starter-grid article { display: grid; grid-template-columns: minmax(230px,.9fr) minmax(260px,1.15fr) minmax(250px,1fr); gap: 26px; align-items: center; }
.starter-day-heading { min-width: 0; }
.starter-day-heading h4 { margin: 7px 0 0; font-size: 18px; line-height: 1.45; }
.starter-grid p { margin: 0; }
.starter-grid strong { color: var(--v2-muted); font-size: 11px; line-height: 1.6; }

@media (max-width: 1100px) {
  .opening-grid, .distribution-card, .error-layout, .timing-layout { grid-template-columns: 1fr; }
  .section-switcher { grid-template-columns: 230px minmax(0,1fr); }
  .phase-grid { grid-template-columns: 1fr; gap: 12px; border-top: 0; }
  .phase-grid article { min-height: 0; }
  .starter-grid article { grid-template-columns: minmax(210px,.8fr) minmax(0,1.2fr); gap: 18px 24px; }
  .starter-grid article > strong { grid-column: 2; }
}

@media (max-width: 760px) {
  .report-head, .data-window { align-items: flex-start; flex-direction: column; }
  .head-summary-row { align-items: flex-start; flex-direction: column; }
  .head-actions { margin-left: 0; }
  .data-window small { margin-left: 0; }
  .primary-tabs { gap: 18px; overflow-x: auto; }
  .opening-copy { padding-left: 14px; }
  .opening-actions { align-items: stretch; flex-direction: column; }
  .section-switcher { grid-template-columns: 1fr; }
  .section-rail { flex-direction: row; overflow-x: auto; }
  .section-rail button { min-width: 205px; flex: none; }
  .summary-stats, .timing-stats { grid-template-columns: 1fr 1fr; }
  .topic-list > div { grid-template-columns: 1fr; gap: 5px; }
  .priority-list article, .action-list article { grid-template-columns: 42px 1fr; }
  .priority-list article p, .priority-list article em, .action-list article button { grid-column: 2; }
  .action-list article { gap: 14px; padding: 16px; }
  .action-heading { align-items: flex-start; flex-direction: column; gap: 2px; }
  .action-heading strong { font-size: 17px; }
  .starter-grid article { grid-template-columns: 1fr; gap: 8px; }
  .starter-grid article > strong { grid-column: auto; }
}

@media print {
  .primary-tabs, .head-actions, .opening-actions, .section-rail, button { display: none !important; }
  .section-switcher { grid-template-columns: 1fr; }
  .report-block { break-inside: avoid; }
}
</style>
