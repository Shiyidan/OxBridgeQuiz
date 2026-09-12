<!-- 管理端真题 JSON 导入页：校验并预览标准试卷文档。 -->
<template>
  <div class="upload-page">
    <!-- 顶部返回 -->
    <div class="page-top-bar">
      <button class="back-btn" @click="$router.push(uploadBackPath)">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {{ uploadBackLabel }}
      </button>
    </div>

    <div class="page-body">
      <div class="section-header">
        <div class="header-text">
          <h2 class="section-title">真题 JSON 导入</h2>
          <p class="section-desc">上传标准试卷 JSON 文件，校验并预览后导入真题库。</p>
        </div>
      </div>

      <div class="json-import-area">
        <!-- 未选择文件时：上传区 -->
        <div
          v-if="!jsonFile && !jsonImporting && !jsonDone"
          class="drop-zone"
          :class="{ 'drop-zone--active': jsonDragOver }"
          @dragover.prevent="jsonDragOver = true"
          @dragleave.prevent="jsonDragOver = false"
          @drop.prevent="handleJsonDrop"
          @click="triggerJsonFileInput"
        >
          <div class="drop-icon-wrap">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6366f1"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <p class="drop-title">拖拽 JSON 文件到此处</p>
          <p class="drop-hint">或点击此区域选择 .json 文件</p>
          <p class="drop-limit">支持符合题目数据格式的 JSON 文件</p>
        </div>

        <!-- JSON 文件已选择，编辑元数据 -->
        <div v-if="jsonFile && !jsonImporting && !jsonDone && !jsonError" class="json-edit-area">
          <div class="file-preview" style="text-align: center; margin-bottom: 20px">
            <div class="file-icon-wrap">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4f46e5"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <p class="file-name-text">{{ jsonFile.name }}</p>
            <button class="btn-change" @click="clearJsonFile">重新选择</button>
          </div>

          <label class="field-label">试卷名称</label>
          <input v-model="jsonTitle" class="field-input" placeholder="输入试卷名称..." />

          <div class="meta-row">
            <div class="meta-field">
              <label class="field-label">考试类型</label>
              <select
                v-model="jsonExamType"
                class="field-input field-input--sm"
                :disabled="jsonUsesSectionSchema"
              >
                <option v-for="item in examTypeOptions" :key="item.value" :value="item.value">
                  {{ item.label }}
                </option>
              </select>
            </div>
            <div class="meta-field">
              <label class="field-label">年份</label>
              <input
                v-model.number="jsonYear"
                type="number"
                class="field-input field-input--sm"
                :disabled="jsonUsesSectionSchema"
              />
            </div>
            <div class="meta-field">
              <label class="field-label">考试时长（分钟）</label>
              <input
                v-model.number="jsonDuration"
                type="number"
                class="field-input field-input--sm"
                :disabled="jsonUsesSectionSchema"
              />
              <p v-if="jsonUsesSectionSchema" class="field-hint">按考试分段规则自动计算</p>
            </div>
          </div>

          <div class="meta-row" style="margin-top: 12px">
            <div class="meta-field">
              <label class="field-label">
                {{ jsonUsesSectionSchema ? '套卷代码' : '套卷代码（可选）' }}
              </label>
              <input
                v-model="jsonCode"
                class="field-input field-input--sm"
                placeholder="如 ESAT-EQUIV-2023-M1-CHE-M2 或 TMUA-2023"
              />
              <p class="field-hint">用于识别整套试卷及报告展示，不代表学科</p>
            </div>
            <div class="meta-field">
              <label class="field-label">访问级别</label>
              <select v-model="jsonAccessTier" class="field-input field-input--sm">
                <option v-for="item in accessTierOptions" :key="item.value" :value="item.value">
                  {{ item.label }}
                </option>
              </select>
              <p class="field-hint">免费卷可不限次数重测</p>
            </div>
            <div class="meta-field" style="display: flex; align-items: flex-end">
              <span style="font-size: 0.875rem; color: #475569"
                >共 <b>{{ jsonQuestions.length }}</b> 道题目</span
              >
            </div>
          </div>

          <!-- 题目预览列表 -->
          <div v-if="jsonModules.length" class="module-preview">
            <span v-for="module in jsonModules" :key="module.code">
              <b>{{ module.subject }}</b> · {{ module.count }} 题 · {{ module.duration }} 分钟
            </span>
          </div>
          <div class="json-preview-list" v-if="jsonQuestions.length">
            <p class="field-label" style="margin-top: 16px">题目预览</p>
            <div class="json-preview-item" v-for="q in jsonQuestions" :key="questionPreviewKey(q)">
              <span class="json-preview-num">{{
                q.module_question_number || q.number
              }}</span>
              <span v-if="q.subject" class="json-preview-module">{{ q.subject }}</span>
              <span class="json-preview-title">{{ truncateText(q.title, 60) }}</span>
              <span class="json-preview-opts">{{ q.options.length }} 个选项</span>
            </div>
          </div>

          <div class="action-bar">
            <button class="btn-secondary-action" @click="clearJsonFile">取消</button>
            <button
              class="btn-primary-action"
              @click="importJson"
              :disabled="!jsonTitle || !jsonYear"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="16 4 20 4 20 8" />
                <line x1="14" y1="10" x2="20" y2="4" />
                <path d="M22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" />
              </svg>
              导入到真题库
            </button>
          </div>
        </div>

        <!-- 导入中 -->
        <div v-if="jsonImporting" class="parsing-status">
          <div class="parsing-spinner"></div>
          <p class="parsing-title">正在导入...</p>
        </div>

        <!-- 导入失败 -->
        <div v-if="jsonError" class="parsing-status">
          <p class="parsing-title">导入失败</p>
          <p class="parsing-detail error-text">{{ jsonError }}</p>
          <div style="margin-top: 16px">
            <button class="btn-secondary-action" @click="clearJsonFile">重新选择</button>
          </div>
        </div>

        <!-- 导入成功 -->
        <div v-if="jsonDone && jsonPaperId" class="result-actions">
          <button class="btn-primary-action" @click="goToJsonPreview">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            查看导入结果
          </button>
          <button class="btn-secondary-action" @click="resetJsonImport">导入新试卷</button>
        </div>
      </div>
    </div>

    <input
      ref="jsonFileInput"
      type="file"
      accept=".json,application/json"
      class="hidden-input"
      @change="handleJsonFileSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { importJson as apiImportJson } from '@/api/paperImport'
