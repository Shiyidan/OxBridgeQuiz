<template>
  <div class="upload-page">
    <!-- 顶部返回 -->
    <div class="page-top-bar">
      <button class="back-btn" @click="$router.push('/admin/core-library/exams')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        返回真题库列表
      </button>
    </div>

    <div class="page-body">
      <div class="section-header">
        <div class="header-text">
          <h2 class="section-title">试卷解析录入</h2>
          <p class="section-desc">上传 PDF 试卷或单题图片，由 Qwen 大模型自动识别题目、公式与图形。</p>
        </div>
      </div>

      <div class="upload-area" :class="{ 'has-file': file }">
        <!-- 上传区 -->
        <div
          class="drop-zone"
          :class="{ 'drop-zone--active': dragOver }"
          @dragover.prevent="dragOver = true"
          @dragleave.prevent="dragOver = false"
          @drop.prevent="handleDrop"
          @click="triggerFileInput"
        >
          <template v-if="!file && !parsing">
            <div class="drop-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
            </div>
            <p class="drop-title">拖拽 PDF 或题目图片到此处</p>
            <p class="drop-hint">或点击此区域选择文件</p>
            <p class="drop-limit">支持 PDF（最大 50MB） / PNG / JPG（最大 10MB，单题测试）</p>
          </template>

          <template v-else-if="file && !parsing && !rendering">
            <div class="file-preview">
              <div v-if="fileKind === 'image' && imagePreviewUrl" class="image-thumb-wrap">
                <img :src="imagePreviewUrl" class="image-thumb" alt="题目图片预览" />
              </div>
              <div v-else class="file-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <p class="file-name-text">{{ file.name }}</p>
              <p class="file-size-text">
                <span class="file-kind-badge" :class="`kind-${fileKind}`">{{ fileKind === 'image' ? '单题图片' : 'PDF' }}</span>
                {{ (file.size / 1024 / 1024).toFixed(2) }} MB
              </p>
              <button class="btn-change" @click.stop="clearFile">重新选择</button>
            </div>
          </template>

          <!-- 前端渲染 + 流式上传中 -->
          <div v-if="rendering" class="parsing-status">
            <div class="parsing-spinner"></div>
            <p class="parsing-title">正在渲染并上传 PDF 页面...</p>
            <p class="parsing-detail">浏览器端渲染，逐页上传到后端解析</p>
          </div>

          <!-- 全部上传完成，等待 Qwen 解析 -->
          <div v-else-if="parsing && !rendering" class="parsing-status">
            <div class="parsing-spinner"></div>
            <p class="parsing-title">{{ parsingDone ? '解析完成' : parsingFailed ? '解析失败' : 'Qwen 大模型正在识别题目...' }}</p>
            <p class="parsing-detail" v-if="!parsingDone && !parsingFailed">{{ uploadDone ? `已上传全部 ${renderTotal} 页，后台解析中` : '正在上传页面...' }}</p>
            <p class="parsing-detail error-text" v-if="parsingFailed">{{ parseError }}</p>
          </div>
        </div>

        <!-- 标题编辑 -->
        <div v-if="file && !parsing && !rendering" class="title-edit-area">
          <label class="field-label">试卷名称</label>
          <input v-model="title" class="field-input" placeholder="输入试卷名称..." />
          <p class="field-hint">已自动使用文件名，可自行修改</p>

          <div class="meta-row">
            <div class="meta-field">
              <label class="field-label">年份</label>
              <input v-model.number="year" type="number" class="field-input field-input--sm" />
            </div>
            <div class="meta-field">
              <label class="field-label">考试时长（分钟）</label>
              <input v-model.number="duration" type="number" class="field-input field-input--sm" />
            </div>
          </div>

          <div class="action-bar">
            <button class="btn-secondary-action" @click="clearFile">取消</button>
            <button class="btn-primary-action" @click="startUpload" :disabled="!title || !year">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              开始解析
            </button>
          </div>
        </div>

        <!-- 渲染 + 上传进度 -->
        <div v-if="rendering || (parsing && !uploadDone)" class="progress-area">
          <div class="progress-bar-wrap">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: renderProgress + '%' }"></div>
            </div>
            <span class="progress-label">{{ renderProgress }}%</span>
          </div>
          <p class="progress-detail">已渲染并上传 {{ renderCurrent }} / {{ renderTotal }} 页</p>
        </div>

        <!-- Qwen 解析进度 -->
        <div v-if="parsing && uploadDone && !parsingDone && !parsingFailed" class="progress-area">
          <div class="progress-bar-wrap">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: progress + '%' }"></div>
            </div>
            <span class="progress-label">{{ progress }}%</span>
          </div>
        </div>

        <!-- 渲染页面预览（调试：只渲染选中页，避免内存溢出） -->
        <div v-if="debugPageCount > 0" class="debug-preview">
          <button class="debug-toggle" @click="showDebugPreview = !showDebugPreview">
            {{ showDebugPreview ? '收起' : '展开' }}页面渲染预览（{{ debugPageCount }} 页）
          </button>
          <div v-if="showDebugPreview" class="debug-body">
            <p class="debug-hint">点击页码查看该页渲染效果</p>
            <div class="debug-page-list">
              <button
                v-for="n in debugPageCount" :key="n"
                class="debug-page-btn"
                :class="{ active: debugSelectedPage === n }"
                @click="selectDebugPage(n)"
              >{{ n }}</button>
            </div>
            <div v-if="debugSelectedImage" class="debug-thumb-wrap">
              <span class="debug-thumb-label">第 {{ debugSelectedPage }} 页</span>
              <img :src="debugSelectedImage" class="debug-thumb-img" />
            </div>
          </div>
        </div>

        <!-- 结果 -->
        <div v-if="!rendering" class="result-actions" :class="{ 'mt-20': parsing }">
          <template v-if="parsingDone && paperId">
            <button class="btn-primary-action" @click="goToPreview">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              查看解析结果
            </button>
            <button class="btn-secondary-action" @click="resetUpload">上传新试卷</button>
          </template>

          <template v-if="parsingFailed">
            <button class="btn-secondary-action" @click="resetUpload">重新选择</button>
            <button class="btn-primary-action" @click="retryParse">重试解析</button>
          </template>
        </div>
      </div>
    </div>

    <input ref="fileInput" type="file" accept=".pdf,image/png,image/jpeg" class="hidden-input" @change="handleFileSelect" />
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

