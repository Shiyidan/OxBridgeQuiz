<!-- 无限模考首页：提供公开模考目录、会员锁定、个人记录、成绩概览与官方考期倒计时。 -->
<template>
  <div class="mock-exam-page">
    <NavBar />

    <main class="mock-exam-shell">
      <header class="mock-hero">
        <div class="mock-hero__copy">
          <div class="mock-hero__eyebrow-line">
            <span class="mock-hero__eyebrow">FULL-LENGTH MOCK EXAMS</span>
          </div>
          <h1>无限模考</h1>
          <p>按正式考试结构完成整卷训练，熟悉节奏，追踪每一次进步。</p>
        </div>
        <div class="mock-hero__structure" aria-label="当前考试结构">
          <span>{{ activeExamType }}</span>
          <strong>{{ examStructure.title }}</strong>
          <small>{{ examStructure.description }}</small>
        </div>
      </header>

      <div class="mock-layout">
        <section class="mock-content" aria-label="无限模考内容">
          <div class="mock-tabs" role="tablist" aria-label="无限模考页面">
            <button
              type="button"
              role="tab"
              :aria-selected="activeTab === 'catalog'"
              :class="{ 'is-active': activeTab === 'catalog' }"
              @click="selectTab('catalog')"
            >
              模拟试卷
            </button>
            <button
              type="button"
              role="tab"
              :aria-selected="activeTab === 'records'"
              :class="{ 'is-active': activeTab === 'records' }"
              @click="selectTab('records')"
            >
              我的模考记录
            </button>
          </div>

          <template v-if="activeTab === 'catalog'">
            <div class="catalog-toolbar">
              <form class="catalog-search" role="search" @submit.prevent="applySearch">
                <el-icon aria-hidden="true"><Search /></el-icon>
                <input
                  v-model="keywordDraft"
                  type="search"
                  maxlength="80"
                  placeholder="搜索试卷名称或编号"
                  aria-label="搜索模拟试卷"
                />
                <button type="submit">搜索</button>
              </form>
              <div v-if="auth.isLoggedIn" class="catalog-filters" aria-label="试卷状态筛选">
                <button
                  v-for="option in catalogStatusOptions"
                  :key="option.value"
                  type="button"
                  :class="{ 'is-active': catalogStatus === option.value }"
                  @click="selectCatalogStatus(option.value)"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

            <div v-if="catalogLoading" class="state-panel" aria-live="polite">
              <span class="state-panel__spinner" aria-hidden="true"></span>
              <strong>正在加载 {{ activeExamType }} 模拟试卷</strong>
              <p>正在同步已发布试卷与当前权限。</p>
            </div>

            <div v-else-if="catalogError" class="state-panel state-panel--error">
              <el-icon aria-hidden="true"><Warning /></el-icon>
              <strong>模考目录暂时无法加载</strong>
              <p>{{ catalogError }}</p>
              <button type="button" @click="loadCatalog">
                <el-icon aria-hidden="true"><RefreshRight /></el-icon>
                重新加载
              </button>
            </div>

            <div v-else-if="!papers.length" class="state-panel">
              <el-icon aria-hidden="true"><Document /></el-icon>
              <strong>暂无可用模拟卷</strong>
              <p v-if="keyword || catalogStatus !== 'all'">
                当前条件下没有试卷，可以清除筛选后重试。
              </p>
              <p v-else>后台发布 {{ activeExamType }} 模考卷后会显示在这里。</p>
              <button
                v-if="keyword || catalogStatus !== 'all'"
                type="button"
                @click="clearCatalogFilters"
              >
                清除筛选
              </button>
            </div>

            <div v-else class="paper-list">
              <article
                v-for="paper in papers"
                :key="paper.id"
                class="paper-card"
                :class="{
                  'paper-card--locked': isPaperLocked(paper),
                  'paper-card--offline': paper.publicationStatus !== 'published',
                }"
              >
                <div class="paper-card__accent" aria-hidden="true"></div>
                <div class="paper-card__main">
                  <div class="paper-card__heading">
                    <div>
                      <div class="paper-card__badges">
                        <span>{{ paper.code || 'MOCK' }}</span>
                        <span
                          :class="
                            paper.accessTier === PAPER_ACCESS_TIER.FREE
                              ? 'paper-badge--free'
                              : 'paper-badge--member'
                          "
                        >
                          <el-icon v-if="paper.accessTier !== PAPER_ACCESS_TIER.FREE">
                            <Lock />
                          </el-icon>
                          {{ paper.accessTier === PAPER_ACCESS_TIER.FREE ? '免费卷' : '会员专享' }}
                        </span>
                        <span v-if="paper.publicationStatus !== 'published'">已下线</span>
                      </div>
                      <h2>{{ paper.title }}</h2>
                    </div>
                    <div v-if="isPaperLocked(paper)" class="paper-card__lock-copy">
                      <el-icon aria-hidden="true"><Lock /></el-icon>
                      <span>开通 {{ paper.examType }} 会员后解锁新模考</span>
                    </div>
                  </div>

                  <div class="paper-card__facts">
                    <span>
                      <el-icon aria-hidden="true"><Document /></el-icon>
                      {{ paper.totalQuestions }} 题
                    </span>
                    <span>
                      <el-icon aria-hidden="true"><Clock /></el-icon>
                      {{ formatDuration(paper.durationSeconds) }}
                    </span>
                    <span>{{ formatModuleNames(paper) }}</span>
                  </div>

                  <div v-if="auth.isLoggedIn" class="paper-card__progress">
                    <span v-if="paper.inProgressCount > 0">
                      未完成 <strong>{{ paper.inProgressCount }}</strong> 场
                    </span>
                    <span v-if="paper.completedCount > 0">
                      已完成 <strong>{{ paper.completedCount }}</strong> 次
                    </span>
                    <span v-if="paper.bestScore !== null">
                      最佳 <strong>{{ formatScore(paper.bestScore) }}</strong>
                    </span>
                    <span v-if="paper.inProgressCount === 0 && paper.completedCount === 0">
                      尚未开始
                    </span>
                  </div>
                  <div v-else class="paper-card__progress paper-card__progress--guest">
                    登录后可保存进度、成绩和诊断报告
                  </div>
                </div>

                <div class="paper-card__actions">
                  <button
                    v-if="paper.inProgressCount > 0"
                    type="button"
                    class="button-secondary"
                    @click="handleContinuePaper(paper)"
                  >
                    查看未完成
                  </button>
                  <button
                    v-if="paper.completedCount > 0 && paper.latestCompletedExamRecordId"
                    type="button"
                    class="button-secondary"
                    @click="openPaperReport(paper)"
                  >
                    查看报告
                  </button>
                  <button
                    type="button"
                    class="button-primary"
                    :class="{ 'button-primary--locked': isPaperLocked(paper) }"
                    :disabled="
                      startingPaperId === paper.id || paper.publicationStatus !== 'published'
                    "
                    @click="handleStartPaper(paper)"
                  >
                    <el-icon v-if="isPaperLocked(paper)" aria-hidden="true"><Lock /></el-icon>
                    {{ paperPrimaryAction(paper) }}
                    <el-icon v-if="!isPaperLocked(paper)" aria-hidden="true"
                      ><ArrowRight
                    /></el-icon>
                  </button>
                </div>
              </article>
            </div>

            <AppPagination
              v-if="catalogPagination.total > 0"
              v-model:page="catalogPage"
              v-model:page-size="catalogPageSize"
              :total="catalogPagination.total"
              :page-sizes="[5, 10, 20]"
              @page-change="loadCatalog"
              @page-size-change="handleCatalogPageSizeChange"
            />
          </template>

          <template v-else>
            <div v-if="!auth.isLoggedIn" class="login-gate">
              <span class="login-gate__icon" aria-hidden="true"
                ><el-icon><UserFilled /></el-icon
              ></span>
              <h2>登录后查看模考记录</h2>
              <p>未完成进度、历次成绩、报告和错题都保存在你的账号中。</p>
              <button type="button" @click="requireLogin">立即登录</button>
            </div>

            <template v-else>
              <div class="record-toolbar">
                <div>
                  <strong>我的 {{ activeExamType }} 模考</strong>
                  <span>每场答卷独立保存，未完成数量不受限制。</span>
                </div>
                <div class="record-status-switch" aria-label="记录状态">
                  <button
                    type="button"
                    :class="{ 'is-active': recordStatus === 'in_progress' }"
                    @click="selectRecordStatus('in_progress')"
                  >
                    未完成
                  </button>
                  <button
                    type="button"
                    :class="{ 'is-active': recordStatus === 'completed' }"
                    @click="selectRecordStatus('completed')"
                  >
                    已完成
                  </button>
                </div>
              </div>

              <div v-if="recordsLoading" class="state-panel">
                <span class="state-panel__spinner" aria-hidden="true"></span>
                <strong>正在加载模考记录</strong>
              </div>
              <div v-else-if="recordsError" class="state-panel state-panel--error">
                <el-icon aria-hidden="true"><Warning /></el-icon>
                <strong>模考记录暂时无法加载</strong>
                <p>{{ recordsError }}</p>
                <button type="button" @click="loadRecords">重新加载</button>
              </div>
              <div v-else-if="!records.length" class="state-panel">
                <el-icon aria-hidden="true"><Document /></el-icon>
                <strong>{{
                  recordStatus === 'in_progress' ? '暂无未完成模考' : '暂无已完成模考'
                }}</strong>
                <p>返回模拟试卷，开始一场完整的 {{ activeExamType }} 模考。</p>
                <button type="button" @click="selectTab('catalog')">浏览模拟试卷</button>
              </div>
              <div v-else class="record-list">
                <article v-for="record in records" :key="record.examRecordId" class="record-card">
                  <div class="record-card__top">
                    <div>
                      <span>{{ record.paperCode || 'MOCK' }}</span>
                      <h2>{{ record.paperTitle }}</h2>
                    </div>
                    <em :data-status="record.status">
                      {{ record.status === 'in_progress' ? '未完成' : '已完成' }}
                    </em>
                  </div>
                  <div class="record-card__details">
                    <div class="record-card__summary">
                      <dl>
                        <div>
                          <dt>开始时间</dt>
                          <dd>{{ formatDateTime(record.startedAt) }}</dd>
                        </div>
                        <div v-if="record.status === 'in_progress'">
                          <dt>当前进度</dt>
                          <dd>
                            {{ record.currentModuleLabel || '等待开始' }} ·
                            {{ record.answeredCount }}/{{ record.totalQuestions }} 题
                          </dd>
                        </div>
                        <template v-else>
                          <div>
                            <dt>交卷时间</dt>
                            <dd>{{ formatDateTime(record.submittedAt) }}</dd>
                          </div>
                          <div>
                            <dt>答题结果</dt>
                            <dd>{{ record.correctCount }}/{{ record.totalQuestions }} 题</dd>
                          </div>
                          <div>
                            <dt>正确率</dt>
                            <dd>{{ formatAccuracy(record.accuracy) }}</dd>
                          </div>
                          <div>
                            <dt>有效用时</dt>
                            <dd>{{ formatDuration(record.durationSeconds) }}</dd>
                          </div>
                        </template>
                        <div>
                          <dt>{{ record.status === 'in_progress' ? '剩余时间' : '本次成绩' }}</dt>
                          <dd>
                            {{
                              record.status === 'in_progress'
                                ? formatRemainingTime(record.remainingSeconds)
                                : formatRecordScore(record)
                            }}
                          </dd>
                        </div>
                      </dl>
                      <div
                        v-if="record.status === 'completed' && record.moduleScores.length"
                        class="record-card__module-scores"
                      >
                        <span v-for="module in record.moduleScores" :key="module.code">
                          <strong>{{ module.label }}</strong>
                          {{ module.correctCount }}/{{ module.totalQuestions }} 题 ·
                          {{ formatScore(module.score) }} 分
                        </span>
                      </div>
                    </div>
                    <div class="record-card__actions">
                      <button
                        v-if="record.status === 'in_progress'"
                        type="button"
                        class="button-danger-text"
                        @click="requestAbandon(record)"
                      >
                        放弃本次
                      </button>
                      <button
                        v-else
                        type="button"
                        class="button-secondary"
                        :disabled="record.wrongCount === 0"
                        @click="openWrongReview(record)"
                      >
                        {{ record.wrongCount === 0 ? '本场无错题' : `错题回顾（${record.wrongCount}）` }}
                      </button>
                      <button
                        type="button"
                        class="button-primary"
                        :disabled="retryingReportId === record.examRecordId"
                        @click="
                          record.status === 'in_progress'
                            ? continueRecord(record)
                            : openRecordReport(record)
                        "
                      >
                        {{
                          record.status === 'in_progress' ? '继续考试' : reportActionLabel(record)
                        }}
                        <el-icon aria-hidden="true"><ArrowRight /></el-icon>
                      </button>
                    </div>
                  </div>
                </article>
              </div>

              <AppPagination
                v-if="recordPagination.total > 0"
                v-model:page="recordPage"
                v-model:page-size="recordPageSize"
                :total="recordPagination.total"
                :page-sizes="[5, 10, 20]"
                @page-change="loadRecords"
                @page-size-change="handleRecordPageSizeChange"
              />
            </template>
          </template>
        </section>

        <aside class="mock-sidebar" aria-label="模考概览">
          <section class="overview-card">
            <div class="sidebar-card__heading">
              <span>冲刺概览</span>
              <small>{{ activeExamType }}</small>
            </div>
            <div v-if="!auth.isLoggedIn" class="overview-login">
              <p>登录后查看完成次数、最佳成绩和近五次趋势。</p>
              <button type="button" @click="requireLogin">登录查看</button>
            </div>
            <template v-else>
              <div class="overview-metrics">
                <div>
                  <span>已完成</span>
                  <strong>{{ overview?.completedCount ?? '--' }}</strong>
                  <small>次模考</small>
                </div>
                <div>
                  <span>最佳成绩</span>
                  <strong>{{ formatScore(overview?.bestScore) }}</strong>
                  <small
                    v-if="overview?.targetScore !== null && overview?.targetScore !== undefined"
                  >
                    目标 {{ formatScore(overview.targetScore) }}
                  </small>
                  <small v-else>尚未设置目标分</small>
                </div>
              </div>
              <div class="trend-card">
                <div class="trend-card__title">
                  <span>近五次趋势</span>
                  <el-icon aria-hidden="true"><TrendCharts /></el-icon>
                </div>
                <div v-if="overviewLoading" class="trend-card__empty">正在同步成绩...</div>
                <div v-else-if="overviewError" class="trend-card__empty">趋势暂时无法加载</div>
                <div v-else-if="!hasTrendData" class="trend-card__empty">完成模考后生成趋势</div>
                <MockExamTrendChart v-else-if="overview" :overview="overview" />
              </div>
            </template>
          </section>

          <section class="countdown-card">
            <div class="countdown-card__icon" aria-hidden="true">
              <el-icon><Calendar /></el-icon>
            </div>
            <div class="countdown-card__copy">
              <span>{{ activeExamType }} 官方考期</span>
              <template v-if="countdown">
                <strong v-if="countdown.state === 'starts_today'">今天考试</strong>
                <strong v-else-if="countdown.state === 'active'">考期进行中</strong>
                <strong v-else
                  ><b>{{ countdown.daysRemaining }}</b> 天</strong
                >
                <p>{{ examWindowLabel }}</p>
                <small>
                  {{ countdown.usedPreferredPeriod ? '使用个人中心设置' : '自动采用最近官方考期' }}
                </small>
              </template>
              <template v-else>
                <strong class="countdown-card__pending">待官方公布</strong>
                <p>当前没有已公布的未来考期</p>
              </template>
            </div>
            <router-link v-if="auth.isLoggedIn" to="/profile" aria-label="前往个人中心设置考期">
              设置
            </router-link>
            <a
              v-else
              :href="OFFICIAL_EXAM_DATES_SOURCE"
              target="_blank"
              rel="noreferrer"
              aria-label="查看 UAT-UK 官方考期"
            >
              官方
            </a>
          </section>

          <section class="notice-card">
            <div class="sidebar-card__heading">
              <span>模考须知</span>
            </div>
            <ul>
              <li>严格按照正式题量、模块和时间完成。</li>
              <li>支持暂停恢复，已结束模块不可返回。</li>
              <li>可以同时保留多场未完成模考。</li>
              <li>正式答题仅支持电脑端。</li>
            </ul>
          </section>
        </aside>
      </div>
    </main>

    <el-dialog
      v-model="startDialogVisible"
      width="560px"
      class="mock-start-dialog"
      title="确认开始模考"
      align-center
      destroy-on-close
      @closed="clearStartSelection"
    >
      <div v-if="selectedStartPaper" class="start-confirmation">
        <div class="start-confirmation__paper">
          <span>AceMock</span>
          <div>
            <strong>{{ selectedStartPaper.title }}</strong>
            <small>
              {{ selectedStartPaper.totalQuestions }} 题 ·
              {{ formatDuration(selectedStartPaper.durationSeconds) }} ·
              {{ formatModuleNames(selectedStartPaper) }}
            </small>
          </div>
        </div>
        <ul>
          <li>本次会创建一场新的独立答卷，不覆盖其他未完成记录。</li>
          <li>模块结束后不能返回修改，交卷后生成成绩和诊断报告。</li>
          <li>请使用电脑并预留完整考试时间。</li>
        </ul>
        <label class="start-confirmation__check">
          <input v-model="rulesAccepted" type="checkbox" />
          <span>我已阅读并了解以上规则</span>
        </label>
      </div>
      <template #footer>
        <button
          type="button"
          class="dialog-button dialog-button--secondary"
          @click="startDialogVisible = false"
        >
          取消
        </button>
        <button
          type="button"
          class="dialog-button dialog-button--primary"
          :disabled="!rulesAccepted || Boolean(startingPaperId)"
          @click="confirmStartPaper"
        >
          {{ startingPaperId ? '正在创建答卷...' : '确认开始' }}
        </button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="attemptDialogVisible"
      width="620px"
      class="mock-attempt-dialog"
      title="选择要继续的模考"
      align-center
    >
      <div class="attempt-options">
        <button
          v-for="attempt in selectedAttempts"
          :key="attempt.examRecordId"
          type="button"
          @click="continueAttempt(attempt)"
        >
          <span>
            <strong>{{ attempt.currentModuleLabel || '等待开始' }}</strong>
            <small>{{ formatDateTime(attempt.updatedAt) }} 更新</small>
          </span>
          <span>{{ attempt.answeredCount }}/{{ attempt.totalQuestions }} 题</span>
          <el-icon aria-hidden="true"><ArrowRight /></el-icon>
        </button>
      </div>
    </el-dialog>

    <el-dialog
      v-model="abandonDialogVisible"
      width="500px"
      class="mock-abandon-dialog"
      title="放弃本次模考？"
      align-center
      @closed="selectedAbandonRecord = null"
    >
      <p>放弃后本次进度将永久删除且无法恢复，不会生成成绩、报告或错题记录。</p>
      <template #footer>
        <button
          type="button"
          class="dialog-button dialog-button--secondary"
          @click="abandonDialogVisible = false"
        >
          取消
        </button>
        <button
          type="button"
          class="dialog-button dialog-button--danger"
          :disabled="abandoning"
          @click="confirmAbandon"
        >
          {{ abandoning ? '正在放弃...' : '确认放弃' }}
        </button>
      </template>
    </el-dialog>

    <DiagnosticAnalysisDialog
      :model-value="analysisDialogVisible"
      :exam-id="analysisExamRecordId"
      source="mock-exam"
      @view-report="handleAnalysisViewReport"
      @return-assessment="handleAnalysisReturn"
    />

    <PaymentModal
      v-model="paymentVisible"
      :default-exam-type="paymentExamType"
      @paid="handlePaymentSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowRight,
  Calendar,
  Clock,
  Document,
  Lock,
  RefreshRight,
  Search,
  TrendCharts,
  UserFilled,
  Warning,
} from '@element-plus/icons-vue'
import NavBar from '@/components/NavBar.vue'
import AppPagination from '@/components/AppPagination.vue'
import DiagnosticAnalysisDialog from '@/components/DiagnosticAnalysisDialog.vue'
import PaymentModal from '@/components/PaymentModal.vue'
import MockExamTrendChart from '@/views/mockExam/MockExamTrendChart.vue'
import { useAuthStore, type ActiveExamType } from '@/stores/auth'
import { PAPER_ACCESS_TIER } from '@/constants/paperTypes'
import { createLoginRequiredRouteLocation } from '@/utils/authRedirect'
import { getApiErrorMessage } from '@/utils/request'
import {
  OFFICIAL_EXAM_DATES_SOURCE,
  formatExamWindow,
  resolveExamCountdown,
} from '@/utils/examSittings'
import { getMember } from '@/api/member'
import { retryDiagnosticReport } from '@/api/exam'
import {
  abandonMockExam,
  getMockExamCatalogData,
  getMockExamOverviewData,
  getMockExamRecordsData,
  startMockExam,
  type MockExamAttemptBrief,
  type MockExamCatalogStatus,
  type MockExamOverviewResult,
  type MockExamPaperItem,
  type MockExamRecordItem,
  type MockExamRecordStatus,
} from '@/api/mockExams'
import type { PaginationMeta } from '@/api/papers'

