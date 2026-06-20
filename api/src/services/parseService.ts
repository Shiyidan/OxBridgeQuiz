import { prisma } from './prisma.js'
import { analyzePageWithQwen, type ParsedQuestion } from './qwenService.js'
import { syncPaperQuestions } from '../utils/questionSync.js'

interface PageData {
  page: number
  base64: string
  /** 省略时按 image/jpeg 处理（PDF 渲染走 JPEG 流） */
  mimeType?: string
}

// ============================================================
// 信号量：限制 Qwen 最大并发数（5），避免触发 API 限流
// ============================================================

class Semaphore {
  private counter: number
  private queue: (() => void)[] = []

  constructor(max: number) {
    this.counter = max
  }

  async acquire(): Promise<void> {
    if (this.counter > 0) {
      this.counter--
      return
    }
    return new Promise<void>((resolve) => {
      this.queue.push(resolve)
    })
  }

  release(): void {
    const next = this.queue.shift()
    if (next) {
      next()
    } else {
      this.counter++
    }
  }
}

const qwenSemaphore = new Semaphore(5)

// ============================================================
// 协调器：串行汇入多页并发 Qwen 结果，全部完成时自动入库
// ============================================================

interface TaskCoordinator {
  paperId: string
  totalPages: number
  completedPages: number
  allQuestions: ParsedQuestion[]
  lock: Promise<void>
}

const coordinators = new Map<string, TaskCoordinator>()

function getOrCreateCoordinator(
  taskId: string,
  paperId: string,
  totalPages: number,
): TaskCoordinator {
  let c = coordinators.get(taskId)
  if (!c) {
    c = {
      paperId,
      totalPages,
      completedPages: 0,
      allQuestions: [],
      lock: Promise.resolve(),
    }
    coordinators.set(taskId, c)
  }
  return c
}

export async function addPageToTask(
  taskId: string,
  paperId: string,
  pageData: PageData,
  totalPages: number,
) {
  const coord = getOrCreateCoordinator(taskId, paperId, totalPages)

  if (coord.completedPages === 0) {
    await prisma.parseTask.update({
      where: { id: taskId },
      data: { status: 'processing', progress: 5 },
    })
  }

  let questions: ParsedQuestion[] = []
  await qwenSemaphore.acquire()
  try {
    const sizeKB = Math.round(pageData.base64.length / 1024)
    console.log(`Page ${pageData.page}: ${sizeKB}KB`)
    try {
      questions = await analyzePageWithQwen(
        pageData.base64,
        pageData.page,
        pageData.mimeType || 'image/jpeg',
      )
    } catch (err: any) {
      console.error(`Page ${pageData.page} Qwen failed:`, err.message)
    }
  } finally {
    qwenSemaphore.release()
  }

  const prev = coord.lock
  let resolveNext: () => void
  coord.lock = new Promise<void>((r) => { resolveNext = r })

  await prev

  coord.allQuestions.push(...questions)
  coord.completedPages++

  const progress =
    totalPages > 0
      ? 5 + Math.round((coord.completedPages / totalPages) * 75)
      : 50
  await prisma.parseTask.update({
    where: { id: taskId },
    data: { progress },
  })

  console.log(
    `Page ${pageData.page} done, ${coord.completedPages}/${coord.totalPages} completed, ${questions.length} questions`,
  )
  if (questions.length === 0) {
    console.warn(`⚠ Page ${pageData.page} returned 0 questions — possible Qwen failure or unrecognizable content`)
  }

  if (coord.completedPages >= coord.totalPages) {
    await finalizeTask(taskId, paperId, coord.allQuestions)
    coordinators.delete(taskId)
  }

  resolveNext!()
}

/** 找出编号序列中缺失的数字 */
function findGaps(numbers: number[]): number[] {
  if (numbers.length === 0) return []
  const max = Math.max(...numbers)
  const gaps: number[] = []
  for (let n = 1; n <= max; n++) {
    if (!numbers.includes(n)) gaps.push(n)
  }
  return gaps
}

async function finalizeTask(
  taskId: string,
  paperId: string,
  allQuestions: ParsedQuestion[],
) {
  const beforeDedup = allQuestions.length

  // 去重：同编号题目保留内容更长的那条（跨页题 Qwen 可能多次识别）
  const deduped: ParsedQuestion[] = []
  for (const q of allQuestions) {
    const existing = deduped.find((x) => x.number === q.number)
    if (!existing) {
      deduped.push(q)
    } else {
      const existLen = (existing.title?.length || 0) + existing.options.reduce((s, o) => s + (o.text?.length || 0), 0)
      const newLen = (q.title?.length || 0) + q.options.reduce((s, o) => s + (o.text?.length || 0), 0)
      if (newLen > existLen) {
        // 用内容更长的替换（跨页题前一页的图像通常是部分的，后一页大概率更完整）
        Object.assign(existing, q)
      }
      console.log(`Dedup Q${q.number}: kept ${newLen > existLen ? 'newer' : 'existing'} (${existLen} vs ${newLen} chars)`)
    }
  }

  if (beforeDedup > deduped.length) {
    console.log(`Dedup: ${beforeDedup} → ${deduped.length} questions (${beforeDedup - deduped.length} duplicates merged)`)
  }

  // 排序前输出所有题目编号供排查
  console.log(`All question numbers before sort: [${deduped.map((q) => q.number).join(', ')}]`)

  const sorted = deduped.sort((a, b) => a.number - b.number)
  console.log(`After sort: [${sorted.map((q) => q.number).join(', ')}]`)

  const gapInfo = findGaps(sorted.map((q) => q.number))
  if (gapInfo.length > 0) {
    console.warn(`⚠ Missing question numbers: [${gapInfo.join(', ')}]`)
  }

  const questions = sorted
    .slice(0, 10)
    .map((q, i) => ({ ...q, number: i + 1 }))
    .map((q) => ({
      ...q,
      images: q.images?.map((img) => {
        if (img.type === 'svg' && img.code && !img.code.includes('width=')) {
          return { ...img, code: img.code.replace('<svg', '<svg width="100%" height="auto"') }
        }
        return img
      }),
    }))

  await syncPaperQuestions(paperId, questions)

  await prisma.paper.update({
    where: { id: paperId },
    data: { totalQuestions: questions.length },
  })

  await prisma.parseTask.update({
    where: { id: taskId },
    data: {
      status: 'completed',
      progress: 100,
      result: JSON.stringify({ questionsFound: questions.length }),
    },
  })

  console.log(`Done: ${questions.length} questions`)
}
