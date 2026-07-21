// 模块化诊断回归测试：验证三模块快照、ESAT 分科评分和并发额度/活动租约边界。
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { Prisma } from '@prisma/client'
import { prisma } from '../src/services/prisma.js'
import { checkMemberAccess } from '../src/services/member.js'
import { buildModuleExamSnapshot } from '../src/services/moduleExamSession.js'
import { computeScores, quickEsatScore } from '../src/services/scoring.js'
import { withQuotaTransaction } from '../src/services/transactionRetry.js'
import { formatQuestionForAttempt } from '../src/routes/papers-shared.js'

const suffix = crypto.randomUUID()
const userId = `module-test-user-${suffix}`
const paperIds = [0, 1].map((index) => `module-test-paper-${index}-${suffix}`)

// 与正式交卷相同：先锁用户行，再在同一串行事务中校验额度和认领记录。
async function claimDiagnostic(recordId: string): Promise<boolean> {
  return withQuotaTransaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { updatedAt: new Date() } })
    const access = await checkMemberAccess(userId, 'diagnostic', 'ESAT', 1, tx)
    if (!access.allowed) return false
    const claimed = await tx.examRecord.updateMany({
      where: { id: recordId, status: 'in_progress' },
      data: { status: 'submitted', submittedAt: new Date(), activeDiagnosticKey: null },
    })
    return claimed.count === 1
  })
}

async function main(): Promise<void> {
  const moduleConfig = ['maths1', 'physics', 'maths2'].map((code, index) => ({
    code,
    subject: code,
    subjectCode: ['110000', '130000', '120000'][index],
    order: index + 1,
    durationSeconds: 2400,
    questionCount: 2,
  }))
  const snapshotQuestions = moduleConfig.flatMap((module) => [1, 2].map((number) => ({
    id: `${module.code}-${number}`,
    moduleCode: module.code,
    moduleOrder: module.order,
  })))
  const snapshot = buildModuleExamSnapshot({
    id: 'snapshot-test',
    deliveryMode: 'module_sequence',
    breakDurationSeconds: 180,
    moduleConfig,
  }, snapshotQuestions)
  assert.equal(snapshot.modules.length, 3)
  assert.equal(snapshot.breakDurationSeconds, 180)
  assert.throws(() => buildModuleExamSnapshot({
    id: 'invalid-break',
    deliveryMode: 'module_sequence',
    breakDurationSeconds: 0,
    moduleConfig,
  }, snapshotQuestions))
  assert.equal(quickEsatScore('maths1', 2, 2), quickEsatScore('maths1', 27, 27))
  assert.equal(computeScores('ESAT', [
    { subject: 'Mathematics 1', moduleCode: 'maths1', isCorrect: true },
  ]).overallScore, null)
  const safeQuestion = formatQuestionForAttempt({
    id: 'safe-projection',
    uniqueCode: 'safe-projection',
    sourceQuestionCode: 'source-safe-projection',
    examType: 'ESAT',
    number: 1,
    moduleCode: 'maths1',
    moduleOrder: 1,
    moduleQuestionNumber: 1,
    title: 'Question',
    options: [{ label: 'A', text: 'Option', isCorrect: true, solution: 'secret' }],
    answer: ['A'],
    subject: 'Mathematics 1',
    subjectCode: '110000',
    questionType: 'single_choice',
    difficulty: 'medium',
    topic: null,
    topicCode: null,
    knowledgePoints: [],
    syllabusPoints: [],
    meta: {
      content_blocks: [{ type: 'paragraph', text: 'Question', solution: 'secret' }],
      images: [],
      learning_analysis: { correct_solution: 'secret' },
    },
  })
  assert.equal(Object.prototype.hasOwnProperty.call(safeQuestion, 'answer'), false)
  assert.equal(Object.prototype.hasOwnProperty.call(safeQuestion, 'learning_analysis'), false)
  assert.equal(Object.prototype.hasOwnProperty.call(safeQuestion.options[0], 'isCorrect'), false)
  assert.equal(Object.prototype.hasOwnProperty.call(safeQuestion.content_blocks[0], 'solution'), false)

  try {
    await prisma.user.create({
      data: {
        id: userId,
        username: `module-test-${suffix}`,
        email: `module-test-${suffix}@example.invalid`,
        password: 'not-a-login-account',
      },
    })
    await prisma.paper.createMany({
      data: paperIds.map((id, index) => ({
        id,
        title: `Module diagnostic test ${index}`,
        examType: 'ESAT',
        year: 2023,
        duration: 120,
        paperType: 'realPaper',
        status: 'published',
      })),
    })
    const records = await Promise.all(paperIds.map((paperId) => prisma.examRecord.create({
      data: {
        userId,
        paperId,
        examType: 'ESAT',
        startedAt: new Date(),
      },
    })))

    const claimResults = await Promise.all(records.map((record) => claimDiagnostic(record.id)))
    assert.equal(claimResults.filter(Boolean).length, 1, '并发免费诊断只能有一次提交成功')

    const activeRecord = await prisma.examRecord.findFirstOrThrow({
      where: { userId, status: 'in_progress' },
    })
    const activeKey = `${userId}:ESAT`
    await prisma.examRecord.update({
      where: { id: activeRecord.id },
      data: { activeDiagnosticKey: activeKey },
    })
    await assert.rejects(
      prisma.examRecord.create({
        data: {
          userId,
          paperId: activeRecord.paperId,
          examType: 'ESAT',
          startedAt: new Date(),
          activeDiagnosticKey: activeKey,
        },
      }),
      (error: unknown) => error instanceof Prisma.PrismaClientKnownRequestError
        && error.code === 'P2002',
    )

    console.log('Modular diagnostic regression checks passed.')
  } finally {
    await prisma.examRecord.deleteMany({ where: { userId } })
    await prisma.paper.deleteMany({ where: { id: { in: paperIds } } })
    await prisma.user.deleteMany({ where: { id: userId } })
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
