// 学生行为聚合纯函数测试：覆盖产品使用去重、同期变化、空白日期和北京时间分桶。
import assert from 'node:assert/strict'
import {
  aggregateProductUsage,
  chinaDateKey,
  defaultBehaviorAnalyticsPeriod,
  productModuleFromPaperType,
  PRODUCT_PREFERENCE,
  PRODUCT_USAGE_MODULE,
  type ProductCompletionEvent,
  type ProductUsageModule,
} from '../src/services/behaviorAnalytics.js'

const filters = {
  startAt: new Date('2026-06-01T16:00:00.000Z'),
  endAt: new Date('2026-06-04T16:00:00.000Z'),
}

// 产品完成事件以考试记录为唯一资源，构造器让偏好测试清晰表达各学生分布。
function completion(
  resourceId: string,
  userId: string,
  module: ProductUsageModule,
  occurredAt = '2026-06-02T01:00:00.000Z',
): ProductCompletionEvent {
  return { resourceId, userId, module, occurredAt: new Date(occurredAt) }
}

// 单次执行校验核心公式和边界，失败时由 node:assert 输出具体差异。
function main(): void {
  assert.equal(chinaDateKey(new Date('2026-06-01T15:59:59.999Z')), '2026-06-01')
  assert.equal(chinaDateKey(new Date('2026-06-01T16:00:00.000Z')), '2026-06-02')
  assert.deepEqual(defaultBehaviorAnalyticsPeriod(new Date('2026-06-15T16:00:00.000Z')), {
    startAt: new Date('2026-05-17T16:00:00.000Z'),
    endAt: new Date('2026-06-16T16:00:00.000Z'),
  })

  const productResult = aggregateProductUsage(
    {
      completions: [
        completion('d1', 'student-1', PRODUCT_USAGE_MODULE.DIAGNOSTIC_TEST),
        completion('d2', 'student-1', PRODUCT_USAGE_MODULE.DIAGNOSTIC_TEST),
        completion('d3', 'student-1', PRODUCT_USAGE_MODULE.DIAGNOSTIC_TEST),
        completion(
          'q1',
          'student-2',
          PRODUCT_USAGE_MODULE.QUESTION_BANK,
          '2026-06-03T01:00:00.000Z',
        ),
        completion(
          'q2',
          'student-2',
          PRODUCT_USAGE_MODULE.QUESTION_BANK,
          '2026-06-03T02:00:00.000Z',
        ),
        completion('m1', 'student-2', PRODUCT_USAGE_MODULE.MOCK_EXAM, '2026-06-03T03:00:00.000Z'),
        completion(
          'd4',
          'student-3',
          PRODUCT_USAGE_MODULE.DIAGNOSTIC_TEST,
          '2026-06-04T01:00:00.000Z',
        ),
        completion(
          'q3',
          'student-3',
          PRODUCT_USAGE_MODULE.QUESTION_BANK,
          '2026-06-04T02:00:00.000Z',
        ),
        completion('m2', 'student-3', PRODUCT_USAGE_MODULE.MOCK_EXAM, '2026-06-04T03:00:00.000Z'),
        completion('m3', 'student-4', PRODUCT_USAGE_MODULE.MOCK_EXAM, '2026-06-04T04:00:00.000Z'),
        completion('m4', 'student-4', PRODUCT_USAGE_MODULE.MOCK_EXAM, '2026-06-04T05:00:00.000Z'),
      ],
      reportViews: [
        {
          occurredAt: new Date('2026-06-02T02:00:00.000Z'),
          userId: 'student-1',
          resourceId: 'd1',
        },
        {
          occurredAt: new Date('2026-06-02T03:00:00.000Z'),
          userId: 'student-1',
          resourceId: 'd1',
        },
        {
          occurredAt: new Date('2026-06-04T06:00:00.000Z'),
          userId: 'student-3',
          resourceId: 'd4',
        },
        {
          occurredAt: new Date('2026-06-04T07:00:00.000Z'),
          userId: 'student-1',
          resourceId: 'old-report',
        },
      ],
      mistakeNotebookViews: [
        { occurredAt: new Date('2026-06-02T04:00:00.000Z'), userId: 'student-1' },
        { occurredAt: new Date('2026-06-04T08:00:00.000Z'), userId: 'student-3' },
        { occurredAt: new Date('2026-06-04T09:00:00.000Z'), userId: 'student-3' },
      ],
      favoriteNotebookViews: [
        { occurredAt: new Date('2026-06-02T15:59:59.999Z'), userId: 'student-1' },
        { occurredAt: new Date('2026-06-02T16:00:00.000Z'), userId: 'student-1' },
        { occurredAt: new Date('2026-06-04T09:00:00.000Z'), userId: 'student-2' },
      ],
    },
    {
      completions: [
        completion(
          'previous-diagnostic',
          'student-5',
          PRODUCT_USAGE_MODULE.DIAGNOSTIC_TEST,
          '2026-05-30T01:00:00.000Z',
        ),
      ],
      reportViews: [
        {
          occurredAt: new Date('2026-05-30T02:00:00.000Z'),
          userId: 'student-5',
          resourceId: 'previous-diagnostic',
        },
      ],
      mistakeNotebookViews: [
        { occurredAt: new Date('2026-05-30T03:00:00.000Z'), userId: 'student-5' },
      ],
      favoriteNotebookViews: [
        { occurredAt: new Date('2026-05-30T04:00:00.000Z'), userId: 'student-5' },
      ],
    },
    filters,
  )
  assert.equal(productResult.overview.activeUsers, 4)
  assert.equal(productResult.overview.completedActivityCount, 11)
  assert.equal(productResult.overview.completedActivityChangeRate, 10)
  assert.equal(productResult.overview.reportViewCount, 4)
  assert.equal(productResult.overview.reportViewerCount, 2)
  assert.equal(productResult.overview.distinctReportCount, 3)
  assert.equal(productResult.overview.averageReportViews, 2)
  assert.equal(productResult.overview.samePeriodReportViewRate, 0.5)
  assert.equal(productResult.overview.mistakeNotebookViewCount, 3)
  assert.equal(productResult.overview.mistakeNotebookViewerCount, 2)
  assert.equal(productResult.overview.averageMistakeNotebookViews, 1.5)
  assert.equal(productResult.overview.mistakeNotebookViewChangeRate, 2)
  assert.equal(productResult.overview.favoriteNotebookViewCount, 3)
  assert.equal(productResult.overview.favoriteNotebookViewerCount, 2)
  assert.equal(productResult.overview.averageFavoriteNotebookViews, 1.5)
  assert.equal(productResult.overview.favoriteNotebookViewChangeRate, 2)
  assert.deepEqual(productResult.trend.map((item) => item.favoriteNotebookViewCount), [1, 1, 1])
  const emptyEvents = { completions: [], reportViews: [], mistakeNotebookViews: [], favoriteNotebookViews: [] }
  const emptyProduct = aggregateProductUsage(emptyEvents, emptyEvents, filters)
  assert.equal(emptyProduct.overview.favoriteNotebookViewCount, 0)
  assert.equal(emptyProduct.overview.averageFavoriteNotebookViews, 0)
  assert.equal(emptyProduct.overview.favoriteNotebookViewChangeRate, null)
  assert.deepEqual(
    productResult.trend.map((item) => item.mistakeNotebookViewCount),
    [1, 0, 2],
  )

  const diagnosticUsage = productResult.modules.find(
    (item) => item.module === PRODUCT_USAGE_MODULE.DIAGNOSTIC_TEST,
  )
  assert.ok(diagnosticUsage)
  assert.equal(diagnosticUsage.completionCount, 4)
  assert.equal(diagnosticUsage.userCount, 2)
  assert.equal(diagnosticUsage.completionShare, 0.3636)
  assert.equal(diagnosticUsage.repeatedUserRate, 0.5)
  assert.equal(
    productResult.preferences.find((item) => item.preference === PRODUCT_PREFERENCE.DIAGNOSTIC_TEST)
      ?.userCount,
    1,
  )
  assert.equal(
    productResult.preferences.find((item) => item.preference === PRODUCT_PREFERENCE.MIXED)
      ?.userCount,
    1,
  )
  assert.equal(
    productResult.preferences.find((item) => item.preference === PRODUCT_PREFERENCE.INSUFFICIENT)
      ?.userCount,
    1,
  )
  assert.equal(productModuleFromPaperType('realPaper'), PRODUCT_USAGE_MODULE.DIAGNOSTIC_TEST)
  assert.equal(productModuleFromPaperType('aiPaper'), PRODUCT_USAGE_MODULE.QUESTION_BANK)
  assert.equal(productModuleFromPaperType('mockPaper'), PRODUCT_USAGE_MODULE.MOCK_EXAM)

  console.log('Behavior analytics aggregation tests passed')
}

main()
