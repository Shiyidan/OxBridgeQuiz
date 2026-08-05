/** 网站访问统计 API：以不打扰用户的方式上报一次应用首屏访问。 */
import { callApi } from '@/utils/request'

export interface WebsiteVisitRecordResult {
  counted: boolean
}

/** 上报失败不展示全局错误，访问统计不能阻断任何正式业务流程。 */
export function recordWebsiteVisit() {
  return callApi<WebsiteVisitRecordResult>({
    url: '/traffic/visit',
    method: 'POST',
    silent: true,
  })
}
