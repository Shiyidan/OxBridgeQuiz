// 无限模考学生端路由：提供公开目录、个人记录与趋势，并创建可复用分段考试链路的独立答卷。
import { Prisma } from '@prisma/client'
import { optionalAuth, requireAuth } from '../middleware/auth.js'
import { setOperationAuditContext } from '../middleware/operationAudit.js'
import {
  EXAM_PHASE,
  EXAM_RECORD_STATUS,
  EXAM_TYPE,
  MOCK_PAPER_MODULE_STATUS,
  MOCK_PAPER_STATUS,
  MOCK_PAPER_TYPES,
  MOCK_PAPER_VALIDATION_STATUS,
  PAPER_DELIVERY_MODE,
  QUESTION_STATUS,
} from '../constants/domain.js'
import { prisma } from '../services/prisma.js'
import { hasDiagnosticPaperAccess, type ExamPreferenceRecord } from '../services/member.js'
import { computeScores, type QuestionResult, type ScoringResult } from '../services/scoring.js'
import {
  buildModuleExamSnapshot,
  buildSingleModuleExamSnapshot,
  getModuleExamSession,
  moduleSnapshotJson,
  parseModuleExamSnapshot,
  singleModuleExamTitle,
} from '../services/moduleExamSession.js'
import { parseJsonArray } from '../utils/jsonField.js'
import { createAsyncRouter } from '../utils/asyncRouter.js'
import { fail, success } from '../utils/response.js'
import { parsePositiveInt } from './papers-shared.js'
import { replaceAnswerRecords } from './exam-shared.js'
import {
  coversEsatModuleSelection,
  deriveMockPaperReadiness,
  isMockPaperModuleAvailable,
} from '../utils/mockPaperState.js'

export const mockExamRouter = createAsyncRouter()

const ESAT_SUBJECT_CODE: Record<string, string> = {
  数学1: 'maths1',
  数学2: 'maths2',
  物理: 'physics',
  化学: 'chemistry',
  生物: 'biology',
}

type MockModuleRow = {
  id: string
  code: string
  label: string
  moduleOrder: number
  durationSeconds: number
  expectedQuestionCount: number
}

type MockExamMode = 'full' | 'single'

// 前端分页契约与项目其他列表保持一致。
function paginationMeta(page: number, pageSize: number, total: number) {
  const totalPages = Math.ceil(total / pageSize)
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasPrev: page > 1,
    hasNext: totalPages > 0 && page < totalPages,
  }
}

// ESAT 使用用户保存的三个科目；没有完整偏好时目录展示结构占位，开考时要求先完善资料。
async function getEsatModuleCodes(userId?: string): Promise<string[] | null> {
  if (!userId) return null
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { examPreferences: true },
  })
  const preference = parseJsonArray<ExamPreferenceRecord>(user?.examPreferences).find(
    (item) => item.examType.toUpperCase() === EXAM_TYPE.ESAT,
  )
  const codes = (preference?.subjects || [])
    .map((subject) => ESAT_SUBJECT_CODE[subject])
    .filter(Boolean)
  if (codes.length !== 3 || new Set(codes).size !== 3 || !codes.includes('maths1')) return null
  return codes
}

// ESAT 目录与开考均按个人中心三科映射，不能完整覆盖三科的套卷不作为可用套卷。
function selectEffectiveModules<T extends MockModuleRow>(
  examType: string,
  modules: T[],
  esatModuleCodes: string[] | null,
): T[] {
  const ordered = [...modules].sort((left, right) => left.moduleOrder - right.moduleOrder)
  if (examType !== EXAM_TYPE.ESAT) return ordered
  if (!esatModuleCodes) return []
  const selectedCodes = new Set(esatModuleCodes)
  return ordered.filter((module) => selectedCodes.has(module.code))
}

// 运行中记录的剩余时间由服务端阶段时间计算，暂停态使用冻结时刻而不是当前时间。
function remainingSeconds(record: {
  status: string
  phase: string
  phaseStartedAt: Date | null
  phaseExpiresAt: Date | null
}): number | null {
  if (record.status !== EXAM_RECORD_STATUS.IN_PROGRESS || !record.phaseExpiresAt) return null
  const paused = record.phase === EXAM_PHASE.PAUSED || record.phase === EXAM_PHASE.BREAK_PAUSED
  const reference = paused && record.phaseStartedAt ? record.phaseStartedAt : new Date()
  return Math.max(0, Math.ceil((record.phaseExpiresAt.getTime() - reference.getTime()) / 1000))
}

// 当前模块名称只从答卷结构快照读取，发布后的母卷变化不会影响历史进度。
function currentModuleLabel(record: {
  structureSnapshot: unknown
  currentModuleIndex: number
}): string | null {
  const snapshot = parseModuleExamSnapshot(record.structureSnapshot)
  return snapshot?.modules[record.currentModuleIndex]?.subject || null
}

// 旧答卷没有模式元数据，按完整模考兼容；新单项答卷由冻结快照明确标记。
function mockExamMode(structureSnapshot: unknown): MockExamMode {
  return parseModuleExamSnapshot(structureSnapshot)?.mockExamMode === 'single' ? 'single' : 'full'
}

// 同一考试和序号属于同一学生可见套卷，数据库 version 只区分不可变内容版本。
function mockPaperSeriesKey(examType: string, sequenceNo: number): string {
  return `${examType}:${sequenceNo}`
}