import { ElMessage } from 'element-plus'
import { DEFAULT_EXAM_TYPE, EXAM_TYPE_OPTIONS, type ExamType } from '@/constants/examTypes'
import {
  PAPER_ACCESS_TIER,
  PAPER_ACCESS_TIER_OPTIONS,
  PAPER_TYPE,
  type PaperAccessTier,
} from '@/constants/paperTypes'
import type { PaperMetadata, ProjectQuestionInput, QuestionInput, StandardPaperJson } from '@/types'
import { getApiErrorMessage } from '@/utils/request'

const router = useRouter()
const route = useRoute()

const isQuestionBankSource = computed(() => route.query.source === 'questions')
const uploadBackPath = computed(() =>
  isQuestionBankSource.value ? '/admin/core-library/questions' : '/admin/core-library/exams',
)
const uploadBackLabel = computed(() =>
  isQuestionBankSource.value ? '返回试题库管理' : '返回真题库列表',
)

const jsonFileInput = ref<HTMLInputElement | null>(null)
const examTypeOptions = EXAM_TYPE_OPTIONS
const accessTierOptions = PAPER_ACCESS_TIER_OPTIONS

// JSON 导入状态
const jsonDragOver = ref(false)
const jsonFile = ref<File | null>(null)
const jsonTitle = ref('')
const jsonExamType = ref(DEFAULT_EXAM_TYPE)
const jsonYear = ref(new Date().getFullYear())
const jsonDuration = ref(75)
const jsonCode = ref('')
const jsonAccessTier = ref<PaperAccessTier>(PAPER_ACCESS_TIER.MEMBER)
const jsonMetadata = ref<PaperMetadata | null>(null)
const jsonQuestions = ref<QuestionInput[]>([])
const jsonDocument = ref<StandardPaperJson | null>(null)
const jsonModules = ref<Array<{ code: string; subject: string; duration: number; count: number }>>(
  [],
)
const jsonUsesSectionSchema = ref(false)
const jsonImporting = ref(false)
const jsonDone = ref(false)
const jsonError = ref('')
const jsonPaperId = ref('')


