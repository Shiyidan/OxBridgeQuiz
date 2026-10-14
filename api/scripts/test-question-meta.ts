// 统一题目结构回归：两类入库一致、旧数据无损、作答不泄题、坏批次与历史保护。
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { config } from '../src/config.js'
import { prisma } from '../src/services/prisma.js'
import { syncPaperQuestions, formatQuestionRow } from '../src/utils/questionSync.js'
import { formatQuestionForAttempt, attemptQuestionSelect } from '../src/routes/papers-shared.js'
import { mergeLegacyQuestionMeta } from './lib/questionMetaMigration.js'

assert.equal(config.runtimeEnv, 'local')
assert.ok(['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL!).hostname))
const id = `meta-${randomUUID()}`
const question = {
  code: id, examType: 'ESAT', number: 1, module_code: 'maths1', title: 'Find x.',
  question_type: 'single_choice', difficulty: 'medium',
  options: [{ label: 'A', text: '2', isCorrect: true, solution: 'SECRET' }], answer: ['A'],
  content_blocks: [{ type: 'paragraph', text: 'Find $x$.', inline: true, solution: 'SECRET' }, { type: 'image_ref', image_id: 'svg1', alt: 'Figure' }],
  images: [{ id: 'svg1', type: 'svg', svg: '<svg xmlns="http://www.w3.org/2000/svg"/>', alt: 'Figure', solution: 'SECRET' }],
  learning_analysis: { correct_solution: 'SECRET', exam_focus: 'SECRET', common_error_causes: ['SECRET'], review_guidance: 'SECRET' },
  knowledge_points: [], syllabus_points: [],
}

// 迁移必须保留未知扩展字段，拒绝冲突和坏容器，并可重复运行。
const merged = mergeLegacyQuestionMeta({ content_blocks: question.content_blocks, extension: { keep: true } }, { learning_analysis: question.learning_analysis })
assert.deepEqual(merged.meta.extension, { keep: true })
assert.deepEqual(merged.conflictKeys, [])
assert.equal(mergeLegacyQuestionMeta({ content_blocks: question.content_blocks }, merged.meta).changed, false)
assert.deepEqual(mergeLegacyQuestionMeta({ year: 2023 }, { year: 2022 }).conflictKeys, ['year'])
assert.throws(() => mergeLegacyQuestionMeta('bad JSON', {}))
assert.throws(() => mergeLegacyQuestionMeta({ images: '{}' }, {}))
assert.deepEqual(mergeLegacyQuestionMeta(JSON.stringify({ year: 2023 }), '{}').meta, { year: 2023 })

try {
  await prisma.paper.create({ data: { id, title: id, year: 2023, duration: 120, examType: 'ESAT' } })
  await prisma.questionImportBatch.create({ data: { id, title: id, fileName: 'test.json', declaredQuestionCount: 1, actualQuestionCount: 1 } })
  const [paperQuestionId] = await syncPaperQuestions(id, [question])
  const [bankQuestionId] = await syncPaperQuestions(null, [{ ...question, importBatchId: id }])
  const paperQuestion = await prisma.question.findUniqueOrThrow({ where: { id: paperQuestionId } })
  const bankQuestion = await prisma.question.findUniqueOrThrow({ where: { id: bankQuestionId } })
  assert.deepEqual(paperQuestion.meta, bankQuestion.meta)
  assert.deepEqual(paperQuestion.content, bankQuestion.content)
  assert.deepEqual(paperQuestion.solution, bankQuestion.solution)
  assert.equal(Object.hasOwn(paperQuestion, 'options'), false)
  assert.equal(Object.hasOwn(paperQuestion, 'answer'), false)
  assert.equal(Object.hasOwn(paperQuestion, 'attemptPayload'), false)
  assert.deepEqual(formatQuestionRow(paperQuestion).learning_analysis, question.learning_analysis)
  for (const questionId of [paperQuestionId, bankQuestionId]) {
    const row = await prisma.question.findUniqueOrThrow({ where: { id: questionId }, select: attemptQuestionSelect })
    const safe = formatQuestionForAttempt(row)
    assert.equal(safe.content_blocks.length, 2)
    assert.equal(safe.content_blocks[0]!.inline, true)
    assert.equal(safe.images[0]!.svg, question.images[0]!.svg)
    assert.equal(JSON.stringify(safe).includes('SECRET'), false)
    assert.equal(Object.hasOwn(safe, 'answer'), false)
    assert.equal(Object.hasOwn(safe.options[0]!, 'isCorrect'), false)
  }
  // 整批中的非法 JSON 不能删掉已有题目；独立题库追加也不应留下半批内容。
  for (const bad of [{ images: '{}' }, { content_blocks: [null] }, { answer: '["A"]' }, { learning_analysis: null }]) {
    await assert.rejects(syncPaperQuestions(id, [question, { ...question, number: 2, ...bad }]))
    assert.deepEqual(await prisma.question.findMany({ where: { paperId: id } }), [paperQuestion])
  }
  await assert.rejects(syncPaperQuestions(null, [
    { ...question, code: `${id}-new`, importBatchId: id },
    { ...question, code: `${id}-invalid`, importBatchId: id, images: null },
  ]))
  assert.equal(await prisma.question.count({ where: { importBatchId: id } }), 1)
  await prisma.user.create({ data: { id, username: id, email: `${id}@example.test`, password: 'unused' } })
  await prisma.examRecord.create({ data: { id, userId: id, paperId: id, examType: 'ESAT', totalQuestions: 1, startedAt: new Date() } })
  await assert.rejects(syncPaperQuestions(id, [question]), /已有考试记录/)
  assert.deepEqual(await prisma.question.findUnique({ where: { id: paperQuestionId } }), paperQuestion)
  console.log('question meta: shared writes, safe attempts, lossless merge, atomic validation and history protection passed')
} finally {
  await prisma.examRecord.deleteMany({ where: { id } })
  await prisma.question.deleteMany({ where: { OR: [{ paperId: id }, { importBatchId: id }] } })
  await prisma.questionImportBatch.deleteMany({ where: { id } })
  await prisma.paper.deleteMany({ where: { id } })
  await prisma.user.deleteMany({ where: { id } })
  await prisma.$disconnect()
}
