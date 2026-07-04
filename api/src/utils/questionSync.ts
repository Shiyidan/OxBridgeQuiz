import { prisma } from '../services/prisma.js'

function normalizeDifficulty(value: any): string {
  return typeof value === 'string' ? value : ''
}

/** 将题目数组写入 Question 表，覆盖该试卷下所有已有题目 */
export async function syncPaperQuestions(paperId: string, questions: any[]): Promise<void> {
  await prisma.question.deleteMany({ where: { paperId } })

  if (!questions.length) return

  const paper = await prisma.paper.findUnique({
    where: { id: paperId },
    select: { examType: true },
  })
  const paperExamType = paper?.examType || 'TMUA'

  const rows = questions.map((q: any) => ({
    paperId,
    examType: q.examType || paperExamType,
    number: q.number ?? 0,
    title: q.title ?? '',
    options: JSON.stringify(q.options || []),
    answer: JSON.stringify(q.answer || []),
    subject: q.subject || null,
    subjectCode: q.subject_code || null,
    questionType: q.question_type || null,
    difficulty: normalizeDifficulty(q.difficulty),
    topic: q.topic || null,
    topicCode: q.topic_code || null,
    knowledgePoints: JSON.stringify(q.knowledge_points || []),
    meta: JSON.stringify({
      code: q.code,
      source_examType: q.source_examType,
      year: q.year,
      is_ai_generated: q.is_ai_generated,
      content_blocks: q.content_blocks,
      images: q.images,
      learning_analysis: q.learning_analysis,
    }),
  }))

  await prisma.question.createMany({ data: rows })
}

/** 从 Question 表读取试卷的题目列表（按 number 排序） */
export function getPaperQuestions(paperId: string) {
  return prisma.question.findMany({
    where: { paperId },
    orderBy: { number: 'asc' },
  })
}

/** 将 Question 行还原为前端使用的题目对象格式 */
export function formatQuestionRow(row: any) {
  return {
    id: row.id,
    examType: row.examType,
    number: row.number,
    title: row.title,
    options: JSON.parse(row.options),
    answer: JSON.parse(row.answer),
    subject: row.subject,
    subject_code: row.subjectCode,
    question_type: row.questionType,
    difficulty: normalizeDifficulty(row.difficulty),
    topic: row.topic,
    topic_code: row.topicCode,
    knowledge_points: JSON.parse(row.knowledgePoints),
    ...JSON.parse(row.meta || '{}'),
  }
}
