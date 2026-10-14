<!-- 年度诊断导入：校验统一 JSON 并按科目核对题量后保存年度草稿。 -->
<template>
  <div class="annual-import">
    <el-button text @click="router.push(backPath)">返回真题库</el-button>
    <h2>年度诊断试卷导入</h2>
    <p class="description">
      ESAT 每年五科，TMUA 每年 Paper 1 和 Paper 2。上传年度 JSON，核对各科题量后保存草稿。
    </p>
    <el-upload
      drag
      accept=".json,application/json"
      :auto-upload="false"
      :show-file-list="false"
      :disabled="busy"
      :on-change="handleFileChange"
    >
      <el-icon class="upload-icon"><UploadFilled /></el-icon>
      <div>点击选择或拖入年度 JSON 文件</div>
      <p v-if="fileName" class="description">{{ fileName }}</p>
    </el-upload>
    <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" />
    <el-skeleton v-if="validating" :rows="4" animated />
    <template v-else-if="validation">
      <div class="document-heading">
        <h3>{{ validation.paper.title }}</h3>
        <p>
          {{ validation.paper.examType }} · {{ validation.paper.year }} 年 ·
          {{ validation.questionCount }} 题 ·
          {{ validation.paper.accessTier === 'free' ? '免费' : '会员' }}
        </p>
      </div>
      <AdminDataTable :data="validation.modules" :show-pagination="false">
        <el-table-column prop="subject" label="科目 / 分卷" min-width="180" />
        <el-table-column prop="questionCount" label="题量" width="100" />
        <el-table-column label="作答时长" width="140">
          <template #default="{ row }">{{ row.durationSeconds / 60 }} 分钟</template>
        </el-table-column>
      </AdminDataTable>
      <p class="description">
        导入后为草稿，请预览核对并发布。如果该年已有年度题库，将保存新版本；历史答题记录仍可查看。
      </p>
      <el-button type="primary" :loading="importing" :disabled="busy" @click="saveDocument"
        >保存年度草稿</el-button
      >
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type UploadFile } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import AdminDataTable from '@/components/admin/AdminDataTable.vue'
import {
  validateDiagnosticPaperDocument,
  importDiagnosticPaperDocument,
  type DiagnosticPaperValidation,
} from '@/api/papers'
import { getApiErrorMessage } from '@/utils/request'

const router = useRouter()
const route = useRoute()
const fileName = ref('')
const error = ref('')
const validating = ref(false)
const importing = ref(false)
const validation = ref<DiagnosticPaperValidation | null>(null)
// 读文件、校验和保存期间锁定选择，防止草稿与屏幕摘要不一致。
const busy = computed(() => validating.value || importing.value)
// 返回原考试年份，便于连续维护同一批年度试卷。
const backPath = computed(() => ({
  path: '/admin/core-library/exams',
  query: { examType: route.query.examType, year: route.query.year },
}))

// 文件仅做 JSON 解码，字段及科目规则由唯一的服务端校验器判断。
async function handleFileChange(file: UploadFile): Promise<void> {
  if (!file.raw || busy.value) return
  fileName.value = file.name
  validation.value = null
  error.value = ''
  validating.value = true
  try {
    if (!file.name.toLowerCase().endsWith('.json')) throw new Error('请选择 JSON 文件')
    const document: unknown = JSON.parse(await file.raw.text())
    validation.value = await validateDiagnosticPaperDocument(document)
  } catch (cause) {
    error.value =
      cause instanceof SyntaxError
        ? 'JSON 格式有误，请检查文件内容'
        : getApiErrorMessage(cause, '年度试卷校验失败，请检查文件后重新上传')
  } finally {
    validating.value = false
  }
}

// 使用已经校验的同一份文档创建草稿，成功后进入年度科目管理。
async function saveDocument(): Promise<void> {
  if (!validation.value || busy.value) return
  importing.value = true
  error.value = ''
  try {
    const saved = await importDiagnosticPaperDocument({
      format: 'paper-content-solution-meta-v1',
      paper: validation.value.paper,
      questions: validation.value.questions,
    })
    ElMessage.success('年度草稿已保存，请核对科目内容后发布')
    await router.push({
      path: '/admin/core-library/exams',
      query: { examType: saved.examType, year: saved.year },
    })
  } catch (cause) {
    error.value = getApiErrorMessage(cause, '年度试卷保存失败，请重试')
  } finally {
    importing.value = false
  }
}
</script>

<style scoped lang="scss">
.annual-import {
  max-width: 960px;
  margin: 0 auto;
  padding: 28px 32px;
}
h2,
h3 {
  color: var(--color-ink);
}
.description {
  color: var(--color-ink-muted);
  line-height: 1.7;
  margin: 16px 0;
}
.upload-icon {
  font-size: 36px;
  color: var(--color-ink-muted);
  margin-bottom: 16px;
}
.el-alert,
.el-skeleton {
  margin-top: 20px;
}
.document-heading {
  margin-top: 28px;
}
.document-heading p {
  color: var(--color-ink-soft);
}
</style>
