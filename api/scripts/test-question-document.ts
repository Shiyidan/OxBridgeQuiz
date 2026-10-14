// 纯内存回归覆盖新文档往返、历史内容迁移、冲突拦截与作答嵌套白名单。
import assert from 'node:assert/strict'
import { buildQuestionStorage, canonicalQuestionToInput, formatQuestionDocument, getQuestionAnswer } from '../src/utils/questionDocument.js'
import { formatQuestionRow } from '../src/utils/questionSync.js'
import { formatQuestionForAttempt, attemptQuestionSelect } from '../src/routes/papers-shared.js'
import { migrateQuestionContent, verifyQuestionContent } from './lib/questionContentMigration.js'

const legacy = {
  id: 'stable-id', uniqueCode: 'stable-code', sourceQuestionCode: 'source-code',
  paperId: 'paper', title: 'Find x.', examType: 'ESAT', number: 20,
  moduleCode: 'physics', moduleOrder: 2, moduleQuestionNumber: 1,
  questionType: 'single_choice', difficulty: 'easy', subject: 'Physics', subjectCode: 'physics',
  knowledgePoints: [{ code: 'p1', label: 'Force' }], syllabusPoints: [{ code: 'p1', label: 'Force' }],
  options: [{ label: 'A', text: '1', secret: 'SECRET' }], answer: ['A'],
  meta: {
    code: 'source-code', source_examType: 'ENGAA', year: 2023, extension: { original: true },
    content_blocks: [{ type: 'paragraph', text: 'Find x.', inline: true, answer: 'SECRET' }],
    images: [{ id: 'f', type: 'svg', svg: '<svg/>', explanation: 'SECRET' }],
    learning_analysis: { correct_solution: 'SECRET', exam_focus: 'Force', review_guidance: 'Review', common_error_causes: ['Units'], custom: ['preserve'] },
  },
  updatedAt: new Date('2020-01-01T00:00:00Z'), content: null, solution: null,
}
const migrated = migrateQuestionContent(legacy)
const row = { ...legacy, ...migrated }
verifyQuestionContent(legacy, row)
assert.deepEqual(migrateQuestionContent(row), migrated)
assert.deepEqual(migrated.meta.extension, legacy.meta.extension)
assert.deepEqual(migrated.meta.source, { questionCode: 'source-code', examType: 'ENGAA', year: 2023 })
assert.equal(Object.hasOwn(migrated.meta, 'content_blocks'), false)
assert.equal(Object.hasOwn(migrated.meta, 'learning_analysis'), false)
assert.deepEqual(formatQuestionRow(row).learning_analysis, legacy.meta.learning_analysis)
const document = formatQuestionDocument(row)
assert.equal(document.code, legacy.uniqueCode)
assert.equal(document.meta.moduleQuestionNumber, 1)
assert.deepEqual(buildQuestionStorage(canonicalQuestionToInput(document)), { ...migrated, meta: { ...migrated.meta, revision: null } })
assert.deepEqual(getQuestionAnswer(row), ['A'])
assert.throws(() => getQuestionAnswer({ solution: {} }))
assert.throws(() => migrateQuestionContent({ ...legacy, content: { blocks: [] } }), /冲突/)
assert.throws(() => migrateQuestionContent({ ...legacy, syllabusPoints: [{ code: 'lost', label: 'Unknown' }] }), /未被/)
assert.throws(() => verifyQuestionContent(legacy, { ...row, updatedAt: new Date() }), /updatedAt/)
const safe = formatQuestionForAttempt(row)
assert.equal(JSON.stringify(safe).includes('SECRET'), false)
assert.equal(Object.hasOwn(safe, 'answer'), false)
assert.equal(Object.hasOwn(safe, 'learning_analysis'), false)
assert.equal(Object.hasOwn(attemptQuestionSelect, 'solution'), false)
assert.equal(safe.content_blocks[0]!.inline, true)
console.log('question document: lossless migration, canonical roundtrip, grading and safe projection passed')
