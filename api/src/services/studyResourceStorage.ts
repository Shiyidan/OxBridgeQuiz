// PDF 资料本地存储：校验文件签名、生成稳定 storageKey，并在数据库之外管理物理文件。
import crypto from 'node:crypto'
import { createReadStream } from 'node:fs'
import { access, mkdir, open, rename, rm } from 'node:fs/promises'
import path from 'node:path'
import { config } from '../config.js'

export type StoredStudyResourceFile = {
  storageKey: string
  checksumSha256: string
  fileSizeBytes: number
}

// Multer 临时文件和正式文件位于同一存储根目录，确保完成校验后可以原子移动。
export async function ensureStudyResourceTempDirectory(): Promise<string> {
  const directory = path.join(config.studyResourceStorageRoot, '.tmp')
  await mkdir(directory, { recursive: true })
  return directory
}

// 文件签名必须为 PDF，不能只相信浏览器提交的扩展名和 MIME 类型。
async function hasPdfSignature(filePath: string): Promise<boolean> {
  const handle = await open(filePath, 'r')
  try {
    const buffer = Buffer.alloc(5)
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0)
    return bytesRead === buffer.length && buffer.toString('ascii') === '%PDF-'
  } finally {
    await handle.close()
  }
}

// 校验通过后计算完整内容摘要，便于排查损坏文件并为后续去重保留依据。
async function calculateSha256(filePath: string): Promise<string> {
  const hash = crypto.createHash('sha256')
  for await (const chunk of createReadStream(filePath)) hash.update(chunk)
  return hash.digest('hex')
}

// 中文文件名可能被 multipart 按 latin1 解码，优先保留可读性更好的 UTF-8 结果。
export function normalizeStudyResourceFileName(fileName: string): string {
  const trimmed = path.basename(fileName).replace(/[\u0000-\u001f\u007f]/g, '').trim()
  if (!trimmed) return 'resource.pdf'
  const decoded = Buffer.from(trimmed, 'latin1').toString('utf8')
  const replacementCount = (value: string) => (value.match(/\uFFFD/g) || []).length
  const containsCjk = (value: string) => /[\u3400-\u9fff]/.test(value)
  const decodedChineseName = containsCjk(decoded) && !containsCjk(trimmed)
  const normalized = replacementCount(decoded) < replacementCount(trimmed) || decodedChineseName
    ? decoded
    : trimmed
  return normalized.slice(0, 255)
}

// 资料使用年月目录和 UUID 命名，避免重名覆盖并为未来迁移 OSS 保持相同 storageKey。
export async function storeStudyResourcePdf(
  temporaryPath: string,
  fileSizeBytes: number,
): Promise<StoredStudyResourceFile> {
  if (!(await hasPdfSignature(temporaryPath))) {
    throw new Error('INVALID_PDF_SIGNATURE')
  }

  const now = new Date()
  const year = String(now.getUTCFullYear())
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  const fileName = `${crypto.randomUUID()}.pdf`
  const storageKey = path.posix.join(year, month, fileName)
  const destinationDirectory = path.join(config.studyResourceStorageRoot, year, month)
  const destinationPath = path.join(destinationDirectory, fileName)
  const checksumSha256 = await calculateSha256(temporaryPath)

  await mkdir(destinationDirectory, { recursive: true })
  await rename(temporaryPath, destinationPath)
  return { storageKey, checksumSha256, fileSizeBytes }
}

// 数据库写入失败或管理员删除资料时只处理存储根目录内的稳定 key。
export async function deleteStudyResourceFile(storageKey: string): Promise<void> {
  await rm(resolveStudyResourceFilePath(storageKey), { force: true })
}

// 下载和删除共用同一套路径约束，数据库中的 storageKey 不能逃逸出资料存储根目录。
export function resolveStudyResourceFilePath(storageKey: string): string {
  const normalizedKey = storageKey.replaceAll('\\', '/')
  if (!normalizedKey || normalizedKey.includes('..') || path.posix.isAbsolute(normalizedKey)) {
    throw new Error('INVALID_STORAGE_KEY')
  }
  return path.join(config.studyResourceStorageRoot, ...normalizedKey.split('/'))
}

// 下载前确认物理文件仍存在，避免已发布记录返回无法解释的 Express 文件错误。
export async function ensureStudyResourceFileAvailable(storageKey: string): Promise<string> {
  const filePath = resolveStudyResourceFilePath(storageKey)
  await access(filePath)
  return filePath
}

// 任意校验失败都应回收 Multer 临时文件，避免无效上传持续占用 ECS 磁盘。
export async function deleteStudyResourceTemporaryFile(filePath?: string): Promise<void> {
  if (!filePath) return
  await rm(filePath, { force: true })
}
