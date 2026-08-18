// 诊断报告后台任务：持久化分析阶段，并为每次已提交测试独立生成正式报告。
import { Prisma } from '@prisma/client'
import { prisma } from './prisma.js'
import { config } from '../config.js'
import { parseJsonArray, parseJsonObject } from '../utils/jsonField.js'
import { orderQuestionsByModule } from '../utils/questionOrder.js'
import { logRuntimeError } from '../utils/runtimeLogger.js'
import {
  DIAGNOSTIC_REPORT_GENERATION_MODE,
  DIAGNOSTIC_REPORT_TASK_STAGE,
  DIAGNOSTIC_REPORT_TASK_STATUS,
  EXAM_RECORD_STATUS,
  EXAM_TYPE,
  isRealPaperType,
} from '../constants/domain.js'
import {
  canUpgradeDiagnosticReport,
  promptVersionForExam,
  reportVersionForExam,
} from '../constants/diagnosticReport.js'
import {
  buildDiagnosticReportSummary,
  type DiagnosticBuildStage,
  type DiagnosticReportSummary,
  type LearnerProfileInput,
} from './diagnosticReport.js'

const POLL_INTERVAL_MS = 2_000
const STALE_TASK_MS = 5 * 60_000
const MAX_AUTOMATIC_RETRIES = 1

let workerRunning = false
let workerTimer: NodeJS.Timeout | null = null

interface StoredLearningAnalysis extends Record<string, unknown> {
  exam_focus?: unknown
  review_guidance?: unknown
  common_error_causes?: unknown
}

type TaskStage = (typeof DIAGNOSTIC_REPORT_TASK_STAGE)[keyof typeof DIAGNOSTIC_REPORT_TASK_STAGE]

const STAGE_PROGRESS: Record<TaskStage, number> = {
  answers_saved: 10,
  fixed_calculating: 25,
  module_analyzing: 48,
  roi_analyzing: 68,
  path_analyzing: 82,
  report_saving: 96,
  completed: 100,
}

// 题库内已有的受控学习分析只提取报告可安全引用的字段，完整解答不进入诊断模型输入。
function learningAnalysisForReport(rawMeta: unknown): {
  examFocus: string | null
  reviewGuidance: string[]
  commonErrorCauses: string[]
} | undefined {
  const meta = parseJsonObject(rawMeta)
  const analysis = parseJsonObject<StoredLearningAnalysis>(meta.learning_analysis)
  const examFocus = typeof analysis.exam_focus === 'string' ? analysis.exam_focus.trim() : ''
  const reviewGuidance = typeof analysis.review_guidance === 'string'
    ? analysis.review_guidance
        .split(/\r?\n/)
        .map((item) => item.replace(/^复习建议[:：]?\s*/, '').replace(/^\d+[.、]\s*/, '').trim())
        .filter(Boolean)
    : []
  const commonErrorCauses = Array.isArray(analysis.common_error_causes)
    ? analysis.common_error_causes
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
    : []
  if (!examFocus && !reviewGuidance.length && !commonErrorCauses.length) return undefined
  return {
    examFocus: examFocus || null,
    reviewGuidance: reviewGuidance.slice(0, 3),
    commonErrorCauses: commonErrorCauses.slice(0, 3),
  }
}

