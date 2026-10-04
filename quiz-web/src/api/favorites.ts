// 收藏接口：用户题目关系、考试工作区分类及收藏详情。
import { callApi } from '@/utils/request'
import type { Question } from '@/types'

export interface FavoriteState {
  questionId: string
  categoryId: string | null
}
export interface FavoriteCategory {
  id: string
  name: string
  count: number
}
export interface FavoriteSummary {
  total: number
  unclassified: number
  wrongCount: number
  categories: FavoriteCategory[]
  subjects: Array<{ subjectCode: string; subject: string | null }>
}
export interface FavoriteItem extends FavoriteState {
  createdAt: string
  question: {
    title: string
    number: number | null
    difficulty: string | null
    subject: string | null
    topic: string | null
  }
}
export interface FavoriteQuery {
  examType: string
  categoryId?: string
  keyword?: string
  subjectCode?: string
  knowledge?: string
  difficulty?: string
  page: number
  pageSize: number
}
export interface FavoriteDetail {
  categoryId: string | null
  question: Question
}

// 分类数量始终统计整个考试工作区，不受列表搜索条件影响。
export function getFavoriteSummary(examType: string) {
  return callApi<FavoriteSummary>({
    method: 'GET',
    url: '/favorites/summary',
    params: { examType },
  })
}
// 一次读取当前页面所有题目的收藏状态。
export function getFavoriteStates(questionIds: string[]) {
  return callApi<FavoriteState[]>({
    method: 'POST',
    url: '/favorites/status',
    body: { questionIds },
  })
}
// 列表按收藏时间倒序分页，响应只含题干摘要。
export function getFavorites(params: FavoriteQuery) {
  return callApi<{ items: FavoriteItem[]; total: number }>({
    method: 'GET',
    url: '/favorites',
    params: { ...params, page: String(params.page), pageSize: String(params.pageSize) },
  })
}
// 保存是幂等操作，重复收藏不会改变原分类。
export function saveFavorite(questionId: string) {
  return callApi<FavoriteState>({
    method: 'PUT',
    url: `/favorites/${encodeURIComponent(questionId)}`,
  })
}
// 取消收藏不会修改作答记录或错题历史。
export function removeFavorite(questionId: string) {
  return callApi<null>({ method: 'DELETE', url: `/favorites/${encodeURIComponent(questionId)}` })
}
// 批量整理只针对显式勾选的题目。
export function organizeFavorites(
  examType: string,
  questionIds: string[],
  action: 'move' | 'remove',
  categoryId?: string | null,
) {
  return callApi<null>({
    method: 'PUT',
    url: '/favorites/batch',
    body: { examType, questionIds, action, categoryId },
  })
}
// 收藏详情无需绑定答卷。
export function getFavoriteDetail(questionId: string) {
  return callApi<FavoriteDetail>({
    method: 'GET',
    url: `/favorites/${encodeURIComponent(questionId)}`,
  })
}
// 收藏题目成功显示后记录查看，分类修改和列表浏览不触发。
export function recordFavoriteQuestionView(questionId: string) {
  return callApi<{ recorded: true }>({
    method: 'POST',
    url: `/favorites/${encodeURIComponent(questionId)}/view`,
    silent: true,
  })
}

// 分类名称由用户定义，按当前考试工作区保存。
export function createFavoriteCategory(examType: string, name: string) {
  return callApi<FavoriteCategory>({
    method: 'POST',
    url: '/favorites/categories',
    body: { examType, name },
  })
}
// 重命名不改变分类内题目的归属。
export function renameFavoriteCategory(id: string, name: string) {
  return callApi<null>({
    method: 'PUT',
    url: `/favorites/categories/${encodeURIComponent(id)}`,
    body: { name },
  })
}
// 删除分类后由数据库将收藏移回未分类。
export function deleteFavoriteCategory(id: string) {
  return callApi<null>({ method: 'DELETE', url: `/favorites/categories/${encodeURIComponent(id)}` })
}
// 上下移动后保存完整分类顺序。
export function reorderFavoriteCategories(examType: string, ids: string[]) {
  return callApi<null>({
    method: 'PUT',
    url: '/favorites/categories/order',
    body: { examType, ids },
  })
}
