<!-- 诊断测试首页：按试卷交付方式进入连续作答或分段诊断流程。 -->
<template>
  <div
    class="assessment-page"
    :class="{
      'assessment-page--year-overview': isYearOverview,
      'assessment-page--esat': activeExamType === 'ESAT',
      'assessment-page--tmua': activeExamType === 'TMUA',
    }"
  >
    <NavBar />
    <main class="assessment-shell">
      <header class="page-header">
        <div class="page-header__lead">
          <span class="page-eyebrow">Diagnostic Assessment</span>
          <h1>诊断测试中心</h1>
          <p>{{ assessmentSubtitle }}</p>
        </div>
      </header>

      <section
        v-if="isYearOverview"
        class="assessment-year-overview"
        aria-labelledby="assessment-year-title"
      >
        <div class="assessment-year-overview__heading">
          <div>
            <span>{{ activeExamType }} Collections</span>
            <h2 id="assessment-year-title">按年份选择 {{ activeExamType }} 诊断试卷</h2>
          </div>
          <p>{{ yearOverviewDescription }}</p>
        </div>

        <div v-if="yearLoading" class="empty-state">
          正在加载 {{ activeExamType }} 试卷年份...
        </div>
        <div v-else-if="yearError" class="assessment-year-state assessment-year-state--error">
          <span>{{ yearError }}</span>
          <button type="button" class="button_cancel" @click="loadAssessmentYears">重新加载</button>
        </div>
        <div v-else-if="!assessmentYears.length" class="empty-state">
          暂无已上线的 {{ activeExamType }} 诊断试卷年份，请先在后台发布诊断卷。
        </div>
        <div v-else class="assessment-year-grid">
          <div v-for="item in assessmentYears" :key="item.year" class="assessment-year-card-stack">
            <article
              class="assessment-year-card"
              :class="{ 'assessment-year-card--locked': isYearLocked(item) }"
            >
              <div
                v-if="isYearLocked(item)"
                class="paper-card__lock-overlay assessment-year-card__lock-overlay"
                :aria-label="`${activeExamType} ${item.year} 年会员专享诊断卷`"
                @click.stop
              >
                <div class="paper-card__lock-marker">
                  <el-icon><Lock /></el-icon>
                  <span>会员专享</span>
                </div>
                <div class="paper-card__lock-actions">
                  <button
                    v-if="item.completedAttemptCount > 0"
                    class="paper-card__locked-history-button"
                    type="button"
                    @click.stop="openYearHistory(item)"
                  >
                    历史记录（{{ item.completedAttemptCount }}）
                  </button>
                  <button
                    class="paper-card__unlock-button"
                    type="button"
                    @click.stop="handleUpgradeClick(activeExamType)"
                  >
                    开通会员
                  </button>
                </div>
              </div>
              <button
                class="assessment-year-card__primary"
                type="button"
                :aria-label="`选择 ${activeExamType} ${item.year} 年诊断测试`"
                :disabled="openingYear !== null"
                @click="handleYearSelection(item.year)"
              >
                <span class="assessment-year-card__visual" aria-hidden="true">
                  <span class="assessment-year-card__topline">
                    <i>AceMock</i>
                  </span>
                  <span class="assessment-year-card__cover-copy">
                    <strong>{{ activeExamType }} {{ item.year }}</strong>
                    <small>Equivalent assessment</small>
                  </span>
                </span>
                <span class="assessment-year-card__body">
                  <span class="assessment-year-card__info">
                    <strong>{{ activeExamType }} {{ item.year }} 年诊断卷</strong>
                    <span class="assessment-year-card__summary">
                      <b>{{ yearCardConfigurationLabel }}</b>
                      <em :data-state="yearStatusTone(item)">
                        {{ yearStatusLabel(item) }}
                      </em>
                    </span>
                  </span>
                  <span class="assessment-year-card__action" aria-hidden="true">
                    <el-icon><Right /></el-icon>
                  </span>
                </span>
              </button>
              <button
                v-if="item.completedAttemptCount > 0 && !isYearLocked(item)"
                class="assessment-year-card__history"
                type="button"
                @click="openYearHistory(item)"
              >
                <span>历史记录（{{ item.completedAttemptCount }}）</span>
              </button>
            </article>
          </div>
        </div>
      </section>

      <div
        v-else
        class="assessment-paper-overview"
        :class="{ 'assessment-paper-overview--tmua': activeExamType === 'TMUA' }"
      >
        <section class="paper-filter-bar" aria-label="诊断试卷筛选">
          <div class="paper-filter-bar__title">
            <span>Diagnostic Papers</span>
            <strong>{{ paperListTitle }}</strong>
          </div>
          <div class="paper-filter-bar__controls">
            <div class="paper-filter-control">
              <span>完成状态</span>
              <el-segmented
                v-model="activeStatusFilter"
                class="status-filter"
                :options="statusFilterOptions"
                aria-label="按完成状态筛选诊断试卷"
              />
            </div>
            <div class="paper-filter-control paper-filter-control--chart">
              <span>分数趋势</span>
              <el-switch
                v-model="showScoreTrend"
                inline-prompt
                aria-label="显示或隐藏历次诊断测试分数变化折线图"
              />
            </div>
          </div>
        </section>

        <section v-if="showScoreTrend" class="chart-card">
          <div class="chart-title">
            <div>
              <span>Score Trend</span>
              <strong>{{ scoreTrendTitle }}</strong>
            </div>
          </div>
          <div v-if="scoreTrendLoading" class="score-chart-state">正在加载分数趋势...</div>
          <div v-else-if="scoreTrendError" class="score-chart-state score-chart-state--error">
            <span>{{ scoreTrendError }}</span>
            <button type="button" class="button_cancel" @click="loadScoreTrend">重新加载</button>
          </div>
          <div v-else-if="!scoreTrend?.points.length" class="score-chart-state">
            暂无已完成的 {{ activeExamType }} 诊断测试成绩
          </div>
          <div
            v-else
            ref="chartRef"
            class="score-chart"
            :aria-label="`${activeExamType} 诊断测试每日最新分数堆叠折线图`"
          ></div>
        </section>

        <section class="paper-grid" aria-label="历年真题">
          <article
            v-for="item in filteredDiagnosticTests"
            :key="item.id"
            class="paper-card"
            :class="{
              'paper-card--unavailable': !isPaperAvailable(item),
              'paper-card--locked': isPaperLocked(item) && item.testStatus !== 'completed',
            }"
          >
            <div
              v-if="isPaperLocked(item) && item.testStatus !== 'completed'"
              class="paper-card__lock-overlay"
              :aria-label="`${item.examType} 会员专享试卷`"
              @click.stop
            >
              <div class="paper-card__lock-marker">
                <el-icon><Lock /></el-icon>
                <!-- <span>会员专享</span> -->
              </div>
              <div class="paper-card__lock-actions">
                <button
                  v-if="item.completedAttemptCount > 0"
                  class="paper-card__locked-history-button"
                  type="button"
                  @click.stop="openPaperHistory(item)"
                >
                  历次记录（{{ item.completedAttemptCount }}）
                </button>
                <button
                  class="paper-card__unlock-button"
                  type="button"
                  @click.stop="handleUpgradeClick(item.examType)"
                >
                  开通会员
                </button>
              </div>
            </div>

            <div class="paper-card__heading">
              <div class="paper-card__topline">
                <span
                  class="paper-card__badge"
                  :class="`paper-card__badge--${paperStatusTone(item)}`"
                >
                  {{ paperStatusLabel(item) }}
                </span>
                <div class="paper-card__identity" aria-label="考试类型和年份">
                  <span
                    class="paper-card__exam-type"
                    :class="`paper-card__exam-type--${String(item.examType || '').toLowerCase()}`"
                  >
                    {{ item.examType || 'TMUA' }}
                  </span>
                  <span class="paper-card__year">{{ item.year }}</span>
                </div>
              </div>
              <h2 :title="item.title">{{ item.title }}</h2>
              <SubjectModuleTags
                v-if="item.modules?.length"
                class="paper-card__subject-tags"
                :modules="item.modules"
                align="start"
              />
            </div>

            <div class="paper-card__footer">
              <div
                v-if="item.testStatus === 'completed' && item.correctCount !== null"
                class="paper-card__score"
              >
                <strong>{{ item.correctCount }}/{{ item.totalQuestions }}</strong>
                <span v-if="isReportGenerating(item)">报告 {{ item.reportProgress }}%</span>
                <span v-else>题正确</span>
              </div>
              <div v-else-if="item.testStatus === 'in_progress'" class="paper-card__progress">
                <span>当前进度：</span>
                <strong>{{ currentProgressLabel(item) }}</strong>
              </div>
              <div class="paper-card__actions">
                <button
                  v-if="item.testStatus === 'completed' && isPaperPublished(item)"
                  class="paper-card__button paper-card__button--secondary button_cancel"
                  type="button"
                  :disabled="isPaperLocked(item) || startingPaperId === item.id"
                  @click="handleRetestPaper(item)"
                >
                  重新测试
                </button>
                <button
                  class="paper-card__button button_primary"
                  type="button"
                  :disabled="
                    (isPaperLocked(item) && item.testStatus !== 'completed') ||
                    startingPaperId === item.id
                  "
                  @click="handlePaperAction(item)"
                >
                  {{ startingPaperId === item.id ? '正在检查...' : paperActionLabel(item) }}
                </button>
              </div>
            </div>
          </article>
        </section>

        <div v-if="loading" class="empty-state">加载中...</div>
        <div v-else-if="!filteredDiagnosticTests.length" class="empty-state">
          {{ emptyPaperMessage }}
        </div>
      </div>
    </main>

    <AppConfirmDialog
      v-model="resumeDialogVisible"
      title="继续诊断测试"
      message="您还有未做完的诊断测试，是否继续完成？"
      confirm-text="确认继续"
      cancel-text="取消"
      tone="default"
      :show-header-divider="false"
      @confirm="confirmResumeDiagnostic"
      @cancel="clearPendingResumePaper"
    />

    <AppConfirmDialog
      v-model="tmuaPaperDialogVisible"
      :title="tmuaSelectionYear ? `TMUA ${tmuaSelectionYear} 年 · 确认诊断试卷` : '确认 TMUA 诊断试卷'"
      message="本次诊断包含 Paper 1 和 Paper 2，确认开始答题吗？"
      confirm-text="确认开始"
      cancel-text="取消"
      tone="default"
      :show-header-divider="false"
      @confirm="startSelectedTmuaPaper"
      @cancel="clearTmuaPaperSelection"
    >
      <template #content>
        <div class="tmua-paper-confirmation">
          <p>本次诊断包含以下两个 Paper，确认开始答题吗？</p>
          <div class="tmua-paper-confirmation__options" aria-label="TMUA 必做试卷">
            <div>
              <span aria-hidden="true">✓</span>
              <strong>Paper 1</strong>
              <small>{{ formatModuleSubtitle(tmuaModuleQuestionCounts.paper1, '数学知识应用') }}</small>
              <em>必做</em>
            </div>
            <div>
              <span aria-hidden="true">✓</span>
              <strong>Paper 2</strong>
              <small>{{ formatModuleSubtitle(tmuaModuleQuestionCounts.paper2, '数学推理') }}</small>
              <em>必做</em>
            </div>
          </div>
        </div>
      </template>
    </AppConfirmDialog>

    <el-dialog
      v-model="subjectDialogVisible"
      width="680px"
      class="esat-subject-dialog"
      :title="
        subjectSelectionYear ? `ESAT ${subjectSelectionYear} 年 · 选择诊断科目` : '选择诊断科目'
      "
      destroy-on-close
      align-center
    >
      <div class="esat-subject-dialog__intro">
        <div>
          <strong>选择 3 个科目</strong>
          <p>Mathematics 1 为 ESAT 必考科目，再从其余 4 科中选择 2 科。</p>
        </div>
        <span>{{ selectedEsatSubjects.length }}/3</span>
      </div>

      <div v-if="subjectPapersLoading" class="esat-subject-dialog__state">
        正在读取该年份可选科目...
      </div>
      <div
        v-else-if="subjectPapersError"
        class="esat-subject-dialog__state esat-subject-dialog__state--error"
      >
        <p>{{ subjectPapersError }}</p>
        <button type="button" class="button_cancel" @click="loadSubjectSelectionPapers">
          重新加载
        </button>
      </div>
      <div v-else class="esat-subject-options" role="group" aria-label="ESAT 诊断科目">
        <button
          v-for="subject in esatSubjectOptions"
          :key="subject.code"
          type="button"
          class="esat-subject-option"
          :class="{
            'esat-subject-option--selected': selectedEsatSubjects.includes(subject.code),
            'esat-subject-option--required': subject.required,
          }"
          :aria-pressed="selectedEsatSubjects.includes(subject.code)"
          :aria-disabled="subject.required"
          @click="toggleEsatSubject(subject.code)"
        >
          <span class="esat-subject-option__check" aria-hidden="true">
            {{ selectedEsatSubjects.includes(subject.code) ? '✓' : '' }}
          </span>
          <span>
            <strong>{{ subject.label }}</strong>
            <small>
              {{ formatModuleSubtitle(esatSubjectQuestionCounts[subject.code], subject.englishLabel) }}
            </small>
          </span>
          <em v-if="subject.required">必选</em>
        </button>
      </div>

      <div v-if="selectedPaperPreview" class="esat-subject-dialog__match">
        <span>
          已匹配诊断卷
          <em v-if="isPaperLocked(selectedPaperPreview)">
            <el-icon><Lock /></el-icon>
            会员专享
          </em>
        </span>
        <strong>{{ selectedPaperPreview.title }}</strong>
        <small
          >{{ selectedPaperPreview.totalQuestions }} 题 ·
          {{ selectedPaperPreview.duration }} 分钟</small
        >
      </div>
      <p
        v-else-if="selectedEsatSubjects.length === 3 && !subjectPapersLoading"
        class="esat-subject-dialog__unmatched"
      >
        该年份暂无所选科目组合的已发布诊断卷。
      </p>

      <template #footer>
        <button type="button" class="button_cancel" @click="subjectDialogVisible = false">
          取消
        </button>
        <button
          type="button"
          class="button_primary esat-subject-dialog__start"
          :disabled="!selectedPaperPreview || Boolean(startingPaperId)"
          @click="startSelectedEsatPaper"
        >
          {{
            startingPaperId
              ? '正在检查...'
              : selectedPaperPreview && isPaperLocked(selectedPaperPreview)
                ? '开通会员'
                : '开始诊断测试'
          }}
        </button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="historyDialogVisible"
      width="860px"
      class="diagnostic-history-dialog"
      :title="historyDialogTitle"
      destroy-on-close
      align-center
    >
      <div v-if="historyLoading" class="diagnostic-history__state">正在加载历次记录...</div>
      <div
        v-else-if="historyError"
        class="diagnostic-history__state diagnostic-history__state--error"
      >
        <p>{{ historyError }}</p>
        <button type="button" class="button_cancel" @click="loadPaperHistory">重新加载</button>
      </div>
      <div v-else-if="!historyRecords.length" class="diagnostic-history__state">
        暂无已完成的诊断记录
      </div>
      <div v-else class="diagnostic-history">
        <article
          v-for="record in historyRecords"
          :key="record.examRecordId"
          class="diagnostic-history__item"
        >
          <div class="diagnostic-history__heading">
            <div>
              <strong>{{ historyRecordTitle(record) }}</strong>
              <small>第 {{ record.attemptNumber }} 次诊断</small>
            </div>
            <span
              class="diagnostic-history__status"
              :class="`diagnostic-history__status--${historyReportTone(record)}`"
            >
              {{ historyReportLabel(record) }}
            </span>
          </div>
          <dl class="diagnostic-history__metrics">
            <div>
              <dt>交卷时间</dt>
              <dd>{{ formatDateTime(record.submittedAt) }}</dd>
            </div>
            <div>
              <dt>成绩</dt>
              <dd>{{ record.correctCount }}/{{ record.totalQuestions }} 题正确</dd>
            </div>
            <div>
              <dt>作答用时</dt>
              <dd>{{ formatDuration(record.durationSeconds) }}</dd>
            </div>
            <div>
              <dt>报告时间</dt>
              <dd>{{ formatReportTime(record) }}</dd>
            </div>
          </dl>
          <button
            type="button"
            class="diagnostic-history__action"
            :class="record.hasReport ? 'button_primary' : 'button_cancel'"
            @click="handleHistoryAction(record)"
          >
            {{ historyActionLabel(record) }}
          </button>
        </article>
        <AppPagination
          :page="historyPage"
          :page-size="historyPageSize"
          :page-sizes="[5, 10, 20]"
          :total="historyTotal"
          layout="total, sizes, prev, pager, next"
          @page-change="handleHistoryPageChange"
          @page-size-change="handleHistoryPageSizeChange"
        />
      </div>
    </el-dialog>

    <PaymentModal
      v-model="paymentVisible"
      :default-exam-type="paymentExamType"
      @paid="handlePaymentSuccess"
    />
  </div>