// 院校、专业、考试时间和每周投入属于账户级信息；科目仍优先读取当前考试配置。
function learnerProfileForExam(raw: unknown, examType: string): LearnerProfileInput {
  const preferences = parseJsonArray<Record<string, unknown>>(raw)
  const examPreference = preferences.find(
    (item) => String(item.examType || '').toUpperCase() === examType.toUpperCase(),
  )
  const orderedPreferences = examPreference
    ? [examPreference, ...preferences.filter((item) => item !== examPreference)]
    : preferences
  const firstCommonValue = <T>(selector: (item: Record<string, unknown>) => T | undefined): T | undefined => (
    orderedPreferences.map(selector).find((value) => value !== undefined)
  )
  const weeklyHoursValue = Number(firstCommonValue((item) => item.weeklyHours))
  const savedExamDate = firstCommonValue((item) => (
    typeof item.examDate === 'string' ? item.examDate : undefined
  ))
  const examDateValue = typeof savedExamDate === 'string'
    ? savedExamDate.trim()
    : ''
  const savedTargetUniversities = firstCommonValue((item) => (
    Array.isArray(item.targetUniversities) || typeof item.targetUniversity === 'string'
      ? item.targetUniversities ?? item.targetUniversity
      : undefined
  ))
  const targetUniversities = Array.isArray(savedTargetUniversities)
    ? savedTargetUniversities.filter(
        (item): item is string => typeof item === 'string' && Boolean(item.trim()),
      )
    : typeof savedTargetUniversities === 'string' && savedTargetUniversities.trim()
      ? [savedTargetUniversities.trim()]
      : []
  const savedTargetMajor = firstCommonValue((item) => (
    typeof item.targetMajor === 'string' ? item.targetMajor : undefined
  ))

  return {
    subjects: Array.isArray(examPreference?.subjects)
      ? examPreference.subjects.filter(
          (item): item is string => typeof item === 'string' && Boolean(item.trim()),
        )
      : [],
    targetUniversities,
    targetMajor: typeof savedTargetMajor === 'string' && savedTargetMajor.trim()
      ? savedTargetMajor.trim()
      : null,
    examDate: /^\d{4}-\d{2}(?:-\d{2})?$/.test(examDateValue) ? examDateValue : null,
    weeklyHours: Number.isFinite(weeklyHoursValue) && weeklyHoursValue >= 1 && weeklyHoursValue <= 80
      ? weeklyHoursValue
      : null,
  }
}

function reportKindForExam(examType: string): 'esat' | 'tmua' | 'step' {
  if (examType === EXAM_TYPE.ESAT) return 'esat'
  if (examType === EXAM_TYPE.TMUA) return 'tmua'
  return 'step'
}

// 报告质量与生命周期分开记录，模型降级不会把一份可用报告误标为失败。
function generationModeForReport(report: DiagnosticReportSummary): string {
  const sources: Array<'deepseek' | 'mixed' | 'fallback'> = []
  for (const module of report.assessment.modules) {
    if (module.diagnosticAnalysis?.source) sources.push(module.diagnosticAnalysis.source)
    if (module.positioning?.analysisSource) sources.push(module.positioning.analysisSource)
  }
  for (const gap of report.aiImprovementPlan?.highRoiGaps || []) sources.push(gap.analysisSource)
  if (report.learningPath?.summary.analysisSource) sources.push(report.learningPath.summary.analysisSource)

  if (!sources.length || sources.every((source) => source === 'fallback')) {
    return DIAGNOSTIC_REPORT_GENERATION_MODE.RULES_ONLY
  }
  if (sources.every((source) => source === 'deepseek')) {
    return DIAGNOSTIC_REPORT_GENERATION_MODE.FULL_AI
  }
  return DIAGNOSTIC_REPORT_GENERATION_MODE.MIXED_FALLBACK
}

async function updateTaskStage(taskId: string, stage: TaskStage): Promise<void> {
  await prisma.diagnosticReportTask.updateMany({
    where: { id: taskId, status: DIAGNOSTIC_REPORT_TASK_STATUS.ANALYZING },
    data: {
      stage,
      progress: STAGE_PROGRESS[stage],
      heartbeatAt: new Date(),
    },
  })
}

function mapBuildStage(stage: DiagnosticBuildStage): TaskStage {
  if (stage === 'roi_analyzing') return DIAGNOSTIC_REPORT_TASK_STAGE.ROI_ANALYZING
  if (stage === 'path_analyzing') return DIAGNOSTIC_REPORT_TASK_STAGE.PATH_ANALYZING
  return DIAGNOSTIC_REPORT_TASK_STAGE.MODULE_ANALYZING
}

