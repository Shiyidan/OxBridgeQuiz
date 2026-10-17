// 学习讲义的精选真题与固定自测请求，沿用项目统一题卡数据契约。
import { callApi } from '@/utils/request'
import type { RenderableQuestion } from '@/types'
import type { ExamQuestion } from '@/api/exam'

export interface LearningSelfCheck {
  question: RenderableQuestion | null
  message: string
}

export interface LearningSelfCheckResult {
  question: ExamQuestion
  isCorrect: boolean
  reason: string
}

export interface BiologyLearningExample {
  sourceCode: string
  source: {
    exam: string
    year: number
    paper: string
    questionNumber: number
    diagnosticTitle: string
    diagnosticQuestionNumber: number | null
  }
  question: RenderableQuestion
}

// 固定精选题由服务端知识点白名单决定，学生无需筛选。
export function getLearningSelfCheck(code: string) {
  return callApi<LearningSelfCheck>({
    method: 'GET',
    url: `/learning/esat/self-check/${encodeURIComponent(code)}`,
    silent: true,
  })
}

// 提交选项后才返回题库解析，不产生正式练习记录。
export function checkLearningSelfCheck(code: string, questionId: string, answer: string) {
  return callApi<LearningSelfCheckResult>({
    method: 'POST',
    url: `/learning/esat/self-check/${encodeURIComponent(code)}/answer`,
    body: { questionId, answer },
    silent: true,
  })
}

// 只在学生阅读所选例题时加载原题，错误由讲义内的重试区域承接。
export function getBiologyLearningExample(sourceCode: string) {
  return callApi<BiologyLearningExample>({
    method: 'GET',
    url: `/learning/biology/examples/${encodeURIComponent(sourceCode)}`,
    silent: true,
  })
}
