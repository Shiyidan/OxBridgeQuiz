<!-- 登录后首页：用学生真实记录驱动首屏状态，并以五个分屏承接诊断、练习与错题闭环。 -->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ArrowRight, Connection, DocumentChecked, MagicStick } from '@element-plus/icons-vue'
import type { ActiveQuestionBankPractice } from '@/api/exam'
import type { AssessmentPaperItem } from '@/api/papers'
import type { ActiveExamType } from '@/stores/auth'
import type {
  HomeDashboardGoal,
  HomeDashboardReportSignal,
  HomeDashboardState,
  HomeDiagnosticProgress,
  HomeMemberStatus,
  HomeOtherGoalSummary,
  HomeTrendScore,
} from './useHomeDashboard'

interface StudentHomeProps {
  loading?: boolean
  error?: string
  username?: string
  currentExam?: ActiveExamType | null
  currentGoal?: HomeDashboardGoal | null
  state?: HomeDashboardState
  paper?: AssessmentPaperItem | null
  progress?: HomeDiagnosticProgress | null
  completedAttemptCount?: number
  trendScores?: HomeTrendScore[]
  mistakeTotal?: number | null
  practice?: ActiveQuestionBankPractice | null
  memberStatus?: HomeMemberStatus | null
  otherGoalSummary?: HomeOtherGoalSummary | null
  reportSignal?: HomeDashboardReportSignal | null
}

interface HeroContent {
  kicker: string
  title: string
  description: string
  primary: string
  secondary: string
  goodTitle: string
  goodDetail: string
  focusTitle: string
  focusDetail: string
  scopeTitle: string
  scopeText: string
  scopeAction: string
}

interface HomeEntry {
  index: string
  title: string
  description: string
  actionLabel: string
  mark: string
  tone: 'teal' | 'amber' | 'violet' | 'default'
  path: string | null
}

interface ProgressRow {
  key: string
  label: string
  savedLabel: string
  percent: number
  status: string
  state: 'done' | 'current' | 'pending'
}

interface StoryContent {
  sourceKicker: string
  sourceTitle: string
  sourceDescription: string
  sourcePoints: string[]
  modelTitleLines: string[]
  modelDescription: string
  modelPoints: string[]
  modelInput: string
  modelOutput: string
  loopTitle: string
  loopDescription: string
  loopPoints: string[]
  loopDiagnostic: string
  loopPractice: string
}

interface ScreenDefinition {
  id: string
  label: string
}

const props = withDefaults(defineProps<StudentHomeProps>(), {
  loading: false,
  error: '',
  username: '同学',
  currentExam: null,
  currentGoal: null,
  state: 'no-goal',
  paper: null,
  progress: null,
  completedAttemptCount: 0,
  trendScores: () => [],
  mistakeTotal: null,
  practice: null,
  memberStatus: null,
  otherGoalSummary: null,
  reportSignal: null,
})

const emit = defineEmits<{
  navigate: [path: string]
  'select-exam': [exam: ActiveExamType]
  retry: []
  'open-payment': []
  'manage-goals': []
}>()

const screenDefinitions: ScreenDefinition[] = [
  { id: 'home-overview', label: '我的首页' },
  { id: 'home-source-screen', label: '真题来源' },
  { id: 'home-model-screen', label: '专项练习' },
  { id: 'home-loop-screen', label: '诊断闭环' },
  { id: 'home-action-screen', label: '继续备考' },
]

const studentRoot = ref<HTMLElement | null>(null)
const activeScreenIndex = ref(0)
let scrollFrame = 0
let lastPagingKeyAt = 0
let desktopPagingMedia: MediaQueryList | null = null
let reducedMotionMedia: MediaQueryList | null = null

// 考试名称在未选择目标时保持中性，避免从缓存或历史记录猜测当前考试。
const examLabel = computed(() => props.currentExam ?? 'ESAT / TMUA')

// 空闲状态已有诊断记录时提供直达入口，不与“继续未完成测试”的恢复行动混淆。
const showIdleDiagnosticLink = computed(
  () => props.state === 'idle' && props.completedAttemptCount > 0,
)

// 当前科目仅展示服务端备考目标中实际保存的内容，字段缺失时不补演示科目。
const subjectSummary = computed(() => {
  const subjects = props.currentGoal?.subjects.filter(Boolean) ?? []
  return subjects.length ? subjects.join(' · ') : '科目信息以备考目标为准'
})

// 报告入口优先使用明确的未读报告信号，再退回同一次真实成绩记录的考试记录 ID。
const reportPath = computed(() => {
  const examType = props.currentExam?.toLowerCase()
  const examRecordId = props.reportSignal?.examRecordId ?? props.trendScores[0]?.examRecordId
  if (!examType || !examRecordId) return null
  return `/exam-result/${encodeURIComponent(examRecordId)}/${examType}`
})

// 未完成诊断只携带服务端试卷与考试记录标识，具体恢复位置由诊断页重新读取。
const diagnosticResumePath = computed(() => {
  if (!props.paper?.id || !props.progress?.examRecordId) return '/assessment'
  return `/assessment/exam/${encodeURIComponent(props.paper.id)}?examRecordId=${encodeURIComponent(props.progress.examRecordId)}`
})

// 进行中专项练习使用服务端活动记录恢复，不根据首页展示字段重新组题。
const practiceResumePath = computed(() => {
  if (!props.practice?.examRecordId) return '/question-bank'
  return `/practice?examId=${encodeURIComponent(props.practice.examRecordId)}`
})

// 错题入口始终携带当前考试，避免错题本默认展示另一考试或混合记录。
const mistakeNotebookPath = computed(() =>
  props.currentExam
    ? `/mistake-notebook?examType=${encodeURIComponent(props.currentExam)}`
    : '/mistake-notebook',
)

