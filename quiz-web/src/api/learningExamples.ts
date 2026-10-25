// 学习讲义的精选真题与固定自测请求，沿用项目统一题卡数据契约。
import { callApi } from '@/utils/request'
import type { RenderableQuestion } from '@/types'
import type { ExamQuestion } from '@/api/exam'

export interface LearningSelfCheck {
  question: RenderableQuestion | null
  message: string
  sourceLabel?: string
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

export interface ChemistryLearningExample {
  sourceCode: string
  kind: 'annual' | 'bank'
  source: { collectionLabel: string; originLabel: string }
  question: RenderableQuestion
}

// 数学与化学共用题卡和来源展示契约，科目读取边界分别由服务端控制。
export type MathematicsLearningExample = ChemistryLearningExample

// 物理复用已校验的来源展示与题卡契约，读取范围由物理服务独立限定。
export type PhysicsLearningExample = ChemistryLearningExample

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

// 化学例题同时允许已审核的年度真题和独立题库题，具体来源由服务端白名单决定。
export function getChemistryLearningExample(sourceCode: string) {
  return callApi<ChemistryLearningExample>({
    method: 'GET',
    url: `/learning/chemistry/examples/${encodeURIComponent(sourceCode)}`,
    silent: true,
  })
}

// 数学 1 精选题限定在已审核的本学科题源，不回退到数学 2 或其他考试。
export function getMathematicsLearningExample(sourceCode: string) {
  return callApi<MathematicsLearningExample>({
    method: 'GET',
    url: `/learning/mathematics1/examples/${encodeURIComponent(sourceCode)}`,
    silent: true,
  })
}

// 数学 2 与数学 1 共用来源展示与题卡契约，读取范围由数学 2 服务独立限定。
export function getMathematics2LearningExample(sourceCode: string) {
  return callApi<MathematicsLearningExample>({
    method: 'GET',
    url: `/learning/mathematics2/examples/${encodeURIComponent(sourceCode)}`,
    silent: true,
  })
}

// 只加载编辑确认的物理题源，不允许用其他学科的同名编号兜底。
export function getPhysicsLearningExample(sourceCode: string) {
  return callApi<PhysicsLearningExample>({
    method: 'GET',
    url: `/learning/physics/examples/${encodeURIComponent(sourceCode)}`,
    silent: true,
  })
}