async function buildReportForTask(taskId: string, examRecordId: string): Promise<{
  report: DiagnosticReportSummary
  sourceSnapshot: Prisma.InputJsonObject
  generationMode: string
}> {
  await updateTaskStage(taskId, DIAGNOSTIC_REPORT_TASK_STAGE.FIXED_CALCULATING)

  const examRecord = await prisma.examRecord.findUnique({
    where: { id: examRecordId },
    include: {
      paper: true,
      answers: true,
      user: { select: { examPreferences: true } },
    },
  })
  if (!examRecord) throw new Error('Exam record not found')
  if (!isRealPaperType(examRecord.paper.paperType)) throw new Error('Only real papers support diagnostic reports')
  if (examRecord.status !== EXAM_RECORD_STATUS.SUBMITTED || !examRecord.submittedAt) {
    throw new Error('Diagnostic report requires a submitted exam')
  }

  const [unorderedQuestionRows, syllabusNodes] = await Promise.all([
    prisma.question.findMany({
      where: { id: { in: examRecord.answers.map((answer) => answer.questionId) } },
      select: {
        id: true,
        number: true,
        moduleCode: true,
        moduleOrder: true,
        moduleQuestionNumber: true,
        subject: true,
        subjectCode: true,
        topic: true,
        topicCode: true,
        knowledgePoints: true,
        difficulty: true,
        meta: true,
      },
    }),
    prisma.syllabusNode.findMany({
      where: { examType: examRecord.examType },
      orderBy: { order: 'asc' },
      select: { code: true, label: true },
    }),
  ])
  const questionRows = orderQuestionsByModule(unorderedQuestionRows)
  if (!questionRows.length) throw new Error('Diagnostic paper has no official questions')

  const answerMap = new Map(examRecord.answers.map((answer) => [answer.questionId, answer]))
  const learnerProfile = learnerProfileForExam(examRecord.user.examPreferences, examRecord.examType)
  const questions = questionRows.map((question, index) => ({
    number: question.number ?? index + 1,
    subject: question.subject,
    subjectCode: question.subjectCode,
    moduleCode: question.moduleCode,
    moduleOrder: question.moduleOrder,
    moduleQuestionNumber: question.moduleQuestionNumber,
    topic: question.topic,
    topicCode: question.topicCode,
    knowledgePoints: parseJsonArray<{ code: string; label: string; role?: string }>(question.knowledgePoints),
    difficulty: question.difficulty,
    isCorrect: answerMap.get(question.id)?.isCorrect ?? false,
    isAnswered: Boolean(answerMap.get(question.id)?.selectedAnswer?.trim()),
    answerState: answerMap.get(question.id)?.answerState as 'unseen' | 'skipped' | 'answered' | undefined,
    durationSeconds: answerMap.get(question.id)?.durationSeconds ?? null,
    learningAnalysis: learningAnalysisForReport(question.meta),
  }))

  const report = await buildDiagnosticReportSummary({
    examType: examRecord.examType,
    paper: {
      title: examRecord.paper.title,
      code: examRecord.paper.code,
      year: examRecord.paper.year,
      duration: examRecord.paper.duration,
    },
    questions,
    elapsedDurationSeconds: examRecord.durationSeconds,
    syllabusNodes,
    learnerProfile,
    onStage: async (stage) => updateTaskStage(taskId, mapBuildStage(stage)),
  })

  return {
    report,
    sourceSnapshot: {
      examRecordId: examRecord.id,
      submittedAt: examRecord.submittedAt.toISOString(),
      paperId: examRecord.paperId,
      examType: examRecord.examType,
      questionCount: questionRows.length,
      questionIds: questionRows.map((question) => question.id),
      skippedQuestionCount: questions.filter((question) => question.answerState === 'skipped').length,
      unseenQuestionCount: questions.filter((question) => question.answerState === 'unseen').length,
      learnerProfile: learnerProfile as unknown as Prisma.InputJsonObject,
    },
    generationMode: generationModeForReport(report),
  }
}

async function publishTaskResult(taskId: string, examRecordId: string): Promise<void> {
  const built = await buildReportForTask(taskId, examRecordId)
  await updateTaskStage(taskId, DIAGNOSTIC_REPORT_TASK_STAGE.REPORT_SAVING)
  const now = new Date()

  await prisma.$transaction(async (tx) => {
    const task = await tx.diagnosticReportTask.findUnique({ where: { id: taskId } })
    if (!task) throw new Error('Diagnostic report task not found')
    const reportVersion = task.reportVersion || reportVersionForExam(task.reportKind.toUpperCase())
    const promptVersion = task.promptVersion || promptVersionForExam(task.reportKind.toUpperCase())

    // 每次正式交卷独立持久化一份报告；重测报告不得覆盖同一试卷的其他历史报告。
    await tx.diagnosticReport.upsert({
      where: { examRecordId: task.examRecordId },
      update: {
        reportKind: task.reportKind,
        result: built.report as unknown as Prisma.InputJsonValue,
        sourceSnapshot: built.sourceSnapshot,
        reportVersion,
        promptVersion,
        modelName: config.deepseekModel,
        generationMode: built.generationMode,
        completedAt: now,
      },
      create: {
        userId: task.userId,
        paperId: task.paperId,
        examRecordId: task.examRecordId,
        reportKind: task.reportKind,
        result: built.report as unknown as Prisma.InputJsonValue,
        sourceSnapshot: built.sourceSnapshot,
        reportVersion,
        promptVersion,
        modelName: config.deepseekModel,
        generationMode: built.generationMode,
        completedAt: now,
      },
    })

    await tx.diagnosticReportTask.update({
      where: { id: task.id },
      data: {
        status: DIAGNOSTIC_REPORT_TASK_STATUS.COMPLETED,
        stage: DIAGNOSTIC_REPORT_TASK_STAGE.COMPLETED,
        progress: 100,
        result: built.report as unknown as Prisma.InputJsonValue,
        generationMode: built.generationMode,
        reportVersion,
        promptVersion,
        modelName: config.deepseekModel,
        heartbeatAt: now,
        completedAt: now,
        errorCode: null,
        errorMessage: null,
      },
    })
  })
}

