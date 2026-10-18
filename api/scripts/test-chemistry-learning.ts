// 化学前八章精选例题与自测的契约回归：验证题源边界、答案隔离、重复来源与判分。
import assert from 'node:assert/strict'
import { prisma } from '../src/services/prisma.js'
import { chemistryLearningSources } from '../src/constants/chemistryLearningSources.js'
import { chemistryLearningSelfChecks } from '../src/constants/chemistryLearningSelfChecks.js'
import {
  chemistryQuestionWhere,
  getChemistryLearningExample,
} from '../src/services/chemistryLearning.js'
import { checkLearningSelfCheck, getLearningSelfCheck } from '../src/services/learningSelfCheck.js'

const originalMany = prisma.question.findMany
const originalFirst = prisma.question.findFirst
const annual = Object.entries(chemistryLearningSources).find(
  ([, entry]) => entry.kind === 'annual',
)!
const bank = Object.entries(chemistryLearningSources).find(([, entry]) => entry.kind === 'bank')!
const annualCheck = Object.entries(chemistryLearningSelfChecks).find(
  ([, entry]) => entry.selection?.kind === 'annual',
)!
const bankCheck = Object.entries(chemistryLearningSelfChecks).find(
  ([, entry]) => entry.selection?.kind === 'bank',
)!
assert(annual && bank && annualCheck && bankCheck, '两类题源均有实际代表题与自测')
assert.deepEqual(Object.keys(chemistryLearningSelfChecks).sort(), [
  '140101',
  '140102',
  '140103',
  '140104',
  '140105',
  '140106',
  '140201',
  '140202',
  '140203',
  '140204',
  '140205',
  '140301',
  '140302',
  '140303',
  '140304',
  '140305',
  '140401',
  '140402',
  '140403',
  '140404',
  '140405',
  '140406',
  '140407',
  '140408',
  '140409',
  '140410',
  '140411',
  '140501',
  '140502',
  '140503',
  '140504',
  '140505',
  '140506',
  '140601',
  '140602',
  '140603',
  '140604',
  '140605',
  '140606',
  '140607',
  '140701',
  '140702',
  '140703',
  '140801',
  '140802',
  '140803',
  '140804',
])
let count = 1
let reads = 0
const row = {
  id: 'chemistry-selected',
  uniqueCode: 'fixture-code',
  sourceQuestionCode: annual[0],
  paperId: 'annual-paper',
  examType: 'ESAT',
  number: 1,
  title: 'Which particle?',
  subject: 'Chemistry',
  subjectCode: '140000',
  moduleCode: 'chemistry',
  moduleQuestionNumber: 1,
  questionType: 'single_choice',
  difficulty: 'easy',
  topic: 'Atomic structure',
  topicCode: '140100',
  knowledgePoints: [],
  meta: { source: { examType: 'NSAA', year: annual[1].year }, answer: ['B'] },
  status: 'draft',
  content: {
    blocks: [{ type: 'paragraph', text: 'Which particle?' }],
    options: [
      { label: 'A', text: 'Proton' },
      { label: 'B', text: 'Electron' },
    ],
    images: [],
  },
  solution: { answer: ['A'], correctSolution: 'Submission-only explanation.' },
  paper: { title: 'Annual chemistry' },
}

