// 数学 2 精选题仅从已审核的年度真题或独立试题库读取，正文始终来自 Question。
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";
import { mathematics2LearningSources } from "../constants/mathematics2LearningSources.js";
import type { MathematicsLearningSelection } from "../constants/mathematicsLearningTypes.js";
import {
  DIAGNOSTIC_ASSEMBLY,
  ESAT_MODULE,
  ESAT_MODULE_SUBJECT_CODES,
  EXAM_TYPE,
  PAPER_TYPE,
  QUESTION_STATUS,
} from "../constants/domain.js";
import {
  attemptQuestionSelect,
  formatQuestionForAttempt,
} from "../routes/papers-shared.js";

// 年度题随整卷发布；独立题同时限定学科与发布状态，禁止跨题源回退。
export function mathematics2QuestionWhere(
  selection: MathematicsLearningSelection,
): Prisma.QuestionWhereInput {
  if (selection.kind === "bank")
    return {
      uniqueCode: selection.questionCode,
      paperId: null,
      examType: EXAM_TYPE.ESAT,
      subjectCode: ESAT_MODULE_SUBJECT_CODES[ESAT_MODULE.MATHS_2],
      status: QUESTION_STATUS.PUBLISHED,
    };
  if (!Number.isInteger(selection.year))
    throw new Error("精选真题缺少来源年份");
  return {
    sourceQuestionCode: selection.questionCode,
    examType: EXAM_TYPE.ESAT,
    moduleCode: ESAT_MODULE.MATHS_2,
    paper: {
      examType: EXAM_TYPE.ESAT,
      year: selection.year,
      paperType: PAPER_TYPE.REAL_PAPER,
      assemblyType: DIAGNOSTIC_ASSEMBLY.ANNUAL,
      status: QUESTION_STATUS.PUBLISHED,
    },
  };
}

// 同一年度来源必须唯一命中；学生读取只使用无答案投影，来源位置仅展示已核准信息。
export async function getMathematics2LearningExample(sourceCode: string) {
  const selected = Object.hasOwn(mathematics2LearningSources, sourceCode)
    ? mathematics2LearningSources[sourceCode]
    : undefined;
  if (!selected) return null;
  const rows = await prisma.question.findMany({
    where: mathematics2QuestionWhere(selected),
    select: { ...attemptQuestionSelect, paper: { select: { title: true } } },
    orderBy: { id: "asc" },
    take: 2,
  });
  if (rows.length !== 1) return null;
  const row = rows[0]!;
  return {
    sourceCode,
    kind: selected.kind,
    source: {
      collectionLabel:
        selected.kind === "annual"
          ? `${row.paper!.title} · 数学2第 ${row.moduleQuestionNumber} 题`
          : "ESAT 数学2试题库",
      originLabel:
        selected.kind === "annual"
          ? selected.exam && selected.paper && selected.questionNumber
            ? `${selected.year} ${selected.exam} · ${selected.paper} · 第 ${selected.questionNumber} 题`
            : selected.exam
              ? `${selected.year} ${selected.exam}`
              : `${selected.year} 年真题`
          : selected.questionCode,
    },
    question: formatQuestionForAttempt(row),
  };
}