// 首屏文案只从当前真实状态可证明的字段生成，缺失的报告洞察与知识点不会被推断。
const heroContent = computed<HeroContent>(() => {
  const exam = examLabel.value
  if (props.state === 'no-goal') {
    return {
      kicker: '选择备考目标',
      title: '先告诉我们，你现在准备哪一项考试',
      description:
        'ESAT 与 TMUA 的诊断、练习和错题记录会分开保存。选择的是当前查看目标，不会限制你以后新增另一项。',
      primary: '选择 ESAT',
      secondary: '选择 TMUA',
      goodTitle: '两项考试独立记录',
      goodDetail: '切换目标不会覆盖另一项考试的进度。',
      focusTitle: '先完成一次目标选择',
      focusDetail: '选择会同步到个人信息，之后仍可随时调整。',
      scopeTitle: '当前目标',
      scopeText: '尚未选择',
      scopeAction: '管理目标',
    }
  }

  if (props.state === 'progress' && props.progress) {
    const currentPart = props.progress.currentModuleLabel
      ? `继续完成 ${props.progress.currentModuleLabel}`
      : '继续完成这份诊断'
    return {
      kicker: '测试未完成',
      title: `${currentPart}，完成后再生成完整报告`,
      description: `${props.progress.answeredCount} / ${props.progress.totalQuestions} 道题的进度已保存，目前还剩 ${props.progress.remainingCount} 道题。`,
      primary: props.progress.currentModuleLabel
        ? `继续 ${props.progress.currentModuleLabel}`
        : '继续未完成测试',
      secondary: '查看试卷详情',
      goodTitle: props.progress.totalModuleCount
        ? `${props.progress.completedModuleCount} / ${props.progress.totalModuleCount} 个模块已完成`
        : `${props.progress.answeredCount} 道题已保存`,
      goodDetail: '已保存的答案和作答位置无需重新开始。',
      focusTitle: `${props.progress.remainingCount} 道题待完成`,
      focusDetail: '全部完成并提交后，系统才会生成本次诊断报告。',
      scopeTitle: '当前诊断',
      scopeText: props.progress.paperTitle,
      scopeAction: '查看试卷',
    }
  }

  if (props.state === 'report') {
    const latestScore = props.trendScores[0]
    return {
      kicker: '新报告',
      title: `${exam} 的最新诊断报告已经准备好`,
      description: '先打开完整报告查看本次成绩、知识点和用时，再从真实结果决定下一步练习。',
      primary: reportPath.value ? '查看诊断报告' : '查看诊断记录',
      secondary: '看本次错题',
      goodTitle: latestScore
        ? `${latestScore.label}：${formatScore(latestScore.score)}`
        : '本次诊断已经完成',
      goodDetail: latestScore?.paperTitle || '成绩明细以完整诊断报告为准。',
      focusTitle: '先查看完整报告',
      focusDetail: '首页不推测薄弱知识点，练习依据请以本次报告为准。',
      scopeTitle: '报告范围',
      scopeText: exam,
      scopeAction: '查看报告',
    }
  }

  if (props.state === 'active' && props.practice) {
    const remaining = Math.max(0, props.practice.totalQuestions - props.practice.answeredCount)
    return {
      kicker: '接着上次继续',
      title: `继续完成这组 ${exam} 专项练习`,
      description: `${props.practice.answeredCount} / ${props.practice.totalQuestions} 道题已经作答，还剩 ${remaining} 道题。完成并提交后，再按真实结果选择下一项。`,
      primary: '继续当前练习',
      secondary: '查看练习选择',
      goodTitle: '练习进度已保存',
      goodDetail: `${props.practice.answeredCount} 道题已有作答记录。`,
      focusTitle: remaining ? `继续完成剩余 ${remaining} 道题` : '提交当前练习',
      focusDetail: '题目与保存进度由当前练习记录恢复。',
      scopeTitle: '当前练习',
      scopeText: `${exam} · ${props.practice.totalQuestions} 题`,
      scopeAction: '查看题库',
    }
  }

  if (props.state === 'idle') {
    return {
      kicker: '按自己的节奏继续',
      title: '目前没有必须马上完成的内容',
      description:
        '首页不会替你安排固定天数。你可以选择知识点练习、重新做一次诊断，或回看已经收录的错题。',
      primary: '选择知识点练习',
      secondary: '重新做一次诊断',
      goodTitle: props.completedAttemptCount
        ? `已完成 ${props.completedAttemptCount} 次诊断`
        : '备考目标已经同步',
      goodDetail: '历史记录仍可在对应功能页查看。',
      focusTitle: '下一步由你选择',
      focusDetail: '诊断、练习和错题入口都保留在首屏。',
      scopeTitle: '当前考试',
      scopeText: exam,
      scopeAction: '管理目标',
    }
  }

  return {
    kicker: '从一次诊断开始',
    title: exam === 'TMUA' ? '先完成两卷，看看目前卡在哪里' : '先做一套真题，看看现在在哪',
    description:
      exam === 'TMUA'
        ? '完成 Paper 1 与 Paper 2 后生成一个综合分，同时保留两卷的真实答题记录。'
        : '完成后会看到各科独立成绩、主要失分和接下来最值得练的内容。',
    primary: '开始第一次诊断',
    secondary: `先了解 ${exam}`,
    goodTitle: '备考目标已经同步',
    goodDetail: subjectSummary.value,
    focusTitle: '按正式节奏完成第一次诊断',
    focusDetail:
      exam === 'TMUA' ? '完成两卷后再生成综合结果。' : '完成整套测试后查看各科独立结果。',
    scopeTitle: exam === 'TMUA' ? '当前考试' : '当前科目',
    scopeText: exam === 'TMUA' ? 'TMUA · Paper 1 ＋ Paper 2' : subjectSummary.value,
    scopeAction: exam === 'TMUA' ? '查看说明' : '调整科目',
  }
})