type PageTab = 'catalog' | 'records'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const activeTab = ref<PageTab>(route.query.tab === 'records' ? 'records' : 'catalog')
const keywordDraft = ref('')
const keyword = ref('')
const catalogStatus = ref<MockExamCatalogStatus>('all')
const catalogPage = ref(1)
const catalogPageSize = ref(10)
const catalogLoading = ref(false)
const catalogError = ref('')
const papers = ref<MockExamPaperItem[]>([])
const catalogPagination = ref<PaginationMeta>(emptyPagination(10))
const overview = ref<MockExamOverviewResult | null>(null)
const overviewLoading = ref(false)
const overviewError = ref('')
const recordStatus = ref<MockExamRecordStatus>(
  route.query.status === 'completed' ? 'completed' : 'in_progress',
)
const recordPage = ref(1)
const recordPageSize = ref(10)
const recordsLoading = ref(false)
const recordsError = ref('')
const records = ref<MockExamRecordItem[]>([])
const recordPagination = ref<PaginationMeta>(emptyPagination(10))
const startDialogVisible = ref(false)
const selectedStartPaper = ref<MockExamPaperItem | null>(null)
const rulesAccepted = ref(false)
const startingPaperId = ref('')
const startRequestId = ref('')
const attemptDialogVisible = ref(false)
const selectedAttempts = ref<MockExamAttemptBrief[]>([])
const abandonDialogVisible = ref(false)
const selectedAbandonRecord = ref<MockExamRecordItem | null>(null)
const abandoning = ref(false)
const analysisDialogVisible = ref(false)
const analysisExamRecordId = ref('')
const retryingReportId = ref('')
const paymentVisible = ref(false)
const paymentExamType = ref<string>(auth.activeExamType)
let catalogLoadSequence = 0
let recordsLoadSequence = 0
let overviewLoadSequence = 0