async function failOrRetryTask(taskId: string, error: unknown): Promise<void> {
  const task = await prisma.diagnosticReportTask.findUnique({ where: { id: taskId } })
  if (!task) return
  const message = error instanceof Error ? error.message : 'Diagnostic report generation failed'
  const shouldRetry = task.retryCount < MAX_AUTOMATIC_RETRIES

  await prisma.diagnosticReportTask.update({
    where: { id: task.id },
    data: shouldRetry
      ? {
          status: DIAGNOSTIC_REPORT_TASK_STATUS.PENDING,
          stage: DIAGNOSTIC_REPORT_TASK_STAGE.ANSWERS_SAVED,
          progress: 10,
          retryCount: { increment: 1 },
          errorCode: 'GENERATION_RETRY',
          errorMessage: message,
          lockedAt: null,
          heartbeatAt: null,
        }
      : {
          status: DIAGNOSTIC_REPORT_TASK_STATUS.FAILED,
          errorCode: 'GENERATION_FAILED',
          errorMessage: message,
          heartbeatAt: new Date(),
        },
  })
  console.error('[diagnostic-report-task] generation failed', { taskId, shouldRetry, error })
}

async function processPendingTasks(): Promise<void> {
  if (workerRunning) return
  workerRunning = true
  try {
    while (true) {
      const task = await prisma.diagnosticReportTask.findFirst({
        where: { status: DIAGNOSTIC_REPORT_TASK_STATUS.PENDING },
        orderBy: { createdAt: 'asc' },
      })
      if (!task) break

      const now = new Date()
      const claim = await prisma.diagnosticReportTask.updateMany({
        where: { id: task.id, status: DIAGNOSTIC_REPORT_TASK_STATUS.PENDING },
        data: {
          status: DIAGNOSTIC_REPORT_TASK_STATUS.ANALYZING,
          stage: DIAGNOSTIC_REPORT_TASK_STAGE.FIXED_CALCULATING,
          progress: STAGE_PROGRESS.fixed_calculating,
          lockedAt: now,
          heartbeatAt: now,
          startedAt: now,
          errorCode: null,
          errorMessage: null,
        },
      })
      if (!claim.count) continue

      try {
        await publishTaskResult(task.id, task.examRecordId)
      } catch (error) {
        await failOrRetryTask(task.id, error)
      }
    }
  } finally {
    workerRunning = false
  }
}

// 新任务提交后立即唤醒执行器，定时轮询只作为进程恢复和漏唤醒保障。
export function scheduleDiagnosticReportWorker(): void {
  queueMicrotask(() => {
    void processPendingTasks().catch((error) => {
      logRuntimeError('diagnostic_report.worker_wakeup_failed', error)
    })
  })
}

export async function ensureDiagnosticReportTask(examRecordId: string, userId: string): Promise<{
  id: string
  status: string
}> {
  const examRecord = await prisma.examRecord.findFirst({
    where: { id: examRecordId, userId },
    include: { paper: { select: { paperType: true } } },
  })
  if (!examRecord) throw new Error('Exam record not found')
  if (!isRealPaperType(examRecord.paper.paperType)) throw new Error('Only real papers support diagnostic reports')
  if (examRecord.status !== EXAM_RECORD_STATUS.SUBMITTED || !examRecord.submittedAt) {
    throw new Error('Diagnostic report requires a submitted exam')
  }

  const task = await prisma.diagnosticReportTask.upsert({
    where: { examRecordId },
    update: {},
    create: {
      examRecordId,
      userId,
      paperId: examRecord.paperId,
      reportKind: reportKindForExam(examRecord.examType),
      reportVersion: reportVersionForExam(examRecord.examType),
      promptVersion: promptVersionForExam(examRecord.examType),
      modelName: config.deepseekModel,
    },
    select: { id: true, status: true },
  })
  if (task.status === DIAGNOSTIC_REPORT_TASK_STATUS.PENDING) scheduleDiagnosticReportWorker()
  return task
}

