// 化学全考纲讲义、精选例题与自测回归：验证覆盖、题源边界、答案隔离和判分。
import assert from 'node:assert/strict'
import { prisma } from '../src/services/prisma.js'
import { chemistryLearningSources } from '../src/constants/chemistryLearningSources.js'
import { chemistryLearningSelfChecks } from '../src/constants/chemistryLearningSelfChecks.js'
import {
  chemistryQuestionWhere,
  getChemistryLearningExample,
} from '../src/services/chemistryLearning.js'
import { checkLearningSelfCheck, getLearningSelfCheck } from '../src/services/learningSelfCheck.js'
import { findKnowledgeLesson } from '../../quiz-web/src/content/knowledge/index.js'

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
  '140901',
  '140902',
  '140903',
  '141001',
  '141002',
  '141003',
  '141004',
  '141005',
  '141006',
  '141101',
  '141102',
  '141103',
  '141104',
  '141105',
  '141201',
  '141202',
  '141203',
  '141204',
  '141205',
  '141206',
  '141301',
  '141302',
  '141303',
  '141304',
  '141305',
  '141306',
  '141401',
  '141402',
  '141403',
  '141404',
  '141405',
  '141501',
  '141502',
  '141601',
  '141602',
  '141603',
  '141604',
  '141605',
  '141701',
  '141702',
  '141703',
  '141704',
])
// 前后端必须引用同一组考纲与真实题源；章节接入遗漏不能被接口的模拟数据掩盖。
for (const code of Object.keys(chemistryLearningSelfChecks)) {
  const lesson = findKnowledgeLesson('ESAT', code)
  assert(lesson, `${code} 缺少已注册讲义`)
  const section = lesson.sections.find((item) => item.code === code)
  assert(section, `${code} 缺少叶子讲解`)
  assert(section.summary && section.paragraphs.length && section.rules.length)
  assert(section.visual && section.pitfalls.length && lesson.memory.length)
  assert(section.examFocus?.examples.length, `${code} 缺少精选例题`)
  assert(section.examFocus.pastPaperSummary, `${code} 缺少真题审阅结论`)
  assert(
    section.examFocus.pastPaperPatterns?.length || section.examFocus.pastPaperNote,
    `${code} 无直接真题时须解释题源边界`,
  )
  for (const pattern of section.examFocus.pastPaperPatterns ?? []) {
    assert(pattern.sourceCodes?.length, `${code} 考法缺少真实题号依据`)
    assert.equal(new Set(pattern.sourceCodes).size, pattern.sourceCodes.length)
  }
  for (const example of section.examFocus.examples) {
    assert(example.source, `${code} 必须使用真实题源`)
    const selection = chemistryLearningSources[example.source.questionCode]
    assert(selection, `${code} 的例题未加入读取白名单`)
    assert.equal(example.source.subject, 'chemistry')
    assert.equal(example.source.kind, selection.kind)
    assert(example.answer && example.steps.length && example.takeaway)
    assert.equal(example.question, '', '原题正文从 Question 读取，不复制到讲义')
  }
  for (const sourceId of section.sourceIds) {
    assert(lesson.sources.some((source) => source.id === sourceId), `${code} 参考来源缺失`)
  }
  assert.equal(findKnowledgeLesson('TMUA', code), null)
}
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
  // 全部89个知识点逐一验证答案隔离、题目绑定和提交后判分，保留复盘题的正常作答能力。
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
  console.log('化学89点讲义与映射、全部精选例题、两类题源、答案隔离、判分、重复来源及下架检查通过')
} finally {
  prisma.question.findMany = originalMany
  prisma.question.findFirst = originalFirst
  await prisma.$disconnect()
}