const catalogStatusOptions: Array<{ label: string; value: MockExamCatalogStatus }> = [
  { label: '全部', value: 'all' },
  { label: '未开始', value: 'not_started' },
  { label: '有未完成', value: 'in_progress' },
  { label: '已完成', value: 'completed' },
]

// 空分页对象让加载、失败与空数据阶段共用稳定的组件输入。
function emptyPagination(pageSize: number): PaginationMeta {
  return {
    page: 1,
    pageSize,
    total: 0,
    totalPages: 0,
    hasPrev: false,
    hasNext: false,
  }
}

// 页面只读取导航栏维护的全局考试类型。
const activeExamType = computed<ActiveExamType>(() => auth.activeExamType)

// 考试结构摘要不写死题量，以后台每套正式模考卷配置为准。
const examStructure = computed(() =>
  activeExamType.value === 'ESAT'
    ? {
        title: 'Mathematics 1 + 两个选考模块',
        description: '三模块独立计时，模块间按正式规则过渡',
      }
    : {
        title: 'Paper 1 + Paper 2',
        description: '两卷完整作答，生成综合成绩与诊断报告',
      },
)

// 个人中心只保存月份，官方配置负责映射到当前考试在本地区的具体日期。
const preferredExamPeriod = computed(() => auth.memberContext?.studyPreferences.examDate || null)

