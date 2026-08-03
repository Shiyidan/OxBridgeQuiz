/** 登录后首页数据组合：按当前备考目标聚合真实诊断、练习、错题与会员状态。 */
import { computed, onMounted, onScopeDispose, ref, watch, type ComputedRef, type Ref } from 'vue'
import {
  getActiveQuestionBankPractice,
  getMistakeNotebookData,
  type ActiveQuestionBankPractice,
} from '@/api/exam'
import type { ExamPreference, ExamQuota, MemberContext } from '@/api/member'
import {
  getAssessmentPapersData,
  getAssessmentScoreTrend,
  type AssessmentPaperItem,
  type AssessmentScoreTrendResult,
} from '@/api/papers'
import { useAuthStore, type ActiveExamType } from '@/stores/auth'
import { getApiErrorMessage } from '@/utils/request'

export type HomeDashboardState = 'no-goal' | 'new' | 'progress' | 'report' | 'active' | 'idle'

export interface HomeDashboardGoal {
  examType: ActiveExamType
  subjects: string[]
  targetUniversities: string[]
  targetMajor: string | null
  targetScore: number | null
  examDate: string | null
  weeklyHours: number | null
}

export interface HomeDiagnosticProgress {
  examRecordId: string
  paperId: string
  paperTitle: string
  year: number
  answeredCount: number
  totalQuestions: number
  remainingCount: number
  completionPercent: number
  phase: string | null
  currentModuleIndex: number | null
  currentModuleLabel: string | null
  completedModuleCount: number
  totalModuleCount: number
  startedAt: string | null
  expiresAt: string | null
}

export interface HomeTrendScore {
  key: string
  label: string
  score: number
  previousScore: number | null
  delta: number | null
  date: string
  submittedAt: string
  examRecordId: string
  paperTitle: string
}

export interface HomeMemberStatus {
  examType: ActiveExamType | null
  role: string
  label: '管理员' | '会员用户' | '免费用户'
  isAdmin: boolean
  isMember: boolean
  plan: string | null
  endsAt: number | null
  remainingDays: number | null
}

/** 后端提供真实未读信号后，可由此字段接入 report 状态，当前不会主动构造。 */
export interface HomeDashboardReportSignal {
  examType: ActiveExamType
  paperId: string
  examRecordId: string
  reportCompletedAt: string
}

export interface UseHomeDashboardReturn {
  currentExam: ComputedRef<ActiveExamType | null>
  goals: ComputedRef<HomeDashboardGoal[]>
  currentGoal: ComputedRef<HomeDashboardGoal | null>
  state: ComputedRef<HomeDashboardState>
  papers: ComputedRef<AssessmentPaperItem[]>
  paper: ComputedRef<AssessmentPaperItem | null>
  progress: ComputedRef<HomeDiagnosticProgress | null>
  completedAttemptCount: ComputedRef<number>
  scoreTrend: Ref<AssessmentScoreTrendResult | null>
  trendScores: ComputedRef<HomeTrendScore[]>
  mistakeTotal: Ref<number | null>
  practice: Ref<ActiveQuestionBankPractice | null>
  memberStatus: ComputedRef<HomeMemberStatus | null>
  reportSignal: Ref<HomeDashboardReportSignal | null>
  loading: Ref<boolean>
  error: Ref<string>
  reload: () => Promise<void>
}

type AssessmentPapersByExam = Partial<Record<ActiveExamType, AssessmentPaperItem[]>>

interface OptionalDashboardData {
  scoreTrend: AssessmentScoreTrendResult | null
  practice: ActiveQuestionBankPractice | null
  mistakeTotal: number | null
}

// 仅允许首页状态进入产品支持的两种考试上下文。
function normalizeExamType(value: unknown): ActiveExamType | null {
  const normalized = String(value || '').toUpperCase()
  if (normalized === 'ESAT' || normalized === 'TMUA') return normalized
  return null
}

