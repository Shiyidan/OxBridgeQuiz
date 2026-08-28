// 学生练习本接口：保存配置、汇总历史，并原子生成可恢复的题库练习。
import { Prisma } from '@prisma/client'
import { requireAuth } from '../middleware/auth.js'
import { setOperationAuditContext } from '../middleware/operationAudit.js'
import {
  EXAM_PHASE,
  EXAM_RECORD_STATUS,
  PAPER_TYPE,
  PRACTICE_NOTEBOOK_STATUS,
  PRACTICE_SOURCE,
  isStudentExamTypeAvailable,
} from '../constants/domain.js'
import { checkMemberAccess } from '../services/member.js'
import {
  normalizePracticeNotebookInput,
  parsePracticeSnapshot,
  PracticeNotebookBusinessError,
  ensureNotebookQuestionCapacity,
  resolveKnowledgePointSnapshot,
  selectPracticeQuestions,
} from '../services/practiceNotebook.js'
import { prisma } from '../services/prisma.js'
import { withQuotaTransaction } from '../services/transactionRetry.js'
import { parseJsonArray } from '../utils/jsonField.js'
import { createAsyncRouter } from '../utils/asyncRouter.js'
import { fail, success } from '../utils/response.js'
import { replaceAnswerRecords } from './exam-shared.js'
import { parsePositiveInt } from './papers-shared.js'

export const practiceNotebookRouter = createAsyncRouter()

const HISTORY_PAGE_SIZE = 5

// 未识别的历史来源统一按专项练习输出，接口只暴露当前仍存在的两类练习。
function normalizePracticeSource(source: string | null) {
  return source === PRACTICE_SOURCE.NOTEBOOK
    ? PRACTICE_SOURCE.NOTEBOOK
    : PRACTICE_SOURCE.DIRECT
}

// 前端列表使用保存时快照，避免每次展示都重新拼装考纲层级。
function formatNotebookConfig(notebook: {
  id: string
  name: string
  examType: string
  knowledgePointCodes: Prisma.JsonValue
  knowledgePointSnapshot: Prisma.JsonValue
  questionCount: number
  difficultyMode: string
  durationMinutes: number | null
  unseenFirst: boolean
  status: string
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: notebook.id,
    name: notebook.name,
    examType: notebook.examType,
    knowledgePointCodes: parseJsonArray<string>(notebook.knowledgePointCodes),
    knowledgePoints: parseJsonArray(notebook.knowledgePointSnapshot),
    questionCount: notebook.questionCount,
    difficultyMode: notebook.difficultyMode,
    durationMinutes: notebook.durationMinutes,
    unseenFirst: notebook.unseenFirst,
    status: notebook.status,
    createdAt: notebook.createdAt,
    updatedAt: notebook.updatedAt,
  }
}

// 单次历史只暴露列表所需统计，逐题内容继续由既有结果详情接口读取。
function formatHistoryRecord(record: {
  id: string
  examType: string
  totalQuestions: number
  correctCount: number
  durationSeconds: number
  startedAt: Date
  submittedAt: Date | null
  practiceSource: string | null
  practiceSnapshot: Prisma.JsonValue | null
}) {
  const source = normalizePracticeSource(record.practiceSource)
  return {
    id: record.id,
    examType: record.examType,
    totalQuestions: record.totalQuestions,
    correctCount: record.correctCount,
    accuracy: record.totalQuestions > 0
      ? Math.round((record.correctCount / record.totalQuestions) * 100)
      : 0,
    durationSeconds: record.durationSeconds,
    startedAt: record.startedAt,
    submittedAt: record.submittedAt,
    source,
    snapshot: { ...parsePracticeSnapshot(record.practiceSnapshot), source },
  }
}