import request from '@/utils/request'
import { renderPdfToBase64Pages, type RenderedPage } from '@/utils/pdfRenderer'

const router = useRouter()

const fileInput = ref<HTMLInputElement | null>(null)
const file = ref<File | null>(null)
const fileKind = ref<'pdf' | 'image'>('pdf')
const imagePreviewUrl = ref('')
const dragOver = ref(false)
const title = ref('')
const year = ref(new Date().getFullYear())
const duration = ref(75)

const PDF_MAX_BYTES = 50 * 1024 * 1024
const IMG_MAX_BYTES = 10 * 1024 * 1024

function detectKind(f: File): 'pdf' | 'image' | null {
  if (f.type === 'application/pdf' || /\.pdf$/i.test(f.name)) return 'pdf'
  if (/^image\/(png|jpe?g)$/i.test(f.type) || /\.(png|jpe?g)$/i.test(f.name)) return 'image'
  return null
}

const rendering = ref(false)
const renderCurrent = ref(0)
const renderTotal = ref(0)
const renderProgress = ref(0)

const parsing = ref(false)
const uploadDone = ref(false)
const parsingDone = ref(false)
const parsingFailed = ref(false)
const parseError = ref('')
const progress = ref(0)
const paperId = ref('')
let taskId = ''
let pollTimer: ReturnType<typeof setInterval> | null = null
let abortController: AbortController | null = null

// 缓存渲染后的页面，供重试使用（不声明为 reactive，避免 Vue 追踪 base64 大字符串导致 OOM）
let cachedPages: RenderedPage[] = []
const showDebugPreview = ref(false)
const debugPageCount = ref(0)
const debugSelectedPage = ref(1)
const debugSelectedImage = ref('')

function updateDebugPreview(pages: RenderedPage[]): void {
  debugPageCount.value = pages.length
  if (debugSelectedPage.value > pages.length) {
    debugSelectedPage.value = 1
  }
}

function selectDebugPage(n: number): void {
  debugSelectedPage.value = n
  const p = cachedPages.find((x) => x.page === n)
  debugSelectedImage.value = p ? 'data:image/jpeg;base64,' + p.base64 : ''
}

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  if (abortController) abortController.abort()
  if (imagePreviewUrl.value) URL.revokeObjectURL(imagePreviewUrl.value)
})

function triggerFileInput(): void {
  if (!parsing.value && !rendering.value) fileInput.value?.click()
}

function handleFileSelect(e: Event): void {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) selectFile(f)
}

function handleDrop(e: DragEvent): void {
  dragOver.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) selectFile(f)
}

