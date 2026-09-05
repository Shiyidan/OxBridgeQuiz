// 模块化诊断会话：冻结试卷结构、恢复阶段状态，并只下发当前模块题目。
import { Prisma } from '@prisma/client'
import {
  ESAT_MODULES,
  EXAM_PHASE,
  EXAM_RECORD_STATUS,
  EXAM_TYPE,
  PAPER_DELIVERY_MODE,
  TMUA_PAPER,
} from '../constants/domain.js'
import { prisma } from './prisma.js'
import { parseJsonField } from '../utils/jsonField.js'
import { attemptQuestionSelect, formatQuestionForAttempt } from '../routes/papers-shared.js'

export interface StoredExamModule {
  code: string
  subject: string
  title?: string | null
  subjectCode: string | null
  order: number
  durationSeconds: number
  questionCount: number
  questionIds: string[]
}

export interface ModuleExamSnapshot {
  version: 1
  deliveryMode: typeof PAPER_DELIVERY_MODE.MODULE_SEQUENCE
  breakDurationSeconds: number
  modules: StoredExamModule[]
  mockExamMode?: 'single'
  mockModuleId?: string
}

type ModulePaper = {
  id: string
  examType: string
  deliveryMode: string
  breakDurationSeconds: number
  moduleConfig: unknown
}

const ESAT_MODULE_BREAK_SECONDS = 180
const TMUA_PAPER_DURATION_SECONDS = 75 * 60
const TMUA_PAPER_QUESTION_COUNT = 20
const SINGLE_MODULE_DISPLAY_LABELS: Record<string, string> = {
  maths1: 'Math1',
  maths2: 'Math2',
  physics: 'Physics',
  chemistry: 'Chemistry',
  biology: 'Biology',
  paper1: 'Paper1',
  paper2: 'Paper2',
}

// 单项目录、记录和错题回顾共用同一标题规则，避免回退成所属完整套卷名称。
export function singleModuleExamTitle(
  examType: string,
  moduleCode: string,
  sequenceNo: number,
  customTitle?: string | null,
): string {
  const normalizedTitle = customTitle?.trim()
  if (normalizedTitle) return normalizedTitle
  const label = SINGLE_MODULE_DISPLAY_LABELS[moduleCode] || moduleCode
  return `${examType} ${label} No.${String(sequenceNo).padStart(3, '0')}`
}

// Paper.moduleConfig 与题目列共同生成不可变的 attempt 快照，防止后续编辑影响历史考试。
export function buildModuleExamSnapshot(
  paper: ModulePaper,
  questions: Array<{
    id: string
    moduleCode: string | null
    moduleOrder: number | null
  }>,
): ModuleExamSnapshot {
  const config = parseJsonField<Array<{
    code?: string
    subject?: string
    subjectCode?: string | null
    order?: number
    durationSeconds?: number
    questionCount?: number
  }>>(paper.moduleConfig, [])

  const modules = config
    .map((module, index) => {
      const code = String(module.code || '').trim()
      const order = Number.isInteger(module.order) ? Number(module.order) : index + 1
      const questionIds = questions
        .filter((question) => question.moduleCode === code && question.moduleOrder === order)
        .map((question) => question.id)
      return {
        code,
        subject: String(module.subject || code),
        subjectCode: module.subjectCode ? String(module.subjectCode) : null,
        order,
        durationSeconds: Math.max(1, Math.round(Number(module.durationSeconds) || 0)),
        questionCount: questionIds.length,
        questionIds,
      }
    })
    .sort((a, b) => a.order - b.order)
  const moduleQuestionIds = modules.flatMap((module) => module.questionIds)
  const commonStructureInvalid = (
    paper.deliveryMode !== PAPER_DELIVERY_MODE.MODULE_SEQUENCE
    || modules.some((module) => !module.code || !module.questionIds.length || module.durationSeconds <= 0)
    || new Set(modules.map((module) => module.code)).size !== modules.length
    || new Set(modules.map((module) => module.order)).size !== modules.length
    || moduleQuestionIds.length !== questions.length
    || new Set(moduleQuestionIds).size !== questions.length
  )
  const esatStructureInvalid = paper.examType === EXAM_TYPE.ESAT && (
    paper.breakDurationSeconds !== ESAT_MODULE_BREAK_SECONDS
    || modules.length !== 3
    || !modules.some((module) => module.code === 'maths1')
    || modules.some((module) => !ESAT_MODULES.some((code) => code === module.code))
  )
  const tmuaStructureInvalid = paper.examType === EXAM_TYPE.TMUA && (
    paper.breakDurationSeconds !== 0
    || modules.length !== 2
    || modules[0]?.code !== TMUA_PAPER.PAPER_1
    || modules[0]?.order !== 1
    || modules[1]?.code !== TMUA_PAPER.PAPER_2
    || modules[1]?.order !== 2
    || modules.some((module) => module.durationSeconds !== TMUA_PAPER_DURATION_SECONDS)
    || modules.some((module) => module.questionCount !== TMUA_PAPER_QUESTION_COUNT)
  )
  if (
    commonStructureInvalid
    || esatStructureInvalid
    || tmuaStructureInvalid
    || (paper.examType !== EXAM_TYPE.ESAT && paper.examType !== EXAM_TYPE.TMUA)
  ) {
    throw new Error('分段试卷结构不完整，无法开始诊断测试')
  }

  return {
    version: 1,
    deliveryMode: PAPER_DELIVERY_MODE.MODULE_SEQUENCE,
    breakDurationSeconds: paper.breakDurationSeconds,
    modules,
  }
}