function truncateText(text: string, maxLen: number): string {
  if (!text) return ''
  const cleaned = text.replace(/\[\[(BS|NL|PARA|FIG)\]\]/g, ' ')
  return cleaned.length > maxLen ? cleaned.slice(0, maxLen) + '...' : cleaned
}

function normalizeExamType(value: unknown): ExamType {
  return EXAM_TYPE_OPTIONS.some((item) => item.value === value)
    ? (value as ExamType)
    : DEFAULT_EXAM_TYPE
}

function isPaperTypeValue(value: unknown): value is PaperMetadata['paperType'] {
  return Object.values(PAPER_TYPE).includes(value as PaperMetadata['paperType'])
}

const SECTION_PREVIEW_PROFILES: Record<
  string,
  { subject: string; duration: number; sectionType: 'paper' | 'subject' }
> = {
  paper1: {
    subject: 'Paper 1: Applications of Mathematical Knowledge',
    duration: 75,
    sectionType: 'paper',
  },
  paper2: {
    subject: 'Paper 2: Mathematical Reasoning',
    duration: 75,
    sectionType: 'paper',
  },
  maths1: { subject: 'Mathematics 1', duration: 40, sectionType: 'subject' },
  maths2: { subject: 'Mathematics 2', duration: 40, sectionType: 'subject' },
  physics: { subject: 'Physics', duration: 40, sectionType: 'subject' },
  chemistry: { subject: 'Chemistry', duration: 40, sectionType: 'subject' },
  biology: { subject: 'Biology', duration: 40, sectionType: 'subject' },
}

interface PreviewDocumentMetadata {
  code?: unknown
  title?: unknown
  paperName?: unknown
  year?: unknown
  duration?: unknown
  examType?: unknown
  paperType?: unknown
  accessTier?: unknown
  deliveryMode?: unknown
  totalQuestions?: unknown
  assemblyType?: unknown
  remarks?: unknown
}

interface PreviewModuleRow extends Record<string, unknown> {
  code?: unknown
  module_code?: unknown
  sectionType?: unknown
  order?: unknown
  subject?: unknown
  subject_code?: unknown
  duration?: unknown
  questions?: unknown[]
  items?: unknown[]
}

interface PreviewPaperDocument {
  metadata?: PreviewDocumentMetadata
  sections?: PreviewModuleRow[]
  modules?: PreviewModuleRow[]
  questions?: unknown[]
}

// 新版 sections 文档不携带计时字段，上传页仅按后端同一考试规则展示派生值。
function isSectionPaperDocument(
  raw: unknown,
): raw is PreviewPaperDocument & { sections: PreviewModuleRow[] } {
  return Boolean(
    raw && typeof raw === 'object' && Array.isArray((raw as { sections?: unknown }).sections),
  )
}

// JSON 预览边界先收窄为可检查的文档外形，字段合法性由后续标准校验逐项确认。
function toPreviewPaperDocument(raw: unknown): PreviewPaperDocument | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  return raw as PreviewPaperDocument
}

// 上传预览统一转为页面现有题目模型，正式入库仍由后端完成同一字段归一化和校验。
function normalizeProjectQuestionForPreview(
  question: ProjectQuestionInput,
  metadata: { examType?: string },
): QuestionInput {
  const classification = question?.classification
  const source = question?.source
  const learningAnalysis = question?.learningAnalysis
  return {
    ...question,
    content_blocks: Array.isArray(question?.contentBlocks)
      ? question.contentBlocks.map((block) =>
          block?.type === 'paragraph'
            ? { ...block, inline: block.align === 'center' ? false : true }
            : block,
        )
      : [],
    question_type: question?.questionType,
    subject: classification?.subject,
    subject_code: classification?.subjectCode,
    topic: classification?.topic,
    topic_code: classification?.topicCode,
    knowledge_points: Array.isArray(classification?.knowledgePoints)
      ? classification.knowledgePoints
      : [],
    examType: metadata?.examType,
    source_examType: source?.examType,
    year: source?.year,
    learning_analysis: learningAnalysis
      ? {
          correct_solution: learningAnalysis.correctSolution,
          exam_focus: learningAnalysis.examFocus,
          common_error_causes: learningAnalysis.commonErrorCauses,
          review_guidance: learningAnalysis.reviewGuidance,
        }
      : undefined,
  } as QuestionInput
}

