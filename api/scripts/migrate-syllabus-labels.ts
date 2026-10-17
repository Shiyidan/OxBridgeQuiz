// 将旧考纲 sourceJson 和节点表中的混合 label 无损迁移为独立中英文标签。
import { Prisma } from '@prisma/client'
import { config } from '../src/config.js'
import { prisma } from '../src/services/prisma.js'
import { normalizeSyllabusNodes, parseSyllabusJson } from '../src/routes/papers-shared.js'
import {
  BILINGUAL_SYLLABUS_NAME_SUFFIX,
  buildBilingualSyllabusName,
  migrateSyllabusDocumentLabels,
  splitLegacySyllabusLabel,
} from '../src/utils/syllabusLabels.js'

type LegacySyllabusNodeRow = {
  id: string
  code: string
  label: string
  enLabel: string | null
  cnLabel: string | null
}

// 全量审计源 JSON 和平表节点，任何无法拆分或不一致的数据都会阻止写入。
async function audit() {
  const [syllabuses, nodes] = await Promise.all([
    prisma.syllabus.findMany({
      select: {
        id: true,
        name: true,
        examType: true,
        sourceJson: true,
        isActive: true,
        updatedAt: true,
      },
    }),
    prisma.syllabusNode.findMany({
      select: { id: true, code: true, label: true, enLabel: true, cnLabel: true },
    } as any) as unknown as Promise<LegacySyllabusNodeRow[]>,
  ])
  const errors: Array<{ id: string; reason: string }> = []
  const convertedSyllabuses: Array<{
    id: string
    name: string
    examType: string
    sourceJson: Prisma.InputJsonValue
    isActive: boolean
    updatedAt: Date
  }> = []
  const convertedNodes: Array<{ id: string; enLabel: string; cnLabel: string }> = []

  for (const syllabus of syllabuses) {
    try {
      const sourceJson = migrateSyllabusDocumentLabels(parseSyllabusJson(syllabus.sourceJson))
      normalizeSyllabusNodes(sourceJson)
      convertedSyllabuses.push({
        id: syllabus.id,
        name: syllabus.name,
        examType: syllabus.examType,
        sourceJson: sourceJson as Prisma.InputJsonValue,
        isActive: syllabus.isActive,
        updatedAt: syllabus.updatedAt,
      })
    } catch (error) {
      errors.push({
        id: syllabus.id,
        reason: error instanceof Error ? error.message : '考纲 JSON 无法转换',
      })
    }
  }

  for (const node of nodes) {
    try {
      const labels = node.enLabel && node.cnLabel
        ? { enLabel: node.enLabel.trim(), cnLabel: node.cnLabel.trim() }
        : splitLegacySyllabusLabel(node.label)
      if (!labels.enLabel || !labels.cnLabel) throw new Error(`节点 ${node.code} 的双语名称为空`)
      convertedNodes.push({ id: node.id, ...labels })
    } catch (error) {
      errors.push({
        id: node.id,
        reason: error instanceof Error ? error.message : '节点名称无法转换',
      })
    }
  }

  const activeCounts = new Map<string, number>()
  for (const syllabus of syllabuses) {
    if (!syllabus.isActive) continue
    activeCounts.set(syllabus.examType, (activeCounts.get(syllabus.examType) || 0) + 1)
  }
  for (const [examType, count] of activeCounts) {
    if (count > 1) errors.push({ id: examType, reason: `同一考试类型存在 ${count} 份启用考纲` })
  }

  return { syllabuses, nodes, convertedSyllabuses, convertedNodes, errors }
}

// 迁移保留线上正式版并停用，为原启用版本创建新的双语结构版本。
async function main() {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')
  if (apply === args.includes('--dry-run')) throw new Error('必须且只能指定 --dry-run 或 --apply')
  const environment = args.find((arg) => arg.startsWith('--environment='))?.slice(14) || 'local'
  if (environment !== config.runtimeEnv) throw new Error('环境不匹配，请显式指定 --environment=目标环境')
  if (environment === 'local' && !['127.0.0.1', 'localhost'].includes(new URL(process.env.DATABASE_URL!).hostname)) {
    throw new Error('local 迁移仅允许本地数据库')
  }
  if (apply && !args.includes('--confirm=SPLIT_SYLLABUS_LABELS')) {
    throw new Error('写入必须指定 --confirm=SPLIT_SYLLABUS_LABELS')
  }
  const syllabusNodeFields = Prisma.dmmf.datamodel.models
    .find((model) => model.name === 'SyllabusNode')?.fields.map((field) => field.name) || []
  if (!['label', 'enLabel', 'cnLabel'].every((field) => syllabusNodeFields.includes(field))) {
    throw new Error('必须在最终删列迁移前，使用同时包含 label、enLabel、cnLabel 的 Prisma Client 执行此脚本')
  }

  const before = await audit()
  console.log(JSON.stringify({
    mode: apply ? 'preflight' : 'dry-run',
    environment,
    syllabusCount: before.syllabuses.length,
    nodeCount: before.nodes.length,
    errorCount: before.errors.length,
    errors: before.errors,
  }, null, 2))
  if (before.errors.length) throw new Error('考纲双语标签审计未通过，未写入任何数据')
  if (!apply) return

  await prisma.$transaction(async (tx) => {
    for (const syllabus of before.convertedSyllabuses) {
      await tx.syllabus.update({
        where: { id: syllabus.id },
        data: {
          sourceJson: syllabus.sourceJson,
          isActive: syllabus.isActive && syllabus.name.endsWith(BILINGUAL_SYLLABUS_NAME_SUFFIX),
          updatedAt: syllabus.updatedAt,
        },
      })
    }

    for (const syllabus of before.convertedSyllabuses) {
      if (!syllabus.isActive || syllabus.name.endsWith(BILINGUAL_SYLLABUS_NAME_SUFFIX)) continue
      const bilingualName = buildBilingualSyllabusName(syllabus.name)
      const existingBilingualVersion = await tx.syllabus.findFirst({
        where: { examType: syllabus.examType, name: bilingualName },
        select: { id: true },
      })
      if (existingBilingualVersion) {
        await tx.syllabus.update({
          where: { id: existingBilingualVersion.id },
          data: { sourceJson: syllabus.sourceJson, isActive: true },
        })
      } else {
        await tx.syllabus.create({
          data: {
            name: bilingualName,
            examType: syllabus.examType,
            sourceJson: syllabus.sourceJson,
            isActive: true,
          },
        })
      }
    }
    for (const node of before.convertedNodes) {
      await tx.syllabusNode.update({
        where: { id: node.id },
        data: { enLabel: node.enLabel, cnLabel: node.cnLabel },
      })
    }
  }, { maxWait: 10_000, timeout: 120_000 })

  const after = await audit()
  const incompleteNodes = after.nodes.filter((node) => !node.enLabel || !node.cnLabel)
  if (after.errors.length || incompleteNodes.length) throw new Error('迁移后校验失败，禁止删除旧 label 列')
  console.log(JSON.stringify({
    mode: 'complete',
    syllabusCount: after.syllabuses.length,
    activeSyllabusCount: after.syllabuses.filter((syllabus) => syllabus.isActive).length,
    nodeCount: after.nodes.length,
    incompleteNodeCount: incompleteNodes.length,
  }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
