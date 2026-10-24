// 物理精选题仅从已审核的年度真题或独立试题库读取，正文始终来自 Question。
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";
import { physicsLearningSources } from "../constants/physicsLearningSources.js";
import type { PhysicsLearningSelection } from "../constants/physicsLearningTypes.js";
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
export function physicsQuestionWhere(
  selection: PhysicsLearningSelection,
): Prisma.QuestionWhereInput {
  if (selection.kind === "bank")
    return {
      uniqueCode: selection.questionCode,
      paperId: null,
      examType: EXAM_TYPE.ESAT,
      subjectCode: ESAT_MODULE_SUBJECT_CODES[ESAT_MODULE.PHYSICS],
      status: QUESTION_STATUS.PUBLISHED,
    };
  if (!Number.isInteger(selection.year))
    throw new Error("精选真题缺少来源年份");
  return {
    sourceQuestionCode: selection.questionCode,
    examType: EXAM_TYPE.ESAT,
    moduleCode: ESAT_MODULE.PHYSICS,
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
export async function getPhysicsLearningExample(sourceCode: string) {
  const selected = Object.hasOwn(physicsLearningSources, sourceCode)
    ? physicsLearningSources[sourceCode]
    : undefined;
  if (!selected) return null;
  const rows = await prisma.question.findMany({
    where: physicsQuestionWhere(selected),
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
          ? `${row.paper!.title} · 物理第 ${row.moduleQuestionNumber} 题`
          : "ESAT 物理试题库",
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
