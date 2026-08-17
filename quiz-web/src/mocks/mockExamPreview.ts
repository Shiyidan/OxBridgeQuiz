// 无限模考样式预览数据：后端接口接通前填充目录、记录和趋势，关闭开关即可停用。
import { PAPER_ACCESS_TIER } from '@/constants/paperTypes'
import type { ActiveExamType } from '@/stores/auth'
import type {
  MockExamCatalogParams,
  MockExamCatalogResult,
  MockExamOverviewResult,
  MockExamPaperItem,
  MockExamRecordItem,
  MockExamRecordParams,
  MockExamRecordResult,
} from '@/api/mockExams'
import type { PaperModuleOutline, PaginationMeta } from '@/api/papers'

export const MOCK_EXAM_PREVIEW_ENABLED = true

// 正式模块结构集中生成，避免每张预览卷重复堆叠字段。
function createModule(
  code: string,
  subject: string,
  order: number,
  questionCount: number,
  durationMinutes: number,
): PaperModuleOutline {
  return {
    code,
    subject,
    subjectCode: code,
    order,
    durationSeconds: durationMinutes * 60,
    questionCount,
  }
}

const ESAT_MATHS_PHYSICS_CHEMISTRY = [
  createModule('maths1', 'Mathematics 1', 1, 27, 40),
  createModule('physics', 'Physics', 2, 27, 40),
  createModule('chemistry', 'Chemistry', 3, 27, 40),
]

const ESAT_MATHS_BIOLOGY_CHEMISTRY = [
  createModule('maths1', 'Mathematics 1', 1, 27, 40),
  createModule('biology', 'Biology', 2, 27, 40),
  createModule('chemistry', 'Chemistry', 3, 27, 40),
]

const ESAT_MATHS_MATHS2_PHYSICS = [
  createModule('maths1', 'Mathematics 1', 1, 27, 40),
  createModule('maths2', 'Mathematics 2', 2, 27, 40),
  createModule('physics', 'Physics', 3, 27, 40),
]

const TMUA_MODULES = [
  createModule('paper1', 'Paper 1', 1, 20, 75),
  createModule('paper2', 'Paper 2', 2, 20, 75),
]