// 三个固定入口展示真实进度；数量接口缺失或为零时使用中性提示而非“0 数据”面板。
const homeEntries = computed<HomeEntry[]>(() => {
  if (props.state === 'no-goal') {
    return [
      ['01', '诊断测试'],
      ['02', '专项练习'],
      ['03', '错题本'],
    ].map(([index, title]) => ({
      index: index!,
      title: title!,
      description: '先选择备考目标',
      actionLabel: '选择目标后可用',
      mark: '—',
      tone: 'default',
      path: null,
    }))
  }

  const diagnosticEntry: HomeEntry =
    props.state === 'progress' && props.progress
      ? {
          index: '01',
          title: '诊断测试',
          description: `${props.progress.paperTitle} · 已答 ${props.progress.answeredCount}/${props.progress.totalQuestions} 题`,
          actionLabel: '继续诊断测试',
          mark: props.progress.totalModuleCount
            ? `${props.progress.completedModuleCount}/${props.progress.totalModuleCount}`
            : `${props.progress.completionPercent}%`,
          tone: 'amber',
          path: diagnosticResumePath.value,
        }
      : props.state === 'report' && reportPath.value
        ? {
            index: '01',
            title: '诊断测试',
            description: '最新一次诊断报告已经生成',
            actionLabel: '查看新报告',
            mark: 'NEW',
            tone: 'teal',
            path: reportPath.value,
          }
        : {
            index: '01',
            title: '诊断测试',
            description: props.completedAttemptCount
              ? `已完成 ${props.completedAttemptCount} 次诊断`
              : '完成第一次诊断后查看真实结果',
            actionLabel: props.completedAttemptCount ? '查看诊断记录' : '开始第一次诊断',
            mark: props.completedAttemptCount ? String(props.completedAttemptCount) : 'GO',
            tone: 'teal',
            path: '/assessment',
          }

  const practiceRemaining = props.practice
    ? Math.max(0, props.practice.totalQuestions - props.practice.answeredCount)
    : null
  const practiceEntry: HomeEntry = props.practice
    ? {
        index: '02',
        title: '专项练习',
        description: `当前练习已答 ${props.practice.answeredCount}/${props.practice.totalQuestions} 题`,
        actionLabel: '继续当前练习',
        mark: practiceRemaining ? String(practiceRemaining) : '练',
        tone: 'violet',
        path: practiceResumePath.value,
      }
    : {
        index: '02',
        title: '专项练习',
        description: '按考试、知识点和难度选择练习',
        actionLabel: '选择知识点',
        mark: '练',
        tone: 'violet',
        path: '/question-bank',
      }

  const mistakeEntry: HomeEntry =
    props.mistakeTotal && props.mistakeTotal > 0
      ? {
          index: '03',
          title: '错题本',
          description: `${props.mistakeTotal} 道错题可继续复习`,
          actionLabel: '查看错题',
          mark: String(props.mistakeTotal),
          tone: 'amber',
          path: mistakeNotebookPath.value,
        }
      : {
          index: '03',
          title: '错题本',
          description: props.mistakeTotal === null ? '错题数量暂未载入' : '做题后会自动收录错题',
          actionLabel: '进入错题本',
          mark: '—',
          tone: 'default',
          path: mistakeNotebookPath.value,
        }

  return [diagnosticEntry, practiceEntry, mistakeEntry]
})

// 模块进度由试卷模块题量和累计已答数派生，无法定位模块时只展示整卷真实进度。
const progressRows = computed<ProgressRow[]>(() => {
  if (!props.progress || !props.paper) return []
  if (!props.paper.modules.length || props.progress.currentModuleIndex === null) {
    return [
      {
        key: props.progress.paperId,
        label: props.progress.paperTitle,
        savedLabel: `${props.progress.answeredCount} / ${props.progress.totalQuestions} 已保存`,
        percent: props.progress.completionPercent,
        status: `还剩 ${props.progress.remainingCount} 题`,
        state: 'current',
      },
    ]
  }

  let precedingQuestionCount = 0
  return props.paper.modules.map((module, index) => {
    const answeredInModule = Math.min(
      module.questionCount,
      Math.max(0, props.progress!.answeredCount - precedingQuestionCount),
    )
    precedingQuestionCount += module.questionCount
    const percent = module.questionCount
      ? Math.round((answeredInModule / module.questionCount) * 100)
      : 0
    const isDone =
      index < props.progress!.currentModuleIndex! ||
      (index === props.progress!.currentModuleIndex && props.progress!.phase === 'ready_to_submit')
    const isCurrent = index === props.progress!.currentModuleIndex && !isDone
    return {
      key: module.code || `${index}`,
      label: module.subject || module.code,
      savedLabel: `${answeredInModule} / ${module.questionCount} ${isDone ? '已提交' : '已保存'}`,
      percent: isDone ? 100 : percent,
      status: isDone
        ? '已完成'
        : isCurrent
          ? `还剩 ${Math.max(0, module.questionCount - answeredInModule)} 题`
          : '待完成',
      state: isDone ? 'done' : isCurrent ? 'current' : 'pending',
    }
  })
})

// 三个说明分屏随当前考试切换文案，未选择目标时使用不混用记录的通用说明。
const storyContent = computed<StoryContent>(() => {
  if (props.currentExam === 'ESAT') {
    return {
      sourceKicker: 'ESAT 真题来源',
      sourceTitle: '可用的历史试题，按现行考纲重新整理',
      sourceDescription:
        'ENGAA 与 NSAA 中仍符合现行 ESAT 范围的题目，按当前备考科目筛选、剔除超纲内容并重新组成诊断卷。',
      sourcePoints: ['历史来源可追溯', '逐题对照现行考纲', '三个科目分别诊断、独立评分'],
      modelTitleLines: ['真题做完以后，', '还有同路数的新题可练'],
      modelDescription: '系统整理真题中的考点、题型、推理方式和难度，再把这些边界用于专项练习。',
      modelPoints: ['不跨出当前 ESAT 考纲', '按科目、知识点与难度组合', '练习结果继续回到个人记录'],
      modelInput: 'ENGAA / NSAA 可用历史题',
      modelOutput: 'ESAT 专项练习',
      loopTitle: '做完一套题，三科接下来练什么就清楚了',
      loopDescription:
        '诊断分别看三科的失分与用时，专项练习补具体知识点，错题本继续记录是否在同一处出错。',
      loopPoints: ['三科结果互不合计', '练习依据来自真实诊断', '错题与解析持续保留'],
      loopDiagnostic: '三科分别看成绩、知识点和用时',
      loopPractice: '只练当前没有做稳的内容',
    }
  }

  if (props.currentExam === 'TMUA') {
    return {
      sourceKicker: 'TMUA 两卷结构',
      sourceTitle: 'Paper 1 与 Paper 2 保持完整考试关系',
      sourceDescription:
        'Paper 1 关注数学知识应用，Paper 2 关注数学推理；两卷记录分别保留，并共同换算一个综合分。',
      sourcePoints: ['两卷答题记录分别保存', '完成两卷后统一生成报告', '正式结果使用两卷综合分'],
      modelTitleLines: ['从两卷真题中整理不同的推理任务'],
      modelDescription:
        '专项练习保留 Paper 1 与 Paper 2 的任务差异，再按知识点和难度组织新的训练。',
      modelPoints: ['区分数学应用与数学推理', '按知识点和难度组合', '练习记录只进入 TMUA 上下文'],
      modelInput: 'TMUA Paper 1 ＋ Paper 2',
      modelOutput: 'TMUA 专项练习',
      loopTitle: '两卷完成后，从综合结果回到具体题型',
      loopDescription:
        '诊断先形成一个综合分，再回到两卷的正确题数、知识点和用时，最后衔接专项练习与错题复习。',
      loopPoints: [
        '综合分由两卷共同换算',
        '问题仍定位到具体试卷与知识点',
        '错题与练习记录保持同一考试上下文',
      ],
      loopDiagnostic: '两卷共同生成综合结果',
      loopPractice: '回到具体试卷与知识点练习',
    }
  }

  return {
    sourceKicker: '两项考试独立整理',
    sourceTitle: 'ESAT 与 TMUA 使用各自的真题结构',
    sourceDescription:
      '两项考试的试卷来源、评分方式和学习记录分开管理；选择目标后，首页只显示该考试的真实上下文。',
    sourcePoints: ['ESAT 按所选三科重组', 'TMUA 保留两卷结构', '诊断与练习记录互不混用'],
    modelTitleLines: ['专项练习遵循对应考试的命题边界'],
    modelDescription:
      '先确认考试，再从该考试真题中整理考点、推理方式与难度，不把两项考试的题目混在一起。',
    modelPoints: ['先按考试隔离题目', '再按知识点与难度组合', '结果回写对应考试记录'],
    modelInput: 'ESAT / TMUA 各自真题',
    modelOutput: '对应考试专项练习',
    loopTitle: '每一项考试都有自己的诊断闭环',
    loopDescription:
      '选择目标后，诊断、专项练习和错题本只承接该考试的数据，切换目标不会覆盖另一边记录。',
    loopPoints: ['先选择当前查看目标', '再从真实诊断进入练习', '错题持续回到对应考试'],
    loopDiagnostic: '按当前考试读取真实记录',
    loopPractice: '只进入对应考试的练习',
  }
})

