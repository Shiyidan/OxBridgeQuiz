// 按当前考试结构重新校验已有模考套卷，用于组卷规则调整后的存量状态刷新。
import { prisma } from '../src/services/prisma.js'
import { revalidateMockPaperSet } from '../src/services/mockPaperLibrary.js'
import { deriveMockPaperReadiness } from '../src/utils/mockPaperState.js'

// 逐套执行正式校验，复用上传和替题后的同一套状态计算逻辑。
async function main() {
  const sets = await prisma.mockPaperSet.findMany({
    select: { id: true, code: true },
    orderBy: [{ examType: 'asc' }, { sequenceNo: 'asc' }],
  })
  for (const [index, set] of sets.entries()) {
    await revalidateMockPaperSet(set.id)
    console.log(`[${index + 1}/${sets.length}] ${set.code}`)
  }
  const refreshed = await prisma.mockPaperSet.findMany({
    select: {
      examType: true,
      modules: { select: { code: true, validationStatus: true } },
    },
  })
  console.log(
    JSON.stringify({
      revalidated: sets.length,
      byExam: Object.fromEntries(
        ['ESAT', 'TMUA'].map((examType) => [
          examType,
          {
            total: refreshed.filter((set) => set.examType === examType).length,
            fullExamReady: refreshed.filter(
              (set) => set.examType === examType
                && deriveMockPaperReadiness(set.examType, set.modules).fullExamReady,
            ).length,
          },
        ]),
      ),
    }),
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