// 单项模考只冻结一个已校验模块，并用快照元数据与同一运行试卷下的完整模考答卷区分。
export function buildSingleModuleExamSnapshot(
  paper: Pick<ModulePaper, 'examType'>,
  module: {
    id: string
    code: string
    subject: string
    title?: string | null
    subjectCode?: string | null
    durationSeconds: number
  },
  questionIds: string[],
): ModuleExamSnapshot {
  const code = module.code.trim()
  const validExamModule = paper.examType === EXAM_TYPE.ESAT
    ? ESAT_MODULES.some((item) => item === code)
    : paper.examType === EXAM_TYPE.TMUA
      ? code === TMUA_PAPER.PAPER_1 || code === TMUA_PAPER.PAPER_2
      : false
  if (
    !module.id
    || !code
    || !validExamModule
    || module.durationSeconds <= 0
    || questionIds.length === 0
    || new Set(questionIds).size !== questionIds.length
  ) {
    throw new Error('单项模考结构不完整，无法开始考试')
  }

  return {
    version: 1,
    deliveryMode: PAPER_DELIVERY_MODE.MODULE_SEQUENCE,
    breakDurationSeconds: 0,
    mockExamMode: 'single',
    mockModuleId: module.id,
    modules: [{
      code,
      subject: module.subject || code,
      title: module.title?.trim() || null,
      subjectCode: module.subjectCode || code,
      order: 1,
      durationSeconds: Math.max(1, Math.round(module.durationSeconds)),
      questionCount: questionIds.length,
      questionIds,
    }],
  }
}

export function parseModuleExamSnapshot(value: unknown): ModuleExamSnapshot | null {
  const snapshot = parseJsonField<ModuleExamSnapshot | null>(value, null)
  if (
    !snapshot
    || snapshot.version !== 1
    || snapshot.deliveryMode !== PAPER_DELIVERY_MODE.MODULE_SEQUENCE
    || !Array.isArray(snapshot.modules)
    || snapshot.modules.length === 0
    || (snapshot.mockExamMode === 'single' && !snapshot.mockModuleId)
  ) return null
  return snapshot
}

export interface SnapshotQuestionModule {
  code: string
  order: number
  questionNumber: number
}

// 结果与报告按开考时冻结的题目清单恢复模块归属，避免题库分类更新后改写历史答卷结构。
export function indexSnapshotQuestionModules(
  snapshot: ModuleExamSnapshot | null,
): Map<string, SnapshotQuestionModule> {
  const result = new Map<string, SnapshotQuestionModule>()
  for (const module of snapshot?.modules || []) {
    module.questionIds.forEach((questionId, index) => {
      result.set(questionId, {
        code: module.code,
        order: module.order,
        questionNumber: index + 1,
      })
    })
  }
  return result
}

function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + Math.max(1, seconds) * 1000)
}

