// 为学习平台考法归纳读取已发布年度诊断卷的来源位置，不读取题目或答案。
import { prisma } from './prisma.js'
import { DIAGNOSTIC_ASSEMBLY, ESAT_MODULE, EXAM_TYPE, PAPER_TYPE, QUESTION_STATUS, TMUA_PAPER } from '../constants/domain.js'
import { parseJsonField } from '../utils/jsonField.js'
import { learningPatternExamples } from '../constants/learningPatternExamples.js'
import { attemptQuestionSelect, formatQuestionForAttempt } from '../routes/papers-shared.js'

const moduleLabels: Record<string, string> = {
  [ESAT_MODULE.MATHS_1]: '数学1',
  [ESAT_MODULE.MATHS_2]: '数学2',
  [ESAT_MODULE.PHYSICS]: '物理',
  [ESAT_MODULE.CHEMISTRY]: '化学',
  [ESAT_MODULE.BIOLOGY]: '生物',
  [TMUA_PAPER.PAPER_1]: 'Paper 1',
  [TMUA_PAPER.PAPER_2]: 'Paper 2',
}

// 按来源编号批量查找发布的年度卷，返回各题在平台诊断卷中的实际位置。
export async function getLearningPatternSources(examType: 'ESAT' | 'TMUA', codes: string[]) {
  const rows = await prisma.question.findMany({
    where: {
      examType,
      sourceQuestionCode: { in: codes },
      paper: { examType, paperType: PAPER_TYPE.REAL_PAPER, assemblyType: DIAGNOSTIC_ASSEMBLY.ANNUAL, status: QUESTION_STATUS.PUBLISHED },
    },
    select: { sourceQuestionCode: true, meta: true, moduleCode: true, moduleQuestionNumber: true, paper: { select: { title: true, year: true } } },
    orderBy: [{ paper: { year: 'asc' } }, { moduleQuestionNumber: 'asc' }],
  })
  return rows.flatMap((row) => {
    if (!row.sourceQuestionCode || !row.paper || !row.moduleCode || !row.moduleQuestionNumber) return []
    const label = moduleLabels[row.moduleCode]
    if (!label) return []
    const meta = parseJsonField<{ source?: { examType?: string; year?: number } }>(row.meta, {})
    const sourceExam = meta.source?.examType
    const year = meta.source?.year
    // 年份与考试类型缺失或与年度卷不一致时不推断原卷出处。
    if (!sourceExam || !year || year !== row.paper.year) return []
    return [{ code: row.sourceQuestionCode, origin: `${year} ${sourceExam}`, collection: `${row.paper.title} · ${label}第 ${row.moduleQuestionNumber} 题`, year: row.paper.year, paperTitle: row.paper.title, location: `${label}第 ${row.moduleQuestionNumber} 题`, exampleAvailable: Object.hasOwn(learningPatternExamples, row.sourceQuestionCode) }]
  })
}

// 按审核过的考法题源读取唯一年度题目，题面仍使用作答白名单投影。
export async function getLearningPatternExample(code: string) {
  const selected = Object.hasOwn(learningPatternExamples, code) ? learningPatternExamples[code] : undefined
  if (!selected) return null
  const rows = await prisma.question.findMany({
    where: { sourceQuestionCode: code, examType: selected.examType, moduleCode: selected.moduleCode, paper: { examType: selected.examType, year: selected.year, paperType: PAPER_TYPE.REAL_PAPER, assemblyType: DIAGNOSTIC_ASSEMBLY.ANNUAL, status: QUESTION_STATUS.PUBLISHED } },
    select: { ...attemptQuestionSelect, paper: { select: { title: true, year: true } } },
    take: 2,
  })
  if (rows.length !== 1) return null
  const row = rows[0]!
  const meta = parseJsonField<{ source?: { examType?: string; year?: number } }>(row.meta, {})
  const label = row.moduleCode && moduleLabels[row.moduleCode]
  if (!row.paper || !label || !row.moduleQuestionNumber || !meta.source?.examType || meta.source.year !== row.paper.year) return null
  return {
    sourceCode: code,
    kind: 'annual' as const,
    source: { collectionLabel: `${row.paper.title} · ${label}第 ${row.moduleQuestionNumber} 题`, originLabel: `${row.paper.year} ${meta.source.examType}` },
    question: formatQuestionForAttempt(row),
  }
}
