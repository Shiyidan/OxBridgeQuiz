// 诊断报告后台任务：持久化分析阶段，并为每次已提交测试独立生成正式报告。
import { solutionToLearningAnalysis } from '../utils/questionDocument.js'
import { Prisma } from '@prisma/client'
import { prisma } from './prisma.js'
import { diagnosticHistoryQuestionFields, parseDiagnosticHistorySnapshot } from '../utils/diagnosticHistorySnapshot.js'
import { config } from '../config.js'
import { parseJsonArray, parseJsonObject } from '../utils/jsonField.js'
import { orderQuestionsByModule } from '../utils/questionOrder.js'
import { logRuntimeError } from '../utils/runtimeLogger.js'
import { formatSyllabusLabel } from '../utils/syllabusLabels.js'
import {
  DIAGNOSTIC_ASSEMBLY,
  DIAGNOSTIC_REPORT_GENERATION_MODE,
  DIAGNOSTIC_REPORT_TASK_STAGE,
  DIAGNOSTIC_REPORT_TASK_STATUS,
  EXAM_RECORD_STATUS,
  EXAM_TYPE,
  isMockPaperType,
  supportsDiagnosticReport,
} from '../constants/domain.js'
import {
  canUpgradeDiagnosticReport,
  promptVersionForExam,
  reportVersionForExam,
} from '../constants/diagnosticReport.js'
import { parseModuleExamSnapshot } from './moduleExamSession.js'
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