const previewPapers: Record<ActiveExamType, MockExamPaperItem[]> = {
  ESAT: [
    {
      id: 'preview-esat-001',
      code: 'ESAT-MOCK-001',
      title: 'ESAT 全真模拟卷 A01',
      examType: 'ESAT',
      accessTier: PAPER_ACCESS_TIER.FREE,
      durationSeconds: 120 * 60,
      totalQuestions: 81,
      modules: ESAT_MATHS_PHYSICS_CHEMISTRY,
      publicationStatus: 'published',
      inProgressCount: 0,
      completedCount: 2,
      bestScore: 7.1,
      latestCompletedExamRecordId: 'preview-esat-completed-002',
      inProgressAttempts: [],
    },
    {
      id: 'preview-esat-002',
      code: 'ESAT-MOCK-002',
      title: 'ESAT 全真模拟卷 A02',
      examType: 'ESAT',
      accessTier: PAPER_ACCESS_TIER.MEMBER,
      durationSeconds: 120 * 60,
      totalQuestions: 81,
      modules: ESAT_MATHS_BIOLOGY_CHEMISTRY,
      publicationStatus: 'published',
      inProgressCount: 1,
      completedCount: 1,
      bestScore: 6.8,
      latestCompletedExamRecordId: 'preview-esat-completed-003',
      inProgressAttempts: [
        {
          examRecordId: 'preview-esat-progress-001',
          paperId: 'preview-esat-002',
          startedAt: '2026-08-15T06:20:00.000Z',
          updatedAt: '2026-08-16T09:35:00.000Z',
          currentModuleLabel: 'Biology',
          answeredCount: 38,
          totalQuestions: 81,
          remainingSeconds: 1840,
        },
      ],
    },
    {
      id: 'preview-esat-003',
      code: 'ESAT-MOCK-003',
      title: 'ESAT 全真模拟卷 A03',
      examType: 'ESAT',
      accessTier: PAPER_ACCESS_TIER.MEMBER,
      durationSeconds: 120 * 60,
      totalQuestions: 81,
      modules: ESAT_MATHS_MATHS2_PHYSICS,
      publicationStatus: 'published',
      inProgressCount: 0,
      completedCount: 0,
      bestScore: null,
      latestCompletedExamRecordId: null,
      inProgressAttempts: [],
    },
    {
      id: 'preview-esat-004',
      code: 'ESAT-MOCK-004',
      title: 'ESAT 冲刺模拟卷 A04',
      examType: 'ESAT',
      accessTier: PAPER_ACCESS_TIER.MEMBER,
      durationSeconds: 120 * 60,
      totalQuestions: 81,
      modules: ESAT_MATHS_PHYSICS_CHEMISTRY,
      publicationStatus: 'published',
      inProgressCount: 0,
      completedCount: 1,
      bestScore: 7.4,
      latestCompletedExamRecordId: 'preview-esat-completed-004',
      inProgressAttempts: [],
    },
  ],
  TMUA: [
    {
      id: 'preview-tmua-001',
      code: 'TMUA-MOCK-001',
      title: 'TMUA 全真模拟卷 T01',
      examType: 'TMUA',
      accessTier: PAPER_ACCESS_TIER.FREE,
      durationSeconds: 150 * 60,
      totalQuestions: 40,
      modules: TMUA_MODULES,
      publicationStatus: 'published',
      inProgressCount: 1,
      completedCount: 2,
      bestScore: 7.3,
      latestCompletedExamRecordId: 'preview-tmua-completed-002',
      inProgressAttempts: [
        {
          examRecordId: 'preview-tmua-progress-001',
          paperId: 'preview-tmua-001',
          startedAt: '2026-08-16T03:10:00.000Z',
          updatedAt: '2026-08-16T04:02:00.000Z',
          currentModuleLabel: 'Paper 1',
          answeredCount: 13,
          totalQuestions: 40,
          remainingSeconds: 2320,
        },
      ],
    },
    {
      id: 'preview-tmua-002',
      code: 'TMUA-MOCK-002',
      title: 'TMUA 全真模拟卷 T02',
      examType: 'TMUA',
      accessTier: PAPER_ACCESS_TIER.MEMBER,
      durationSeconds: 150 * 60,
      totalQuestions: 40,
      modules: TMUA_MODULES,
      publicationStatus: 'published',
      inProgressCount: 0,
      completedCount: 1,
      bestScore: 6.9,
      latestCompletedExamRecordId: 'preview-tmua-completed-003',
      inProgressAttempts: [],
    },
    {
      id: 'preview-tmua-003',
      code: 'TMUA-MOCK-003',
      title: 'TMUA 全真模拟卷 T03',
      examType: 'TMUA',
      accessTier: PAPER_ACCESS_TIER.MEMBER,
      durationSeconds: 150 * 60,
      totalQuestions: 40,
      modules: TMUA_MODULES,
      publicationStatus: 'published',
      inProgressCount: 0,
      completedCount: 0,
      bestScore: null,
      latestCompletedExamRecordId: null,
      inProgressAttempts: [],
    },
    {
      id: 'preview-tmua-004',
      code: 'TMUA-MOCK-004',
      title: 'TMUA 冲刺模拟卷 T04',
      examType: 'TMUA',
      accessTier: PAPER_ACCESS_TIER.MEMBER,
      durationSeconds: 150 * 60,
      totalQuestions: 40,
      modules: TMUA_MODULES,
      publicationStatus: 'published',
      inProgressCount: 2,
      completedCount: 0,
      bestScore: null,
      latestCompletedExamRecordId: null,
      inProgressAttempts: [
        {
          examRecordId: 'preview-tmua-progress-002',
          paperId: 'preview-tmua-004',
          startedAt: '2026-08-12T08:15:00.000Z',
          updatedAt: '2026-08-12T09:04:00.000Z',
          currentModuleLabel: 'Paper 1',
          answeredCount: 11,
          totalQuestions: 40,
          remainingSeconds: 2730,
        },
        {
          examRecordId: 'preview-tmua-progress-003',
          paperId: 'preview-tmua-004',
          startedAt: '2026-08-14T02:40:00.000Z',
          updatedAt: '2026-08-14T04:01:00.000Z',
          currentModuleLabel: 'Paper 2',
          answeredCount: 27,
          totalQuestions: 40,
          remainingSeconds: 3010,
        },
      ],
    },
  ],
}

