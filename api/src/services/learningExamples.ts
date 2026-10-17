// 从已发布诊断卷的唯一题目源读取讲义精选真题，保留原卷与组卷两种题号。
import { prisma } from "./prisma.js";
import { biologyLearningSources } from "../constants/biologyLearningSources.js";
import {
  DIAGNOSTIC_ASSEMBLY,
  ESAT_MODULE,
  EXAM_TYPE,
  PAPER_TYPE,
  QUESTION_STATUS,
} from "../constants/domain.js";
import {
  attemptQuestionSelect,
  formatQuestionForAttempt,
} from "../routes/papers-shared.js";
import { parseJsonField } from "../utils/jsonField.js";

// 仅提供经过编辑选定的真题，题目或来源失效时不借用其他试卷的同名题。
export async function getBiologyLearningExample(sourceCode: string) {
  const selected = Object.hasOwn(biologyLearningSources, sourceCode)
    ? biologyLearningSources[sourceCode]
    : undefined;
  if (!selected) return null;
  const rows = await prisma.question.findMany({
    where: {
      sourceQuestionCode: sourceCode,
      examType: EXAM_TYPE.ESAT,
      moduleCode: ESAT_MODULE.BIOLOGY,
      // 年度诊断随整卷发布，Question.status 仅承接独立题库审核，不能据此隐藏已发布真题。
      paper: {
        examType: EXAM_TYPE.ESAT,
        paperType: PAPER_TYPE.REAL_PAPER,
        assemblyType: DIAGNOSTIC_ASSEMBLY.ANNUAL,
        status: QUESTION_STATUS.PUBLISHED,
        year: selected.year,
      },
    },
    select: {
      ...attemptQuestionSelect,
      paper: { select: { title: true, year: true } },
    },
    take: 2,
    orderBy: { id: "asc" },
  });
  if (rows.length !== 1) return null;
  const row = rows[0];
  const meta = parseJsonField<{
    source?: { year?: number; examType?: string };
  }>(row.meta, {});
  if (meta.source?.examType !== "NSAA" || meta.source.year !== selected.year)
    return null;
  return {
    sourceCode,
    source: {
      exam: "NSAA",
      year: selected.year,
      paper: "Section 1 · Part D Biology",
      questionNumber: selected.questionNumber,
      diagnosticTitle: row.paper!.title,
      diagnosticQuestionNumber: row.moduleQuestionNumber,
    },
    question: formatQuestionForAttempt(row),
  };
}
