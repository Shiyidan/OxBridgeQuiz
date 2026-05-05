<template>
  <div class="page-content">
    <div class="page-header">
      <h2>上传试卷</h2>
    </div>

    <div class="card upload-card">
      <div class="steps">
        <div class="step" :class="{ active: step === 1, done: step > 1 }">
          <div class="step-num">1</div>
          <div class="step-label">选择文件</div>
        </div>
        <div class="step-line" :class="{ done: step > 1 }"></div>
        <div class="step" :class="{ active: step === 2, done: step > 2 }">
          <div class="step-num">2</div>
          <div class="step-label">填写信息</div>
        </div>
        <div class="step-line" :class="{ done: step > 2 }"></div>
        <div class="step" :class="{ active: step === 3 }">
          <div class="step-num">3</div>
          <div class="step-label">上传解析</div>
        </div>
      </div>

      <!-- 步骤1：选择文件 -->
      <div v-if="step === 1" class="step-body">
        <div class="drop-zone" :class="{ hasFile: file }" @dragover.prevent @drop.prevent="handleDrop">
          <template v-if="!file">
            <div class="drop-icon">📄</div>
            <p>拖拽PDF文件到此处</p>
            <p class="drop-hint">或</p>
            <label class="btn-outline">
              选择文件
              <input type="file" accept=".pdf" @change="handleFile" hidden />
            </label>
          </template>
          <template v-else>
            <div class="drop-icon">📑</div>
            <p class="file-name">{{ file.name }}</p>
            <p class="file-size">{{ (file.size / 1024 / 1024).toFixed(1) }} MB</p>
            <button @click="file = null" class="btn-text">重新选择</button>
          </template>
        </div>
        <div class="step-actions">
          <button class="btn-primary" :disabled="!file" @click="step = 2">下一步</button>
        </div>
      </div>

      <!-- 步骤2：填写信息 -->
      <div v-if="step === 2" class="step-body">
        <div class="info-form">
          <div class="form-group">
            <label>试卷标题 <span class="required">*</span></label>
            <input v-model="title" placeholder="如：ENGAA 2023 Section 1" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>年份 <span class="required">*</span></label>
              <input v-model.number="year" type="number" placeholder="2023" />
            </div>
            <div class="form-group">
              <label>考试时长（分钟） <span class="required">*</span></label>
              <input v-model.number="duration" type="number" placeholder="60" />
            </div>
          </div>
        </div>
        <div class="step-actions">
          <button class="btn-cancel" @click="step = 1">上一步</button>
          <button class="btn-primary" :disabled="!title || !year" @click="upload">上传并解析</button>
        </div>
      </div>

      <!-- 步骤3：解析进度 -->
      <div v-if="step === 3" class="step-body">
        <div class="parse-status">
          <div class="parse-icon">{{ parsingFailed ? '❌' : parsingDone ? '✅' : '⏳' }}</div>
          <p class="parse-title">{{ parsingFailed ? '解析失败' : parsingDone ? '解析完成' : '正在解析试卷...' }}</p>
          <p class="parse-detail" v-if="!parsingDone && !parsingFailed">Qwen大模型正在分析试卷内容，请稍候</p>
          <p class="parse-detail error-text" v-if="parsingFailed">{{ parseError }}</p>
        </div>
        <div class="progress-bar" v-if="!parsingDone && !parsingFailed">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          <span class="progress-text">{{ progress }}%</span>
        </div>
        <div class="step-actions" v-if="parsingDone || parsingFailed">
          <router-link to="/admin/papers" class="btn-primary">返回列表</router-link>
          <button v-if="parsingFailed" @click="retry" class="btn-outline" style="margin-left:12px">重试</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const step = ref(1)
const file = ref<File | null>(null)
const title = ref('')
const year = ref(new Date().getFullYear())
const duration = ref(60)
const progress = ref(0)
const parsingDone = ref(false)
const parsingFailed = ref(false)
const parseError = ref('')
let taskId = ''

function handleFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) file.value = f
}

function handleDrop(e: DragEvent) {
  const f = e.dataTransfer?.files?.[0]
  if (f?.type === 'application/pdf') { file.value = f; step.value = 2 }
}

function showError(msg: string) {
  parsingFailed.value = true
  parseError.value = msg
}

async function upload() {
  if (!file.value) return
  step.value = 3

  const form = new FormData()
  form.append('file', file.value)
  form.append('title', title.value)
  form.append('year', String(year.value))
  form.append('duration', String(duration.value))

  try {
    const res = await fetch('http://localhost:3001/api/upload/paper', { method: 'POST', body: form })
    const data = await res.json()
    taskId = data.taskId
    pollTask()
  } catch (e) {
    showError('上传失败，请检查网络连接')
  }
}

