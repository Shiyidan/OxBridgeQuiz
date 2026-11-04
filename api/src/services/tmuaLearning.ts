// TMUA 学习精选题：仅从已发布年度卷或独立题库读取审核通过的题目。
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";
import { tmuaLearningSources } from "../constants/tmuaLearning.js";
import type { MathematicsLearningSelection } from "../constants/mathematicsLearningTypes.js";
import {
  DIAGNOSTIC_ASSEMBLY,
  EXAM_TYPE,
  PAPER_TYPE,
  QUESTION_STATUS,
  TMUA_PAPER,
} from "../constants/domain.js";
import {
  attemptQuestionSelect,
  formatQuestionForAttempt,
} from "../routes/papers-shared.js";

// 年度题以整卷发布为准，独立题以单题发布为准；跨考试、跨卷和重复来源均不能回退。
export function tmuaQuestionWhere(
  selection: MathematicsLearningSelection,
): Prisma.QuestionWhereInput {
  if (selection.kind === "bank") {
    return {
      uniqueCode: selection.questionCode,
      paperId: null,
      examType: EXAM_TYPE.TMUA,
      status: QUESTION_STATUS.PUBLISHED,
    };
  }
  if (
    !Number.isInteger(selection.year) ||
    (selection.paper !== TMUA_PAPER.PAPER_1 &&
      selection.paper !== TMUA_PAPER.PAPER_2)
  ) {
    throw new Error("TMUA 精选真题缺少有效年份或试卷");
  }
  return {
    sourceQuestionCode: selection.questionCode,
    examType: EXAM_TYPE.TMUA,
    moduleCode: selection.paper,
    paper: {
      examType: EXAM_TYPE.TMUA,
      year: selection.year,
      paperType: PAPER_TYPE.REAL_PAPER,
      assemblyType: DIAGNOSTIC_ASSEMBLY.ANNUAL,
      status: QUESTION_STATUS.PUBLISHED,
    },
  };
}

// 只读取无答案的题目投影，并根据已核准的卷别展示真实来源。
export async function getTmuaLearningExample(sourceCode: string) {
  const selected = Object.hasOwn(tmuaLearningSources, sourceCode)
    ? tmuaLearningSources[sourceCode]
    : undefined;
  if (!selected) return null;
  const rows = await prisma.question.findMany({
    where: tmuaQuestionWhere(selected),
    select: { ...attemptQuestionSelect, paper: { select: { title: true } } },
    orderBy: { id: "asc" },
    take: 2,
  });
  if (rows.length !== 1) return null;
  const row = rows[0]!;
  const paperLabel =
    selected.paper === TMUA_PAPER.PAPER_1 ? "Paper 1" : "Paper 2";
  return {
    sourceCode,
    kind: selected.kind,
    source: {
      collectionLabel:
        selected.kind === "annual"
          ? `${row.paper!.title} · ${paperLabel}`
          : "TMUA 试题库",
      originLabel:
        selected.kind === "annual"
          ? `${selected.year} TMUA · ${paperLabel}${row.moduleQuestionNumber ? ` · 第 ${row.moduleQuestionNumber} 题` : ""}`
          : selected.questionCode,
    },
    question: formatQuestionForAttempt(row),
  };
}
