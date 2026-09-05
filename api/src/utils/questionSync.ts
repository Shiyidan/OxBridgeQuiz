// 维护 Question 官方数据源的批量同步、读取与前端结构格式化。
import type { Prisma } from '@prisma/client'
import {
  isQuestionDifficulty,
  type QuestionDifficulty,
} from '../constants/domain.js'
import { prisma } from '../services/prisma.js'
import { parseJsonArray, parseJsonObject } from './jsonField.js'
import { createQuestionUniqueCode } from './id.js'

// 仅缺失值和标准 unknown 可落为空；其他非三档难度直接拒绝，不兼容旧难度枚举。
function normalizeDifficulty(value: unknown): QuestionDifficulty | null {
  if (value === undefined || value === null || value === '' || value === 'unknown') return null
  if (!isQuestionDifficulty(value)) {
    throw new Error('题目难度仅支持 easy、medium、hard 或 unknown')
  }
  return value
}

// 题目覆盖与试卷更新共用同一事务客户端时，避免结构锁检查和实际写入之间出现竞态。
async function syncPaperQuestionsWithClient(
  tx: Prisma.TransactionClient,
  paperId: string,
  questions: any[],
): Promise<void> {
    const [paper, directAttemptCount, indirectAnswerCount] = await Promise.all([
      tx.paper.findUnique({ where: { id: paperId }, select: { examType: true } }),
      tx.examRecord.count({ where: { paperId } }),
      tx.answerRecord.count({ where: { question: { paperId } } }),
    ])
    if (directAttemptCount > 0 || indirectAnswerCount > 0) {
      throw new Error('该试卷已有考试记录，不能覆盖题目结构；请创建新版本')
    }

    await tx.question.deleteMany({ where: { paperId } })
    if (!questions.length) return

    const paperExamType = paper?.examType || 'TMUA'
    const rows = questions.map((q: any, index) => {
      const questionNumber = q.number ?? index + 1

      return {
        uniqueCode: createQuestionUniqueCode(paperId, questionNumber),
        sourceQuestionCode: q.code || null,
        paperId,
        examType: q.examType || paperExamType,
        number: questionNumber,
        moduleCode: q.module_code || null,
        moduleOrder: Number.isInteger(q.module_order) ? q.module_order : null,
        moduleQuestionNumber: Number.isFinite(q.module_question_number)
          ? q.module_question_number
          : null,
        title: q.title ?? '',
        options: Array.isArray(q.options) ? q.options : [],
        answer: Array.isArray(q.answer) ? q.answer : [],
        subject: q.subject || null,
        subjectCode: q.subject_code || null,
        questionType: q.question_type || null,
        difficulty: normalizeDifficulty(q.difficulty),
        qualityTier: q.qualityTier || null,
        topic: q.topic || null,
        topicCode: q.topic_code || null,
        knowledgePoints: Array.isArray(q.knowledge_points) ? q.knowledge_points : [],
        syllabusPoints: Array.isArray(q.syllabus_points) ? q.syllabus_points : [],
        attemptPayload: {
          code: q.code,
          source_examType: q.source_examType,
          year: q.year,
          is_ai_generated: q.is_ai_generated,
          content_blocks: q.content_blocks,
          images: q.images,
        },
        meta: {
          learning_analysis: q.learning_analysis,
        },
      }
    })

    await tx.question.createMany({ data: rows })
}

/** 将题目数组写入 Question 表，覆盖该试卷下所有已有题目 */
export async function syncPaperQuestions(
  paperId: string,
  questions: any[],
  transactionClient?: Prisma.TransactionClient,
): Promise<void> {
  if (transactionClient) {
    await syncPaperQuestionsWithClient(transactionClient, paperId, questions)
    return
  }
  await prisma.$transaction((tx) => syncPaperQuestionsWithClient(tx, paperId, questions))
}

/** 从 Question 表读取试卷的题目列表（按 number 排序） */
export function getPaperQuestions(paperId: string) {
  return prisma.question.findMany({
    where: { paperId },
    orderBy: { number: 'asc' },
  })
}

/** 将 Question 行还原为前端使用的题目对象格式 */
export function formatQuestionRow(row: any): Record<string, any> {
  const attemptPayload = parseJsonObject<Record<string, any>>(row.attemptPayload)
  const meta = parseJsonObject<Record<string, any>>(row.meta)
  return {
    ...attemptPayload,
    ...meta,
    id: row.id,
    uniqueCode: row.uniqueCode,
    code: row.sourceQuestionCode || attemptPayload.code || meta.code,
    examType: row.examType,
    number: row.number,
    module_code: row.moduleCode,
    module_order: row.moduleOrder,
    module_question_number: row.moduleQuestionNumber,
    title: row.title,
    options: parseJsonArray(row.options),
    answer: parseJsonArray<string>(row.answer),
    subject: row.subject,
    subject_code: row.subjectCode,
    question_type: row.questionType,
    difficulty: normalizeDifficulty(row.difficulty),
    qualityTier: row.qualityTier || meta.qualityTier || null,
    topic: row.topic,
    topic_code: row.topicCode,
    knowledge_points: parseJsonArray(row.knowledgePoints),
    syllabus_points: parseJsonArray(row.syllabusPoints),
  }
}