// 学生端隐藏内部版本后缀，始终展示稳定的 ESAT-MOCK-001 等业务编号。
function displayMockPaperCode(code: string): string {
  return code.replace(/-V[1-9]\d*$/i, '')
}

// 已提交答卷完成全部模块；进行中答卷只把已经越过或进入待交卷阶段的模块视为已练习。
function hasCompletedMockModule(record: {
  status: string
  phase: string
  currentModuleIndex: number
  structureSnapshot: unknown
}, moduleCode: string): boolean {
  const snapshot = parseModuleExamSnapshot(record.structureSnapshot)
  if (!snapshot) return false
  const moduleIndex = snapshot.modules.findIndex((module) => module.code === moduleCode)
  if (moduleIndex < 0) return false
  if (record.status === EXAM_RECORD_STATUS.SUBMITTED) return true
  return (
    moduleIndex < record.currentModuleIndex
    || (moduleIndex === record.currentModuleIndex && record.phase === EXAM_PHASE.READY_TO_SUBMIT)
  )
}

// 单项模考没有整卷综合分时使用唯一模块分，目录与记录都能展示可比较的正式成绩。
function singleModuleScore(scoring: ScoringResult): number | null {
  return scoring.overallScore ?? scoring.modules[0]?.scaledScore ?? null
}

// 模考成绩复用统一评分引擎；ESAT 保持官方三模块独立分，不制造总分。
function scoreExamAnswers(answers: Array<{
  isCorrect: boolean
  question: { subject: string | null; moduleCode: string | null }
}>, examType: string): ScoringResult {
  const rows: QuestionResult[] = answers.map((answer) => ({
    subject: answer.question.subject,
    moduleCode: answer.question.moduleCode,
    isCorrect: answer.isCorrect,
  }))
  return computeScores(examType, rows)
}

// 游客可浏览完整套卷；个人汇总只统计完整模考，不能被同一运行试卷下的单项答卷污染。
mockExamRouter.get('/catalog', optionalAuth, async (req, res) => {
  const examType = String(req.query.examType || '').trim().toUpperCase()
  if (examType !== EXAM_TYPE.ESAT && examType !== EXAM_TYPE.TMUA) {
    res.status(422).json(fail('无限模考仅支持 ESAT 或 TMUA', 'MOCK_EXAM_TYPE_INVALID'))
    return
  }
  const keyword = String(req.query.keyword || '').trim().slice(0, 80)
  const status = String(req.query.status || '').trim()
  if (status && !['not_started', 'in_progress', 'completed'].includes(status)) {
    res.status(422).json(fail('模考目录状态无效', 'MOCK_EXAM_STATUS_INVALID'))
    return
  }
  const pageSize = parsePositiveInt(req.query.pageSize, 10, 50)
  const requestedPage = parsePositiveInt(req.query.page, 1)
  const userId = req.user?.userId
  const candidateVersions = await prisma.mockPaperSet.findMany({
    where: {
      examType,
      deletedAt: null,
      status: MOCK_PAPER_STATUS.PUBLISHED,
      paperId: { not: null },
      ...(keyword ? { OR: [{ title: { contains: keyword } }, { code: { contains: keyword } }] } : {}),
    },
    orderBy: [{ sequenceNo: 'asc' }, { version: 'desc' }],
    include: {
      modules: {
        orderBy: { moduleOrder: 'asc' },
      },
    },
  })
  const activeSeries = new Set<string>()
  const candidateSets = candidateVersions.filter((set) => {
    const key = mockPaperSeriesKey(set.examType, set.sequenceNo)
    if (activeSeries.has(key)) return false
    activeSeries.add(key)
    return true
  })
  const sets = candidateSets.filter(
    (set) => deriveMockPaperReadiness(set.examType, set.modules).fullExamReady,
  )
  const esatModuleCodes = examType === EXAM_TYPE.ESAT
    ? await getEsatModuleCodes(userId)
    : null
  const visibleSets = sets.filter((set) => (
    set.examType !== EXAM_TYPE.ESAT
    || !userId
    || coversEsatModuleSelection(set.modules, esatModuleCodes)
  ))

  const visibleSeriesKeys = new Set(
    visibleSets.map((set) => mockPaperSeriesKey(set.examType, set.sequenceNo)),
  )
  const seriesSets = visibleSeriesKeys.size
    ? await prisma.mockPaperSet.findMany({
        where: {
          paperId: { not: null },
          OR: visibleSets.map((set) => ({
            examType: set.examType,
            sequenceNo: set.sequenceNo,
          })),
        },
        select: { id: true, examType: true, sequenceNo: true, paperId: true },
      })
    : []
  const seriesByPaperId = new Map(
    seriesSets.flatMap((set) => set.paperId
      ? [[set.paperId, {
          key: mockPaperSeriesKey(set.examType, set.sequenceNo),
          setId: set.id,
        }] as const]
      : []),
  )
  const paperIds = [...seriesByPaperId.keys()]
  const records = userId && paperIds.length
    ? await prisma.examRecord.findMany({
        where: { userId, paperId: { in: paperIds } },
        orderBy: [{ submittedAt: 'desc' }, { startedAt: 'desc' }],
        include: {
          answers: {
            select: {
              selectedAnswer: true,
              isCorrect: true,
              question: { select: { subject: true, moduleCode: true } },
            },
          },
        },
      })
    : []
  const recordsBySeries = new Map<string, typeof records>()
  for (const record of records) {
    if (mockExamMode(record.structureSnapshot) !== 'full') continue
    const series = seriesByPaperId.get(record.paperId)
    if (!series) continue
    const current = recordsBySeries.get(series.key) || []
    current.push(record)
    recordsBySeries.set(series.key, current)
  }

  const allItems = visibleSets.map((set) => {
    const effectiveModules = selectEffectiveModules(set.examType, set.modules, esatModuleCodes)
    const displayModules = effectiveModules.length
      ? effectiveModules
      : set.examType === EXAM_TYPE.ESAT && !userId && set.modules.length === 3
        ? [...set.modules].sort((left, right) => left.moduleOrder - right.moduleOrder)
        : []
    const maths1 = set.modules.find((module) => module.code === 'maths1')
    const totalQuestions = set.examType === EXAM_TYPE.ESAT
      ? (maths1?.expectedQuestionCount || 0) * 3
      : effectiveModules.reduce((sum, module) => sum + module.expectedQuestionCount, 0)
    const durationSeconds = set.examType === EXAM_TYPE.ESAT
      ? (maths1?.durationSeconds || 0) * 3
      : effectiveModules.reduce((sum, module) => sum + module.durationSeconds, 0)
    const seriesKey = mockPaperSeriesKey(set.examType, set.sequenceNo)
    const paperRecords = recordsBySeries.get(seriesKey) || []
    const inProgress = paperRecords.filter(
      (record) => record.status === EXAM_RECORD_STATUS.IN_PROGRESS,
    )
    const completed = paperRecords.filter(
      (record) => record.status === EXAM_RECORD_STATUS.SUBMITTED,
    )
    const completedScores = completed
      .map((record) => scoreExamAnswers(record.answers, record.examType).overallScore)
      .filter((score): score is number => score !== null)
    return {
      id: set.id,
      code: displayMockPaperCode(set.code),
      version: set.version,
      title: set.title,
      examType: set.examType,
      accessTier: set.accessTier,
      durationSeconds,
      totalQuestions,
      modules: displayModules.map((module, index) => ({
        code: module.code,
        subject: module.label,
        subjectCode: module.code,
        order: index + 1,
        durationSeconds: module.durationSeconds,
        questionCount: module.expectedQuestionCount,
      })),
      publicationStatus: 'published',
      inProgressCount: inProgress.length,
      completedCount: completed.length,
      completedCurrentVersionCount: completed.filter(
        (record) => record.paperId === set.paperId,
      ).length,
      hasContentUpdate: completed.length > 0 && completed.every(
        (record) => record.paperId !== set.paperId,
      ),
      bestScore: completedScores.length ? Math.max(...completedScores) : null,
      latestCompletedExamRecordId: completed[0]?.id || null,
      inProgressAttempts: inProgress.map((record) => ({
        examRecordId: record.id,
        paperId: seriesByPaperId.get(record.paperId)?.setId || set.id,
        startedAt: record.startedAt.toISOString(),
        updatedAt: (record.phaseStartedAt || record.startedAt).toISOString(),
        currentModuleLabel: currentModuleLabel(record) || '等待开始',
        answeredCount: record.answers.filter((answer) => Boolean(answer.selectedAnswer)).length,
        totalQuestions: record.totalQuestions,
        remainingSeconds: remainingSeconds(record),
      })),
    }
  })
  const filteredItems = !userId || !status
    ? allItems
    : allItems.filter((item) => {
        if (status === 'not_started') return item.inProgressCount === 0 && item.completedCount === 0
        if (status === 'in_progress') return item.inProgressCount > 0
        return item.completedCount > 0
      })
  const total = filteredItems.length
  const totalPages = Math.ceil(total / pageSize)
  const page = totalPages > 0 ? Math.min(requestedPage, totalPages) : 1
  const list = filteredItems.slice((page - 1) * pageSize, page * pageSize)
  res.json(success({ list, pagination: paginationMeta(page, pageSize, total) }))
})

