// 网站访问聚合纯函数测试：覆盖历史空身份回退、显式身份分类与每日趋势。
import assert from 'node:assert/strict'
import {
  aggregateWebsiteTraffic,
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
}

main()
