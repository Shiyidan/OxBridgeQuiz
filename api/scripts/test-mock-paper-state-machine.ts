// 模考试卷状态机回归：验证套卷状态与单项发布状态不会再次互相冒充。
import assert from 'node:assert/strict'
import {
  canClaimMockPaperSource,
  canDeleteMockPaperSet,
  canEditMockPaperComposition,
  isMockPaperModuleAvailable,
  suiteStatusAfterPublish,
} from '../src/utils/mockPaperState.js'

assert.equal(suiteStatusAfterPublish(false), 'draft')
assert.equal(suiteStatusAfterPublish(true), 'published')

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
assert.equal(canDeleteMockPaperSet({ status: 'draft', examRecordCount: 1, deletedAt: null }), false)
assert.equal(canDeleteMockPaperSet({ status: 'published', examRecordCount: 0, deletedAt: null }), false)

assert.equal(canClaimMockPaperSource({
  sourceModuleId: null,
  composedCopyCount: 0,
  ownerModuleCount: 1,
  ownerStatus: 'draft',
  ownerDeletedAt: null,
}), true)
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

console.log('Mock paper state-machine regression checks passed.')
