// 统一选择浏览器调用的 API 地址，支持本地开发、测试环境及同源生产部署。
const API_BASE_BY_ENV = {
  local: 'http://localhost:3001',
  // 测试与线上页面统一调用同源 /api；本地 test 模式由 Vite 转发请求。
  test: '',
  // 线上环境由 Nginx 提供页面与 API，浏览器请求保持在同一 HTTPS 来源。
  prod: '',
} as const

type ApiEnv = keyof typeof API_BASE_BY_ENV

const API_ENV = (import.meta.env.VITE_API_ENV || 'local') as ApiEnv
const API_BASE_FROM_ENV = import.meta.env.VITE_API_BASE || ''

if (!(API_ENV in API_BASE_BY_ENV)) {
  throw new Error(`Unsupported VITE_API_ENV: ${API_ENV}`)
}

const API_BASE = (API_BASE_FROM_ENV || API_BASE_BY_ENV[API_ENV]).replace(/\/+$/, '')

export const API_URL = `${API_BASE}/api`
export const API_ORIGIN = API_BASE
