import { prisma } from './prisma.js'
import { analyzePageWithQwen, type ParsedQuestion } from './qwenService.js'

interface PageData {
  page: number
  base64: string
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
    console.log(`Page ${pageData.page}: ${Math.round(pageData.base64.length / 1024)}KB`)
    questions = await analyzePageWithQwen(pageData.base64, pageData.page, 'image/jpeg')
  } catch (err: any) {
    console.error(`Page ${pageData.page} Qwen error:`, err.message)
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

  if (coord.completedPages >= coord.totalPages) {
    await finalizeTask(taskId, paperId, coord.allQuestions)
    coordinators.delete(taskId)
  }

  resolveNext!()
}

async function finalizeTask(
  taskId: string,
  paperId: string,
  allQuestions: ParsedQuestion[],
) {
  const questions = allQuestions
    .filter((q, i) => allQuestions.findIndex((x) => x.number === q.number) === i)
    .sort((a, b) => a.number - b.number)
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

  await prisma.paper.update({
    where: { id: paperId },
    data: {
      totalQuestions: questions.length,
      questions: JSON.stringify(questions),
    },
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
