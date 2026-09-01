// 将身份分类功能上线前的空访问类型规范为匿名访客；默认只审计，写入需显式确认。
import { WEBSITE_VISITOR_TYPE } from '../src/services/websiteTraffic.js'
import { prisma } from '../src/services/prisma.js'

const APPLY_CONFIRMATION = 'BACKFILL_HISTORICAL_WEBSITE_VISITS_AS_ANONYMOUS'
const USAGE = [
  '用法：',
  '  npm run backfill:website-visitor-types -- --dry-run',
  `  npm run backfill:website-visitor-types -- --apply --confirm=${APPLY_CONFIRMATION}`,
].join('\n')

interface BackfillOptions {
  apply: boolean
}

// 参数必须明确选择预览或写入，且写入模式需要固定确认短语。
function parseOptions(): BackfillOptions {
  const args = process.argv.slice(2)
  const options = new Set(args)
  const dryRun = options.has('--dry-run')
  const apply = options.has('--apply')
  const confirmation = args.find((arg) => arg.startsWith('--confirm='))?.slice(10)
  const knownOptions = args.every(
    (arg) => arg === '--dry-run' || arg === '--apply' || arg.startsWith('--confirm='),
  )

  if (!knownOptions || dryRun === apply) throw new Error(USAGE)
  if (apply && confirmation !== APPLY_CONFIRMATION) {
    throw new Error(`写入模式确认短语不匹配。\n${USAGE}`)
  }
  if (dryRun && confirmation) throw new Error(`预览模式不接受确认短语。\n${USAGE}`)
  return { apply }
}

// DATE 字段仅取 UTC 日历文本，保持与网站流量统计的北京时间业务日期一致。
function businessDateKey(value: Date): string {
  return value.toISOString().slice(0, 10)
}

// 审计输出按日期汇总候选记录，便于执行前核对影响范围。
async function loadAudit() {
  const candidates = await prisma.websiteVisitDaily.findMany({
    where: { visitorType: null },
    select: { businessDate: true },
    orderBy: { businessDate: 'asc' },
  })
  const byBusinessDate = candidates.reduce<Record<string, number>>((counts, item) => {
    const date = businessDateKey(item.businessDate)
    counts[date] = (counts[date] || 0) + 1
    return counts
  }, {})
  const dates = Object.keys(byBusinessDate)
  return {
    candidateRecords: candidates.length,
    earliestBusinessDate: dates[0] || null,
    latestBusinessDate: dates.at(-1) || null,
    byBusinessDate,
  }
}

// 写入仅命中仍为空的记录，避免覆盖部署后已经识别出的学生或匿名身份。
async function main(): Promise<void> {
  const options = parseOptions()
  const before = await loadAudit()
  let updatedRecords = 0

  if (options.apply && before.candidateRecords > 0) {
    const result = await prisma.websiteVisitDaily.updateMany({
      where: { visitorType: null },
      data: { visitorType: WEBSITE_VISITOR_TYPE.ANONYMOUS },
    })
    updatedRecords = result.count
  }

  const remainingNullRecords = options.apply
    ? await prisma.websiteVisitDaily.count({ where: { visitorType: null } })
    : before.candidateRecords

  console.log(JSON.stringify({
    mode: options.apply ? 'apply' : 'dry-run',
    targetVisitorType: WEBSITE_VISITOR_TYPE.ANONYMOUS,
    ...before,
    updatedRecords,
    remainingNullRecords,
  }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