// 收尾区沿用首屏主行动，并把当前状态压缩为三个不含虚构统计的提示。
const finalPoints = computed(() => {
  const points: Record<HomeDashboardState, string[]> = {
    'no-goal': ['两项考试记录分开', '以后可以新增另一目标', '选择结果同步到个人信息'],
    new: ['完成一套真实诊断', '查看对应考试结果', '再决定下一步练什么'],
    progress: ['从已保存位置继续', '已完成内容无需重做', '全部完成后生成报告'],
    report: ['查看本次真实结果', '定位具体失分', '从报告继续练习'],
    active: ['恢复当前练习进度', '完成剩余题目', '提交后再决定下一步'],
    idle: ['重新完成诊断', '选择知识点练习', '回看已收录错题'],
  }
  return points[props.state]
})

// 权益卡只陈述当前真实身份，不从页面状态推断具体额度或到期时间。
const accessContent = computed(() => {
  if (props.memberStatus?.isMember) {
    return {
      badge: props.memberStatus.label,
      title: `${examLabel.value} 会员权益已生效`,
      points: ['诊断记录与报告', '专项练习题库', '错题复习与解析'],
      note:
        props.memberStatus.remainingDays === null
          ? '具体权益与有效期以会员中心为准。'
          : `当前权益剩余 ${props.memberStatus.remainingDays} 天。`,
    }
  }
  return {
    badge: props.memberStatus?.label ?? '免费用户',
    title: '先从当前真实任务开始',
    points: ['诊断测试入口', '学习记录', '按需选择会员考试类型'],
    note: '会员按考试类型独立生效，具体权益以购买弹窗为准。',
  }
})

// 分数保留接口返回精度，整数不额外补小数位。
function formatScore(score: number): string {
  return Number.isInteger(score) ? String(score) : String(Number(score.toFixed(2)))
}

// 变化文案仅在存在同评分项历史数据时出现，避免把单次成绩解释成趋势。
function formatTrend(score: HomeTrendScore): string {
  if (score.delta === null) return '暂无可比历史'
  if (score.delta === 0) return '与上次持平'
  return `${score.delta > 0 ? '比上次高' : '比上次低'} ${formatScore(Math.abs(score.delta))}`
}

// 主行动按状态进入真实功能页；未选择目标时由两个显式选择按钮单独处理。
function handlePrimaryAction(): void {
  if (props.state === 'progress') emit('navigate', diagnosticResumePath.value)
  else if (props.state === 'report') emit('navigate', reportPath.value || '/assessment')
  else if (props.state === 'active') emit('navigate', practiceResumePath.value)
  else if (props.state === 'idle') emit('navigate', '/question-bank')
  else emit('navigate', '/assessment')
}

// 次行动保持状态语义：报告看错题、练习回题库，其余进入考试说明或诊断中心。
function handleSecondaryAction(): void {
  if (props.state === 'report') emit('navigate', mistakeNotebookPath.value)
  else if (props.state === 'active') emit('navigate', '/question-bank')
  else if (props.state === 'progress' || props.state === 'idle') emit('navigate', '/assessment')
  else if (props.currentExam) emit('navigate', `/exam-intro/${props.currentExam.toLowerCase()}`)
}

// 空闲状态卡片的快捷入口直接进入诊断测试中心，由该页面继续处理试卷选择。
function handleIdleDiagnosticLink(): void {
  emit('navigate', '/assessment')
}

// 固定入口只上报已有目标下的有效路径，no-goal 状态不会误入功能页。
function handleEntrySelection(entry: HomeEntry): void {
  if (entry.path) emit('navigate', entry.path)
}

// 状态面板的范围操作按当前任务进入最相关页面，目标管理仍由父级统一处理。
function handleScopeAction(): void {
  if (props.state === 'progress') emit('navigate', '/assessment')
  else if (props.state === 'report') emit('navigate', reportPath.value || '/assessment')
  else if (props.state === 'active') emit('navigate', '/question-bank')
  else if (props.state === 'new' && props.currentExam === 'TMUA') {
    emit('navigate', '/exam-intro/tmua')
  } else emit('manage-goals')
}

// 双备考提示只切换到另一项真实待办，由父级刷新对应考试上下文。
function handleOtherGoalSelection(): void {
  if (props.otherGoalSummary) emit('select-exam', props.otherGoalSummary.examType)
}

// 会员入口由首页容器负责读取价格、选择考试类型和回写支付结果。
function handleMembershipSelection(): void {
  emit('open-payment')
}

// 当前分屏集合始终按 PRD 的五屏顺序读取，用于定位器、滚动判定与键盘翻页。
function getScreenElements(): HTMLElement[] {
  return screenDefinitions
    .map((screen) => document.getElementById(screen.id))
    .filter((screen): screen is HTMLElement => Boolean(screen))
}

// 桌面宽高同时满足且未开启减弱动态效果时才启用整屏行为。
function isPagingEnabled(): boolean {
  return Boolean(
    desktopPagingMedia?.matches && !reducedMotionMedia?.matches && !props.loading && !props.error,
  )
}

// 视口模式变化时同步根节点标记；超高板块仍在自身范围内滚动后吸附到下一屏。
function updatePagingMode(): void {
  const pagingEnabled = isPagingEnabled()
  document.documentElement.classList.toggle('home-student-snap-enabled', pagingEnabled)
  scheduleActiveScreenUpdate()
}

