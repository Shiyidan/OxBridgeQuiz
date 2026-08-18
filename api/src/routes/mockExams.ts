// 无限模考学生端路由：提供公开目录、个人记录与趋势，并创建可复用分段考试链路的独立答卷。
import { Prisma } from '@prisma/client'
import { optionalAuth, requireAuth } from '../middleware/auth.js'
import { setOperationAuditContext } from '../middleware/operationAudit.js'
import {
  EXAM_PHASE,
  EXAM_RECORD_STATUS,
  EXAM_TYPE,
  MOCK_PAPER_STATUS,
  MOCK_PAPER_TYPES,
  MOCK_PAPER_VALIDATION_STATUS,
  PAPER_DELIVERY_MODE,
  QUESTION_STATUS,
} from '../constants/domain.js'
import { prisma } from '../services/prisma.js'
import { hasDiagnosticPaperAccess, type ExamPreferenceRecord } from '../services/member.js'
import { computeScores, type QuestionResult, type ScoringResult } from '../services/scoring.js'
import {
  buildModuleExamSnapshot,
  getModuleExamSession,
  moduleSnapshotJson,
  parseModuleExamSnapshot,
} from '../services/moduleExamSession.js'
import { parseJsonArray } from '../utils/jsonField.js'
import { createAsyncRouter } from '../utils/asyncRouter.js'
import { fail, success } from '../utils/response.js'
import { parsePositiveInt } from './papers-shared.js'
import { replaceAnswerRecords } from './exam-shared.js'

export const mockExamRouter = createAsyncRouter()

const ESAT_SUBJECT_CODE: Record<string, string> = {
  数学1: 'maths1',
  数学2: 'maths2',
  物理: 'physics',
  化学: 'chemistry',
  生物: 'biology',
}

type MockModuleRow = {
  id: string
  code: string
  label: string
  moduleOrder: number
  durationSeconds: number
  expectedQuestionCount: number
}

// 前端分页契约与项目其他列表保持一致。
function paginationMeta(page: number, pageSize: number, total: number) {
  const totalPages = Math.ceil(total / pageSize)
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasPrev: page > 1,
    hasNext: totalPages > 0 && page < totalPages,
  }
}

// ESAT 使用用户保存的三个科目；没有完整偏好时目录展示结构占位，开考时要求先完善资料。
async function getEsatModuleCodes(userId?: string): Promise<string[] | null> {
  if (!userId) return null
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { examPreferences: true },
  })
  const preference = parseJsonArray<ExamPreferenceRecord>(user?.examPreferences).find(
    (item) => item.examType.toUpperCase() === EXAM_TYPE.ESAT,
  )
  const codes = (preference?.subjects || [])
    .map((subject) => ESAT_SUBJECT_CODE[subject])
    .filter(Boolean)
  if (codes.length !== 3 || new Set(codes).size !== 3 || !codes.includes('maths1')) return null
  return codes
}

// 目录和开考使用同一科目映射，正式答卷中的模块顺序重新冻结为连续 1..N。
function selectEffectiveModules<T extends MockModuleRow>(
  examType: string,
  modules: T[],
  esatModuleCodes: string[] | null,
): T[] {
  const ordered = [...modules].sort((left, right) => left.moduleOrder - right.moduleOrder)
  if (examType !== EXAM_TYPE.ESAT) return ordered
  if (!esatModuleCodes) return []
  const selectedCodes = new Set(esatModuleCodes)
  return ordered.filter((module) => selectedCodes.has(module.code))
}

// 运行中记录的剩余时间由服务端阶段时间计算，暂停态使用冻结时刻而不是当前时间。
function remainingSeconds(record: {
  status: string
  phase: string
  phaseStartedAt: Date | null
  phaseExpiresAt: Date | null
}): number | null {
  if (record.status !== EXAM_RECORD_STATUS.IN_PROGRESS || !record.phaseExpiresAt) return null
  const paused = record.phase === EXAM_PHASE.PAUSED || record.phase === EXAM_PHASE.BREAK_PAUSED
  const reference = paused && record.phaseStartedAt ? record.phaseStartedAt : new Date()
  return Math.max(0, Math.ceil((record.phaseExpiresAt.getTime() - reference.getTime()) / 1000))
}

