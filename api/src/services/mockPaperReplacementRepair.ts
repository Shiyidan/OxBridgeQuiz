// 历史模考漏换题补处理：只调整当前模考引用，沿替换链寻找已发布新题并默认提供只读计划。
import { Prisma } from '@prisma/client'

import { EXAM_TYPE, QUESTION_STATUS } from '../constants/domain.js'
import { buildMockPaperNumber } from '../utils/mockPaperNumber.js'
import {
  applyMockPaperReplacementPlan,
  findMockPaperReplacementPlan,
  MockPaperReplacementError,
  type MockPaperQuestionReplacement,
} from './mockPaperQuestionReplacement.js'
import { prisma } from './prisma.js'

type RepairOptions = {
  examType: typeof EXAM_TYPE.ESAT | typeof EXAM_TYPE.TMUA
  apply: boolean
  setIds?: string[]
}

type ReplacementChainNode = {
  id: string
  rootId: string
  examType: string
  moduleCode: string | null
  visited: Set<string>
}

// 一层一次批量读取，允许 A→已归档 B→已发布 C，未发布的新题不会被提前带入试卷。
async function findPublishedReplacements(
  tx: Prisma.TransactionClient,
  options: RepairOptions,
): Promise<Map<string, MockPaperQuestionReplacement>> {
  const originals = await tx.question.findMany({
    where: {
      examType: options.examType,
      status: QUESTION_STATUS.ARCHIVED,
      mockPaperLinks: {
        some: options.setIds
          ? { module: { mockPaperSetId: { in: options.setIds } } }
          : {},
      },
    },
    orderBy: { id: 'asc' },
    select: { id: true, examType: true, moduleCode: true },
  })
  const replacements = new Map<string, MockPaperQuestionReplacement>()
  let frontier: ReplacementChainNode[] = originals.map((question) => ({
    ...question,
    rootId: question.id,
    visited: new Set([question.id]),
  }))
  while (frontier.length) {
    const successors = await tx.question.findMany({
      where: { replacesQuestionId: { in: [...new Set(frontier.map((node) => node.id))] } },
      select: {
        id: true, uniqueCode: true, replacesQuestionId: true,
        status: true, examType: true, moduleCode: true,
      },
    })
    const successorByParent = new Map(successors.map((question) => [question.replacesQuestionId, question]))
    const nextFrontier: ReplacementChainNode[] = []
    for (const node of frontier) {
      const successor = successorByParent.get(node.id)
      if (!successor) continue
      if (node.visited.has(successor.id)) {
        throw new MockPaperReplacementError('题目替换关系出现循环，补处理已停止')
      }
      if (successor.examType !== node.examType || successor.moduleCode !== node.moduleCode) {
        throw new MockPaperReplacementError(`${successor.uniqueCode} 的考试或模块与原题不一致`)
      }
      if (successor.status === QUESTION_STATUS.PUBLISHED) {
        replacements.set(node.rootId, { id: successor.id, uniqueCode: successor.uniqueCode })
      } else if (successor.status === QUESTION_STATUS.ARCHIVED) {
        nextFrontier.push({
          ...node,
          id: successor.id,
          visited: new Set([...node.visited, successor.id]),
        })
      }
    }
    frontier = nextFrontier
  }
  return replacements
}

// dry-run 和 apply 使用同一计划；写模式仅修模考，不改变题目发布状态或自动开放已下线的卷。
export async function repairMockPaperQuestionReplacements(options: RepairOptions) {
  if (options.examType !== EXAM_TYPE.ESAT && options.examType !== EXAM_TYPE.TMUA) {
    throw new MockPaperReplacementError('补处理仅支持 ESAT 或 TMUA')
  }
  if (options.setIds?.some((id) => !id.trim())) {
    throw new MockPaperReplacementError('指定的模考记录编号不能为空')
  }
  return prisma.$transaction(async (tx) => {
    const replacements = await findPublishedReplacements(tx, options)
    const plan = await findMockPaperReplacementPlan(tx, replacements, options.setIds)
    const affectedQuestionIds = new Set<string>()
    // 原始单项和完整卷拥有不同编号池，计划逐资产显示各自编号及需要更新的题位。
    const summarizeModule = (module: { title: string | null; label: string; publicationStatus: string; questions: Array<{ questionId: string | null; position: number }> }) => ({
      title: module.title || module.label,
      publicationStatus: module.publicationStatus,
      questionPositions: module.questions.flatMap((item) => {
        if (!item.questionId || !replacements.has(item.questionId)) return []
        affectedQuestionIds.add(item.questionId)
        return [item.position]
      }),
    })
    const plans = [
      ...plan.canonicalChanges.map(({ module, action }) => ({
        id: module.mockPaperSetId,
        moduleId: module.id,
        kind: 'single' as const,
        seriesId: module.seriesId!,
        sequenceNo: buildMockPaperNumber(module.series!.examType, module.series!.sequenceNo, module.version, module.series!.moduleCode),
        version: module.version!,
        action,
        modules: [summarizeModule(module)],
      })),
      ...plan.fullChanges.map(({ set, action }) => ({
        id: set.id,
        kind: 'full' as const,
        seriesId: set.seriesId!,
        sequenceNo: buildMockPaperNumber(set.examType, set.series!.sequenceNo, set.version),
        version: set.version,
        action,
        modules: set.modules.map(summarizeModule),
      })),
    ]
    const result = options.apply
      ? await applyMockPaperReplacementPlan(tx, plan, replacements, new Date())
      : { updatedDraftMockPaperCount: 0, versionedMockPapers: [] }
    return {
      apply: options.apply,
      replacementQuestionCount: affectedQuestionIds.size,
      plans,
      ...result,
    }
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    maxWait: 10_000,
    timeout: 120_000,
  })
}
