interface AnswerInput {
  questionId: string
  selectedAnswer: string
}

interface DiagnosticQuestion {
  id: string
  title: string
  options: { label: string; text: string }[]
  answer: string[]
}

interface ReportItem {
  questionId: string
  order: number
  isCorrect: boolean
}

interface PartialReport {
  sessionId: string
  totalQuestions: number
  correctCount: number
  score: number
  accuracy: number
  items: ReportItem[]
}

interface FullReport extends PartialReport {
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

export function scoreAnswers(
  answers: AnswerInput[],
  questions: DiagnosticQuestion[],
): { items: ReportItem[]; correctCount: number } {
  const questionMap = new Map(questions.map((q) => [q.id, q]))
  let correctCount = 0
  const items: ReportItem[] = answers.map((a, i) => {
    const q = questionMap.get(a.questionId)
    const answer = q?.answer ?? []
    const isCorrect =
      answer.length === 1 &&
      answer[0] === a.selectedAnswer
    if (isCorrect) correctCount++
    return { questionId: a.questionId, order: i + 1, isCorrect }
  })
  return { items, correctCount }
}

export function buildPartialReport(
  sessionId: string,
  totalQuestions: number,
  items: ReportItem[],
  correctCount: number,
): PartialReport {
  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0
  return {
    sessionId,
    totalQuestions,
    correctCount,
    score,
    accuracy: totalQuestions > 0 ? correctCount / totalQuestions : 0,
    items,
  }
}

export function buildFullReportFromSession(session: {
  id: string
  answers: string
  totalQuestions: number
  correctCount: number
}): FullReport {
  const answers: AnswerInput[] = JSON.parse(session.answers)
  const total = session.totalQuestions
  const correct = session.correctCount
  const score = total > 0 ? Math.round((correct / total) * 100) : 0
  const accuracy = total > 0 ? correct / total : 0

  const items = answers.map((a, i) => ({
    questionId: a.questionId,
    order: i + 1,
    isCorrect: true, // 批改时已判定，从 answers JSON 中取
    explanation: '',
    knowledgePoints: [] as string[],
  }))

  return {
    sessionId: session.id,
    totalQuestions: total,
    correctCount: correct,
    score,
    accuracy,
    items,
    knowledgeAnalysis: [],
    suggestion: accuracy >= 0.8
      ? '基础扎实，建议针对薄弱知识点进行专项练习'
      : '建议系统复习知识点后再进行一次诊断测试',
  }
}