</template>

<script setup lang="ts">
// 诊断测试中心：展示试卷权益、历史趋势和真题套卷入口。
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Lock, Right } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import NavBar from '@/components/NavBar.vue'
import AppPagination from '@/components/AppPagination.vue'
import AppConfirmDialog from '@/components/AppConfirmDialog.vue'
import PaymentModal from '@/components/PaymentModal.vue'
import SubjectModuleTags from '@/components/SubjectModuleTags.vue'
import { getMember } from '@/api/member'
import { useAuthStore, type ActiveExamType } from '@/stores/auth'
import { getExamUnavailableMessage, isExamTypeAvailable } from '@/constants/examTypes'
import { PAPER_ACCESS_TIER } from '@/constants/paperTypes'
import {
  getAssessmentYearsData,
  getAssessmentPaperHistory,
  getAssessmentPapersData,
  getAssessmentScoreTrend,
  getAssessmentYearHistory,
  type AssessmentPaperHistoryItem,
  type AssessmentPaperItem,
  type AssessmentScoreTrendResult,
  type AssessmentYearSummary,
  type PaperModuleOutline,
} from '@/api/papers'
import { getApiErrorMessage } from '@/utils/request'
import { createLoginRequiredRouteLocation } from '@/utils/authRedirect'

const router = useRouter()
const auth = useAuthStore()
const loading = ref(true)
const startingPaperId = ref('')
const diagnosticTests = ref<AssessmentPaperItem[]>([])
const assessmentYears = ref<AssessmentYearSummary[]>([])
const yearLoading = ref(false)
const yearError = ref('')
const openingYear = ref<number | null>(null)
const resumeDialogVisible = ref(false)
const pendingResumePaper = ref<AssessmentPaperItem | null>(null)
const tmuaPaperDialogVisible = ref(false)
const tmuaSelectionYear = ref<number | null>(null)
const selectedTmuaPaper = ref<AssessmentPaperItem | null>(null)
const subjectDialogVisible = ref(false)
const subjectSelectionYear = ref<number | null>(null)
const subjectSelectionPapers = ref<AssessmentPaperItem[]>([])
const subjectPapersLoading = ref(false)
const subjectPapersError = ref('')
const historyDialogVisible = ref(false)
const historyLoading = ref(false)
const historyError = ref('')
const historyPaper = ref<AssessmentPaperItem | null>(null)
const historyYear = ref<number | null>(null)
const historyRecords = ref<AssessmentPaperHistoryItem[]>([])
const historyPage = ref(1)
const historyPageSize = ref(5)
const historyTotal = ref(0)
const paymentVisible = ref(false)
const paymentExamType = ref<string>(auth.activeExamType)
const chartRef = ref<HTMLDivElement | null>(null)
const scoreTrend = ref<AssessmentScoreTrendResult | null>(null)
const scoreTrendLoading = ref(true)
const scoreTrendError = ref('')
let chartInstance: echarts.ECharts | null = null
let assessmentInitialized = false
let assessmentLoadSequence = 0
let scoreTrendLoadSequence = 0
let subjectPapersLoadSequence = 0

type AssessmentStatusFilter = 'ALL' | 'not_started' | 'in_progress' | 'completed'
type EsatSubjectCode = 'maths1' | 'maths2' | 'physics' | 'chemistry' | 'biology'

interface EsatSubjectOption {
  code: EsatSubjectCode
  label: string
  englishLabel: string
  required: boolean
}

