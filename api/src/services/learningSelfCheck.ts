// 学习自测从编辑确认的固定题号读取官方 Question，作答前隔离答案，提交后复用题库解析。
import { prisma } from './prisma.js'
import { EXAM_TYPE, QUESTION_STATUS } from '../constants/domain.js'
import { learningSelfCheckSelections } from '../constants/learningSelfChecks.js'
import { attemptQuestionSelect, formatQuestionForAttempt } from '../routes/papers-shared.js'
import { formatQuestionRow } from '../utils/questionSync.js'
import { getQuestionAnswer } from '../utils/questionDocument.js'

// 请求仅能选取已审核的知识点映射，不接收客户端指定的任意题号。
function selectionFor(code: string) {
  return Object.hasOwn(learningSelfCheckSelections, code) ? learningSelfCheckSelections[code] : undefined
}

// 选中题目下架时停止提供，不自动替换成另一道未经审阅的题目。
function questionWhere(questionCode: string) {
  return { uniqueCode: questionCode, paperId: null, examType: EXAM_TYPE.ESAT, status: QUESTION_STATUS.PUBLISHED }
}

// 只获取正文白名单；固定精选题与原讲义即时自测一样，不创建练习记录。
export async function getLearningSelfCheck(code: string) {
  const selected = selectionFor(code)
  if (!selected) return null
  if (!selected.questionCode) return { question: null, message: '该知识点暂未收录合适的自测题。' }
  const row = await prisma.question.findFirst({ where: questionWhere(selected.questionCode), select: attemptQuestionSelect })
  if (!row) return { question: null, message: '本节精选自测题暂不可用。' }
  return { question: formatQuestionForAttempt(row), message: '' }
}

// 判分限定当前固定题目和有效选项；收到答案后才读取 solution，始终不写历史或错题记录。
export async function checkLearningSelfCheck(code: string, questionId: string, answer: string) {
  const selected = selectionFor(code)
  if (!selected?.questionCode) return null
  const row = await prisma.question.findFirst({
    where: { ...questionWhere(selected.questionCode), id: questionId },
    select: { ...attemptQuestionSelect, solution: true },
  })
  if (!row) return null
  const question = formatQuestionRow(row)
  if (!question.options.some((option: { label: string }) => option.label === answer)) return null
  const correct = getQuestionAnswer(row)
  if (correct.length !== 1) throw new Error('精选自测题必须有唯一正确选项')
  const isCorrect = correct[0] === answer
  return { isCorrect, reason: selected.reason, question: { ...question, selectedAnswer: answer, isCorrect } }
}
