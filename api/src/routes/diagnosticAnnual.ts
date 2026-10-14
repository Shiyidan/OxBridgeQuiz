// 年度诊断规范校验、导入和导出，权限及响应格式与现有试卷管理保持一致。
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/admin.js'
import { createAsyncRouter } from '../utils/asyncRouter.js'
import { success, fail } from '../utils/response.js'
import { setOperationAuditContext } from '../middleware/operationAudit.js'
import { AnnualDiagnosticError, validateAnnualDocument, importAnnualDocument, exportAnnualDocument } from '../services/annualDiagnostic.js'

export const diagnosticAnnualRouter = createAsyncRouter()

// 年度诊断校验
diagnosticAnnualRouter.post('/diagnostic/validate', requireAuth, requireAdmin, async (req, res) => {
  try {
    const document = validateAnnualDocument(req.body)
    res.json(success({ paper: document.paper, questions: document.questions, modules: document.paper.moduleConfig, questionCount: document.questions.length }))
  } catch (error) {
    if (error instanceof AnnualDiagnosticError) { res.status(422).json(fail(error.message, error.code)); return }
    throw error
  }
})

// 年度诊断导入
diagnosticAnnualRouter.post('/diagnostic/import', requireAuth, requireAdmin, async (req, res) => {
  try {
    const paper = await importAnnualDocument(req.body)
    setOperationAuditContext(req, { resourceId: paper.id, summary: `导入 ${paper.examType} ${paper.year} 年度分科诊断` })
    res.status(201).json(success(paper))
  } catch (error) {
    if (error instanceof AnnualDiagnosticError) { res.status(422).json(fail(error.message, error.code)); return }
    throw error
  }
})

// 年度诊断导出
diagnosticAnnualRouter.get('/:id/document', requireAuth, requireAdmin, async (req, res) => {
  try { res.json(success(await exportAnnualDocument(req.params.id))) }
  catch (error) {
    if (error instanceof AnnualDiagnosticError) { res.status(error.code === 'PAPER_NOT_FOUND' ? 404 : 422).json(fail(error.message, error.code)); return }
    throw error
  }
})
