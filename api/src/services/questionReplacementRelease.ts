// 题目替换批次发布服务：在同一事务中上线新题、归档旧题并修复模考的新作答入口。
import { Prisma } from '@prisma/client'

import { QUESTION_STATUS } from '../constants/domain.js'
import {
  applyMockPaperReplacementPlan,
  findMockPaperReplacementPlan,
  MockPaperReplacementError,
  type MockPaperQuestionReplacement,
} from './mockPaperQuestionReplacement.js'
import { prisma } from './prisma.js'

export class QuestionReplacementReleaseError extends Error {
  constructor(readonly issues: string[]) {
    super(issues[0] || '题目替换批次无法发布')
  }
}

// 批次和模考计划在同一事务读取，避免并发替换从旧卷再次生成新版并覆盖先前修正。
export async function releaseQuestionReplacementBatch(batchId: string) {
  return prisma.$transaction(async (tx) => {
    const batch = await tx.questionImportBatch.findUnique({
      where: { id: batchId },
      include: {
        questions: {
          where: { paperId: null },
          include: {
            replacesQuestion: {
              select: { id: true, uniqueCode: true, examType: true, moduleCode: true, status: true },
            },
            replacementQuestion: {
              select: { uniqueCode: true, publishedAt: true },
            },
          },
        },
      },
    })
    if (!batch) throw new QuestionReplacementReleaseError(['上传包不存在'])

    const replacements = batch.questions.filter((question) => question.replacesQuestionId)
    if (!replacements.length) {
      throw new QuestionReplacementReleaseError(['上传包不包含替换题'])
    }
    const releaseIssues: string[] = []
    for (const question of batch.questions) {
      // 已有后续正式版本的题目不能被旧题包重新上线，否则题库版本链会倒退。
      if (question.replacementQuestion?.publishedAt) {
        releaseIssues.push(`${question.uniqueCode} 已有后续发布版本，请使用最新替换题包`)
      }
    }
    for (const replacement of replacements) {
      const original = replacement.replacesQuestion
      if (!original) {
        releaseIssues.push(`${replacement.uniqueCode} 缺少可追溯的原题关系`)
        continue
      }
      if (original.status !== QUESTION_STATUS.PUBLISHED && original.status !== QUESTION_STATUS.ARCHIVED) {
        releaseIssues.push(`${original.uniqueCode} 当前不是已发布或已归档状态`)
      }
      if (replacement.examType !== original.examType) {
        releaseIssues.push(`${replacement.uniqueCode} 与原题考试类型不一致`)
      }
      if (replacement.moduleCode !== original.moduleCode) {
        releaseIssues.push(`${replacement.uniqueCode} 与原题所属模块不一致`)
      }
    }
    if (releaseIssues.length) throw new QuestionReplacementReleaseError(releaseIssues)

    const replacementByOldQuestionId = new Map<string, MockPaperQuestionReplacement>(
      replacements.map((question) => [
        question.replacesQuestion!.id,
        { id: question.id, uniqueCode: question.uniqueCode },
      ]),
    )
    const plan = await findMockPaperReplacementPlan(tx, replacementByOldQuestionId)
    const releasedAt = new Date()
    const publishedQuestions = await tx.question.updateMany({
      where: { importBatchId: batch.id, paperId: null, status: { not: QUESTION_STATUS.PUBLISHED } },
      data: { status: QUESTION_STATUS.PUBLISHED, publishedAt: releasedAt, archivedAt: null },
    })
    const archivedQuestions = await tx.question.updateMany({
      where: { id: { in: [...replacementByOldQuestionId.keys()] }, status: { not: QUESTION_STATUS.ARCHIVED } },
      data: { status: QUESTION_STATUS.ARCHIVED, archivedAt: releasedAt },
    })
    // 新题状态、题目引用、模块校验及运行载体一起提交，目录不会读到半完成的换版。
    const mockResult = await applyMockPaperReplacementPlan(
      tx, plan, replacementByOldQuestionId, releasedAt,
    )
    return {
      questionCount: batch.questions.length,
      updatedQuestions: publishedQuestions.count,
      replacementCount: replacements.length,
      archivedQuestionCount: archivedQuestions.count,
      ...mockResult,
    }
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    maxWait: 10_000,
    timeout: 120_000,
  }).catch((error: unknown) => {
    if (error instanceof MockPaperReplacementError) {
      throw new QuestionReplacementReleaseError([error.message])
    }
    throw error
  })
}
