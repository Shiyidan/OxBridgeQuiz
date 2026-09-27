// 本地会话响应回归：单份题目传输、分段隔离、恢复答案与计时、SVG 无损压缩。
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { gzipSync, gunzipSync } from 'node:zlib'
import { config } from '../src/config.js'
import { prisma } from '../src/services/prisma.js'
import {
  EXAM_TYPE,
  PAPER_TYPE,
  EXAM_PHASE,
  EXAM_RECORD_STATUS,
} from '../src/constants/domain.js'
import {
  getModuleExamSession,
  moduleSnapshotJson,
  type ModuleExamSnapshot,
} from '../src/services/moduleExamSession.js'
import { syncPaperQuestions } from '../src/utils/questionSync.js'

assert.equal(config.runtimeEnv, 'local')
assert.ok(
  ['127.0.0.1', 'localhost'].includes(
    new URL(process.env.DATABASE_URL!).hostname,
  ),
)
const prefix = `payload-${randomUUID()}`
const paperIds: string[] = []
const svg = `<svg xmlns="http://www.w3.org/2000/svg"><!-- fixture-${'a'.repeat(20000)} --><path d="M0 0 L10 10"/></svg>`
try {
  await prisma.user.create({
    data: {
      id: prefix,
      username: prefix,
      email: `${prefix}@example.test`,
      password: 'unused',
    },
  })
  for (const [examType, paperType, single] of [
    [EXAM_TYPE.ESAT, PAPER_TYPE.REAL_PAPER, false],
    [EXAM_TYPE.TMUA, PAPER_TYPE.REAL_PAPER, false],
    [EXAM_TYPE.ESAT, PAPER_TYPE.MOCK_PAPER, true],
    [EXAM_TYPE.TMUA, PAPER_TYPE.MOCK_PAPER, false],
  ] as const) {
    const paperId = randomUUID()
    paperIds.push(paperId)
    await prisma.paper.create({
      data: {
        id: paperId,
        title: prefix,
        year: 2026,
        duration: 120,
        examType,
        paperType,
      },
    })
    const codes =
      examType === EXAM_TYPE.ESAT
        ? single
          ? ['biology']
          : ['maths1', 'biology', 'chemistry']
        : ['paper1', 'paper2']
    await syncPaperQuestions(
      paperId,
      codes.flatMap((code, moduleIndex) =>
        [1, 2].map((number) => ({
          id: `${paperId}-${code}-${number}`,
          number: moduleIndex * 2 + number,
          title: `Question ${code} ${number}`,
          module_code: code,
          module_order: moduleIndex + 1,
          module_question_number: number,
          options: [{ label: 'A', text: 'Choice' }],
          answer: ['A'],
          content_blocks: [{ type: 'image_ref', image_id: 'figure' }],
          images: [{ id: 'figure', type: 'svg', svg }],
          knowledge_points: [],
          syllabus_points: [],
        })),
      ),
    )
    const questions = await prisma.question.findMany({
      where: { paperId },
      orderBy: { number: 'asc' },
    })
    const snapshot: ModuleExamSnapshot = {
      version: 1,
      deliveryMode: 'module_sequence',
      breakDurationSeconds: examType === EXAM_TYPE.ESAT ? 180 : 0,
      ...(single
        ? { mockExamMode: 'single' as const, mockModuleId: paperId }
        : {}),
      modules: codes.map((code, index) => ({
        code,
        subject: code,
        subjectCode: code,
        order: index + 1,
        durationSeconds: 2400,
        questionCount: 2,
        questionIds: questions
          .filter((q) => q.moduleCode === code)
          .map((q) => q.id),
      })),
    }
    assert.ok(
      snapshot.modules.every((module) => module.questionIds.length === 2),
    )
    const deadline = new Date(Date.now() + 2400000)
    const record = await prisma.examRecord.create({
      data: {
        userId: prefix,
        paperId,
        examType,
        totalQuestions: questions.length,
        startedAt: new Date(),
        phase: EXAM_PHASE.ANSWERING,
        phaseStartedAt: new Date(),
        phaseExpiresAt: deadline,
        structureSnapshot: moduleSnapshotJson(snapshot),
        answers: {
          create: questions.map((q, index) => ({
            questionId: q.id,
            selectedAnswer: index === 0 ? 'A' : null,
            answerState: index === 0 ? 'answered' : 'unseen',
          })),
        },
      },
    })
    const answerBefore = await prisma.answerRecord.findMany({
      where: { examRecordId: record.id },
      orderBy: { id: 'asc' },
    })
    const session = await getModuleExamSession(record.id, prefix)
    assert.ok(session?.currentModule)
    assert.equal(Object.hasOwn(session.currentModule, 'questions'), false)
    assert.deepEqual(
      session.questions.map((q) => q.id),
      snapshot.modules[0]!.questionIds,
    )
    assert.equal(session.questions[0]!.images[0]!.svg, svg)
    assert.equal(session.answers[questions[0]!.id], 'A')
    const payload = JSON.stringify(session)
    assert.equal((payload.match(/fixture-/g) || []).length, 2)
    assert.equal(gunzipSync(gzipSync(payload)).toString(), payload)
    assert.ok(gzipSync(payload).length < Buffer.byteLength(payload) / 4)
    const restored = await getModuleExamSession(record.id, prefix)
    assert.equal(restored?.examRecordId, record.id)
    assert.deepEqual(restored?.answers, session.answers)
    assert.deepEqual(restored?.expiresAt, deadline)
    for (const phase of [EXAM_PHASE.PAUSED, EXAM_PHASE.BREAK]) {
      await prisma.examRecord.update({
        where: { id: record.id },
        data: { phase },
      })
      const hidden = await getModuleExamSession(record.id, prefix)
      assert.deepEqual(hidden?.questions, [])
      assert.equal(hidden?.currentModule, null)
    }
    if (codes.length > 1) {
      await prisma.examRecord.update({
        where: { id: record.id },
        data: { phase: EXAM_PHASE.ANSWERING, currentModuleIndex: 1 },
      })
      const next = await getModuleExamSession(record.id, prefix)
      assert.deepEqual(
        next?.questions.map((q) => q.id),
        snapshot.modules[1]!.questionIds,
      )
      assert.equal(Object.hasOwn(next!.currentModule!, 'questions'), false)
    }
    await prisma.examRecord.update({
      where: { id: record.id },
      data: {
        phase: EXAM_PHASE.READY_TO_SUBMIT,
        status: EXAM_RECORD_STATUS.SUBMITTED,
      },
    })
    const submitted = await getModuleExamSession(record.id, prefix)
    assert.equal(submitted?.phase, EXAM_RECORD_STATUS.SUBMITTED)
    assert.deepEqual(submitted?.questions, [])
    assert.deepEqual(
      await prisma.answerRecord.findMany({
        where: { examRecordId: record.id },
        orderBy: { id: 'asc' },
      }),
      answerBefore,
    )
    assert.equal(
      await prisma.examRecord.count({ where: { paperId, userId: prefix } }),
      1,
    )
    console.log(
      `PASS ${examType} ${paperType} ${single ? 'single' : 'full'}: one copy, restore, phases, SVG and answers preserved`,
    )
  }
} finally {
  await prisma.examRecord.deleteMany({ where: { userId: prefix } })
  await prisma.paper.deleteMany({ where: { id: { in: paperIds } } })
  await prisma.user.deleteMany({ where: { id: prefix } })
  await prisma.$disconnect()
}
