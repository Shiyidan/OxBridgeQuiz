// 学习自测从编辑确认的固定题号读取官方 Question，作答前隔离答案，提交后复用题库解析。
import { prisma } from "./prisma.js";
import { ESAT_MODULE, ESAT_MODULE_SUBJECT_CODES, EXAM_TYPE, QUESTION_STATUS } from "../constants/domain.js";
import { learningSelfCheckSelections } from "../constants/learningSelfChecks.js";
import {
  attemptQuestionSelect,
  formatQuestionForAttempt,
} from "../routes/papers-shared.js";
import { formatQuestionRow } from "../utils/questionSync.js";
import { getQuestionAnswer } from "../utils/questionDocument.js";
import { chemistryLearningSelfChecks } from "../constants/chemistryLearningSelfChecks.js";
import { chemistryQuestionWhere } from "./chemistryLearning.js";
import { mathematicsLearningSelfChecks } from "../constants/mathematicsLearningSelfChecks.js";
import { mathematicsQuestionWhere } from "./mathematicsLearning.js";
import { mathematics2LearningSelfChecks } from "../constants/mathematics2LearningSelfChecks.js";
import { mathematics2QuestionWhere } from "./mathematics2Learning.js";
import { physicsLearningSelfChecks } from "../constants/physicsLearningSelfChecks.js";
import { physicsQuestionWhere } from "./physicsLearning.js";
import { tmuaLearningSelfChecks } from "../constants/tmuaLearning.js";
import { tmuaQuestionWhere } from "./tmuaLearning.js";
import type { Prisma } from "@prisma/client";
import { selfCheckOriginalReplacements } from "../constants/selfCheckOriginalReplacements.js";
import { parseJsonField } from "../utils/jsonField.js";

// 请求仅能选取已审核的知识点映射，不接收客户端指定的任意题号。
function configuredSelectionFor(code: string, examType: string) {
  // 考试类型先隔离白名单，即使误传另一考试的知识点也不会读取题目。
  if (examType === EXAM_TYPE.TMUA) {
    const entry = Object.hasOwn(tmuaLearningSelfChecks, code)
      ? tmuaLearningSelfChecks[code]
      : undefined;
    if (!entry) return undefined;
    const selected = entry.selection;
    return {
      where: selected ? tmuaQuestionWhere(selected) : null,
      reason: selected?.reason || "",
      annual: selected?.kind === "annual",
      sourceLabel:
        selected?.kind === "annual"
          ? `精选真题 · TMUA ${selected.year} ${selected.paper === "paper1" ? "Paper 1" : "Paper 2"}`
          : "精选 TMUA 试题库题目",
    };
  }
  if (examType !== EXAM_TYPE.ESAT) return undefined;
  if (Object.hasOwn(physicsLearningSelfChecks, code)) {
    const selected = physicsLearningSelfChecks[code]!.selection;
    return {
      where: selected ? physicsQuestionWhere(selected) : null,
      reason: selected?.reason || "",
      annual: selected?.kind === "annual",
      sourceLabel: `${selected?.kind === "annual" ? "精选真题" : "精选试题库题目"}${selected?.reason.startsWith("复盘") ? " · 本节例题复盘" : ""}`,
    };
  }
  if (Object.hasOwn(mathematicsLearningSelfChecks, code)) {
    const selected = mathematicsLearningSelfChecks[code]!.selection;
    return {
      where: selected ? mathematicsQuestionWhere(selected) : null,
      reason: selected?.reason || "",
      annual: selected?.kind === "annual",
      sourceLabel: `${selected?.kind === "annual" ? "精选真题" : "精选试题库题目"}${selected?.reason.startsWith("复盘") ? " · 本节例题复盘" : ""}`,
    };
  }
  if (Object.hasOwn(mathematics2LearningSelfChecks, code)) {
    const selected = mathematics2LearningSelfChecks[code]!.selection;
    return {
      where: selected ? mathematics2QuestionWhere(selected) : null,
      reason: selected?.reason || "",
      annual: selected?.kind === "annual",
      sourceLabel: `${selected?.kind === "annual" ? "精选真题" : "精选试题库题目"}${selected?.reason.startsWith("复盘") ? " · 本节例题复盘" : ""}`,
    };
  }
  if (Object.hasOwn(chemistryLearningSelfChecks, code)) {
    const selected = chemistryLearningSelfChecks[code]!.selection;
    return {
      where: selected ? chemistryQuestionWhere(selected) : null,
      reason: selected?.reason || "",
      annual: selected?.kind === "annual",
      sourceLabel: `${selected?.kind === "annual" ? "精选真题" : "精选试题库题目"}${selected?.reason.startsWith("复盘") ? " · 本节例题复盘" : ""}`,
    };
  }
  const selected = Object.hasOwn(learningSelfCheckSelections, code)
    ? learningSelfCheckSelections[code]
    : undefined;
  if (!selected) return undefined;
  return {
    where: selected.questionCode
      ? {
          uniqueCode: selected.questionCode,
          paperId: null,
          examType: EXAM_TYPE.ESAT,
          status: QUESTION_STATUS.PUBLISHED,
        }
      : null,
    reason: selected.reason,
    annual: false,
    sourceLabel: "精选试题库题目",
  };
}

