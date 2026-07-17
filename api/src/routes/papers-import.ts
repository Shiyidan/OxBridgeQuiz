
// 处理管理员 JSON 与 Markdown 试卷导入，并同步正式 Question 数据。
import { Prisma } from '@prisma/client'
import { prisma } from '../services/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/admin.js'
import { success, fail } from '../utils/response.js'
import { syncPaperQuestions, getPaperQuestions, formatQuestionRow } from '../utils/questionSync.js'
import { parseJsonArray, parseJsonField } from '../utils/jsonField.js'
import { createNumericId } from '../utils/id.js'
import { processMarkdownImport, validateStandardPaperDocument } from '../services/markdownValidator.js'
import { checkMemberAccess } from '../services/member.js'
import { createAsyncRouter } from '../utils/asyncRouter.js'
import { setOperationAuditContext } from '../middleware/operationAudit.js'
import { logRuntimeError } from '../utils/runtimeLogger.js'
import {
  EXAM_TYPE,
  QUESTION_BANK_PAPER_TYPES,
  REAL_PAPER_TYPES,
  USER_ROLE,
  isExamType,
  isPaperType,
  isRealPaperType,
  normalizePaperType,
  paperTypeWhereValues,
} from '../constants/domain.js'

import { RawSyllabusNode, FlatSyllabusNode, levelOf, parseSyllabusJson, getSyllabusRoots, normalizeSyllabusNodes, safeParseJson, parsePositiveInt, formatQuestionForAttempt, hasStudentPaperEntitlement, applySyllabusToTree } from './papers-shared.js'
export const paperImportRouter = createAsyncRouter()

paperImportRouter.post('/import-json', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { code } = req.body
    const validated = validateStandardPaperDocument(req.body)
    if (validated.errors.length > 0 || !validated.metadata) {
      res.status(400).json(fail(`校验失败：${validated.errors.map(e => e.message).join('；')}`))
      return
    }
    const { metadata, questions } = validated

    const paper = await prisma.paper.create({
      data: {
        id: createNumericId(),
        title: metadata.paperName,
        year: metadata.year,
        duration: metadata.duration,
        code: code || undefined,
        examType: metadata.examType,
        paperType: metadata.paperType,
        totalQuestions: questions.length,
        status: 'draft',
        questions: [],
      },
    })

    await syncPaperQuestions(paper.id, questions)
    const savedQuestions = await getPaperQuestions(paper.id)

    setOperationAuditContext(req, {
      resourceId: paper.id,
      summary: `导入 JSON 试卷“${paper.title}”`,
    })
    res.json(success({
      ...paper,
      questions: savedQuestions.map(formatQuestionRow),
    }))
  } catch (e: any) {
    logRuntimeError('paper.import_json_failed', e)
    res.status(500).json(fail(e.message || '导入失败'))
  }
})

// Markdown 导入试卷
paperImportRouter.post('/import-markdown', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { markdown, code } = req.body

    if (!markdown || typeof markdown !== 'string') {
      res.status(400).json(fail('请提供 Markdown 内容'))
      return
    }

    const result = processMarkdownImport(markdown)

    if (result.errors.length > 0 || !result.metadata) {
      res.status(400).json(fail(`校验失败：${result.errors.map(e => e.message).join('；')}`))
      return
    }

    if (result.questions.length === 0) {
      res.status(400).json(fail('未能从 Markdown 中提取到有效的题目数据'))
      return
    }

    const paper = await prisma.paper.create({
      data: {
        id: createNumericId(),
        title: result.metadata.paperName,
        year: result.metadata.year,
        duration: result.metadata.duration,
        code: code || undefined,
        examType: result.metadata.examType,
        paperType: result.metadata.paperType,
        totalQuestions: result.questions.length,
        status: 'draft',
        questions: [],
      },
    })

    await syncPaperQuestions(paper.id, result.questions)
    const savedQuestions = await getPaperQuestions(paper.id)

    setOperationAuditContext(req, {
      resourceId: paper.id,
      summary: `导入 Markdown 试卷“${paper.title}”`,
    })
    res.json(success({
      ...paper,
      questions: savedQuestions.map(formatQuestionRow),
      warnings: result.warnings,
    }))
  } catch (e: any) {
    logRuntimeError('paper.import_markdown_failed', e)
    res.status(500).json(fail(e.message || '导入失败'))
  }
})

// 考纲树
