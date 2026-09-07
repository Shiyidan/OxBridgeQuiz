// 公开模考编号回归：验证考试学科隔离、真实版本、三位以上编号及严格搜索边界。
import assert from 'node:assert/strict'
import { buildMockPaperNumber, parseMockPaperNumber, parseMockPaperSequenceNo } from '../src/utils/mockPaperNumber.js'

const examples: Array<[string, string | null, string]> = [
  ['ESAT', null, 'ESAT-MOCK-005-V1'],
  ['ESAT', 'maths1', 'ESAT-MOCK-M1-005-V1'],
  ['ESAT', 'maths2', 'ESAT-MOCK-M2-005-V1'],
  ['ESAT', 'biology', 'ESAT-MOCK-B-005-V1'],
  ['ESAT', 'chemistry', 'ESAT-MOCK-C-005-V1'],
  ['ESAT', 'physics', 'ESAT-MOCK-P-005-V1'],
  ['TMUA', null, 'TMUA-MOCK-005-V1'],
  ['TMUA', 'paper1', 'TMUA-MOCK-P1-005-V1'],
  ['TMUA', 'paper2', 'TMUA-MOCK-P2-005-V1'],
]
for (const [examType, moduleCode, expected] of examples) {
  assert.equal(buildMockPaperNumber(examType, 5, 1, moduleCode), expected)
  assert.deepEqual(parseMockPaperNumber(expected), { examType, moduleCode, sequenceNo: 5, version: 1 })
}
assert.equal(buildMockPaperNumber('ESAT', 5, 2, 'maths2'), 'ESAT-MOCK-M2-005-V2')
assert.equal(buildMockPaperNumber('TMUA', 1000, 12, 'paper2'), 'TMUA-MOCK-P2-1000-V12')
assert.deepEqual(parseMockPaperNumber(' esat-mock-m2-005-v2 '), {
  examType: 'ESAT', moduleCode: 'maths2', sequenceNo: 5, version: 2,
})
for (const invalid of [
  'ESAT-MOCK-P1-005-V1', 'TMUA-MOCK-M2-005-V1', 'ESAT-MOCK-X-005-V1',
  'ESAT-MOCK-M2-000-V1', 'ESAT-MOCK-M2-005-V0', 'ESAT-MOCK-M2-005-V01',
  'ESAT-MOCK-M2-2147483648-V1', 'ESAT-MOCK-M2-005-V2147483648',
  'ESAT-MOCK-M2-005', 'ESAT-MOCK-M2-005-V1-extra', '005', 'No.005',
]) assert.equal(parseMockPaperNumber(invalid), null, `must reject invalid complete number: ${invalid}`)
for (const value of [null, undefined, 0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
  assert.equal(buildMockPaperNumber('ESAT', value, 1, 'maths2'), null)
  assert.equal(buildMockPaperNumber('ESAT', 5, value, 'maths2'), null)
}
assert.equal(buildMockPaperNumber('ESAT', 5, 1, 'paper1'), null)
assert.equal(buildMockPaperNumber('TMUA', 5, 1, 'maths2'), null)
assert.equal(buildMockPaperNumber('unknown', 5, 1), null)
assert.equal(parseMockPaperSequenceNo('005'), 5)
assert.equal(parseMockPaperSequenceNo('No.005'), 5)
assert.equal(parseMockPaperSequenceNo('ESAT-MOCK-M2-005-V1'), null)
console.log('Mock paper public number format and search parser checks passed')
