
// 提供题库概览、筛选列表与诊断试卷列表接口。
import { Prisma } from '@prisma/client'
import { prisma } from '../services/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/admin.js'
import { success, fail } from '../utils/response.js'
import { syncPaperQuestions, getPaperQuestions, formatQuestionRow } from '../utils/questionSync.js'
import { parseJsonArray, parseJsonField } from '../utils/jsonField.js'
import { createNumericId } from '../utils/id.js'
import { processMarkdownImport, validateStandardPaperDocument } from '../services/markdownValidator.js'
import { checkMemberAccess } from '../services/member.js'
import { createAsyncRouter } from '../utils/asyncRouter.js'
import { logRuntimeError } from '../utils/runtimeLogger.js'
import {
  EXAM_TYPE,
  QUESTION_BANK_PAPER_TYPES,
  REAL_PAPER_TYPES,
  USER_ROLE,
  isExamType,
  isPaperType,
  isRealPaperType,
  normalizePaperType,
  paperTypeWhereValues,
} from '../constants/domain.js'

import { RawSyllabusNode, FlatSyllabusNode, levelOf, parseSyllabusJson, getSyllabusRoots, normalizeSyllabusNodes, safeParseJson, parsePositiveInt, formatQuestionForAttempt, hasStudentPaperEntitlement, applySyllabusToTree } from './papers-shared.js'
export const questionBankRouter = createAsyncRouter()

// 收集考纲节点及其所有子孙 code
async function collectDescendantCodes(code: string, examType: string): Promise<string[]> {
  const allNodes = await prisma.syllabusNode.findMany({ where: { examType } })
  const childCodes = new Set<string>([code])
  let prevSize = 0
  while (childCodes.size > prevSize) {
    prevSize = childCodes.size
    for (const n of allNodes) {
      if (n.parentCode && childCodes.has(n.parentCode)) childCodes.add(n.code)
    }
  }
  return [...childCodes]
}

async function hasSyllabusTree(examType: string): Promise<boolean> {
  const count = await prisma.syllabusNode.count({ where: { examType } })
  return count > 0
}

// 试题库轻量摘要
questionBankRouter.get('/question-bank/summary', async (req, res) => {
  try {
    const code = req.query.code as string | undefined
    const examType = (req.query.examType as string) || EXAM_TYPE.TMUA
    if (!isExamType(examType)) {
      res.status(422).json(fail('无效的考试类型'))
      return
    }
    if (!(await hasSyllabusTree(examType))) {
      res.json(success({
        total: 0,
        difficultyCount: { easy: 0, medium: 0, hard: 0, composite: 0 },
      }))
      return
    }
    const filterCodes = code ? await collectDescendantCodes(code, examType) : []

    const questions = await prisma.question.findMany({
      where: {
        examType,
        paper: { status: 'published', paperType: { in: [...QUESTION_BANK_PAPER_TYPES] } },
      },
      select: { difficulty: true, knowledgePoints: true, subjectCode: true, topicCode: true },
    })

    const diffCount: Record<string, number> = { easy: 0, medium: 0, hard: 0, composite: 0 }
    let total = 0

    for (const q of questions) {
      const level = levelOf(q.difficulty)
      if (!level || !['easy', 'medium', 'hard', 'composite'].includes(level)) continue


      if (filterCodes.length && !matchSyllabusFilter(q, filterCodes)) continue

      diffCount[level]++
      total++
    }

    res.json(success({ total, difficultyCount: diffCount }))
  } catch (e: any) {
    res.status(500).json(fail(e.message || '获取摘要失败'))
  }
})

/** 检查题目的 knowledge_points / subjectCode / topicCode 中是否有匹配的考纲 code */
function matchSyllabusFilter(
  q: { knowledgePoints?: unknown; subjectCode?: string | null; topicCode?: string | null },
  filterCodes: string[],
): boolean {
  // knowledgePoints
  const kps = parseJsonArray<{ code?: string }>(q.knowledgePoints)
  if (kps.some((kp: any) => kp.code && filterCodes.includes(kp.code))) return true
  // subjectCode / topicCode（subject / topic 层级 code）
  if (q.subjectCode && filterCodes.includes(q.subjectCode)) return true
  if (q.topicCode && filterCodes.includes(q.topicCode)) return true
  return false
}

