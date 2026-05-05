import { execFileSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import { prisma } from './prisma.js'
import { analyzePageWithQwen, type ParsedQuestion } from './qwenService.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export async function startParseTask(taskId: string, paperId: string, pdfPath: string) {
  try {
    await prisma.parseTask.update({
      where: { id: taskId },
      data: { status: 'processing', progress: 10 }
    })

    // 用 Python 脚本将 PDF 每页转为 base64 PNG（Python PyMuPDF 已验证可用）
    const scriptPath = path.join(__dirname, '../../scripts/pdf_pages_to_base64.py')
    const result = execFileSync('python', [scriptPath, pdfPath], {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024
    })

    const pages: { page: number; base64: string }[] = JSON.parse(result)
    console.log(`Got ${pages.length} pages from PDF`)

    const allQuestions: ParsedQuestion[] = []

    for (let i = 0; i < Math.min(pages.length, 10); i++) {
      const { base64 } = pages[i]
      console.log(`Page ${i + 1}/${Math.min(pages.length, 10)}: ${Math.round(base64.length / 1024)}KB`)

      const questions = await analyzePageWithQwen(base64, i + 1)
      allQuestions.push(...questions)

      await prisma.parseTask.update({
        where: { id: taskId },
        data: { progress: 10 + Math.round(((i + 1) / Math.min(pages.length, 10)) * 70) }
      })
    }

    const questions = allQuestions
      .filter((q, i) => allQuestions.findIndex(x => x.number === q.number) === i)
      .sort((a, b) => a.number - b.number)
      .slice(0, 10)
      .map((q, i) => ({ ...q, number: i + 1 }))

    await prisma.paper.update({
      where: { id: paperId },
      data: {
        totalQuestions: questions.length,
        questions: JSON.stringify(questions)
      }
    })

    await prisma.parseTask.update({
      where: { id: taskId },
      data: {
        status: 'completed',
        progress: 100,
        result: JSON.stringify({ questionsFound: questions.length })
      }
    })

    console.log(`Done: ${questions.length} questions`)
  } catch (e: any) {
    console.error('Parse error:', e)
    await prisma.parseTask.update({
      where: { id: taskId },
      data: { status: 'failed', error: e.message }
    })
  }
}
