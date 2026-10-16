import assert from 'node:assert/strict'
import { prisma } from '../src/services/prisma.js'
import { mockPaperSetRouter } from '../src/routes/mockPaperSets.js'

const route = (mockPaperSetRouter as any).stack.find(
  (layer: any) => layer.route?.path === '/modules/:moduleId/review',
)?.route
assert.ok(route?.methods.get)

const question = {
  id: 'question-current', uniqueCode: 'CURRENT', title: 'Area', number: 99,
  moduleCode: 'physics', moduleOrder: 8, moduleQuestionNumber: 99,
  examType: 'ESAT', difficulty: 'easy', knowledgePoints: [],
  content: {
    blocks: [{ type: 'paragraph', text: 'Find $4\\pi r^2$.' }],
    options: [{ label: 'A', text: '$4\\pi$' }],
    images: [{ id: 'circle', type: 'svg', svg: '<svg xmlns="http://www.w3.org/2000/svg"/>' }],
  },
  solution: { answer: ['A'], correctSolution: 'Current solution: $r=1$.' },
  meta: { source: { year: 2026 } },
}
let fixture: any
let calls = 0
const original = prisma.mockPaperModule.findUnique
prisma.mockPaperModule.findUnique = (async (args: any) => {
  calls++
  assert.equal(args.where.id, 'module-current')
  assert.deepEqual(args.include.questions.orderBy, { position: 'asc' })
  assert.equal(args.include.questions.include.question, true)
  return fixture
}) as typeof original

function request(): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    let status = 200
    const res = {
      status(value: number) { status = value; return res },
      json(body: any) { resolve({ status, body }) },
    }
    route.stack.at(-1).handle({ params: { moduleId: 'module-current' } }, res, reject)
  })
}

try {
  for (const publicationStatus of ['draft', 'published', 'archived']) {
    fixture = {
      code: 'maths1', moduleOrder: 1, publicationStatus,
      questions: [{ position: 2, question }, { position: 4, question: null }],
    }
    const result = await request()
    assert.equal(result.status, 200)
    assert.equal(result.body.code, 0)
    const { questions, missingCount } = result.body.data
    assert.equal(missingCount, 1)
    assert.equal(questions.length, 1)
    assert.equal(questions[0].id, question.id)
    assert.equal(questions[0].number, 2)
    assert.equal(questions[0].module_question_number, 2)
    assert.equal(questions[0].module_code, 'maths1')
    assert.equal(questions[0].module_order, 1)
    assert.deepEqual(questions[0].content_blocks, question.content.blocks)
    assert.deepEqual(questions[0].images, question.content.images)
    assert.deepEqual(questions[0].options, question.content.options)
    assert.deepEqual(questions[0].answer, ['A'])
    assert.equal(questions[0].learning_analysis.correct_solution, question.solution.correctSolution)
  }
  fixture = { code: 'paper1', moduleOrder: 1, questions: [] }
  assert.deepEqual((await request()).body.data, { questions: [], missingCount: 0 })
  fixture = null
  const missing = await request()
  assert.equal(missing.status, 404)
  assert.equal(missing.body.code, 'MOCK_PAPER_MODULE_NOT_AVAILABLE')
  assert.equal(calls, 5)
  console.log('PASS: current question content, module ordering, all publication states, missing and empty modules; no database access')
} finally {
  prisma.mockPaperModule.findUnique = original
  await prisma.$disconnect()
}