// 当前屏以可见高度最大的板块为准，避免只根据滚动位置在边界处跳动。
function updateActiveScreen(): void {
  scrollFrame = 0
  const screens = getScreenElements()
  if (!screens.length) return
  const viewportTop =
    document.querySelector<HTMLElement>('.home-shell > .navbar')?.getBoundingClientRect().height ??
    72
  const viewportBottom = window.innerHeight
  let bestIndex = 0
  let bestVisibleHeight = -1
  screens.forEach((screen, index) => {
    const rect = screen.getBoundingClientRect()
    const visibleHeight = Math.max(
      0,
      Math.min(rect.bottom, viewportBottom) - Math.max(rect.top, viewportTop),
    )
    if (visibleHeight > bestVisibleHeight) {
      bestVisibleHeight = visibleHeight
      bestIndex = index
    }
  })
  activeScreenIndex.value = bestIndex
}

// 高频滚动事件合并到下一帧，避免定位器更新影响页面滚动。
function scheduleActiveScreenUpdate(): void {
  if (scrollFrame) return
  scrollFrame = window.requestAnimationFrame(updateActiveScreen)
}

// 定位器与键盘共用同一滚动入口，减弱动态效果下使用即时定位。
function scrollToScreen(index: number): void {
  const screens = getScreenElements()
  const targetIndex = Math.min(Math.max(index, 0), screens.length - 1)
  const target = screens[targetIndex]
  if (!target) return
  activeScreenIndex.value = targetIndex
  target.scrollIntoView({
    behavior: reducedMotionMedia?.matches ? 'auto' : 'smooth',
    block: 'start',
  })
}

// 翻页键只在桌面整屏模式生效，并避开输入控件、菜单与对话框的键盘交互。
function handlePagingKeydown(event: KeyboardEvent): void {
  if (
    !isPagingEnabled() ||
    event.defaultPrevented ||
    event.repeat ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey
  )
    return
  const target = event.target instanceof Element ? event.target : document.body
  if (
    target.closest(
      'input, textarea, select, [contenteditable="true"], [role="menu"], [role="dialog"]',
    ) ||
    document.body.classList.contains('home-dialog-open') ||
    document.documentElement.classList.contains('home-menu-open')
  )
    return

  const direction =
    event.key === 'PageDown' || event.key === 'ArrowDown'
      ? 1
      : event.key === 'PageUp' || event.key === 'ArrowUp'
        ? -1
        : 0
  if (!direction) return
  const now = window.performance.now()
  if (now - lastPagingKeyAt < 360) return
  lastPagingKeyAt = now
  event.preventDefault()
  scrollToScreen(activeScreenIndex.value + direction)
}

// 数据加载结束或考试状态切换后重新读取五屏位置，不沿用旧上下文的高亮点。
watch(
  () => [props.loading, props.error, props.state, props.currentExam],
  async () => {
    await nextTick()
    updatePagingMode()
  },
)

onMounted(() => {
  desktopPagingMedia = window.matchMedia('(min-width: 861px) and (min-height: 700px)')
  reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)')
  desktopPagingMedia.addEventListener('change', updatePagingMode)
  reducedMotionMedia.addEventListener('change', updatePagingMode)
  window.addEventListener('scroll', scheduleActiveScreenUpdate, { passive: true })
  window.addEventListener('resize', updatePagingMode, { passive: true })
  document.addEventListener('keydown', handlePagingKeydown)
  updatePagingMode()
})

onBeforeUnmount(() => {
  desktopPagingMedia?.removeEventListener('change', updatePagingMode)
  reducedMotionMedia?.removeEventListener('change', updatePagingMode)
  window.removeEventListener('scroll', scheduleActiveScreenUpdate)
  window.removeEventListener('resize', updatePagingMode)
  document.removeEventListener('keydown', handlePagingKeydown)
  document.documentElement.classList.remove('home-student-snap-enabled')
  if (scrollFrame) window.cancelAnimationFrame(scrollFrame)
})
</script>

