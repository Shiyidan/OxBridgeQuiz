// 按题库分类字段回填缺失的 ESAT Module 与 TMUA Paper 编码，默认仅审计。
import { prisma } from '../src/services/prisma.js'
import { resolveQuestionModuleCode, type QuestionModuleCode } from '../src/utils/questionModule.js'

const apply = process.argv.includes('--apply')

// 将缺失模块码的题目按解析结果分组，未能可靠识别的题目保持不变。
async function collectBackfillCandidates() {
  const questions = await prisma.question.findMany({
    where: {
      moduleCode: null,
      examType: { in: ['ESAT', 'TMUA'] },
    },
    select: {
      id: true,
      uniqueCode: true,
      examType: true,
      subject: true,
      subjectCode: true,
    },
    orderBy: { id: 'asc' },
  })

  const grouped = new Map<QuestionModuleCode, string[]>()
  const unresolved: typeof questions = []
  for (const question of questions) {
    const moduleCode = resolveQuestionModuleCode({
      examType: question.examType,
      subject: question.subject,
      subjectCode: question.subjectCode,
    })
    if (!moduleCode) {
      unresolved.push(question)
      continue
    }
    const ids = grouped.get(moduleCode) || []
    ids.push(question.id)
    grouped.set(moduleCode, ids)
  }
  return { questions, grouped, unresolved }
}

// 仅在显式 --apply 时批量更新，且再次限定 moduleCode 为空以避免覆盖并发修正。
async function applyBackfill(grouped: Map<QuestionModuleCode, string[]>): Promise<number> {
  let updatedCount = 0
  await prisma.$transaction(async (tx) => {
    for (const [moduleCode, ids] of grouped) {
      for (let index = 0; index < ids.length; index += 500) {
        const result = await tx.question.updateMany({
          where: {
            id: { in: ids.slice(index, index + 500) },
            moduleCode: null,
          },
          data: { moduleCode },
        })
        updatedCount += result.count
      }
    }
  })
  return updatedCount
}

// 输出可审计的模块分布，便于执行前后核对数据范围。
async function main() {
  const { questions, grouped, unresolved } = await collectBackfillCandidates()
  const resolvable = [...grouped.values()].reduce((sum, ids) => sum + ids.length, 0)
  const updated = apply ? await applyBackfill(grouped) : 0
  console.log(
    JSON.stringify(
      {
        mode: apply ? 'apply' : 'dry-run',
        missingModuleCode: questions.length,
        resolvable,
        unresolved: unresolved.length,
        byModule: Object.fromEntries(
          [...grouped.entries()].map(([moduleCode, ids]) => [moduleCode, ids.length]),
        ),
        updated,
        unresolvedExamples: unresolved.slice(0, 10).map((question) => ({
          uniqueCode: question.uniqueCode,
          examType: question.examType,
          subject: question.subject,
          subjectCode: question.subjectCode,
        })),
      },
      null,
      2,
    ),
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
