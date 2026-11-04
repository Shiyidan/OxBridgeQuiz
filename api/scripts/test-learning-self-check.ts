// 验证精选自测白名单、作答前答案隔离、固定题号判分与下架后的停止展示。
import assert from 'node:assert/strict'
import { prisma } from '../src/services/prisma.js'
import { getLearningSelfCheck, checkLearningSelfCheck } from '../src/services/learningSelfCheck.js'
import { learningSelfCheckSelections } from '../src/constants/learningSelfChecks.js'
import { selfCheckOriginalReplacements } from '../src/constants/selfCheckOriginalReplacements.js'
import { chemistryLearningSelfChecks } from '../src/constants/chemistryLearningSelfChecks.js'
import { mathematicsLearningSelfChecks } from '../src/constants/mathematicsLearningSelfChecks.js'
import { mathematics2LearningSelfChecks } from '../src/constants/mathematics2LearningSelfChecks.js'
import { physicsLearningSelfChecks } from '../src/constants/physicsLearningSelfChecks.js'
import { tmuaLearningSelfChecks } from '../src/constants/tmuaLearning.js'

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
  // 所有真题和回忆题自测必须有替换配置，缺题也要显式记录，不能静默展示真题。
  for (const selections of [chemistryLearningSelfChecks, mathematicsLearningSelfChecks, mathematics2LearningSelfChecks, physicsLearningSelfChecks, tmuaLearningSelfChecks]) {
    for (const [code, entry] of Object.entries(selections)) {
      const selection = entry.selection
      if (selection && (selection.kind === 'annual' || /recall/i.test(selection.questionCode))) {
        assert.ok(Object.hasOwn(selfCheckOriginalReplacements, code), `${code} 缺少自研题替换配置`)
      }
    }
  }
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
  // 替换题按知识点和发布状态读取；没有自研题时不能回退到原真题。
  const replacementCode = selfCheckOriginalReplacements['140102']
  assert.ok(replacementCode)
  assert.equal(selfCheckOriginalReplacements['110701'], null)
  const replacement = { ...row, uniqueCode: replacementCode, meta: { origin: { type: 'ai_generated' } } }
  prisma.question.findFirst = (async (query: any) => {
    assert.equal(query.where.uniqueCode, replacementCode)
    assert.equal(query.where.knowledgePointLinks.some.syllabusNode.code, '140102')
    assert.equal(query.where.status, 'published')
    return Object.fromEntries(Object.keys(query.select).map(key => [key, (replacement as any)[key]]))
  }) as typeof originalFind
  const selfDeveloped = await getLearningSelfCheck('140102')
  assert.equal(selfDeveloped?.sourceLabel, '来自AceMock自研模拟题')
  assert.equal(Object.hasOwn(selfDeveloped!.question!, 'answer'), false)
  const missing = await getLearningSelfCheck('110701')
  assert.equal(missing?.question, null)
  assert.match(missing!.message, /暂未收录合适的自研模拟题/)
  console.log('精选自测白名单、答案隔离、身份核验、判分及下架检查通过')
} finally {
  prisma.question.findFirst = originalFind
  await prisma.$disconnect()
}
