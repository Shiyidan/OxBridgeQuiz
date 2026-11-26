// 纯内存回归：模考导出保留完整题目内容、当前组卷题序和独立单项身份。
import assert from 'node:assert/strict'
import { buildMockPaperDocument, MockPaperExportError } from '../src/services/mockPaperExport.js'

type ExportSet = Parameters<typeof buildMockPaperDocument>[0]
type ExportModule = Parameters<typeof buildMockPaperDocument>[1][number]
const now = new Date('2026-11-26T00:00:00Z')
const set: ExportSet = {
  id: 'suite', seriesId: 'series', series: { sequenceNo: 8 }, versionGroupId: 'group',
  examType: 'ESAT', title: '中文模考试卷', accessTier: 'member', status: 'draft', version: 2,
  sourceFileName: 'source.xlsx', paperId: null, issueCount: 0, questionCount: 999, issues: [],
  createdAt: now, updatedAt: now, publishedAt: null, archivedAt: null, deletedAt: null,
}

// 使用与题库不同的题号，验证导出采用当前组卷位置且不改写题库来源。
function fixtureModule(code: string, order: number): ExportModule {
  return {
    id: code, mockPaperSetId: set.id, sourceModuleId: null, sourceModule: null,
    seriesId: `${code}-series`, series: { sequenceNo: 3 }, version: 1,
    code, label: code, title: null, accessTier: 'free', moduleOrder: order,
    durationSeconds: 2400, expectedQuestionCount: 27, questionCount: 27,
    validationStatus: 'valid', publicationStatus: 'published', issueCount: 0, issues: [],
    createdAt: now, updatedAt: now, publishedAt: now, archivedAt: null,
    questions: [2, 1].map((number, index) => ({
      id: `${code}-item-${number}`, moduleId: code, questionId: `${code}-q-${number}`,
      sourceCode: `${code}-source-${number}`, position: index + 1,
      validationStatus: 'valid', issues: [], createdAt: now, updatedAt: now,
      question: {
        id: `${code}-q-${number}`, uniqueCode: `${code}-unique-${number}`,
        sourceQuestionCode: `${code}-source-${number}`, paperId: 'original-paper',
        importBatchId: null, replacesQuestionId: null, revisionVersion: null, revisionReason: null,
        examType: 'ESAT', number: 100 + number, moduleCode: code, moduleOrder: 5,
        moduleQuestionNumber: 100 + number, title: '求 $x^2$ 的值',
        content: {
          blocks: [{ type: 'paragraph', text: '求 $x^2$ 的值' }, { type: 'image_ref', image_id: 'diagram' }],
          options: [{ label: 'A', text: '4' }],
          images: [{ id: 'diagram', type: 'svg', svg: '<svg><text>示意图</text></svg>' }],
        },
        solution: { answer: ['A'], correctSolution: { en: 'Square x.', zh: '计算平方。' }, reviewGuidance: 'Review indices' },
        subject: code, subjectCode: code, questionType: 'single_choice', difficulty: null,
        qualityTier: null, topic: null, topicCode: null, knowledgePoints: [{ code: 'M1' }],
        meta: { source: { year: 2025 }, extension: { preserve: true } },
        status: 'published', publishedAt: now, archivedAt: null, createdAt: now, updatedAt: now,
      },
    })),
  }
}

const modules = [fixtureModule('maths1', 1), fixtureModule('physics', 2)]
const before = JSON.stringify({ set, modules })
const document = JSON.parse(JSON.stringify(buildMockPaperDocument(set, modules)))
assert.equal(document.paper.code, 'ESAT-MOCK-008-V2')
assert.equal(document.paper.id, null)
assert.equal(document.paper.totalQuestions, 4)
assert.equal(document.paper.duration, 80)
assert.deepEqual(document.paper.moduleConfig.map((m: { questionCount: number }) => m.questionCount), [2, 2])
assert.deepEqual(document.questions.map((q: { code: string }) => q.code), ['maths1-unique-2', 'maths1-unique-1', 'physics-unique-2', 'physics-unique-1'])
assert.deepEqual(document.questions.map((q: { meta: Record<string, number> }) => [q.meta.number, q.meta.moduleOrder, q.meta.moduleQuestionNumber]), [[1, 1, 1], [2, 1, 2], [3, 2, 1], [4, 2, 2]])
assert.deepEqual(document.questions[0].solution, modules[0]!.questions[0]!.question!.solution)
const originalContent = modules[0]!.questions[0]!.question!.content as Record<string, unknown>
for (const key of ['blocks', 'options', 'images']) assert.deepEqual(document.questions[0].content[key], originalContent[key])
assert.equal(document.questions[0].meta.source.year, 2025)
assert.equal(document.questions[0].meta.source.questionCode, 'maths1-source-2')
assert.deepEqual(document.questions[0].meta.extension, { preserve: true })
assert.equal(JSON.stringify({ set, modules }), before)

const single = buildMockPaperDocument({ ...set, deletedAt: now }, [modules[1]!], true)
assert.equal(single.paper.exportScope, 'module')
assert.equal(single.paper.code, 'ESAT-MOCK-P-003-V1')
assert.equal(single.paper.title, 'ESAT Physics No.003')
assert.equal(single.paper.status, 'published')
assert.equal(single.paper.accessTier, 'free')
assert.equal(single.paper.totalQuestions, 2)
assert.equal(single.paper.breakDurationSeconds, 0)
assert.equal(single.questions[0]!.meta.moduleOrder, 1)

const copied = fixtureModule('maths1', 1)
copied.sourceModuleId = 'original-module'
copied.sourceModule = { id: 'original-module', code: 'maths1', label: 'Maths 1', title: '原始单项标题', version: 4, series: { sequenceNo: 12 } }
const composed = buildMockPaperDocument(set, [copied])
assert.equal(composed.paper.moduleConfig[0]!.sequenceNo, 'ESAT-MOCK-M1-012-V4')
assert.equal(composed.paper.moduleConfig[0]!.title, '原始单项标题')
assert.equal(composed.questions[0]!.meta.mockPaper.sourceModuleId, 'original-module')

assert.throws(() => buildMockPaperDocument(set, []), { code: 'MOCK_PAPER_EXPORT_EMPTY' })
assert.throws(() => buildMockPaperDocument(set, [{ ...modules[0]!, questions: [] }]), { code: 'MOCK_PAPER_EXPORT_EMPTY' })
const missing = fixtureModule('physics', 1)
missing.questions[0]!.question = null
assert.throws(() => buildMockPaperDocument(set, [missing]), (error: unknown) =>
  error instanceof MockPaperExportError && error.code === 'MOCK_PAPER_EXPORT_MISSING_QUESTIONS'
  && error.status === 422 && error.message.includes('physics-source-2'))
console.log('mock paper export: content, ordering, module identity and incomplete-paper rejection passed')
