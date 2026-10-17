// 验证考纲双语标签拆分、同名回退、内部括号和树形 JSON 迁移规则。
import assert from 'node:assert/strict'
import {
  buildBilingualSyllabusName,
  formatSyllabusLabel,
  migrateSyllabusDocumentLabels,
  readSyllabusLabels,
  splitLegacySyllabusLabel,
} from '../src/utils/syllabusLabels.js'

const coordinate = splitLegacySyllabusLabel('Coordinate geometry in the (x, y)-plane (坐标几何)')
assert.deepEqual(coordinate, {
  enLabel: 'Coordinate geometry in the (x, y)-plane',
  cnLabel: '坐标几何',
})
assert.deepEqual(splitLegacySyllabusLabel('DNA'), { enLabel: 'DNA', cnLabel: 'DNA' })
assert.equal(formatSyllabusLabel(coordinate), 'Coordinate geometry in the (x, y)-plane (坐标几何)')
assert.equal(formatSyllabusLabel({ enLabel: 'DNA', cnLabel: 'DNA' }), 'DNA')
assert.equal(buildBilingualSyllabusName('ESAT_syllabus'), 'ESAT_syllabus（双语版）')
assert.equal(buildBilingualSyllabusName('ESAT_syllabus（双语版）'), 'ESAT_syllabus（双语版）')

const migrated = migrateSyllabusDocumentLabels([
  {
    code: '100000',
    label: 'ESAT (工程与科学入学测试)',
    children: [{ code: '110000', label: 'Mathematics 1 (数学1)' }],
  },
]) as Array<Record<string, unknown>>
assert.deepEqual(migrated, [
  {
    code: '100000',
    en_label: 'ESAT',
    cn_label: '工程与科学入学测试',
    children: [{ code: '110000', en_label: 'Mathematics 1', cn_label: '数学1' }],
  },
])
assert.deepEqual(readSyllabusLabels(migrated[0]!), { enLabel: 'ESAT', cnLabel: '工程与科学入学测试' })
assert.throws(() => readSyllabusLabels({ code: '100000', label: 'ESAT (工程与科学入学测试)' }))

console.log('syllabus bilingual label tests passed')
