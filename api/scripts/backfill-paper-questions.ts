// 历史 Paper.questions 回填到 Question 表，避免业务继续依赖试卷 JSON。
import { prisma } from '../src/services/prisma.js'
import { syncPaperQuestions } from '../src/utils/questionSync.js'
import { parseJsonField } from '../src/utils/jsonField.js'

interface BackfillOptions {
  dryRun: boolean
  force: boolean
  clearLegacy: boolean
}

interface BackfillStats {
  scanned: number
  backfilled: number
  skippedEmpty: number
  skippedExisting: number
  invalidJson: number
  clearedLegacy: number
}

function parseOptions(): BackfillOptions {
  const args = new Set(process.argv.slice(2))
  return {
    dryRun: args.has('--dry-run'),
    force: args.has('--force'),
    clearLegacy: args.has('--clear-legacy'),
  }
}

function parseLegacyQuestions(raw: unknown): any[] | null {
  const parsed = parseJsonField<unknown>(raw, [])
  return Array.isArray(parsed) ? parsed : null
}

async function main(): Promise<void> {
  const options = parseOptions()
  const stats: BackfillStats = {
    scanned: 0,
    backfilled: 0,
    skippedEmpty: 0,
    skippedExisting: 0,
    invalidJson: 0,
    clearedLegacy: 0,
  }

  const papers = await prisma.paper.findMany({
    select: {
      id: true,
      title: true,
      questions: true,
      totalQuestions: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  for (const paper of papers) {
    stats.scanned += 1
    const legacyQuestions = parseLegacyQuestions(paper.questions)

    if (!legacyQuestions) {
      stats.invalidJson += 1
      console.warn(`[invalid] ${paper.title} (${paper.id}) questions JSON 解析失败`)
      continue
    }

    if (legacyQuestions.length === 0) {
      stats.skippedEmpty += 1
      continue
    }

    const existingCount = await prisma.question.count({ where: { paperId: paper.id } })
    if (existingCount > 0 && !options.force) {
      stats.skippedExisting += 1
      if (options.clearLegacy && existingCount === legacyQuestions.length) {
        console.log(
          `[clear] ${paper.title} (${paper.id}) 已有 ${existingCount} 道 Question，清空历史 JSON`
            + `${options.dryRun ? ' [dry-run]' : ''}`,
        )
        if (!options.dryRun) {
          await prisma.paper.update({
            where: { id: paper.id },
            data: { questions: [] },
          })
          stats.clearedLegacy += 1
        }
      } else {
        console.log(`[skip] ${paper.title} (${paper.id}) 已有 ${existingCount} 道 Question`)
      }
      continue
    }

    console.log(
      `[backfill] ${paper.title} (${paper.id}) ${legacyQuestions.length} 道题`
        + `${options.dryRun ? ' [dry-run]' : ''}`,
    )

    if (options.dryRun) {
      stats.backfilled += 1
      continue
    }

    await syncPaperQuestions(paper.id, legacyQuestions)
    await prisma.paper.update({
      where: { id: paper.id },
      data: {
        totalQuestions: legacyQuestions.length,
        ...(options.clearLegacy ? { questions: [] } : {}),
      },
    })

    stats.backfilled += 1
    if (options.clearLegacy) stats.clearedLegacy += 1
  }

  console.log('\nBackfill summary')
  console.table(stats)
}

main()
  .catch((error) => {
    console.error('Backfill failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