// 原真题与回忆题自测改用相同知识点的自研题，缺失映射时不回退到真题。
function selectionFor(code: string, examType: string) {
  const selected = configuredSelectionFor(code, examType);
  if (!selected || !Object.hasOwn(selfCheckOriginalReplacements, code)) return selected;
  const questionCode = selfCheckOriginalReplacements[code];
  const subjectCodes: Record<string, string> = {
    '11': ESAT_MODULE_SUBJECT_CODES[ESAT_MODULE.MATHS_1],
    '12': ESAT_MODULE_SUBJECT_CODES[ESAT_MODULE.MATHS_2],
    '13': ESAT_MODULE_SUBJECT_CODES[ESAT_MODULE.PHYSICS],
    '14': ESAT_MODULE_SUBJECT_CODES[ESAT_MODULE.CHEMISTRY],
  };
  const subjectCode = examType === EXAM_TYPE.ESAT ? subjectCodes[code.slice(0, 2)] : undefined;
  return {
    where: questionCode ? {
      uniqueCode: questionCode,
      paperId: null,
      examType,
      ...(subjectCode ? { subjectCode } : {}),
      status: QUESTION_STATUS.PUBLISHED,
      knowledgePointLinks: { some: { syllabusNode: { code, examType } } },
    } : null,
    reason: "",
    annual: false,
    sourceLabel: "来自AceMock自研模拟题",
  };
}

// 只有来源标记可确认的自研题才使用自研文案，其余题库题保留中性来源。
function selfCheckSourceLabel(row: { meta: unknown; uniqueCode: string }, fallback: string) {
  const meta = parseJsonField<{ origin?: { type?: string; referenceExamType?: string } }>(row.meta, {});
  const origin = meta.origin;
  if (!/recall/i.test(row.uniqueCode) && (origin?.type === 'ai_generated' || (origin?.type === 'adapted' && origin.referenceExamType === 'ESAT_MOCK'))) {
    return "来自AceMock自研模拟题";
  }
  return fallback;
}

// 年度题必须唯一命中；作答前沿用白名单投影，只有答案核对允许读取 solution。
async function selectedQuestion(
  selected: NonNullable<ReturnType<typeof selectionFor>>,
  questionId?: string,
) {
  if (!selected.where) return null;
  const where: Prisma.QuestionWhereInput = {
    ...selected.where,
    ...(questionId ? { id: questionId } : {}),
  };
  const select = {
    ...attemptQuestionSelect,
    ...(questionId ? { solution: true } : {}),
  };
  if (!selected.annual) return prisma.question.findFirst({ where, select });
  const rows = await prisma.question.findMany({
    where: selected.where,
    select,
    orderBy: { id: "asc" },
    take: 2,
  });
  return rows.length === 1 && (!questionId || rows[0]!.id === questionId)
    ? rows[0]!
    : null;
}

// 只获取正文白名单；固定精选题与原讲义即时自测一样，不创建练习记录。
export async function getLearningSelfCheck(
  code: string,
  examType: string = EXAM_TYPE.ESAT,
) {
  const selected = selectionFor(code, examType);
  if (!selected) return null;
  if (!selected.where)
    return { question: null, message: "该知识点暂未收录合适的自研模拟题。" };
  const row = await selectedQuestion(selected);
  if (!row) return { question: null, message: "本节精选自测题暂不可用。" };
  return {
    question: formatQuestionForAttempt(row),
    message: "",
    sourceLabel: selected.annual ? selected.sourceLabel : selfCheckSourceLabel(row, selected.sourceLabel),
  };
}

// 判分限定当前固定题目和有效选项；收到答案后才读取 solution，始终不写历史或错题记录。
export async function checkLearningSelfCheck(
  code: string,
  questionId: string,
  answer: string,
  examType: string = EXAM_TYPE.ESAT,
) {
  const selected = selectionFor(code, examType);
  if (!selected?.where || !questionId) return null;
  const row = await selectedQuestion(selected, questionId);
  if (!row) return null;
  const question = formatQuestionRow(row);
  if (
    !question.options.some(
      (option: { label: string }) => option.label === answer,
    )
  )
    return null;
  const correct = getQuestionAnswer(row);
  if (correct.length !== 1) throw new Error("精选自测题必须有唯一正确选项");
  const isCorrect = correct[0] === answer;
  return {
    isCorrect,
    reason: selected.reason,
    question: { ...question, selectedAnswer: answer, isCorrect },
  };
}
