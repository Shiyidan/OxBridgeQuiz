// 个人中心学习足迹的数据类型和当前用户查询接口。
import { callApi } from '@/utils/request'

export interface LearningDay {
  date: string
  answers: number
  reviews: number
  reports: number
  total: number
  level: number
  partial: boolean
}

export interface LearningFootprint {
  startDate: string
  endDate: string
  trackingStartDate: string
  timezone: string
  days: LearningDay[]
  summary: { activeDays: number; total: number; answers: number; reviews: number; reports: number }
}

// 登录态决定查询归属，页面不能指定其他用户。
export function getLearningFootprint(): Promise<LearningFootprint> {
  return callApi<LearningFootprint>({
    method: 'GET',
    url: '/getMember/learning-footprint',
    silent: true,
  })
}
