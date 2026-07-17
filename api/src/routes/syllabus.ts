
// 管理考纲版本、启停状态与前台考纲树查询。
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
import { buildOperationAuditChanges, setOperationAuditContext } from '../middleware/operationAudit.js'
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
export const syllabusRouter = createAsyncRouter()

syllabusRouter.get('/syllabus-library', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const items = await prisma.syllabus.findMany({
      select: {
        id: true,
        name: true,
        examType: true,

        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(success(items))
  } catch (e: any) {
    res.status(500).json(fail(e.message || '获取考纲列表失败'))
  }
})

syllabusRouter.post('/syllabus-library', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, examType, content } = req.body
    if (!name || typeof name !== 'string') {
      res.status(400).json(fail('考纲名称不能为空'))
      return
    }
    if (!isExamType(examType)) {
      res.status(422).json(fail('无效的考试类型'))
      return
    }

    const parsed = parseSyllabusJson(content) as Prisma.InputJsonValue
    normalizeSyllabusNodes(parsed)

    const item = await prisma.syllabus.create({
      data: {
        name: name.trim(),
        examType,
        sourceJson: parsed,
      },
      select: {
        id: true,
        name: true,
        examType: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    setOperationAuditContext(req, {
      resourceId: item.id,
      summary: `上传考纲“${item.name}”`,
    })
    res.json(success(item))
  } catch (e: any) {
    res.status(400).json(fail(e.message || '上传考纲失败'))
  }
})

syllabusRouter.get('/syllabus-library/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const item = await prisma.syllabus.findUnique({ where: { id: req.params.id } })
    if (!item) {
      res.status(404).json(fail('考纲不存在'))
      return
    }

    res.json(success({
      id: item.id,
      name: item.name,
      examType: item.examType,
      isActive: item.isActive,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      content: safeParseJson(item.sourceJson),
    }))
  } catch (e: any) {
    res.status(500).json(fail(e.message || '获取考纲详情失败'))
  }
})

syllabusRouter.put('/syllabus-library/:id/enable', requireAuth, requireAdmin, async (req, res) => {
  try {
    const item = await prisma.syllabus.findUnique({ where: { id: req.params.id } })
    if (!item) {
      res.status(404).json(fail('考纲不存在'))
      return
    }

    await applySyllabusToTree(item)
    setOperationAuditContext(req, {
      summary: `启用考纲“${item.name}”`,
      changes: buildOperationAuditChanges(
        { isActive: item.isActive },
        { isActive: true },
      ),
    })
    res.json(success({ id: item.id, isActive: true }))
  } catch (e: any) {
    res.status(400).json(fail(e.message || '启用考纲失败'))
  }
})

syllabusRouter.put('/syllabus-library/:id/disable', requireAuth, requireAdmin, async (req, res) => {
  try {
    const item = await prisma.syllabus.findUnique({ where: { id: req.params.id } })
    if (!item) {
      res.status(404).json(fail('考纲不存在'))
      return
    }

    await prisma.$transaction(async (tx) => {
      await tx.syllabus.update({
        where: { id: item.id },
        data: { isActive: false },
      })
      if (item.isActive) {

        await tx.syllabusNode.deleteMany({ where: { examType: item.examType } })
      }
    })

    setOperationAuditContext(req, {
      summary: `停用考纲“${item.name}”`,
      changes: buildOperationAuditChanges(
        { isActive: item.isActive },
        { isActive: false },
      ),
    })
    res.json(success({ id: item.id, isActive: false }))
  } catch (e: any) {
    res.status(400).json(fail(e.message || '停用考纲失败'))
  }
})

syllabusRouter.get('/syllabus', async (req, res) => {
  try {
    const examType = (req.query.examType as string) || EXAM_TYPE.TMUA
    if (!isExamType(examType)) {
      res.status(422).json(fail('无效的考试类型'))
      return
    }
    const nodes = await prisma.syllabusNode.findMany({
      where: { examType },
      orderBy: { order: 'asc' },
    })
    const nodeMap = new Map<string, any>()
    const roots: any[] = []
    for (const n of nodes) {
      nodeMap.set(n.code, { code: n.code, label: n.label, children: [] })
    }
    for (const n of nodes) {
      const treeNode = nodeMap.get(n.code)!
      if (n.parentCode && nodeMap.has(n.parentCode)) {
        nodeMap.get(n.parentCode)!.children.push(treeNode)
      } else {
        roots.push(treeNode)
      }
    }
    const cleanEmptyChildren = (list: any[]) => {
      for (const item of list) {
        if (item.children.length === 0) delete item.children
        else cleanEmptyChildren(item.children)
      }
    }
    cleanEmptyChildren(roots)

    res.json(success(roots))
  } catch (e: any) {
    res.status(500).json(fail(e.message || '获取考纲失败'))
  }
})