const previewOverview: Record<ActiveExamType, MockExamOverviewResult> = {
  ESAT: {
    completedCount: 5,
    bestScore: 7.4,
    targetScore: 7.5,
    maxScore: 9,
    labels: ['第 1 次', '第 2 次', '第 3 次', '第 4 次', '第 5 次'],
    series: [
      { key: 'maths1', label: 'Mathematics 1', values: [5.2, 5.8, 6.3, 6.9, 7.4] },
      { key: 'physics', label: 'Physics', values: [4.8, 5.5, 5.9, 6.4, 7.1] },
      { key: 'chemistry', label: 'Chemistry', values: [5, 5.4, 6.1, 6.6, 6.8] },
    ],
  },
  TMUA: {
    completedCount: 4,
    bestScore: 7.3,
    targetScore: 7.5,
    maxScore: 9,
    labels: ['第 1 次', '第 2 次', '第 3 次', '第 4 次'],
    series: [{ key: 'overall', label: '综合成绩', values: [5.1, 5.9, 6.6, 7.3] }],
  },
}

const previewRecords: Record<ActiveExamType, MockExamRecordItem[]> = {
  ESAT: [
    {
      examRecordId: 'preview-esat-progress-001',
      paperId: 'preview-esat-002',
      paperTitle: 'ESAT 全真模拟卷 A02',
      paperCode: 'ESAT-MOCK-002',
      status: 'in_progress',
      startedAt: '2026-08-15T06:20:00.000Z',
      updatedAt: '2026-08-16T09:35:00.000Z',
      submittedAt: null,
      currentModuleLabel: 'Biology',
      answeredCount: 38,
      totalQuestions: 81,
      remainingSeconds: 1840,
      score: null,
      reportStatus: null,
    },
    {
      examRecordId: 'preview-esat-completed-004',
      paperId: 'preview-esat-004',
      paperTitle: 'ESAT 冲刺模拟卷 A04',
      paperCode: 'ESAT-MOCK-004',
      status: 'completed',
      startedAt: '2026-08-10T01:30:00.000Z',
      updatedAt: '2026-08-10T03:38:00.000Z',
      submittedAt: '2026-08-10T03:38:00.000Z',
      currentModuleLabel: null,
      answeredCount: 81,
      totalQuestions: 81,
      remainingSeconds: null,
      score: 7.4,
      reportStatus: 'completed',
    },
    {
      examRecordId: 'preview-esat-completed-003',
      paperId: 'preview-esat-002',
      paperTitle: 'ESAT 全真模拟卷 A02',
      paperCode: 'ESAT-MOCK-002',
      status: 'completed',
      startedAt: '2026-08-06T02:10:00.000Z',
      updatedAt: '2026-08-06T04:15:00.000Z',
      submittedAt: '2026-08-06T04:15:00.000Z',
      currentModuleLabel: null,
      answeredCount: 79,
      totalQuestions: 81,
      remainingSeconds: null,
      score: 6.8,
      reportStatus: 'completed',
    },
  ],
  TMUA: [
    {
      examRecordId: 'preview-tmua-progress-001',
      paperId: 'preview-tmua-001',
      paperTitle: 'TMUA 全真模拟卷 T01',
      paperCode: 'TMUA-MOCK-001',
      status: 'in_progress',
      startedAt: '2026-08-16T03:10:00.000Z',
      updatedAt: '2026-08-16T04:02:00.000Z',
      submittedAt: null,
      currentModuleLabel: 'Paper 1',
      answeredCount: 13,
      totalQuestions: 40,
      remainingSeconds: 2320,
      score: null,
      reportStatus: null,
    },
    {
      examRecordId: 'preview-tmua-progress-003',
      paperId: 'preview-tmua-004',
      paperTitle: 'TMUA 冲刺模拟卷 T04',
      paperCode: 'TMUA-MOCK-004',
      status: 'in_progress',
      startedAt: '2026-08-14T02:40:00.000Z',
      updatedAt: '2026-08-14T04:01:00.000Z',
      submittedAt: null,
      currentModuleLabel: 'Paper 2',
      answeredCount: 27,
      totalQuestions: 40,
      remainingSeconds: 3010,
      score: null,
      reportStatus: null,
    },
    {
      examRecordId: 'preview-tmua-completed-003',
      paperId: 'preview-tmua-002',
      paperTitle: 'TMUA 全真模拟卷 T02',
      paperCode: 'TMUA-MOCK-002',
      status: 'completed',
      startedAt: '2026-08-09T01:20:00.000Z',
      updatedAt: '2026-08-09T03:54:00.000Z',
      submittedAt: '2026-08-09T03:54:00.000Z',
      currentModuleLabel: null,
      answeredCount: 40,
      totalQuestions: 40,
      remainingSeconds: null,
      score: 6.9,
      reportStatus: 'completed',
    },
    {
      examRecordId: 'preview-tmua-completed-002',
      paperId: 'preview-tmua-001',
      paperTitle: 'TMUA 全真模拟卷 T01',
      paperCode: 'TMUA-MOCK-001',
      status: 'completed',
      startedAt: '2026-08-04T05:10:00.000Z',
      updatedAt: '2026-08-04T07:40:00.000Z',
      submittedAt: '2026-08-04T07:40:00.000Z',
      currentModuleLabel: null,
      answeredCount: 40,
      totalQuestions: 40,
      remainingSeconds: null,
      score: 7.3,
      reportStatus: 'completed',
    },
  ],
}