function selectFile(f: File): void {
  const kind = detectKind(f)
  if (!kind) {
    alert('仅支持 PDF / PNG / JPG 文件')
    return
  }
  const limit = kind === 'pdf' ? PDF_MAX_BYTES : IMG_MAX_BYTES
  if (f.size > limit) {
    alert(`文件超过大小限制（${kind === 'pdf' ? '50MB' : '10MB'}）`)
    return
  }
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
    imagePreviewUrl.value = ''
  }
  file.value = f
  fileKind.value = kind
  title.value = f.name.replace(/\.(pdf|png|jpe?g)$/i, '')
  if (kind === 'image') {
    imagePreviewUrl.value = URL.createObjectURL(f)
  }
}

function clearFile(): void {
  file.value = null
  fileKind.value = 'pdf'
  title.value = ''
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
    imagePreviewUrl.value = ''
  }
  cachedPages = []
}

function resetUpload(): void {
  file.value = null
  fileKind.value = 'pdf'
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
    imagePreviewUrl.value = ''
  }
  title.value = ''
  rendering.value = false
  parsing.value = false
  uploadDone.value = false
  parsingDone.value = false
  parsingFailed.value = false
  parseError.value = ''
  progress.value = 0
  paperId.value = ''
  taskId = ''
  cachedPages = []
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
  if (abortController) { abortController.abort(); abortController = null }
}

// 单题图片直接读原始字节为 base64，不做 Canvas 重编码。
// 之前对 PNG 做 0.9 JPEG 重编码会压糊电路图细线，导致 Qwen 识别失败返回空数组。
async function imageFileToBase64(f: File): Promise<{ base64: string; mimeType: string }> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(f)
  })
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!m || !m[1] || !m[2]) throw new Error('无法读取图片 base64')
  const mimeType = /png/i.test(m[1]) ? 'image/png' : 'image/jpeg'
  return { base64: m[2], mimeType }
}

async function startUpload(): Promise<void> {
  if (!file.value) return

  rendering.value = true
  parsingFailed.value = false
  parseError.value = ''

  // 阶段 1：收集页面 base64（PDF 走 pdf.js 渲染；单题图片直接读原始 bytes，不重编码）
  let pages: RenderedPage[]
  try {
    if (fileKind.value === 'image') {
      renderTotal.value = 1
      renderCurrent.value = 0
      renderProgress.value = 10
      const { base64, mimeType } = await imageFileToBase64(file.value)
      pages = [{ page: 1, base64, mimeType }]
      renderCurrent.value = 1
      renderProgress.value = 50
    } else {
      pages = await renderPdfToBase64Pages(file.value, {
        scale: 1.5,
        quality: 0.85,
        onProgress: (current, total) => {
          renderCurrent.value = current
          renderTotal.value = total
          renderProgress.value = Math.round((current / total) * 50)
        },
      })
    }

    if (pages.length === 0) {
      parsingFailed.value = true
      parseError.value = fileKind.value === 'image' ? '图片处理失败' : 'PDF 无可识别的内容页面'
      rendering.value = false
      return
    }

    cachedPages = pages
    updateDebugPreview(pages)
  } catch (e: any) {
    rendering.value = false
    parsingFailed.value = true
    const prefix = fileKind.value === 'image' ? '图片处理失败：' : 'PDF 渲染失败：'
    parseError.value = prefix + (e.message || '未知错误')
    return
  }

  // 阶段 2：创建任务
  parsing.value = true
  abortController = new AbortController()

  try {
    const createRes = await request.post('/upload/paper-pages/create', {
      title: title.value,
      year: year.value,
      duration: duration.value,
      totalPages: pages.length,
    }, {
      signal: abortController.signal,
    })
    taskId = createRes.data.taskId
    paperId.value = createRes.data.paperId
  } catch (e: any) {
    rendering.value = false
    if (e?.code !== 'ERR_CANCELED') {
      parsingFailed.value = true
      parseError.value = e.response?.data?.errMsg || e.message || '创建任务失败'
    }
    return
  }

  // 阶段 3：逐页上传（渲染完成一页立刻 POST，不等全部渲染完）
  for (const p of pages) {
    try {
      await request.post(
        `/parse-tasks/${taskId}/pages`,
        { page: p.page, base64: p.base64, mimeType: p.mimeType, totalPages: pages.length },
        { signal: abortController.signal },
      )
    } catch (e: any) {
      if (e?.code === 'ERR_CANCELED') return
      console.error(`Page ${p.page} upload failed:`, e.message)
    }

    renderCurrent.value = p.page
    renderProgress.value = 50 + Math.round((p.page / pages.length) * 50)
  }

  rendering.value = false
  uploadDone.value = true
  pollTask()
}