const activeStatusFilter = ref<AssessmentStatusFilter>('ALL')
const showScoreTrend = ref(true)
const statusFilterOptions: Array<{ label: string; value: AssessmentStatusFilter }> = [
  { label: '全部', value: 'ALL' },
  { label: '待开始', value: 'not_started' },
  { label: '进行中', value: 'in_progress' },
  { label: '已完成', value: 'completed' },
]
const esatSubjectOptions: EsatSubjectOption[] = [
  { code: 'maths1', label: '数学 1', englishLabel: 'Mathematics 1', required: true },
  { code: 'maths2', label: '数学 2', englishLabel: 'Mathematics 2', required: false },
  { code: 'physics', label: '物理', englishLabel: 'Physics', required: false },
  { code: 'chemistry', label: '化学', englishLabel: 'Chemistry', required: false },
  { code: 'biology', label: '生物', englishLabel: 'Biology', required: false },
]
const selectedEsatSubjects = ref<EsatSubjectCode[]>(['maths1'])

// 游客可以浏览诊断年份与科目，但真正开始或重测前必须先完成登录。
function requireLoginForDiagnosticAction(): boolean {
  if (auth.isLoggedIn) return false
  void router.push(createLoginRequiredRouteLocation('/assessment'))
  return true
}

// 诊断中心统一读取导航栏的全局考试类型，不再维护页面级考试选择。
const activeExamType = computed<ActiveExamType>(() => auth.activeExamType)

// ESAT 与 TMUA 都从年份卡片进入，避免直接暴露底层组合卷列表。
const isYearOverview = computed(
  () => activeExamType.value === 'ESAT' || activeExamType.value === 'TMUA',
)

// 年份页说明分别对应 ESAT 选科和 TMUA 双 Paper 确认两种流程。
const yearOverviewDescription = computed(() =>
  activeExamType.value === 'ESAT'
    ? '选择年份后直接确定三个测试科目，系统会匹配对应诊断卷。'
    : '选择年份后确认 Paper 1 与 Paper 2，即可开始完整 TMUA 诊断。',
)

// 卡片摘要只说明该考试的必要组成，不再显示内部试卷数量。
const yearCardConfigurationLabel = computed(() =>
  activeExamType.value === 'ESAT' ? '5 科选 3 科' : 'Paper 1 + Paper 2',
)

// 试卷列表标题明确当前选中的 ESAT 年份，避免进入二级后失去上下文。
const paperListTitle = computed(() => `${activeExamType.value} 历年真题诊断卷`)

// 科目选满三项后以模块代码集合匹配已有六种 ESAT 合法组合卷。
const selectedPaperPreview = computed(() => {
  if (selectedEsatSubjects.value.length !== 3) return null
  const selectedKey = [...selectedEsatSubjects.value].sort().join('|')
  return (
    subjectSelectionPapers.value.find(
      (paper) =>
        (isPaperPublished(paper) || paper.testStatus === 'in_progress') &&
        esatPaperSubjectKey(paper) === selectedKey,
    ) || null
  )
})

// TMUA 确认弹窗从已匹配组合卷读取双 Paper 题量，不根据总题量进行推算。
const tmuaModuleQuestionCounts = computed<{ paper1: number | null; paper2: number | null }>(
  () => {
    const result = { paper1: null as number | null, paper2: null as number | null }
    for (const module of selectedTmuaPaper.value?.modules || []) {
      const paperKey = normalizeTmuaModule(module)
      if (paperKey && module.questionCount > 0) result[paperKey] = module.questionCount
    }
    return result
  },
)

// ESAT 选科发生在组合卷匹配前，因此按该年份已加载试卷汇总各科的模块题量。
const esatSubjectQuestionCounts = computed<Partial<Record<EsatSubjectCode, number>>>(() => {
  const result: Partial<Record<EsatSubjectCode, number>> = {}
  for (const paper of subjectSelectionPapers.value) {
    for (const module of paper.modules || []) {
      const subjectCode = normalizeEsatSubject(module)
      if (subjectCode && module.questionCount > 0 && result[subjectCode] === undefined) {
        result[subjectCode] = module.questionCount
      }
    }
  }
  return result
})

// 同一历史弹窗同时承载单卷和年份聚合两种上下文。
const historyDialogTitle = computed(() => {
  if (historyPaper.value) return `${historyPaper.value.title} · 历次诊断记录`
  if (historyYear.value) {
    return `${activeExamType.value} ${historyYear.value} 年 · 历史诊断记录`
  }
  return '历次诊断记录'
})

// ESAT 采用科目独立标准分，TMUA 采用综合分，标题明确两种评分口径。
const scoreTrendTitle = computed(() =>
  activeExamType.value === 'ESAT'
    ? 'ESAT 每日最新诊断测试科目分数变化'
    : 'TMUA 每日最新诊断测试综合分数变化',
)

// 页面说明随全局考试类型切换，避免同时描述两套不同的模块结构。
const assessmentSubtitle = computed(() =>
  activeExamType.value === 'ESAT'
    ? '选择 ESAT 历年真题诊断卷，按科目模块完成在线测试。'
    : '选择 TMUA 历年真题诊断卷，按 Paper 1/2 完成在线测试。',
)

// 数据源已由后端限定考试类型，页面只保留与考试类型无关的完成状态筛选。
const filteredDiagnosticTests = computed(() => {
  return diagnosticTests.value.filter((paper) => {
    const matchesExamType = String(paper.examType || '').toUpperCase() === activeExamType.value
    const matchesStatus =
      activeStatusFilter.value === 'ALL' || paper.testStatus === activeStatusFilter.value
    return matchesExamType && matchesStatus
  })
})

// 空状态区分“尚无任何试卷”和“当前考试类型暂无试卷”，避免误导后台发布状态。
const emptyPaperMessage = computed(() => {
  if (activeStatusFilter.value === 'ALL') {
    return `暂无已上线的 ${activeExamType.value} 诊断试卷，请先在后台真题库发布试卷。`
  }
  return `${activeExamType.value} 当前完成状态下暂无诊断试卷。`
})

// 年份状态色只承载进行中、完成和默认三类稳定语义。
function yearStatusTone(item: AssessmentYearSummary): 'progress' | 'completed' | 'idle' {
  if (item.inProgressPaperCount > 0) return 'progress'
  if (item.completedPaperCount > 0) return 'completed'
  return 'idle'
}

// 年份卡片只展示当前诊断状态，历史次数仅保留在独立历史入口。
function yearStatusLabel(item: AssessmentYearSummary): string {
  if (item.inProgressPaperCount > 0) return '进行中'
  if (item.completedPaperCount > 0) return '已完成'
  return '未完成'
}

// 全部可用卷均为会员卷时锁定年份入口；进行中的测试继续沿用创建时取得的权限。
function isYearLocked(item: AssessmentYearSummary): boolean {
  if (item.inProgressPaperCount > 0 || auth.isAdmin) return false
  if (item.memberPaperCount === 0 || item.freePaperCount > 0) return false
  return !auth.memberContext?.quotas?.[activeExamType.value]?.isMember
}

// 模块代码优先，并兼容旧数据中的英文科目名。
function normalizeEsatSubject(module: PaperModuleOutline): EsatSubjectCode | null {
  const identity = [module.code, module.subjectCode, module.subject]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
  if (identity.includes('maths1') || identity.includes('mathematics1')) return 'maths1'
  if (identity.includes('maths2') || identity.includes('mathematics2')) return 'maths2'
  if (identity.includes('physics')) return 'physics'
  if (identity.includes('chemistry')) return 'chemistry'
  if (identity.includes('biology')) return 'biology'
  return null
}

// TMUA 模块身份兼容代码、科目代码和旧版展示名称，用于关联 Paper 题量。
function normalizeTmuaModule(module: PaperModuleOutline): 'paper1' | 'paper2' | null {
  const identity = [module.code, module.subjectCode, module.subject]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
  if (identity.includes('paper1')) return 'paper1'
  if (identity.includes('paper2')) return 'paper2'
  return null
}

// 旧卷缺少可靠模块题量时仅显示模块名，避免用总题数猜测单模块数量。
function formatModuleSubtitle(questionCount: number | null | undefined, label: string): string {
  return questionCount && questionCount > 0 ? `${questionCount} 题 · ${label}` : label
}

// 组合卷匹配不依赖模块展示顺序，只比较三科集合。
function esatPaperSubjectKey(paper: AssessmentPaperItem): string {
  return [
    ...new Set(
      (paper.modules || [])
        .map(normalizeEsatSubject)
        .filter((code): code is EsatSubjectCode => Boolean(code)),
    ),
  ]
    .sort()
    .join('|')
}

// TMUA 年份入口只匹配同时包含 Paper 1 与 Paper 2 的完整组合卷。
function isTmuaCompositePaper(paper: AssessmentPaperItem): boolean {
  const moduleKeys = new Set((paper.modules || []).map(normalizeTmuaModule))
  return moduleKeys.has('paper1') && moduleKeys.has('paper2')
}

// Mathematics 1 始终必选；其余科目最多再选两项。
function toggleEsatSubject(code: EsatSubjectCode): void {
  if (code === 'maths1') return
  if (selectedEsatSubjects.value.includes(code)) {
    selectedEsatSubjects.value = selectedEsatSubjects.value.filter((item) => item !== code)
    return
  }
  if (selectedEsatSubjects.value.length >= 3) {
    ElMessage.info('已选满 3 个科目，请先取消一个选项')
    return
  }
  selectedEsatSubjects.value = [...selectedEsatSubjects.value, code]
}

// 年份首层只请求当前考试的数据库聚合摘要，避免下载全部试卷再由浏览器分组。
async function loadAssessmentYears(): Promise<void> {
  const requestSequence = ++assessmentLoadSequence
  const requestedExamType = activeExamType.value
  yearLoading.value = true
  yearError.value = ''
  assessmentYears.value = []
  try {
    const data = await getAssessmentYearsData(requestedExamType)
    if (requestSequence !== assessmentLoadSequence || activeExamType.value !== requestedExamType) return
    assessmentYears.value = data.list || []
  } catch (error: unknown) {
    if (requestSequence !== assessmentLoadSequence) return
    yearError.value = getApiErrorMessage(
      error,
      `${requestedExamType} 试卷年份加载失败，请稍后重试。`,
    )
  } finally {
    if (requestSequence === assessmentLoadSequence) yearLoading.value = false
  }
}