// 未设置或已过期时，工具会自动采用当前考试最近的官方未来考期。
const countdown = computed(() =>
  resolveExamCountdown(activeExamType.value, preferredExamPeriod.value),
)

// 倒计时卡完整展示多日窗口，避免首日计算口径被理解为唯一考试日。
const examWindowLabel = computed(() =>
  countdown.value ? formatExamWindow(countdown.value.sitting) : '',
)

// 至少一条趋势包含有效成绩时才渲染折线图。
const hasTrendData = computed(() =>
  Boolean(overview.value?.series.some((series) => series.values.some((value) => value !== null))),
)

// 当前考试会员只解锁相同考试类型的会员卷。
function hasExamMembership(examType: string): boolean {
  return Boolean(auth.isAdmin || auth.memberContext?.quotas?.[examType]?.isMember)
}

// 会员锁定只约束会员卷的新开始，已经创建的答卷仍可继续。
function isPaperLocked(paper: MockExamPaperItem): boolean {
  return (
    paper.accessTier !== PAPER_ACCESS_TIER.FREE &&
    !hasExamMembership(paper.examType || activeExamType.value)
  )
}

// 页面切换保留各自分页状态，并按需请求个人记录。
function selectTab(tab: PageTab): void {
  activeTab.value = tab
  if (tab === 'records' && auth.isLoggedIn && !recordsLoading.value) void loadRecords()
}

// 搜索只在提交时刷新目录，避免每个输入字符都发请求。
function applySearch(): void {
  keyword.value = keywordDraft.value.trim()
  catalogPage.value = 1
  void loadCatalog()
}

// 登录用户可以按自己与试卷的关系筛选目录。
function selectCatalogStatus(status: MockExamCatalogStatus): void {
  if (catalogStatus.value === status) return
  catalogStatus.value = status
  catalogPage.value = 1
  void loadCatalog()
}

// 空结果清除搜索与关系筛选后回到完整目录。
function clearCatalogFilters(): void {
  keywordDraft.value = ''
  keyword.value = ''
  catalogStatus.value = 'all'
  catalogPage.value = 1
  void loadCatalog()
}

// 页容量变化时从第一页重新读取，避免旧页码超出新总页数。
function handleCatalogPageSizeChange(): void {
  catalogPage.value = 1
  void loadCatalog()
}

// 公开目录允许游客请求；后端按登录状态选择是否附带个人汇总。
async function loadCatalog(): Promise<void> {
  const sequence = ++catalogLoadSequence
  catalogLoading.value = true
  catalogError.value = ''
  try {
    const params = {
      examType: activeExamType.value,
      keyword: keyword.value,
      status: auth.isLoggedIn ? catalogStatus.value : 'all',
      page: catalogPage.value,
      pageSize: catalogPageSize.value,
    } as const
    const data = await getMockExamCatalogData(params)
    if (sequence !== catalogLoadSequence) return
    papers.value = data.list
    catalogPagination.value = data.pagination
    catalogPage.value = data.pagination.page
  } catch (error: unknown) {
    if (sequence !== catalogLoadSequence) return
    papers.value = []
    catalogPagination.value = emptyPagination(catalogPageSize.value)
    catalogError.value = getApiErrorMessage(error, '请检查网络后重试。')
  } finally {
    if (sequence === catalogLoadSequence) catalogLoading.value = false
  }
}

// 登录用户概览与目录独立失败，避免统计异常阻断浏览试卷。
async function loadOverview(): Promise<void> {
  if (!auth.isLoggedIn) {
    overview.value = null
    overviewError.value = ''
    return
  }
  const sequence = ++overviewLoadSequence
  overviewLoading.value = true
  overviewError.value = ''
  try {
    const data = await getMockExamOverviewData(activeExamType.value)
    if (sequence !== overviewLoadSequence) return
    overview.value = data
  } catch (error: unknown) {
    if (sequence !== overviewLoadSequence) return
    overview.value = null
    overviewError.value = getApiErrorMessage(error, '模考趋势暂时无法加载。')
  } finally {
    if (sequence === overviewLoadSequence) overviewLoading.value = false
  }
}