try {
  prisma.question.findMany = (async (query: any) => {
    reads++
    assert.equal(query.where.examType, 'ESAT')
    if (query.where.sourceQuestionCode) {
      assert.equal(query.where.moduleCode, 'chemistry')
      assert.equal(query.where.paper.assemblyType, 'annual_subjects')
      assert.equal(query.where.paper.status, 'published')
      assert.equal(query.where.paper.paperType, 'realPaper')
      assert.equal(query.where.status, undefined, '年度题发布由试卷状态决定')
    } else {
      assert.equal(query.where.paperId, null)
      assert.equal(query.where.status, 'published')
    }
    return Array.from({ length: count }, (_, index) =>
      Object.fromEntries(
        Object.keys(query.select).map((key) => [
          key,
          key === 'id' ? `${row.id}${index || ''}` : (row as any)[key],
        ]),
      ),
    )
  }) as typeof originalMany
  prisma.question.findFirst = (async (query: any) => {
    assert.equal(query.where.paperId, null)
    assert.equal(query.where.status, 'published')
    if (query.where.id && query.where.id !== row.id) return null
    return (await prisma.question.findMany(query))[0] || null
  }) as typeof originalFirst

  assert.equal(await getChemistryLearningExample('__proto__'), null)
  assert.equal(await getChemistryLearningExample('unselected'), null)
  assert.equal(await getLearningSelfCheck('140999'), null)
  assert.equal(reads, 0)
  // 每个正式例题都经过同一无答案入口，新增章节不能绕过年度或独立题库的发布边界。
  for (const [code, selection] of Object.entries(chemistryLearningSources)) {
    const where = chemistryQuestionWhere(selection)
    if (selection.kind === 'annual') {
      assert.equal(where.sourceQuestionCode, selection.questionCode)
      assert.equal((where.paper as any).year, selection.year)
    } else {
      assert.equal(where.uniqueCode, selection.questionCode)
    }
    const result = await getChemistryLearningExample(code)
    assert(result?.question)
    if (selection.kind === 'annual') {
      assert(result.source.originLabel.includes(String(selection.year)))
      if (selection.exam) assert(result.source.originLabel.includes(selection.exam))
      if (!selection.exam || !selection.paper || !selection.questionNumber)
        assert.equal(
          result.source.originLabel.includes('第'),
          false,
          '未核准原卷位置时不得显示推测题号',
        )
    }
    assert.equal(Object.hasOwn(result.question, 'answer'), false)
    assert.equal(Object.hasOwn(result.question, 'learning_analysis'), false)
    assert.equal(JSON.stringify(result).includes('Submission-only'), false)
  }
  // 新旧47个知识点逐一验证答案隔离、题目绑定和提交后判分，保留复盘题的正常作答能力。
  for (const [code, entry] of Object.entries(chemistryLearningSelfChecks)) {
    assert(entry.selection, `${code} 应配置已审阅的自测来源`)
    const result = await getLearningSelfCheck(code)
    assert(result?.question)
    assert.equal(Object.hasOwn(result.question, 'answer'), false)
    assert.equal(await checkLearningSelfCheck(code, 'wrong-id', 'A'), null)
    assert.equal(await checkLearningSelfCheck(code, row.id, 'Z'), null)
    assert.equal((await checkLearningSelfCheck(code, row.id, 'A'))?.isCorrect, true)
    assert.equal((await checkLearningSelfCheck(code, row.id, 'B'))?.isCorrect, false)
    assert.equal(
      (await checkLearningSelfCheck(code, row.id, 'A'))?.question.learning_analysis
        .correct_solution,
      row.solution.correctSolution,
    )
  }
  count = 2
  assert.equal(await getChemistryLearningExample(annual[0]), null)
  assert.equal((await getLearningSelfCheck(annualCheck[0]))?.question, null)
  assert.equal(await checkLearningSelfCheck(annualCheck[0], row.id, 'A'), null)
  count = 0
  assert.equal(await getChemistryLearningExample(bank[0]), null)
  assert.equal((await getLearningSelfCheck(bankCheck[0]))?.question, null)
  assert.throws(() =>
    chemistryQuestionWhere({
      kind: 'annual',
      questionCode: 'invalid',
      reason: '',
    }),
  )
  console.log('化学47点映射、全部精选例题、两类题源、答案隔离、判分、重复来源及下架检查通过')
} finally {
  prisma.question.findMany = originalMany
  prisma.question.findFirst = originalFirst
  await prisma.$disconnect()
}
