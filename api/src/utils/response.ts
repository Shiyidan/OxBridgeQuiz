export interface ApiResponse<T = unknown> {
  success: boolean
  code: number | string   // 0=成功，1=通用失败，AUTH_WRONG 等为具体业务错误码
  errMsg: string
  data: T
}

export function success<T>(data: T): ApiResponse<T> {
  return { success: true, code: 0, errMsg: '', data }
}

export function fail(errMsg: string, code: number | string = 1): ApiResponse<null> {
  return { success: false, code, errMsg, data: null }
}
