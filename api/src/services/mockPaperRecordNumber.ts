// 后台历史答卷编号：批量读取具体试卷及冻结单项身份，不从旧 Paper.code 猜测编号。
import { Prisma } from '@prisma/client'
import { prisma } from './prisma.js'
import { parseModuleExamSnapshot } from './moduleExamSession.js'
import { buildMockPaperNumber } from '../utils/mockPaperNumber.js'

const moduleNumberSelect = {
  id: true, code: true, version: true,
  series: { select: { sequenceNo: true } },
  sourceModule: { select: { version: true, series: { select: { sequenceNo: true } } } },
} satisfies Prisma.MockPaperModuleSelect

// 模块拆出父卷后仍通过快照模块 ID 恢复原版本，所有答卷共用批量查询避免逐条查库。
export async function getMockPaperRecordNumbers(records: Array<{
  id: string; paperId: string; examType: string; structureSnapshot: unknown
}>): Promise<Map<string, string | null>> {
  if (!records.length) return new Map()
  const snapshots = new Map(records.map((record) => [record.id, parseModuleExamSnapshot(record.structureSnapshot)]))
  const moduleIds = [...new Set([...snapshots.values()].flatMap((snapshot) => (
    snapshot?.mockExamMode === 'single' && snapshot.mockModuleId ? [snapshot.mockModuleId] : []
  )))]
  const [sets, modules] = await Promise.all([
    prisma.mockPaperSet.findMany({
      where: { paperId: { in: [...new Set(records.map((record) => record.paperId))] } },
      select: { paperId: true, version: true, series: { select: { sequenceNo: true } }, modules: { select: moduleNumberSelect } },
    }),
    moduleIds.length
      ? prisma.mockPaperModule.findMany({ where: { id: { in: moduleIds } }, select: moduleNumberSelect })
      : Promise.resolve([]),
  ])
  const setsByPaper = new Map(sets.map((set) => [set.paperId, set]))
  const modulesById = new Map(modules.map((module) => [module.id, module]))
  return new Map(records.map((record) => {
    const set = setsByPaper.get(record.paperId)
    const snapshot = snapshots.get(record.id)
    if (snapshot?.mockExamMode === 'single') {
      const module = (snapshot.mockModuleId ? modulesById.get(snapshot.mockModuleId) : null)
        || set?.modules.find((item) => item.code === snapshot.modules[0]?.code)
      const canonical = module?.sourceModule || module
      return [record.id, buildMockPaperNumber(record.examType, canonical?.series?.sequenceNo, canonical?.version, snapshot.modules[0]?.code)]
    }
    return [record.id, buildMockPaperNumber(record.examType, set?.series?.sequenceNo, set?.version)]
  }))
}
