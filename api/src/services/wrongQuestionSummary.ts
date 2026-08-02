// 将已提交答卷中的错误作答同步为可数据库筛选和分页的错题摘要。
import { Prisma } from '@prisma/client'
import { EXAM_RECORD_STATUS, normalizePaperType } from '../constants/domain.js'
import { prisma } from './prisma.js'

type PrismaClientLike = Prisma.TransactionClient | typeof prisma

// 同一答卷只按 AnswerRecord.id 收录一次，支持交卷幂等与历史数据重复回填。
export async function syncSubmittedWrongQuestions(
  client: PrismaClientLike,
  examRecordId: string,
): Promise<number> {
  const record = await client.examRecord.findUnique({
    where: { id: examRecordId },
    select: {
      id: true,
      userId: true,
      examType: true,
      status: true,
      submittedAt: true,
      paper: { select: { paperType: true, title: true } },
    },
  })
  if (!record || record.status !== EXAM_RECORD_STATUS.SUBMITTED || !record.submittedAt) return 0

  const wrongAnswers = await client.answerRecord.findMany({
    where: { examRecordId: record.id, isCorrect: false },
    select: {
      id: true,
      questionId: true,
      selectedAnswer: true,
      durationSeconds: true,
      answeredAt: true,
    },
  })
  if (!wrongAnswers.length) return 0

  const recordedAttempts = await client.wrongQuestionAttempt.findMany({
    where: { answerRecordId: { in: wrongAnswers.map((answer) => answer.id) } },
    select: { answerRecordId: true },
  })
  const recordedAnswerIds = new Set(recordedAttempts.map((attempt) => attempt.answerRecordId))
  const paperType = normalizePaperType(record.paper.paperType)
  let createdCount = 0

  for (const answer of wrongAnswers) {
    if (recordedAnswerIds.has(answer.id)) continue

    const summary = await client.wrongQuestionSummary.upsert({
      where: {
        userId_questionId: {
          userId: record.userId,
          questionId: answer.questionId,
        },
      },
      create: {
        userId: record.userId,
        questionId: answer.questionId,
        examType: record.examType,
        wrongCount: 1,
        firstWrongAt: record.submittedAt,
        latestWrongAt: record.submittedAt,
        latestAnswerRecordId: answer.id,
        latestExamRecordId: record.id,
        latestSelectedAnswer: answer.selectedAnswer,
        latestDurationSeconds: answer.durationSeconds,
        latestAnsweredAt: answer.answeredAt,
        latestPaperType: paperType,
        latestPaperTitle: record.paper.title,
      },
      update: {
        wrongCount: { increment: 1 },
      },
      select: { id: true },
    })

    await client.wrongQuestionAttempt.create({
      data: {
        summaryId: summary.id,
        userId: record.userId,
        questionId: answer.questionId,
        answerRecordId: answer.id,
        examRecordId: record.id,
        examType: record.examType,
        paperType,
        submittedAt: record.submittedAt,
        selectedAnswer: answer.selectedAnswer,
      },
    })

    await client.wrongQuestionSummary.updateMany({
      where: { id: summary.id, firstWrongAt: { gt: record.submittedAt } },
      data: { firstWrongAt: record.submittedAt },
    })
    await client.wrongQuestionSummary.updateMany({
      where: { id: summary.id, latestWrongAt: { lte: record.submittedAt } },
      data: {
        examType: record.examType,
        latestWrongAt: record.submittedAt,
        latestAnswerRecordId: answer.id,
        latestExamRecordId: record.id,
        latestSelectedAnswer: answer.selectedAnswer,
        latestDurationSeconds: answer.durationSeconds,
        latestAnsweredAt: answer.answeredAt,
        latestPaperType: paperType,
        latestPaperTitle: record.paper.title,
      },
    })
    createdCount += 1
  }

  return createdCount
}
