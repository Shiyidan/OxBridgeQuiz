export interface ApiResponse<T = unknown> {
  success: boolean
  code: number
  errMsg: string
  data: T
}

export function success<T>(data: T): ApiResponse<T> {
  return { success: true, code: 0, errMsg: '', data }
}

export function fail(errMsg: string): ApiResponse<null> {
  return { success: false, code: 1, errMsg, data: null }
}
