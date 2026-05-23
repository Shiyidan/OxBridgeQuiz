/**
 * 前端 PDF 渲染工具 —— 用 pdf.js 在浏览器端将 PDF 每页转为 JPEG Base64，
 * 替代后端 Python PyMuPDF 方案。
 */
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

// 配置 pdf.js worker（Vite 会将 ?url 解析为静态资源路径）
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl

export interface RenderedPage {
  page: number
  base64: string
}

export interface RenderOptions {
  /** 渲染倍率，默认 1.5（108 DPI 等效） */
  scale?: number
  /** JPEG 质量 0-1，默认 0.85 */
  quality?: number
  /** 封面跳过阈值（字符数），默认 100。仅检查前 2 页 */
  coverTextThreshold?: number
  /** 进度回调 */
  onProgress?: (current: number, total: number) => void
}

/**
 * 将 PDF 文件逐页渲染为 JPEG Base64
 * 复用 Python 脚本的封面跳过逻辑：前 2 页文本 < threshold 则跳过
 */
export async function renderPdfToBase64Pages(
  file: File,
  options: RenderOptions = {},
): Promise<RenderedPage[]> {
  const { scale = 1.5, quality = 0.85, coverTextThreshold = 100, onProgress } = options

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const totalPages = pdf.numPages
  const pages: RenderedPage[] = []

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i)

    // 前 2 页封面/目录检测：文本不足阈值则跳过
    if (i <= 2) {
      const textContent = await page.getTextContent()
      const text = textContent.items.map((item: any) => item.str ?? '').join(' ')
      if (text.trim().length < coverTextThreshold) {
        onProgress?.(i, totalPages)
        continue
      }
    }

    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')!

    await page.render({ canvasContext: ctx, viewport }).promise

    // JPEG 比 PNG 体积更小，适合传输
    const dataUrl = canvas.toDataURL('image/jpeg', quality)
    const base64 = dataUrl.split(',')[1] ?? ''
    pages.push({ page: i, base64 })

    onProgress?.(i, totalPages)
  }

  return pages
}
