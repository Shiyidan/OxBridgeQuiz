// 为历史 Mock 内容逐项重跑校验并回填单项可用数与完整模考可用状态；默认仅预览。
import { prisma } from '../src/services/prisma.js'
import { revalidateMockPaperSet } from '../src/services/mockPaperLibrary.js'

// 回填只在显式传入 --apply 时写库，避免部署检查阶段误改内容状态。
async function main(): Promise<void> {
  const apply = process.argv.includes('--apply')
  const sets = await prisma.mockPaperSet.findMany({
    orderBy: [{ examType: 'asc' }, { sequenceNo: 'asc' }, { version: 'asc' }],
    select: {
      id: true,
      code: true,
      status: true,
      readyModuleCount: true,
      fullExamReady: true,
      _count: { select: { modules: true } },
    },
  })

  console.log(JSON.stringify({
    mode: apply ? 'apply' : 'dry-run',
    mockCount: sets.length,
    currentReadyModuleCount: sets.reduce((sum, set) => sum + set.readyModuleCount, 0),
    currentFullExamReadyCount: sets.filter((set) => set.fullExamReady).length,
  }, null, 2))
  if (!apply) return

  for (const set of sets) await revalidateMockPaperSet(set.id)

  const updated = await prisma.mockPaperSet.findMany({
    where: { id: { in: sets.map((set) => set.id) } },
    select: { readyModuleCount: true, fullExamReady: true },
  })
  console.log(JSON.stringify({
    updatedMockCount: updated.length,
    readyModuleCount: updated.reduce((sum, set) => sum + set.readyModuleCount, 0),
    fullExamReadyCount: updated.filter((set) => set.fullExamReady).length,
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
