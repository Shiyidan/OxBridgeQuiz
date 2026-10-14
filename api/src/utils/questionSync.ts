// 维护 Question 官方数据源的批量同步、读取与前端结构格式化。
import type { Prisma } from '@prisma/client'
import { randomUUID } from 'node:crypto'
import { isDeepStrictEqual } from 'node:util'
import {
  isQuestionDifficulty,
  type QuestionDifficulty,
} from '../constants/domain.js'
import { prisma } from '../services/prisma.js'
import { parseJsonArray } from './jsonField.js'
import { createQuestionUniqueCode } from './id.js'
import { questionJsonArray } from './questionMeta.js'
import { buildQuestionStorage, questionObject, getQuestionAnswer, solutionToLearningAnalysis } from './questionDocument.js'

// 仅缺失值和标准 unknown 可落为空；其他非三档难度直接拒绝，不兼容旧难度枚举。
function normalizeDifficulty(value: unknown): QuestionDifficulty | null {
  if (value === undefined || value === null || value === '' || value === 'unknown') return null
  if (!isQuestionDifficulty(value)) {
    throw new Error('题目难度仅支持 easy、medium、hard 或 unknown')
  }
  return value
}

type QuestionSyncOptions = { mode: 'solution-formatting' }

// 解析排版维护只原位更新说明文字，保留答案、题目 ID 与已有作答关联，并拒绝过期的修正计划。
async function syncSolutionFormatting(
  tx: Prisma.TransactionClient,
  paperId: string | null,
  patches: any[],
): Promise<string[]> {
  if (!paperId || patches.some((patch) => !patch || typeof patch.id !== 'string')) {
    throw new Error('解析排版修正必须指定试卷和已有题目 ID')
  }
  const ids = patches.map((patch) => patch.id as string)
  if (new Set(ids).size !== ids.length) throw new Error('解析排版修正包含重复题目')
  const rows = await tx.question.findMany({ where: { paperId, id: { in: ids } } })
  if (rows.length !== ids.length) throw new Error('解析排版修正包含不属于该试卷的题目')
  const byId = new Map(rows.map((row) => [row.id, row]))
  const editableFields = new Set(['correctSolution', 'examFocus', 'reviewGuidance', 'commonErrorCauses'])
  const updates = patches.map((patch) => {
    if (Object.keys(patch).some((key) => !['id', 'expectedSolution', 'solution'].includes(key))) {
      throw new Error('解析排版修正不能更改题目结构')
    }
    const row = byId.get(patch.id)!
    if (!isDeepStrictEqual(row.solution, patch.expectedSolution)) {
      throw new Error(`题目 ${row.id} 的解析已变化，请重新生成修正计划`)
    }
    const before = questionObject(row.solution, 'solution')
    const after = questionObject(patch.solution, 'solution')
    for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
      if (isDeepStrictEqual(before[key], after[key])) continue
      if (!editableFields.has(key)) throw new Error('解析排版修正不能更改答案或其他解析结构')
      if (key === 'commonErrorCauses') {
        if (!Array.isArray(before[key]) || !Array.isArray(after[key])
          || before[key].length !== after[key].length || after[key].some((value: unknown) => typeof value !== 'string')) {
          throw new Error('解析排版修正必须保留易错原因的条目结构')
        }
      } else if (typeof before[key] !== 'string' || typeof after[key] !== 'string') {
        throw new Error('解析排版修正仅支持已有说明文字')
      }
    }
    return { row, solution: after as Prisma.InputJsonObject }
  })
  // 先验证整批计划，再以更新时间防止并发编辑被覆盖；任何冲突由调用事务整体回滚。
  for (const { row, solution } of updates) {
    const result = await tx.question.updateMany({
      where: { id: row.id, paperId, updatedAt: row.updatedAt }, data: { solution },
    })
    if (result.count !== 1) throw new Error(`题目 ${row.id} 已被并发修改，请重新生成修正计划`)
  }
  return ids
}

