// 分段诊断回归测试：验证 ESAT 三模块、TMUA 两卷及并发额度/活动租约边界。
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { Prisma } from '@prisma/client'
import { prisma } from '../src/services/prisma.js'
import { hasDiagnosticPaperAccess } from '../src/services/member.js'
import {
  buildModuleExamSnapshot,
  moduleSnapshotJson,
  reconcileExpiredModuleTimeline,
  resumePausedModuleExam,
} from '../src/services/moduleExamSession.js'
import { computeScores, quickEsatScore } from '../src/services/scoring.js'
import { formatQuestionForAttempt } from '../src/routes/papers-shared.js'
import { normalizeTmuaPaperCode } from '../src/services/markdownValidator.js'

const suffix = crypto.randomUUID()
const userId = `module-test-user-${suffix}`
const paperIds = [0, 1].map((index) => `module-test-paper-${index}-${suffix}`)

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
    examType: 'ESAT',
    deliveryMode: 'module_sequence',
    breakDurationSeconds: 180,
    moduleConfig,
  }, snapshotQuestions)
  assert.equal(snapshot.modules.length, 3)
  assert.equal(snapshot.breakDurationSeconds, 180)
  assert.throws(() => buildModuleExamSnapshot({
    id: 'invalid-break',
    examType: 'ESAT',
    deliveryMode: 'module_sequence',
    breakDurationSeconds: 0,
    moduleConfig,
  }, snapshotQuestions))
  const tmuaModuleConfig = [
    {
      code: 'paper1',
      subject: 'Paper 1: Applications of Mathematical Knowledge',
      subjectCode: 'TMUA-P1',
      order: 1,
      durationSeconds: 4500,
      questionCount: 20,
    },
    {
      code: 'paper2',
      subject: 'Paper 2: Mathematical Reasoning',
      subjectCode: 'TMUA-P2',
      order: 2,
      durationSeconds: 4500,
      questionCount: 20,
    },
  ]
  const tmuaQuestions = tmuaModuleConfig.flatMap((module) => (
    Array.from({ length: 20 }, (_, index) => ({
      id: `${module.code}-${index + 1}`,
      moduleCode: module.code,
      moduleOrder: module.order,
    }))
  ))
  const tmuaSnapshot = buildModuleExamSnapshot({
    id: 'tmua-snapshot-test',
    examType: 'TMUA',
    deliveryMode: 'module_sequence',
    breakDurationSeconds: 0,
    moduleConfig: tmuaModuleConfig,
  }, tmuaQuestions)
  assert.deepEqual(tmuaSnapshot.modules.map((module) => module.code), ['paper1', 'paper2'])
  assert.equal(tmuaSnapshot.breakDurationSeconds, 0)
  assert.equal(normalizeTmuaPaperCode('TMUA-P1'), 'paper1')
  assert.equal(normalizeTmuaPaperCode('Mathematical Reasoning'), 'paper2')
  const tmuaScoring = computeScores('TMUA', [
    { subject: null, moduleCode: 'paper2', isCorrect: true },
    { subject: null, moduleCode: 'paper1', isCorrect: false },
  ])
  assert.equal(tmuaScoring.modules.find((module) => module.module === 'paper2')?.rawScore, 1)
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
    attemptPayload: {
      content_blocks: [{ type: 'paragraph', text: 'Question' }],
      images: [],
    },
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
        accessTier: index === 0 ? 'free' : 'member',
        status: 'published',
      })),
    })
    const papers = await prisma.paper.findMany({
      where: { id: { in: paperIds } },
      orderBy: { accessTier: 'asc' },
    })
    const freePaper = papers.find((paper) => paper.accessTier === 'free')
    const memberPaper = papers.find((paper) => paper.accessTier === 'member')
    assert.ok(freePaper)
    assert.ok(memberPaper)
    assert.equal(await hasDiagnosticPaperAccess(userId, freePaper), true)
    assert.equal(await hasDiagnosticPaperAccess(userId, memberPaper), false)

    await prisma.userMembership.create({
      data: {
        userId,
        examType: 'ESAT',
        plan: 'monthly',
        status: 'active',
        startsAt: new Date(Date.now() - 60_000),
        endsAt: new Date(Date.now() + 60_000),
      },
    })
    assert.equal(await hasDiagnosticPaperAccess(userId, memberPaper), true)
    await prisma.userMembership.updateMany({
      where: { userId, examType: 'ESAT' },
      data: { endsAt: new Date(Date.now() - 1_000) },
    })
    assert.equal(await hasDiagnosticPaperAccess(userId, memberPaper), false)

    await Promise.all(paperIds.map((paperId) => prisma.examRecord.create({
      data: {
        userId,
        paperId,
        examType: 'ESAT',
        startedAt: new Date(),
      },
    })))

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

    const pausedAt = new Date()
    const pausedDeadline = new Date(pausedAt.getTime() + 10 * 60 * 1000)
    await prisma.examRecord.update({
      where: { id: activeRecord.id },
      data: {
        structureSnapshot: moduleSnapshotJson(snapshot),
        phase: 'paused',
        currentModuleIndex: 0,
        phaseStartedAt: pausedAt,
        phaseExpiresAt: pausedDeadline,
        expiresAt: null,
        activeDurationSeconds: 120,
      },
    })
    await resumePausedModuleExam(activeRecord.id, userId)
    const resumedRecord = await prisma.examRecord.findUniqueOrThrow({
      where: { id: activeRecord.id },
    })
    assert.equal(resumedRecord.phase, 'answering')
    assert.ok(resumedRecord.phaseStartedAt)
    assert.ok(resumedRecord.phaseExpiresAt)
    assert.ok(
      Math.abs(
        resumedRecord.phaseExpiresAt.getTime()
          - resumedRecord.phaseStartedAt.getTime()
          - 10 * 60 * 1000,
      ) < 1000,
      '暂停恢复后必须保留冻结的剩余时间',
    )

    const breakPausedAt = new Date()
    const breakPausedDeadline = new Date(breakPausedAt.getTime() + 2 * 60 * 1000)
    await prisma.examRecord.update({
      where: { id: activeRecord.id },
      data: {
        phase: 'break_paused',
        currentModuleIndex: 1,
        phaseStartedAt: breakPausedAt,
        phaseExpiresAt: breakPausedDeadline,
        expiresAt: null,
      },
    })
    await resumePausedModuleExam(activeRecord.id, userId)
    const resumedBreakRecord = await prisma.examRecord.findUniqueOrThrow({
      where: { id: activeRecord.id },
    })
    assert.equal(resumedBreakRecord.phase, 'break')
    assert.ok(
      resumedBreakRecord.phaseStartedAt
        && resumedBreakRecord.phaseExpiresAt
        && Math.abs(
          resumedBreakRecord.phaseExpiresAt.getTime()
            - resumedBreakRecord.phaseStartedAt.getTime()
            - 2 * 60 * 1000,
        ) < 1000,
      '暂停恢复后必须保留冻结的休息剩余时间',
    )

    const firstModuleExpiredAt = new Date(Date.now() - 5 * 60 * 1000)
    await prisma.examRecord.update({
      where: { id: activeRecord.id },
      data: {
        phase: 'answering',
        currentModuleIndex: 0,
        phaseStartedAt: new Date(firstModuleExpiredAt.getTime() - 40 * 60 * 1000),
        phaseExpiresAt: firstModuleExpiredAt,
        expiresAt: firstModuleExpiredAt,
        activeDurationSeconds: 0,
      },
    })
    await reconcileExpiredModuleTimeline(activeRecord.id, userId)
    const reconciledRecord = await prisma.examRecord.findUniqueOrThrow({
      where: { id: activeRecord.id },
    })
    assert.equal(reconciledRecord.phase, 'answering')
    assert.equal(reconciledRecord.currentModuleIndex, 1)
    assert.equal(reconciledRecord.activeDurationSeconds, 40 * 60)
    assert.ok(
      reconciledRecord.phaseExpiresAt
        && reconciledRecord.phaseExpiresAt.getTime() > Date.now(),
      '恢复过期会话时应收敛到当前仍有效的模块',
    )

    console.log('Modular diagnostic regression checks passed.')
  } finally {
    await prisma.examRecord.deleteMany({ where: { userId } })
    await prisma.userMembership.deleteMany({ where: { userId } })
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
