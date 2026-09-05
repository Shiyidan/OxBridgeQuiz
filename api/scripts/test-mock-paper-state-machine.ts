// 模考试卷状态机回归：验证套卷状态与单项发布状态不会再次互相冒充。
import assert from 'node:assert/strict'
import {
  canClaimMockPaperSource,
  canDeleteMockPaperSet,
  canEditMockPaperComposition,
  coversEsatModuleSelection,
  deriveMockPaperReadiness,
  isMockPaperModuleAvailable,
  suiteStatusAfterPublish,
} from '../src/utils/mockPaperState.js'
import { formatMockPaperModuleTitle } from '../src/utils/mockPaperTitle.js'
import {
  indexSnapshotQuestionModules,
  parseModuleExamSnapshot,
} from '../src/services/moduleExamSession.js'

assert.equal(suiteStatusAfterPublish(false), 'draft')
assert.equal(suiteStatusAfterPublish(true), 'published')
const esatMock005Modules = [
  { code: 'maths1' },
  { code: 'maths2' },
  { code: 'chemistry' },
]
assert.equal(
  coversEsatModuleSelection(esatMock005Modules, ['maths1', 'maths2', 'chemistry']),
  true,
)
assert.equal(
  coversEsatModuleSelection(esatMock005Modules, ['maths1', 'maths2', 'physics']),
  false,
)
assert.equal(coversEsatModuleSelection(esatMock005Modules, null), false)


assert.equal(formatMockPaperModuleTitle({
  examType: 'ESAT',
  code: 'maths2',
  label: '数学2',
  sequenceNo: 6,
}), 'ESAT Math2 No.006')
assert.equal(formatMockPaperModuleTitle({
  title: '自定义数学卷',
  examType: 'ESAT',
  code: 'maths2',
  label: '数学2',
  sequenceNo: 5,
}), '自定义数学卷')

assert.deepEqual(deriveMockPaperReadiness('ESAT', [
  { code: 'maths1', validationStatus: 'valid' },
  { code: 'maths2', validationStatus: 'valid' },
  { code: 'physics', validationStatus: 'valid' },
]), {
  validationStatus: 'valid',
  readyModuleCount: 3,
  fullExamReady: true,
})
assert.deepEqual(deriveMockPaperReadiness('ESAT', [
  { code: 'maths1', validationStatus: 'valid' },
  { code: 'maths2', validationStatus: 'invalid' },
  { code: 'physics', validationStatus: 'valid' },
]), {
  validationStatus: 'invalid',
  readyModuleCount: 2,
  fullExamReady: false,
})
assert.deepEqual(deriveMockPaperReadiness('ESAT', [
  { code: 'maths1', validationStatus: 'valid' },
  { code: 'maths2', validationStatus: 'valid' },
  { code: 'physics', validationStatus: 'valid' },
  { code: 'biology', validationStatus: 'invalid' },
]), {
  validationStatus: 'invalid',
  readyModuleCount: 3,
  fullExamReady: false,
})
assert.deepEqual(deriveMockPaperReadiness('ESAT', [
  { code: 'maths1', validationStatus: 'valid' },
  { code: 'maths2', validationStatus: 'valid' },
  { code: 'physics', validationStatus: 'valid' },
  { code: 'biology', validationStatus: 'valid' },
  { code: 'chemistry', validationStatus: 'valid' },
]), {
  validationStatus: 'valid',
  readyModuleCount: 5,
  fullExamReady: true,
})
assert.deepEqual(deriveMockPaperReadiness('TMUA', [
  { code: 'paper1', validationStatus: 'valid' },
  { code: 'paper2', validationStatus: 'valid' },
]), {
  validationStatus: 'valid',
  readyModuleCount: 2,
  fullExamReady: true,
})

assert.equal(canEditMockPaperComposition('draft'), true)
assert.equal(canEditMockPaperComposition('published'), false)
assert.equal(canEditMockPaperComposition('draft', new Date()), false)

assert.equal(isMockPaperModuleAvailable({
  publicationStatus: 'published',
  validationStatus: 'valid',
  deletedAt: null,
  paperStatus: 'published',
}), true)
assert.equal(isMockPaperModuleAvailable({
  publicationStatus: 'draft',
  validationStatus: 'valid',
  deletedAt: null,
  paperStatus: 'published',
}), false)
assert.equal(isMockPaperModuleAvailable({
  publicationStatus: 'published',
  validationStatus: 'invalid',
  deletedAt: null,
  paperStatus: 'published',
}), false)

assert.equal(canDeleteMockPaperSet({ status: 'draft', examRecordCount: 0, deletedAt: null }), true)
assert.equal(isMockPaperModuleAvailable({
  publicationStatus: 'published',
  validationStatus: 'valid',
  deletedAt: new Date(),
  paperStatus: 'published',
}), true)

assert.equal(canDeleteMockPaperSet({ status: 'draft', examRecordCount: 1, deletedAt: null }), true)
assert.equal(canDeleteMockPaperSet({ status: 'published', examRecordCount: 0, deletedAt: null }), false)

assert.equal(canClaimMockPaperSource({
  sourceModuleId: null,
  composedCopyCount: 0,
  ownerModuleCount: 1,
  ownerStatus: 'draft',
  ownerDeletedAt: null,
}), false)
assert.equal(canClaimMockPaperSource({
  sourceModuleId: null,
  composedCopyCount: 1,
  ownerModuleCount: 1,
  ownerStatus: 'draft',
  ownerDeletedAt: null,
}), false)
assert.equal(canClaimMockPaperSource({
  sourceModuleId: null,
  composedCopyCount: 0,
  ownerModuleCount: 3,
  ownerStatus: 'published',
  ownerDeletedAt: null,
}), false)
assert.equal(canClaimMockPaperSource({
  sourceModuleId: null,
  composedCopyCount: 0,
  ownerModuleCount: 1,
  ownerStatus: 'published',
  ownerDeletedAt: null,
}), false)
assert.equal(canClaimMockPaperSource({
  sourceModuleId: null,
  composedCopyCount: 0,
  ownerModuleCount: 3,
  ownerStatus: 'draft',
  ownerDeletedAt: new Date(),
}), true)
assert.equal(canClaimMockPaperSource({
  sourceModuleId: null,
  composedCopyCount: 1,
  ownerModuleCount: 3,
  ownerStatus: 'draft',
  ownerDeletedAt: new Date(),
}), false)

const frozenSnapshot = parseModuleExamSnapshot({
  version: 1,
  deliveryMode: 'module_sequence',
  breakDurationSeconds: 180,
  modules: [
    {
      code: 'maths1',
      subject: '数学1',
      subjectCode: 'maths1',
      order: 1,
      durationSeconds: 2400,
      questionCount: 2,
      questionIds: ['maths1-q1', 'maths1-q2'],
    },
    {
      code: 'maths2',
      subject: '数学2',
      subjectCode: 'maths2',
      order: 2,
      durationSeconds: 2400,
      questionCount: 1,
      questionIds: ['maths2-q1'],
    },
  ],
})
assert.ok(frozenSnapshot)
const frozenQuestionModules = indexSnapshotQuestionModules(frozenSnapshot)
assert.deepEqual(
  frozenQuestionModules.get('maths1-q2'),
  { code: 'maths1', order: 1, questionNumber: 2 },
)
assert.deepEqual(
  frozenQuestionModules.get('maths2-q1'),
  { code: 'maths2', order: 2, questionNumber: 1 },
)

console.log('Mock paper state-machine regression checks passed.')