// 当前模块名称只从答卷结构快照读取，发布后的母卷变化不会影响历史进度。
function currentModuleLabel(record: {
  structureSnapshot: unknown
  currentModuleIndex: number
}): string | null {
  const snapshot = parseModuleExamSnapshot(record.structureSnapshot)
  return snapshot?.modules[record.currentModuleIndex]?.subject || null
}

// 模考成绩复用统一评分引擎；ESAT 保持官方三模块独立分，不制造总分。
function scoreExamAnswers(answers: Array<{
  isCorrect: boolean
  question: { subject: string | null; moduleCode: string | null }
}>, examType: string): ScoringResult {
  const rows: QuestionResult[] = answers.map((answer) => ({
    subject: answer.question.subject,
    moduleCode: answer.question.moduleCode,
    isCorrect: answer.isCorrect,
  }))
  return computeScores(examType, rows)
}

// 游客可浏览已发布目录；登录用户额外获得该卷的未完成、已完成与最佳成绩汇总。
mockExamRouter.get('/catalog', optionalAuth, async (req, res) => {
  const examType = String(req.query.examType || '').trim().toUpperCase()
  if (examType !== EXAM_TYPE.ESAT && examType !== EXAM_TYPE.TMUA) {
    res.status(422).json(fail('无限模考仅支持 ESAT 或 TMUA', 'MOCK_EXAM_TYPE_INVALID'))
    return
  }
  const keyword = String(req.query.keyword || '').trim().slice(0, 80)
  const status = String(req.query.status || '').trim()
  if (status && !['not_started', 'in_progress', 'completed'].includes(status)) {
    res.status(422).json(fail('模考目录状态无效', 'MOCK_EXAM_STATUS_INVALID'))
    return
  }
  const pageSize = parsePositiveInt(req.query.pageSize, 10, 50)
  const requestedPage = parsePositiveInt(req.query.page, 1)
  const userId = req.user?.userId
  const relationFilter = userId && status
    ? status === 'not_started'
      ? { paper: { examRecords: { none: { userId } } } }
      : {
          paper: {
            examRecords: {
              some: {
                userId,
                status: status === 'in_progress'
                  ? EXAM_RECORD_STATUS.IN_PROGRESS
                  : EXAM_RECORD_STATUS.SUBMITTED,
              },
            },
          },
        }
    : {}
  const where: Prisma.MockPaperSetWhereInput = {
    examType,
    status: MOCK_PAPER_STATUS.PUBLISHED,
    validationStatus: MOCK_PAPER_VALIDATION_STATUS.VALID,
    paperId: { not: null },
    ...(keyword ? { OR: [{ title: { contains: keyword } }, { code: { contains: keyword } }] } : {}),
    ...relationFilter,
  }
  const total = await prisma.mockPaperSet.count({ where })
  const totalPages = Math.ceil(total / pageSize)
  const page = totalPages > 0 ? Math.min(requestedPage, totalPages) : 1
  const sets = await prisma.mockPaperSet.findMany({
    where,
    orderBy: [{ sequenceNo: 'asc' }, { version: 'desc' }],
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: { modules: { orderBy: { moduleOrder: 'asc' } } },
  })
  const esatModuleCodes = examType === EXAM_TYPE.ESAT
    ? await getEsatModuleCodes(userId)
    : null
  const paperIds = sets.flatMap((set) => (set.paperId ? [set.paperId] : []))
  const records = userId && paperIds.length
    ? await prisma.examRecord.findMany({
        where: { userId, paperId: { in: paperIds } },
        orderBy: [{ submittedAt: 'desc' }, { startedAt: 'desc' }],
        include: {
          answers: {
            select: {
              selectedAnswer: true,
              isCorrect: true,
              question: { select: { subject: true, moduleCode: true } },
            },
          },
        },
      })
    : []
  const recordsByPaper = new Map<string, typeof records>()
  for (const record of records) {
    const current = recordsByPaper.get(record.paperId) || []
    current.push(record)
    recordsByPaper.set(record.paperId, current)
  }

  const list = sets.map((set) => {
    const effectiveModules = selectEffectiveModules(set.examType, set.modules, esatModuleCodes)
    const displayModules = set.examType === EXAM_TYPE.ESAT && !effectiveModules.length
      ? []
      : effectiveModules
    const totalQuestions = set.examType === EXAM_TYPE.ESAT
      ? set.modules.find((module) => module.code === 'maths1')!.expectedQuestionCount * 3
      : effectiveModules.reduce((sum, module) => sum + module.expectedQuestionCount, 0)
    const durationSeconds = set.examType === EXAM_TYPE.ESAT
      ? set.modules.find((module) => module.code === 'maths1')!.durationSeconds * 3
      : effectiveModules.reduce((sum, module) => sum + module.durationSeconds, 0)
    const paperRecords = set.paperId ? recordsByPaper.get(set.paperId) || [] : []
    const inProgress = paperRecords.filter(
      (record) => record.status === EXAM_RECORD_STATUS.IN_PROGRESS,
    )
    const completed = paperRecords.filter(
      (record) => record.status === EXAM_RECORD_STATUS.SUBMITTED,
    )
    const completedScores = completed
      .map((record) => scoreExamAnswers(record.answers, record.examType).overallScore)
      .filter((score): score is number => score !== null)
    return {
      id: set.id,
      code: set.code,
      title: set.title,
      examType: set.examType,
      accessTier: set.accessTier,
      durationSeconds,
      totalQuestions,
      modules: displayModules.map((module, index) => ({
        code: module.code,
        subject: module.label,
        subjectCode: module.code,
        order: index + 1,
        durationSeconds: module.durationSeconds,
        questionCount: module.expectedQuestionCount,
      })),
      publicationStatus: 'published',
      inProgressCount: inProgress.length,
      completedCount: completed.length,
      bestScore: completedScores.length ? Math.max(...completedScores) : null,
      latestCompletedExamRecordId: completed[0]?.id || null,
      inProgressAttempts: inProgress.map((record) => ({
        examRecordId: record.id,
        paperId: set.id,
        startedAt: record.startedAt.toISOString(),
        updatedAt: (record.phaseStartedAt || record.startedAt).toISOString(),
        currentModuleLabel: currentModuleLabel(record) || '等待开始',
        answeredCount: record.answers.filter((answer) => Boolean(answer.selectedAnswer)).length,
        totalQuestions: record.totalQuestions,
        remainingSeconds: remainingSeconds(record),
      })),
    }
  })
  res.json(success({ list, pagination: paginationMeta(page, pageSize, total) }))
})