// 暂停态以 phaseStartedAt 记录暂停时刻，并保留原 phaseExpiresAt，据此冻结作答或休息剩余时间。
export async function resumePausedModuleExam(
  examRecordId: string,
  userId: string,
): Promise<void> {
  const record = await prisma.examRecord.findFirst({
    where: {
      id: examRecordId,
      userId,
      status: EXAM_RECORD_STATUS.IN_PROGRESS,
      phase: { in: [EXAM_PHASE.PAUSED, EXAM_PHASE.BREAK_PAUSED] },
    },
    select: {
      id: true,
      phase: true,
      phaseStartedAt: true,
      phaseExpiresAt: true,
    },
  })
  if (!record?.phaseStartedAt || !record.phaseExpiresAt) return

  const remainingMilliseconds = Math.max(
    1000,
    record.phaseExpiresAt.getTime() - record.phaseStartedAt.getTime(),
  )
  const resumedAt = new Date()
  const expiresAt = new Date(resumedAt.getTime() + remainingMilliseconds)
  await prisma.examRecord.updateMany({
    where: {
      id: record.id,
      userId,
      status: EXAM_RECORD_STATUS.IN_PROGRESS,
      phase: record.phase,
      phaseStartedAt: record.phaseStartedAt,
      phaseExpiresAt: record.phaseExpiresAt,
    },
    data: {
      phase: record.phase === EXAM_PHASE.BREAK_PAUSED
        ? EXAM_PHASE.BREAK
        : EXAM_PHASE.ANSWERING,
      phaseStartedAt: resumedAt,
      phaseExpiresAt: expiresAt,
      expiresAt,
    },
  })
}

// 固定休息到点后由服务端开启下一模块；刷新页面不会获得额外休息时间。
export async function reconcileModuleBreak(examRecordId: string, userId: string): Promise<void> {
  const record = await prisma.examRecord.findFirst({ where: { id: examRecordId, userId } })
  if (
    !record
    || record.status !== EXAM_RECORD_STATUS.IN_PROGRESS
    || record.phase !== EXAM_PHASE.BREAK
    || !record.phaseExpiresAt
    || record.phaseExpiresAt.getTime() > Date.now()
  ) return

  const snapshot = parseModuleExamSnapshot(record.structureSnapshot)
  const nextModule = snapshot?.modules[record.currentModuleIndex]
  if (!nextModule) return
  const startedAt = record.phaseExpiresAt
  const expiresAt = addSeconds(startedAt, nextModule.durationSeconds)
  await prisma.examRecord.updateMany({
    where: {
      id: record.id,
      userId,
      status: EXAM_RECORD_STATUS.IN_PROGRESS,
      phase: EXAM_PHASE.BREAK,
      currentModuleIndex: record.currentModuleIndex,
    },
    data: {
      phase: EXAM_PHASE.ANSWERING,
      phaseStartedAt: startedAt,
      phaseExpiresAt: expiresAt,
      expiresAt,
    },
  })
}

