// 模考替换遗漏补处理入口：先核对目标环境，默认只输出当前版本的修复计划。
import { config as loadEnv } from 'dotenv'

import { EXAM_TYPE } from '../src/constants/domain.js'

type RepairEnvironment = 'local' | 'test' | 'prod'
type RepairExamType = typeof EXAM_TYPE.ESAT | typeof EXAM_TYPE.TMUA

interface RepairCliOptions {
  apply: boolean
  examType: RepairExamType
  environment: RepairEnvironment
  setIds?: string[]
}

class RepairCliInputError extends Error {}
class RepairCliServiceError extends Error {}

const USAGE = [
  '用法：npm run repair:mock-question-replacements -- --exam-type=ESAT|TMUA',
  '  --environment=local|test|prod [--dry-run | --apply] [--set-id=ID ...]',
  '默认 dry-run；--apply 前须确认目标环境，生产执行前须完成数据库备份。',
].join('\n')

// 环境与考试类型必须显式指定，防止拼写错误或遗漏参数扩大实际修复范围。
function parseOptions(args: string[]): RepairCliOptions {
  let mode: 'dry-run' | 'apply' | undefined
  let examType: RepairExamType | undefined
  let environment: RepairEnvironment | undefined
  const setIds = new Set<string>()

  for (const arg of args) {
    if (arg === '--dry-run' || arg === '--apply') {
      if (mode) throw new RepairCliInputError('--dry-run 与 --apply 只能指定一次，且不能同时使用')
      mode = arg === '--apply' ? 'apply' : 'dry-run'
    } else if (arg.startsWith('--exam-type=')) {
      if (examType) throw new RepairCliInputError('--exam-type 不能重复指定')
      const value = arg.slice('--exam-type='.length)
      if (value !== EXAM_TYPE.ESAT && value !== EXAM_TYPE.TMUA) {
        throw new RepairCliInputError('--exam-type 仅允许 ESAT 或 TMUA')
      }
      examType = value
    } else if (arg.startsWith('--environment=')) {
      if (environment) throw new RepairCliInputError('--environment 不能重复指定')
      const value = arg.slice('--environment='.length)
      if (value !== 'local' && value !== 'test' && value !== 'prod') {
        throw new RepairCliInputError('--environment 仅允许 local、test 或 prod')
      }
      environment = value
    } else if (arg.startsWith('--set-id=')) {
      const value = arg.slice('--set-id='.length).trim()
      if (!value) throw new RepairCliInputError('--set-id 不能为空')
      setIds.add(value)
    } else {
      throw new RepairCliInputError('存在未知参数，请按用法检查参数名称与格式')
    }
  }

  if (!examType) throw new RepairCliInputError('必须指定 --exam-type=ESAT 或 --exam-type=TMUA')
  if (!environment) throw new RepairCliInputError('必须指定 --environment=local、test 或 prod')
  return {
    apply: mode === 'apply',
    examType,
    environment,
    ...(setIds.size ? { setIds: [...setIds] } : {}),
  }
}

// 在加载数据库服务前核对配置中的真实环境，且不把配置内容或连接地址写入输出。
function validateEnvironment(expected: RepairEnvironment): void {
  const loaded = loadEnv({ path: process.env.API_ENV_FILE || '.env' })
  if (loaded.error) {
    throw new RepairCliInputError('无法读取环境配置文件，请检查 API_ENV_FILE 或当前目录的 .env')
  }
  if (process.env.API_RUNTIME_ENV !== expected) {
    throw new RepairCliInputError('--environment 必须与配置中的 API_RUNTIME_ENV 完全一致')
  }
}

// 同一个服务承接只读计划和实际修复；写模式仍保留人工下线状态，不在此入口重新发布题包。
async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2))
  validateEnvironment(options.environment)
  console.log(JSON.stringify({
    environment: options.environment,
    examType: options.examType,
    mode: options.apply ? 'apply' : 'dry-run',
    setIds: options.setIds || [],
  }, null, 2))

  const { prisma } = await import('../src/services/prisma.js')
  try {
    const { MockPaperReplacementError } = await import('../src/services/mockPaperQuestionReplacement.js')
    const { repairMockPaperQuestionReplacements } = await import('../src/services/mockPaperReplacementRepair.js')
    const result = await repairMockPaperQuestionReplacements({
      examType: options.examType,
      apply: options.apply,
      ...(options.setIds ? { setIds: options.setIds } : {}),
    }).catch((error: unknown) => {
      if (error instanceof MockPaperReplacementError) throw new RepairCliServiceError(error.message)
      throw error
    })
    console.table(result.plans.flatMap((plan) => plan.modules.map((module) => ({
      setId: plan.id,
      kind: plan.kind,
      number: plan.sequenceNo,
      seriesId: plan.seriesId,
      version: plan.version,
      action: plan.action,
      module: module.title,
      publicationStatus: module.publicationStatus,
      questionPositions: module.questionPositions.join(', '),
    }))))
    console.log(JSON.stringify({ environment: options.environment, ...result }, null, 2))
    console.log(options.apply
      ? '补处理完成；已下线单项继续保持下线，恢复入口须另行发布当前有效版本。'
      : '只读计划已完成，未写入数据；确认计划和目标环境后再使用 --apply。')
  } finally {
    await prisma.$disconnect()
  }
}

// 参数错误展示可操作提示；未知运行错误不输出可能含数据库连接凭据的原始异常或堆栈。
function reportFailure(error: unknown): void {
  if (error instanceof RepairCliInputError) {
    console.error(error.message)
    console.error(USAGE)
  } else if (error instanceof RepairCliServiceError) {
    console.error(error.message)
  } else {
    const code = error && typeof error === 'object' && 'code' in error
      ? String(error.code)
      : ''
    const safeCode = /^[A-Z][A-Z0-9_]{0,79}$/.test(code) ? `（${code}）` : ''
    console.error(`模考替换补处理失败${safeCode}；请检查目标配置与服务端诊断信息后重新生成只读计划。`)
  }
  process.exitCode = 1
}

void main().catch(reportFailure)
