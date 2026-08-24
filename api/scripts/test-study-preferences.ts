// 校验学习偏好的默认考试契约、历史兼容和按考试记录往返转换，不访问数据库。
import assert from 'node:assert/strict'
import {
  buildStudyPreferences,
  expandStudyPreferences,
  type StudyPreferencesUpdate,
} from '../src/services/member.js'
import { profileStudyPreferencesSchema } from '../src/utils/authSchemas.js'

const validPreferences: StudyPreferencesUpdate = {
  examTypes: ['ESAT', 'TMUA'],
  primaryExamType: 'TMUA',
  esatSubjects: ['数学1', '数学2', '物理'],
  targetRegions: '英国',
  targetUniversities: ['剑桥大学'],
  targetMajor: '计算机科学',
  targetScores: { ESAT: 7.5, TMUA: 7 },
  examDate: '2027-10',
  weeklyHours: 18,
}

// 纯函数测试覆盖旧记录、显式默认值持久化和保存边界校验。
function main(): void {
  const legacyPreferences = buildStudyPreferences([
    { examType: 'ESAT', subjects: ['数学1', '数学2', '物理'] },
    { examType: 'TMUA', subjects: ['Paper 1', 'Paper 2'] },
  ])
  assert.equal(legacyPreferences.primaryExamType, null)

  const expandedPreferences = expandStudyPreferences(validPreferences)
  assert.equal(expandedPreferences.length, 2)
  assert.ok(expandedPreferences.every((item) => item.primaryExamType === 'TMUA'))
  assert.deepEqual(buildStudyPreferences(expandedPreferences), validPreferences)

  assert.equal(profileStudyPreferencesSchema.safeParse(validPreferences).success, true)
  assert.equal(
    profileStudyPreferencesSchema.safeParse({
      ...validPreferences,
      examTypes: ['ESAT'],
      primaryExamType: 'TMUA',
    }).success,
    false,
  )
  assert.equal(
    profileStudyPreferencesSchema.safeParse({
      ...validPreferences,
      primaryExamType: 'STEP',
    }).success,
    false,
  )
  assert.equal(
    profileStudyPreferencesSchema.safeParse({
      ...validPreferences,
      primaryExamType: null,
    }).success,
    false,
  )
  assert.throws(
    () =>
      expandStudyPreferences({
        ...validPreferences,
        examTypes: ['ESAT'],
      }),
    /默认学习考试必须属于目标考试/,
  )

  console.log('Study preference primary exam contract tests passed.')
}

main()