// 单项目录按已发布且独立校验通过的 Module/Paper 展示，并附带单项答卷与跨整卷练习状态。
mockExamRouter.get('/modules', optionalAuth, async (req, res) => {
  const examType = String(req.query.examType || '').trim().toUpperCase()
  if (examType !== EXAM_TYPE.ESAT && examType !== EXAM_TYPE.TMUA) {
    res.status(422).json(fail('单项模考仅支持 ESAT 或 TMUA', 'MOCK_EXAM_TYPE_INVALID'))
    return
  }
  const keyword = String(req.query.keyword || '').trim().slice(0, 80).toLowerCase()
  const moduleCode = String(req.query.moduleCode || '').trim().toLowerCase()
  const status = String(req.query.status || '').trim()
  if (status && !['not_started', 'in_progress', 'completed', 'practiced'].includes(status)) {
    res.status(422).json(fail('单项模考目录状态无效', 'MOCK_EXAM_STATUS_INVALID'))
    return
  }
  const pageSize = parsePositiveInt(req.query.pageSize, 10, 50)
  const requestedPage = parsePositiveInt(req.query.page, 1)
  const userId = req.user?.userId
  const candidateModules = await prisma.mockPaperModule.findMany({
    where: {
      sourceModuleId: null,
      validationStatus: MOCK_PAPER_VALIDATION_STATUS.VALID,
      publicationStatus: MOCK_PAPER_MODULE_STATUS.PUBLISHED,
      ...(moduleCode ? { code: moduleCode } : {}),
      mockPaperSet: {
        examType,
        paperId: { not: null },
        paper: { status: 'published' },
      },
    },
    orderBy: [
      { mockPaperSet: { sequenceNo: 'asc' } },
      { mockPaperSet: { version: 'desc' } },
      { moduleOrder: 'asc' },
    ],
    include: {
      mockPaperSet: {
        include: {
          paper: { select: { id: true, status: true } },
          modules: { select: { code: true, validationStatus: true } },
        },
      },
    },
  })
  const activeModuleSeries = new Set<string>()
  const modules = candidateModules.filter((module) => {
    const key = `${mockPaperSeriesKey(
      module.mockPaperSet.examType,
      module.mockPaperSet.sequenceNo,
    )}:${module.code}`
    if (activeModuleSeries.has(key)) return false
    activeModuleSeries.add(key)
    return true
  })
  const seriesSets = modules.length
    ? await prisma.mockPaperSet.findMany({
        where: {
          paperId: { not: null },
          OR: modules.map((module) => ({
            examType: module.mockPaperSet.examType,
            sequenceNo: module.mockPaperSet.sequenceNo,
          })),
        },
        select: { examType: true, sequenceNo: true, paperId: true },
      })
    : []
  const seriesByPaperId = new Map(
    seriesSets.flatMap((set) => set.paperId
      ? [[set.paperId, mockPaperSeriesKey(set.examType, set.sequenceNo)] as const]
      : []),
  )
  const paperIds = [...seriesByPaperId.keys()]
  const records = userId && paperIds.length
    ? await prisma.examRecord.findMany({
        where: { userId, paperId: { in: paperIds } },
        orderBy: [{ submittedAt: 'desc' }, { startedAt: 'desc' }],
        include: {
          answers: {
            select: {
              selectedAnswer: true,
              isCorrect: true,
              question: { select: { subject: true, moduleCode: true } },
            },
          },
        },
      })
    : []
  const recordsBySeries = new Map<string, typeof records>()
  for (const record of records) {
    const seriesKey = seriesByPaperId.get(record.paperId)
    if (!seriesKey) continue
    const current = recordsBySeries.get(seriesKey) || []
    current.push(record)
    recordsBySeries.set(seriesKey, current)
  }

  const allItems = modules.flatMap((module) => {
    const set = module.mockPaperSet
    if (!set.paperId || set.paper?.status !== 'published') return []
    const paperRecords = recordsBySeries.get(
      mockPaperSeriesKey(set.examType, set.sequenceNo),
    ) || []
    const singleRecords = paperRecords.filter((record) => {
      const snapshot = parseModuleExamSnapshot(record.structureSnapshot)
      return snapshot?.mockExamMode === 'single' && snapshot.modules[0]?.code === module.code
    })
    const inProgress = singleRecords.filter(
      (record) => record.status === EXAM_RECORD_STATUS.IN_PROGRESS,
    )
    const completed = singleRecords.filter(
      (record) => record.status === EXAM_RECORD_STATUS.SUBMITTED,
    )
    const completedScores = completed
      .map((record) => singleModuleScore(scoreExamAnswers(record.answers, record.examType)))
      .filter((score): score is number => score !== null)
    const practicedInFull = paperRecords.some((record) => (
      mockExamMode(record.structureSnapshot) === 'full'
      && hasCompletedMockModule(record, module.code)
    ))
    const title = singleModuleExamTitle(
      set.examType,
      module.code,
      set.sequenceNo,
      module.title,
    )
    const searchable = `${title} ${module.label} ${module.code} ${set.title} ${set.code}`.toLowerCase()
    if (keyword && !searchable.includes(keyword)) return []
    return [{
      id: module.id,
      mockPaperSetId: set.id,
      code: module.code,
      label: module.label,
      title,
      examType: set.examType,
      accessTier: module.accessTier,
      durationSeconds: module.durationSeconds,
      totalQuestions: module.expectedQuestionCount,
      publicationStatus: 'published',
      sourcePaperCode: set.code,
      sourcePaperTitle: set.title,
      fullExamReady: deriveMockPaperReadiness(set.examType, set.modules).fullExamReady,
      inProgressCount: inProgress.length,
      completedCount: completed.length,
      bestScore: completedScores.length ? Math.max(...completedScores) : null,
      latestCompletedExamRecordId: completed[0]?.id || null,
      practicedInFull,
      inProgressAttempts: inProgress.map((record) => ({
        examRecordId: record.id,
        paperId: parseModuleExamSnapshot(record.structureSnapshot)?.mockModuleId || module.id,
        startedAt: record.startedAt.toISOString(),
        updatedAt: (record.phaseStartedAt || record.startedAt).toISOString(),
        currentModuleLabel: currentModuleLabel(record) || module.label,
        answeredCount: record.answers.filter((answer) => Boolean(answer.selectedAnswer)).length,
        totalQuestions: record.totalQuestions,
        remainingSeconds: remainingSeconds(record),
      })),
    }]
  })
  const filteredItems = !userId || !status
    ? allItems
    : allItems.filter((item) => {
        if (status === 'not_started') {
          return item.inProgressCount === 0 && item.completedCount === 0 && !item.practicedInFull
        }
        if (status === 'in_progress') return item.inProgressCount > 0
        if (status === 'completed') return item.completedCount > 0
        return item.completedCount > 0 || item.practicedInFull
      })
  const total = filteredItems.length
  const totalPages = Math.ceil(total / pageSize)
  const page = totalPages > 0 ? Math.min(requestedPage, totalPages) : 1
  const list = filteredItems.slice((page - 1) * pageSize, page * pageSize)
  res.json(success({ list, pagination: paginationMeta(page, pageSize, total) }))
})