// 练习本首页按当前导航考试返回汇总；历史明细仅在展开时另行读取。
practiceNotebookRouter.get('/', requireAuth, async (req, res) => {
  const examType = String(req.query.examType || '').trim().toUpperCase()
  if (!isStudentExamTypeAvailable(examType)) {
    res.status(422).json(fail('无效的考试类型', 'NOTEBOOK_EXAM_INVALID'))
    return
  }
  const notebooks = await prisma.practiceNotebook.findMany({
    where: {
      userId: req.user!.userId,
      examType,
      status: PRACTICE_NOTEBOOK_STATUS.ACTIVE,
    },
    orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
    include: {
      examRecords: {
        where: { status: EXAM_RECORD_STATUS.SUBMITTED },
        orderBy: { submittedAt: 'desc' },
        take: 1,
        select: {
          id: true,
          examType: true,
          totalQuestions: true,
          correctCount: true,
          durationSeconds: true,
          startedAt: true,
          submittedAt: true,
          practiceSource: true,
          practiceSnapshot: true,
        },
      },
    },
  })
  const ids = notebooks.map((notebook) => notebook.id)
  const [aggregates, activePractice, temporaryAggregate, temporaryLatest] = await Promise.all([
    ids.length
      ? prisma.examRecord.groupBy({
          by: ['practiceNotebookId'],
          where: {
            userId: req.user!.userId,
            examType,
            status: EXAM_RECORD_STATUS.SUBMITTED,
            practiceNotebookId: { in: ids },
          },
          _count: { _all: true },
          _sum: { totalQuestions: true },
        })
      : Promise.resolve([]),
    prisma.examRecord.findFirst({
      where: {
        userId: req.user!.userId,
        paperId: 'question-bank',
        status: EXAM_RECORD_STATUS.IN_PROGRESS,
        activeQuestionBankKey: { not: null },
      },
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        examType: true,
        totalQuestions: true,
        startedAt: true,
        practiceNotebookId: true,
        practiceSource: true,
        _count: { select: { answers: { where: { selectedAnswer: { not: null } } } } },
      },
    }),
    prisma.examRecord.aggregate({
      where: {
        userId: req.user!.userId,
        examType,
        paperId: 'question-bank',
        status: EXAM_RECORD_STATUS.SUBMITTED,
        practiceNotebookId: null,
      },
      _count: { _all: true },
      _sum: { totalQuestions: true },
    }),
    prisma.examRecord.findFirst({
      where: {
        userId: req.user!.userId,
        examType,
        paperId: 'question-bank',
        status: EXAM_RECORD_STATUS.SUBMITTED,
        practiceNotebookId: null,
      },
      orderBy: { submittedAt: 'desc' },
      select: {
        id: true,
        examType: true,
        totalQuestions: true,
        correctCount: true,
        durationSeconds: true,
        startedAt: true,
        submittedAt: true,
        practiceSource: true,
        practiceSnapshot: true,
      },
    }),
  ])
  const aggregateMap = new Map(aggregates.map((item) => [item.practiceNotebookId, item]))

  res.json(success({
    notebooks: notebooks.map((notebook) => {
      const aggregate = aggregateMap.get(notebook.id)
      const latest = notebook.examRecords[0]
      return {
        ...formatNotebookConfig(notebook),
        latestRecord: latest ? formatHistoryRecord(latest) : null,
        completedGroups: aggregate?._count._all || 0,
        completedQuestions: aggregate?._sum.totalQuestions || 0,
      }
    }),
    activePractice: activePractice
      ? {
          examRecordId: activePractice.id,
          examType: activePractice.examType,
          totalQuestions: activePractice.totalQuestions,
          answeredCount: activePractice._count.answers,
          startedAt: activePractice.startedAt,
          practiceNotebookId: activePractice.practiceNotebookId,
          source: normalizePracticeSource(activePractice.practiceSource),
        }
      : null,
    temporaryPractice: temporaryLatest
      || temporaryAggregate._count._all > 0
      || Boolean(activePractice && !activePractice.practiceNotebookId && activePractice.examType === examType)
      ? {
          id: 'temporary',
          name: '临时练习',
          examType,
          latestRecord: temporaryLatest ? formatHistoryRecord(temporaryLatest) : null,
          completedGroups: temporaryAggregate._count._all,
          completedQuestions: temporaryAggregate._sum.totalQuestions || 0,
        }
      : null,
  }))
})

// 临时练习与普通练习本使用相同分页结构，但按无练习本归属筛选。
practiceNotebookRouter.get('/temporary/history', requireAuth, async (req, res) => {
  const examType = String(req.query.examType || '').trim().toUpperCase()
  if (!isStudentExamTypeAvailable(examType)) {
    res.status(422).json(fail('无效的考试类型', 'NOTEBOOK_EXAM_INVALID'))
    return
  }
  const page = parsePositiveInt(req.query.page, 1, 100000)
  const pageSize = parsePositiveInt(req.query.pageSize, HISTORY_PAGE_SIZE, 20)
  const where: Prisma.ExamRecordWhereInput = {
    userId: req.user!.userId,
    examType,
    paperId: 'question-bank',
    status: EXAM_RECORD_STATUS.SUBMITTED,
    practiceNotebookId: null,
  }
  const [total, records] = await Promise.all([
    prisma.examRecord.count({ where }),
    prisma.examRecord.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        examType: true,
        totalQuestions: true,
        correctCount: true,
        durationSeconds: true,
        startedAt: true,
        submittedAt: true,
        practiceSource: true,
        practiceSnapshot: true,
      },
    }),
  ])
  res.json(success({ list: records.map(formatHistoryRecord), pagination: { page, pageSize, total } }))
})

