const API_BASE_BY_ENV = {
  local: 'http://localhost:3001',
  test: 'http://8.149.140.115',
  // Production is served by Nginx, so browser API calls stay on the same HTTPS origin.
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
