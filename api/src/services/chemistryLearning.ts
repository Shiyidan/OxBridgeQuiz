// 化学讲义的固定选题边界：仅从已发布年度真题或独立试题库读取审核通过的题目。
import type { Prisma } from '@prisma/client'
import { prisma } from './prisma.js'
import {
  chemistryLearningSources,
  type ChemistryLearningSelection,
} from '../constants/chemistryLearningSources.js'
import {
  DIAGNOSTIC_ASSEMBLY,
  ESAT_MODULE,
  ESAT_MODULE_SUBJECT_CODES,
  EXAM_TYPE,
  PAPER_TYPE,
  QUESTION_STATUS,
} from '../constants/domain.js'
import { attemptQuestionSelect, formatQuestionForAttempt } from '../routes/papers-shared.js'

// 年度真题随卷发布；独立题必须自身已发布，两类题源不能互相回退。
export function chemistryQuestionWhere(
  selection: ChemistryLearningSelection,
): Prisma.QuestionWhereInput {
  if (selection.kind === 'bank')
    return {
      uniqueCode: selection.questionCode,
      paperId: null,
      examType: EXAM_TYPE.ESAT,
      status: QUESTION_STATUS.PUBLISHED,
      subjectCode: ESAT_MODULE_SUBJECT_CODES[ESAT_MODULE.CHEMISTRY],
    }
  if (!Number.isInteger(selection.year)) throw new Error('精选真题缺少来源年份')
  return {
    sourceQuestionCode: selection.questionCode,
    examType: EXAM_TYPE.ESAT,
    moduleCode: ESAT_MODULE.CHEMISTRY,
    paper: {
      examType: EXAM_TYPE.ESAT,
      year: selection.year,
      paperType: PAPER_TYPE.REAL_PAPER,
      assemblyType: DIAGNOSTIC_ASSEMBLY.ANNUAL,
      status: QUESTION_STATUS.PUBLISHED,
    },
  }
}

// 例题仅开放编辑白名单；重复年度来源停止展示，不能随机选择同编号题。
export async function getChemistryLearningExample(sourceCode: string) {
  const selected = Object.hasOwn(chemistryLearningSources, sourceCode)
    ? chemistryLearningSources[sourceCode]
    : undefined
  if (!selected) return null
  const rows = await prisma.question.findMany({
    where: chemistryQuestionWhere(selected),
    select: { ...attemptQuestionSelect, paper: { select: { title: true } } },
    orderBy: { id: 'asc' },
    take: 2,
  })
  if (rows.length !== 1) return null
  const row = rows[0]!
  return {
    sourceCode,
    kind: selected.kind,
    source: {
      collectionLabel:
        selected.kind === 'annual'
          ? `${row.paper!.title} · 化学第 ${row.moduleQuestionNumber} 题`
          : 'ESAT 化学试题库',
      // 未核准原卷位置时只展示已确认的年份和考试，不把导入编号当原卷题号。
      originLabel:
        selected.kind === 'annual'
          ? selected.exam && selected.paper && selected.questionNumber
            ? `${selected.year} ${selected.exam} · ${selected.paper} · 第 ${selected.questionNumber} 题`
            : selected.exam
              ? `${selected.year} ${selected.exam}`
              : `${selected.year} 年真题`
          : selected.questionCode,
    },
    question: formatQuestionForAttempt(row),
  }
}