// 新建页保存当前考试下的一套可重复组卷规则。
practiceNotebookRouter.post('/', requireAuth, async (req, res) => {
  try {
    const input = normalizePracticeNotebookInput(req.body)
    const notebook = await prisma.$transaction(async (tx) => {
      const { nodeIds, snapshot } = await resolveKnowledgePointSnapshot(tx, input.examType, input.knowledgePointCodes)
      await ensureNotebookQuestionCapacity(tx, input.examType, nodeIds, input.questionCount)
      return tx.practiceNotebook.create({
        data: {
          userId: req.user!.userId,
          examType: input.examType,
          name: input.name,
          knowledgePointCodes: input.knowledgePointCodes,
          knowledgePointSnapshot: snapshot as unknown as Prisma.InputJsonValue,
          questionCount: input.questionCount,
          difficultyMode: input.difficultyMode,
          durationMinutes: input.durationMinutes,
          unseenFirst: input.unseenFirst,
        },
      })
    })
    setOperationAuditContext(req, {
      resourceId: notebook.id,
      summary: `创建 ${notebook.examType} 练习本 ${notebook.name}`,
    })
    res.status(201).json(success(formatNotebookConfig(notebook)))
  } catch (error: unknown) {
    if (error instanceof PracticeNotebookBusinessError) {
      res.status(error.status).json(fail(error.message, error.code))
      return
    }
    throw error
  }
})

// 编辑页读取用户自己的完整配置和保存时知识点快照。
practiceNotebookRouter.get('/:id', requireAuth, async (req, res) => {
  const notebook = await prisma.practiceNotebook.findFirst({
    where: {
      id: req.params.id,
      userId: req.user!.userId,
      status: PRACTICE_NOTEBOOK_STATUS.ACTIVE,
    },
  })
  if (!notebook) {
    res.status(404).json(fail('练习本不存在', 'NOTEBOOK_NOT_FOUND'))
    return
  }
  res.json(success(formatNotebookConfig(notebook)))
})

// 编辑只改变未来组卷配置，已生成答卷通过自身快照保持不变。
practiceNotebookRouter.put('/:id', requireAuth, async (req, res) => {
  try {
    const existing = await prisma.practiceNotebook.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
        status: PRACTICE_NOTEBOOK_STATUS.ACTIVE,
      },
    })
    if (!existing) {
      res.status(404).json(fail('练习本不存在', 'NOTEBOOK_NOT_FOUND'))
      return
    }
    const input = normalizePracticeNotebookInput({ ...req.body, examType: existing.examType })
    const notebook = await prisma.$transaction(async (tx) => {
      const { nodeIds, snapshot } = await resolveKnowledgePointSnapshot(tx, existing.examType, input.knowledgePointCodes)
      await ensureNotebookQuestionCapacity(tx, existing.examType, nodeIds, input.questionCount)
      return tx.practiceNotebook.update({
        where: { id: existing.id },
        data: {
          name: input.name,
          knowledgePointCodes: input.knowledgePointCodes,
          knowledgePointSnapshot: snapshot as unknown as Prisma.InputJsonValue,
          questionCount: input.questionCount,
          difficultyMode: input.difficultyMode,
          durationMinutes: input.durationMinutes,
          unseenFirst: input.unseenFirst,
        },
      })
    })
    setOperationAuditContext(req, {
      resourceId: notebook.id,
      summary: `编辑 ${notebook.examType} 练习本 ${notebook.name}`,
    })
    res.json(success(formatNotebookConfig(notebook)))
  } catch (error: unknown) {
    if (error instanceof PracticeNotebookBusinessError) {
      res.status(error.status).json(fail(error.message, error.code))
      return
    }
    throw error
  }
})

// 展开练习本时按需读取已交卷历史，避免首页一次加载全部答卷。
practiceNotebookRouter.get('/:id/history', requireAuth, async (req, res) => {
  const notebook = await prisma.practiceNotebook.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
    select: { id: true },
  })
  if (!notebook) {
    res.status(404).json(fail('练习本不存在', 'NOTEBOOK_NOT_FOUND'))
    return
  }
  const page = parsePositiveInt(req.query.page, 1, 100000)
  const pageSize = parsePositiveInt(req.query.pageSize, HISTORY_PAGE_SIZE, 20)
  const where: Prisma.ExamRecordWhereInput = {
    userId: req.user!.userId,
    practiceNotebookId: notebook.id,
    status: EXAM_RECORD_STATUS.SUBMITTED,
  }
  const [total, records] = await Promise.all([
    prisma.examRecord.count({ where }),
    prisma.examRecord.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        examType: true,
        totalQuestions: true,
        correctCount: true,
        durationSeconds: true,
        startedAt: true,
        submittedAt: true,
        practiceSource: true,
        practiceSnapshot: true,
      },
    }),
  ])
  res.json(success({ list: records.map(formatHistoryRecord), pagination: { page, pageSize, total } }))
})