// 题目覆盖与试卷更新共用同一事务客户端时，避免结构锁检查和实际写入之间出现竞态。
async function syncPaperQuestionsWithClient(
  tx: Prisma.TransactionClient,
  paperId: string | null,
  questions: any[],
): Promise<string[]> {
    const [paper, directAttemptCount, indirectAnswerCount] = paperId ? await Promise.all([
      tx.paper.findUnique({ where: { id: paperId }, select: { examType: true } }),
      tx.examRecord.count({ where: { paperId } }),
      tx.answerRecord.count({ where: { question: { paperId } } }),
    ]) : [null, 0, 0] as const
    if (directAttemptCount > 0 || indirectAnswerCount > 0) {
      throw new Error('该试卷已有考试记录，不能覆盖题目结构；请创建新版本')
    }

    const paperExamType = paper?.examType || 'TMUA'
    const rows = questions.map((q: any, index) => {
      const questionNumber = q.number ?? index + 1

      return {
        id: randomUUID(),
        uniqueCode: paperId ? createQuestionUniqueCode(paperId, questionNumber) : q.code,
        sourceQuestionCode: q.code || null,
        paperId,
        ...(!paperId ? {
          importBatchId: q.importBatchId,
          replacesQuestionId: q.replacesQuestionId || null,
          revisionVersion: q.revisionVersion ?? null,
          revisionReason: q.revisionReason || null,
        } : {}),
        examType: q.examType || paperExamType,
        number: questionNumber,
        moduleCode: q.module_code || null,
        moduleOrder: Number.isInteger(q.module_order) ? q.module_order : null,
        moduleQuestionNumber: Number.isFinite(q.module_question_number)
          ? q.module_question_number
          : null,
        title: q.title ?? '',
        ...buildQuestionStorage(q),
        subject: q.subject || null,
        subjectCode: q.subject_code || null,
        questionType: q.question_type || null,
        difficulty: normalizeDifficulty(q.difficulty),
        qualityTier: q.qualityTier || null,
        topic: q.topic || null,
        topicCode: q.topic_code || null,
        knowledgePoints: questionJsonArray(q.knowledge_points, 'knowledge_points'),
      }
    })

    // 整批内容构建成功后才能覆盖；独立题库只追加，禁止按 paperId=null 批量删除。
    if (paperId) await tx.question.deleteMany({ where: { paperId } })
    if (rows.length) await tx.question.createMany({ data: rows })
    return rows.map((row) => row.id)
}

// 统一题目写入入口：结构导入遵守作答锁，解析排版维护只原位更新文字并保留题目身份。
export async function syncPaperQuestions(
  paperId: string | null,
  questions: any[],
  transactionClient?: Prisma.TransactionClient,
  options?: QuestionSyncOptions,
): Promise<string[]> {
  if (options?.mode === 'solution-formatting') {
    if (transactionClient) return syncSolutionFormatting(transactionClient, paperId, questions)
    return prisma.$transaction((tx) => syncSolutionFormatting(tx, paperId, questions))
  }
  if (paperId === null && questions.some((q) => !q.importBatchId || !q.code || !q.examType)) {
    throw new Error('独立试题必须提供 importBatchId、code 和 examType')
  }
  if (transactionClient) {
    return syncPaperQuestionsWithClient(transactionClient, paperId, questions)
  }
  return prisma.$transaction((tx) => syncPaperQuestionsWithClient(tx, paperId, questions))
}

// 从 Question 表读取试卷的题目列表（按 number 排序）
export function getPaperQuestions(paperId: string) {
  return prisma.question.findMany({
    where: { paperId },
    orderBy: { number: 'asc' },
  })
}

// 将唯一题目源中的 content、solution 和 meta 映射为既有题卡 DTO，避免业务页面自行兼容字段。
export function formatQuestionRow(row: any): Record<string, any> {
  const meta = questionObject(row.meta, 'meta')
  const content = questionObject(row.content, 'content')
  const source = questionObject(meta.source ?? {}, 'meta.source')
  return {
    content_blocks: content.blocks,
    images: content.images,
    learning_analysis: solutionToLearningAnalysis(row.solution),
    source_examType: source.examType,
    year: source.year,
    is_ai_generated: meta.is_ai_generated,
    origin: meta.origin,
    revision: meta.revision,
    id: row.id,
    uniqueCode: row.uniqueCode,
    code: row.sourceQuestionCode || source.questionCode,
    examType: row.examType,
    number: row.number,
    module_code: row.moduleCode,
    module_order: row.moduleOrder,
    module_question_number: row.moduleQuestionNumber,
    title: row.title,
    options: questionJsonArray(content.options, 'content.options'),
    answer: getQuestionAnswer(row),
    subject: row.subject,
    subject_code: row.subjectCode,
    question_type: row.questionType,
    difficulty: normalizeDifficulty(row.difficulty),
    qualityTier: row.qualityTier || meta.qualityTier || null,
    topic: row.topic,
    topic_code: row.topicCode,
    knowledge_points: parseJsonArray(row.knowledgePoints),
  }
}