// 恢复旧会话时由服务端连续收敛已过期模块和休息，避免前端停留在“已过期但仍可作答”状态。
export async function reconcileExpiredModuleTimeline(
  examRecordId: string,
  userId: string,
): Promise<void> {
  for (let transitionCount = 0; transitionCount < 16; transitionCount += 1) {
    const record = await prisma.examRecord.findFirst({
      where: { id: examRecordId, userId },
      select: {
        id: true,
        status: true,
        phase: true,
        currentModuleIndex: true,
        phaseStartedAt: true,
        phaseExpiresAt: true,
        structureSnapshot: true,
      },
    })
    if (
      !record
      || record.status !== EXAM_RECORD_STATUS.IN_PROGRESS
      || !record.phaseExpiresAt
      || record.phaseExpiresAt.getTime() > Date.now()
    ) return

    const snapshot = parseModuleExamSnapshot(record.structureSnapshot)
    if (!snapshot) return

    if (record.phase === EXAM_PHASE.BREAK) {
      const nextModule = snapshot.modules[record.currentModuleIndex]
      if (!nextModule) return
      const startedAt = record.phaseExpiresAt
      const expiresAt = addSeconds(startedAt, nextModule.durationSeconds)
      const updated = await prisma.examRecord.updateMany({
        where: {
          id: record.id,
          userId,
          status: EXAM_RECORD_STATUS.IN_PROGRESS,
          phase: EXAM_PHASE.BREAK,
          currentModuleIndex: record.currentModuleIndex,
          phaseExpiresAt: record.phaseExpiresAt,
        },
        data: {
          phase: EXAM_PHASE.ANSWERING,
          phaseStartedAt: startedAt,
          phaseExpiresAt: expiresAt,
          expiresAt,
        },
      })
      if (!updated.count) continue
      continue
    }

    if (record.phase !== EXAM_PHASE.ANSWERING) return
    const activeModule = snapshot.modules[record.currentModuleIndex]
    if (!activeModule) return
    const endedAt = record.phaseExpiresAt
    const elapsedSeconds = record.phaseStartedAt
      ? Math.max(0, Math.round((endedAt.getTime() - record.phaseStartedAt.getTime()) / 1000))
      : 0
    const nextModuleIndex = record.currentModuleIndex + 1
    const nextModule = snapshot.modules[nextModuleIndex]
    const isLastModule = !nextModule
    const hasBreak = snapshot.breakDurationSeconds > 0
    const breakEndsAt = addSeconds(endedAt, snapshot.breakDurationSeconds)
    const nextModuleExpiresAt = nextModule
      ? addSeconds(endedAt, nextModule.durationSeconds)
      : null
    const updated = await prisma.examRecord.updateMany({
      where: {
        id: record.id,
        userId,
        status: EXAM_RECORD_STATUS.IN_PROGRESS,
        phase: EXAM_PHASE.ANSWERING,
        currentModuleIndex: record.currentModuleIndex,
        phaseExpiresAt: record.phaseExpiresAt,
      },
      data: isLastModule
        ? {
            phase: EXAM_PHASE.READY_TO_SUBMIT,
            phaseStartedAt: null,
            phaseExpiresAt: null,
            expiresAt: null,
            activeDurationSeconds: { increment: elapsedSeconds },
          }
        : hasBreak
          ? {
              phase: EXAM_PHASE.BREAK,
              currentModuleIndex: nextModuleIndex,
              phaseStartedAt: endedAt,
              phaseExpiresAt: breakEndsAt,
              expiresAt: breakEndsAt,
              activeDurationSeconds: { increment: elapsedSeconds },
            }
          : {
              phase: EXAM_PHASE.ANSWERING,
              currentModuleIndex: nextModuleIndex,
              phaseStartedAt: endedAt,
              phaseExpiresAt: nextModuleExpiresAt,
              expiresAt: nextModuleExpiresAt,
              activeDurationSeconds: { increment: elapsedSeconds },
            },
    })
    if (!updated.count) continue
  }
}

function activeElapsedSeconds(record: {
  phase: string
  phaseStartedAt: Date | null
  phaseExpiresAt: Date | null
  activeDurationSeconds: number
}, now: Date): number {
  if (record.phase !== EXAM_PHASE.ANSWERING || !record.phaseStartedAt) {
    return record.activeDurationSeconds
  }
  const effectiveEnd = record.phaseExpiresAt
    ? Math.min(now.getTime(), record.phaseExpiresAt.getTime())
    : now.getTime()
  return record.activeDurationSeconds + Math.max(
    0,
    Math.round((effectiveEnd - record.phaseStartedAt.getTime()) / 1000),
  )
}

