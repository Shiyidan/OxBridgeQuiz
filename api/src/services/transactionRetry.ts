// Prisma 权益事务重试器：配合用户行锁，只重试数据库明确报告的写冲突或死锁。
import { Prisma } from '@prisma/client'
import { prisma } from './prisma.js'

// 同一用户的并发额度事务会争用用户行；短退避后重放整个事务以获得确定结果。
export async function withQuotaTransaction<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
  maxAttempts = 3,
): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await prisma.$transaction(operation, {
        // 用户行更新负责互斥；READ COMMITTED 保证等待锁后能读到前一事务刚提交的用量。
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      })
    } catch (error: unknown) {
      lastError = error
      const retryable = error instanceof Prisma.PrismaClientKnownRequestError
        && error.code === 'P2034'
      if (!retryable || attempt === maxAttempts) throw error
      await new Promise((resolve) => setTimeout(resolve, attempt * 20))
    }
  }
  throw lastError
}
