import { prisma } from '../services/prisma.js'
import { parseJsonArray, parseJsonObject } from './jsonField.js'
import { createQuestionUniqueCode } from './id.js'

function normalizeDifficulty(value: any): string {
  return typeof value === 'string' ? value : ''
}

/** 将题目数组写入 Question 表，覆盖该试卷下所有已有题目 */
export async function syncPaperQuestions(paperId: string, questions: any[]): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const [paper, attemptCount] = await Promise.all([
      tx.paper.findUnique({ where: { id: paperId }, select: { examType: true } }),
      tx.examRecord.count({ where: { paperId } }),
    ])
    if (attemptCount > 0) {
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
        moduleCode: q.component_code || q.module_code || null,
        moduleOrder: Number.isInteger(q.component_order ?? q.module_order)
          ? (q.component_order ?? q.module_order)
          : null,
        moduleQuestionNumber: Number.isFinite(
          q.component_question_number ?? q.module_question_number,
        )
          ? (q.component_question_number ?? q.module_question_number)
          : null,
        title: q.title ?? '',
        options: Array.isArray(q.options) ? q.options : [],
        answer: Array.isArray(q.answer) ? q.answer : [],
        subject: q.subject || null,
        subjectCode: q.subject_code || null,
        questionType: q.question_type || null,
        difficulty: normalizeDifficulty(q.difficulty),
        topic: q.topic || null,
        topicCode: q.topic_code || null,
        knowledgePoints: Array.isArray(q.knowledge_points) ? q.knowledge_points : [],
        syllabusPoints: Array.isArray(q.syllabus_points) ? q.syllabus_points : [],
        meta: {
          code: q.code,
          source_examType: q.source_examType,
          year: q.year,
          is_ai_generated: q.is_ai_generated,
          content_blocks: q.content_blocks,
          images: q.images,
          learning_analysis: q.learning_analysis,
        },
      }
    })

    await tx.question.createMany({ data: rows })
  })
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
  const meta = parseJsonObject<Record<string, any>>(row.meta)
  return {
    ...meta,
    id: row.id,
    uniqueCode: row.uniqueCode,
    code: row.sourceQuestionCode || meta.code,
    examType: row.examType,
    number: row.number,
    // 对外标准使用 module_*；component_* 仅保留给早期组合卷和旧页面兼容。
    module_code: row.moduleCode,
    module_order: row.moduleOrder,
    module_question_number: row.moduleQuestionNumber,
    component_code: row.moduleCode,
    component_order: row.moduleOrder,
    component_question_number: row.moduleQuestionNumber,
    title: row.title,
    options: parseJsonArray(row.options),
    answer: parseJsonArray<string>(row.answer),
    subject: row.subject,
    subject_code: row.subjectCode,
    question_type: row.questionType,
    difficulty: normalizeDifficulty(row.difficulty),
    topic: row.topic,
    topic_code: row.topicCode,
    knowledge_points: parseJsonArray(row.knowledgePoints),
    syllabus_points: parseJsonArray(row.syllabusPoints),
  }
}