// 页面编辑表单沿用统一元数据视图；新版文档缺省的时长和题量由 sections 规则派生。
function readStandardMetadata(raw: unknown): PaperMetadata | null {
  const document = toPreviewPaperDocument(raw)
  const metadata = document?.metadata
  if (!metadata || typeof metadata !== 'object') return null
  if (isSectionPaperDocument(document)) {
    if (!metadata.code || typeof metadata.code !== 'string') return null
    if (!metadata.title || typeof metadata.title !== 'string') return null
    if (typeof metadata.year !== 'number') return null
    if (metadata.examType !== 'TMUA' && metadata.examType !== 'ESAT') return null
    if (!isPaperTypeValue(metadata.paperType)) return null
    if (metadata.deliveryMode !== 'section_sequence') return null
    const expectedSectionCount = metadata.examType === 'TMUA' ? 2 : 3
    if (document.sections.length !== expectedSectionCount) return null
    const seenCodes = new Set<string>()
    const seenOrders = new Set<number>()
    const sectionRows = document.sections
    const validSections = sectionRows.every((section, index) => {
      const profile = SECTION_PREVIEW_PROFILES[String(section?.code)]
      const tmuaOrderIsValid =
        metadata.examType !== 'TMUA' ||
        (section?.code === (index === 0 ? 'paper1' : 'paper2') && section?.order === index + 1)
      const sectionQuestionCount = Array.isArray(section.questions) ? section.questions.length : 0
      const questionCountIsValid =
        metadata.examType === 'TMUA' ? sectionQuestionCount === 20 : sectionQuestionCount > 0
      const sectionCode = String(section?.code || '')
      const sectionOrder = Number(section?.order)
      const hasUniqueIdentity = !seenCodes.has(sectionCode) && !seenOrders.has(sectionOrder)
      seenCodes.add(sectionCode)
      seenOrders.add(sectionOrder)
      if (!profile) return false
      return (
        profile.sectionType === section?.sectionType &&
        Number.isInteger(section?.order) &&
        sectionOrder > 0 &&
        tmuaOrderIsValid &&
        hasUniqueIdentity &&
        Array.isArray(section?.questions) &&
        questionCountIsValid
      )
    })
    if (!validSections) return null
    if (metadata.examType === 'ESAT' && !seenCodes.has('maths1')) return null
    const totalQuestions = sectionRows.reduce(
      (sum: number, section) =>
        sum + (Array.isArray(section?.questions) ? section.questions.length : 0),
      0,
    )
    const duration = sectionRows.reduce(
      (sum: number, section) =>
        sum + (SECTION_PREVIEW_PROFILES[String(section?.code)]?.duration || 0),
      0,
    )
    return {
      paperName: metadata.title,
      year: metadata.year,
      duration,
      examType: metadata.examType,
      paperType: metadata.paperType,
      accessTier:
        metadata.accessTier === PAPER_ACCESS_TIER.FREE
          ? PAPER_ACCESS_TIER.FREE
          : PAPER_ACCESS_TIER.MEMBER,
      totalQuestions,
      deliveryMode: 'section_sequence',
      assemblyType: typeof metadata.assemblyType === 'string' ? metadata.assemblyType : undefined,
      remarks: typeof metadata.remarks === 'string' ? metadata.remarks : undefined,
    }
  }
  if (!metadata.paperName || typeof metadata.paperName !== 'string') return null
  if (typeof metadata.year !== 'number') return null
  if (typeof metadata.duration !== 'number') return null
  if (!EXAM_TYPE_OPTIONS.some((item) => item.value === metadata.examType)) return null
  if (!isPaperTypeValue(metadata.paperType)) return null
  if (typeof metadata.totalQuestions !== 'number') return null
  return metadata as PaperMetadata
}

