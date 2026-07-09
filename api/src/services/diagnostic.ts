// 诊断测试评分与报告生成。用于 routes/diagnostic.ts 的提交和报告接口。
import { computeScores } from './scoring.js'
import type { QuestionResult } from './scoring.js'

// 用户提交的单题答案，来自 POST /diagnostic/submit 的 answers 数组
interface AnswerInput {
  questionId: string
  selectedAnswer: string
}

// 诊断出题时下发的题目（已剥离正确答案字段，仅批改阶段内部使用 answer）
interface DiagnosticQuestion {
  id: string
  title: string
  options: { label: string; text: string }[]
  answer: string[]
}

// 单题批改结果，作为报告的基础数据单元
interface ReportItem {
  questionId: string
  order: number
  isCorrect: boolean
}

// 部分报告：批改后即时返回，不含知识点分析和学习建议
interface PartialReport {
  sessionId: string
  totalQuestions: number
  correctCount: number
  score: number
  accuracy: number
  items: ReportItem[]
}

// 完整报告：从 DiagnosticSession 重建，用于报告页展示
interface FullReport extends PartialReport {
  // score 为 1.0-9.0 标准分，保留 scaledScore 供前端新版报告页使用
  scaledScore: number | null
  items: (ReportItem & {
    explanation: string
    knowledgePoints: string[]
  })[]
  knowledgeAnalysis: {
    point: string
    accuracy: number
    level: 'weak' | 'moderate' | 'strong'
  }[]
  suggestion: string
}

// 逐题批改：按正确答案判定 isCorrect。仅支持单选题（answer 数组长度为 1 时比较）。
export function scoreAnswers(
  answers: AnswerInput[],
  questions: DiagnosticQuestion[],
): { items: ReportItem[]; correctCount: number } {
  const questionMap = new Map(questions.map((q) => [q.id, q]))
  let correctCount = 0
  const items: ReportItem[] = answers.map((a, i) => {
    const q = questionMap.get(a.questionId)
    const answer = q?.answer ?? []
    // 仅单选题判定，多选会因长度不匹配而判错
    const isCorrect =
      answer.length === 1 &&
      answer[0] === a.selectedAnswer
    if (isCorrect) correctCount++
    return { questionId: a.questionId, order: i + 1, isCorrect }
  })
  return { items, correctCount }
}

// 生成带标准分的部分报告。DiagnosticSession 只有 correctCount 没有逐题 subject，用通用策略算分。
export function buildPartialReport(
  sessionId: string,
  totalQuestions: number,
  items: ReportItem[],
  correctCount: number,
  examType = 'TMUA',
): PartialReport {
  // 无逐题 subject 数据，用通用策略: overallScore = (correct/total)*9
  const questionsWithResults: QuestionResult[] = Array.from({ length: totalQuestions }, (_, i) => ({
    subject: null,
    isCorrect: i < correctCount,
  }))
  const scoringResult = computeScores(examType, questionsWithResults)
  return {
    sessionId,
    totalQuestions,
    correctCount,
    score: scoringResult.overallScore,
    accuracy: totalQuestions > 0 ? correctCount / totalQuestions : 0,
    items,
  }
}

// 从 DiagnosticSession 生成完整诊断报告。批改在提交时已完成，此处只做评分和文案生成。
export function buildFullReportFromSession(session: {
  id: string
  answers: string
  totalQuestions: number
  correctCount: number
  examType?: string
}): FullReport {
  const answers: AnswerInput[] = JSON.parse(session.answers)
  const total = session.totalQuestions
  const correct = session.correctCount
  const accuracy = total > 0 ? correct / total : 0

  // DiagnosticSession 无逐题 subject 数据，用通用策略算 1.0-9.0 标准分
  const questionsWithResults: QuestionResult[] = Array.from({ length: total }, (_, i) => ({
    subject: null,
    isCorrect: i < correct,
  }))
  const scoringResult = computeScores(session.examType || 'TMUA', questionsWithResults)

  // isCorrect 在提交批改时已判定，这里直接沿用不重新计算
  const items = answers.map((a, i) => ({
    questionId: a.questionId,
    order: i + 1,
    isCorrect: true,
    explanation: '',
    knowledgePoints: [] as string[],
  }))

  return {
    sessionId: session.id,
    totalQuestions: total,
    correctCount: correct,
    score: scoringResult.overallScore,
    accuracy,
    // 保留 scaledScore 供前端新版报告页使用 1.0-9.0 标准分
    scaledScore: scoringResult.overallScore,
    items,
    // 知识点分析待后续接真实分析服务实现
    knowledgeAnalysis: [],
    // 80% 阈值：初次诊断给方向性建议，后续可接更细粒度的段位建议
    suggestion: accuracy >= 0.8
      ? '基础扎实，建议针对薄弱知识点进行专项练习'
      : '建议系统复习知识点后再进行一次诊断测试',
  }
}
