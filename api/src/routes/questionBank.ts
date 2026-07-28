
// 提供诊断试卷列表及其历史记录接口；独立试题库由 questionLibraryRouter 负责。
import { prisma } from '../services/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { success, fail } from '../utils/response.js'
import { parseJsonField } from '../utils/jsonField.js'
import { createAsyncRouter } from '../utils/asyncRouter.js'
import { logRuntimeError } from '../utils/runtimeLogger.js'
import {
  EXAM_TYPE,
  PAPER_DELIVERY_MODE,
  REAL_PAPER_TYPES,
} from '../constants/domain.js'

import { parsePositiveInt } from './papers-shared.js'
export const questionBankRouter = createAsyncRouter()

// 诊断测试列表按试卷聚合当前用户的最新测试与报告状态。
questionBankRouter.get('/assessment/papers', requireAuth, async (req, res) => {
  try {
    const [papers, records] = await Promise.all([
      prisma.paper.findMany({
        where: {
          paperType: { in: [...REAL_PAPER_TYPES] },
          OR: [
            {
              status: 'published',
              OR: [
                { examType: { not: EXAM_TYPE.ESAT } },
                { deliveryMode: PAPER_DELIVERY_MODE.MODULE_SEQUENCE },
              ],
            },
            { examRecords: { some: { userId: req.user!.userId } } },
          ],
        },
        select: {
          id: true,
          title: true,
          code: true,
          examType: true,
          year: true,
          duration: true,
          totalQuestions: true,
          paperType: true,
          accessTier: true,
          deliveryMode: true,
          breakDurationSeconds: true,
          moduleConfig: true,
          assemblyType: true,
          remarks: true,
          status: true,
          createdAt: true,
        },
        orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.examRecord.findMany({
        where: {
          userId: req.user!.userId,
          paper: {
            paperType: { in: [...REAL_PAPER_TYPES] },
          },
        },
        select: {
          id: true,
          paperId: true,
          status: true,
          totalQuestions: true,
          correctCount: true,
          startedAt: true,
          expiresAt: true,
          phase: true,
          currentModuleIndex: true,
          phaseExpiresAt: true,
          submittedAt: true,
          durationSeconds: true,
          _count: {
            select: { answers: { where: { selectedAnswer: { not: null } } } },
          },
          diagnosticReportTask: {
            select: { status: true, stage: true, progress: true, errorMessage: true },
          },
          diagnosticReport: {
            select: {
              examRecordId: true,
              generationMode: true,
              completedAt: true,
            },
          },
        },
        orderBy: { startedAt: 'desc' },
      }),
    ])

    const latestRecordMap = new Map<string, (typeof records)[number]>()
    const completedAttemptCountMap = new Map<string, number>()
    for (const record of records) {
      if (!latestRecordMap.has(record.paperId)) latestRecordMap.set(record.paperId, record)
      if (record.status === 'submitted') {
        completedAttemptCountMap.set(
          record.paperId,
          (completedAttemptCountMap.get(record.paperId) || 0) + 1,
        )
      }
    }

    res.json(success({
      list: papers.map((paper) => {
        const record = latestRecordMap.get(paper.id)
        const report = record?.diagnosticReport
        const testStatus = record?.status === 'in_progress'
          ? 'in_progress'
          : record?.status === 'submitted'
            ? 'completed'
            : 'not_started'
        const reportStatus = record?.status === 'submitted'
          ? report
            ? 'completed'
            : record.diagnosticReportTask?.status || 'not_generated'
          : null

        return {
          id: paper.id,
          paperId: paper.id,
          paperName: paper.title,
          title: paper.title,
          code: paper.code,
          examType: paper.examType,
          year: paper.year,
          duration: paper.duration,
          totalQuestions: paper.totalQuestions,
          paperType: paper.paperType,
          accessTier: paper.accessTier,
          deliveryMode: paper.deliveryMode,
          breakDurationSeconds: paper.breakDurationSeconds,
          modules: parseJsonField(paper.moduleConfig, []),
          assemblyType: paper.assemblyType,
          remarks: paper.remarks,
          publicationStatus: paper.status,
          testStatus,
          examRecordId: record?.id || null,
          answeredCount: record?._count.answers || 0,
          correctCount: record?.status === 'submitted' ? record.correctCount : null,
          startedAt: record?.startedAt || null,
          expiresAt: record?.expiresAt || null,
          phase: record?.phase || null,
          currentModuleIndex: record?.currentModuleIndex ?? null,
          phaseExpiresAt: record?.phaseExpiresAt || null,
          submittedAt: record?.submittedAt || null,
          durationSeconds: record?.status === 'submitted' ? record.durationSeconds : null,
          completedAttemptCount: completedAttemptCountMap.get(paper.id) || 0,
          reportStatus,

          reportStage: record?.diagnosticReportTask?.stage || null,
          reportProgress: record?.diagnosticReportTask?.progress
            ?? (report ? 100 : 0),
          reportErrorMessage: record?.diagnosticReportTask?.errorMessage || null,
          hasReport: Boolean(report),
          reportExamRecordId: report?.examRecordId || null,
          generationMode: report?.generationMode || null,
          reportCompletedAt: report?.completedAt || null,
        }
      }),
    }))
  } catch (e: any) {
    logRuntimeError('assessment_papers.list_failed', e)
    res.status(500).json(fail(e.message || '获取诊断测试套卷失败'))
  }
})

// 历次诊断记录按交卷时间倒序返回，每一条报告只关联本次考试记录。
questionBankRouter.get('/assessment/papers/:paperId/history', requireAuth, async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1)
    const pageSize = parsePositiveInt(req.query.pageSize, 10, 50)
    const paper = await prisma.paper.findFirst({
      where: {
        id: req.params.paperId,
        paperType: { in: [...REAL_PAPER_TYPES] },
      },
      select: { id: true, title: true, examType: true, year: true },
    })
    if (!paper) {
      res.status(404).json(fail('诊断试卷不存在'))
      return
    }

    const where = {
      userId: req.user!.userId,
      paperId: paper.id,
      status: 'submitted',
    } as const
    const [total, records] = await Promise.all([
      prisma.examRecord.count({ where }),
      prisma.examRecord.findMany({
        where,
        select: {
          id: true,
          totalQuestions: true,
          correctCount: true,
          startedAt: true,
          submittedAt: true,
          durationSeconds: true,
          diagnosticReportTask: {
            select: {
              status: true,
              stage: true,
              progress: true,
              errorMessage: true,
              reportKind: true,
            },
          },
          diagnosticReport: {
            select: {
              examRecordId: true,
              generationMode: true,
              completedAt: true,
            },
          },
        },
        orderBy: [{ submittedAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])
    const totalPages = Math.ceil(total / pageSize)

    res.json(success({
      paper,
      list: records.map((record, index) => ({
        examRecordId: record.id,
        attemptNumber: total - (page - 1) * pageSize - index,
        totalQuestions: record.totalQuestions,
        correctCount: record.correctCount,
        startedAt: record.startedAt,
        submittedAt: record.submittedAt,
        durationSeconds: record.durationSeconds,
        reportStatus: record.diagnosticReport
          ? 'completed'
          : record.diagnosticReportTask?.status || 'not_generated',
        reportStage: record.diagnosticReportTask?.stage || null,
        reportProgress: record.diagnosticReportTask?.progress
          ?? (record.diagnosticReport ? 100 : 0),
        reportErrorMessage: record.diagnosticReportTask?.errorMessage || null,
        reportKind: record.diagnosticReportTask?.reportKind || paper.examType.toLowerCase(),
        hasReport: Boolean(record.diagnosticReport),
        reportCompletedAt: record.diagnosticReport?.completedAt || null,
        generationMode: record.diagnosticReport?.generationMode || null,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
    }))
  } catch (error: any) {
    logRuntimeError('assessment_papers.history_failed', error)
    res.status(500).json(fail(error.message || '获取历次诊断记录失败'))
  }
})

// 试卷详情