// 上传预览接受新版 sections，并兼容 modules[].questions、modules[].items 和扁平 questions。
function readPaperDocumentPreview(raw: unknown): {
  metadata: PaperMetadata
  questions: QuestionInput[]
  modules: Array<{ code: string; subject: string; duration: number; count: number }>
  isSectionSchema: boolean
} | null {
  const document = toPreviewPaperDocument(raw)
  if (!document) return null
  const metadata = readStandardMetadata(document)
  if (!metadata) return null

  const isSectionSchema = isSectionPaperDocument(document)
  const rawModuleRows = isSectionSchema
    ? document.sections
    : Array.isArray(document.modules)
      ? document.modules
      : Array.isArray(document.questions) &&
          document.questions.length > 0 &&
          document.questions.every(
            (item) =>
              Boolean(item) &&
              typeof item === 'object' &&
              Array.isArray((item as PreviewModuleRow).items),
          )
        ? (document.questions as PreviewModuleRow[])
        : null
  const moduleRows =
    rawModuleRows?.map((module) => ({
      ...module,
      questions: Array.isArray(module.questions)
        ? module.questions
        : Array.isArray(module.items)
          ? module.items
          : [],
    })) || null

  if (moduleRows) {
    const modules = moduleRows.map((module, moduleIndex: number) => ({
      code: String(
        module.code ||
          module.module_code ||
          module.subject ||
          `module-${moduleIndex + 1}`,
      ),
      subject: String(
        module.subject ||
          SECTION_PREVIEW_PROFILES[String(module.code)]?.subject ||
          `Module ${moduleIndex + 1}`,
      ),
      duration:
        Number(module.duration) || SECTION_PREVIEW_PROFILES[String(module.code)]?.duration || 0,
      count: Array.isArray(module.questions) ? module.questions.length : 0,
    }))
    const questions = moduleRows.flatMap((module, moduleIndex: number) => {
      const moduleQuestions = module.questions as QuestionInput[]
      const moduleCode = String(module.code || module.module_code || '') as QuestionInput['module_code']
      const moduleSubject = typeof module.subject === 'string' ? module.subject : undefined
      const moduleSubjectCode =
        typeof module.subject_code === 'string' || typeof module.subject_code === 'number'
          ? module.subject_code
          : ''
      return moduleQuestions.map((rawQuestion, itemIndex: number) => {
        const question = isSectionSchema
          ? normalizeProjectQuestionForPreview(
              rawQuestion as unknown as ProjectQuestionInput,
              metadata,
            )
          : rawQuestion
        return {
          ...question,
          number: questionsBeforeModule(moduleRows, moduleIndex) + itemIndex + 1,
          module_code: moduleCode,
          module_order: Number(module.order) || moduleIndex + 1,
          module_question_number: rawQuestion.number || itemIndex + 1,
          subject: question.subject || moduleSubject,
          subject_code: question.subject_code || moduleSubjectCode,
        }
      })
    })
    if (metadata.totalQuestions !== questions.length) return null
    return { metadata, questions, modules, isSectionSchema }
  }

  if (!Array.isArray(document.questions) || metadata.totalQuestions !== document.questions.length)
    return null
  return {
    metadata,
    questions: document.questions as QuestionInput[],
    modules: [],
    isSectionSchema: false,
  }
}

// Paper 1/2 内题号都会从 1 开始，预览列表使用稳定 code 避免重复 Vue key。
function questionPreviewKey(question: QuestionInput): string {
  return (
    question.code ||
    `${question.module_code || 'flat'}-${question.module_question_number || question.number}`
  )
}

function questionsBeforeModule(modules: PreviewModuleRow[], targetIndex: number): number {
  return modules
    .slice(0, targetIndex)
    .reduce(
      (sum, module) =>
        sum +
        (Array.isArray(module?.questions)
          ? module.questions.length
          : Array.isArray(module?.items)
            ? module.items.length
            : 0),
      0,
    )
}

function previewPathForPaperType(id: string, paperType?: PaperMetadata['paperType']): string {
  return paperType === PAPER_TYPE.AI_PAPER
    ? `/admin/core-library/questions/${id}`
    : `/admin/core-library/exams/${id}`
}

// ---- JSON 导入逻辑 ----

function triggerJsonFileInput(): void {
  jsonFileInput.value?.click()
}