// 个人概览只统计固定模考卷，不混入真题诊断或题库练习。
mockExamRouter.get('/overview', requireAuth, async (req, res) => {
  const examType = String(req.query.examType || '').trim().toUpperCase()
  const requestedMode = String(req.query.mode || 'full').trim()
  if (examType !== EXAM_TYPE.ESAT && examType !== EXAM_TYPE.TMUA) {
    res.status(422).json(fail('无限模考仅支持 ESAT 或 TMUA', 'MOCK_EXAM_TYPE_INVALID'))
    return
  }
  if (!['all', 'full', 'single'].includes(requestedMode)) {
    res.status(422).json(fail('模考概览类型无效', 'MOCK_EXAM_MODE_INVALID'))
    return
  }
  const [allRecords, user] = await Promise.all([
    prisma.examRecord.findMany({
      where: {
        userId: req.user!.userId,
        examType,
        status: EXAM_RECORD_STATUS.SUBMITTED,
        submittedAt: { not: null },
        paper: { paperType: { in: [...MOCK_PAPER_TYPES] } },
      },
      orderBy: [{ submittedAt: 'desc' }, { id: 'desc' }],
      include: {
        answers: {
          select: {
            isCorrect: true,
            question: { select: { subject: true, moduleCode: true } },
          },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { examPreferences: true },
    }),
  ])
  const records = requestedMode === 'all'
    ? allRecords
    : allRecords.filter((record) => mockExamMode(record.structureSnapshot) === requestedMode)
  const preferences = parseJsonArray<ExamPreferenceRecord>(user?.examPreferences)
  const targetScore = preferences.find(
    (item) => item.examType.toUpperCase() === examType,
  )?.targetScore ?? null
  const scoredRecords = records.map((record) => ({
    record,
    scoring: scoreExamAnswers(record.answers, record.examType),
  }))
  const recent = scoredRecords.slice(0, 5).reverse()
  const labels = recent.map(({ record }) =>
    new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit' }).format(record.submittedAt!),
  )
  const series = examType === EXAM_TYPE.TMUA
    ? [{ key: 'overall', label: '综合分', values: recent.map(({ scoring }) => scoring.overallScore) }]
    : [...new Map(
        recent.flatMap(({ scoring }) => scoring.modules.map((module) => [module.module, module.moduleLabel])),
      ).entries()].map(([key, label]) => ({
        key,
        label,
        values: recent.map(({ scoring }) =>
          scoring.modules.find((module) => module.module === key)?.scaledScore ?? null,
        ),
      }))
  const bestEsatModule = examType === EXAM_TYPE.ESAT
    ? scoredRecords
        .flatMap(({ scoring }) => scoring.modules)
        .reduce<(ScoringResult['modules'][number] | null)>((best, module) => (
          !best || module.scaledScore > best.scaledScore ? module : best
        ), null)
    : null
  const bestScores = scoredRecords.flatMap(({ record, scoring }) => {
    if (examType === EXAM_TYPE.ESAT) return []
    const score = mockExamMode(record.structureSnapshot) === 'single'
      ? singleModuleScore(scoring)
      : scoring.overallScore
    return score === null ? [] : [score]
  })
  res.json(success({
    completedCount: records.length,
    bestScore: bestEsatModule?.scaledScore
      ?? (bestScores.length ? Math.max(...bestScores) : null),
    bestScoreModuleLabel: bestEsatModule?.moduleLabel || null,
    targetScore,
    maxScore: 9,
    labels,
    series,
  }))
})

// 未完成和已完成记录分别分页，已下线套卷的历史仍然可见并可继续。
mockExamRouter.get('/records', requireAuth, async (req, res) => {
  const examType = String(req.query.examType || '').trim().toUpperCase()
  const requestedStatus = String(req.query.status || 'in_progress').trim()
  const requestedMode = String(req.query.mode || 'all').trim()
  if (examType !== EXAM_TYPE.ESAT && examType !== EXAM_TYPE.TMUA) {
    res.status(422).json(fail('无限模考仅支持 ESAT 或 TMUA', 'MOCK_EXAM_TYPE_INVALID'))
    return
  }
  if (requestedStatus !== 'in_progress' && requestedStatus !== 'completed') {
    res.status(422).json(fail('模考记录状态无效', 'MOCK_EXAM_STATUS_INVALID'))
    return
  }
  if (!['all', 'full', 'single'].includes(requestedMode)) {
    res.status(422).json(fail('模考记录类型无效', 'MOCK_EXAM_MODE_INVALID'))
    return
  }
  const databaseStatus = requestedStatus === 'completed'
    ? EXAM_RECORD_STATUS.SUBMITTED
    : EXAM_RECORD_STATUS.IN_PROGRESS
  const pageSize = parsePositiveInt(req.query.pageSize, 10, 50)
  const requestedPage = parsePositiveInt(req.query.page, 1)
  const where: Prisma.ExamRecordWhereInput = {
    userId: req.user!.userId,
    examType,
    status: databaseStatus,
    paper: { paperType: { in: [...MOCK_PAPER_TYPES] } },
  }
  const allRecords = await prisma.examRecord.findMany({
    where,
    orderBy: requestedStatus === 'completed'
      ? [{ submittedAt: 'desc' }, { startedAt: 'desc' }]
      : [{ startedAt: 'desc' }],
    include: {
      paper: {
        select: {
          id: true,
          title: true,
          code: true,
          mockPaperSet: {
            select: {
              id: true,
              title: true,
              code: true,
              sequenceNo: true,
              version: true,
              modules: { select: { id: true, code: true, title: true } },
            },
          },
        },
      },
      diagnosticReportTask: { select: { status: true } },
      answers: {
        select: {
          selectedAnswer: true,
          isCorrect: true,
          question: { select: { subject: true, moduleCode: true } },
        },
      },
    },
  })
  const filteredRecords = requestedMode === 'all'
    ? allRecords
    : allRecords.filter((record) => mockExamMode(record.structureSnapshot) === requestedMode)
  const total = filteredRecords.length
  const totalPages = Math.ceil(total / pageSize)
  const page = totalPages > 0 ? Math.min(requestedPage, totalPages) : 1
  const records = filteredRecords.slice((page - 1) * pageSize, page * pageSize)
  const list = records.map((record) => {
    const scoring = record.status === EXAM_RECORD_STATUS.SUBMITTED
      ? scoreExamAnswers(record.answers, record.examType)
      : null
    const snapshot = parseModuleExamSnapshot(record.structureSnapshot)
    const mode = mockExamMode(record.structureSnapshot)
    const module = mode === 'single' ? snapshot?.modules[0] || null : null
    const sourceSet = record.paper.mockPaperSet
    const currentModuleTitle = sourceSet?.modules.find((item) => (
      item.id === snapshot?.mockModuleId || item.code === module?.code
    ))?.title
    const title = module && sourceSet
      ? singleModuleExamTitle(
          record.examType,
          module.code,
          sourceSet.sequenceNo,
          currentModuleTitle || module.title,
        )
      : record.paper.title
    return {
      examRecordId: record.id,
      paperId: mode === 'single'
        ? snapshot?.mockModuleId || sourceSet?.id || record.paper.id
        : sourceSet?.id || record.paper.id,
      paperTitle: title,
      paperCode: sourceSet
        ? displayMockPaperCode(sourceSet.code)
        : record.paper.code,
      version: sourceSet?.version || 1,
      mode,
      moduleCode: module?.code || null,
      moduleLabel: module?.subject || null,
      sourcePaperTitle: sourceSet?.title || record.paper.title,
      sourcePaperCode: sourceSet
        ? displayMockPaperCode(sourceSet.code)
        : record.paper.code,
      status: record.status === EXAM_RECORD_STATUS.SUBMITTED ? 'completed' : 'in_progress',
      startedAt: record.startedAt.toISOString(),
      updatedAt: (record.submittedAt || record.phaseStartedAt || record.startedAt).toISOString(),
      submittedAt: record.submittedAt?.toISOString() || null,
      currentModuleLabel: currentModuleLabel(record),
      answeredCount: record.answers.filter((answer) => Boolean(answer.selectedAnswer)).length,
      totalQuestions: record.totalQuestions,
      correctCount: record.correctCount,
      wrongCount: Math.max(0, record.totalQuestions - record.correctCount),
      accuracy: record.totalQuestions > 0
        ? Math.round((record.correctCount / record.totalQuestions) * 1000) / 10
        : null,
      durationSeconds: record.durationSeconds,
      remainingSeconds: remainingSeconds(record),
      score: scoring
        ? mode === 'single' ? singleModuleScore(scoring) : scoring.overallScore
        : null,
      moduleScores: scoring?.modules.map((module) => ({
        code: module.module,
        label: module.moduleLabel,
        correctCount: module.rawScore,
        totalQuestions: module.totalQuestions,
        score: module.scaledScore,
      })) || [],
      reportStatus: mode === 'full' ? record.diagnosticReportTask?.status || null : null,
    }
  })
  res.json(success({ list, pagination: paginationMeta(page, pageSize, total) }))
})

// 单项开考冻结目标 Module/Paper 及题序，所属 Mock 未组成完整套卷时仍可独立考试。
mockExamRouter.post('/modules/:id/attempts', requireAuth, async (req, res) => {
  const requestId = typeof req.body?.startRequestId === 'string'
    ? req.body.startRequestId.trim().slice(0, 100)
    : ''
  if (!requestId || !/^[A-Za-z0-9-]{8,100}$/.test(requestId)) {
    res.status(422).json(fail('开始请求标识无效，请刷新后重试', 'MOCK_EXAM_START_REQUEST_INVALID'))
    return
  }
  const startRequestKey = `${req.user!.userId}:single:${req.params.id}:${requestId}`
  const existing = await prisma.examRecord.findUnique({ where: { startRequestKey } })
  if (existing) {
    res.json(success({ examRecordId: existing.id, paperId: req.params.id }))
    return
  }

  const module = await prisma.mockPaperModule.findUnique({
    where: { id: req.params.id },
    include: {
      mockPaperSet: { include: { paper: true } },
      questions: {
        orderBy: { position: 'asc' },
        include: {
          question: {
            select: {
              id: true,
              answer: true,
              status: true,
              examType: true,
            },
          },
        },
      },
    },
  })
  const set = module?.mockPaperSet
  if (
    !module
    || module.sourceModuleId
    || !set
    || !set.paper
    || !isMockPaperModuleAvailable({
      publicationStatus: module.publicationStatus,
      validationStatus: module.validationStatus,
      deletedAt: set.deletedAt,
      paperStatus: set.paper.status,
    })
  ) {
    res.status(409).json(fail('该单项模考当前不能开始', 'MOCK_EXAM_MODULE_NOT_AVAILABLE'))
    return
  }
  if (!(await hasDiagnosticPaperAccess(req.user!.userId, {
    examType: set.examType,
    accessTier: module.accessTier,
  }))) {
    res.status(403).json(fail(
      `当前单项需要开通 ${set.examType} 会员后才能开始`,
      'MOCK_EXAM_PAPER_LOCKED',
    ))
    return
  }
  const invalidQuestion = (
    module.questions.length !== module.expectedQuestionCount
    || module.questions.some((item) => (
      item.validationStatus !== MOCK_PAPER_VALIDATION_STATUS.VALID
      || !item.question
      || item.question.status !== QUESTION_STATUS.PUBLISHED
      || item.question.examType !== set.examType
    ))
  )
  if (invalidQuestion) {
    res.status(422).json(fail(
      '该单项题目已发生变化，请等待管理员重新校验',
      'MOCK_EXAM_QUESTION_INVALID',
    ))
    return
  }

  const questionIds = module.questions.map((item) => item.question!.id)
  const snapshot = buildSingleModuleExamSnapshot(
    { examType: set.examType },
    {
      id: module.id,
      code: module.code,
      subject: module.label,
      title: module.title,
      subjectCode: module.code,
      durationSeconds: module.durationSeconds,
    },
    questionIds,
  )
  const officialQuestions = module.questions.map((item) => ({
    id: item.question!.id,
    answer: parseJsonArray<string>(item.question!.answer),
  }))

  let examRecordId = ''
  try {
    examRecordId = await prisma.$transaction(async (tx) => {
      const duplicate = await tx.examRecord.findUnique({ where: { startRequestKey } })
      if (duplicate) return duplicate.id
      const startedAt = new Date()
      const expiresAt = new Date(startedAt.getTime() + module.durationSeconds * 1000)
      const record = await tx.examRecord.create({
        data: {
          userId: req.user!.userId,
          paperId: set.paper!.id,
          examType: set.examType,
          totalQuestions: officialQuestions.length,
          correctCount: 0,
          startedAt,
          expiresAt,
          phase: EXAM_PHASE.ANSWERING,
          currentModuleIndex: 0,
          phaseStartedAt: startedAt,
          phaseExpiresAt: expiresAt,
          structureSnapshot: moduleSnapshotJson(snapshot),
          activeDurationSeconds: 0,
          durationSeconds: 0,
          status: EXAM_RECORD_STATUS.IN_PROGRESS,
          startRequestKey,
        },
      })
      await replaceAnswerRecords(tx, record.id, officialQuestions, {}, {}, {}, true)
      return record.id
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const duplicate = await prisma.examRecord.findUnique({ where: { startRequestKey } })
      if (duplicate) examRecordId = duplicate.id
      else throw error
    } else {
      throw error
    }
  }
  const session = await getModuleExamSession(examRecordId, req.user!.userId)
  if (!session) {
    res.status(500).json(fail('单项模考会话创建失败', 'MOCK_EXAM_SESSION_FAILED'))
    return
  }
  setOperationAuditContext(req, {
    resourceType: 'ExamRecord',
    resourceId: examRecordId,
    summary: `开始 ${set.examType} 单项模考“${module.label}”`,
  })
  res.status(201).json(success({ examRecordId, paperId: module.id }))
})

// 创建完整答卷时冻结会员授权、ESAT 科目组合、模块题序和正式时长；允许并存多场未完成模考。
mockExamRouter.post('/papers/:id/attempts', requireAuth, async (req, res) => {
  const requestId = typeof req.body?.startRequestId === 'string'
    ? req.body.startRequestId.trim().slice(0, 100)
    : ''
  if (!requestId || !/^[A-Za-z0-9-]{8,100}$/.test(requestId)) {
    res.status(422).json(fail('开始请求标识无效，请刷新后重试', 'MOCK_EXAM_START_REQUEST_INVALID'))
    return
  }
  const startRequestKey = `${req.user!.userId}:${req.params.id}:${requestId}`
  const existing = await prisma.examRecord.findUnique({ where: { startRequestKey } })
  if (existing) {
    res.json(success({ examRecordId: existing.id, paperId: req.params.id }))
    return
  }

  const set = await prisma.mockPaperSet.findUnique({
    where: { id: req.params.id },
    include: {
      paper: true,
      modules: {
        orderBy: { moduleOrder: 'asc' },
        include: {
          questions: {
            orderBy: { position: 'asc' },
            include: {
              question: {
                select: {
                  id: true,
                  answer: true,
                  status: true,
                  examType: true,
                  subject: true,
                  moduleCode: true,
                },
              },
            },
          },
        },
      },
    },
  })
  if (
    !set
    || set.deletedAt
    || set.status !== MOCK_PAPER_STATUS.PUBLISHED
    || !deriveMockPaperReadiness(set.examType, set.modules).fullExamReady
    || !set.paper
    || set.paper.status !== 'published'
  ) {
    res.status(409).json(fail('该模考卷当前不能开始', 'MOCK_EXAM_NOT_AVAILABLE'))
    return
  }
  if (!(await hasDiagnosticPaperAccess(req.user!.userId, set))) {
    res.status(403).json(fail(
      `当前试卷需要开通 ${set.examType} 会员后才能开始`,
      'MOCK_EXAM_PAPER_LOCKED',
    ))
    return
  }
  const esatModuleCodes = set.examType === EXAM_TYPE.ESAT
    ? await getEsatModuleCodes(req.user!.userId)
    : null
  if (set.examType === EXAM_TYPE.ESAT && !esatModuleCodes) {
    res.status(422).json(fail(
      '请先在个人中心完成 ESAT 三科选择后再开始模考',
      'ESAT_SUBJECTS_REQUIRED',
    ))
    return
  }
  if (
    set.examType === EXAM_TYPE.ESAT
    && !coversEsatModuleSelection(set.modules, esatModuleCodes)
  ) {
    res.status(422).json(fail(
      '当前套卷不能覆盖个人中心设置的完整三科组合',
      'MOCK_EXAM_SUBJECTS_NOT_COVERED',
    ))
    return
  }

  const selectedModules = selectEffectiveModules(set.examType, set.modules, esatModuleCodes)
  const expectedModuleCount = set.examType === EXAM_TYPE.ESAT ? 3 : 2
  if (selectedModules.length !== expectedModuleCount) {
    res.status(422).json(fail('模考卷模块结构不完整', 'MOCK_EXAM_STRUCTURE_INVALID'))
    return
  }
  const invalidQuestion = selectedModules.some((module) =>
    module.validationStatus !== MOCK_PAPER_VALIDATION_STATUS.VALID
    || module.questions.length !== module.expectedQuestionCount
    || module.questions.some((item) =>
      item.validationStatus !== MOCK_PAPER_VALIDATION_STATUS.VALID
      || !item.question
      || item.question.status !== QUESTION_STATUS.PUBLISHED
      || item.question.examType !== set.examType,
    ),
  )
  if (invalidQuestion) {
    res.status(422).json(fail('模考卷题目已发生变化，请等待管理员重新校验', 'MOCK_EXAM_QUESTION_INVALID'))
    return
  }

  const moduleConfig = selectedModules.map((module, index) => ({
    code: module.code,
    subject: module.label,
    subjectCode: module.code,
    order: index + 1,
    durationSeconds: module.durationSeconds,
    questionCount: module.expectedQuestionCount,
  }))
  const orderedQuestionItems = selectedModules.flatMap((module, moduleIndex) =>
    module.questions.map((item) => ({
      question: item.question!,
      moduleCode: module.code,
      moduleOrder: moduleIndex + 1,
    })),
  )
  const snapshot = buildModuleExamSnapshot(
    {
      id: set.paper.id,
      examType: set.examType,
      deliveryMode: PAPER_DELIVERY_MODE.MODULE_SEQUENCE,
      breakDurationSeconds: set.examType === EXAM_TYPE.ESAT ? 180 : 0,
      moduleConfig,
    },
    orderedQuestionItems.map((item) => ({
      id: item.question.id,
      moduleCode: item.moduleCode,
      moduleOrder: item.moduleOrder,
    })),
  )
  const officialQuestions = orderedQuestionItems.map((item) => ({
    id: item.question.id,
    answer: parseJsonArray<string>(item.question.answer),
  }))

  let examRecordId = ''
  try {
    examRecordId = await prisma.$transaction(async (tx) => {
      const duplicate = await tx.examRecord.findUnique({ where: { startRequestKey } })
      if (duplicate) return duplicate.id
      const startedAt = new Date()
      const expiresAt = new Date(startedAt.getTime() + snapshot.modules[0].durationSeconds * 1000)
      const record = await tx.examRecord.create({
        data: {
          userId: req.user!.userId,
          paperId: set.paper!.id,
          examType: set.examType,
          totalQuestions: officialQuestions.length,
          correctCount: 0,
          startedAt,
          expiresAt,
          phase: EXAM_PHASE.ANSWERING,
          currentModuleIndex: 0,
          phaseStartedAt: startedAt,
          phaseExpiresAt: expiresAt,
          structureSnapshot: moduleSnapshotJson(snapshot),
          activeDurationSeconds: 0,
          durationSeconds: 0,
          status: EXAM_RECORD_STATUS.IN_PROGRESS,
          startRequestKey,
        },
      })
      await replaceAnswerRecords(tx, record.id, officialQuestions, {}, {}, {}, true)
      return record.id
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const duplicate = await prisma.examRecord.findUnique({ where: { startRequestKey } })
      if (duplicate) examRecordId = duplicate.id
      else throw error
    } else {
      throw error
    }
  }
  const session = await getModuleExamSession(examRecordId, req.user!.userId)
  if (!session) {
    res.status(500).json(fail('模考会话创建失败', 'MOCK_EXAM_SESSION_FAILED'))
    return
  }
  setOperationAuditContext(req, {
    resourceType: 'ExamRecord',
    resourceId: examRecordId,
    summary: `开始 ${set.examType} 无限模考“${set.title}”`,
  })
  res.status(201).json(success({ examRecordId, paperId: set.id }))
})

// 放弃仅删除目标未完成答卷，不影响同套卷的其他进行中或历史记录。
mockExamRouter.delete('/attempts/:id', requireAuth, async (req, res) => {
  const record = await prisma.examRecord.findFirst({
    where: {
      id: req.params.id,
      userId: req.user!.userId,
      status: EXAM_RECORD_STATUS.IN_PROGRESS,
      paper: { paperType: { in: [...MOCK_PAPER_TYPES] } },
    },
    include: { paper: { select: { title: true } } },
  })
  if (!record) {
    res.status(404).json(fail('未完成模考不存在或已经结束', 'MOCK_EXAM_ATTEMPT_NOT_FOUND'))
    return
  }
  await prisma.examRecord.delete({ where: { id: record.id } })
  setOperationAuditContext(req, {
    resourceType: 'ExamRecord',
    resourceId: record.id,
    summary: `放弃无限模考“${record.paper.title}”`,
  })
  res.json(success(null))
})
