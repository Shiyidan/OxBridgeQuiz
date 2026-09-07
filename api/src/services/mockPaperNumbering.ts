// 模考独立编号分配：完整卷按考试、单项按考试和学科分池，计数器保留已使用号码。
import { Prisma } from '@prisma/client'
import { prisma } from './prisma.js'
import { MOCK_PAPER_SERIES_KIND, type MockPaperSeriesKind } from '../constants/domain.js'
export { MOCK_PAPER_SERIES_KIND, type MockPaperSeriesKind } from '../constants/domain.js'

// 编号池不包含年份和版本，同一份试卷换版继续引用既有系列。
export function mockPaperNumberPool(examType: string, kind: MockPaperSeriesKind, moduleCode = ''): string {
  return `${examType}:${kind}:${moduleCode}`
}

// 分号与创建试卷必须由同一事务调用，避免失败写入或并发创建造成重复序号。
export async function createMockPaperSeries(
  tx: Prisma.TransactionClient,
  examType: string,
  kind: MockPaperSeriesKind,
  moduleCode = '',
) {
  if ((kind === MOCK_PAPER_SERIES_KIND.FULL && moduleCode) || (kind === MOCK_PAPER_SERIES_KIND.SINGLE && !moduleCode)) {
    throw new Error('MOCK_PAPER_NUMBER_SCOPE_INVALID')
  }
  const counter = await tx.mockPaperNumberCounter.upsert({
    where: { id: mockPaperNumberPool(examType, kind, moduleCode) },
    create: { id: mockPaperNumberPool(examType, kind, moduleCode), lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  })
  return tx.mockPaperSeries.create({ data: { examType, kind, moduleCode, sequenceNo: counter.lastNumber } })
}

// 并发分号或组卷占用冲突时重新读取当前状态；其他业务异常直接返回。
export async function withMockPaperNumberTransaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await prisma.$transaction(work, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10_000,
        timeout: 120_000,
      })
    } catch (error) {
      if (attempt >= 2 || !(error instanceof Prisma.PrismaClientKnownRequestError) || !['P2002', 'P2034'].includes(error.code)) throw error
    }
  }
}
