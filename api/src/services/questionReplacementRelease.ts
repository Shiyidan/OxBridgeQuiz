// 题目替换批次发布服务：保留旧题与旧答卷，切换题库和模考的新作答入口到不可变新版本。
import { Prisma } from '@prisma/client'
import { randomUUID } from 'node:crypto'

import {
  MOCK_PAPER_MODULE_STATUS,
  MOCK_PAPER_STATUS,
  MOCK_PAPER_VALIDATION_STATUS,
  QUESTION_STATUS,
} from '../constants/domain.js'
import { prisma } from './prisma.js'
import { revalidateMockPaperSet } from './mockPaperLibrary.js'

export class QuestionReplacementReleaseError extends Error {
  constructor(readonly issues: string[]) {
    super(issues[0] || '题目替换批次无法发布')
  }
}

type ReplacementReleaseResult = {
  questionCount: number
  updatedQuestions: number
  replacementCount: number
  archivedQuestionCount: number
  updatedDraftMockPaperCount: number
  versionedMockPapers: Array<{
    previousSetId: string
    currentSetId: string
    sequenceNo: number
    previousVersion: number
    currentVersion: number
    code: string
  }>
}

// 内部 code 随版本变化，学生端仍按 sequenceNo 展示稳定的 No.001 等业务编号。
function versionedMockPaperCode(code: string, version: number): string {
  const base = code.replace(/-V[1-9]\d*$/i, '')
  const suffix = `-V${version}`
  return `${base.slice(0, Math.max(1, 100 - suffix.length))}${suffix}`
}

// Nullable Json 字段只在有值时复制，避免把数据库 null 错写为 JSON 字符串。
function optionalJson<T extends string>(key: T, value: Prisma.JsonValue | null) {
  return value === null ? {} : { [key]: value as Prisma.InputJsonValue }
}