// 每次只请求当前全局考试类型，并丢弃快速切换后延迟返回的旧响应。
async function loadAssessmentPapers(): Promise<void> {
  const requestSequence = ++assessmentLoadSequence
  const requestedExamType = activeExamType.value
  loading.value = true
  diagnosticTests.value = []
  try {
    const data = await getAssessmentPapersData(requestedExamType)
    if (requestSequence !== assessmentLoadSequence || requestedExamType !== activeExamType.value) {
      return
    }
    diagnosticTests.value = data.list || []
  } catch {
    if (requestSequence === assessmentLoadSequence) diagnosticTests.value = []
  } finally {
    if (requestSequence === assessmentLoadSequence) loading.value = false
  }
}

// 趋势接口独立刷新，并丢弃快速切换考试类型后返回的旧成绩响应。
async function loadScoreTrend(): Promise<void> {
  const requestSequence = ++scoreTrendLoadSequence
  const requestedExamType = activeExamType.value
  scoreTrendLoading.value = true
  scoreTrendError.value = ''
  scoreTrend.value = null
  chartInstance?.dispose()
  chartInstance = null
  try {
    const data = await getAssessmentScoreTrend(requestedExamType)
    if (requestSequence !== scoreTrendLoadSequence || requestedExamType !== activeExamType.value) {
      return
    }
    scoreTrend.value = data
  } catch (error: unknown) {
    if (requestSequence !== scoreTrendLoadSequence) return
    scoreTrendError.value = getApiErrorMessage(error, '分数趋势加载失败，请稍后重试。')
  } finally {
    if (requestSequence === scoreTrendLoadSequence) {
      scoreTrendLoading.value = false
      if (showScoreTrend.value && scoreTrend.value?.points.length) {
        await nextTick()
        renderChart()
      }
    }
  }
}

// 页面进入或全局考试类型变化时并行刷新试卷列表与真实成绩趋势。
async function refreshAssessmentData(): Promise<void> {
  if (isYearOverview.value) {
    scoreTrendLoadSequence += 1
    loading.value = false
    diagnosticTests.value = []
    scoreTrend.value = null
    scoreTrendLoading.value = false
    scoreTrendError.value = ''
    chartInstance?.dispose()
    chartInstance = null
    await loadAssessmentYears()
    return
  }
  await Promise.all([loadAssessmentPapers(), loadScoreTrend()])
}

// 年份弹窗只读取当年组合卷用于匹配，不再暴露底层试卷列表。
async function loadSubjectSelectionPapers(): Promise<boolean> {
  const requestedYear = subjectSelectionYear.value
  const requestedExamType = activeExamType.value
  if (!requestedYear) return false
  const requestSequence = ++subjectPapersLoadSequence
  subjectPapersLoading.value = true
  subjectPapersError.value = ''
  subjectSelectionPapers.value = []
  try {
    const data = await getAssessmentPapersData(requestedExamType, requestedYear)
    if (
      requestSequence !== subjectPapersLoadSequence ||
      requestedYear !== subjectSelectionYear.value ||
      requestedExamType !== activeExamType.value
    ) {
      return false
    }
    subjectSelectionPapers.value = data.list || []
    return true
  } catch (error: unknown) {
    if (requestSequence !== subjectPapersLoadSequence) return false
    subjectPapersError.value = getApiErrorMessage(error, '该年份诊断卷加载失败，请稍后重试。')
    return false
  } finally {
    if (requestSequence === subjectPapersLoadSequence) subjectPapersLoading.value = false
  }
}

// 若任一年份存在未完成测试，优先定位该 attempt 并询问是否继续，不打开选科弹窗。
async function handleYearSelection(year: number): Promise<void> {
  if (requireLoginForDiagnosticAction()) return
  if (openingYear.value !== null) return
  const inProgressYear = assessmentYears.value.find((item) => item.inProgressPaperCount > 0)
  if (inProgressYear) {
    openingYear.value = year
    subjectSelectionYear.value = inProgressYear.year
    selectedEsatSubjects.value = ['maths1']
    subjectSelectionPapers.value = []
    subjectPapersError.value = ''
    try {
      const loaded = await loadSubjectSelectionPapers()
      if (!loaded) {
        ElMessage.error(subjectPapersError.value || '未完成诊断测试加载失败，请稍后重试。')
        return
      }
      const inProgressPaper = subjectSelectionPapers.value.find(
        (paper) => paper.testStatus === 'in_progress',
      )
      if (inProgressPaper) {
        pendingResumePaper.value = inProgressPaper
        resumeDialogVisible.value = true
        return
      }
      await loadAssessmentYears()
    } finally {
      openingYear.value = null
    }
  }

  const selectedYear = assessmentYears.value.find((item) => item.year === year)
  if (selectedYear && isYearLocked(selectedYear)) {
    handleUpgradeClick(activeExamType.value)
    return
  }

  subjectSelectionYear.value = year
  selectedEsatSubjects.value = ['maths1']
  subjectSelectionPapers.value = []
  subjectPapersError.value = ''
  if (activeExamType.value === 'ESAT') {
    subjectDialogVisible.value = true
    void loadSubjectSelectionPapers()
    return
  }

  openingYear.value = year
  try {
    const loaded = await loadSubjectSelectionPapers()
    if (!loaded) {
      ElMessage.error(subjectPapersError.value || 'TMUA 诊断试卷加载失败，请稍后重试。')
      return
    }
    const paper = subjectSelectionPapers.value.find(
      (item) =>
        (isPaperPublished(item) || item.testStatus === 'in_progress') &&
        isTmuaCompositePaper(item),
    )
    if (!paper) {
      ElMessage.warning(`TMUA ${year} 年暂无已发布的 Paper 1 + Paper 2 诊断卷`)
      return
    }
    if (isPaperLocked(paper)) {
      handleUpgradeClick(paper.examType)
      return
    }
    selectedTmuaPaper.value = paper
    tmuaSelectionYear.value = year
    tmuaPaperDialogVisible.value = true
  } finally {
    openingYear.value = null
  }
}

// 确认后携带原 examRecordId 进入分段作答页，保留原答题进度和剩余时间。
function confirmResumeDiagnostic(): void {
  const paper = pendingResumePaper.value
  if (!paper) return
  resumeDialogVisible.value = false
  pendingResumePaper.value = null
  routeToDiagnosticPaper(paper, true)
}

// 关闭确认框后清理旧试卷引用，避免下次快速点击误恢复上一次测试。
function clearPendingResumePaper(): void {
  pendingResumePaper.value = null
}

// 进入页面时先确定用户默认考试类型，再查询该类型的诊断试卷。
onMounted(async () => {
  try {
    await auth.ensureMemberContext()
  } catch {
    // 偏好加载失败时继续使用全局默认 TMUA，公共请求层负责错误提示。
  }
  assessmentInitialized = true
  await refreshAssessmentData()
  window.addEventListener('resize', resizeChart)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart)
  chartInstance?.dispose()
})

// 趋势图重新显示时等待容器挂载，隐藏时及时释放 ECharts 实例。
watch(showScoreTrend, async (visible) => {
  if (!visible) {
    chartInstance?.dispose()
    chartInstance = null
    return
  }
  await nextTick()
  renderChart()
})

// 导航栏切换考试类型时关闭旧上下文，并重新查询对应诊断卷和成绩趋势。
watch(activeExamType, () => {
  if (!assessmentInitialized) return
  startingPaperId.value = ''
  openingYear.value = null
  resumeDialogVisible.value = false
  pendingResumePaper.value = null
  tmuaPaperDialogVisible.value = false
  tmuaSelectionYear.value = null
  selectedTmuaPaper.value = null
  subjectDialogVisible.value = false
  subjectPapersLoadSequence += 1
  subjectSelectionYear.value = null
  subjectSelectionPapers.value = []
  selectedEsatSubjects.value = ['maths1']
  historyDialogVisible.value = false
  historyLoading.value = false
  historyError.value = ''
  historyPaper.value = null
  historyYear.value = null
  historyRecords.value = []
  historyTotal.value = 0
  paymentVisible.value = false
  paymentExamType.value = activeExamType.value
  assessmentYears.value = []
  yearError.value = ''
  void refreshAssessmentData()
})

// 图表按接口返回的每日最新成绩构造序列，ESAT 科目和 TMUA 综合分使用同一渲染入口。
function renderChart(): void {
  const trend = scoreTrend.value
  if (!chartRef.value || !trend?.points.length) return
  const seriesMeta = new Map<string, string>()
  for (const point of trend.points) {
    for (const score of point.scores) {
      if (!seriesMeta.has(score.key)) seriesMeta.set(score.key, score.label)
    }
  }
  const seriesEntries = [...seriesMeta.entries()]
  const stackedMaximum = Math.max(
    9,
    ...trend.points.map((point) => point.scores.reduce((sum, score) => sum + score.score, 0)),
  )
  const yAxisMaximum = Math.ceil(stackedMaximum / 3) * 3
  const palette = ['#1a1a1a', '#2f7d78', '#c67a37', '#5576b9', '#8567a8']

  chartInstance?.dispose()
  chartInstance = echarts.init(chartRef.value)
  chartInstance.setOption({
    color: palette,
    grid: { left: 44, right: 20, top: seriesEntries.length > 1 ? 46 : 24, bottom: 36 },
    legend: {
      show: seriesEntries.length > 1,
      top: 2,
      right: 4,
      itemWidth: 18,
      itemHeight: 8,
      textStyle: { color: '#666666', fontSize: 12 },
    },
    xAxis: {
      type: 'category',
      data: trend.points.map((point) => point.date.slice(5).replace('-', '/')),
      boundaryGap: false,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#eaeaea' } },
      axisLabel: { color: '#8a8a8a', fontWeight: 600 },
      splitLine: { show: true, lineStyle: { color: '#f0f0f0', type: 'dashed' } },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: yAxisMaximum,
      interval: 3,
      name: '分数',
      nameTextStyle: { color: '#8a8a8a', padding: [0, 0, 0, -24] },
      axisLabel: { color: '#8a8a8a', fontWeight: 600 },
      splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
    },
    series: seriesEntries.map(([key, label], index) => ({
      name: label,
      type: 'line',
      stack: 'diagnostic-score',
      data: trend.points.map(
        (point) => point.scores.find((score) => score.key === key)?.score ?? null,
      ),
      smooth: true,
      symbol: 'circle',
      symbolSize: 7,
      lineStyle: { width: 2.5, color: palette[index % palette.length] },
      itemStyle: {
        color: palette[index % palette.length],
        borderColor: '#ffffff',
        borderWidth: 2,
      },
      emphasis: { focus: 'series' },
      connectNulls: false,
    })),
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => {
        const items = (Array.isArray(params) ? params : [params]) as Array<{
          dataIndex?: number
          marker?: string
          seriesName?: string
          data?: string | number | null
        }>
        const point = trend.points[items[0]?.dataIndex ?? -1]
        if (!point) return ''
        const rows = items
          .filter((item) => item.data !== null && item.data !== undefined)
          .map((item) => `${item.marker || ''}${item.seriesName || '分数'}：${item.data}`)
        return [formatDateTime(point.submittedAt), ...rows].join('<br/>')
      },
    },
  })
}

