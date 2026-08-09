// 审计并清理缺少完整快照的历史临时练习，供严格新格式上线前一次性执行。
import { Prisma } from '@prisma/client'
import {
  EXAM_RECORD_STATUS,
  PRACTICE_SOURCE,
  isQuestionDifficulty,
} from '../src/constants/domain.js'
import { prisma } from '../src/services/prisma.js'

const APPLY_CONFIRMATION = 'DELETE_LEGACY_TEMPORARY_PRACTICE'
const BATCH_SIZE = 200

interface CleanupOptions {
  apply: boolean
}

interface LegacyPracticeRecord {
  id: string
  userId: string
  examType: string
  totalQuestions: number
  submittedAt: Date | null
  practiceSource: string | null
  practiceSnapshot: Prisma.JsonValue | null
  missingFields: string[]
}

interface CleanupStats {
  deletedRecords: number
  deletedWrongQuestionAttempts: number
  deletedWrongQuestionSummaries: number
  rebuiltWrongQuestionSummaries: number
}

// 写模式必须同时提供固定确认短语，防止部署命令遗漏参数时误删生产数据。
function parseOptions(): CleanupOptions {
  const args = new Set(process.argv.slice(2))
  const dryRun = args.has('--dry-run')
  const apply = args.has('--apply')
  const confirmation = [...args].find((arg) => arg.startsWith('--confirm='))?.slice(10)

  if (dryRun === apply) throw new Error('必须且只能指定 --dry-run 或 --apply')
  if (apply && confirmation !== APPLY_CONFIRMATION) {
    throw new Error(`写模式必须附加 --confirm=${APPLY_CONFIRMATION}`)
  }
  return { apply }
}

// JSON 对象校验只接受普通对象，排除 null 与数组。
function isJsonObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

// 学科和知识点路径节点必须同时具备非空编码与名称。
function isScopeNode(value: unknown): value is { code: string; label: string } {
  if (!isJsonObject(value)) return false
  return typeof value.code === 'string'
    && value.code.trim().length > 0
    && typeof value.label === 'string'
    && value.label.trim().length > 0
}

// 严格检查当前临时练习页直接使用的全部快照字段，不为旧格式提供降级规则。
function missingSnapshotFields(
  snapshotValue: Prisma.JsonValue | null,
  practiceSource: string | null,
  totalQuestions: number,
): string[] {
  if (!isJsonObject(snapshotValue)) return ['snapshot']

  const missing: string[] = []
  if (snapshotValue.source !== practiceSource) missing.push('source')
  if (!isScopeNode(snapshotValue.subject)) missing.push('subject')

  const knowledgePoint = snapshotValue.knowledgePoint
  if (!isScopeNode(knowledgePoint)) {
    missing.push('knowledgePoint')
  } else {
    const path = knowledgePoint.path
    if (!Array.isArray(path) || path.length === 0 || !path.every(isScopeNode)) {
      missing.push('knowledgePoint.path')
    } else if (path.at(-1)?.code !== knowledgePoint.code) {
      missing.push('knowledgePoint.path.last')
    }
  }

  if (!isQuestionDifficulty(snapshotValue.difficulty)) {
    missing.push('difficulty')
  }
  if (!Number.isInteger(snapshotValue.plannedQuestionCount)
    || Number(snapshotValue.plannedQuestionCount) <= 0) {
    missing.push('plannedQuestionCount')
  }
  if (!Number.isInteger(snapshotValue.questionCount)
    || snapshotValue.questionCount !== totalQuestions) {
    missing.push('questionCount')
  }
  return missing
}

// 只扫描已交卷、无练习本归属且来自试题库的临时练习。
function temporaryPracticeWhere(): Prisma.ExamRecordWhereInput {
  return {
    paperId: 'question-bank',
    status: EXAM_RECORD_STATUS.SUBMITTED,
    practiceNotebookId: null,
    OR: [
      { practiceSource: null },
      {
        practiceSource: {
          in: [PRACTICE_SOURCE.DIRECT, PRACTICE_SOURCE.FREE_ASSEMBLY],
        },
      },
    ],
  }
}

// 分页读取候选答卷，避免线上历史数据较多时一次性占用过多内存。
async function findLegacyRecords(): Promise<LegacyPracticeRecord[]> {
  const result: LegacyPracticeRecord[] = []
  let cursorId: string | undefined

  while (true) {
    const records = await prisma.examRecord.findMany({
      where: temporaryPracticeWhere(),
      orderBy: { id: 'asc' },
      take: BATCH_SIZE,
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
      select: {
        id: true,
        userId: true,
        examType: true,
        totalQuestions: true,
        submittedAt: true,
        practiceSource: true,
        practiceSnapshot: true,
      },
    })
    if (!records.length) break

    for (const record of records) {
      const missingFields = missingSnapshotFields(
        record.practiceSnapshot,
        record.practiceSource,
        record.totalQuestions,
      )
      if (missingFields.length) result.push({ ...record, missingFields })
    }
    cursorId = records.at(-1)!.id
  }

  return result
}