function handleJsonDrop(e: DragEvent): void {
  jsonDragOver.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) processJsonFile(f)
}

function handleJsonFileSelect(e: Event): void {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) processJsonFile(f)
}

function processJsonFile(f: File): void {
  if (!f.name.endsWith('.json') && f.type !== 'application/json') {
    ElMessage.warning('仅支持 .json 文件')
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const raw = JSON.parse(reader.result as string)
      const preview = readPaperDocumentPreview(raw)
      if (!preview) {
        ElMessage.warning('JSON 必须使用新版 sections 或受支持的历史试卷结构')
        return
      }

      jsonMetadata.value = preview.metadata
      jsonQuestions.value = preview.questions
      jsonModules.value = preview.modules
      jsonUsesSectionSchema.value = preview.isSectionSchema
      jsonDocument.value = raw as StandardPaperJson
      jsonTitle.value = preview.metadata.paperName
      jsonExamType.value = normalizeExamType(preview.metadata.examType)
      jsonYear.value = preview.metadata.year
      jsonDuration.value = preview.metadata.duration
      jsonCode.value = raw.metadata?.code || raw.code || ''
      jsonAccessTier.value =
        preview.metadata.accessTier === PAPER_ACCESS_TIER.FREE
          ? PAPER_ACCESS_TIER.FREE
          : PAPER_ACCESS_TIER.MEMBER
      jsonFile.value = f
      jsonError.value = ''
    } catch {
      ElMessage.error('JSON 格式解析失败，请检查文件内容')
    }
  }
  reader.readAsText(f)
}

function clearJsonFile(): void {
  jsonFile.value = null
  jsonTitle.value = ''
  jsonExamType.value = DEFAULT_EXAM_TYPE
  jsonYear.value = new Date().getFullYear()
  jsonDuration.value = 75
  jsonCode.value = ''
  jsonAccessTier.value = PAPER_ACCESS_TIER.MEMBER
  jsonMetadata.value = null
  jsonQuestions.value = []
  jsonDocument.value = null
  jsonModules.value = []
  jsonUsesSectionSchema.value = false
  jsonError.value = ''
  jsonDone.value = false
  jsonPaperId.value = ''
}

function resetJsonImport(): void {
  clearJsonFile()
  jsonImporting.value = false
}

async function importJson(): Promise<void> {
  if (!jsonMetadata.value || !jsonDocument.value) {
    ElMessage.warning('请先选择标准 JSON 文件')
    return
  }
  if (!jsonTitle.value.trim()) {
    ElMessage.warning('请填写试卷名称')
    return
  }
  if (!jsonQuestions.value.length) {
    ElMessage.warning('没有可导入的题目')
    return
  }

  jsonImporting.value = true
  jsonError.value = ''

  try {
    const metadata = buildEditedMetadata(
      jsonMetadata.value,
      jsonTitle.value,
      jsonExamType.value,
      jsonYear.value,
      jsonDuration.value,
      jsonAccessTier.value,
    )
    const editedDocument = buildEditedPaperDocument(jsonDocument.value, metadata, jsonCode.value)
    const res = await apiImportJson(editedDocument)
    jsonMetadata.value = metadata
    jsonPaperId.value = res.id
    jsonDone.value = true
    if (res.warnings?.length) {
      ElMessage.warning(res.warnings.join('；'))
    }
  } catch (e: unknown) {
    jsonError.value = getApiErrorMessage(e, '导入失败')
  } finally {
    jsonImporting.value = false
  }
}

function goToJsonPreview(): void {
  router.push(previewPathForPaperType(jsonPaperId.value, jsonMetadata.value?.paperType))
}

function buildEditedMetadata(
  metadata: PaperMetadata,
  paperName: string,
  examType: ExamType,
  year: number,
  duration: number,
  accessTier: PaperAccessTier,
): PaperMetadata {
  return {
    ...metadata,
    paperName: paperName.trim(),
    examType,
    year: Number(year),
    duration: Number(duration),
    accessTier,
  }
}

