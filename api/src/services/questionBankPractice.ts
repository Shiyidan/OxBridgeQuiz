// 试题库直接练习：权限、选题、固定题目与活动记录在同一事务中提交。
import crypto from 'node:crypto'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from './prisma.js'
import { withQuotaTransaction } from './transactionRetry.js'
import { checkMemberAccess } from './member.js'
import { assertAccountActive } from './accountStatus.js'
import { AuthError } from '../utils/authError.js'
import { AUTH_ERROR, AUTH_SESSION_EXPIRED_MESSAGE } from '../constants/auth.js'
import {
  EXAM_TYPE,
  EXAM_PHASE,
  EXAM_RECORD_STATUS,
  PAPER_TYPE,
  QUESTION_STATUS,
  QUESTION_DIFFICULTY,
  PRACTICE_SOURCE,
  QUESTION_BANK_DIRECT_PRACTICE_COUNT,
  QUESTION_BANK_MEMBERSHIP_MESSAGE,
  isQuestionDifficulty,
  type QuestionDifficulty,
} from '../constants/domain.js'
import type {
  QuestionBankPracticeSnapshot,
  QuestionBankSelectionScopeNode,
} from './questionBankSelection.js'

type DatabaseClient = Prisma.TransactionClient | typeof prisma

export const directPracticeSchema = z
  .object({
    examType: z.enum([EXAM_TYPE.ESAT, EXAM_TYPE.TMUA]),
    difficulty: z.enum([QUESTION_DIFFICULTY.EASY, QUESTION_DIFFICULTY.MEDIUM, QUESTION_DIFFICULTY.HARD]),
    code: z.string().trim().max(191).optional(),
    requestId: z
      .string()
      .min(8)
      .max(80)
      .regex(/^[A-Za-z0-9_-]+$/),
  })
  .strict()

export class QuestionBankPracticeError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message)
  }
}

// 更新用户时间取得行锁，所有题库开始入口按同一用户串行判断活动记录。
export async function lockQuestionBankUser(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<void> {
  const user = await tx.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!user) throw new AuthError(AUTH_ERROR.SESSION_EXPIRED, AUTH_SESSION_EXPIRED_MESSAGE, 401)
  const locked = await tx.user.update({
    where: { id: userId },
    data: { updatedAt: new Date() },
    select: { accountStatus: true },
  })
  assertAccountActive(locked)
}

// 恢复其他考试或练习本时，也按原记录的考试类型验证当前会员资格。
async function assertPracticeMembership(
  tx: Prisma.TransactionClient,
  userId: string,
  examType: string,
  count: number,
): Promise<void> {
  const entitlement = await checkMemberAccess(userId, 'question-bank', examType, count, tx)
  if (!entitlement.allowed)
    throw new QuestionBankPracticeError(
      QUESTION_BANK_MEMBERSHIP_MESSAGE,
      403,
      'QUESTION_BANK_ACCESS_DENIED',
    )
}

// 父级考纲筛选先解析成节点 id，题目筛选和统计再通过关联表在数据库中完成。
async function collectDescendantNodeIds(
  code: string,
  examType: string,
  db: DatabaseClient,
): Promise<string[]> {
  if (!code) return []
  const nodes = await db.syllabusNode.findMany({
    where: { examType },
    select: { id: true, code: true, parentCode: true },
  })
  if (!nodes.some((node) => node.code === code)) return []
  const codes = new Set([code])
  let expanded = true
  while (expanded) {
    expanded = false
    for (const node of nodes) {
      if (node.parentCode && codes.has(node.parentCode) && !codes.has(node.code)) {
        codes.add(node.code)
        expanded = true
      }
    }
  }
  return nodes.filter((node) => codes.has(node.code)).map((node) => node.id)
}

// 临时练习范围由服务端考纲和实际选题生成，在创建练习的同一事务内写入答卷快照。
async function buildDirectPracticeSnapshot(
  examType: string,
  code: string,
  difficulty: QuestionDifficulty,
  plannedQuestionCount: number,
  rows: Array<{
    subject: string | null
    subjectCode: string | null
  }>,
  db: DatabaseClient,
): Promise<QuestionBankPracticeSnapshot> {
  let subject: QuestionBankSelectionScopeNode | null = null
  let knowledgePoint: QuestionBankPracticeSnapshot['knowledgePoint'] = null
  if (code) {
    const nodes = await db.syllabusNode.findMany({
      where: { examType },
      select: { code: true, label: true, parentCode: true },
    })
    const nodeMap = new Map(nodes.map((node) => [node.code, node]))
    const requestedNode = nodeMap.get(code)
    if (requestedNode) {
      const lineage = [requestedNode]
      const visited = new Set([requestedNode.code])
      let current = requestedNode.parentCode ? nodeMap.get(requestedNode.parentCode) : undefined
      while (current && !visited.has(current.code)) {
        lineage.unshift(current)
        visited.add(current.code)
        current = current.parentCode ? nodeMap.get(current.parentCode) : undefined
      }
      const scopedLineage =
        lineage.length > 1 && lineage[0]?.parentCode === null ? lineage.slice(1) : lineage
      const path = (scopedLineage.length ? scopedLineage : [requestedNode]).map((node) => ({
        code: node.code,
        label: node.label,
      }))
      subject = path[0] || null
      knowledgePoint = {
        code: requestedNode.code,
        label: requestedNode.label,
        path,
      }
    }
  }

  if (!subject) {
    const subjects = new Map<string, QuestionBankSelectionScopeNode>()
    for (const row of rows) {
      const label = String(row.subject || '').trim()
      if (!label) continue
      const subjectCode = String(row.subjectCode || label).trim()
      subjects.set(subjectCode, { code: subjectCode, label })
    }
    if (subjects.size === 1) subject = [...subjects.values()][0] || null
  }

  return {
    source: PRACTICE_SOURCE.DIRECT,
    subject,
    knowledgePoint,
    difficulty,
    plannedQuestionCount,
    questionCount: rows.length,
  }
}