<template>
  <main ref="studentRoot" class="home-student" aria-label="我的首页">
    <section v-if="loading" class="home-student-feedback" aria-live="polite" aria-busy="true">
      <span class="home-feedback-index">MY HOME</span>
      <h1>正在读取你的备考记录</h1>
      <p>诊断、练习、错题与会员状态都以服务端最新记录为准。</p>
      <div class="home-feedback-loader" aria-hidden="true"></div>
    </section>

    <section
      v-else-if="error"
      class="home-student-feedback home-student-feedback--error"
      role="alert"
    >
      <span class="home-feedback-index">LOAD FAILED</span>
      <h1>首页记录暂时无法载入</h1>
      <p>{{ error }}</p>
      <button class="home-btn home-btn--primary" type="button" @click="emit('retry')">
        重新加载
        <span aria-hidden="true">→</span>
      </button>
    </section>

    <template v-else>
      <section
        id="home-overview"
        class="home-snap-screen home-student-screen home-student-overview"
        :class="{ 'home-student-screen--current': activeScreenIndex === 0 }"
        aria-labelledby="home-student-title"
      >
        <div class="home-page home-student-overview-inner home-motion-content">
          <div class="home-student-hero">
            <div class="home-student-hero-copy">
              <p class="home-hello">欢迎回来，{{ username }}</p>
              <p class="home-hero-kicker">{{ heroContent.kicker }}</p>
              <h1 id="home-student-title">{{ heroContent.title }}</h1>
              <p class="home-student-hero-description">{{ heroContent.description }}</p>

              <div v-if="state === 'no-goal'" class="home-hero-actions home-goal-actions">
                <button
                  class="home-btn home-btn--primary"
                  type="button"
                  @click="emit('select-exam', 'ESAT')"
                >
                  选择 ESAT <span aria-hidden="true">→</span>
                </button>
                <button
                  class="home-btn home-btn--secondary"
                  type="button"
                  @click="emit('select-exam', 'TMUA')"
                >
                  选择 TMUA
                </button>
              </div>
              <div v-else class="home-hero-actions">
                <button
                  class="home-btn home-btn--primary"
                  type="button"
                  @click="handlePrimaryAction"
                >
                  {{ heroContent.primary }} <span aria-hidden="true">→</span>
                </button>
                <button
                  class="home-btn home-btn--secondary"
                  type="button"
                  @click="handleSecondaryAction"
                >
                  {{ heroContent.secondary }}
                </button>
              </div>

              <div v-if="otherGoalSummary" class="home-other-goal" role="status">
                <div>
                  <span>另一目标 · {{ otherGoalSummary.examType }}</span>
                  <strong>{{ otherGoalSummary.progress.paperTitle }}</strong>
                  <small>
                    已答 {{ otherGoalSummary.progress.answeredCount }}/{{
                      otherGoalSummary.progress.totalQuestions
                    }}
                    题， 还剩 {{ otherGoalSummary.progress.remainingCount }} 题
                  </small>
                </div>
                <button type="button" @click="handleOtherGoalSelection">
                  切换到 {{ otherGoalSummary.examType }} →
                </button>
              </div>
            </div>

            <aside class="home-context-panel" aria-label="当前备考状态">
              <div class="home-context-head">
                <span>{{ heroContent.scopeTitle }}</span>
                <b>{{ heroContent.scopeText }}</b>
              </div>
              <div class="home-context-signal home-context-signal--good">
                <span>已经准备好</span>
                <div class="home-context-signal-title-row">
                  <strong>{{ heroContent.goodTitle }}</strong>
                  <button
                    v-if="showIdleDiagnosticLink"
                    class="home-context-diagnostic-link"
                    type="button"
                    @click="handleIdleDiagnosticLink"
                  >
                    前往诊断测试
                    <el-icon aria-hidden="true"><ArrowRight /></el-icon>
                  </button>
                </div>
                <p>{{ heroContent.goodDetail }}</p>
              </div>
              <div class="home-context-signal home-context-signal--focus">
                <span>接下来</span>
                <strong>{{ heroContent.focusTitle }}</strong>
                <p>{{ heroContent.focusDetail }}</p>
              </div>
              <div class="home-context-scope">
                <button type="button" @click="handleScopeAction">
                  {{ heroContent.scopeAction }}
                </button>
              </div>
            </aside>
          </div>

          <div class="home-entry-grid" aria-label="备考功能入口">
            <button
              v-for="entry in homeEntries"
              :key="entry.index"
              class="home-entry"
              :class="{ 'home-entry--disabled': !entry.path }"
              :data-tone="entry.tone"
              type="button"
              :disabled="!entry.path"
              @click="handleEntrySelection(entry)"
            >
              <span class="home-entry-index">{{ entry.index }}</span>
              <strong>{{ entry.title }}</strong>
              <p>{{ entry.description }}</p>
              <span class="home-entry-action"
                >{{ entry.actionLabel }} <i aria-hidden="true">→</i></span
              >
              <span class="home-entry-mark" aria-hidden="true">{{ entry.mark }}</span>
            </button>
          </div>

          <section
            class="home-state-detail"
            :data-state="state"
            aria-labelledby="home-detail-title"
          >
            <template v-if="state === 'no-goal'">
              <div class="home-detail-title-row">
                <div>
                  <span class="home-detail-eyebrow">CURRENT GOAL</span>
                  <h2 id="home-detail-title">选择当前查看的备考目标</h2>
                </div>
                <p>选择不会限制以后备考另一项考试。</p>
              </div>
              <div class="home-goal-card-grid">
                <button class="home-goal-card" type="button" @click="emit('select-exam', 'ESAT')">
                  <span>ESAT</span>
                  <strong>按所选三科完成诊断</strong>
                  <p>Mathematics 1 必选，再选择另外两门科目；三科独立评分。</p>
                  <i>选择 ESAT →</i>
                </button>
                <button class="home-goal-card" type="button" @click="emit('select-exam', 'TMUA')">
                  <span>TMUA</span>
                  <strong>完成 Paper 1 与 Paper 2</strong>
                  <p>两卷记录分别保存，共同换算一个 TMUA 综合分。</p>
                  <i>选择 TMUA →</i>
                </button>
              </div>
            </template>

            <template v-else-if="state === 'progress' && progress">
              <div class="home-detail-title-row">
                <div>
                  <span class="home-detail-eyebrow">SAVED PROGRESS</span>
                  <h2 id="home-detail-title">这份诊断做到这里</h2>
                </div>
                <p>{{ progress.paperTitle }}</p>
              </div>
              <div class="home-progress-list">
                <div
                  v-for="row in progressRows"
                  :key="row.key"
                  class="home-progress-row"
                  :data-progress-state="row.state"
                >
                  <strong>{{ row.label }}</strong>
                  <span>{{ row.savedLabel }}</span>
                  <div class="home-progress-track" aria-hidden="true">
                    <i :style="{ width: `${row.percent}%` }"></i>
                  </div>
                  <b>{{ row.status }}</b>
                </div>
              </div>
              <div class="home-detail-note">
                <strong>不需要重新开始</strong>
                <span>已保存的答案、作答位置与用时会由测试页面从服务端记录恢复。</span>
              </div>
            </template>

            <template v-else-if="state === 'report'">
              <div class="home-detail-title-row">
                <div>
                  <span class="home-detail-eyebrow">LATEST REPORT</span>
                  <h2 id="home-detail-title">最近一次诊断</h2>
                </div>
                <p>{{ trendScores[0]?.paperTitle || '完整结果请进入诊断报告查看' }}</p>
              </div>
              <div class="home-report-detail-grid">
                <div class="home-score-list">
                  <article v-for="score in trendScores" :key="score.key" class="home-score-row">
                    <span>{{ score.label }}</span>
                    <strong>{{ formatScore(score.score) }}</strong>
                    <small
                      :data-trend="score.delta === null ? 'none' : score.delta >= 0 ? 'up' : 'down'"
                    >
                      {{ formatTrend(score) }}
                    </small>
                  </article>
                  <p v-if="!trendScores.length" class="home-score-empty">
                    首页未取得可展示的分数明细，请打开完整报告查看。
                  </p>
                  <p class="home-score-note">
                    {{
                      currentExam === 'ESAT'
                        ? 'ESAT 各科独立评分，不合计总分。'
                        : 'TMUA 正式结果使用 Paper 1 与 Paper 2 共同换算的综合分。'
                    }}
                  </p>
                </div>
                <article class="home-report-guide">
                  <span>报告里先看这里</span>
                  <strong>从本次真实结果决定下一步</strong>
                  <p>知识点、难度、单题用时与练习建议以该次完整报告为准，首页不补写缺失洞察。</p>
                  <button type="button" @click="handlePrimaryAction">打开完整报告 →</button>
                </article>
              </div>
            </template>

            <template v-else-if="state === 'active' && practice">
              <div class="home-detail-title-row">
                <div>
                  <span class="home-detail-eyebrow">CURRENT PRACTICE</span>
                  <h2 id="home-detail-title">继续当前练习记录</h2>
                </div>
                <p>{{ currentExam }} 专项练习</p>
              </div>
              <div class="home-practice-detail-grid">
                <div v-if="trendScores.length" class="home-score-list">
                  <article v-for="score in trendScores" :key="score.key" class="home-score-row">
                    <span>{{ score.label }}</span>
                    <strong>{{ formatScore(score.score) }}</strong>
                    <small>{{ formatTrend(score) }}</small>
                  </article>
                  <p class="home-score-note">
                    成绩仅作最近一次诊断概览；当前练习内容以活动练习记录为准。
                  </p>
                </div>
                <article class="home-current-practice">
                  <span>接着练这一项</span>
                  <strong>{{ currentExam }} · 进行中练习</strong>
                  <p>
                    已答 {{ practice.answeredCount }} / {{ practice.totalQuestions }} 题； 完成剩余
                    {{ Math.max(0, practice.totalQuestions - practice.answeredCount) }} 题并提交。
                  </p>
                  <div class="home-practice-meter" aria-hidden="true">
                    <i
                      :style="{
                        width: `${
                          practice.totalQuestions
                            ? Math.round((practice.answeredCount / practice.totalQuestions) * 100)
                            : 0
                        }%`,
                      }"
                    ></i>
                  </div>
                  <button type="button" @click="handlePrimaryAction">继续当前练习 →</button>
                </article>
              </div>
            </template>

            <template v-else-if="state === 'idle'">
              <div class="home-detail-title-row">
                <div>
                  <span class="home-detail-eyebrow">YOUR OWN PACE</span>
                  <h2 id="home-detail-title">当前没有必须完成的任务</h2>
                </div>
                <p>不展示空统计，也不替你安排固定天数。</p>
              </div>
              <div class="home-idle-options">
                <article>
                  <span>01</span><strong>重新诊断</strong>
                  <p>选择一套真实试卷，再次查看当前水平。</p>
                </article>
                <article>
                  <span>02</span><strong>选择知识点</strong>
                  <p>按当前考试、知识点与难度自主练习。</p>
                </article>
                <article>
                  <span>03</span><strong>回看错题</strong>
                  <p>从已经收录的真实错题继续复习。</p>
                </article>
              </div>
            </template>

            <template v-else>
              <div class="home-detail-title-row">
                <div>
                  <span class="home-detail-eyebrow">FIRST DIAGNOSTIC</span>
                  <h2 id="home-detail-title">第一次诊断怎么开始</h2>
                </div>
                <p>完成后，这里会换成你的真实记录。</p>
              </div>
              <div class="home-onboarding-steps">
                <article>
                  <span>01</span>
                  <strong>{{ currentExam === 'TMUA' ? '确认当前考试' : '确认三门科目' }}</strong>
                  <p>
                    {{
                      currentExam === 'TMUA'
                        ? '诊断保留 Paper 1 与 Paper 2 的完整结构。'
                        : subjectSummary
                    }}
                  </p>
                </article>
                <article>
                  <span>02</span>
                  <strong>完成测试</strong>
                  <p>答案会自动保存；中途退出后可从服务端记录继续。</p>
                </article>
                <article>
                  <span>03</span>
                  <strong>查看结果</strong>
                  <p>
                    {{
                      currentExam === 'TMUA'
                        ? '两卷共同换算综合分，并分别保留答题情况。'
                        : '各科独立评分，并查看知识点与用时。'
                    }}
                  </p>
                </article>
              </div>
              <div class="home-detail-note">
                <strong>完成后显示真实记录</strong>
                <span>首页不会用“测试 0 次”“错题 0 道”填充尚未发生的学习数据。</span>
              </div>
            </template>
          </section>
        </div>

        <button class="home-scroll-cue" type="button" @click="scrollToScreen(1)">
          <span>继续往下，看看诊断卷和练习题是怎么来的</span>
          <i aria-hidden="true">↓</i>
        </button>
      </section>

      <section
        id="home-source-screen"
        class="home-snap-screen home-student-screen home-story-screen home-source-screen"
        :class="{ 'home-student-screen--current': activeScreenIndex === 1 }"
        aria-labelledby="home-source-title"
      >
        <div class="home-page home-story-layout home-motion-content">
          <div class="home-story-copy">
            <div class="home-story-index">01 · {{ storyContent.sourceKicker }}</div>
            <h2 id="home-source-title">{{ storyContent.sourceTitle }}</h2>
            <p>{{ storyContent.sourceDescription }}</p>
            <ul class="home-story-points">
              <li v-for="point in storyContent.sourcePoints" :key="point">{{ point }}</li>
            </ul>
          </div>
          <div class="home-story-visual home-source-visual" aria-label="真题来源与整理方式">
            <template v-if="currentExam === 'ESAT'">
              <div class="home-source-origins">
                <article><strong>ENGAA</strong><span>工程类历史试题</span></article>
                <article><strong>NSAA</strong><span>科学类历史试题</span></article>
              </div>
              <div class="home-source-filter">
                <span>逐题筛选</span><b>现行 ESAT 考纲</b><small>来源、科目与范围逐题核对</small>
              </div>
              <div class="home-source-output">
                <span>当前备考科目</span><strong>{{ subjectSummary }}</strong>
              </div>
            </template>
            <template v-else-if="currentExam === 'TMUA'">
              <div class="home-paper-pair">
                <article>
                  <span>PAPER 1</span><strong>数学知识应用</strong><small>答题记录独立保存</small>
                </article>
                <i aria-hidden="true">＋</i>
                <article>
                  <span>PAPER 2</span><strong>数学推理</strong><small>答题记录独立保存</small>
                </article>
              </div>
              <div class="home-source-output">
                <span>完成两卷后</span><strong>共同生成一个 TMUA 综合结果</strong>
              </div>
            </template>
            <template v-else>
              <div class="home-source-origins home-source-origins--exams">
                <article><strong>ESAT</strong><span>按所选三科整理</span></article>
                <article><strong>TMUA</strong><span>保留 Paper 1 / 2</span></article>
              </div>
              <div class="home-source-filter">
                <span>记录隔离</span><b>诊断 · 练习 · 错题</b
                ><small>选择目标后只读取对应考试</small>
              </div>
            </template>
          </div>
        </div>
      </section>

      <section
        id="home-model-screen"
        class="home-snap-screen home-student-screen home-story-screen home-model-screen"
        :class="{ 'home-student-screen--current': activeScreenIndex === 2 }"
        aria-labelledby="home-model-title"
      >
        <div class="home-model-backdrop" aria-hidden="true">
          <div class="home-model-backdrop-track">
            <span class="home-model-backdrop-image home-model-backdrop-image--campus"></span>
            <span class="home-model-backdrop-image home-model-backdrop-image--chapel"></span>
            <span class="home-model-backdrop-image home-model-backdrop-image--campus"></span>
            <span class="home-model-backdrop-image home-model-backdrop-image--chapel"></span>
          </div>
        </div>
        <div class="home-page home-story-layout home-story-layout--reverse home-motion-content">
          <div class="home-story-copy">
            <div class="home-story-index">02 · 真题命题模型</div>
            <h2 id="home-model-title">
              <span
                v-for="titleLine in storyContent.modelTitleLines"
                :key="titleLine"
                class="home-story-title-line"
              >
                {{ titleLine }}
              </span>
            </h2>
            <p>{{ storyContent.modelDescription }}</p>
            <ul class="home-story-points">
              <li v-for="point in storyContent.modelPoints" :key="point">{{ point }}</li>
            </ul>
          </div>
          <div class="home-story-visual home-model-visual" aria-label="从真题到专项练习">
            <article>
              <span class="home-model-step">01</span>
              <el-icon class="home-model-stage-icon" aria-hidden="true">
                <DocumentChecked />
              </el-icon>
              <strong class="home-model-stage-title">真题拆解</strong>
              <span class="home-model-stage-subtitle">{{ storyContent.modelInput }}</span>
              <p>提取：知识点 · 题型 · 推理路径 · 难度</p>
            </article>
            <i class="home-flow-arrow" aria-hidden="true">→</i>
            <article class="home-model-stage--emphasis">
              <span class="home-model-step">02</span>
              <el-icon class="home-model-stage-icon" aria-hidden="true">
                <Connection />
              </el-icon>
              <strong class="home-model-stage-title">规律建模</strong>
              <span class="home-model-stage-subtitle">建立四维命题画像</span>
              <p>考点权重 · 任务类型 · 干扰项 · 难度梯度</p>
            </article>
            <i class="home-flow-arrow" aria-hidden="true">→</i>
            <article>
              <span class="home-model-step">03</span>
              <el-icon class="home-model-stage-icon" aria-hidden="true">
                <MagicStick />
              </el-icon>
              <strong class="home-model-stage-title">同源生成</strong>
              <span class="home-model-stage-subtitle">{{ storyContent.modelOutput }}</span>
              <p>按考纲、知识点与难度生成同路数新题</p>
            </article>
          </div>
        </div>
      </section>

      <section
        id="home-loop-screen"
        class="home-snap-screen home-student-screen home-story-screen home-loop-screen"
        :class="{ 'home-student-screen--current': activeScreenIndex === 3 }"
        aria-labelledby="home-loop-title"
      >
        <div class="home-page home-story-layout home-motion-content">
          <div class="home-story-copy">
            <div class="home-story-index">03 · 从诊断到练习</div>
            <h2 id="home-loop-title">{{ storyContent.loopTitle }}</h2>
            <p>{{ storyContent.loopDescription }}</p>
            <ul class="home-story-points">
              <li v-for="point in storyContent.loopPoints" :key="point">{{ point }}</li>
            </ul>
          </div>
          <div class="home-story-visual home-loop-visual" aria-label="诊断、练习和错题流程">
            <article>
              <span>01</span>
              <div>
                <small>真题诊断</small><strong>{{ storyContent.loopDiagnostic }}</strong>
              </div>
            </article>
            <article>
              <span>02</span>
              <div>
                <small>专项练习</small><strong>{{ storyContent.loopPractice }}</strong>
              </div>
            </article>
            <article>
              <span>03</span>
              <div><small>错题本</small><strong>保存真实错题、解析与知识点</strong></div>
            </article>
          </div>
        </div>
      </section>

      <section
        id="home-action-screen"
        class="home-snap-screen home-student-screen home-action-screen"
        :class="{ 'home-student-screen--current': activeScreenIndex === 4 }"
        aria-labelledby="home-action-title"
      >
        <div class="home-page home-action-layout home-motion-content">
          <div class="home-action-copy">
            <div class="home-action-kicker">回到现在最重要的一步</div>
            <h2 id="home-action-title">{{ heroContent.title }}</h2>
            <p>{{ heroContent.description }}</p>
            <div class="home-action-points">
              <span v-for="point in finalPoints" :key="point">{{ point }}</span>
            </div>
            <div v-if="state === 'no-goal'" class="home-action-buttons home-goal-actions">
              <button
                class="home-btn home-btn--light"
                type="button"
                @click="emit('select-exam', 'ESAT')"
              >
                选择 ESAT <span aria-hidden="true">→</span>
              </button>
              <button
                class="home-btn home-btn--outline-light"
                type="button"
                @click="emit('select-exam', 'TMUA')"
              >
                选择 TMUA
              </button>
            </div>
            <div v-else class="home-action-buttons">
              <button class="home-btn home-btn--light" type="button" @click="handlePrimaryAction">
                {{ heroContent.primary }} <span aria-hidden="true">→</span>
              </button>
              <button
                class="home-btn home-btn--outline-light"
                type="button"
                @click="scrollToScreen(0)"
              >
                回到我的首页
              </button>
            </div>
          </div>

          <aside class="home-access-card" aria-label="当前账户权益">
            <div class="home-access-card-top">
              <span>{{ accessContent.badge }}</span>
              <small>{{ examLabel }}</small>
            </div>
            <strong>{{ accessContent.title }}</strong>
            <div class="home-access-benefits">
              <span v-for="point in accessContent.points" :key="point">{{ point }}</span>
            </div>
            <p>{{ accessContent.note }}</p>
            <button
              v-if="currentExam && !memberStatus?.isMember"
              class="home-access-action"
              type="button"
              @click="handleMembershipSelection"
            >
              查看当前考试会员权益 →
            </button>
          </aside>
        </div>

        <footer class="home-student-footer">
          <div class="home-page home-student-footer-inner">
            <span>云舟备考 · ESAT &amp; TMUA 模考系统</span>
            <span>当前考试、测试进度和报告状态始终来自真实记录。</span>
          </div>
        </footer>
      </section>

      <nav class="home-screen-indicator" aria-label="首页分屏定位">
        <button
          v-for="(screen, index) in screenDefinitions"
          :key="screen.id"
          type="button"
          :aria-label="screen.label"
          :aria-current="activeScreenIndex === index ? 'step' : undefined"
          @click="scrollToScreen(index)"
        >
          <span>{{ screen.label }}</span>
        </button>
      </nav>
    </template>
  </main>
</template>