// 新版文档只回写它声明的元数据字段，避免把 duration 等考试规则重新塞入上传 JSON。
function buildEditedPaperDocument(
  document: StandardPaperJson,
  metadata: PaperMetadata,
  code: string,
): StandardPaperJson {
  if ('sections' in document && Array.isArray(document.sections)) {
    return {
      ...document,
      metadata: {
        ...document.metadata,
        code: code.trim() || document.metadata.code,
        title: metadata.paperName,
        examType: metadata.examType,
        year: metadata.year,
        paperType: metadata.paperType,
        accessTier: metadata.accessTier,
      },
    } as StandardPaperJson
  }
  return {
    ...document,
    ...(code.trim() ? { code: code.trim() } : {}),
    metadata,
  } as StandardPaperJson
}

</script>

<style scoped lang="scss">
.upload-page {
  min-height: 100%;
}

.page-top-bar {
  padding: 28px 40px 0;
}
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  background: transparent;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.15s ease;
  svg {
    width: 16px;
    height: 16px;
  }
  &:hover {
    color: #0f172a;
    background: #f1f5f9;
  }
}

.page-body {
  padding: 24px 40px 48px;
}

.section-header {
  margin-bottom: 32px;
}
.header-text {
  max-width: 520px;
}
.section-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
  margin: 0 0 8px;
}
.section-desc {
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0;
}

.drop-zone {
  border: 2px dashed #e2e8f0;
  border-radius: 16px;
  padding: 52px 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #ffffff;

  &:hover {
    border-color: #c7d2fe;
    background: #fafaff;
  }
  &--active {
    border-color: #4f46e5;
    background: #eef2ff;
  }
}

.drop-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: #eef2ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  svg {
    width: 28px;
    height: 28px;
  }
}

.drop-title {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 6px;
}
.drop-hint {
  font-size: 0.875rem;
  color: #94a3b8;
  margin: 0 0 6px;
}
.drop-limit {
  font-size: 0.75rem;
  color: #cbd5e1;
  margin: 0;
}

.file-preview {
  text-align: center;
}
.file-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: #eef2ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  svg {
    width: 28px;
    height: 28px;
  }
}
.file-name-text {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 4px;
  word-break: break-all;
}
.btn-change {
  background: none;
  border: none;
  color: #4f46e5;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 6px;
  &:hover {
    background: #eef2ff;
  }
}

.parsing-status {
  text-align: center;
}
.parsing-spinner {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin: 0 auto 16px;
  border: 4px solid #eef2ff;
  border-top-color: #4f46e5;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.parsing-title {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 6px;
}
.parsing-detail {
  font-size: 0.875rem;
  color: #94a3b8;
  margin: 0;
}
.parsing-detail.error-text {
  color: #ef4444;
}

.field-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 6px;
}
.field-hint {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 4px 0 0;
}

.field-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.9rem;
  color: #0f172a;
  outline: none;
  font-family: inherit;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  &::placeholder {
    color: #cbd5e1;
  }
  &:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
  &--sm {
    width: 100%;
  }
}

.meta-row {
  display: flex;
  gap: 16px;
  margin-top: 16px;
}
.meta-field {
  flex: 1;
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.btn-primary-action {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 22px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  svg {
    width: 16px;
    height: 16px;
  }
  &:hover:not(:disabled) {
    background: #6366f1;
    box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
    transform: translateY(-1px);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-secondary-action {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 22px;
  background: #ffffff;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  svg {
    width: 16px;
    height: 16px;
  }
  &:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }
}

.result-actions {
  display: flex;
  gap: 12px;
}
.hidden-input {
  display: none;
}

.json-import-area {
  max-width: 620px;
}
.json-edit-area {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
}
.json-preview-list {
  max-height: 280px;
  overflow-y: auto;
  margin-top: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}
.module-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}
.module-preview span {
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  color: #64748b;
  font-size: 0.75rem;
}
.json-preview-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.8125rem;
  &:last-child {
    border-bottom: none;
  }
}
.json-preview-num {
  min-width: 28px;
  height: 24px;
  border-radius: 6px;
  background: #eef2ff;
  color: #4f46e5;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
}
.json-preview-title {
  flex: 1;
  color: #334155;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.json-preview-module {
  min-width: 86px;
  color: #6366f1;
  font-size: 0.75rem;
  font-weight: 600;
}
.json-preview-opts {
  color: #94a3b8;
  font-size: 0.75rem;
  white-space: nowrap;
}
</style>