// 学生端查询只允许命中已发布的独立题目，并按可选考纲节点和难度缩小范围。
export async function buildPublishedQuestionWhere(
  query: Record<string, unknown>,
  db: DatabaseClient = prisma,
): Promise<Prisma.QuestionWhereInput> {
  const examType = String(query.examType || EXAM_TYPE.TMUA).toUpperCase()
  const code = String(query.code || '').trim()
  const difficulty = String(query.difficulty || '').trim()
  const where: Prisma.QuestionWhereInput = {
    paperId: null,
    status: QUESTION_STATUS.PUBLISHED,
    examType,
  }
  if (isQuestionDifficulty(difficulty)) where.difficulty = difficulty
  if (code) {
    const nodeIds = await collectDescendantNodeIds(code, examType, db)
    where.knowledgePointLinks = nodeIds.length
      ? { some: { syllabusNodeId: { in: nodeIds } } }
      : { some: { syllabusNodeId: '__missing__' } }
  }
  return where
}

// 创建请求绑定固定记录；活动练习优先恢复，不能用新请求号或筛选条件反复换题。
export async function startDirectQuestionBankPractice(
  userId: string,
  input: z.infer<typeof directPracticeSchema>,
) {
  const startRequestKey =
    'question-bank:' +
    crypto
      .createHash('sha256')
      .update(userId + ':' + input.requestId)
      .digest('hex')
  return withQuotaTransaction(async (tx) => {
    await lockQuestionBankUser(tx, userId)
    const previous = await tx.examRecord.findUnique({ where: { startRequestKey } })
    if (previous) {
      await assertPracticeMembership(tx, userId, previous.examType, previous.totalQuestions)
      return { record: previous, isResumed: true }
    }
    const active = await tx.examRecord.findFirst({
      where: {
        userId,
        paperId: 'question-bank',
        activeQuestionBankKey: { not: null },
        status: EXAM_RECORD_STATUS.IN_PROGRESS,
      },
    })
    if (active) {
      await assertPracticeMembership(tx, userId, active.examType, active.totalQuestions)
      return { record: active, isResumed: true }
    }
    await assertPracticeMembership(tx, userId, input.examType, QUESTION_BANK_DIRECT_PRACTICE_COUNT)
    const where = {
      ...(await buildPublishedQuestionWhere(input, tx)),
      questionType: 'single_choice',
    }
    const total = await tx.question.count({ where })
    const take = Math.min(total, QUESTION_BANK_DIRECT_PRACTICE_COUNT)
    if (!take)
      throw new QuestionBankPracticeError(
        '当前条件下暂无可练习题目，请重新选择',
        422,
        'QUESTION_BANK_EMPTY',
      )
    const skip = crypto.randomInt(total - take + 1)
    // 创建成功前只读选题所需元数据，不读取或返回题干、选项及答案。
    const rows = await tx.question.findMany({
      where,
      orderBy: { id: 'asc' },
      skip,
      take,
      select: { id: true, subject: true, subjectCode: true },
    })
    if (!rows.length)
      throw new QuestionBankPracticeError(
        '当前条件下暂无可练习题目，请重新选择',
        422,
        'QUESTION_BANK_EMPTY',
      )
    const snapshot = await buildDirectPracticeSnapshot(
      input.examType,
      input.code || '',
      input.difficulty,
      take,
      rows,
      tx,
    )
    await tx.paper.upsert({
      where: { id: 'question-bank' },
      update: {},
      create: {
        id: 'question-bank',
        title: 'Question bank practice',
        examType: EXAM_TYPE.TMUA,
        year: new Date().getFullYear(),
        duration: 60,
        paperType: PAPER_TYPE.AI_PAPER,
        status: QUESTION_STATUS.PUBLISHED,
      },
    })
    const record = await tx.examRecord.create({
      data: {
        userId,
        paperId: 'question-bank',
        examType: input.examType,
        totalQuestions: rows.length,
        startedAt: new Date(),
        phase: EXAM_PHASE.CONTINUOUS,
        status: EXAM_RECORD_STATUS.IN_PROGRESS,
        activeQuestionBankKey: userId,
        startRequestKey,
        practiceSource: PRACTICE_SOURCE.DIRECT,
        practiceSnapshot: snapshot as unknown as Prisma.InputJsonValue,
        answers: {
          create: rows.map((question, position) => ({ questionId: question.id, position })),
        },
      },
    })
    return { record, isResumed: false }
  })
}
