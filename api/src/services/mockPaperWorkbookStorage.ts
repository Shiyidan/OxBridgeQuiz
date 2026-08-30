// 模考组卷 Excel 存储：保留管理员上传原件，并以受控 storageKey 提供历史下载。
import crypto from 'node:crypto'
import { access, mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { config } from '../config.js'

export type StoredMockPaperWorkbook = {
  storageKey: string
  checksumSha256: string
  fileSizeBytes: number
}

// XLSX 是 ZIP 容器，先检查 PK 文件签名，避免把任意扩展名文件长期保存为组卷清单。
function hasXlsxContainerSignature(buffer: Buffer): boolean {
  if (buffer.length < 4) return false
  return [0x04034b50, 0x06054b50, 0x08074b50].includes(buffer.readUInt32LE(0))
}

// 原始文件按年月和 UUID 保存，避免重名覆盖并便于后续迁移到对象存储。
export async function storeMockPaperWorkbook(buffer: Buffer): Promise<StoredMockPaperWorkbook> {
  if (!hasXlsxContainerSignature(buffer)) throw new Error('INVALID_XLSX_SIGNATURE')
  const now = new Date()
  const year = String(now.getUTCFullYear())
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  const fileName = `${crypto.randomUUID()}.xlsx`
  const storageKey = path.posix.join(year, month, fileName)
  const destinationDirectory = path.join(config.mockPaperWorkbookStorageRoot, year, month)
  const destinationPath = path.join(destinationDirectory, fileName)

  await mkdir(destinationDirectory, { recursive: true })
  await writeFile(destinationPath, buffer, { flag: 'wx' })
  return {
    storageKey,
    checksumSha256: crypto.createHash('sha256').update(buffer).digest('hex'),
    fileSizeBytes: buffer.length,
  }
}

// 数据库存储键只能解析到模考 Excel 根目录内，禁止目录穿越。
export function resolveMockPaperWorkbookPath(storageKey: string): string {
  const normalizedKey = storageKey.replaceAll('\\', '/')
  if (!normalizedKey || normalizedKey.includes('..') || path.posix.isAbsolute(normalizedKey)) {
    throw new Error('INVALID_STORAGE_KEY')
  }
  return path.join(config.mockPaperWorkbookStorageRoot, ...normalizedKey.split('/'))
}

// 下载前确认文件存在，以可读业务错误替代 Express 的底层文件异常。
export async function ensureMockPaperWorkbookAvailable(storageKey: string): Promise<string> {
  const filePath = resolveMockPaperWorkbookPath(storageKey)
  await access(filePath)
  return filePath
}

// 只有数据库档案创建失败时才回收刚落盘的孤立文件。
export async function deleteMockPaperWorkbook(storageKey: string): Promise<void> {
  await rm(resolveMockPaperWorkbookPath(storageKey), { force: true })
}