// 个人概览只统计固定模考卷，不混入真题诊断或题库练习。
mockExamRouter.get('/overview', requireAuth, async (req, res) => {
  const examType = String(req.query.examType || '').trim().toUpperCase()
  if (examType !== EXAM_TYPE.ESAT && examType !== EXAM_TYPE.TMUA) {
    res.status(422).json(fail('无限模考仅支持 ESAT 或 TMUA', 'MOCK_EXAM_TYPE_INVALID'))
    return
  }
  const [records, user] = await Promise.all([
    prisma.examRecord.findMany({
      where: {
        userId: req.user!.userId,
        examType,
        status: EXAM_RECORD_STATUS.SUBMITTED,
        submittedAt: { not: null },
        paper: { paperType: { in: [...MOCK_PAPER_TYPES] } },
      },
      orderBy: [{ submittedAt: 'desc' }, { id: 'desc' }],
      include: {
        answers: {
          select: {
            isCorrect: true,
            question: { select: { subject: true, moduleCode: true } },
          },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { examPreferences: true },
    }),
  ])
  const preferences = parseJsonArray<ExamPreferenceRecord>(user?.examPreferences)
  const targetScore = preferences.find(
    (item) => item.examType.toUpperCase() === examType,
  )?.targetScore ?? null
  const scoredRecords = records.map((record) => ({
    record,
    scoring: scoreExamAnswers(record.answers, record.examType),
  }))
  const recent = scoredRecords.slice(0, 5).reverse()
  const labels = recent.map(({ record }) =>
    new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit' }).format(record.submittedAt!),
  )
  const series = examType === EXAM_TYPE.TMUA
    ? [{ key: 'overall', label: '综合分', values: recent.map(({ scoring }) => scoring.overallScore) }]
    : [...new Map(
        recent.flatMap(({ scoring }) => scoring.modules.map((module) => [module.module, module.moduleLabel])),
      ).entries()].map(([key, label]) => ({
        key,
        label,
        values: recent.map(({ scoring }) =>
          scoring.modules.find((module) => module.module === key)?.scaledScore ?? null,
        ),
      }))
  const overallScores = scoredRecords
    .map(({ scoring }) => scoring.overallScore)
    .filter((score): score is number => score !== null)
  res.json(success({
    completedCount: records.length,
    bestScore: overallScores.length ? Math.max(...overallScores) : null,
    targetScore,
    maxScore: 9,
    labels,
    series,
  }))
})

// 未完成和已完成记录分别分页，已下线套卷的历史仍然可见并可继续。
mockExamRouter.get('/records', requireAuth, async (req, res) => {
  const examType = String(req.query.examType || '').trim().toUpperCase()
  const requestedStatus = String(req.query.status || 'in_progress').trim()
  if (examType !== EXAM_TYPE.ESAT && examType !== EXAM_TYPE.TMUA) {
    res.status(422).json(fail('无限模考仅支持 ESAT 或 TMUA', 'MOCK_EXAM_TYPE_INVALID'))
    return
  }
  if (requestedStatus !== 'in_progress' && requestedStatus !== 'completed') {
    res.status(422).json(fail('模考记录状态无效', 'MOCK_EXAM_STATUS_INVALID'))
    return
  }
  const databaseStatus = requestedStatus === 'completed'
    ? EXAM_RECORD_STATUS.SUBMITTED
    : EXAM_RECORD_STATUS.IN_PROGRESS
  const pageSize = parsePositiveInt(req.query.pageSize, 10, 50)
  const requestedPage = parsePositiveInt(req.query.page, 1)
  const where: Prisma.ExamRecordWhereInput = {
    userId: req.user!.userId,
    examType,
    status: databaseStatus,
    paper: { paperType: { in: [...MOCK_PAPER_TYPES] } },
  }
  const total = await prisma.examRecord.count({ where })
  const totalPages = Math.ceil(total / pageSize)
  const page = totalPages > 0 ? Math.min(requestedPage, totalPages) : 1
  const records = await prisma.examRecord.findMany({
    where,
    orderBy: requestedStatus === 'completed'
      ? [{ submittedAt: 'desc' }, { startedAt: 'desc' }]
      : [{ startedAt: 'desc' }],
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      paper: {
        select: {
          id: true,
          title: true,
          code: true,
          mockPaperSet: { select: { id: true } },
        },
      },
      diagnosticReportTask: { select: { status: true } },
      answers: {
        select: {
          selectedAnswer: true,
          isCorrect: true,
          question: { select: { subject: true, moduleCode: true } },
        },
      },
    },
  })
  const list = records.map((record) => {
    const scoring = record.status === EXAM_RECORD_STATUS.SUBMITTED
      ? scoreExamAnswers(record.answers, record.examType)
      : null
    return {
      examRecordId: record.id,
      paperId: record.paper.mockPaperSet?.id || record.paper.id,
      paperTitle: record.paper.title,
      paperCode: record.paper.code,
      status: record.status === EXAM_RECORD_STATUS.SUBMITTED ? 'completed' : 'in_progress',
      startedAt: record.startedAt.toISOString(),
      updatedAt: (record.submittedAt || record.phaseStartedAt || record.startedAt).toISOString(),
      submittedAt: record.submittedAt?.toISOString() || null,
      currentModuleLabel: currentModuleLabel(record),
      answeredCount: record.answers.filter((answer) => Boolean(answer.selectedAnswer)).length,
      totalQuestions: record.totalQuestions,
      correctCount: record.correctCount,
      wrongCount: Math.max(0, record.totalQuestions - record.correctCount),
      accuracy: record.totalQuestions > 0
        ? Math.round((record.correctCount / record.totalQuestions) * 1000) / 10
        : null,
      durationSeconds: record.durationSeconds,
      remainingSeconds: remainingSeconds(record),
      score: scoring?.overallScore ?? null,
      moduleScores: scoring?.modules.map((module) => ({
        code: module.module,
        label: module.moduleLabel,
        correctCount: module.rawScore,
        totalQuestions: module.totalQuestions,
        score: module.scaledScore,
      })) || [],
      reportStatus: record.diagnosticReportTask?.status || null,
    }
  })
  res.json(success({ list, pagination: paginationMeta(page, pageSize, total) }))
})

// 创建答卷时冻结会员授权、ESAT 科目组合、模块题序和正式时长；允许并存多场未完成模考。
mockExamRouter.post('/papers/:id/attempts', requireAuth, async (req, res) => {
  const requestId = typeof req.body?.startRequestId === 'string'
    ? req.body.startRequestId.trim().slice(0, 100)
    : ''
  if (!requestId || !/^[A-Za-z0-9-]{8,100}$/.test(requestId)) {
    res.status(422).json(fail('开始请求标识无效，请刷新后重试', 'MOCK_EXAM_START_REQUEST_INVALID'))
    return
  }
  const startRequestKey = `${req.user!.userId}:${req.params.id}:${requestId}`
  const existing = await prisma.examRecord.findUnique({ where: { startRequestKey } })
  if (existing) {
    res.json(success({ examRecordId: existing.id, paperId: req.params.id }))
    return
  }

  const set = await prisma.mockPaperSet.findUnique({
    where: { id: req.params.id },
    include: {
      paper: true,
      modules: {
        orderBy: { moduleOrder: 'asc' },
        include: {
          questions: {
            orderBy: { position: 'asc' },
            include: {
              question: {
                select: {
                  id: true,
                  answer: true,
                  status: true,
                  examType: true,
                  subject: true,
                  moduleCode: true,
                },
              },
            },
          },
        },
      },
    },
  })
  if (
    !set
    || set.status !== MOCK_PAPER_STATUS.PUBLISHED
    || set.validationStatus !== MOCK_PAPER_VALIDATION_STATUS.VALID
    || !set.paper
    || set.paper.status !== 'published'
  ) {
    res.status(409).json(fail('该模考卷当前不能开始', 'MOCK_EXAM_NOT_AVAILABLE'))
    return
  }
  if (!(await hasDiagnosticPaperAccess(req.user!.userId, set))) {
    res.status(403).json(fail(
      `当前试卷需要开通 ${set.examType} 会员后才能开始`,
      'MOCK_EXAM_PAPER_LOCKED',
    ))
    return
  }
  const esatModuleCodes = set.examType === EXAM_TYPE.ESAT
    ? await getEsatModuleCodes(req.user!.userId)
    : null
  if (set.examType === EXAM_TYPE.ESAT && !esatModuleCodes) {
    res.status(422).json(fail(
      '请先在个人中心完成 ESAT 三科选择后再开始模考',
      'ESAT_SUBJECTS_REQUIRED',
    ))
    return
  }
  const selectedModules = selectEffectiveModules(set.examType, set.modules, esatModuleCodes)
  const expectedModuleCount = set.examType === EXAM_TYPE.ESAT ? 3 : 2
  if (selectedModules.length !== expectedModuleCount) {
    res.status(422).json(fail('模考卷模块结构不完整', 'MOCK_EXAM_STRUCTURE_INVALID'))
    return
  }
  const invalidQuestion = selectedModules.some((module) =>
    module.questions.length !== module.expectedQuestionCount
    || module.questions.some((item) =>
      !item.question
      || item.question.status !== QUESTION_STATUS.PUBLISHED
      || item.question.examType !== set.examType,
    ),
  )
  if (invalidQuestion) {
    res.status(422).json(fail('模考卷题目已发生变化，请等待管理员重新校验', 'MOCK_EXAM_QUESTION_INVALID'))
    return
  }

  const moduleConfig = selectedModules.map((module, index) => ({
    code: module.code,
    subject: module.label,
    subjectCode: module.code,
    order: index + 1,
    durationSeconds: module.durationSeconds,
    questionCount: module.expectedQuestionCount,
  }))
  const orderedQuestionItems = selectedModules.flatMap((module, moduleIndex) =>
    module.questions.map((item) => ({
      question: item.question!,
      moduleCode: module.code,
      moduleOrder: moduleIndex + 1,
    })),
  )
  const snapshot = buildModuleExamSnapshot(
    {
      id: set.paper.id,
      examType: set.examType,
      deliveryMode: PAPER_DELIVERY_MODE.MODULE_SEQUENCE,
      breakDurationSeconds: set.examType === EXAM_TYPE.ESAT ? 180 : 0,
      moduleConfig,
    },
    orderedQuestionItems.map((item) => ({
      id: item.question.id,
      moduleCode: item.moduleCode,
      moduleOrder: item.moduleOrder,
    })),
  )
  const officialQuestions = orderedQuestionItems.map((item) => ({
    id: item.question.id,
    answer: parseJsonArray<string>(item.question.answer),
  }))

  let examRecordId = ''
  try {
    examRecordId = await prisma.$transaction(async (tx) => {
      const duplicate = await tx.examRecord.findUnique({ where: { startRequestKey } })
      if (duplicate) return duplicate.id
      const startedAt = new Date()
      const expiresAt = new Date(startedAt.getTime() + snapshot.modules[0].durationSeconds * 1000)
      const record = await tx.examRecord.create({
        data: {
          userId: req.user!.userId,
          paperId: set.paper!.id,
          examType: set.examType,
          totalQuestions: officialQuestions.length,
          correctCount: 0,
          startedAt,
          expiresAt,
          phase: EXAM_PHASE.ANSWERING,
          currentModuleIndex: 0,
          phaseStartedAt: startedAt,
          phaseExpiresAt: expiresAt,
          structureSnapshot: moduleSnapshotJson(snapshot),
          activeDurationSeconds: 0,
          durationSeconds: 0,
          status: EXAM_RECORD_STATUS.IN_PROGRESS,
          startRequestKey,
        },
      })
      await replaceAnswerRecords(tx, record.id, officialQuestions, {}, {}, {}, true)
      return record.id
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const duplicate = await prisma.examRecord.findUnique({ where: { startRequestKey } })
      if (duplicate) examRecordId = duplicate.id
      else throw error
    } else {
      throw error
    }
  }
  const session = await getModuleExamSession(examRecordId, req.user!.userId)
  if (!session) {
    res.status(500).json(fail('模考会话创建失败', 'MOCK_EXAM_SESSION_FAILED'))
    return
  }
  setOperationAuditContext(req, {
    resourceType: 'ExamRecord',
    resourceId: examRecordId,
    summary: `开始 ${set.examType} 无限模考“${set.title}”`,
  })
  res.status(201).json(success({ examRecordId, paperId: set.id }))
})

// 放弃仅删除目标未完成答卷，不影响同套卷的其他进行中或历史记录。
mockExamRouter.delete('/attempts/:id', requireAuth, async (req, res) => {
  const record = await prisma.examRecord.findFirst({
    where: {
      id: req.params.id,
      userId: req.user!.userId,
      status: EXAM_RECORD_STATUS.IN_PROGRESS,
      paper: { paperType: { in: [...MOCK_PAPER_TYPES] } },
    },
    include: { paper: { select: { title: true } } },
  })
  if (!record) {
    res.status(404).json(fail('未完成模考不存在或已经结束', 'MOCK_EXAM_ATTEMPT_NOT_FOUND'))
    return
  }
  await prisma.examRecord.delete({ where: { id: record.id } })
  setOperationAuditContext(req, {
    resourceType: 'ExamRecord',
    resourceId: record.id,
    summary: `放弃无限模考“${record.paper.title}”`,
  })
  res.json(success(null))
})