// 未完成与已完成分别分页，切换状态时回到第一页。
function selectRecordStatus(status: MockExamRecordStatus): void {
  if (recordStatus.value === status) return
  recordStatus.value = status
  recordPage.value = 1
  void loadRecords()
}

// 记录页容量变化后重置页码，确保结果稳定。
function handleRecordPageSizeChange(): void {
  recordPage.value = 1
  void loadRecords()
}

// 个人记录仅在登录后请求；游客区域保持登录引导而不是错误态。
async function loadRecords(): Promise<void> {
  if (!auth.isLoggedIn) return
  const sequence = ++recordsLoadSequence
  recordsLoading.value = true
  recordsError.value = ''
  try {
    const params = {
      examType: activeExamType.value,
      status: recordStatus.value,
      page: recordPage.value,
      pageSize: recordPageSize.value,
    }
    const data = await getMockExamRecordsData(params)
    if (sequence !== recordsLoadSequence) return
    records.value = data.list
    recordPagination.value = data.pagination
    recordPage.value = data.pagination.page
  } catch (error: unknown) {
    if (sequence !== recordsLoadSequence) return
    records.value = []
    recordPagination.value = emptyPagination(recordPageSize.value)
    recordsError.value = getApiErrorMessage(error, '请检查网络后重试。')
  } finally {
    if (sequence === recordsLoadSequence) recordsLoading.value = false
  }
}

// 电脑端限制与现有诊断测试一致，只在开始或继续正式答题时拦截。
function requireDesktopForExamAction(): boolean {
  const isMobileViewport =
    window.matchMedia('(max-width: 760px)').matches || window.screen.width <= 760
  if (!isMobileViewport) return false
  ElMessage.info('正式模考仅支持电脑端，请使用电脑继续。')
  return true
}

// 所有个人操作统一保留当前地址，登录后回到原考试与标签页。
function requireLogin(): boolean {
  if (auth.isLoggedIn) return false
  void router.push(createLoginRequiredRouteLocation(route.fullPath))
  return true
}

// 新开始依次检查设备、登录、下线和会员资格，再进入考前确认。
function handleStartPaper(paper: MockExamPaperItem): void {
  if (requireDesktopForExamAction()) return
  if (requireLogin()) return
  if (paper.publicationStatus !== 'published') {
    ElMessage.info('该模拟卷已下线，不能开始新的模考。')
    return
  }
  if (isPaperLocked(paper)) {
    openMembership(paper.examType)
    return
  }
  const esatSubjects = auth.memberContext?.studyPreferences.esatSubjects || []
  if (
    paper.examType === 'ESAT'
    && (esatSubjects.length !== 3 || !esatSubjects.includes('数学1'))
  ) {
    ElMessage.warning('请先在个人中心完成 ESAT 三科选择。')
    void router.push('/profile')
    return
  }
  selectedStartPaper.value = paper
  rulesAccepted.value = false
  startRequestId.value = createStartRequestId()
  startDialogVisible.value = true
}

// 每次考前确认生成稳定请求标识，同一确认请求重试时只会创建一场答卷。
function createStartRequestId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `mock-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

// 考前确认成功后由专用接口创建独立答卷，再进入复用的分段答题页。
async function confirmStartPaper(): Promise<void> {
  const paper = selectedStartPaper.value
  if (!paper || !rulesAccepted.value || startingPaperId.value) return
  if (requireDesktopForExamAction()) return
  startingPaperId.value = paper.id
  try {
    const result = await startMockExam(paper.id, startRequestId.value || createStartRequestId())
    startDialogVisible.value = false
    await router.push({
      name: 'mock-exam-session',
      params: { paperId: result.paperId },
      query: { examRecordId: result.examRecordId },
    })
  } catch (error: unknown) {
    ElMessage.error(getApiErrorMessage(error, '模考创建失败，请稍后重试。'))
  } finally {
    startingPaperId.value = ''
  }
}

// 关闭确认弹窗时清空试卷引用和规则勾选，避免下次误用旧状态。
function clearStartSelection(): void {
  selectedStartPaper.value = null
  rulesAccepted.value = false
  startRequestId.value = ''
}

// 同一试卷有多场未完成时必须由学生明确选择，单场则直接继续。
function handleContinuePaper(paper: MockExamPaperItem): void {
  if (requireDesktopForExamAction()) return
  if (requireLogin()) return
  const onlyAttempt = paper.inProgressAttempts[0]
  if (paper.inProgressAttempts.length === 1 && onlyAttempt) {
    continueAttempt(onlyAttempt)
    return
  }
  if (paper.inProgressAttempts.length === 0) {
    recordStatus.value = 'in_progress'
    selectTab('records')
    return
  }
  selectedAttempts.value = [...paper.inProgressAttempts]
  attemptDialogVisible.value = true
}

// 继续已有答卷只携带答卷身份，不重新创建或校验当前会员资格。
function continueAttempt(attempt: MockExamAttemptBrief): void {
  if (requireDesktopForExamAction()) return
  attemptDialogVisible.value = false
  void router.push({
    name: 'mock-exam-session',
    params: { paperId: attempt.paperId },
    query: { examRecordId: attempt.examRecordId },
  })
}

// 记录页继续操作使用记录自身的 paperId 和 examRecordId。
function continueRecord(record: MockExamRecordItem): void {
  if (requireDesktopForExamAction()) return
  void router.push({
    name: 'mock-exam-session',
    params: { paperId: record.paperId },
    query: { examRecordId: record.examRecordId },
  })
}

// 锁定卷对已登录非会员打开统一支付弹窗，游客仍先登录。
function openMembership(examType?: string): void {
  if (requireLogin()) return
  paymentExamType.value = examType || activeExamType.value
  paymentVisible.value = true
}

// 支付完成后刷新会员上下文，目录无需整页刷新即可解除锁定。
async function handlePaymentSuccess(): Promise<void> {
  try {
    const context = await getMember()
    auth.setMemberContext(context)
    paymentVisible.value = false
    await loadCatalog()
  } catch (error: unknown) {
    ElMessage.error(getApiErrorMessage(error, '会员状态刷新失败，请稍后重试。'))
  }
}

// 卡片报告入口使用最近一次已完成答卷，完整历史仍在个人记录标签页。
function openPaperReport(paper: MockExamPaperItem): void {
  if (!paper.latestCompletedExamRecordId) return
  openReport(paper.latestCompletedExamRecordId)
}

// 记录报告统一进入当前考试对应的现有诊断报告页面。
async function openRecordReport(record: MockExamRecordItem): Promise<void> {
  if (record.reportStatus === 'completed') {
    openReport(record.examRecordId)
    return
  }
  if (record.reportStatus === 'failed') {
    retryingReportId.value = record.examRecordId
    try {
      await retryDiagnosticReport(record.examRecordId)
    } catch (error: unknown) {
      ElMessage.error(getApiErrorMessage(error, '重新分析失败，请稍后重试。'))
      return
    } finally {
      retryingReportId.value = ''
    }
  }
  analysisExamRecordId.value = record.examRecordId
  analysisDialogVisible.value = true
}

// 报告生成中或失败时由公共分析弹窗轮询真实进度，并在失败后发起任务重试。
function handleAnalysisViewReport(target: string): void {
  analysisDialogVisible.value = false
  analysisExamRecordId.value = ''
  void router.push(target)
}

// 关闭进度弹窗后重新读取记录状态，确保重试结果能更新按钮文案。
function handleAnalysisReturn(): void {
  analysisDialogVisible.value = false
  analysisExamRecordId.value = ''
  void loadRecords()
}

// 已完成答卷的错题回顾复用逐题解析，并保留返回模考记录页的固定地址。
function openWrongReview(record: MockExamRecordItem): void {
  if (record.wrongCount === 0) return
  void router.push({
    name: 'exam-question-review',
    params: { id: record.examRecordId },
    query: {
      from: 'mock-exam',
      recordSource: 'diagnostic',
      report: activeExamType.value.toLowerCase(),
      wrongOnly: '1',
      returnTo: '/mock-exams?tab=records&status=completed',
    },
  })
}

// ESAT 与 TMUA 报告复用现有路由，并由报告页面标记模考来源。
function openReport(examRecordId: string): void {
  void router.push(`/exam-result/${examRecordId}/${activeExamType.value.toLowerCase()}`)
}

// 报告未完成时文案保留真实处理状态。
function reportActionLabel(record: MockExamRecordItem): string {
  if (retryingReportId.value === record.examRecordId) return '正在重新分析'
  if (record.reportStatus === 'completed') return '查看报告'
  if (record.reportStatus === 'failed') return '重新分析'
  return '查看进度'
}

// 放弃前保存目标记录并打开不可逆确认。
function requestAbandon(record: MockExamRecordItem): void {
  selectedAbandonRecord.value = record
  abandonDialogVisible.value = true
}

// 服务端确认删除后同时刷新记录、目录汇总和概览。
async function confirmAbandon(): Promise<void> {
  const record = selectedAbandonRecord.value
  if (!record || abandoning.value) return
  abandoning.value = true
  try {
    await abandonMockExam(record.examRecordId)
    abandonDialogVisible.value = false
    ElMessage.success('本次未完成模考已放弃。')
    await Promise.all([loadRecords(), loadCatalog(), loadOverview()])
  } catch (error: unknown) {
    ElMessage.error(getApiErrorMessage(error, '放弃失败，请稍后重试。'))
  } finally {
    abandoning.value = false
  }
}

// 试卷按钮同时表达游客、锁定、首次开始和重新模考状态。
function paperPrimaryAction(paper: MockExamPaperItem): string {
  if (!auth.isLoggedIn) return '登录后开始'
  if (isPaperLocked(paper)) return '开通会员'
  if (paper.completedCount > 0 || paper.inProgressCount > 0) return '开始新模考'
  return '开始模考'
}

// 模块名称来自后台固定组卷配置，空配置时回退到当前考试结构名称。
function formatModuleNames(paper: MockExamPaperItem): string {
  const names = paper.modules.map((module) => module.subject || module.code).filter(Boolean)
  if (names.length) return names.join(' · ')
  return paper.examType === 'ESAT' ? '三个正式模块' : 'Paper 1 · Paper 2'
}

// 后端统一返回秒，页面按完整分钟展示整卷时长。
function formatDuration(seconds: number): string {
  const minutes = Math.max(0, Math.round(seconds / 60))
  if (minutes < 60) return `${minutes} 分钟`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} 小时 ${rest} 分钟` : `${hours} 小时`
}

