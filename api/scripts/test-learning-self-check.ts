// 验证精选自测白名单、作答前答案隔离、固定题号判分与下架后的停止展示。
import assert from 'node:assert/strict'
import { prisma } from '../src/services/prisma.js'
import { getLearningSelfCheck, checkLearningSelfCheck } from '../src/services/learningSelfCheck.js'
import { learningSelfCheckSelections } from '../src/constants/learningSelfChecks.js'

const originalFind = prisma.question.findFirst
const selected = learningSelfCheckSelections['150502']!
const row = {
  id: 'curated-question', uniqueCode: selected.questionCode, sourceQuestionCode: selected.questionCode,
  paperId: null, examType: 'ESAT', number: 1, title: '', subject: 'Biology', subjectCode: '150000',
  questionType: 'single_choice', difficulty: 'easy', topic: 'DNA', topicCode: '150500',
  knowledgePoints: [], meta: { source: {} }, status: 'published',
  content: { blocks: [{ type: 'paragraph', text: 'Choose a base.' }], options: [{ label: 'A', text: 'A' }, { label: 'B', text: 'B' }], images: [] },
  solution: { answer: ['A'], correctSolution: 'Only shown after submission.' },
}
let reads = 0
let available = true

try {
  // 模拟 Prisma 的字段投影和身份筛选，捕获无答案查询意外读取 solution 的回归。
  prisma.question.findFirst = (async (query: any) => {
    reads++
    assert.equal(query.where.paperId, null)
    assert.equal(query.where.status, 'published')
    assert.equal(query.where.examType, 'ESAT')
    assert.equal(query.where.uniqueCode, selected.questionCode)
    if (!available || (query.where.id && query.where.id !== row.id)) return null
    return Object.fromEntries(Object.keys(query.select).map(key => [key, (row as any)[key]]))
  }) as typeof originalFind

  assert.equal(await getLearningSelfCheck('__proto__'), null)
  assert.equal(await getLearningSelfCheck('unknown'), null)
  assert.equal(await checkLearningSelfCheck('unknown', row.id, 'A'), null)
  assert.equal(reads, 0)
  const gap = await getLearningSelfCheck('150103')
  assert.equal(gap?.question, null)
  assert.equal(reads, 0)

  const attempt = await getLearningSelfCheck('150502')
  assert(attempt?.question)
  assert.equal(Object.hasOwn(attempt.question, 'answer'), false)
  assert.equal(Object.hasOwn(attempt.question, 'learning_analysis'), false)
  assert.equal(JSON.stringify(attempt).includes('Only shown after submission'), false)
  assert.equal(await checkLearningSelfCheck('150502', 'another-question', 'A'), null)
  assert.equal(await checkLearningSelfCheck('150502', row.id, 'Z'), null)
  const correct = await checkLearningSelfCheck('150502', row.id, 'A')
  assert.equal(correct?.isCorrect, true)
  assert.deepEqual(correct?.question.answer, ['A'])
  assert.equal(correct?.question.learning_analysis.correct_solution, row.solution.correctSolution)
  assert.equal((await checkLearningSelfCheck('150502', row.id, 'B'))?.isCorrect, false)
  available = false
  assert.equal((await getLearningSelfCheck('150502'))?.question, null)
  assert.equal(await checkLearningSelfCheck('150502', row.id, 'A'), null)
  console.log('精选自测白名单、答案隔离、身份核验、判分及下架检查通过')
} finally {
  prisma.question.findFirst = originalFind
  await prisma.$disconnect()
}
