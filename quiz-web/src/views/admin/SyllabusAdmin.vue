<template>
  <div class="syllabus-page">
    <div class="page-top-bar">
      <button class="back-btn" type="button" @click="$router.push('/admin/core-library')">
        ← 返回资料库
      </button>
    </div>

    <div class="page-body">
      <div class="section-header">
        <div class="header-text">
          <h2 class="section-title">大纲库管理</h2>
          <p class="section-desc">管理不同考试类型的考纲版本，启用后应用到试题库左侧组织树。</p>
        </div>
        <button class="btn-primary-action" type="button" @click="triggerFileSelect">
          上传考纲
        </button>
        <input
          ref="fileInput"
          class="file-input"
          type="file"
          accept=".json,application/json"
          @change="handleFileChange"
        />
      </div>

      <div v-if="loading" class="empty-card">加载中...</div>
      <div v-else class="data-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>序号</th>
              <th>考纲名称</th>
              <th>考试类型</th>
              <th>上传时间</th>
              <th>是否启用</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in syllabusList" :key="item.id">
              <td>{{ index + 1 }}</td>
              <td class="name-cell">{{ item.name }}</td>
              <td><span class="exam-type-tag">{{ item.examType }}</span></td>
              <td>{{ formatDate(item.createdAt) }}</td>
              <td>
                <span class="status-tag" :class="{ 'status-tag--active': item.isActive }">
                  {{ item.isActive ? '已启用' : '未启用' }}
                </span>
              </td>
              <td class="action-cell">
                <button class="action-link" type="button" @click="viewSyllabus(item.id)">
                  查看
                </button>
                <button
                  v-if="item.isActive"
                  class="action-link danger"
                  type="button"
                  @click="disableSyllabus(item)"
                >
                  停用
                </button>
                <button
                  v-else
                  class="action-link"
                  type="button"
                  @click="enableSyllabus(item)"
                >
                  启用
                </button>
              </td>
            </tr>
            <tr v-if="!syllabusList.length">
              <td class="empty-row" colspan="6">暂无考纲，请点击右上角上传考纲</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="uploadDialogVisible" class="modal-mask" @click.self="closeUploadDialog">
      <section class="modal-panel">
        <header class="modal-header">
          <h3>上传考纲</h3>
          <button class="modal-close" type="button" @click="closeUploadDialog">×</button>
        </header>
        <div class="form-grid">
          <label class="field-label">
            考纲名称
            <input v-model="uploadForm.name" class="text-input" type="text" />
          </label>
          <label class="field-label">
            考试类型
            <select v-model="uploadForm.examType" class="text-input">
              <option v-for="option in examTypeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
        </div>
        <div class="modal-actions">
          <button class="btn-ghost-action" type="button" @click="closeUploadDialog">取消</button>
          <button class="btn-primary-action" type="button" :disabled="submitting" @click="submitUpload">
            保存
          </button>
        </div>
      </section>
    </div>

    <div v-if="detailDialogVisible" class="modal-mask" @click.self="detailDialogVisible = false">
      <section class="modal-panel modal-panel--wide">
        <header class="modal-header">
          <h3>{{ detailTitle }}</h3>
          <button class="modal-close" type="button" @click="detailDialogVisible = false">×</button>
        </header>
        <pre class="json-preview">{{ detailJson }}</pre>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
// 大纲库管理：上传 JSON 考纲版本，并控制试题库当前启用的组织树。
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { EXAM_TYPE_OPTIONS, DEFAULT_EXAM_TYPE, type ExamType } from '@/constants/examTypes'
import {
  disableSyllabusData,
  enableSyllabusData,
  getSyllabusDetailData,
  getSyllabusListData,
  uploadSyllabusData,
  type SyllabusItem,
} from '@/api/syllabus'

type RawSyllabusNode = {
  code?: unknown
  label?: unknown
  name?: unknown
  title?: unknown
  children?: unknown
}

const loading = ref(true)
const submitting = ref(false)
const syllabusList = ref<SyllabusItem[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const pendingContent = ref<unknown>(null)
const uploadDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const detailTitle = ref('')
const detailContent = ref<unknown>(null)
const uploadForm = ref<{ name: string; examType: ExamType }>({
  name: '',
  examType: DEFAULT_EXAM_TYPE,
})

const examTypeOptions = EXAM_TYPE_OPTIONS
const detailJson = computed(() => JSON.stringify(detailContent.value, null, 2))

onMounted(fetchSyllabusList)

async function fetchSyllabusList(): Promise<void> {
  loading.value = true
  try {
    const data = await getSyllabusListData()
    syllabusList.value = data || []
  } catch {
    syllabusList.value = []
  } finally {
    loading.value = false
  }
}

function triggerFileSelect(): void {
  fileInput.value?.click()
}

function isJsonFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.json') || file.type === 'application/json'
}