// 备考目标只来自会员上下文中已保存的用户偏好，并按考试类型去重。
function normalizeGoals(examPreferences: ExamPreference[]): HomeDashboardGoal[] {
  const goals = new Map<ActiveExamType, HomeDashboardGoal>()
  for (const preference of examPreferences) {
    const examType = normalizeExamType(preference.examType)
    if (!examType || goals.has(examType)) continue
    goals.set(examType, {
      examType,
      subjects: [...(preference.subjects || [])],
      targetUniversities: [...(preference.targetUniversities || [])],
      targetMajor: preference.targetMajor || null,
      targetScore: preference.targetScore ?? null,
      examDate: preference.examDate || null,
      weeklyHours: preference.weeklyHours ?? null,
    })
  }
  return [...goals.values()]
}

// 当保存目标与当前导航考试不一致时，回到真实存在的首个目标，避免跨考试混入记录。
function resolveCurrentExam(
  goals: HomeDashboardGoal[],
  activeExamType: ActiveExamType,
): ActiveExamType | null {
  if (!goals.length) return null
  if (goals.some((goal) => goal.examType === activeExamType)) return activeExamType
  return goals[0]?.examType || null
}

// 多套试卷意外同时处于进行中时，以服务端返回的最近开始时间作为唯一首页任务。
function findLatestInProgressPaper(papers: AssessmentPaperItem[]): AssessmentPaperItem | null {
  let latestPaper: AssessmentPaperItem | null = null
  let latestStartedAt = Number.NEGATIVE_INFINITY
  for (const paper of papers) {
    if (paper.testStatus !== 'in_progress' || !paper.examRecordId) continue
    const startedAt = paper.startedAt ? Date.parse(paper.startedAt) : Number.NaN
    const comparableStartedAt = Number.isNaN(startedAt) ? 0 : startedAt
    if (!latestPaper || comparableStartedAt > latestStartedAt) {
      latestPaper = paper
      latestStartedAt = comparableStartedAt
    }
  }
  return latestPaper
}

// 诊断首页只派生接口能够证明的累计进度，不把答题数量猜成具体恢复题号。
function buildDiagnosticProgress(paper: AssessmentPaperItem): HomeDiagnosticProgress | null {
  if (!paper.examRecordId || paper.testStatus !== 'in_progress') return null
  const totalQuestions = Math.max(0, paper.totalQuestions || 0)
  const answeredCount = Math.min(totalQuestions, Math.max(0, paper.answeredCount || 0))
  const currentModuleIndex = paper.currentModuleIndex
  const currentModule =
    currentModuleIndex === null ? null : paper.modules[currentModuleIndex] || null
  const completedModuleCount = paper.modules.reduce((count, _module, index) => {
    const isCompleted =
      currentModuleIndex !== null &&
      (index < currentModuleIndex ||
        (index === currentModuleIndex && paper.phase === 'ready_to_submit'))
    return count + Number(isCompleted)
  }, 0)

  return {
    examRecordId: paper.examRecordId,
    paperId: paper.paperId,
    paperTitle: paper.title,
    year: paper.year,
    answeredCount,
    totalQuestions,
    remainingCount: Math.max(0, totalQuestions - answeredCount),
    completionPercent: totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0,
    phase: paper.phase,
    currentModuleIndex,
    currentModuleLabel: currentModule?.subject || currentModule?.code || null,
    completedModuleCount,
    totalModuleCount: paper.modules.length,
    startedAt: paper.startedAt,
    expiresAt: paper.expiresAt,
  }
}

// 最新成绩与同评分项的上一条真实成绩配对，历史不足时不生成变化值。
function buildLatestTrendScores(trend: AssessmentScoreTrendResult | null): HomeTrendScore[] {
  const latestPoint = trend?.points.at(-1)
  if (!latestPoint) return []
  const previousPoints = trend!.points.slice(0, -1).reverse()

  return latestPoint.scores.map((score) => {
    const previousScore =
      previousPoints
        .flatMap((point) => point.scores)
        .find((candidate) => candidate.key === score.key)?.score ?? null
    return {
      ...score,
      previousScore,
      delta: previousScore === null ? null : Number((score.score - previousScore).toFixed(2)),
      date: latestPoint.date,
      submittedAt: latestPoint.submittedAt,
      examRecordId: latestPoint.examRecordId,
      paperTitle: latestPoint.paperTitle,
    }
  })
}

// 配额键按考试类型大小写兼容读取，但会员身份仍以服务端 isMember 为准。
function findExamQuota(
  context: MemberContext,
  examType: ActiveExamType | null,
): ExamQuota | undefined {
  if (!examType) return Object.values(context.quotas).find((quota) => quota.isMember)
  return Object.entries(context.quotas).find(([key]) => normalizeExamType(key) === examType)?.[1]
}

