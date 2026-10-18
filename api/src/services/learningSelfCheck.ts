// 学习自测从编辑确认的固定题号读取官方 Question，作答前隔离答案，提交后复用题库解析。
import { prisma } from './prisma.js'
import { EXAM_TYPE, QUESTION_STATUS } from '../constants/domain.js'
import { learningSelfCheckSelections } from '../constants/learningSelfChecks.js'
import { attemptQuestionSelect, formatQuestionForAttempt } from '../routes/papers-shared.js'
import { formatQuestionRow } from '../utils/questionSync.js'
import { getQuestionAnswer } from '../utils/questionDocument.js'
import { chemistryLearningSelfChecks } from '../constants/chemistryLearningSelfChecks.js'
import { chemistryQuestionWhere } from './chemistryLearning.js'
import type { Prisma } from '@prisma/client'

// 请求仅能选取已审核的知识点映射，不接收客户端指定的任意题号。
function selectionFor(code: string) {
  if (Object.hasOwn(chemistryLearningSelfChecks, code)) {
    const selected = chemistryLearningSelfChecks[code]!.selection
    return {
      where: selected ? chemistryQuestionWhere(selected) : null,
      reason: selected?.reason || '',
      annual: selected?.kind === 'annual',
      sourceLabel: `${selected?.kind === 'annual' ? '精选真题' : '精选试题库题目'}${selected?.reason.startsWith('复盘') ? ' · 本节例题复盘' : ''}`,
    }
  }
  const selected = Object.hasOwn(learningSelfCheckSelections, code)
    ? learningSelfCheckSelections[code]
    : undefined
  if (!selected) return undefined
  return {
    where: selected.questionCode
      ? {
          uniqueCode: selected.questionCode,
          paperId: null,
          examType: EXAM_TYPE.ESAT,
          status: QUESTION_STATUS.PUBLISHED,
        }
      : null,
    reason: selected.reason,
    annual: false,
    sourceLabel: '精选试题库题目',
  }
}

// 年度题必须唯一命中；作答前沿用白名单投影，只有答案核对允许读取 solution。
async function selectedQuestion(
  selected: NonNullable<ReturnType<typeof selectionFor>>,
  questionId?: string,
) {
  if (!selected.where) return null
  const where: Prisma.QuestionWhereInput = {
    ...selected.where,
    ...(questionId ? { id: questionId } : {}),
  }
  const select = {
    ...attemptQuestionSelect,
    ...(questionId ? { solution: true } : {}),
  }
  if (!selected.annual) return prisma.question.findFirst({ where, select })
  const rows = await prisma.question.findMany({
    where: selected.where,
    select,
    orderBy: { id: 'asc' },
    take: 2,
  })
  return rows.length === 1 && (!questionId || rows[0]!.id === questionId) ? rows[0]! : null
}

// 只获取正文白名单；固定精选题与原讲义即时自测一样，不创建练习记录。
export async function getLearningSelfCheck(code: string) {
  const selected = selectionFor(code)
  if (!selected) return null
  if (!selected.where) return { question: null, message: '该知识点暂未收录合适的自测题。' }
  const row = await selectedQuestion(selected)
  if (!row) return { question: null, message: '本节精选自测题暂不可用。' }
  return {
    question: formatQuestionForAttempt(row),
    message: '',
    sourceLabel: selected.sourceLabel,
  }
}

// 判分限定当前固定题目和有效选项；收到答案后才读取 solution，始终不写历史或错题记录。
export async function checkLearningSelfCheck(code: string, questionId: string, answer: string) {
  const selected = selectionFor(code)
  if (!selected?.where || !questionId) return null
  const row = await selectedQuestion(selected, questionId)
  if (!row) return null
  const question = formatQuestionRow(row)
  if (!question.options.some((option: { label: string }) => option.label === answer)) return null
  const correct = getQuestionAnswer(row)
  if (correct.length !== 1) throw new Error('精选自测题必须有唯一正确选项')
  const isCorrect = correct[0] === answer
  return {
    isCorrect,
    reason: selected.reason,
    question: { ...question, selectedAnswer: answer, isCorrect },
  }
}
