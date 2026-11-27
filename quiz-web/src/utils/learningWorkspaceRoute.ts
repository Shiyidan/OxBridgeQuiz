// 学习平台任务分流：公共外壳与缓存页面共同解释旧版 mode、code 和 difficulty 链接。
import type { LocationQuery } from 'vue-router'
import type { ActiveExamType } from '@/stores/auth'

export type LearningWorkspaceTask = 'overview' | 'learning' | 'practice'

// TMUA 只开放练习任务；ESAT 无上下文进入总览，显式模式继续承接旧链接。
export function resolveLearningWorkspaceTask(
  examType: ActiveExamType,
  query: LocationQuery,
): LearningWorkspaceTask {
  if (examType === 'TMUA') return 'practice'
  if (!query.mode && !query.code && !query.difficulty) return 'overview'
  if (query.mode === 'learning') return 'learning'
  if (query.mode === 'practice' || query.difficulty) return 'practice'
  return 'learning'
}