export async function retryDiagnosticReportTask(examRecordId: string, userId: string): Promise<void> {
  await ensureDiagnosticReportTask(examRecordId, userId)
  const task = await prisma.diagnosticReportTask.findUnique({ where: { examRecordId } })
  if (!task) throw new Error('Diagnostic report task not found')
  if (task.status !== DIAGNOSTIC_REPORT_TASK_STATUS.FAILED) return

  await prisma.diagnosticReportTask.update({
    where: { id: task.id },
    data: {
      status: DIAGNOSTIC_REPORT_TASK_STATUS.PENDING,
      stage: DIAGNOSTIC_REPORT_TASK_STAGE.ANSWERS_SAVED,
      progress: 10,
      reportVersion: reportVersionForExam(task.reportKind.toUpperCase()),
      promptVersion: promptVersionForExam(task.reportKind.toUpperCase()),
      modelName: config.deepseekModel,
      retryCount: { increment: 1 },
      errorCode: null,
      errorMessage: null,
      lockedAt: null,
      heartbeatAt: null,
      startedAt: null,
      completedAt: null,
    },
  })
  scheduleDiagnosticReportWorker()
}

// 已完成报告可按当前版本重新生成；旧报告在新快照成功保存前继续可读，避免升级失败造成数据丢失。
export async function regenerateDiagnosticReportTask(examRecordId: string, userId: string): Promise<void> {
  await ensureDiagnosticReportTask(examRecordId, userId)
  const [task, report] = await Promise.all([
    prisma.diagnosticReportTask.findUnique({ where: { examRecordId } }),
    prisma.diagnosticReport.findUnique({
      where: { examRecordId },
      select: { reportKind: true, reportVersion: true },
    }),
  ])
  if (!task) throw new Error('Diagnostic report task not found')
  if (report && !canUpgradeDiagnosticReport(report.reportKind, report.reportVersion)) return
  if (
    task.status === DIAGNOSTIC_REPORT_TASK_STATUS.PENDING
    || task.status === DIAGNOSTIC_REPORT_TASK_STATUS.ANALYZING
  ) return

  await prisma.diagnosticReportTask.update({
    where: { id: task.id },
    data: {
      status: DIAGNOSTIC_REPORT_TASK_STATUS.PENDING,
      stage: DIAGNOSTIC_REPORT_TASK_STAGE.ANSWERS_SAVED,
      progress: 10,
      reportVersion: reportVersionForExam(task.reportKind.toUpperCase()),
      promptVersion: promptVersionForExam(task.reportKind.toUpperCase()),
      modelName: config.deepseekModel,
      retryCount: { increment: 1 },
      errorCode: null,
      errorMessage: null,
      lockedAt: null,
      heartbeatAt: null,
      startedAt: null,
      completedAt: null,
    },
  })
  scheduleDiagnosticReportWorker()
}

async function recoverStaleTasks(): Promise<void> {
  const staleBefore = new Date(Date.now() - STALE_TASK_MS)
  await prisma.diagnosticReportTask.updateMany({
    where: {
      status: DIAGNOSTIC_REPORT_TASK_STATUS.ANALYZING,
      OR: [
        { heartbeatAt: { lt: staleBefore } },
        { heartbeatAt: null, updatedAt: { lt: staleBefore } },
      ],
    },
    data: {
      status: DIAGNOSTIC_REPORT_TASK_STATUS.PENDING,
      stage: DIAGNOSTIC_REPORT_TASK_STAGE.ANSWERS_SAVED,
      progress: 10,
      lockedAt: null,
      heartbeatAt: null,
      errorCode: 'WORKER_RECOVERED',
      errorMessage: 'Recovered after worker interruption.',
    },
  })
}

// API 启动后恢复失去心跳的任务，并周期性领取数据库中的待分析记录。
export async function startDiagnosticReportWorker(): Promise<void> {
  await recoverStaleTasks()

  if (!workerTimer) {
    workerTimer = setInterval(() => {
      void recoverStaleTasks()
        .then(() => processPendingTasks())
        .catch((error) => console.error('[diagnostic-report-task] polling failed:', error))
    }, POLL_INTERVAL_MS)
    workerTimer.unref()
  }
  scheduleDiagnosticReportWorker()
}
