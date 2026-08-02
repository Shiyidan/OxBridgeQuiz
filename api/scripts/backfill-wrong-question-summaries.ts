// 将历史已交卷错题按答卷分批回填为错题摘要；脚本可重复执行且不会重复计数。
import { Prisma } from '@prisma/client'
import { EXAM_RECORD_STATUS } from '../src/constants/domain.js'
import { prisma } from '../src/services/prisma.js'
import { syncSubmittedWrongQuestions } from '../src/services/wrongQuestionSummary.js'

const BATCH_SIZE = 100

// 历史来源只包含已交卷且至少存在一道错误题的答卷。
function submittedWrongRecordWhere(): Prisma.ExamRecordWhereInput {
  return {
    status: EXAM_RECORD_STATUS.SUBMITTED,
    submittedAt: { not: null },
    answers: { some: { isCorrect: false } },
  }
}

// 分批处理答卷，避免迁移时一次性把全部历史答案载入 Node.js 内存。
async function backfill(): Promise<{ processedRecords: number; createdAttempts: number }> {
  let cursorId: string | undefined
  let processedRecords = 0
  let createdAttempts = 0

  while (true) {
    const records = await prisma.examRecord.findMany({
      where: submittedWrongRecordWhere(),
      orderBy: { id: 'asc' },
      take: BATCH_SIZE,
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
      select: { id: true },
    })
    if (!records.length) break

    for (const record of records) {
      createdAttempts += await prisma.$transaction((tx) => (
        syncSubmittedWrongQuestions(tx, record.id)
      ))
      processedRecords += 1
    }
    cursorId = records.at(-1)!.id
  }

  return { processedRecords, createdAttempts }
}

// 执行前后对比正式错题数，确保每条 AnswerRecord 都有唯一事件快照。
async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run')
  const sourceWhere: Prisma.AnswerRecordWhereInput = {
    isCorrect: false,
    examRecord: submittedWrongRecordWhere(),
  }
  const [sourceWrongAnswers, sourceExamRecords, existingAttempts, existingSummaries] =
    await Promise.all([
      prisma.answerRecord.count({ where: sourceWhere }),
      prisma.examRecord.count({ where: submittedWrongRecordWhere() }),
      prisma.wrongQuestionAttempt.count(),
      prisma.wrongQuestionSummary.count(),
    ])

  if (dryRun) {
    console.log(JSON.stringify({
      mode: 'dry-run',
      sourceExamRecords,
      sourceWrongAnswers,
      existingAttempts,
      existingSummaries,
      missingAttempts: Math.max(0, sourceWrongAnswers - existingAttempts),
    }, null, 2))
    return
  }

  const result = await backfill()
  const [finalAttempts, finalSummaries] = await Promise.all([
    prisma.wrongQuestionAttempt.count(),
    prisma.wrongQuestionSummary.count(),
  ])
  if (finalAttempts !== sourceWrongAnswers) {
    throw new Error(
      `Wrong-question backfill mismatch: expected ${sourceWrongAnswers} attempts, found ${finalAttempts}`,
    )
  }

  console.log(JSON.stringify({
    mode: 'write',
    ...result,
    sourceWrongAnswers,
    finalAttempts,
    finalSummaries,
  }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