// 成绩未知时用占位符，避免把未生成误显示为 0 分。
function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined || !Number.isFinite(score)) return '--'
  return Number.isInteger(score) ? String(score) : score.toFixed(1)
}

// ESAT 没有官方综合分时提示查看模块成绩，TMUA 继续显示统一综合分。
function formatRecordScore(record: MockExamRecordItem): string {
  if (record.score !== null && record.score !== undefined) return `${formatScore(record.score)} 分`
  return record.moduleScores.length ? '见模块成绩' : '--'
}

// 后端返回一位小数百分比，缺失时不把未知状态误显示成零。
function formatAccuracy(accuracy: number | null): string {
  if (accuracy === null || !Number.isFinite(accuracy)) return '--'
  return `${accuracy.toFixed(accuracy % 1 === 0 ? 0 : 1)}%`
}

// 日期时间统一用中文本地格式，空值保持占位。
function formatDateTime(value: string | null): string {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

// 暂停答卷的剩余秒数转换为时分秒，不在前端自行继续扣减。
function formatRemainingTime(seconds: number | null): string {
  if (seconds === null || seconds < 0) return '以系统记录为准'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60
  return [hours, minutes, rest].map((value) => String(value).padStart(2, '0')).join(':')
}

// 考试类型切换后清理旧考试页面状态并重新读取当前目录和个人概览。
watch(activeExamType, () => {
  keywordDraft.value = ''
  keyword.value = ''
  catalogStatus.value = 'all'
  catalogPage.value = 1
  recordPage.value = 1
  papers.value = []
  records.value = []
  paymentVisible.value = false
  paymentExamType.value = activeExamType.value
  void Promise.all([loadCatalog(), loadOverview()])
  if (activeTab.value === 'records' && auth.isLoggedIn) void loadRecords()
})

// 初始化优先恢复会员与个人考期，再并行读取目录和概览。
onMounted(async () => {
  if (auth.isLoggedIn) {
    try {
      await auth.ensureMemberContext()
    } catch {
      // 目录仍可公开浏览，会员和个人考期区域分别按缺省状态展示。
    }
  }
  await Promise.all([
    loadCatalog(),
    loadOverview(),
    ...(activeTab.value === 'records' && auth.isLoggedIn ? [loadRecords()] : []),
  ])
})
</script>

<style scoped lang="scss">
.mock-exam-page {
  min-width: var(--fluid-page-min-width);
  min-height: 100vh;
  background:
    radial-gradient(circle at 82% 118px, rgba(0, 0, 0, 0.035), transparent 260px), var(--color-bg);
  color: var(--color-ink);
}

.mock-exam-shell {
  width: var(--fluid-shell-width);
  margin: 0 auto;
  padding: 44px 0 72px;
}

.mock-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 48px;
  padding: 8px 4px 34px;
  border-bottom: 1px solid var(--color-line);
}

.mock-hero__eyebrow-line {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.mock-hero__eyebrow {
  display: block;
  color: var(--color-ink-muted);
  font-size: 11px;
  font-weight: var(--weight-bold);
  letter-spacing: 0.2em;
}

.mock-hero h1 {
  font-size: 38px;
  font-weight: var(--weight-bold);
  letter-spacing: -0.04em;
  line-height: 1.1;
}

.mock-hero__copy p {
  margin-top: 12px;
  color: var(--color-ink-soft);
  font-size: var(--text-base);
}

.mock-hero__structure {
  display: grid;
  min-width: 350px;
  padding: 18px 22px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-xl);
  background: rgba(255, 255, 255, 0.8);
  box-shadow: var(--shadow-sm);
}

