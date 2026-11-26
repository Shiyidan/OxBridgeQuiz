// 知识图谱练习进度：按当前账号已交卷的题库作答汇总，各知识点内按题目去重。
import { prisma } from './prisma.js'
import { ANSWER_RECORD_STATE, EXAM_RECORD_STATUS, QUESTION_BANK_PAPER_TYPES } from '../constants/domain.js'

// 关联表的题目/知识点唯一键配合 some，重复练习不累加；归档题仍保留已完成的历史贡献。
export async function getCompletedQuestionCounts(userId: string, examType: string) {
  const [nodes, groups] = await Promise.all([
    prisma.syllabusNode.findMany({
      where: { examType },
      select: { id: true, code: true },
      orderBy: { code: 'asc' },
    }),
    prisma.questionKnowledgePoint.groupBy({
      by: ['syllabusNodeId'],
      where: {
        syllabusNode: { examType },
        question: {
          examType,
          paperId: null,
          answerRecords: {
            some: {
              answerState: ANSWER_RECORD_STATE.ANSWERED,
              selectedAnswer: { not: null },
              NOT: { selectedAnswer: '' },
              examRecord: {
                userId,
                examType,
                status: EXAM_RECORD_STATUS.SUBMITTED,
                paper: { paperType: { in: [...QUESTION_BANK_PAPER_TYPES] } },
              },
            },
          },
        },
      },
      _count: { questionId: true },
    }),
  ])
  const byId = new Map(groups.map(group => [group.syllabusNodeId, group._count.questionId]))
  return Object.fromEntries(nodes.map(node => [node.code, byId.get(node.id) ?? 0]))
}