function pollTask(): void {
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = setInterval(async () => {
    try {
      const res = await request.get(`/parse-tasks/${taskId}`)
      progress.value = res.data.progress || 0

      if (res.data.status === 'completed') {
        if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
        parsingDone.value = true
      }
      if (res.data.status === 'failed') {
        if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
        parsingFailed.value = true
        parseError.value = res.data.error || '解析失败，请重试'
      }
    } catch {
      // 轮询错误静默处理
    }
  }, 2000)
}

async function retryParse(): Promise<void> {
  // 新流程：用缓存的渲染页面重新上传
  if (cachedPages.length > 0) {
    parsingFailed.value = false
    parseError.value = ''
    progress.value = 0
    uploadDone.value = false
    rendering.value = true

    abortController = new AbortController()

    // 重新创建任务
    try {
      const createRes = await request.post('/upload/paper-pages/create', {
        title: title.value,
        year: year.value,
        duration: duration.value,
        totalPages: cachedPages.length,
      }, {
        signal: abortController.signal,
      })
      taskId = createRes.data.taskId
      paperId.value = createRes.data.paperId
    } catch (e: any) {
      rendering.value = false
      if (e?.code !== 'ERR_CANCELED') {
        parsingFailed.value = true
        parseError.value = e.response?.data?.errMsg || e.message || '重试失败'
      }
      return
    }

    // 逐页重新上传
    for (const p of cachedPages) {
      try {
        await request.post(
          `/parse-tasks/${taskId}/pages`,
          { page: p.page, base64: p.base64, mimeType: p.mimeType, totalPages: cachedPages.length },
          { signal: abortController.signal },
        )
      } catch (e: any) {
        if (e?.code === 'ERR_CANCELED') return
        console.error(`Retry page ${p.page} upload failed:`, e.message)
      }
      renderCurrent.value = p.page
      renderProgress.value = Math.round((p.page / cachedPages.length) * 100)
    }

    rendering.value = false
    uploadDone.value = true
    pollTask()
    return
  }

  // 旧流程 fallback
  if (!taskId) return
  parsingFailed.value = false
  parseError.value = ''
  progress.value = 0

  try {
    await request.post(`/parse-tasks/${taskId}/retry`)
    pollTask()
  } catch (e: any) {
    parsingFailed.value = true
    parseError.value = e.response?.data?.errMsg || '重试失败'
  }
}

function goToPreview(): void {
  router.push(`/admin/core-library/exams/${paperId.value}`)
}
</script>

<style scoped lang="scss">
.upload-page { min-height: 100%; }

.page-top-bar { padding: 28px 40px 0; }
.back-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border: none; background: transparent;
  font-size: 0.875rem; font-weight: 500; color: #64748b;
  cursor: pointer; border-radius: 8px; transition: all 0.15s ease;
  svg { width: 16px; height: 16px; }
  &:hover { color: #0f172a; background: #f1f5f9; }
}

.page-body { padding: 24px 40px 48px; }