function resizeChart(): void {
  chartInstance?.resize()
}

// 从试卷锁定态进入支付时预选该试卷的考试类型，减少重复选择。
function handleUpgradeClick(examType?: string): void {
  paymentExamType.value = examType || activeExamType.value
  paymentVisible.value = true
}

// 支付完成后立即刷新会员上下文，使当前列表无需刷新页面即可解除遮罩。
async function handlePaymentSuccess(): Promise<void> {
  try {
    const context = await getMember()
    auth.setMemberContext(context)
    paymentVisible.value = false
  } catch {
    // Axios 公共响应处理会展示后端 errMsg。
  }
}

// 打开试卷历史时固定当前试卷上下文，分页请求不会和其他卡片的数据混用。
function openPaperHistory(item: AssessmentPaperItem): void {
  historyPaper.value = item
  historyYear.value = null
  historyPage.value = 1
  historyRecords.value = []
  historyTotal.value = item.completedAttemptCount
  historyDialogVisible.value = true
  void loadPaperHistory()
}

// 年份卡片历史入口汇总该年所有科目组合，不要求学生先选中某套卷。
function openYearHistory(item: AssessmentYearSummary): void {
  if (item.completedAttemptCount === 0) return
  historyPaper.value = null
  historyYear.value = item.year
  historyPage.value = 1
  historyRecords.value = []
  historyTotal.value = item.completedAttemptCount
  historyDialogVisible.value = true
  void loadPaperHistory()
}

// 历次记录只读取正式交卷 attempt，并按当前单卷或年份上下文选择接口。
async function loadPaperHistory(): Promise<void> {
  const paperId = historyPaper.value?.paperId
  const year = historyYear.value
  if (!paperId && !year) return
  const historyContextKey = paperId ? `paper:${paperId}` : `year:${year}`
  historyLoading.value = true
  historyError.value = ''
  try {
    const data = paperId
      ? await getAssessmentPaperHistory(paperId, historyPage.value, historyPageSize.value)
      : await getAssessmentYearHistory(
          activeExamType.value,
          year!,
          historyPage.value,
          historyPageSize.value,
        )
    const currentContextKey = historyPaper.value?.paperId
      ? `paper:${historyPaper.value.paperId}`
      : `year:${historyYear.value}`
    if (currentContextKey !== historyContextKey) return
    historyRecords.value = data.list || []
    historyTotal.value = data.pagination.total
  } catch (error: unknown) {
    const currentContextKey = historyPaper.value?.paperId
      ? `paper:${historyPaper.value.paperId}`
      : `year:${historyYear.value}`
    if (currentContextKey !== historyContextKey) return
    historyRecords.value = []
    historyError.value = getApiErrorMessage(error, '历次诊断记录加载失败，请稍后重试。')
  } finally {
    const currentContextKey = historyPaper.value?.paperId
      ? `paper:${historyPaper.value.paperId}`
      : `year:${historyYear.value}`
    if (currentContextKey === historyContextKey) historyLoading.value = false
  }
}

// 历史记录以真实试卷名称作为主标题；缺少旧数据标题时按当前考试与年份生成兜底名称。
function historyRecordTitle(record: AssessmentPaperHistoryItem): string {
  if (record.paperTitle) return record.paperTitle
  return historyYear.value
    ? `${activeExamType.value} ${historyYear.value} 年诊断卷`
    : `${activeExamType.value} 诊断卷`
}

// 切换页码后重新读取该页，避免一次性把长期积累的全部历史报告下发到首页。
function handleHistoryPageChange(page: number): void {
  historyPage.value = page
  void loadPaperHistory()
}

// 每页数量改变时回到第一页，避免原页码超出新的总页数。
function handleHistoryPageSizeChange(pageSize: number): void {
  historyPageSize.value = pageSize
  historyPage.value = 1
  void loadPaperHistory()
}

// 历史入口始终以该次 examRecordId 导航，禁止回退到同一试卷的其他报告。
function handleHistoryAction(record: AssessmentPaperHistoryItem): void {
  historyDialogVisible.value = false
  if (record.hasReport) {
    const reportKind = record.reportKind.toLowerCase()
    if (reportKind === 'esat' || reportKind === 'tmua') {
      void router.push(`/exam-result/${record.examRecordId}/${reportKind}`)
      return
    }
    void router.push(`/exam-result/${record.examRecordId}`)
    return
  }
  void router.push({
    path: '/exam-result',
    query: {
      id: record.examRecordId,
      total: String(record.totalQuestions),
      correct: String(record.correctCount),
      source: 'assessment',
    },
  })
}

// 日期按学生浏览器本地时区展示，并统一为便于核对的年月日时分格式。
function formatDateTime(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const pad = (part: number) => String(part).padStart(2, '0')
  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join(' ')
}

// 报告时间只取本次正式报告的 completedAt，任务未完成时不以交卷时间替代。
function formatReportTime(record: AssessmentPaperHistoryItem): string {
  if (record.reportCompletedAt) return formatDateTime(record.reportCompletedAt)
  if (record.reportStatus === 'failed') return '生成失败'
  return '尚未生成'
}

// 作答用时按已持久化有效时长展示，ESAT 休息时间不计入其中。
function formatDuration(durationSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(durationSeconds || 0))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60
  if (hours > 0) return `${hours} 小时 ${minutes} 分`
  if (minutes > 0) return `${minutes} 分 ${seconds} 秒`
  return `${seconds} 秒`
}

// 历史状态文案描述该次报告自身，不受同一试卷其他报告影响。
function historyReportLabel(record: AssessmentPaperHistoryItem): string {
  if (record.hasReport) return '报告已完成'
  if (record.reportStatus === 'failed') return '分析失败'
  if (record.reportStatus === 'analyzing') return `报告生成中 ${record.reportProgress}%`
  if (record.reportStatus === 'pending') return '等待生成报告'
  return '待生成报告'
}

// 历史状态沿用首页的低饱和语义色，避免和考试、科目标签竞争视觉层级。
function historyReportTone(
  record: AssessmentPaperHistoryItem,
): 'completed' | 'progress' | 'failed' {
  if (record.hasReport) return 'completed'
  if (record.reportStatus === 'failed') return 'failed'
  return 'progress'
}

// 报告尚未完成时，历史记录入口复用本次分析进度或失败重试流程。
function historyActionLabel(record: AssessmentPaperHistoryItem): string {
  if (record.hasReport) return '查看该次报告'
  if (record.reportStatus === 'failed') return '重新分析'
  return '查看生成进度'
}

// TMUA 确认后直接新建或重测当年双 Paper 诊断，不再经过试卷卡片页。
async function startSelectedTmuaPaper(): Promise<void> {
  if (requireLoginForDiagnosticAction()) return
  const paper = selectedTmuaPaper.value
  if (!paper) {
    ElMessage.warning('当前 TMUA 诊断试卷已不可用，请重新选择年份')
    return
  }
  if (paper.testStatus === 'in_progress') {
    clearTmuaPaperSelection()
    routeToDiagnosticPaper(paper, true)
    return
  }
  if (isPaperLocked(paper)) {
    handleUpgradeClick(paper.examType)
    return
  }
  if (paper.testStatus === 'completed') {
    await handleRetestPaper(paper)
  } else {
    await startPaper(paper)
  }
  clearTmuaPaperSelection()
}

// 取消或完成 TMUA 确认后清空年份和试卷引用。
function clearTmuaPaperSelection(): void {
  tmuaPaperDialogVisible.value = false
  tmuaSelectionYear.value = null
  selectedTmuaPaper.value = null
}

// 科目组合确认后直接继续或新建对应试卷 attempt，不再经过试卷列表。
async function startSelectedEsatPaper(): Promise<void> {
  if (requireLoginForDiagnosticAction()) return
  const paper = selectedPaperPreview.value
  if (!paper) {
    ElMessage.warning('请先选择可用的三科组合')
    return
  }
  const activePaper = subjectSelectionPapers.value.find((item) => item.testStatus === 'in_progress')
  if (activePaper && activePaper.id !== paper.id) {
    ElMessage.warning(`请先完成正在进行的“${activePaper.title}”`)
    return
  }
  if (paper.testStatus === 'in_progress') {
    subjectDialogVisible.value = false
    routeToDiagnosticPaper(paper, true)
    return
  }
  if (isPaperLocked(paper)) {
    handleUpgradeClick(paper.examType)
    return
  }
  if (paper.testStatus === 'completed') {
    await handleRetestPaper(paper)
  } else {
    await startPaper(paper)
  }
  subjectDialogVisible.value = false
}

async function handlePaperAction(item: AssessmentPaperItem): Promise<void> {
  if (requireLoginForDiagnosticAction()) return
  if (!isPaperAvailable(item)) {
    ElMessage.info(getExamUnavailableMessage(item.examType))
    return
  }
  if (item.testStatus === 'in_progress') {
    routeToDiagnosticPaper(item, true)
    return
  }
  if (item.testStatus === 'completed') {
    openPaperHistory(item)
    return
  }
  if (isPaperLocked(item)) {
    handleUpgradeClick(item.examType)
    return
  }
  await startPaper(item)
}

