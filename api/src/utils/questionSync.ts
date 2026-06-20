import { prisma } from '../services/prisma.js'

/** 将题目数组写入 Question 表，覆盖该试卷下所有已有题目 */
export async function syncPaperQuestions(paperId: string, questions: any[]): Promise<void> {
  await prisma.question.deleteMany({ where: { paperId } })

  if (!questions.length) return

  const rows = questions.map((q: any) => ({
    paperId,
    number: q.number ?? 0,
    title: q.title ?? '',
    options: JSON.stringify(q.options || []),
    answer: JSON.stringify(q.answer || []),
    subject: q.subject || q.subject_code || null,
    subjectCode: q.subject_code || q.subject || null,
    questionType: q.question_type || null,
    difficulty: typeof q.difficulty === 'string' ? q.difficulty : JSON.stringify(q.difficulty || {}),
    topic: q.topic || null,
    topicCode: q.topic_code || null,
    knowledgePoints: JSON.stringify(q.knowledge_points || []),
    syllabusPoints: JSON.stringify(q.syllabus_points || []),
    meta: JSON.stringify({
      content_blocks: q.content_blocks,
      images: q.images,
      skills: q.skills,
      learning_analysis: q.learning_analysis,
      generation_profile: q.generation_profile,
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
    number: row.number,
    title: row.title,
    options: JSON.parse(row.options),
    answer: JSON.parse(row.answer),
    subject: row.subject,
    subject_code: row.subjectCode,
    question_type: row.questionType,
    difficulty: (() => {
      try { return JSON.parse(row.difficulty || '{}') } catch { return row.difficulty }
    })(),
    topic: row.topic,
    topic_code: row.topicCode,
    knowledge_points: JSON.parse(row.knowledgePoints),
    syllabus_points: JSON.parse(row.syllabusPoints),
    ...JSON.parse(row.meta || '{}'),
  }
}
