// 协议同意记录服务：按用户、文档和版本保存首次同意事实，保留后续版本历史。
import type { Prisma } from '@prisma/client'
import type { LegalAcceptanceSource, LegalDocumentType } from '../constants/legal.js'

type LegalAcceptanceClient = Pick<Prisma.TransactionClient, 'userLegalAcceptance'>

export interface LegalDocumentAcceptance {
  documentType: LegalDocumentType
  documentVersion: string
}

interface RecordLegalAcceptancesInput {
  userId: string
  source: LegalAcceptanceSource
  documents: LegalDocumentAcceptance[]
  acceptedAt: Date
  ipAddress?: string | null
  userAgent?: string
  referenceId?: string
}

// 相同用户、文档和版本只保留首次同意记录；新版本会自然新增一条历史记录。
export async function recordLegalAcceptances(
  client: LegalAcceptanceClient,
  input: RecordLegalAcceptancesInput,
): Promise<void> {
  await client.userLegalAcceptance.createMany({
    data: input.documents.map((document) => ({
      userId: input.userId,
      documentType: document.documentType,
      documentVersion: document.documentVersion,
      source: input.source,
      referenceId: input.referenceId,
      acceptedAt: input.acceptedAt,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    })),
    skipDuplicates: true,
  })
}