.mock-hero__structure span {
  color: var(--color-ink-muted);
  font-size: 11px;
  font-weight: var(--weight-bold);
  letter-spacing: 0.12em;
}

.mock-hero__structure strong {
  margin-top: 5px;
  font-size: var(--text-base);
  font-weight: var(--weight-semi);
}

.mock-hero__structure small {
  margin-top: 3px;
  color: var(--color-ink-muted);
  font-size: 12px;
}

.mock-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 316px;
  align-items: start;
  gap: 28px;
  padding-top: 28px;
}

.mock-content,
.overview-card,
.countdown-card,
.notice-card {
  border: 1px solid var(--color-line);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.mock-content {
  min-height: 650px;
  padding: 0 28px 24px;
  border-radius: var(--radius-xl);
}

.mock-tabs {
  display: flex;
  gap: 30px;
  height: 66px;
  border-bottom: 1px solid var(--color-line);
}

.mock-tabs button {
  position: relative;
  border: 0;
  background: transparent;
  color: var(--color-ink-muted);
  font-family: inherit;
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  cursor: pointer;
}

.mock-tabs button::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  background: transparent;
  content: '';
}

.mock-tabs button.is-active {
  color: var(--color-ink);
  font-weight: var(--weight-semi);
}

.mock-tabs button.is-active::after {
  background: var(--color-ink);
}

.catalog-toolbar,
.record-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 0;
}

.catalog-search {
  display: flex;
  align-items: center;
  width: min(380px, 46%);
  height: 40px;
  padding-left: 13px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);
  color: var(--color-ink-muted);
}

.catalog-search:focus-within {
  border-color: var(--color-ink);
  background: var(--color-surface);
}

.catalog-search input {
  min-width: 0;
  flex: 1;
  height: 100%;
  padding: 0 10px;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--color-ink);
  font-family: inherit;
}

.catalog-search button,
.state-panel button,
.login-gate button,
.overview-login button {
  height: 100%;
  padding: 0 15px;
  border: 0;
  border-left: 1px solid var(--color-line);
  background: transparent;
  color: var(--color-ink);
  font-family: inherit;
  font-weight: var(--weight-semi);
  cursor: pointer;
}

.catalog-filters,
.record-status-switch {
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: var(--radius-md);
  background: var(--color-hover);
}

.catalog-filters button,
.record-status-switch button {
  height: 32px;
  padding: 0 12px;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-ink-muted);
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
}

.catalog-filters button.is-active,
.record-status-switch button.is-active {
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  color: var(--color-ink);
  font-weight: var(--weight-semi);
}

.paper-list,
.record-list {
  display: grid;
  gap: 14px;
}

.paper-card {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 162px;
  min-height: 161px;
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  transition:
    transform var(--duration-base) ease,
    box-shadow var(--duration-base) ease,
    border-color var(--duration-base) ease;
}

.paper-card:hover {
  transform: translateY(-1px);
  border-color: #d8d8d8;
  box-shadow: var(--shadow-md);
}

.paper-card--locked {
  background: linear-gradient(105deg, #fff 0%, #fff 70%, #f7f7f7 100%);
}

.paper-card--offline {
  opacity: 0.68;
}

.paper-card__accent {
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: var(--color-ink);
}

.paper-card--locked .paper-card__accent {
  background: var(--color-warning);
}

.paper-card__main {
  padding: 15px 22px 12px 24px;
}

.paper-card__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.paper-card__badges {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 9px;
}

.paper-card__badges span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 22px;
  padding: 0 8px;
  border-radius: var(--radius-pill);
  background: var(--color-info-bg);
  color: var(--color-ink-soft);
  font-size: 10px;
  font-weight: var(--weight-semi);
  letter-spacing: 0.03em;
}

.paper-card__badges .paper-badge--free {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.paper-card__badges .paper-badge--member {
  background: var(--color-warning-bg);
  color: #a66b08;
}

.paper-card__heading h2,
.record-card h2 {
  font-size: var(--text-lg);
  font-weight: var(--weight-semi);
  letter-spacing: -0.015em;
}

.paper-card__lock-copy {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 180px;
  color: var(--color-ink-muted);
  font-size: 11px;
  line-height: 1.45;
}

.paper-card__facts {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-top: 17px;
  color: var(--color-ink-soft);
  font-size: 12px;
}

.paper-card__facts span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.paper-card__progress {
  display: flex;
  gap: 18px;
  margin-top: 17px;
  padding-top: 13px;
  border-top: 1px dashed var(--color-line);
  color: var(--color-ink-muted);
  font-size: 12px;
}

.paper-card__progress strong {
  color: var(--color-ink);
  font-weight: var(--weight-semi);
}

.paper-card__progress--guest {
  color: var(--color-ink-muted);
}

.paper-card__actions {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 9px;
  padding: 20px;
  border-left: 1px solid var(--color-line-soft);
  background: rgba(250, 250, 250, 0.72);
}

.button-primary,
.button-secondary,
.dialog-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  height: 38px;
  padding: 0 15px;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 12px;
  font-weight: var(--weight-semi);
  cursor: pointer;
}

.button-primary {
  border: 1px solid var(--color-ink);
  background: var(--color-ink);
  color: var(--color-ink-inverse);
}

.button-primary--locked {
  border-color: #2f2a20;
  background: #2f2a20;
}

.button-primary:disabled {
  border-color: var(--color-line);
  background: var(--color-active);
  color: var(--color-ink-muted);
  cursor: not-allowed;
}

.button-secondary {
  border: 1px solid var(--color-line);
  background: var(--color-surface);
  color: var(--color-ink-soft);
}

.button-secondary:hover {
  border-color: var(--color-ink);
  color: var(--color-ink);
}

.button-secondary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.state-panel,
.login-gate {
  display: flex;
  min-height: 390px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: var(--color-ink-muted);
  text-align: center;
}

.state-panel > .el-icon,
.login-gate__icon {
  display: grid;
  width: 52px;
  height: 52px;
  margin-bottom: 16px;
  place-items: center;
  border-radius: 50%;
  background: var(--color-hover);
  color: var(--color-ink-soft);
  font-size: 22px;
}

.state-panel strong,
.login-gate h2 {
  color: var(--color-ink);
  font-size: var(--text-lg);
  font-weight: var(--weight-semi);
}

.state-panel p,
.login-gate p {
  max-width: 460px;
  margin-top: 8px;
  font-size: var(--text-sm);
}

.state-panel button,
.login-gate button,
.overview-login button {
  height: 38px;
  margin-top: 20px;
  border: 1px solid var(--color-ink);
  border-radius: var(--radius-md);
  background: var(--color-ink);
  color: var(--color-ink-inverse);
}

