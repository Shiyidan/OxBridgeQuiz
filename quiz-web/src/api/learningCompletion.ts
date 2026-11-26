// 学习点亮 API：只读写当前登录账号的状态，章节展开及权限由服务端决定。
import { callApi } from '@/utils/request'

export interface LearningCompletion {
  code: string
  completedAt: string
}
export interface LearningCompletionResult {
  items: LearningCompletion[]
}
export interface CompletedQuestionCounts {
  counts: Record<string, number>
}

// 图谱一次加载当前账号各知识点的去重完成题数，不在鼠标悬停时逐点请求。
export function getCompletedQuestionCounts(examType: string) {
  return callApi<CompletedQuestionCounts>({
    method: 'GET',
    url: '/learning-completions/' + examType + '/question-counts',
    silent: true,
  })
}

// 一次获取当前考试的全部点亮状态，避免目录节点逐个请求。
export function getLearningCompletions(examType: string) {
  return callApi<LearningCompletionResult>({
    method: 'GET',
    url: '/learning-completions/' + examType,
    silent: true,
  })
}
// 显式提交目标状态，重复请求不会反转状态或重复增加点亮日志。
export function setLearningCompletion(examType: string, code: string, completed: boolean) {
  return callApi<LearningCompletionResult>({
    method: 'PUT',
    url: '/learning-completions/' + examType + '/' + code,
    body: { completed },
    silent: true,
  })
}
