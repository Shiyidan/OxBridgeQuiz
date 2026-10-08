// 口语推广 API：只记录打开介绍，并提供后台按用户聚合的点击统计。
import { callApi } from '@/utils/request'

export type PromotionEvent = 'open'
export type PromotionSource = 'charm' | 'navigation'

export interface PromotionEventInput {
  event: PromotionEvent
  source: PromotionSource
  page: string
}

export interface OralPromotionAnalyticsParams {
  startAt: string
  endAt: string
  page: number
  pageSize: number
}

export interface OralPromotionAnalytics {
  period: { startAt: string; endAt: string }
  overview: { clickCount: number; userCount: number }
  list: Array<{ userId: string; username: string; email: string; clickCount: number }>
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasPrev: boolean
    hasNext: boolean
  }
}

// 仅上报路由名称，不携带账号、查询参数或用户填写的信息。
export function recordPromotionEvent(body: PromotionEventInput) {
  return callApi<{ recorded: boolean }>({
    method: 'POST',
    url: '/traffic/promotion-events',
    body,
    silent: true,
  })
}

// 管理端统计统一使用已提交的日期和分页条件，失败交由面板展示重试入口。
export function getOralPromotionAnalytics(params: OralPromotionAnalyticsParams) {
  return callApi<OralPromotionAnalytics>({
    method: 'GET',
    url: '/admin/oral-promotion-analytics',
    params: {
      startAt: params.startAt,
      endAt: params.endAt,
      page: String(params.page),
      pageSize: String(params.pageSize),
    },
    silent: true,
  })
}