// 分页元数据与真实接口保持一致，页面无需为预览数据走另一套渲染逻辑。
function paginate<T>(
  list: T[],
  page: number,
  pageSize: number,
): { list: T[]; pagination: PaginationMeta } {
  const total = list.length
  const totalPages = Math.ceil(total / pageSize)
  const safePage = totalPages > 0 ? Math.min(Math.max(page, 1), totalPages) : 1
  const start = (safePage - 1) * pageSize
  return {
    list: list.slice(start, start + pageSize),
    pagination: {
      page: safePage,
      pageSize,
      total,
      totalPages,
      hasPrev: safePage > 1,
      hasNext: totalPages > 0 && safePage < totalPages,
    },
  }
}

// 目录预览支持与真实接口相同的搜索、个人状态筛选和分页。
export function getPreviewMockExamCatalog(
  params: MockExamCatalogParams,
  includePersonalState: boolean,
): MockExamCatalogResult {
  const examType = params.examType === 'ESAT' ? 'ESAT' : 'TMUA'
  const keyword = params.keyword?.trim().toLowerCase() || ''
  let list = previewPapers[examType].map((paper) => ({
    ...paper,
    modules: paper.modules.map((module) => ({ ...module })),
    inProgressAttempts: paper.inProgressAttempts.map((attempt) => ({ ...attempt })),
  }))
  if (keyword) {
    list = list.filter((paper) =>
      `${paper.code || ''} ${paper.title}`.toLowerCase().includes(keyword),
    )
  }
  if (includePersonalState && params.status && params.status !== 'all') {
    list = list.filter((paper) => {
      if (params.status === 'not_started') {
        return paper.inProgressCount === 0 && paper.completedCount === 0
      }
      if (params.status === 'in_progress') return paper.inProgressCount > 0
      return paper.completedCount > 0
    })
  }
  if (!includePersonalState) {
    list = list.map((paper) => ({
      ...paper,
      inProgressCount: 0,
      completedCount: 0,
      bestScore: null,
      latestCompletedExamRecordId: null,
      inProgressAttempts: [],
    }))
  }
  return paginate(list, params.page || 1, params.pageSize || 10)
}

// 概览深拷贝数组，避免页面图表处理影响后续切换考试时的原始数据。
export function getPreviewMockExamOverview(examType: string): MockExamOverviewResult {
  const source = previewOverview[examType === 'ESAT' ? 'ESAT' : 'TMUA']
  return {
    ...source,
    labels: [...source.labels],
    series: source.series.map((series) => ({ ...series, values: [...series.values] })),
  }
}

// 记录预览按状态过滤并保持与真实记录接口相同的分页结构。
export function getPreviewMockExamRecords(params: MockExamRecordParams): MockExamRecordResult {
  const examType = params.examType === 'ESAT' ? 'ESAT' : 'TMUA'
  const list = previewRecords[examType]
    .filter((record) => !params.status || record.status === params.status)
    .map((record) => ({ ...record }))
  return paginate(list, params.page || 1, params.pageSize || 10)
}