.section-header { margin-bottom: 32px; }
.header-text { max-width: 520px; }
.section-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; margin: 0 0 8px; }
.section-desc { font-size: 0.9rem; color: #64748b; line-height: 1.5; margin: 0; }

.upload-area { max-width: 620px; }

.drop-zone {
  border: 2px dashed #e2e8f0;
  border-radius: 16px;
  padding: 52px 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #ffffff;

  &:hover { border-color: #c7d2fe; background: #fafaff; }
  &--active { border-color: #4f46e5; background: #eef2ff; }
}

.drop-icon-wrap {
  width: 56px; height: 56px; border-radius: 14px;
  background: #eef2ff; display: flex; align-items: center; justify-content: center;
  margin: 0 auto 16px;
  svg { width: 28px; height: 28px; }
}

.drop-title { font-size: 1rem; font-weight: 600; color: #0f172a; margin: 0 0 6px; }
.drop-hint { font-size: 0.875rem; color: #94a3b8; margin: 0 0 6px; }
.drop-limit { font-size: 0.75rem; color: #cbd5e1; margin: 0; }

.file-preview { text-align: center; }
.file-icon-wrap {
  width: 56px; height: 56px; border-radius: 14px;
  background: #eef2ff; display: flex; align-items: center; justify-content: center;
  margin: 0 auto 12px;
  svg { width: 28px; height: 28px; }
}
.file-name-text { font-size: 1rem; font-weight: 600; color: #0f172a; margin: 0 0 4px; word-break: break-all; }
.file-size-text {
  font-size: 0.8125rem; color: #94a3b8; margin: 0 0 12px;
  display: inline-flex; align-items: center; gap: 8px;
}
.file-kind-badge {
  padding: 2px 8px; border-radius: 6px; font-size: 0.6875rem; font-weight: 600;
  &.kind-pdf { background: #eef2ff; color: #4f46e5; }
  &.kind-image { background: #ecfeff; color: #0891b2; }
}
.image-thumb-wrap {
  margin: 0 auto 12px; max-width: 320px;
}
.image-thumb {
  max-width: 100%; max-height: 240px; border-radius: 12px;
  border: 1px solid #e2e8f0; display: block; margin: 0 auto;
}
.btn-change {
  background: none; border: none; color: #4f46e5; font-size: 0.8125rem;
  font-weight: 500; cursor: pointer; padding: 4px 12px; border-radius: 6px;
  &:hover { background: #eef2ff; }
}

.parsing-status { text-align: center; }
.parsing-spinner {
  width: 40px; height: 40px; border-radius: 50%; margin: 0 auto 16px;
  border: 4px solid #eef2ff; border-top-color: #4f46e5;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.parsing-title { font-size: 1rem; font-weight: 600; color: #0f172a; margin: 0 0 6px; }
.parsing-detail { font-size: 0.875rem; color: #94a3b8; margin: 0; }
.parsing-detail.error-text { color: #ef4444; }

.title-edit-area {
  margin-top: 24px;
  background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;
  padding: 24px;
}

.field-label { display: block; font-size: 0.8125rem; font-weight: 600; color: #475569; margin-bottom: 6px; }
.field-hint { font-size: 0.75rem; color: #94a3b8; margin: 4px 0 0; }

.field-input {
  width: 100%; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 10px;
  font-size: 0.9rem; color: #0f172a; outline: none; font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
  &::placeholder { color: #cbd5e1; }
  &:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,.1); }
  &--sm { width: 100%; }
}

.meta-row { display: flex; gap: 16px; margin-top: 16px; }
.meta-field { flex: 1; }

.action-bar { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }

.btn-primary-action {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 10px 22px; background: #4f46e5; color: white; border: none;
  border-radius: 10px; font-size: 0.875rem; font-weight: 600;
  cursor: pointer; transition: all 0.2s ease; font-family: inherit;
  svg { width: 16px; height: 16px; }
  &:hover:not(:disabled) { background: #6366f1; box-shadow: 0 4px 14px rgba(79,70,229,.35); transform: translateY(-1px); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.btn-secondary-action {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 10px 22px; background: #ffffff; color: #475569; border: 1px solid #e2e8f0;
  border-radius: 10px; font-size: 0.875rem; font-weight: 600;
  cursor: pointer; transition: all 0.2s ease; font-family: inherit;
  svg { width: 16px; height: 16px; }
  &:hover { background: #f8fafc; border-color: #cbd5e1; }
}

.progress-area { margin-top: 20px; }
.progress-bar-wrap { display: flex; align-items: center; gap: 12px; }
.progress-bar { flex: 1; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #4f46e5); border-radius: 4px; transition: width 0.5s ease; }
.progress-label { font-size: 0.875rem; font-weight: 600; color: #4f46e5; min-width: 36px; }
.progress-detail { font-size: 0.8125rem; color: #94a3b8; margin: 8px 0 0; text-align: center; }

.result-actions { display: flex; gap: 12px; }
.mt-20 { margin-top: 20px; }

.hidden-input { display: none; }

/* 调试：渲染页面预览 */
.debug-preview {
  margin-top: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}
.debug-toggle {
  width: 100%;
  padding: 10px 16px;
  background: #f8fafc;
  border: none;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  &:hover { background: #f1f5f9; }
}
.debug-body {
  padding: 12px 16px 16px;
  background: #fafafa;
}
.debug-hint {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0 0 8px;
}
.debug-page-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}
.debug-page-btn {
  width: 36px;
  height: 32px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  font-size: 0.75rem;
  color: #64748b;
  cursor: pointer;
  font-family: inherit;
  &:hover { border-color: #4f46e5; color: #4f46e5; }
  &.active { background: #4f46e5; color: #fff; border-color: #4f46e5; }
}
.debug-thumb-wrap {
  text-align: center;
}
.debug-thumb-img {
  max-width: 100%;
  max-height: 500px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}
.debug-thumb-label {
  display: block;
  font-size: 0.75rem;
  color: #94a3b8;
  margin-bottom: 8px;
}
</style>