// 账户标签优先表达管理员身份，其余用户按当前考试的真实会员配额展示。
function buildMemberStatus(
  context: MemberContext | null,
  examType: ActiveExamType | null,
): HomeMemberStatus | null {
  if (!context) return null
  const quota = findExamQuota(context, examType)
  const isMember = Boolean(quota?.isMember)
  return {
    examType,
    role: context.role,
    label: context.isAdmin ? '管理员' : isMember ? '会员用户' : '免费用户',
    isAdmin: context.isAdmin,
    isMember,
    plan: quota?.plan || null,
    endsAt: quota?.endsAt ?? null,
    remainingDays: quota?.remainingDays ?? null,
  }
}

// 趋势、练习和错题是补充信息，单项失败时隐藏该项而不伪造首页状态。
async function loadOptionalDashboardData(examType: ActiveExamType): Promise<OptionalDashboardData> {
  const [trendResult, practiceResult, mistakesResult] = await Promise.allSettled([
    getAssessmentScoreTrend(examType),
    getActiveQuestionBankPractice(examType),
    getMistakeNotebookData({ examType, page: 1, pageSize: 1 }),
  ])

  const resolvedTrend =
    trendResult.status === 'fulfilled' && normalizeExamType(trendResult.value.examType) === examType
      ? trendResult.value
      : null
  const resolvedPractice =
    practiceResult.status === 'fulfilled' &&
    (!practiceResult.value || normalizeExamType(practiceResult.value.examType) === examType)
      ? practiceResult.value
      : null
  const resolvedMistakeTotal =
    mistakesResult.status === 'fulfilled'
      ? Math.max(0, mistakesResult.value.pagination.total || 0)
      : null

  return {
    scoreTrend: resolvedTrend,
    practice: resolvedPractice,
    mistakeTotal: resolvedMistakeTotal,
  }
}