async function pollTask() {
  const interval = setInterval(async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/parse-tasks/${taskId}`)
      const data = await res.json()
      progress.value = data.progress

      if (data.status === 'completed') {
        clearInterval(interval)
        parsingDone.value = true
      }
      if (data.status === 'failed') {
        clearInterval(interval)
        showError(data.error || '解析失败')
      }
    } catch {
      // ignore polling errors
    }
  }, 2000)
}

function retry() {
  parsingDone.value = false
  parsingFailed.value = false
  parseError.value = ''
  progress.value = 0
  step.value = 2
}
</script>

<style scoped>
.page-content { padding: 32px; }
.page-header { margin-bottom: 24px; }
.page-header h2 { margin: 0; font-size: 1.25rem; }
.card { background: white; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,.06); }
.upload-card { padding: 32px; }

.steps { display: flex; align-items: center; justify-content: center; margin-bottom: 40px; }
.step { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.step-num { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; background: #f0f0f0; color: #999; border: 2px solid #f0f0f0; }
.step.active .step-num { background: #e6f7ff; color: #1890ff; border-color: #1890ff; }
.step.done .step-num { background: #1890ff; color: white; border-color: #1890ff; }
.step-label { font-size: 13px; color: #999; }
.step.active .step-label { color: #333; font-weight: 500; }
.step-line { flex: 1; height: 2px; background: #f0f0f0; margin: 0 16px; margin-bottom: 24px; max-width: 100px; }
.step-line.done { background: #1890ff; }

.step-body { min-height: 200px; }
.step-actions { display: flex; justify-content: center; margin-top: 32px; gap: 12px; }

.drop-zone { border: 2px dashed #d9d9d9; border-radius: 8px; padding: 48px; text-align: center; transition: all .2s; }
.drop-zone.hasFile { border-color: #1890ff; background: #f0f9ff; }
.drop-zone:hover { border-color: #1890ff; }
.drop-icon { font-size: 40px; margin-bottom: 12px; }
.drop-zone p { color: #666; margin: 4px 0; }
.drop-hint { font-size: 13px; color: #999; margin: 16px 0; }
.file-name { font-weight: 500; font-size: 16px; color: #1890ff; }
.file-size { font-size: 13px; color: #999; }
.btn-outline { display: inline-block; padding: 8px 24px; border: 1px solid #1890ff; color: #1890ff; border-radius: 6px; cursor: pointer; font-size: 14px; }
.btn-outline:hover { background: #e6f7ff; }
.btn-text { background: none; border: none; color: #999; cursor: pointer; margin-top: 8px; }

.info-form { max-width: 560px; margin: 0 auto; }
.drop-zone { max-width: 560px; margin: 0 auto; }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; margin-bottom: 6px; font-weight: 500; font-size: 14px; color: #333; }
.required { color: #ff4d4f; }
.form-group input { width: 100%; padding: 10px 12px; border: 1px solid #d9d9d9; border-radius: 6px; font-size: 14px; transition: border-color .2s; }
.form-group input:focus { outline: none; border-color: #1890ff; box-shadow: 0 0 0 2px rgba(24,144,255,.1); }
.form-row { display: flex; gap: 16px; }
.form-row .form-group { flex: 1; }

.btn-primary { padding: 10px 32px; background: #1890ff; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; text-decoration: none; display: inline-block; }
.btn-primary:hover:not(:disabled) { background: #40a9ff; }
.btn-primary:disabled { background: #d9d9d9; cursor: not-allowed; }
.btn-cancel { padding: 10px 32px; border: 1px solid #d9d9d9; background: white; border-radius: 6px; cursor: pointer; font-size: 14px; }

.parse-status { text-align: center; padding: 20px 0; }
.parse-icon { font-size: 48px; margin-bottom: 12px; }
.parse-title { font-size: 16px; font-weight: 500; margin: 0 0 8px; }
.parse-detail { font-size: 13px; color: #999; margin: 0; }
.error-text { color: #ff4d4f; }

.progress-bar { position: relative; height: 10px; background: #e8e8e8; border-radius: 5px; overflow: hidden; margin-top: 16px; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #1890ff, #69c0ff); border-radius: 5px; transition: width .5s; }
.progress-text { position: absolute; right: 0; top: -22px; font-size: 13px; color: #1890ff; font-weight: 500; }
</style>