// 会话响应不包含正确答案、解析和未来模块题目。
export async function getModuleExamSession(
  examRecordId: string,
  userId: string,
  options: { resumePaused?: boolean } = {},
) {
  if (options.resumePaused) await resumePausedModuleExam(examRecordId, userId)
  await reconcileExpiredModuleTimeline(examRecordId, userId)
  const record = await prisma.examRecord.findFirst({
    where: { id: examRecordId, userId },
    select: {
      id: true,
      paperId: true,
      examType: true,
      totalQuestions: true,
      status: true,
      phase: true,
      startedAt: true,
      phaseStartedAt: true,
      phaseExpiresAt: true,
      currentModuleIndex: true,
      structureSnapshot: true,
      activeDurationSeconds: true,
      paper: {
        select: {
          title: true,
          year: true,
        },
      },
      answers: {
        select: {
          questionId: true,
          selectedAnswer: true,
          durationSeconds: true,
          answerState: true,
        },
      },
    },
  })
  if (!record) return null
  const snapshot = parseModuleExamSnapshot(record.structureSnapshot)
  if (!snapshot) return null

  const now = new Date()
  const isPaused = (
    record.phase === EXAM_PHASE.PAUSED
    || record.phase === EXAM_PHASE.BREAK_PAUSED
  )
  const currentModule = snapshot.modules[record.currentModuleIndex] || null
  const activeQuestionIds = record.phase === EXAM_PHASE.ANSWERING
    ? currentModule?.questionIds || []
    : []
  const unorderedQuestionRows = activeQuestionIds.length
      ? await prisma.question.findMany({
        where: { id: { in: activeQuestionIds } },
        select: attemptQuestionSelect,
      })
    : []
  const questionMap = new Map(unorderedQuestionRows.map((question) => [question.id, question]))
  const questionRows = activeQuestionIds.flatMap((questionId) => {
    const question = questionMap.get(questionId)
    return question ? [question] : []
  })
  const activeQuestionSet = new Set(activeQuestionIds)
  const answers: Record<string, string> = {}
  const questionDurations: Record<string, number> = {}
  const answerStates: Record<string, string> = {}
  for (const answer of record.answers) {
    if (!activeQuestionSet.has(answer.questionId)) continue
    if (answer.selectedAnswer) answers[answer.questionId] = answer.selectedAnswer
    questionDurations[answer.questionId] = answer.durationSeconds
    answerStates[answer.questionId] = answer.answerState
  }

  const modules = snapshot.modules.map((module, index) => {
    const isCompleted = index < record.currentModuleIndex
      || (index === record.currentModuleIndex && record.phase === EXAM_PHASE.READY_TO_SUBMIT)
    return {
      code: module.code,
      label: module.subject,
      subjectCode: module.subjectCode,
      order: module.order,
      durationSeconds: module.durationSeconds,
      totalQuestions: module.questionCount,
      status: isCompleted
        ? 'completed'
        : index === record.currentModuleIndex
            && (record.phase === EXAM_PHASE.ANSWERING || record.phase === EXAM_PHASE.PAUSED)
          ? 'in_progress'
          : 'pending',
    }
  })
  const breakState = record.phase === EXAM_PHASE.BREAK && record.phaseStartedAt && record.phaseExpiresAt
    ? {
        afterModuleCode: snapshot.modules[record.currentModuleIndex - 1]?.code || '',
        nextModuleCode: currentModule?.code || '',
        nextModuleLabel: currentModule?.subject || '',
        startedAt: record.phaseStartedAt,
        endsAt: record.phaseExpiresAt,
        durationSeconds: snapshot.breakDurationSeconds,
        canSkip: snapshot.breakDurationSeconds > 0,
      }
    : null
  const questions = questionRows.map(formatQuestionForAttempt)
  const elapsed = activeElapsedSeconds(record, now)

  return {
    examRecordId: record.id,
    paperId: record.paperId,
    paperTitle: snapshot.mockExamMode === 'single'
      ? currentModule?.title || record.paper.title
      : record.paper.title,
    paperYear: record.paper.year,
    examType: record.examType,
    mockExamMode: snapshot.mockExamMode === 'single' ? 'single' : 'full',
    totalQuestions: record.totalQuestions,
    status: record.status,
    deliveryMode: PAPER_DELIVERY_MODE.MODULE_SEQUENCE,
    phase: record.status === EXAM_RECORD_STATUS.SUBMITTED ? 'submitted' : record.phase,
    serverNow: now,
    startedAt: record.startedAt,
    expiresAt: isPaused ? null : record.phaseExpiresAt,
    phaseStartedAt: isPaused ? null : record.phaseStartedAt,
    phaseExpiresAt: isPaused ? null : record.phaseExpiresAt,
    currentModuleIndex: record.currentModuleIndex,
    modules,
    currentModule: record.phase === EXAM_PHASE.ANSWERING && currentModule
      ? {
          ...modules[record.currentModuleIndex],
          startedAt: record.phaseStartedAt,
          expiresAt: record.phaseExpiresAt,
          questions,
        }
      : null,
    break: breakState,
    questions,
    answers,
    questionDurations,
    answerStates,
    durationSeconds: elapsed,
    activeDurationSeconds: elapsed,
    isExpired: Boolean(
      record.phase === EXAM_PHASE.ANSWERING
      && record.phaseExpiresAt
      && record.phaseExpiresAt.getTime() <= now.getTime(),
    ),
  }
}

export function moduleSnapshotJson(snapshot: ModuleExamSnapshot): Prisma.InputJsonValue {
  return snapshot as unknown as Prisma.InputJsonValue
}
