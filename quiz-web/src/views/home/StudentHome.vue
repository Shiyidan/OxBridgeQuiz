<!-- 登录后首页首屏：仅用学生真实记录驱动当前任务，后续内容由公开首页模块统一承接。 -->
<script setup lang="ts">
import { computed } from 'vue'
import type { ActiveQuestionBankPractice } from '@/api/exam'
import type { AssessmentPaperItem } from '@/api/papers'
import type { ActiveExamType } from '@/stores/auth'
import type {
  HomeDashboardGoal,
  HomeDashboardReportSignal,
  HomeDashboardState,
  HomeDiagnosticProgress,
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
  reportSignal?: HomeDashboardReportSignal | null
}

interface HeroContent {
  kicker: string
  title: string
  description?: string
  primary: string
  secondary?: string
  goodTitle: string
  goodDetail: string
  focusTitle: string
  focusDetail: string
  scopeTitle: string
  scopeText: string
  scopeAction?: string
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
  reportSignal: null,
})

const emit = defineEmits<{
  navigate: [path: string]
  'select-exam': [exam: ActiveExamType]
  retry: []
  'manage-goals': []
}>()

// 考试名称在未选择目标时保持中性，避免从缓存或历史记录猜测当前考试。
const examLabel = computed(() => props.currentExam ?? 'ESAT / TMUA')

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
    return {
      kicker: `${props.progress.answeredCount} / ${props.progress.totalQuestions} 道题的进度已保存，目前还剩 ${props.progress.remainingCount} 道题。`,
      title: `继续完成 ${props.progress.paperTitle}`,
      primary: `继续 ${props.progress.paperTitle}`,
      goodTitle: props.progress.totalModuleCount
        ? `${props.progress.completedModuleCount} / ${props.progress.totalModuleCount} 个模块已完成`
        : `${props.progress.answeredCount} 道题已保存`,
      goodDetail: '已保存的答案和作答位置无需重新开始。',
      focusTitle: `${props.progress.remainingCount} 道题待完成`,
      focusDetail: '全部完成并提交后，系统才会生成本次诊断报告。',
      scopeTitle: '当前诊断',
      scopeText: props.progress.paperTitle,
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

// 三个固定入口展示真实进度；已确认的零值明确展示，接口缺失时才使用中性占位。
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
          mark: props.mistakeTotal === null ? '…' : '0',
          tone: 'default',
          path: mistakeNotebookPath.value,
        }

  return [diagnosticEntry, practiceEntry, mistakeEntry]
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

// 移动端首页不直接恢复答题会话，只把继续入口落到对应业务模块首页。
function resolveHomeNavigationPath(path: string): string {
  const isMobileViewport =
    window.matchMedia('(max-width: 780px)').matches || window.screen.width <= 780
  if (!isMobileViewport) return path
  if (path.startsWith('/assessment/exam/')) return '/assessment'
  if (path.startsWith('/practice?')) return '/question-bank'
  return path
}

// 主行动按状态进入真实功能页；未选择目标时由两个显式选择按钮单独处理。
function handlePrimaryAction(): void {
  if (props.state === 'progress') {
    emit('navigate', resolveHomeNavigationPath(diagnosticResumePath.value))
  } else if (props.state === 'report') emit('navigate', reportPath.value || '/assessment')
  else if (props.state === 'active') {
    emit('navigate', resolveHomeNavigationPath(practiceResumePath.value))
  }
  else if (props.state === 'idle') emit('navigate', '/question-bank')
  else emit('navigate', '/assessment')
}

// 次行动保持状态语义：报告看错题、练习回题库，其余进入考试说明或诊断中心。
function handleSecondaryAction(): void {
  if (props.state === 'report') emit('navigate', mistakeNotebookPath.value)
  else if (props.state === 'active') emit('navigate', '/question-bank')
  else if (props.state === 'idle') emit('navigate', '/assessment')
  else if (props.currentExam) emit('navigate', `/exam-intro/${props.currentExam.toLowerCase()}`)
}

// 固定入口只上报已有目标下的有效路径，no-goal 状态不会误入功能页。
function handleEntrySelection(entry: HomeEntry): void {
  if (entry.path) emit('navigate', resolveHomeNavigationPath(entry.path))
}

// 状态面板的范围操作按当前任务进入最相关页面，目标管理仍由父级统一处理。
function handleScopeAction(): void {
  if (props.state === 'report') emit('navigate', reportPath.value || '/assessment')
  else if (props.state === 'active') emit('navigate', '/question-bank')
  else if (props.state === 'new' && props.currentExam === 'TMUA') {
    emit('navigate', '/exam-intro/tmua')
  } else emit('manage-goals')
}

// 进行中诊断的目标调整统一进入个人中心，避免首页直接切换考试打断当前进度语义。
function handleGoalSettingsNavigation(): void {
  emit('navigate', '/profile')
}

// 登录态首屏向下入口定位到公共首页首个内容模块，并遵循系统的减弱动态效果设置。
function scrollToSharedContent(): void {
  document.getElementById('home-question-model')?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start',
  })
}
</script>

<template>
  <div class="home-student">
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
        class="home-snap-screen home-student-screen home-student-overview home-student-screen--current"
        aria-labelledby="home-student-title"
      >
        <div class="home-page home-student-overview-inner home-motion-content">
          <div class="home-student-hero">
            <div class="home-student-hero-copy">
              <p class="home-hello">欢迎回来，{{ username }}</p>
              <p class="home-hero-kicker">{{ heroContent.kicker }}</p>
              <h1 id="home-student-title">{{ heroContent.title }}</h1>
              <p v-if="heroContent.description" class="home-student-hero-description">
                {{ heroContent.description }}
              </p>

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
                  v-if="state !== 'progress' && heroContent.secondary"
                  class="home-btn home-btn--secondary"
                  type="button"
                  @click="handleSecondaryAction"
                >
                  {{ heroContent.secondary }}
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
                <strong>{{ heroContent.goodTitle }}</strong>
                <p>{{ heroContent.goodDetail }}</p>
              </div>
              <div class="home-context-signal home-context-signal--focus">
                <span>接下来</span>
                <strong>{{ heroContent.focusTitle }}</strong>
                <p>{{ heroContent.focusDetail }}</p>
              </div>
              <div v-if="heroContent.scopeAction" class="home-context-scope">
                <button type="button" @click="handleScopeAction">
                  {{ heroContent.scopeAction }}
                </button>
              </div>
              <div v-if="state === 'progress'" class="home-context-goal-link">
                <button type="button" @click="handleGoalSettingsNavigation">
                  调整备考目标 <span aria-hidden="true">→</span>
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
            v-if="state !== 'progress' && state !== 'new' && state !== 'idle'"
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

          </section>
        </div>
      </section>
    </template>
  </div>
</template>