// 重新测试走正式权益校验并创建新的 attempt，不再提供客户端调试绕过参数。
async function handleRetestPaper(paper: AssessmentPaperItem): Promise<void> {
  if (requireLoginForDiagnosticAction()) return
  if (!isPaperAvailable(paper)) {
    ElMessage.info(getExamUnavailableMessage(paper.examType))
    return
  }
  if (isPaperLocked(paper)) {
    handleUpgradeClick(paper.examType)
    return
  }
  if (!isPaperPublished(paper)) {
    ElMessage.info('该诊断卷已下线，只能查看已有记录')
    return
  }
  await startPaper(paper)
}

// 前端只处理明确的锁定交互，创建 attempt 时仍由后端再次校验试卷级权益。
async function startPaper(paper: AssessmentPaperItem): Promise<void> {
  if (!isPaperAvailable(paper)) {
    ElMessage.info(getExamUnavailableMessage(paper.examType))
    return
  }
  if (!isPaperPublished(paper)) {
    ElMessage.info('该诊断卷已下线，不能创建新的测试')
    return
  }
  const activePaper = diagnosticTests.value.find(
    (item) => item.examType === paper.examType && item.testStatus === 'in_progress',
  )
  if (activePaper && activePaper.id !== paper.id) {
    ElMessage.warning(`请先完成正在进行的“${activePaper.title}”`)
    return
  }
  if (startingPaperId.value) return
  startingPaperId.value = paper.id
  try {
    routeToDiagnosticPaper(paper, false)
  } finally {
    startingPaperId.value = ''
  }
}

// 带分段交付配置的 ESAT 与 TMUA 试卷进入专用状态机；旧扁平卷保持原答题页。
function routeToDiagnosticPaper(paper: AssessmentPaperItem, resume: boolean): void {
  if (paper.deliveryMode === 'module_sequence') {
    router.push({
      path: `/assessment/exam/${paper.id}`,
      query: resume && paper.examRecordId ? { examRecordId: paper.examRecordId } : {},
    })
    return
  }
  router.push({ path: '/practice', query: { paperId: paper.id, mode: 'assessment' } })
}

// 分析中与待分析统一进入本次分析弹窗，完成后只进入本次考试记录的报告。
function isReportGenerating(item: AssessmentPaperItem): boolean {
  return item.reportStatus === 'pending' || item.reportStatus === 'analyzing'
}

// 诊断列表可展示 STEP 上线预告，但任何开始、继续和重测操作都必须保持关闭。
function isPaperAvailable(item: AssessmentPaperItem): boolean {
  return isExamTypeAvailable(item.examType || 'TMUA')
}

// 发布状态只限制新建和重测，已开始测试与历史记录仍可访问。
function isPaperPublished(item: AssessmentPaperItem): boolean {
  return item.publicationStatus === 'published'
}

// 进行中的 attempt 沿用创建时取得的权限；免费卷、管理员和有效会员不显示锁定态。
function isPaperLocked(item: AssessmentPaperItem): boolean {
  if (!isPaperAvailable(item) || item.testStatus === 'in_progress') return false
  if (item.accessTier === PAPER_ACCESS_TIER.FREE || auth.isAdmin) return false
  return !auth.memberContext?.quotas?.[item.examType || 'TMUA']?.isMember
}

function paperStatusLabel(item: AssessmentPaperItem): string {
  if (!isPaperAvailable(item)) return '暂未开放'
  if (!isPaperPublished(item) && item.testStatus === 'in_progress') return '已下线 · 进行中'
  if (!isPaperPublished(item)) return '已下线'
  if (item.testStatus === 'in_progress') return '进行中'
  if (item.testStatus === 'not_started') return '待开始'
  if (item.reportStatus === 'failed') return '分析失败'
  if (isReportGenerating(item)) return `报告生成中 ${item.reportProgress}%`
  if (item.reportStatus === 'not_generated') return '待生成报告'
  return '报告已完成'
}

// 状态标签使用低饱和语义色，和科目、考试类型的亮色标签形成层级区分。
function paperStatusTone(
  item: AssessmentPaperItem,
): 'pending' | 'progress' | 'completed' | 'failed' | 'unavailable' {
  if (!isPaperAvailable(item)) return 'unavailable'
  if (!isPaperPublished(item)) return 'unavailable'
  if (item.testStatus === 'in_progress') return 'progress'
  if (item.testStatus === 'not_started') return 'pending'
  if (item.reportStatus === 'failed') return 'failed'
  if (isReportGenerating(item) || item.reportStatus === 'not_generated') return 'progress'
  return 'completed'
}

function paperActionLabel(item: AssessmentPaperItem): string {
  if (!isPaperAvailable(item)) return '正在推进中'
  if (item.testStatus === 'in_progress') return '继续测试→'
  if (!isPaperPublished(item)) return '历次记录→'
  if (item.testStatus === 'not_started') return '开始测试→'
  if (item.reportStatus === 'failed' && !item.hasReport) return '重新分析→'
  if (isReportGenerating(item) || item.reportStatus === 'not_generated') {
    return '查看生成进度→'
  }
  return '查看诊断报告→'
}

// 进行中卡片按当前模块索引展示 ESAT 科目或 TMUA Paper，避免沿用过长的试卷副标题。
function currentProgressLabel(item: AssessmentPaperItem): string {
  const moduleIndex = Math.max(0, item.currentModuleIndex ?? 0)
  const currentModule = item.modules?.[moduleIndex]
  if (String(item.examType || '').toUpperCase() === 'TMUA') {
    const moduleIdentity = `${currentModule?.code || ''} ${currentModule?.subject || ''}`
    if (/paper[\s_-]*2/i.test(moduleIdentity)) return 'Paper 2'
    if (/paper[\s_-]*1/i.test(moduleIdentity)) return 'Paper 1'
    return `Paper ${moduleIndex + 1}`
  }
  return currentModule?.subject || currentModule?.code || `第 ${moduleIndex + 1} 科目`
}
</script>

<style scoped lang="scss">
.assessment-page {
  min-height: 100vh;
  min-width: var(--fluid-page-min-width);
  background: var(--color-bg);
  color: var(--color-ink);
}

.assessment-page--esat,
.assessment-page--tmua {
  background-color: rgb(238, 233, 226);
  background-position: top center;
  background-repeat: no-repeat;
  background-size: auto;
}

.assessment-page--esat {
  background-image: url('../../assets/banner/campus-cambridge-sketch.webp');
}

.assessment-page--tmua {
  background-image: url('../../assets/banner/campus-oxford-sketch.webp');
}

.assessment-shell {
  width: var(--fluid-shell-width);
  margin: 0 auto;
  padding: 40px 0 96px;
}

.page-header {
  margin: 0 0 24px;
}

.page-header h1 {
  margin: 0;
  color: var(--color-ink);
  font-size: var(--text-4xl);
  font-weight: var(--weight-bold);
  letter-spacing: 0;
  white-space: nowrap;
}

.page-header__lead p {
  max-width: 560px;
  margin: 10px 0 0;
  color: var(--color-ink-soft);
  line-height: var(--leading-relaxed);
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

.assessment-year-overview {
  padding: 24px;
  border: 1px solid var(--color-line);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.3);
}

.assessment-paper-overview--tmua {
  padding: 24px;
  border: 1px solid var(--color-line);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.3);
}

.assessment-year-overview__heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--color-line);
}

.assessment-year-overview__heading span {
  display: block;
  margin-bottom: 7px;
  color: #238c88;
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.assessment-year-overview__heading h2 {
  margin: 0;
  color: var(--color-ink);
  font-size: 24px;
  line-height: 1.35;
}

.assessment-year-overview__heading p {
  max-width: 480px;
  margin: 0;
  color: #fff;
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  text-align: right;
}

.assessment-year-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  margin-top: 24px;
}

.assessment-year-card-stack {
  position: relative;
  min-width: 0;
  padding-top: 18px;
}

.assessment-year-card-stack::before,
.assessment-year-card-stack::after {
  position: absolute;
  border: 1px solid rgba(255, 255, 255, 0.58);
  border-radius: 24px;
  box-shadow: 0 12px 30px rgba(25, 51, 64, 0.1);
  content: '';
  pointer-events: none;
}

.assessment-year-card-stack::before {
  z-index: 0;
  inset: 0 32px 18px;
  background: linear-gradient(145deg, rgba(211, 224, 241, 0.92), rgba(71, 155, 192, 0.82));
}

.assessment-year-card-stack::after {
  z-index: 1;
  inset: 9px 16px 9px;
  background: linear-gradient(145deg, rgba(218, 237, 232, 0.94), rgba(66, 142, 158, 0.84));
}

.assessment-year-card {
  --assessment-year-cover-height: 150px;

  position: relative;
  z-index: 2;
  width: 100%;
  min-width: 0;
  display: block;
  overflow: hidden;
  padding: 0;
  border: 1px solid rgba(24, 54, 67, 0.12);
  border-radius: 24px;
  background: var(--color-surface);
  box-shadow: 0 18px 42px rgba(25, 51, 64, 0.13);
  color: var(--color-ink);
  font-family: inherit;
  text-align: left;
  transition:
    transform 260ms cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 260ms ease,
    border-color 180ms ease;
}

.assessment-year-card:hover,
.assessment-year-card:has(.assessment-year-card__primary:focus-visible),
.assessment-year-card:has(.assessment-year-card__history:focus-visible) {
  border-color: rgba(35, 140, 136, 0.42);
  box-shadow: 0 28px 58px rgba(25, 51, 64, 0.2);
  transform: translateY(-8px);
}