// 单项模考只保留客观成绩与错题记录，不进入依赖完整考试结构的诊断报告流程。
export function supportsAttemptDiagnosticReport(
  paperType: string,
  structureSnapshot: unknown,
): boolean {
  return supportsDiagnosticReport(paperType)
    && parseModuleExamSnapshot(structureSnapshot)?.mockExamMode !== 'single'
}

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
function learningAnalysisForReport(rawSolution: unknown): {
  examFocus: string | null
  reviewGuidance: string[]
  commonErrorCauses: string[]
} | undefined {
  const analysis = solutionToLearningAnalysis(rawSolution) as StoredLearningAnalysis
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
  // 账户级目标优先沿用当前考试配置，缺失时才从其他考试配置补齐。
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

// 将答卷考试类型映射为持久化的报告类别，供任务版本选择使用。
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

// 仅推进仍在分析的任务，并同步进度和心跳，避免覆盖已完成或失败状态。
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

// 将报告构建器的内部阶段映射为任务进度，供前端轮询统一展示。
function mapBuildStage(stage: DiagnosticBuildStage): TaskStage {
  if (stage === 'roi_analyzing') return DIAGNOSTIC_REPORT_TASK_STAGE.ROI_ANALYZING
  if (stage === 'path_analyzing') return DIAGNOSTIC_REPORT_TASK_STAGE.PATH_ANALYZING
  return DIAGNOSTIC_REPORT_TASK_STAGE.MODULE_ANALYZING
}

// 按已交卷记录的冻结模块与当前官方题目构建分析输入，同时保存可追溯的报告来源快照。
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
  if (!supportsAttemptDiagnosticReport(
    examRecord.paper.paperType,
    examRecord.structureSnapshot,
  )) {
    throw new Error('This exam record does not support diagnostic reports')
  }
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
        solution: true,
      },
    }),
    prisma.syllabusNode.findMany({
      where: { examType: examRecord.examType },
      orderBy: { order: 'asc' },
      select: { code: true, enLabel: true, cnLabel: true },
    }),
  ])
  const storedPositionsAreComplete = examRecord.answers.every((answer) =>
    Number.isInteger(answer.position),
  ) && new Set(examRecord.answers.map((answer) => answer.position)).size === examRecord.answers.length
  const questionMap = new Map(unorderedQuestionRows.map((question) => [question.id, question]))
  const questionRows = storedPositionsAreComplete
    ? [...examRecord.answers]
        .sort((left, right) => Number(left.position) - Number(right.position))
        .flatMap((answer) => {
          const question = questionMap.get(answer.questionId)
          return question ? [question] : []
        })
    : orderQuestionsByModule(unorderedQuestionRows)
  if (!questionRows.length) throw new Error('Diagnostic paper has no official questions')

  const answerMap = new Map(examRecord.answers.map((answer) => [answer.questionId, answer]))
  const moduleSnapshot = parseModuleExamSnapshot(examRecord.structureSnapshot)
  const historicalPaper = parseDiagnosticHistorySnapshot(examRecord.structureSnapshot)?.sourcePaper
  const isAnnualDiagnostic = examRecord.paper.assemblyType === DIAGNOSTIC_ASSEMBLY.ANNUAL
    || examRecord.paper.assemblyType === DIAGNOSTIC_ASSEMBLY.RETIRED
  const frozenQuestionMeta = new Map(
    (moduleSnapshot?.modules || []).flatMap((module) =>
      module.questionIds.map((questionId, index) => [
        questionId,
        {
          moduleCode: module.code,
          moduleOrder: module.order,
          moduleQuestionNumber: index + 1,
        },
      ] as const),
    ),
  )
  const learnerProfile = learnerProfileForExam(examRecord.user.examPreferences, examRecord.examType)
  const questions = questionRows.map((question, index) => {
    const frozen = frozenQuestionMeta.get(question.id)
    const historical = diagnosticHistoryQuestionFields(examRecord.structureSnapshot, question.id)
    return {
      number: historical.number ?? (isMockPaperType(examRecord.paper.paperType) || isAnnualDiagnostic ? index + 1 : question.number ?? index + 1),
      subject: question.subject,
      subjectCode: question.subjectCode,
      moduleCode: historical.module_code ?? frozen?.moduleCode ?? question.moduleCode,
      moduleOrder: historical.module_order ?? frozen?.moduleOrder ?? question.moduleOrder,
      moduleQuestionNumber: historical.module_question_number ?? frozen?.moduleQuestionNumber ?? question.moduleQuestionNumber,
      topic: question.topic,
      topicCode: question.topicCode,
      knowledgePoints: parseJsonArray<{ code: string; label: string; role?: string }>(question.knowledgePoints),
      difficulty: question.difficulty,
      isCorrect: answerMap.get(question.id)?.isCorrect ?? false,
      isAnswered: Boolean(answerMap.get(question.id)?.selectedAnswer?.trim()),
      answerState: answerMap.get(question.id)?.answerState as 'unseen' | 'skipped' | 'answered' | undefined,
      durationSeconds: answerMap.get(question.id)?.durationSeconds ?? null,
      learningAnalysis: learningAnalysisForReport(question.solution),
    }
  })

  const report = await buildDiagnosticReportSummary({
    examType: examRecord.examType,
    paper: {
      title: historicalPaper?.title ?? examRecord.paper.title,
      code: historicalPaper ? historicalPaper.code : examRecord.paper.code,
      year: historicalPaper?.year ?? examRecord.paper.year,
      duration: historicalPaper?.duration ?? (isAnnualDiagnostic && moduleSnapshot
        ? moduleSnapshot.modules.reduce((total, module) => total + module.durationSeconds, 0) / 60
        : examRecord.paper.duration),
    },
    questions,
    elapsedDurationSeconds: examRecord.durationSeconds,
    syllabusNodes: syllabusNodes.map((node) => ({
      code: node.code,
      label: formatSyllabusLabel(node),
    })),
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

// 以本次答卷为唯一归属，在同一事务中保存报告并完成任务状态。
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

// 生成异常先按自动重试额度重新排队，额度耗尽后保留失败原因供用户重试。
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

// 按创建顺序原子领取待分析任务，避免并发执行器重复生成同一份报告。
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

// 校验答卷归属与交卷状态后复用或创建唯一报告任务，待处理任务立即唤醒执行器。
export async function ensureDiagnosticReportTask(examRecordId: string, userId: string): Promise<{
  id: string
  status: string
}> {
  const examRecord = await prisma.examRecord.findFirst({
    where: { id: examRecordId, userId },
    include: { paper: { select: { paperType: true } } },
  })
  if (!examRecord) throw new Error('Exam record not found')
  if (!supportsAttemptDiagnosticReport(
    examRecord.paper.paperType,
    examRecord.structureSnapshot,
  )) {
    throw new Error('This exam record does not support diagnostic reports')
  }
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

// 仅将当前用户的失败任务重新排队，并清除旧锁与错误状态。
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

// 将超时失去心跳的分析任务恢复为待处理，支持服务中断后的自动续跑。
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