export function useHomeDashboard(): UseHomeDashboardReturn {
  const auth = useAuthStore()
  const loading = ref(true)
  const error = ref('')
  const assessmentPapersByExam = ref<AssessmentPapersByExam>({})
  const scoreTrend = ref<AssessmentScoreTrendResult | null>(null)
  const mistakeTotal = ref<number | null>(null)
  const practice = ref<ActiveQuestionBankPractice | null>(null)
  const reportSignal = ref<HomeDashboardReportSignal | null>(null)
  let loadSequence = 0
  let mounted = false

  // 用户的备考目标只读取服务端会员上下文，不从已有答题记录反推。
  const goals = computed(() => normalizeGoals(auth.memberContext?.examPreferences || []))

  // 管理员可直接选择工作考试；学生当前考试仍必须属于已保存备考目标。
  const currentExam = computed(() =>
    auth.isAdmin ? auth.activeExamType : resolveCurrentExam(goals.value, auth.activeExamType),
  )

  // 当前目标保留科目和备考信息，供首页按 ESAT/TMUA 上下文生成文案。
  const currentGoal = computed(
    () => goals.value.find((goal) => goal.examType === currentExam.value) || null,
  )

  // 当前试卷集合按请求考试再次过滤，防止异常响应污染另一考试首页。
  const papers = computed(() => {
    const examType = currentExam.value
    if (!examType) return []
    return (assessmentPapersByExam.value[examType] || []).filter(
      (item) => normalizeExamType(item.examType) === examType,
    )
  })

  // 首屏只承接当前考试最近开始且尚未完成的一套诊断卷。
  const paper = computed(() => findLatestInProgressPaper(papers.value))

  // 进度字段全部由进行中诊断记录派生，不使用本地缓存或演示值补齐。
  const progress = computed(() => (paper.value ? buildDiagnosticProgress(paper.value) : null))

  // 首次诊断依据当前考试所有试卷的真实完成次数判定。
  const completedAttemptCount = computed(() =>
    papers.value.reduce((total, item) => total + Math.max(0, item.completedAttemptCount || 0), 0),
  )

  // 成绩区只展示最新日期的真实评分，并在存在同项历史时提供差值。
  const trendScores = computed(() => buildLatestTrendScores(scoreTrend.value))

  // 会员标签跟随当前考试配额；未选目标时只概括是否拥有任一有效会员。
  const memberStatus = computed(() => buildMemberStatus(auth.memberContext, currentExam.value))

  // 状态严格遵循诊断进度、未来未读报告信号、进行中练习、首次诊断的优先级。
  const state = computed<HomeDashboardState>(() => {
    if (!currentExam.value) return 'no-goal'
    if (progress.value) return 'progress'
    if (reportSignal.value?.examType === currentExam.value) return 'report'
    if (practice.value) return 'active'
    if (completedAttemptCount.value === 0) return 'new'
    return 'idle'
  })

  // 切换考试或重试时先清空可选字段，避免旧考试数据在加载期间短暂串入。
  function resetLoadedData(): void {
    assessmentPapersByExam.value = {}
    scoreTrend.value = null
    mistakeTotal.value = null
    practice.value = null
    reportSignal.value = null
  }

  // 首页刷新先完成会员与诊断核心请求，再容错加载趋势、练习和错题补充数据。
  async function reload(): Promise<void> {
    const requestSequence = ++loadSequence
    loading.value = true
    error.value = ''
    resetLoadedData()

    // 访客首页只展示公开演示，不发起登录态数据请求，也不把未登录误报为加载失败。
    if (!auth.isLoggedIn) {
      loading.value = false
      return
    }

    try {
      const memberContext = await auth.ensureMemberContext()
      if (requestSequence !== loadSequence) return
      if (!memberContext) throw new Error('无法读取登录用户的备考信息，请重新登录后再试。')

      const requestedGoals = normalizeGoals(memberContext.examPreferences || [])
      const requestedExam = memberContext.isAdmin
        ? auth.activeExamType
        : resolveCurrentExam(requestedGoals, auth.activeExamType)
      if (!requestedExam) return

      const currentAssessmentResult = await getAssessmentPapersData(requestedExam)
      if (requestSequence !== loadSequence) return
      const nextPapersByExam: AssessmentPapersByExam = {
        [requestedExam]: (currentAssessmentResult.list || []).filter(
          (item) => normalizeExamType(item.examType) === requestedExam,
        ),
      }

      // 当前考试是首页核心请求；另一目标只为提示条补充摘要，失败时不拖垮当前首页。
      const otherGoals = requestedGoals.filter((goal) => goal.examType !== requestedExam)
      const [optionalData, otherAssessmentResults] = await Promise.all([
        loadOptionalDashboardData(requestedExam),
        Promise.allSettled(
          otherGoals.map(async (goal) => {
            const result = await getAssessmentPapersData(goal.examType)
            return [
              goal.examType,
              (result.list || []).filter(
                (item) => normalizeExamType(item.examType) === goal.examType,
              ),
            ] as const
          }),
        ),
      ])
      if (requestSequence !== loadSequence) return
      for (const result of otherAssessmentResults) {
        if (result.status === 'fulfilled') {
          const [examType, isolatedPapers] = result.value
          nextPapersByExam[examType] = isolatedPapers
        }
      }
      assessmentPapersByExam.value = nextPapersByExam
      scoreTrend.value = optionalData.scoreTrend
      practice.value = optionalData.practice
      mistakeTotal.value = optionalData.mistakeTotal
    } catch (caughtError: unknown) {
      if (requestSequence !== loadSequence) return
      resetLoadedData()
      error.value = getApiErrorMessage(caughtError, '首页数据加载失败，请稍后重新加载。')
    } finally {
      if (requestSequence === loadSequence) loading.value = false
    }
  }

  // 组合函数挂载后读取一次最新真实记录。
  onMounted(() => {
    mounted = true
    void reload()
  })

  // 导航考试切换后重新请求并隔离该考试的数据集合。
  watch(
    () => auth.activeExamType,
    () => {
      if (mounted) void reload()
    },
  )

  // 页面离开后废弃尚未返回的请求，防止旧页面继续写入响应。
  onScopeDispose(() => {
    mounted = false
    loadSequence += 1
  })

  return {
    currentExam,
    goals,
    currentGoal,
    state,
    papers,
    paper,
    progress,
    completedAttemptCount,
    scoreTrend,
    trendScores,
    mistakeTotal,
    practice,
    memberStatus,
    reportSignal,
    loading,
    error,
    reload,
  }
}
