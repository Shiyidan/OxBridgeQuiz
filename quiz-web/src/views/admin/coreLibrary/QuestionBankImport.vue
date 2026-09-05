<!-- 试题库导入页：选择 standard2 JSON 或 JSON-in-Markdown 文件并整批提交校验。 -->
<template>
  <div class="import-page">
    <header class="page-header">
      <div>
        <button
          type="button"
          class="back-link"
          @click="router.push('/admin/core-library/questions')"
        >
          ← 返回试题库
        </button>
        <h2>导入试题库题目</h2>
        <p>仅接受 <code>standard2.md</code> 定义的根层 metadata + questions 格式。</p>
      </div>
    </header>

    <section class="import-card">
      <div class="rules">
        <h3>导入规则</h3>
        <ul>
          <li>支持严格 JSON，或只读取第一个 fenced json 代码块的 Markdown。</li>
          <li>metadata.questionCount 必须与 questions.length 完全一致。</li>
          <li>题目 code 必须全局唯一，考纲 code 和 label 必须匹配当前考纲。</li>
          <li>TMUA 题目的 part 必须填写 paper1 或 paper2；ESAT、STEP 题目不得填写 part。</li>
          <li>整批校验、整批提交；任意一题失败都不会写入数据。</li>
          <li>普通题导入后为草稿；带 revision 的替换题必须整包上线，不能逐题发布。</li>
        </ul>
      </div>

      <label class="file-picker" :class="{ 'file-picker--selected': selectedFile }">
        <input type="file" accept=".json,.md,application/json,text/markdown" @change="selectFile" />
        <strong>{{ selectedFile ? selectedFile.name : '选择 JSON 或 Markdown 文件' }}</strong>
        <span>{{
          selectedFile ? formatFileSize(selectedFile.size) : '单次建议不超过 50 道题'
        }}</span>
      </label>

      <div v-if="preview" class="preview-grid">
        <div>
          <span>批次标题</span><strong>{{ preview.title }}</strong>
        </div>
        <div>
          <span>声明题量</span><strong>{{ preview.questionCount }} 题</strong>
        </div>
        <div>
          <span>实际题量</span><strong>{{ preview.actualCount }} 题</strong>
        </div>
        <div>
          <span>替换题量</span><strong>{{ preview.replacementCount }} 题</strong>
        </div>
        <div>
          <span>备注</span><strong>{{ preview.remarks || '—' }}</strong>
        </div>
      </div>
      <el-alert v-if="localError" :title="localError" type="error" :closable="false" show-icon />

      <div class="actions">
        <el-button @click="clearFile">清空</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="!selectedFile || Boolean(localError)"
          @click="submitImport"
        >
          校验并导入
        </el-button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { importQuestionBankDocument } from '@/api/questionBank'

const router = useRouter()
const selectedFile = ref<File | null>(null)
const fileContent = ref('')
const localError = ref('')
const submitting = ref(false)
const preview = ref<{
  title: string
  questionCount: number
  actualCount: number
  replacementCount: number
  remarks: string
} | null>(null)

// 本地预览只提取批次信息，所有结构与考纲校验都以后端事务入口为准。
function parsePreview(content: string): void {
  try {
    const text = content.replace(/^\uFEFF/, '').trim()
    const jsonText = text.startsWith('{') ? text : /(```|~~~)json\s*([\s\S]*?)\1/i.exec(text)?.[2]
    if (!jsonText) throw new Error('Markdown 中未找到 fenced json 代码块')
    const document = JSON.parse(jsonText)
    if (
      !document ||
      typeof document !== 'object' ||
      !document.metadata ||
      !Array.isArray(document.questions)
    ) {
      throw new Error('根层必须包含 metadata 和 questions')
    }
    preview.value = {
      title: String(document.metadata.title || '—'),
      questionCount: Number(document.metadata.questionCount) || 0,
      actualCount: document.questions.length,
      replacementCount: document.questions.filter(
        (question: unknown) =>
          Boolean(question) &&
          typeof question === 'object' &&
          Boolean((question as { revision?: unknown }).revision),
      ).length,
      remarks: String(document.metadata.remarks || ''),
    }
    localError.value = ''
  } catch (error) {
    preview.value = null
    localError.value = error instanceof Error ? error.message : '文件无法解析'
  }
}

// 文件读取限制在浏览器内存中，选择新文件时覆盖上一份预览。
async function selectFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] || null
  selectedFile.value = file
  fileContent.value = ''
  preview.value = null
  localError.value = ''
  if (!file) return
  if (!/\.(json|md)$/i.test(file.name)) {
    localError.value = '仅支持 .json 或 .md 文件'
    return
  }
  if (file.size > 20 * 1024 * 1024) {
    localError.value = '文件大小不能超过 20 MB'
    return
  }
  fileContent.value = await file.text()
  parsePreview(fileContent.value)
}

// 清空时同时移除本地文本，避免误提交上一次文件。
function clearFile(): void {
  selectedFile.value = null
  fileContent.value = ''
  preview.value = null
  localError.value = ''
}

// 文件大小只用于选择后的可读提示，不参与后端限制判断。
function formatFileSize(size: number): string {
  return size < 1024 * 1024
    ? `${Math.ceil(size / 1024)} KB`
    : `${(size / 1024 / 1024).toFixed(1)} MB`
}

// 后端返回成功即表示批次、全部题目和知识点关联均已原子写入。
async function submitImport(): Promise<void> {
  if (!selectedFile.value || !fileContent.value) return
  submitting.value = true
  try {
    const result = await importQuestionBankDocument(fileContent.value, selectedFile.value.name)
    ElMessage.success(
      result.replacementCount
        ? `替换文件已导入，共创建 ${result.questionCount} 道草稿题，其中 ${result.replacementCount} 道等待整包上线`
        : `文件已导入，共创建 ${result.questionCount} 道草稿题`,
    )
    await router.push({
      name: 'admin-question-batch-detail',
      params: { batchId: result.batchId },
    })
  } catch {
    // 公共请求层展示服务端逐项校验结果。
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
.import-page {
  max-width: 980px;
  padding: 28px 40px 56px;
}

.page-header {
  margin-bottom: 18px;
}

.back-link {
  padding: 0;
  border: 0;
  background: transparent;
  color: #64748b;
  cursor: pointer;
}

.page-header h2 {
  margin: 14px 0 6px;
  color: #0f172a;
}

.page-header p {
  margin: 0;
  color: #64748b;
}

.import-card {
  display: grid;
  gap: 20px;
  padding: 28px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.rules h3 {
  margin: 0 0 10px;
}

.rules ul {
  margin: 0;
  padding-left: 20px;
  color: #475569;
  line-height: 1.8;
}

.file-picker {
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 42px 24px;
  border: 1px dashed #94a3b8;
  border-radius: var(--radius-md);
  background: #f8fafc;
  color: #334155;
  cursor: pointer;
}

.file-picker--selected {
  border-color: #111827;
  background: #f1f5f9;
}

.file-picker input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.file-picker span {
  color: #64748b;
  font-size: 13px;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.preview-grid div {
  display: grid;
  gap: 5px;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

.preview-grid span {
  color: #64748b;
  font-size: 12px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