.assessment-year-card__primary {
  width: 100%;
  display: block;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.assessment-year-card__primary:focus-visible,
.assessment-year-card__history:focus-visible {
  outline: 3px solid rgba(35, 140, 136, 0.38);
  outline-offset: -3px;
}

.assessment-year-card__primary:disabled {
  cursor: wait;
}

.assessment-year-card__visual {
  position: relative;
  isolation: isolate;
  display: block;
  height: var(--assessment-year-cover-height);
  overflow: hidden;
  background:
    linear-gradient(145deg, rgba(231, 242, 239, 0.9), rgba(156, 191, 195, 0.75) 46%, #243b4b),
    #cadbd9;
}

.assessment-year-card__visual::before {
  position: absolute;
  z-index: -1;
  inset: 38px -55px 42px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 30% 45%, rgba(243, 196, 118, 0.88), transparent 31%),
    radial-gradient(circle at 62% 28%, rgba(96, 91, 181, 0.9), transparent 34%),
    radial-gradient(circle at 72% 67%, rgba(39, 142, 138, 0.92), transparent 38%);
  filter: blur(22px);
  content: '';
  transform: scale(1.16);
}

.assessment-year-card__visual::after {
  position: absolute;
  z-index: -1;
  inset: 42% 0 0;
  background: linear-gradient(180deg, transparent, rgba(12, 25, 34, 0.88));
  content: '';
}

.assessment-year-card__topline {
  position: absolute;
  top: 16px;
  right: 16px;
  left: 16px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
}

.assessment-year-card__topline > i {
  width: auto;
  min-width: 68px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  padding: 0 10px;
  font-size: 10px;
  font-style: normal;
  font-weight: var(--weight-bold);
  letter-spacing: normal;
  white-space: nowrap;
  backdrop-filter: blur(8px);
}

.assessment-year-card__cover-copy {
  position: absolute;
  right: 20px;
  bottom: 14px;
  left: 20px;
  color: #fff;
}

.assessment-year-card__cover-copy small {
  display: block;
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 9px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.assessment-year-card__cover-copy strong {
  display: block;
  font-family: math;
  font-size: 23px;
  font-weight: 500;
  line-height: 0.96;
  letter-spacing: -0.03em;
  transform: translateY(-6px);
  white-space: nowrap;
}

.assessment-year-card__body {
  min-height: 154px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 48px;
  align-items: center;
  gap: 16px;
  padding: 18px 18px 56px;
}

.assessment-year-card__info {
  min-width: 0;
  display: block;
}

.assessment-year-card__summary {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  margin-top: 8px;
}

.assessment-year-card__summary b {
  color: #238c88;
  font-size: 11px;
}

.assessment-year-card__summary em {
  padding: 4px 7px;
  border-radius: 999px;
  background: #f0f2f3;
  color: var(--color-ink-muted);
  font-size: 9px;
  font-style: normal;
  font-weight: var(--weight-semi);
}

.assessment-year-card__summary em[data-state='progress'] {
  background: #fff2dd;
  color: #ad671b;
}

.assessment-year-card__summary em[data-state='completed'] {
  background: #e7f6f2;
  color: #187b71;
}

.assessment-year-card__info > strong {
  display: block;
  font-size: 16px;
  line-height: 1.4;
}

.assessment-year-card__action {
  width: 48px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 11px;
  background: #172538;
  color: #fff;
  font-size: 12px;
  font-weight: var(--weight-semi);
}

.assessment-year-card__action .el-icon {
  font-size: 15px;
}

.assessment-year-card__history {
  position: absolute;
  right: 18px;
  bottom: 18px;
  z-index: 3;
  padding: 0 0 3px;
  border: 0;
  border-bottom: 1px solid currentcolor;
  border-radius: 0;
  background: transparent;
  color: #405064;
  font-family: inherit;
  font-size: 11px;
  font-weight: var(--weight-semi);
  cursor: pointer;
  transition: color var(--duration-fast) ease;
}

.assessment-year-card__history:hover {
  color: #187b71;
}

.assessment-year-card__history:focus-visible {
  outline-offset: 3px;
}

.assessment-year-state {
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: var(--color-ink-muted);
}

.assessment-year-state--error {
  color: var(--color-danger);
}

@media (max-width: 1100px) {
  .assessment-year-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.paper-card__button {
  height: var(--height-button);
  border-radius: var(--radius-md);
}

.chart-card {
  margin-top: 16px;
  padding: 24px 24px 16px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.chart-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.chart-title span {
  display: block;
  margin-bottom: 4px;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.chart-title strong {
  color: var(--color-ink);
  font-size: var(--text-lg);
}

.score-chart {
  width: 100%;
  height: 220px;
}

.score-chart-state {
  display: flex;
  min-height: 220px;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
}

.score-chart-state--error {
  color: var(--color-danger);
}

.score-chart-state .button_cancel {
  min-height: 34px;
  padding: 0 14px;
}

.paper-filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 14px 16px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.paper-filter-bar__title span {
  display: block;
  margin-bottom: 3px;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.paper-filter-bar__title strong {
  color: var(--color-ink);
  font-size: var(--text-base);
}

.paper-filter-bar__controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
  flex-wrap: wrap;
}

.paper-filter-control {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.paper-filter-control > span {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
  white-space: nowrap;
}

.paper-filter-control--chart {
  min-height: var(--height-button);
  padding-left: 4px;
}

.status-filter {
  flex: 0 0 auto;
  min-width: 340px;
}

.status-filter :deep(.el-segmented__item) {
  min-width: 76px;
  font-weight: var(--weight-semi);
}

.paper-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.paper-card {
  position: relative;
  overflow: hidden;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 24px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  transition:
    border-color var(--duration-base) ease,
    transform var(--duration-fast) ease;
}

.paper-card__lock-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  overflow: hidden;
  border-radius: inherit;
  background: linear-gradient(
    to top,
    rgb(15 15 15 / 68%) 0%,
    rgb(20 20 20 / 42%) 38%,
    rgb(24 24 24 / 18%) 72%,
    rgb(24 24 24 / 7%) 100%
  );
  color: rgb(255 255 255 / 92%);
  cursor: not-allowed;
  pointer-events: auto;
  transition: background var(--duration-base) ease;
}

.assessment-year-card__lock-overlay {
  top: var(--assessment-year-cover-height);
  border-radius: 0 0 24px 24px;
}

.paper-card__lock-marker {
  position: absolute;
  top: 66.666%;
  left: 50%;
  display: grid;
  justify-items: center;
  gap: 6px;
  transform: translate(-50%, -50%);
  text-shadow: 0 1px 10px rgb(0 0 0 / 42%);
}

.paper-card__lock-marker .el-icon {
  font-size: 32px;
}

.paper-card__lock-marker span {
  font-size: var(--text-sm);
  font-weight: var(--weight-bold);
  letter-spacing: 0.04em;
}

.paper-card__lock-actions {
  position: absolute;
  bottom: 12px;
  right: 24px;
  left: 24px;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  column-gap: 10px;
  opacity: 0;
  pointer-events: none;
  transform: translateY(8px);
  transition:
    opacity var(--duration-fast) ease,
    transform var(--duration-fast) ease;
}

.paper-card__unlock-button {
  grid-column: 2;
  min-width: 112px;
  height: var(--height-button);
  padding: 0 22px;
  border: 1px solid rgb(255 255 255 / 64%);
  border-radius: var(--radius-md);
  background: rgb(255 255 255 / 94%);
  box-shadow: 0 10px 28px rgb(0 0 0 / 20%);
  color: var(--color-ink);
  font: inherit;
  font-weight: var(--weight-bold);
  cursor: pointer;
  transition:
    border-color var(--duration-fast) ease,
    background var(--duration-fast) ease,
    color var(--duration-fast) ease;
}

.paper-card__locked-history-button {
  grid-column: 1;
  grid-row: 1;
  justify-self: end;
  padding: 5px 1px 3px;
  border: 0;
  border-bottom: 1px solid rgb(255 255 255 / 72%);
  background: transparent;
  color: rgb(255 255 255 / 94%);
  font: inherit;
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  white-space: nowrap;
  cursor: pointer;
  transition:
    border-color var(--duration-fast) ease,
    color var(--duration-fast) ease;
}

.paper-card__unlock-button:hover {
  background: var(--color-surface);
}

.paper-card__locked-history-button:hover {
  border-bottom-color: rgb(255 255 255);
  color: rgb(255 255 255);
}

.paper-card--locked:hover .paper-card__lock-overlay,
.paper-card--locked:focus-within .paper-card__lock-overlay,
.assessment-year-card--locked:hover .assessment-year-card__lock-overlay,
.assessment-year-card--locked:focus-within .assessment-year-card__lock-overlay {
  background: linear-gradient(
    to top,
    rgb(12 12 12 / 74%) 0%,
    rgb(18 18 18 / 48%) 38%,
    rgb(22 22 22 / 22%) 72%,
    rgb(22 22 22 / 9%) 100%
  );
}

.paper-card__lock-overlay:hover .paper-card__lock-actions,
.paper-card__lock-overlay:focus-within .paper-card__lock-actions {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

.paper-card:hover {
  border-color: var(--color-ink);
  transform: translateY(-1px);
}

.paper-card--unavailable,
.paper-card--unavailable:hover {
  border-color: var(--color-line);
  border-style: dashed;
  background: linear-gradient(
    135deg,
    var(--color-surface),
    color-mix(in srgb, var(--color-report-purple-soft) 44%, var(--color-surface))
  );
  transform: none;
}

.paper-card--unavailable .paper-card__button,
.paper-card--unavailable .paper-card__button:hover {
  border-color: var(--color-line);
  background: var(--color-surface-alt);
  color: var(--color-ink-muted);
}

.paper-card__badge {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-pill);
  background: var(--color-hover);
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
}

.paper-card__badge--pending {
  border-color: #d5d8dc;
  background: #f1f2f3;
  color: #555d66;
}

.paper-card__badge--progress {
  border-color: #d6c9b2;
  background: #f3f0e9;
  color: #6b5b3e;
}

.paper-card__badge--completed {
  border-color: #c8d2cc;
  background: #edf1ef;
  color: #435c4d;
}

.paper-card__badge--failed {
  border-color: #d8c8c8;
  background: #f3eeee;
  color: #775555;
}

.paper-card__badge--unavailable {
  border-color: #d4d4d4;
  border-style: dashed;
  background: #f4f4f4;
  color: #737373;
}

.paper-card__topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 10px;
}

.paper-card__identity {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.paper-card__exam-type,
.paper-card__year {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 9px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-pill);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
  white-space: nowrap;
}

.paper-card__exam-type--esat {
  border-color: #67e8f9;
  background: #ecfeff;
  color: #0e7490;
}

.paper-card__exam-type--tmua {
  border-color: #ddd6fe;
  background: #f5f3ff;
  color: #6d28d9;
}

.paper-card__year {
  background: var(--color-surface-alt);
  color: var(--color-ink-soft);
}

.paper-card__heading {
  min-width: 0;
}

.paper-card__heading h2 {
  overflow: hidden;
  margin: 0;
  color: var(--color-ink);
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.paper-card__subject-tags {
  margin-top: 10px;
}

.paper-card__footer {
  position: relative;
  z-index: 3;
  min-height: var(--height-button);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--color-line);
}

.paper-card__score {
  padding: 0 4px;
  white-space: nowrap;
}

.paper-card__score strong {
  color: var(--color-ink);
  font-size: var(--text-2xl);
  font-weight: var(--weight-bold);
}

.paper-card__score span {
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
}

.paper-card__progress {
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  padding: 0 4px;
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
  white-space: nowrap;
}

.paper-card__progress strong {
  color: var(--color-ink);
  font-weight: var(--weight-semi);
}

.paper-card__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.paper-card__button--secondary {
  min-width: 92px;
}

.empty-state {
  margin-top: 24px;
  padding: 32px;
  border: 1px dashed var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-ink-muted);
  text-align: center;
}

.tmua-paper-confirmation {
  width: 100%;
}

.tmua-paper-confirmation > p {
  margin: 0 0 16px;
  color: var(--color-ink-soft);
  line-height: var(--leading-relaxed);
}

.tmua-paper-confirmation__options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.tmua-paper-confirmation__options > div {
  min-width: 0;
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  gap: 3px 10px;
  padding: 13px 14px;
  border: 1px solid rgba(35, 140, 136, 0.42);
  border-radius: var(--radius-md);
  background: #f0f8f6;
}

.tmua-paper-confirmation__options span {
  width: 22px;
  height: 22px;
  display: grid;
  grid-row: 1 / 3;
  place-items: center;
  border-radius: 7px;
  background: #238c88;
  color: #fff;
  font-size: 13px;
  font-weight: var(--weight-bold);
}

.tmua-paper-confirmation__options strong {
  color: var(--color-ink);
  font-size: var(--text-sm);
}

.tmua-paper-confirmation__options small {
  overflow: hidden;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tmua-paper-confirmation__options em {
  grid-column: 1 / -1;
  justify-self: end;
  color: #187b71;
  font-size: 10px;
  font-style: normal;
  font-weight: var(--weight-bold);
}

:deep(.esat-subject-dialog) {
  overflow: hidden;
  border-radius: var(--radius-lg);
}

:deep(.esat-subject-dialog .el-dialog__header) {
  padding: 22px 24px 18px;
  border-bottom: 1px solid var(--color-line);
}

:deep(.esat-subject-dialog .el-dialog__title) {
  color: var(--color-ink);
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
}

:deep(.esat-subject-dialog .el-dialog__body) {
  padding: 22px 24px 8px;
}

:deep(.esat-subject-dialog .el-dialog__footer) {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px 22px;
}

:deep(.esat-subject-dialog .el-dialog__footer button) {
  min-height: var(--height-button);
  padding: 0 20px;
  border-radius: var(--radius-md);
}

.esat-subject-dialog__intro {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 18px;
}

.esat-subject-dialog__intro strong {
  color: var(--color-ink);
  font-size: var(--text-base);
}

.esat-subject-dialog__intro p {
  margin: 6px 0 0;
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

.esat-subject-dialog__intro > span {
  min-width: 48px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-pill);
  background: #e7f6f2;
  color: #187b71;
  font-size: var(--text-sm);
  font-weight: var(--weight-bold);
}

.esat-subject-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.esat-subject-option {
  min-width: 0;
  min-height: 72px;
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  align-items: center;
  gap: 11px;
  padding: 12px 14px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-ink);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    border-color var(--duration-fast) ease,
    background var(--duration-fast) ease,
    box-shadow var(--duration-fast) ease;
}

.esat-subject-option:first-child {
  grid-column: 1 / -1;
}

.esat-subject-option:hover,
.esat-subject-option:focus-visible {
  border-color: rgba(35, 140, 136, 0.46);
}

.esat-subject-option:focus-visible {
  outline: 3px solid rgba(35, 140, 136, 0.2);
  outline-offset: 2px;
}

.esat-subject-option--selected {
  border-color: rgba(35, 140, 136, 0.6);
  background: #f0f8f6;
  box-shadow: 0 0 0 1px rgba(35, 140, 136, 0.08);
}

.esat-subject-option--required {
  cursor: default;
}

.esat-subject-option__check {
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border: 1px solid #b9c2c8;
  border-radius: 7px;
  background: #fff;
  color: #fff;
  font-size: 13px;
  font-weight: var(--weight-bold);
}

.esat-subject-option--selected .esat-subject-option__check {
  border-color: #238c88;
  background: #238c88;
}

.esat-subject-option strong,
.esat-subject-option small {
  display: block;
}

.esat-subject-option strong {
  font-size: var(--text-sm);
}

.esat-subject-option small {
  overflow: hidden;
  margin-top: 4px;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.esat-subject-option em {
  padding: 3px 7px;
  border-radius: var(--radius-pill);
  background: #dcefea;
  color: #187b71;
  font-size: 10px;
  font-style: normal;
  font-weight: var(--weight-bold);
}

.esat-subject-dialog__state {
  min-height: 236px;
  display: grid;
  place-items: center;
  gap: 12px;
  color: var(--color-ink-muted);
  text-align: center;
}

.esat-subject-dialog__state p {
  margin: 0;
}

.esat-subject-dialog__state--error,
.esat-subject-dialog__unmatched {
  color: var(--color-danger);
}

.esat-subject-dialog__state button {
  min-height: var(--height-button);
  border-radius: var(--radius-md);
}

.esat-subject-dialog__match {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 4px 16px;
  margin-top: 14px;
  padding: 12px 14px;
  border: 1px solid #cce2dd;
  border-radius: var(--radius-md);
  background: #f4faf8;
}

.esat-subject-dialog__match span {
  grid-column: 1 / -1;
  color: #187b71;
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
}

.esat-subject-dialog__match span em {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: 6px;
  padding: 2px 6px;
  border-radius: var(--radius-pill);
  background: #dcefea;
  font-size: 10px;
  font-style: normal;
}

.esat-subject-dialog__match strong {
  overflow: hidden;
  color: var(--color-ink);
  font-size: var(--text-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.esat-subject-dialog__match small {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  white-space: nowrap;
}

.esat-subject-dialog__unmatched {
  margin: 14px 0 0;
  font-size: var(--text-xs);
}

.esat-subject-dialog__start:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

:deep(.diagnostic-history-dialog) {
  overflow: hidden;
  border-radius: var(--radius-lg);
}

:deep(.diagnostic-history-dialog .el-dialog__header) {
  padding: 22px 24px 18px;
  border-bottom: 1px solid var(--color-line);
}

:deep(.diagnostic-history-dialog .el-dialog__title) {
  color: var(--color-ink);
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
}

:deep(.diagnostic-history-dialog .el-dialog__body) {
  padding: 0;
}

.diagnostic-history {
  max-height: min(68vh, 720px);
  overflow-y: auto;
  padding: 8px 24px 20px;
}

.diagnostic-history__state {
  min-height: 220px;
  display: grid;
  place-items: center;
  gap: 12px;
  padding: 32px;
  color: var(--color-ink-muted);
  text-align: center;
}

.diagnostic-history__state p {
  margin: 0;
}

.diagnostic-history__state--error {
  color: var(--color-danger);
}

.diagnostic-history__state button {
  min-width: 100px;
  min-height: var(--height-button);
  border-radius: var(--radius-md);
}

.diagnostic-history__item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px 20px;
  padding: 18px 0;
  border-bottom: 1px solid var(--color-line);
}

.diagnostic-history__heading {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  grid-column: 1 / -1;
}

.diagnostic-history__heading > div {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.diagnostic-history__heading strong {
  font-weight: 700;
  color: var(--color-ink);
  font-size: var(--text-base);
}

.diagnostic-history__heading small {
  overflow: hidden;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.diagnostic-history__status {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 9px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-pill);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
}

.diagnostic-history__status--completed {
  border-color: #c8d2cc;
  background: #edf1ef;
  color: #435c4d;
}

.diagnostic-history__status--progress {
  border-color: #d6c9b2;
  background: #f3f0e9;
  color: #6b5b3e;
}

.diagnostic-history__status--failed {
  border-color: #d8c8c8;
  background: #f3eeee;
  color: #775555;
}

.diagnostic-history__metrics {
  min-width: 0;
  display: grid;
  grid-template-columns: 1.35fr 1fr 1fr 1.35fr;
  gap: 18px;
  margin: 0;
}

.diagnostic-history__metrics div {
  min-width: 0;
}

.diagnostic-history__metrics dt {
  margin-bottom: 5px;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.diagnostic-history__metrics dd {
  overflow: hidden;
  margin: 0;
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.diagnostic-history__action {
  min-width: 118px;
  height: var(--height-button);
  align-self: center;
  border-radius: var(--radius-md);
}

.diagnostic-history :deep(.app-pagination) {
  position: sticky;
  bottom: -20px;
  padding: 14px 0 0;
  background: var(--color-surface);
}

@media (max-width: 760px) {
  .assessment-year-overview,
  .assessment-paper-overview--tmua {
    padding: 18px;
  }

  .assessment-year-overview__heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  .assessment-year-overview__heading p {
    text-align: left;
  }

  .assessment-year-grid {
    grid-template-columns: 1fr;
  }

  .assessment-year-card {
    --assessment-year-cover-height: 180px;
  }

  .paper-filter-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .paper-filter-bar__controls {
    align-items: stretch;
    flex-direction: column;
  }

  .paper-filter-control {
    justify-content: space-between;
  }

  .status-filter {
    width: 100%;
    min-width: 0;
  }

  :deep(.diagnostic-history-dialog) {
    width: calc(100% - 32px) !important;
  }

  :deep(.esat-subject-dialog) {
    width: calc(100% - 32px) !important;
  }

  :deep(.esat-subject-dialog .el-dialog__body) {
    padding: 18px 18px 6px;
  }

  :deep(.esat-subject-dialog .el-dialog__footer) {
    padding: 14px 18px 18px;
  }

  .esat-subject-options {
    grid-template-columns: 1fr;
  }

  .tmua-paper-confirmation__options {
    grid-template-columns: 1fr;
  }

  .esat-subject-option:first-child {
    grid-column: auto;
  }

  .esat-subject-dialog__match {
    grid-template-columns: 1fr;
  }

  .esat-subject-dialog__match span {
    grid-column: auto;
  }

  .diagnostic-history__item {
    grid-template-columns: 1fr;
  }

  .diagnostic-history__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .diagnostic-history__action {
    width: 100%;
  }
}
</style>
