// 网站访问聚合纯函数测试：覆盖历史空身份回退、显式身份分类与每日趋势。
import assert from 'node:assert/strict'
import {
  aggregateWebsiteTraffic,
  aggregateRegistrationExamPreferences,
  WEBSITE_VISITOR_TYPE,
  type WebsiteVisitSample,
} from '../src/services/websiteTraffic.js'

const filters = {
  startAt: new Date('2026-08-31T16:00:00.000Z'),
  endAt: new Date('2026-09-03T16:00:00.000Z'),
}

// 三天分别模拟历史空身份、匿名访客与登录学生，验证分类不会遗漏历史记录。
function main(): void {
  const visits: WebsiteVisitSample[] = [
    {
      businessDate: new Date('2026-09-01T00:00:00.000Z'),
      ipHash: 'legacy-null-visitor',
      visitorType: null,
    },
    {
      businessDate: new Date('2026-09-02T00:00:00.000Z'),
      ipHash: 'anonymous-visitor',
      visitorType: WEBSITE_VISITOR_TYPE.ANONYMOUS,
    },
    {
      businessDate: new Date('2026-09-03T00:00:00.000Z'),
      ipHash: 'student-visitor',
      visitorType: WEBSITE_VISITOR_TYPE.STUDENT,
    },
  ]

  const result = aggregateWebsiteTraffic(visits, [], filters)
  assert.equal(result.overview.visitCount, 3)
  assert.deepEqual(
    result.trend.map((item) => ({
      date: item.date,
      studentVisitCount: item.studentVisitCount,
      anonymousVisitCount: item.anonymousVisitCount,
    })),
    [
      { date: '2026-09-01', studentVisitCount: 0, anonymousVisitCount: 1 },
      { date: '2026-09-02', studentVisitCount: 0, anonymousVisitCount: 1 },
      { date: '2026-09-03', studentVisitCount: 1, anonymousVisitCount: 0 },
    ],
  )

  console.log('Website traffic aggregation tests passed')

  const createdAt = filters.startAt;
  const preferences = aggregateRegistrationExamPreferences([
    { createdAt, examPreferences: [{ examType: 'ESAT' }, { examType: 'ESAT' }] },
    { createdAt, examPreferences: [{ examType: 'tmua' }] },
    { createdAt, examPreferences: [{ examType: 'ESAT' }, { examType: 'TMUA' }, { examType: 'ESAT' }] },
    { createdAt, examPreferences: '[{"examType":"TMUA"},{"examType":"ESAT"}]' },
    { createdAt, examPreferences: null },
    { createdAt, examPreferences: 'invalid json' },
    { createdAt, examPreferences: [null, { examType: 123 }, { examType: 'STEP' }] },
    { createdAt: new Date(filters.startAt.getTime() - 1), examPreferences: [{ examType: 'ESAT' }] },
    { createdAt: filters.endAt, examPreferences: [{ examType: 'ESAT' }] },
  ], filters);
  assert.equal(preferences.totalStudentCount, 7);
  assert.deepEqual(preferences.items.map(({ category, studentCount }) => ({ category, studentCount })), [
    { category: 'ESAT', studentCount: 1 },
    { category: 'TMUA', studentCount: 1 },
    { category: 'both', studentCount: 2 },
    { category: 'unset', studentCount: 3 },
  ]);
  assert.equal(preferences.items.reduce((sum, item) => sum + item.studentCount, 0), 7);
  assert.ok(Math.abs(preferences.items.reduce((sum, item) => sum + item.percentage, 0) - 100) < 0.02);
  const empty = aggregateRegistrationExamPreferences([], filters);
  assert.equal(empty.totalStudentCount, 0);
  assert.ok(empty.items.every((item) => item.studentCount === 0 && item.percentage === 0));
  console.log('Registration exam preferences passed: exclusive categories, duplicate selections, legacy JSON, empty/invalid preferences, date boundaries.');
}

main()