// 删除答卷后按剩余错题尝试重建汇总，防止错题次数和最近一次记录继续引用已删数据。
async function refreshWrongQuestionSummary(
  tx: Prisma.TransactionClient,
  summaryId: string,
): Promise<'deleted' | 'rebuilt'> {
  const attempts = await tx.wrongQuestionAttempt.findMany({
    where: { summaryId },
    orderBy: [{ submittedAt: 'asc' }, { id: 'asc' }],
  })
  if (!attempts.length) {
    await tx.wrongQuestionSummary.delete({ where: { id: summaryId } })
    return 'deleted'
  }

  const firstAttempt = attempts[0]!
  const latestAttempt = attempts.at(-1)!
  const [latestAnswer, latestExam] = await Promise.all([
    tx.answerRecord.findUnique({
      where: { id: latestAttempt.answerRecordId },
      select: { durationSeconds: true, answeredAt: true },
    }),
    tx.examRecord.findUnique({
      where: { id: latestAttempt.examRecordId },
      select: { paper: { select: { title: true } } },
    }),
  ])
  if (!latestAnswer || !latestExam) {
    throw new Error(`错题汇总 ${summaryId} 的剩余尝试缺少关联答卷或答案`)
  }

  await tx.wrongQuestionSummary.update({
    where: { id: summaryId },
    data: {
      examType: latestAttempt.examType,
      wrongCount: attempts.length,
      firstWrongAt: firstAttempt.submittedAt,
      latestWrongAt: latestAttempt.submittedAt,
      latestAnswerRecordId: latestAttempt.answerRecordId,
      latestExamRecordId: latestAttempt.examRecordId,
      latestSelectedAnswer: latestAttempt.selectedAnswer,
      latestDurationSeconds: latestAnswer.durationSeconds,
      latestAnsweredAt: latestAnswer.answeredAt,
      latestPaperType: latestAttempt.paperType,
      latestPaperTitle: latestExam.paper.title,
    },
  })
  return 'rebuilt'
}

// 每条旧答卷使用独立事务删除并修复受影响汇总，失败时不会留下半完成状态。
async function deleteLegacyRecord(record: LegacyPracticeRecord): Promise<CleanupStats> {
  return prisma.$transaction(async (tx) => {
    const current = await tx.examRecord.findUnique({
      where: { id: record.id },
      select: {
        id: true,
        totalQuestions: true,
        practiceSource: true,
        practiceSnapshot: true,
        practiceNotebookId: true,
        paperId: true,
        status: true,
      },
    })
    if (!current) throw new Error(`待清理答卷 ${record.id} 已不存在，停止执行`)
    if (current.paperId !== 'question-bank'
      || current.practiceNotebookId !== null
      || current.status !== EXAM_RECORD_STATUS.SUBMITTED
      || missingSnapshotFields(
        current.practiceSnapshot,
        current.practiceSource,
        current.totalQuestions,
      ).length === 0) {
      throw new Error(`待清理答卷 ${record.id} 已不再符合旧临时练习条件，停止执行`)
    }

    const attempts = await tx.wrongQuestionAttempt.findMany({
      where: { examRecordId: record.id },
      select: { summaryId: true },
    })
    const summaryIds = [...new Set(attempts.map((attempt) => attempt.summaryId))]
    await tx.wrongQuestionAttempt.deleteMany({ where: { examRecordId: record.id } })
    await tx.examRecord.delete({ where: { id: record.id } })

    let deletedSummaries = 0
    let rebuiltSummaries = 0
    for (const summaryId of summaryIds) {
      const action = await refreshWrongQuestionSummary(tx, summaryId)
      if (action === 'deleted') deletedSummaries += 1
      else rebuiltSummaries += 1
    }

    return {
      deletedRecords: 1,
      deletedWrongQuestionAttempts: attempts.length,
      deletedWrongQuestionSummaries: deletedSummaries,
      rebuiltWrongQuestionSummaries: rebuiltSummaries,
    }
  })
}

// 汇总审计范围；写模式只处理本次审计得到且事务内再次校验仍为旧格式的记录。
async function main(): Promise<void> {
  const options = parseOptions()
  const records = await findLegacyRecords()
  const affectedUsers = new Set(records.map((record) => record.userId)).size
  const byExamType = records.reduce<Record<string, number>>((result, record) => {
    result[record.examType] = (result[record.examType] || 0) + 1
    return result
  }, {})

  if (!options.apply) {
    console.log(JSON.stringify({
      mode: 'dry-run',
      candidateRecords: records.length,
      affectedUsers,
      byExamType,
      records: records.map((record) => ({
        id: record.id,
        userId: record.userId,
        examType: record.examType,
        totalQuestions: record.totalQuestions,
        submittedAt: record.submittedAt,
        practiceSource: record.practiceSource,
        missingFields: record.missingFields,
      })),
    }, null, 2))
    return
  }

  const stats: CleanupStats = {
    deletedRecords: 0,
    deletedWrongQuestionAttempts: 0,
    deletedWrongQuestionSummaries: 0,
    rebuiltWrongQuestionSummaries: 0,
  }
  for (const record of records) {
    const result = await deleteLegacyRecord(record)
    stats.deletedRecords += result.deletedRecords
    stats.deletedWrongQuestionAttempts += result.deletedWrongQuestionAttempts
    stats.deletedWrongQuestionSummaries += result.deletedWrongQuestionSummaries
    stats.rebuiltWrongQuestionSummaries += result.rebuiltWrongQuestionSummaries
  }

  const remainingLegacyRecords = (await findLegacyRecords()).length
  if (remainingLegacyRecords !== 0) {
    throw new Error(`清理后仍有 ${remainingLegacyRecords} 条旧格式临时练习`)
  }
  console.log(JSON.stringify({
    mode: 'apply',
    auditedRecords: records.length,
    affectedUsers,
    byExamType,
    ...stats,
    remainingLegacyRecords,
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