// 开始练习在同一事务内占用唯一活动键、动态选题、复核额度并冻结逐题顺序。
practiceNotebookRouter.post('/:id/start', requireAuth, async (req, res) => {
  try {
    const notebook = await prisma.practiceNotebook.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
        status: PRACTICE_NOTEBOOK_STATUS.ACTIVE,
      },
    })
    if (!notebook) {
      res.status(404).json(fail('练习本不存在', 'NOTEBOOK_NOT_FOUND'))
      return
    }
    const examRecord = await withQuotaTransaction(async (tx) => {
      const existingActive = await tx.examRecord.findFirst({
        where: {
          userId: req.user!.userId,
          paperId: 'question-bank',
          status: EXAM_RECORD_STATUS.IN_PROGRESS,
          activeQuestionBankKey: { not: null },
        },
        select: { id: true },
      })
      if (existingActive) {
        throw new PracticeNotebookBusinessError(
          '已有未完成练习，请先继续并交卷',
          409,
          'QUESTION_BANK_IN_PROGRESS',
          { examRecordId: existingActive.id },
        )
      }
      const plannedEntitlement = await checkMemberAccess(
        req.user!.userId,
        'question-bank',
        notebook.examType,
        notebook.questionCount,
        tx,
      )
      const resolvedQuestionCount = plannedEntitlement.allowed
        ? notebook.questionCount
        : Math.max(0, plannedEntitlement.remaining ?? 0)
      if (resolvedQuestionCount === 0) {
        throw new PracticeNotebookBusinessError(
          '当前题库额度不足，请开通会员后继续',
          403,
          'QUESTION_BANK_ACCESS_DENIED',
        )
      }
      await tx.paper.upsert({
        where: { id: 'question-bank' },
        update: { paperType: PAPER_TYPE.AI_PAPER, status: 'published' },
        create: {
          id: 'question-bank',
          title: 'Question bank practice',
          examType: notebook.examType,
          year: new Date().getFullYear(),
          duration: 60,
          paperType: PAPER_TYPE.AI_PAPER,
          status: 'published',
        },
      })
      const startedAt = new Date()
      const snapshot = {
        source: PRACTICE_SOURCE.NOTEBOOK,
        notebookId: notebook.id,
        notebookName: notebook.name,
        knowledgePoints: parseJsonArray(notebook.knowledgePointSnapshot),
        questionCount: resolvedQuestionCount,
        configuredQuestionCount: notebook.questionCount,
        difficultyMode: notebook.difficultyMode,
        durationMinutes: notebook.durationMinutes,
        unseenFirst: notebook.unseenFirst,
      }
      const record = await tx.examRecord.create({
        data: {
          userId: req.user!.userId,
          paperId: 'question-bank',
          examType: notebook.examType,
          totalQuestions: resolvedQuestionCount,
          correctCount: 0,
          startedAt,
          expiresAt: notebook.durationMinutes
            ? new Date(startedAt.getTime() + notebook.durationMinutes * 60 * 1000)
            : null,
          phase: EXAM_PHASE.CONTINUOUS,
          activeDurationSeconds: 0,
          durationSeconds: 0,
          status: EXAM_RECORD_STATUS.IN_PROGRESS,
          activeQuestionBankKey: req.user!.userId,
          practiceNotebookId: notebook.id,
          practiceSource: PRACTICE_SOURCE.NOTEBOOK,
          practiceSnapshot: snapshot as unknown as Prisma.InputJsonValue,
        },
      })
      const selection = await selectPracticeQuestions(tx, req.user!.userId, {
        ...notebook,
        questionCount: resolvedQuestionCount,
      })
      const entitlement = await checkMemberAccess(
        req.user!.userId,
        'question-bank',
        notebook.examType,
        selection.questions.length,
        tx,
      )
      if (!entitlement.allowed) {
        throw new PracticeNotebookBusinessError(
          `当前题库额度不足，剩余 ${entitlement.remaining ?? 0} 题，请开通会员后继续`,
          403,
          'QUESTION_BANK_ACCESS_DENIED',
        )
      }
      await replaceAnswerRecords(tx, record.id, selection.questions, {}, {}, {}, true)
      return record
    })
    setOperationAuditContext(req, {
      resourceId: examRecord.id,
      summary: `开始 ${notebook.examType} 练习本 ${notebook.name}`,
    })
    res.status(201).json(success({
      examRecordId: examRecord.id,
      examType: examRecord.examType,
      totalQuestions: examRecord.totalQuestions,
      startedAt: examRecord.startedAt,
      expiresAt: examRecord.expiresAt,
    }))
  } catch (error: unknown) {
    if (error instanceof PracticeNotebookBusinessError) {
      res.status(error.status).json(fail(error.message, error.code))
      return
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json(fail('已有未完成练习，请先继续并交卷', 'QUESTION_BANK_IN_PROGRESS'))
      return
    }
    throw error
  }
})
