// 统一题目文档与存储映射：内容、判分解析和管理来源分别只有一个权威入口。
import { questionJsonArray } from './questionMeta.js'

export type QuestionDocument = {
  id?: string
  code: string
  content: Record<string, any>
  solution: Record<string, any>
  meta: Record<string, any>
}

// 新格式只接受结构化对象，避免继续隐式兼容字符串 JSON 或旧字段。
export function questionObject(value: unknown, field: string): Record<string, any> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${field} 必须是对象`)
  return value as Record<string, any>
}

// 判分始终读取 solution，缺失或坏答案必须暴露错误，不能静默将所有题判错。
export function getQuestionAnswer(row: { solution: unknown }): string[] {
  const solution = questionObject(row.solution, 'solution')
  if (!Array.isArray(solution.answer) || solution.answer.some((answer) => typeof answer !== 'string')) {
    throw new Error('solution.answer 必须是字符串数组')
  }
  return solution.answer
}

// 学习分析的命名仅在固定旧题卡 DTO 边界转换，物理存储始终使用 solution。
export function solutionToLearningAnalysis(raw: unknown): Record<string, any> {
  const { answer: _answer, correctSolution, examFocus, commonErrorCauses, reviewGuidance, ...extra } = questionObject(raw, 'solution')
  return {
    ...extra,
    ...(correctSolution !== undefined ? { correct_solution: correctSolution } : {}),
    ...(examFocus !== undefined ? { exam_focus: examFocus } : {}),
    ...(commonErrorCauses !== undefined ? { common_error_causes: commonErrorCauses } : {}),
    ...(reviewGuidance !== undefined ? { review_guidance: reviewGuidance } : {}),
  }
}

// 将已经通过导入校验的内部输入构建为唯一存储；来源编号与系统编码分开。
export function buildQuestionStorage(input: Record<string, any>) {
  const blocks = questionJsonArray(input.content_blocks, 'content_blocks')
  const images = questionJsonArray(input.images, 'images')
  for (const block of blocks) {
    if (!block || (block.type !== 'paragraph' && block.type !== 'image_ref')
      || (block.type === 'paragraph' && typeof block.text !== 'string')
      || (block.type === 'image_ref' && typeof block.image_id !== 'string')) throw new Error('content_blocks 包含无效题干块')
  }
  for (const image of images) {
    if (!image || typeof image.id !== 'string'
      || !((image.type === 'svg' && typeof image.svg === 'string') || (image.type === 'image' && typeof image.src === 'string'))) throw new Error('images 包含无效图片')
  }
  const { correct_solution, exam_focus, common_error_causes, review_guidance, ...extra } = questionObject(input.learning_analysis ?? {}, 'learning_analysis')
  if (input.learning_analysis === null) throw new Error('learning_analysis 必须是对象')
  const solution = {
    ...extra,
    answer: questionJsonArray(input.answer, 'answer'),
    ...(correct_solution !== undefined ? { correctSolution: correct_solution } : {}),
    ...(exam_focus !== undefined ? { examFocus: exam_focus } : {}),
    ...(common_error_causes !== undefined ? { commonErrorCauses: common_error_causes } : {}),
    ...(review_guidance !== undefined ? { reviewGuidance: review_guidance } : {}),
  }
  getQuestionAnswer({ solution })
  const source = { ...(input.source || {}) }
  for (const [key, value] of Object.entries({ questionCode: input.sourceQuestionCode ?? input.code, examType: input.source_examType, year: input.year })) {
    if (value !== undefined) source[key] = value
  }
  const meta: Record<string, any> = { ...(input.metaExtensions || {}), source }
  for (const key of ['is_ai_generated', 'origin', 'revision']) if (input[key] !== undefined) meta[key] = input[key]
  return { content: { blocks, options: questionJsonArray(input.options, 'options'), images }, solution, meta }
}

// 数据库索引列聚合进文档，管理字段仅由系统生成，不由导入文件控制。
export function formatQuestionDocument(row: any): QuestionDocument {
  const content = questionObject(row.content, 'content')
  const solution = questionObject(row.solution, 'solution')
  const meta = questionObject(row.meta, 'meta')
  return {
    id: row.id,
    code: row.uniqueCode,
    content: {
      title: row.title, ...content,
      examType: row.examType, questionType: row.questionType, difficulty: row.difficulty,
      subject: row.subject, subjectCode: row.subjectCode, topic: row.topic, topicCode: row.topicCode,
      qualityTier: row.qualityTier, knowledgePoints: row.knowledgePoints,
    },
    solution,
    meta: {
      ...meta,
      source: { ...(meta.source || {}), ...(row.sourceQuestionCode ? { questionCode: row.sourceQuestionCode } : {}) },
      paperId: row.paperId, number: row.number, moduleCode: row.moduleCode,
      moduleOrder: row.moduleOrder, moduleQuestionNumber: row.moduleQuestionNumber,
      status: row.status, importBatchId: row.importBatchId,
      revision: row.replacesQuestionId || row.revisionVersion || row.revisionReason
        ? { ...(meta.revision || {}), replacesQuestionId: row.replacesQuestionId, version: row.revisionVersion, reason: row.revisionReason }
        : meta.revision ?? null,
      createdAt: row.createdAt, updatedAt: row.updatedAt, publishedAt: row.publishedAt, archivedAt: row.archivedAt,
    },
  }
}

// 文档回到公共写入入口时只映射可编辑内容；ID、发布状态和时间不能由上传覆盖。
export function canonicalQuestionToInput(document: QuestionDocument): Record<string, any> {
  const c = questionObject(document.content, 'content')
  const m = questionObject(document.meta, 'meta')
  const source = questionObject(m.source ?? {}, 'meta.source')
  const { paperId: _paperId, number, moduleCode, moduleOrder, moduleQuestionNumber,
    status: _status, importBatchId: _batch, replacesQuestionId: _replaces,
    revisionVersion: _version, revisionReason: _reason, createdAt: _created,
    updatedAt: _updated, publishedAt: _published, archivedAt: _archived, source: _source, ...extensions } = m
  return {
    code: source.questionCode ?? document.code, sourceQuestionCode: source.questionCode ?? null,
    examType: c.examType, title: c.title, content_blocks: c.blocks, options: c.options, images: c.images,
    answer: getQuestionAnswer(document), learning_analysis: solutionToLearningAnalysis(document.solution),
    question_type: c.questionType, difficulty: c.difficulty, qualityTier: c.qualityTier,
    subject: c.subject, subject_code: c.subjectCode, topic: c.topic, topic_code: c.topicCode,
    knowledge_points: c.knowledgePoints, number, module_code: moduleCode,
    module_order: moduleOrder, module_question_number: moduleQuestionNumber,
    source, source_examType: source.examType, year: source.year, metaExtensions: extensions,
  }
}
