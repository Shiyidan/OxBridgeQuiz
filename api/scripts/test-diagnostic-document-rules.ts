// 无数据库回归：诊断文档按实际题量校验，ESAT 正式年度支持三至五科。
import assert from 'node:assert/strict'
import { validateAnnualDocument, selectAnnualModules, ANNUAL_DOCUMENT_FORMAT } from '../src/services/annualDiagnostic.js'
import { validateStandardPaperDocument } from '../src/services/paperJsonValidator.js'

// 用不同科目题量检查数量派生，避免夹具依赖标准卷题数或本地题库。
function annual(examType: string, entries: [string, number][]) {
  const modules = entries.map(([code, count], index) => ({
    code, subject: code, subjectCode: code, order: index + 1,
    durationSeconds: examType === 'TMUA' ? 4500 : 2400, questionCount: count,
  }))
  return {
    format: ANNUAL_DOCUMENT_FORMAT,
    paper: { title: 'Diagnostic validation fixture', code: 'fixture', examType, year: 2025, accessTier: 'free', moduleConfig: modules },
    questions: modules.flatMap((module) => Array.from({ length: module.questionCount }, (_, index) => ({
      code: `${module.code}-${index + 1}`,
      content: { title: 'Calculate 1 + 1.', examType, questionType: 'single_choice', difficulty: 'easy',
        subject: module.subject, subjectCode: module.subjectCode, topic: 'Number', topicCode: '110100',
        knowledgePoints: [{ code: '110101', label: 'Arithmetic', role: 'primary' }],
        blocks: [{ type: 'paragraph', text: 'Calculate 1 + 1.' }], images: [],
        options: [{ label: 'A', text: '2' }, { label: 'B', text: '3' }] },
      solution: { answer: ['A'], correctSolution: '1 + 1 = 2.', examFocus: 'Addition', commonErrorCauses: ['Miscounting'], reviewGuidance: 'Count carefully.' },
      meta: { moduleCode: module.code, moduleOrder: module.order, moduleQuestionNumber: index + 1,
        source: { examType, year: 2025, questionCode: `${module.code}-${index + 1}` } },
    }))),
  }
}

const esat = annual('ESAT', [['maths1', 26], ['maths2', 22], ['physics', 25]])
assert.equal(validateAnnualDocument(esat).paper.totalQuestions, 73)
for (const extra of [[], [['chemistry', 1]], [['chemistry', 1], ['biology', 30]]] as [string, number][][]) {
  const document = annual('ESAT', [['maths1', 1], ['maths2', 2], ['physics', 3], ...extra])
  const validated = validateAnnualDocument(document)
  assert.equal(validated.paper.moduleConfig.length, 3 + extra.length)
}
for (const entries of [[['maths1', 1]], [['maths1', 1], ['physics', 1]], [['maths2', 1], ['physics', 1], ['chemistry', 1]]] as [string, number][][]) {
  const document = annual('ESAT', entries)
  assert.throws(() => validateAnnualDocument(document))
  assert.equal(validateAnnualDocument(document, { allowPartialEsatDraft: true }).paper.moduleConfig.length, entries.length)
}
const modules = validateAnnualDocument(esat).paper.moduleConfig
assert.deepEqual(selectAnnualModules('ESAT', modules, ['physics', 'maths1', 'maths2']).map((module) => module.questionCount), [26, 22, 25])
assert.throws(() => selectAnnualModules('ESAT', modules, ['maths1', 'physics', 'chemistry']), /尚未准备完整/)
assert.throws(() => selectAnnualModules('ESAT', modules, ['maths1', 'physics']))

for (const counts of [[1, 1], [19, 17], [20, 20], [21, 23]]) {
  const tmua = annual('TMUA', [['paper1', counts[0]!], ['paper2', counts[1]!]])
  const validated = validateAnnualDocument(tmua)
  assert.equal(validated.paper.totalQuestions, counts[0]! + counts[1]!)
  assert.deepEqual(validated.paper.moduleConfig.map((module) => module.questionCount), counts)
  assert.equal(validated.paper.duration, 150)
  // 兼容 sections 入口也应使用非空实际题量，不保留隐蔽的 20 题拦截。
  const legacy = {
    metadata: { code: 'fixture', title: 'TMUA fixture', year: 2025, examType: 'TMUA', paperType: 'realPaper', accessTier: 'free', assemblyType: 'original', deliveryMode: 'section_sequence' },
    sections: tmua.paper.moduleConfig.map((module) => ({
      code: module.code, sectionType: 'paper', order: module.order,
      questions: tmua.questions.filter((question) => question.meta.moduleCode === module.code).map((question) => ({
        code: question.code, number: question.meta.moduleQuestionNumber, title: question.content.title,
        questionType: question.content.questionType, difficulty: question.content.difficulty,
        contentBlocks: question.content.blocks, images: question.content.images, options: question.content.options,
        answer: question.solution.answer, learningAnalysis: question.solution,
        classification: { subject: 'Mathematics', subjectCode: '110000', topic: 'Number', topicCode: '110100', knowledgePoints: question.content.knowledgePoints },
        source: { examType: 'TMUA', year: 2025, sectionCode: module.code, questionNumber: question.meta.moduleQuestionNumber },
      })),
    })),
  }
  const legacyResult = validateStandardPaperDocument(legacy)
  assert.deepEqual(legacyResult.errors, [])
  assert.equal(legacyResult.questions.length, counts[0]! + counts[1]!)
}

assert.throws(() => validateAnnualDocument(annual('TMUA', [['paper1', 3]])))
assert.throws(() => validateAnnualDocument(annual('TMUA', [['paper1', 0], ['paper2', 3]])))
const wrongDuration = annual('TMUA', [['paper1', 3], ['paper2', 5]])
wrongDuration.paper.moduleConfig[0]!.durationSeconds = 2400
assert.throws(() => validateAnnualDocument(wrongDuration), /75/)
const wrongCount = structuredClone(esat)
wrongCount.paper.moduleConfig[0]!.questionCount = 27
assert.throws(() => validateAnnualDocument(wrongCount), /声明题数/)
const invalidAnswer = structuredClone(esat)
invalidAnswer.questions[0]!.solution.answer = ['Z']
assert.throws(() => validateAnnualDocument(invalidAnswer), /正确答案/)
console.log('PASS flexible diagnostic counts, three/four/five ESAT subjects, incomplete drafts, missing selections, TMUA sections, nonempty content and metadata integrity')
