// 孤立模考运行载体治理：归档失去 MockPaperSet 母卷的 Paper，同时保留历史答卷关系。
import { prisma } from '../src/services/prisma.js'

const apply = process.argv.includes('--apply')

// 只处理仍标记为发布的孤立 mockPaper，已归档记录无需重复写入。
async function main(): Promise<void> {
  const rows = await prisma.paper.findMany({
    where: {
      paperType: 'mockPaper',
      status: 'published',
      mockPaperSet: null,
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      code: true,
      title: true,
      _count: { select: { examRecords: true } },
    },
  })

  console.table(rows.map((row) => ({
    id: row.id,
    code: row.code,
    title: row.title,
    examRecords: row._count.examRecords,
  })))
  if (!apply || rows.length === 0) {
    console.log(apply ? 'No orphan mock paper runtimes need archiving.' : 'Dry run only; pass --apply to archive them.')
    return
  }

  const result = await prisma.paper.updateMany({
    where: { id: { in: rows.map((row) => row.id) }, status: 'published' },
    data: { status: 'archived' },
  })
  console.log(`Archived ${result.count} orphan mock paper runtimes; exam records were preserved.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