async function showUploadValidationError(message: string): Promise<void> {
  await ElMessageBox.alert(message, '考纲文件校验失败', {
    confirmButtonText: '知道了',
    type: 'warning',
  })
}

function getSyllabusRoots(input: unknown): RawSyllabusNode[] {
  if (Array.isArray(input)) return input as RawSyllabusNode[]
  if (!input || typeof input !== 'object') {
    throw new Error('考纲内容必须是树形 JSON，请上传包含考纲节点的 JSON 文件。')
  }

  const obj = input as Record<string, unknown>
  if (Array.isArray(obj.nodes)) return obj.nodes as RawSyllabusNode[]
  if (Array.isArray(obj.syllabus)) return obj.syllabus as RawSyllabusNode[]
  if (Array.isArray(obj.tree)) return obj.tree as RawSyllabusNode[]
  if (Array.isArray(obj.children)) return obj.children as RawSyllabusNode[]
  if ('code' in obj && ('label' in obj || 'name' in obj || 'title' in obj)) {
    return [obj as RawSyllabusNode]
  }

  throw new Error('考纲内容缺少节点数组，请使用 [{ code, label, children }] 或包含 nodes/children 的结构。')
}

function validateSyllabusContent(input: unknown): void {
  const roots = getSyllabusRoots(input)
  const seen = new Set<string>()

  function visit(node: RawSyllabusNode, path: string): void {
    const code = typeof node.code === 'string' ? node.code.trim() : ''
    const labelSource = node.label ?? node.name ?? node.title
    const label = typeof labelSource === 'string' ? labelSource.trim() : ''

    if (!code) throw new Error(`${path} 缺少 code，请为每个考纲节点填写唯一编码。`)
    if (!label) throw new Error(`${path} 缺少 label，请为每个考纲节点填写节点名称。`)
    if (seen.has(code)) throw new Error(`节点 code 重复：${code}，请保证同一份考纲内编码唯一。`)
    seen.add(code)

    if (node.children === undefined) return
    if (!Array.isArray(node.children)) {
      throw new Error(`节点 ${code} 的 children 必须是数组，请检查该节点的子节点结构。`)
    }
    node.children.forEach((child, index) => {
      visit(child as RawSyllabusNode, `${path} > ${code} > 第 ${index + 1} 个子节点`)
    })
  }

  if (!roots.length) throw new Error('考纲至少需要一个节点。')
  roots.forEach((node, index) => visit(node, `第 ${index + 1} 个根节点`))
}

async function handleFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!isJsonFile(file)) {
    await showUploadValidationError('当前选择的文件不是 JSON 格式，请上传 .json 考纲文件。')
    return
  }

  try {
    const text = await file.text()
    const parsed = JSON.parse(text)
    validateSyllabusContent(parsed)
    pendingContent.value = parsed
    uploadForm.value = {
      name: file.name.replace(/\.json$/i, ''),
      examType: inferExamType(file.name, parsed),
    }
    uploadDialogVisible.value = true
  } catch (e: any) {
    await showUploadValidationError(
      e instanceof SyntaxError
        ? '文件内容不是合法 JSON，请检查括号、逗号和引号是否正确。'
        : e?.message || '请选择有效的 JSON 考纲文件。',
    )
  }
}

function inferExamType(fileName: string, content: unknown): ExamType {
  const source = `${fileName} ${JSON.stringify(content).slice(0, 300)}`.toUpperCase()
  const matched = EXAM_TYPE_OPTIONS.find((item) => source.includes(item.value))
  return matched?.value || DEFAULT_EXAM_TYPE
}

function closeUploadDialog(): void {
  uploadDialogVisible.value = false
  pendingContent.value = null
}