// 试题库 — 获取已发布考卷的全部题目
questionBankRouter.get('/question-bank', requireAuth, async (req, res) => {
  try {
    const difficulty = req.query.difficulty as string | undefined
    const subject = req.query.subject as string | undefined
    const code = req.query.code as string | undefined
    const examType = (req.query.examType as string) || EXAM_TYPE.TMUA
    if (!isExamType(examType)) {
      res.status(422).json(fail('无效的考试类型'))
      return
    }
    if (!(await hasSyllabusTree(examType))) {
      res.json(success({
        questions: [],
        total: 0,
        difficultyCount: { easy: 0, medium: 0, hard: 0, composite: 0 },
        subjects: [],
      }))
      return
    }

    const where: any = {
      examType,
      paper: { status: 'published', paperType: { in: [...QUESTION_BANK_PAPER_TYPES] } },
    }
    if (subject) where.subject = subject

    const questions = await prisma.question.findMany({
      where,
      orderBy: [{ paperId: 'asc' }, { number: 'asc' }],
      include: { paper: { select: { id: true, title: true, year: true } } },
    })

    const filterCodes = code ? await collectDescendantCodes(code, examType) : []
    const isFiltered = !!(difficulty || subject || code)
    const diffCount: Record<string, number> = { easy: 0, medium: 0, hard: 0, composite: 0 }
    const subjects = new Set<string>()
    const allQuestions: any[] = []

    for (const q of questions) {
      const level = levelOf(q.difficulty)
      if (!level || !['easy', 'medium', 'hard', 'composite'].includes(level)) continue
      if (difficulty && level !== difficulty) continue

      if (filterCodes.length && !matchSyllabusFilter(q, filterCodes)) continue

      diffCount[level] = (diffCount[level] || 0) + 1
      if (!isFiltered && q.subject) subjects.add(q.subject)

      allQuestions.push({
        ...formatQuestionForAttempt(q),
        _paperId: q.paper.id,
        _paperTitle: q.paper.title,
        _paperYear: q.paper.year,
      })
    }

    if (allQuestions.length > 0) {
      const entitlement = await checkMemberAccess(
        req.user!.userId,
        'question-bank',
        examType,
        allQuestions.length,
      )
      if (!entitlement.allowed) {
        res.status(403).json(fail('当前题库额度不足，请开通会员后继续', 'QUESTION_BANK_ACCESS_DENIED'))
        return
      }
    }

    res.json(success({
      questions: allQuestions,
      total: allQuestions.length,
      difficultyCount: diffCount,

      ...(isFiltered ? {} : { subjects: [...subjects] }),
    }))
  } catch (e: any) {
    logRuntimeError('question_bank.list_failed', e)
    res.status(500).json(fail(e.message || '获取试题库失败'))
  }
})

// 诊断测试列表按试卷聚合当前用户的最新测试与报告状态。
questionBankRouter.get('/assessment/papers', requireAuth, async (req, res) => {
  try {
    const [papers, records, currentReports] = await Promise.all([
      prisma.paper.findMany({
        where: { status: 'published', paperType: { in: [...REAL_PAPER_TYPES] } },
        select: {
          id: true,
          title: true,
          code: true,
          examType: true,
          year: true,
          duration: true,
          totalQuestions: true,
          paperType: true,
          createdAt: true,
        },
        orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.examRecord.findMany({
        where: {
          userId: req.user!.userId,
          paper: { paperType: { in: [...REAL_PAPER_TYPES] }, status: 'published' },
        },
        select: {
          id: true,
          paperId: true,
          status: true,
          totalQuestions: true,
          correctCount: true,
          startedAt: true,
          expiresAt: true,
          submittedAt: true,
          durationSeconds: true,
          _count: {
            select: { answers: { where: { selectedAnswer: { not: null } } } },
          },
          diagnosticReportTask: {
            select: { status: true, stage: true, progress: true, errorMessage: true },
          },
        },
        orderBy: { startedAt: 'desc' },
      }),
      prisma.diagnosticReport.findMany({
        where: {
          userId: req.user!.userId,
          paper: { paperType: { in: [...REAL_PAPER_TYPES] }, status: 'published' },
        },
        select: { paperId: true, examRecordId: true, generationMode: true, completedAt: true },
      }),
    ])

    const latestRecordMap = new Map<string, (typeof records)[number]>()
    for (const record of records) {
      if (!latestRecordMap.has(record.paperId)) latestRecordMap.set(record.paperId, record)
    }
    const currentReportMap = new Map(currentReports.map((report) => [report.paperId, report]))

    res.json(success({
      list: papers.map((paper) => {
        const record = latestRecordMap.get(paper.id)
        const currentReport = currentReportMap.get(paper.id)
        const testStatus = record?.status === 'in_progress'
          ? 'in_progress'
          : record?.status === 'submitted'
            ? 'completed'
            : 'not_started'
        const reportStatus = record?.status === 'submitted'
          ? record.diagnosticReportTask?.status
            || (currentReport?.examRecordId === record.id ? 'completed' : 'not_generated')
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
          testStatus,
          examRecordId: record?.id || null,
          answeredCount: record?._count.answers || 0,
          correctCount: record?.status === 'submitted' ? record.correctCount : null,
          startedAt: record?.startedAt || null,
          expiresAt: record?.expiresAt || null,
          submittedAt: record?.submittedAt || null,
          durationSeconds: record?.status === 'submitted' ? record.durationSeconds : null,
          reportStatus,

          reportStage: record?.diagnosticReportTask?.stage || null,
          reportProgress: record?.diagnosticReportTask?.progress
            ?? (currentReport?.examRecordId === record?.id ? 100 : 0),
          reportErrorMessage: record?.diagnosticReportTask?.errorMessage || null,
          hasReport: Boolean(currentReport),
          reportExamRecordId: currentReport?.examRecordId || null,
          generationMode: currentReport?.generationMode || null,
          reportCompletedAt: currentReport?.completedAt || null,
        }
      }),
    }))
  } catch (e: any) {
    logRuntimeError('assessment_papers.list_failed', e)
    res.status(500).json(fail(e.message || '获取诊断测试套卷失败'))
  }
})

// 试卷详情
