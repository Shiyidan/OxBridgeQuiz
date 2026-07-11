import path from 'path'
import crypto from 'crypto'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const LOCAL_CORS_ORIGINS = [
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
  /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
  /^http:\/\/172\.\d+\.\d+\.\d+:\d+$/,
  /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,
]

type BackendEnv = 'local' | 'test' | 'prod'

type BackendEnvConfig = {
  port: number
  frontendUrl: string
  corsOrigins: (string | RegExp)[]
}

const BACKEND_CONFIG_BY_ENV: Record<BackendEnv, BackendEnvConfig> = {
  local: {
    port: 3001,
    frontendUrl: 'http://localhost:5173',
    corsOrigins: LOCAL_CORS_ORIGINS,
  },
  test: {
    port: 3001,
    frontendUrl: 'http://8.149.140.115',
    corsOrigins: ['http://8.149.140.115', ...LOCAL_CORS_ORIGINS],
  },
  prod: {
    port: 3001,
    frontendUrl: 'http://47.116.13.217',
    corsOrigins: ['http://47.116.13.217'],
  },
}

// Manual switch: change this to 'local', 'test', or 'prod', then run the backend.
const CURRENT_BACKEND_ENV: BackendEnv = 'local'

const BACKEND_ENV = (process.env.API_RUNTIME_ENV || CURRENT_BACKEND_ENV) as BackendEnv
const backendDefaults = BACKEND_CONFIG_BY_ENV[BACKEND_ENV]

if (!backendDefaults) {
  throw new Error(`[config] Unsupported API_RUNTIME_ENV: ${BACKEND_ENV}`)
}

function resolveJwtSecret(): string {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET

  const generated = crypto.randomBytes(64).toString('hex')
  console.warn('[config] JWT_SECRET is missing. A temporary random secret was generated. Production must use a fixed secret.')
  return generated
}

function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  throw new Error('[config] DATABASE_URL is required')
}

export const config = {
  runtimeEnv: BACKEND_ENV,
  port: parseInt(process.env.API_PORT || String(backendDefaults.port), 10),
  frontendUrl: process.env.FRONTEND_URL || backendDefaults.frontendUrl,
  jwtSecret: resolveJwtSecret(),
  databaseUrl: resolveDatabaseUrl(),
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : backendDefaults.corsOrigins,
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
  deepseekBaseUrl: (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, ''),
  deepseekModel: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash',
}