async function submitUpload(): Promise<void> {
  if (!uploadForm.value.name.trim()) {
    ElMessage.warning('请输入考纲名称')
    return
  }
  if (!pendingContent.value) {
    ElMessage.warning('请重新选择考纲文件')
    return
  }

  submitting.value = true
  try {
    await uploadSyllabusData({
      name: uploadForm.value.name.trim(),
      examType: uploadForm.value.examType,
      content: pendingContent.value,
    })
    ElMessage.success('考纲上传成功')
    closeUploadDialog()
    await fetchSyllabusList()
  } catch (e: any) {
    ElMessage.error(e?.message || '考纲上传失败')
  } finally {
    submitting.value = false
  }
}

async function viewSyllabus(id: string): Promise<void> {
  try {
    const detail = await getSyllabusDetailData(id)
    detailTitle.value = detail.name
    detailContent.value = detail.content
    detailDialogVisible.value = true
  } catch {
    ElMessage.error('考纲详情加载失败')
  }
}

async function enableSyllabus(item: SyllabusItem): Promise<void> {
  try {
    await enableSyllabusData(item.id)
    ElMessage.success('考纲已启用')
    await fetchSyllabusList()
  } catch (e: any) {
    ElMessage.error(e?.message || '启用失败')
  }
}

async function disableSyllabus(item: SyllabusItem): Promise<void> {
  try {
    await ElMessageBox.confirm(
      '停用后该考试类型的试题库组织树将暂时为空，确认停用？',
      '停用考纲',
      {
        confirmButtonText: '确认停用',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )
  } catch {
    return
  }

  try {
    await disableSyllabusData(item.id)
    ElMessage.success('考纲已停用')
    await fetchSyllabusList()
  } catch (e: any) {
    ElMessage.error(e?.message || '停用失败')
  }
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}
</script>

<style scoped lang="scss">
.syllabus-page {
  min-height: 100%;
}
.page-top-bar {
  padding: 28px 40px 0;
}
.back-btn {
  padding: 8px 12px;
  border: 0;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  font-weight: 600;
}
.page-body {
  padding: 24px 40px 48px;
}
.section-header {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
}
.header-text {
  flex: 1;
}
.section-title {
  margin: 0 0 8px;
  font-size: 24px;
  letter-spacing: 0;
}
.section-desc {
  margin: 0;
  color: #64748b;
}
.file-input {
  display: none;
}
.btn-ghost-action,
.btn-primary-action {
  height: 40px;
  padding: 0 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}
.btn-ghost-action {
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #334155;
}
.btn-primary-action {
  border: 0;
  background: #2563eb;
  color: #fff;
}
.btn-primary-action:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}
.data-card,
.empty-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}
.empty-card {
  padding: 32px;
  color: #64748b;
  text-align: center;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  text-align: left;
  font-size: 14px;
}
th {
  color: #64748b;
  background: #f8fafc;
  font-weight: 700;
}
.name-cell {
  font-weight: 700;
  color: #0f172a;
}
.exam-type-tag,
.status-tag {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 800;
  font-size: 12px;
}
.exam-type-tag {
  background: #ecfeff;
  color: #0e7490;
}
.status-tag {
  background: #f1f5f9;
  color: #64748b;
}
.status-tag--active {
  background: #dcfce7;
  color: #047857;
}
.action-cell {
  white-space: nowrap;
}
.action-link {
  margin-right: 12px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #2563eb;
  cursor: pointer;
  font-weight: 700;
}
.action-link.danger {
  color: #dc2626;
}
.empty-row {
  padding: 36px 16px;
  color: #94a3b8;
  text-align: center;
}
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.32);
}
.modal-panel {
  width: min(520px, 100%);
  max-height: min(720px, 88vh);
  overflow: hidden;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.24);
}
.modal-panel--wide {
  width: min(880px, 100%);
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  border-bottom: 1px solid #e2e8f0;
}
.modal-header h3 {
  margin: 0;
  font-size: 18px;
}
.modal-close {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 8px;
  background: #f1f5f9;
  cursor: pointer;
  font-size: 20px;
}
.form-grid {
  display: grid;
  gap: 16px;
  padding: 20px;
}
.field-label {
  display: grid;
  gap: 8px;
  color: #334155;
  font-weight: 700;
  font-size: 14px;
}
.text-input {
  height: 40px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0 12px;
  color: #0f172a;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px 20px;
}
.json-preview {
  max-height: 620px;
  margin: 0;
  padding: 20px;
  overflow: auto;
  background: #0f172a;
  color: #e2e8f0;
  font-size: 12px;
  line-height: 1.6;
}
@media (max-width: 900px) {
  .section-header {
    flex-direction: column;
  }
  .data-card {
    overflow-x: auto;
  }
}
</style>