.state-panel__spinner {
  width: 30px;
  height: 30px;
  margin-bottom: 18px;
  border: 2px solid var(--color-line);
  border-top-color: var(--color-ink);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.state-panel--error > .el-icon {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.record-toolbar > div:first-child {
  display: grid;
  gap: 3px;
}

.record-toolbar strong {
  font-weight: var(--weight-semi);
}

.record-toolbar span {
  color: var(--color-ink-muted);
  font-size: 12px;
}

.record-card {
  padding: 20px 22px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.record-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.record-card__top > div > span {
  color: var(--color-ink-muted);
  font-size: 10px;
  font-weight: var(--weight-bold);
  letter-spacing: 0.1em;
}

.record-card__top em {
  padding: 5px 10px;
  border-radius: var(--radius-pill);
  background: var(--color-warning-bg);
  color: #a66b08;
  font-size: 11px;
  font-style: normal;
  font-weight: var(--weight-semi);
}

.record-card__top em[data-status='completed'] {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.record-card__details {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 20px;
  margin-top: 18px;
  padding: 15px 0;
  border-top: 1px solid var(--color-line-soft);
  border-bottom: 1px solid var(--color-line-soft);
}

.record-card__summary {
  min-width: 0;
}

.record-card dl {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.record-card dl div {
  display: grid;
  gap: 3px;
}

.record-card dt {
  color: var(--color-ink-muted);
  font-size: 11px;
}

.record-card dd {
  color: var(--color-ink-soft);
  font-size: 12px;
  font-weight: var(--weight-medium);
}

.record-card__module-scores {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.record-card__module-scores span {
  padding: 6px 9px;
  border: 1px solid var(--color-line-soft);
  border-radius: var(--radius-pill);
  background: var(--color-hover);
  color: var(--color-ink-muted);
  font-size: 11px;
}

.record-card__module-scores strong {
  margin-right: 5px;
  color: var(--color-ink-soft);
}

.record-card__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.record-card__actions .button-secondary {
  white-space: nowrap;
}

.button-danger-text {
  margin-right: auto;
  border: 0;
  background: transparent;
  color: var(--color-danger);
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
}

.mock-sidebar {
  display: grid;
  gap: 16px;
}

.overview-card,
.notice-card {
  padding: 21px;
  border-radius: var(--radius-xl);
}

.sidebar-card__heading,
.trend-card__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-card__heading > span,
.trend-card__title > span {
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
}

.sidebar-card__heading small {
  padding: 3px 7px;
  border-radius: var(--radius-pill);
  background: var(--color-hover);
  color: var(--color-ink-muted);
  font-size: 10px;
  font-weight: var(--weight-bold);
}

.overview-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 18px;
}

.overview-metrics > div {
  display: grid;
  min-height: 104px;
  align-content: center;
  padding: 13px;
  border-radius: var(--radius-lg);
  background: var(--color-surface-alt);
}

.overview-metrics span,
.overview-metrics small {
  color: var(--color-ink-muted);
  font-size: 10px;
}

.overview-metrics strong {
  margin: 3px 0;
  font-size: 27px;
  font-weight: var(--weight-bold);
  letter-spacing: -0.04em;
}

.overview-login {
  margin-top: 18px;
  padding: 17px;
  border-radius: var(--radius-lg);
  background: var(--color-surface-alt);
  color: var(--color-ink-muted);
  font-size: 12px;
}

.overview-login button {
  width: 100%;
  margin-top: 14px;
}

.trend-card {
  margin-top: 18px;
  padding-top: 17px;
  border-top: 1px solid var(--color-line);
}

.trend-card__title .el-icon {
  color: var(--color-ink-muted);
}

.trend-card__empty {
  display: grid;
  height: 122px;
  place-items: center;
  color: var(--color-ink-muted);
  font-size: 11px;
}

.countdown-card {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 19px;
  border-radius: var(--radius-xl);
}

.countdown-card__icon {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: var(--radius-lg);
  background: var(--color-ink);
  color: var(--color-ink-inverse);
}

.countdown-card__copy {
  display: grid;
}

.countdown-card__copy > span,
.countdown-card__copy small {
  color: var(--color-ink-muted);
  font-size: 9px;
}

.countdown-card__copy strong {
  margin: 1px 0;
  font-size: var(--text-lg);
  font-weight: var(--weight-semi);
}

.countdown-card__copy strong b {
  font-size: 24px;
  font-weight: var(--weight-bold);
}

.countdown-card__copy p {
  color: var(--color-ink-soft);
  font-size: 10px;
}

.countdown-card__pending {
  font-size: var(--text-base) !important;
}

.countdown-card > a {
  color: var(--color-ink-muted);
  font-size: 10px;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.notice-card ul {
  display: grid;
  gap: 10px;
  margin-top: 16px;
  padding-left: 17px;
  color: var(--color-ink-soft);
  font-size: 11px;
  line-height: 1.5;
}

.start-confirmation__paper {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 15px;
  border-radius: var(--radius-lg);
  background: var(--color-surface-alt);
}

.start-confirmation__paper > span {
  display: grid;
  min-width: 58px;
  height: 42px;
  place-items: center;
  border-radius: var(--radius-md);
  background: var(--color-ink);
  color: var(--color-ink-inverse);
  font-size: 10px;
  font-weight: var(--weight-bold);
}

.start-confirmation__paper > div {
  display: grid;
  gap: 3px;
}

.start-confirmation__paper strong {
  font-weight: var(--weight-semi);
}

.start-confirmation__paper small,
.attempt-options small {
  color: var(--color-ink-muted);
  font-size: 11px;
}

.start-confirmation ul {
  display: grid;
  gap: 9px;
  margin: 18px 0;
  padding-left: 18px;
  color: var(--color-ink-soft);
  font-size: 12px;
}

.start-confirmation__check {
  display: flex;
  align-items: center;
  gap: 9px;
  cursor: pointer;
  font-size: 12px;
}

.dialog-button--secondary {
  border: 1px solid var(--color-line);
  background: var(--color-surface);
  color: var(--color-ink-soft);
}

.dialog-button--primary {
  border: 1px solid var(--color-ink);
  background: var(--color-ink);
  color: var(--color-ink-inverse);
}

.dialog-button--danger {
  border: 1px solid var(--color-danger);
  background: var(--color-danger);
  color: var(--color-ink-inverse);
}

.dialog-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.attempt-options {
  display: grid;
  gap: 9px;
}

.attempt-options button {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 16px;
  padding: 14px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-ink-soft);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
}

.attempt-options button:hover {
  border-color: var(--color-ink);
}

.attempt-options button > span:first-child {
  display: grid;
  gap: 3px;
}

.attempt-options strong {
  color: var(--color-ink);
  font-weight: var(--weight-semi);
}

.mock-abandon-dialog p {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  line-height: 1.7;
}

:deep(.app-pagination) {
  margin-top: 20px;
  background: transparent;
}

:deep(.mock-start-dialog),
:deep(.mock-attempt-dialog),
:deep(.mock-abandon-dialog) {
  border-radius: var(--radius-xl);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1320px) {
  .mock-exam-page {
    --fluid-shell-width: 1120px;
  }

  .mock-layout {
    grid-template-columns: minmax(0, 1fr) 292px;
    gap: 20px;
  }

  .mock-content {
    padding-right: 22px;
    padding-left: 22px;
  }
}
</style>