// 发布替换批次时一次完成新题上线、旧题归档以及已开放模考的内部版本切换。
export async function releaseQuestionReplacementBatch(
  batchId: string,
): Promise<ReplacementReleaseResult> {
  const batch = await prisma.questionImportBatch.findUnique({
    where: { id: batchId },
    include: {
      questions: {
        where: { paperId: null },
        include: {
          replacesQuestion: {
            select: {
              id: true,
              uniqueCode: true,
              examType: true,
              moduleCode: true,
              status: true,
            },
          },
        },
      },
    },
  })
  if (!batch) throw new QuestionReplacementReleaseError(['上传包不存在'])

  const replacements = batch.questions.filter((question) => question.replacesQuestionId)
  if (!replacements.length) {
    throw new QuestionReplacementReleaseError(['上传包不包含替换题'])
  }
  if (replacements.some((question) => !question.replacesQuestion)) {
    throw new QuestionReplacementReleaseError(['替换题缺少可追溯的原题关系'])
  }

  const releaseIssues: string[] = []
  for (const replacement of replacements) {
    const original = replacement.replacesQuestion!
    const originCanBeReplaced = (
      original.status === QUESTION_STATUS.PUBLISHED
      || original.status === QUESTION_STATUS.ARCHIVED
    )
    if (!originCanBeReplaced) {
      releaseIssues.push(`${original.uniqueCode} 当前不是已发布或已归档状态`)
    }
    if (replacement.examType !== original.examType) {
      releaseIssues.push(`${replacement.uniqueCode} 与原题考试类型不一致`)
    }
    if (replacement.moduleCode !== original.moduleCode) {
      releaseIssues.push(`${replacement.uniqueCode} 与原题所属模块不一致`)
    }
  }
  if (releaseIssues.length) throw new QuestionReplacementReleaseError(releaseIssues)

  const oldQuestionIds = replacements.map((question) => question.replacesQuestion!.id)
  const replacementByOldQuestionId = new Map(
    replacements.map((question) => [question.replacesQuestion!.id, question]),
  )
  const affectedSets = await prisma.mockPaperSet.findMany({
    where: {
      deletedAt: null,
      status: { not: MOCK_PAPER_STATUS.ARCHIVED },
      modules: { some: { questions: { some: { questionId: { in: oldQuestionIds } } } } },
    },
    include: {
      paper: { include: { _count: { select: { examRecords: true } } } },
      modules: {
        orderBy: { moduleOrder: 'asc' },
        include: { questions: { orderBy: { position: 'asc' } } },
      },
    },
  })

  const versionedSets = affectedSets.filter((set) => (
    set.status === MOCK_PAPER_STATUS.PUBLISHED
    || set.modules.some((module) => module.publicationStatus === MOCK_PAPER_MODULE_STATUS.PUBLISHED)
    || Boolean(set.paper?._count.examRecords)
  ))
  const editableDraftSets = affectedSets.filter((set) => !versionedSets.includes(set))
  const incompleteRuntimeSets = versionedSets.filter((set) => !set.paper)
  if (incompleteRuntimeSets.length) {
    throw new QuestionReplacementReleaseError(
      incompleteRuntimeSets.map((set) => `${set.code} 已开放或已有答卷，但缺少运行 Paper`),
    )
  }
  const nextSetIdByOldSetId = new Map(
    versionedSets.map((set) => [set.id, randomUUID()] as const),
  )
  const nextModuleIdByOldModuleId = new Map(
    versionedSets.flatMap((set) => (
      set.modules.map((module) => [module.id, randomUUID()] as const)
    )),
  )
  const missingCompositionSources = versionedSets.flatMap((set) => (
    set.modules.filter((module) => (
      module.sourceModuleId && !nextModuleIdByOldModuleId.has(module.sourceModuleId)
    ))
  ))
  if (missingCompositionSources.length) {
    throw new QuestionReplacementReleaseError(
      missingCompositionSources.map((module) => (
        `${module.code} 的来源单项不在本次换版范围内，无法保留组卷关系`
      )),
    )
  }

  const releasedAt = new Date()
  const result = await prisma.$transaction(async (tx) => {
    const versionedMockPapers: ReplacementReleaseResult['versionedMockPapers'] = []

    await tx.question.updateMany({
      where: { importBatchId: batch.id, paperId: null },
      data: {
        status: QUESTION_STATUS.PUBLISHED,
        publishedAt: releasedAt,
        archivedAt: null,
      },
    })

    for (const set of versionedSets) {
      const latest = await tx.mockPaperSet.findFirst({
        where: { examType: set.examType, sequenceNo: set.sequenceNo },
        orderBy: { version: 'desc' },
        select: { version: true },
      })
      const currentVersion = (latest?.version || set.version) + 1
      const code = versionedMockPaperCode(set.code, currentVersion)
      const newSet = await tx.mockPaperSet.create({
        data: {
          id: nextSetIdByOldSetId.get(set.id)!,
          code,
          sequenceNo: set.sequenceNo,
          examType: set.examType,
          title: set.title,
          accessTier: set.accessTier,
          status: set.status === MOCK_PAPER_STATUS.PUBLISHED
            ? MOCK_PAPER_STATUS.PUBLISHED
            : MOCK_PAPER_STATUS.DRAFT,
          version: currentVersion,
          sourceFileName: set.sourceFileName,
          issueCount: set.issueCount,
          questionCount: set.questionCount,
          issues: set.issues as Prisma.InputJsonValue,
          publishedAt: set.status === MOCK_PAPER_STATUS.PUBLISHED ? releasedAt : null,
          archivedAt: null,
          modules: {
            create: set.modules.map((module) => ({
              id: nextModuleIdByOldModuleId.get(module.id)!,
              sourceModuleId: null,
              code: module.code,
              label: module.label,
              title: module.title,
              accessTier: module.accessTier,
              moduleOrder: module.moduleOrder,
              durationSeconds: module.durationSeconds,
              expectedQuestionCount: module.expectedQuestionCount,
              questionCount: module.questionCount,
              validationStatus: module.validationStatus,
              publicationStatus: module.publicationStatus,
              issueCount: module.issueCount,
              issues: module.issues as Prisma.InputJsonValue,
              publishedAt: module.publicationStatus === MOCK_PAPER_MODULE_STATUS.PUBLISHED
                ? releasedAt
                : module.publishedAt,
              archivedAt: null,
              questions: {
                create: module.questions.map((item) => {
                  const replacement = item.questionId
                    ? replacementByOldQuestionId.get(item.questionId)
                    : null
                  return {
                    questionId: replacement?.id || item.questionId,
                    sourceCode: replacement?.uniqueCode || item.sourceCode,
                    position: item.position,
                    validationStatus: item.validationStatus,
                    issues: item.issues as Prisma.InputJsonValue,
                  }
                }),
              },
            })),
          },
        },
      })
      const oldPaper = set.paper!
      const paperId = `mock-paper-${newSet.id}`
      await tx.paper.create({
        data: {
          id: paperId,
          title: oldPaper.title,
          code,
          examType: oldPaper.examType,
          year: oldPaper.year,
          duration: oldPaper.duration,
          totalQuestions: oldPaper.totalQuestions,
          paperType: oldPaper.paperType,
          accessTier: oldPaper.accessTier,
          deliveryMode: oldPaper.deliveryMode,
          breakDurationSeconds: oldPaper.breakDurationSeconds,
          ...optionalJson('moduleConfig', oldPaper.moduleConfig),
          assemblyType: oldPaper.assemblyType,
          ...optionalJson('sourceExamTypes', oldPaper.sourceExamTypes),
          remarks: oldPaper.remarks,
          pdfUrl: oldPaper.pdfUrl,
          status: 'published',
        },
      })
      await tx.mockPaperSet.update({
        where: { id: newSet.id },
        data: { paperId },
      })
      await tx.mockPaperModule.updateMany({
        where: { mockPaperSetId: set.id },
        data: {
          publicationStatus: MOCK_PAPER_MODULE_STATUS.ARCHIVED,
          archivedAt: releasedAt,
        },
      })
      await tx.mockPaperSet.update({
        where: { id: set.id },
        data: { status: MOCK_PAPER_STATUS.ARCHIVED, archivedAt: releasedAt },
      })
      await tx.paper.update({
        where: { id: oldPaper.id },
        data: { status: 'archived' },
      })
      versionedMockPapers.push({
        previousSetId: set.id,
        currentSetId: newSet.id,
        sequenceNo: set.sequenceNo,
        previousVersion: set.version,
        currentVersion,
        code,
      })
    }

    for (const set of versionedSets) {
      for (const module of set.modules) {
        if (!module.sourceModuleId) continue
        await tx.mockPaperModule.update({
          where: { id: nextModuleIdByOldModuleId.get(module.id)! },
          data: { sourceModuleId: nextModuleIdByOldModuleId.get(module.sourceModuleId)! },
        })
      }
    }

    for (const set of editableDraftSets) {
      for (const module of set.modules) {
        const replacementSourceModuleId = module.sourceModuleId
          ? nextModuleIdByOldModuleId.get(module.sourceModuleId)
          : undefined
        if (replacementSourceModuleId) {
          await tx.mockPaperModule.update({
            where: { id: module.id },
            data: { sourceModuleId: replacementSourceModuleId },
          })
        }
        for (const item of module.questions) {
          if (!item.questionId) continue
          const replacement = replacementByOldQuestionId.get(item.questionId)
          if (!replacement) continue
          await tx.mockPaperQuestion.update({
            where: { id: item.id },
            data: {
              questionId: replacement.id,
              sourceCode: replacement.uniqueCode,
              validationStatus: MOCK_PAPER_VALIDATION_STATUS.VALID,
              issues: [],
            },
          })
        }
      }
    }

    const archivedQuestions = await tx.question.updateMany({
      where: { id: { in: oldQuestionIds } },
      data: {
        status: QUESTION_STATUS.ARCHIVED,
        archivedAt: releasedAt,
      },
    })

    return {
      questionCount: batch.questions.length,
      updatedQuestions: batch.questions.length,
      replacementCount: replacements.length,
      archivedQuestionCount: archivedQuestions.count,
      updatedDraftMockPaperCount: editableDraftSets.length,
      versionedMockPapers,
    }
  })

  const revalidationResults = await Promise.allSettled(
    editableDraftSets.map((set) => revalidateMockPaperSet(set.id)),
  )
  revalidationResults.forEach((revalidation, index) => {
    if (revalidation.status === 'rejected') {
      console.error(
        `[question-replacement] draft mock revalidation failed set=${editableDraftSets[index].id}:`,
        revalidation.reason,
      )
    }
  })
  return result
}
