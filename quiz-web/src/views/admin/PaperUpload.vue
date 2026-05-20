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
          <p class="section-desc">上传 PDF 试卷，由 Qwen 大模型自动识别题目、公式与图形。</p>
        </div>
      </div>

      <!-- 无文件 / 已选择文件时不同状态 -->
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
            <p class="drop-title">拖拽 PDF 文件到此处</p>
            <p class="drop-hint">或点击此区域选择文件</p>
            <p class="drop-limit">最大 50MB，仅支持 PDF 格式</p>
          </template>

          <template v-else-if="file && !parsing">
            <div class="file-preview">
              <div class="file-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <p class="file-name-text">{{ file.name }}</p>
              <p class="file-size-text">{{ (file.size / 1024 / 1024).toFixed(1) }} MB</p>
              <button class="btn-change" @click.stop="clearFile">重新选择</button>
            </div>
          </template>

          <!-- 解析中 -->
          <div v-else-if="parsing" class="parsing-status">
            <div class="parsing-spinner"></div>
            <p class="parsing-title">{{ parsingDone ? '解析完成' : parsingFailed ? '解析失败' : '正在解析试卷...' }}</p>
            <p class="parsing-detail" v-if="!parsingDone && !parsingFailed">Qwen 大模型正在识别题目内容，请稍候</p>
            <p class="parsing-detail error-text" v-if="parsingFailed">{{ parseError }}</p>
          </div>
        </div>

        <!-- 标题编辑 -->
        <div v-if="file && !parsing" class="title-edit-area">
          <label class="field-label">试卷名称</label>
          <input
            v-model="title"
            class="field-input"
            placeholder="输入试卷名称..."
          />
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

        <!-- 解析进度 & 结果 -->
        <div v-if="parsing" class="progress-area">
          <div class="progress-bar-wrap" v-if="!parsingDone && !parsingFailed">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: progress + '%' }"></div>
            </div>
            <span class="progress-label">{{ progress }}%</span>
          </div>

          <div class="result-actions" v-if="parsingDone && paperId">
            <button class="btn-primary-action" @click="goToPreview">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              查看解析结果
            </button>
            <button class="btn-secondary-action" @click="resetUpload">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              上传新试卷
            </button>
          </div>

          <div class="result-actions" v-if="parsingFailed">
            <button class="btn-secondary-action" @click="resetUpload">重新选择</button>
            <button class="btn-primary-action" @click="retryParse">重试解析</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 隐藏的 file input -->
    <input ref="fileInput" type="file" accept=".pdf" class="hidden-input" @change="handleFileSelect" />
  </div>
</template>

<script setup lang="ts">
// 试卷解析录入（PDF 拖拽上传 → Qwen 自动识别 → 存入数据库）
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

import request from '@/utils/request'

const router = useRouter()

const fileInput = ref<HTMLInputElement | null>(null)
const file = ref<File | null>(null)
const dragOver = ref(false)
const title = ref('')
const year = ref(new Date().getFullYear())
const duration = ref(75)

const parsing = ref(false)
const parsingDone = ref(false)
const parsingFailed = ref(false)
const parseError = ref('')
const progress = ref(0)
const paperId = ref('')
let taskId = ''
let pollTimer: ReturnType<typeof setInterval> | null = null
let abortController: AbortController | null = null

// 组件卸载时清理定时器和请求
onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  if (abortController) abortController.abort()
})

function triggerFileInput(): void {
  if (!parsing.value) fileInput.value?.click()
}

function handleFileSelect(e: Event): void {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) selectFile(f)
}

function handleDrop(e: DragEvent): void {
  dragOver.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f?.type === 'application/pdf') selectFile(f)
}

function selectFile(f: File): void {
  file.value = f
  // 自动使用文件名（去掉扩展名）作为标题
  const name = f.name.replace(/\.pdf$/i, '')
  title.value = name
}

function clearFile(): void {
  file.value = null
  title.value = ''
}

function resetUpload(): void {
  file.value = null
  title.value = ''
  parsing.value = false
  parsingDone.value = false
  parsingFailed.value = false
  parseError.value = ''
  progress.value = 0
  paperId.value = ''
  taskId = ''
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
  if (abortController) { abortController.abort(); abortController = null }
}

async function startUpload(): Promise<void> {
  if (!file.value) return

  parsing.value = true
  parsingFailed.value = false
  parseError.value = ''
  const form = new FormData()
  form.append('file', file.value)
  form.append('title', title.value)
  form.append('year', String(year.value))
  form.append('duration', String(duration.value))

  abortController = new AbortController()

  try {
    const res = await request.post('/upload/paper', form, {
      signal: abortController.signal,
    })
    taskId = res.data.taskId
    paperId.value = res.data.paperId
    pollTask()
  } catch (e: any) {
    if (e?.code !== 'ERR_CANCELED') {
      parsingFailed.value = true
      parseError.value = e.response?.data?.errMsg || e.message || '上传失败'
    }
  }
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

/* ========== 上传区域 ========== */
.upload-area {
  max-width: 620px;
}

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

/* 已选文件 */
.file-preview { text-align: center; }
.file-icon-wrap {
  width: 56px; height: 56px; border-radius: 14px;
  background: #eef2ff; display: flex; align-items: center; justify-content: center;
  margin: 0 auto 12px;
  svg { width: 28px; height: 28px; }
}
.file-name-text { font-size: 1rem; font-weight: 600; color: #0f172a; margin: 0 0 4px; word-break: break-all; }
.file-size-text { font-size: 0.8125rem; color: #94a3b8; margin: 0 0 12px; }
.btn-change {
  background: none; border: none; color: #4f46e5; font-size: 0.8125rem;
  font-weight: 500; cursor: pointer; padding: 4px 12px; border-radius: 6px;
  &:hover { background: #eef2ff; }
}

/* 解析状态 */
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

/* 文件名编辑 */
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

/* 进度 */
.progress-area { margin-top: 20px; }
.progress-bar-wrap { display: flex; align-items: center; gap: 12px; }
.progress-bar { flex: 1; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #4f46e5); border-radius: 4px; transition: width 0.5s ease; }
.progress-label { font-size: 0.875rem; font-weight: 600; color: #4f46e5; min-width: 36px; }

.result-actions { display: flex; gap: 12px; }

.hidden-input { display: none; }
</style>
