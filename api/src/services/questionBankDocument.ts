// 校验并归一化 standard2 试题库批量导入文档，供独立题库导入接口使用。

export const QUESTION_BANK_DIFFICULTIES = [
  "easy",
  "medium",
  "hard",
  "composite",
] as const;
export const QUESTION_BANK_ORIGIN_TYPES = [
  "manual",
  "ai_generated",
  "adapted",
] as const;
export const QUESTION_BANK_QUALITY_TIERS = ["qualified", "excellent"] as const;

type Difficulty = (typeof QUESTION_BANK_DIFFICULTIES)[number];
type OriginType = (typeof QUESTION_BANK_ORIGIN_TYPES)[number];
type QualityTier = (typeof QUESTION_BANK_QUALITY_TIERS)[number];
type QuestionBankPart = "part1" | "part2";

export type QuestionBankContentBlock =
  | { type: "paragraph"; text: string; align?: "center" }
  | { type: "image_ref"; image_id: string; alt: string };

export type QuestionBankImage =
  | { id: string; type: "svg"; svg: string; alt: string }
  | { id: string; type: "image"; src: string; alt: string };

export interface QuestionBankKnowledgePoint {
  code: string;
  label: string;
  role: "primary" | "secondary";
}

export interface QuestionBankQuestionInput {
  code: string;
  examType: "ESAT" | "TMUA" | "STEP";
  part?: QuestionBankPart;
  title: string;
  contentBlocks: QuestionBankContentBlock[];
  options: Array<{ label: string; text: string; image_id?: string }>;
  answer: [string];
  images: QuestionBankImage[];
  questionType: "single_choice";
  difficulty: Difficulty;
  qualityTier?: QualityTier;
  classification: {
    subject: string;
    subjectCode: string;
    topic: string;
    topicCode: string;
    knowledgePoints: QuestionBankKnowledgePoint[];
  };
  learningAnalysis: {
    correctSolution: string;
    examFocus: string;
    commonErrorCauses: string[];
    reviewGuidance: string;
  };
  origin?: {
    type: OriginType;
    referenceExamType?: string;
    referenceYear?: number;
    referenceQuestionCode?: string;
  };
}

export interface QuestionBankDocument {
  metadata: {
    title: string;
    questionCount: number;
    remarks?: string;
  };
  questions: QuestionBankQuestionInput[];
}

export class QuestionBankDocumentError extends Error {
  constructor(readonly issues: string[]) {
    super(issues[0] || "试题库文档不符合 standard2 规范");
  }
}

const EXAM_TYPES = new Set(["ESAT", "TMUA", "STEP"]);
const DIFFICULTIES = new Set<string>(QUESTION_BANK_DIFFICULTIES);
const ORIGIN_TYPES = new Set<string>(QUESTION_BANK_ORIGIN_TYPES);
const QUALITY_TIERS = new Set<string>(QUESTION_BANK_QUALITY_TIERS);
const CONTROL_OR_REPLACEMENT = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFD]/;
const CHINESE_CHARACTER = /[\u3400-\u9FFF]/;

// 对象结构必须精确匹配 standard2，防止试卷字段、系统字段或调试字段混入数据库。
function assertKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  required: readonly string[],
  path: string,
  issues: string[],
): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key))
      issues.push(`${path}.${key} 不是 standard2 定义的字段`);
  }
  for (const key of required) {
    if (!(key in value)) issues.push(`${path}.${key} 为必填字段`);
  }
}

// JSON 数组和 null 不属于 standard2 中的对象节点。
function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

// 所有必填文本统一去除首尾空白并拦截控制字符。
function nonEmptyString(
  value: unknown,
  path: string,
  issues: string[],
): string {
  if (typeof value !== "string" || !value.trim()) {
    issues.push(`${path} 必须是非空字符串`);
    return "";
  }
  if (CONTROL_OR_REPLACEMENT.test(value))
    issues.push(`${path} 包含乱码或控制字符`);
  return value.trim();
}

// 学生可见解析至少包含一个正常中文字符。
function chineseText(value: unknown, path: string, issues: string[]): string {
  const text = nonEmptyString(value, path, issues);
  if (text && !CHINESE_CHARACTER.test(text))
    issues.push(`${path} 必须提供可展示的中文内容`);
  return text;
}

// 内联 SVG 禁止脚本、事件和外部资源，并要求稳定 viewBox。
function validateSvg(value: unknown, path: string, issues: string[]): string {
  const svg = nonEmptyString(value, path, issues);
  if (!/^<svg\b/i.test(svg) || !/\bviewBox\s*=\s*["'][^"']+["']/i.test(svg)) {
    issues.push(`${path} 必须是包含 viewBox 的完整 SVG`);
  }
  if (/<\/?(?:script|style|foreignObject|iframe|object|embed)\b/i.test(svg)) {
    issues.push(`${path} 包含不允许的 SVG 元素`);
  }
  if (
    /\son[a-z]+\s*=|javascript:|\b(?:href|xlink:href)\s*=\s*["'](?:https?:|data:|\/\/)/i.test(
      svg,
    )
  ) {
    issues.push(`${path} 包含不安全的事件或外部资源引用`);
  }
  return svg;
}

// 位图仅允许约定资源目录或 HTTPS 地址，拒绝本机和临时协议。
function validateImageSource(
  value: unknown,
  path: string,
  issues: string[],
): string {
  const src = nonEmptyString(value, path, issues);
  const isRelative = /^(?:\.\/)?(?:images|assets)\/[A-Za-z0-9_./-]+$/.test(src);
  const isControlledHttps =
    /^https:\/\/[A-Za-z0-9.-]+\/[A-Za-z0-9_?&=%./-]+$/.test(src);
  if (src && !isRelative && !isControlledHttps) {
    issues.push(`${path} 只允许 images/assets 相对路径或 HTTPS 地址`);
  }
  return src;
}

// 单题校验同时检查字段白名单、图片引用、答案和分类内部一致性。
function validateQuestion(
  raw: unknown,
  index: number,
  issues: string[],
): QuestionBankQuestionInput {
  const path = `questions[${index}]`;
  if (!isObject(raw)) {
    issues.push(`${path} 必须是对象`);
    return {} as QuestionBankQuestionInput;
  }
  assertKeys(
    raw,
    [
      "code",
      "examType",
      "part",
      "title",
      "contentBlocks",
      "options",
      "answer",
      "images",
      "questionType",
      "difficulty",
      "qualityTier",
      "classification",
      "learningAnalysis",
      "origin",
    ],
    [
      "code",
      "examType",
      "title",
      "contentBlocks",
      "options",
      "answer",
      "images",
      "questionType",
      "difficulty",
      "classification",
      "learningAnalysis",
    ],
    path,
    issues,
  );

  const code = nonEmptyString(raw.code, `${path}.code`, issues);
  if (code && !/^[A-Z0-9]+(?:-[A-Z0-9]+)+$/.test(code)) {
    issues.push(`${path}.code 只能包含大写英文字母、数字和连字符`);
  }
  const examType = nonEmptyString(raw.examType, `${path}.examType`, issues);
  if (!EXAM_TYPES.has(examType))
    issues.push(`${path}.examType 仅允许 ESAT、TMUA 或 STEP`);
  let part: QuestionBankPart | undefined;
  if (examType === "TMUA") {
    const partValue = nonEmptyString(raw.part, `${path}.part`, issues);
    if (partValue && partValue !== "part1" && partValue !== "part2") {
      issues.push(`${path}.part 在 TMUA 题目中仅允许 part1 或 part2`);
    }
    part = partValue === "part2" ? "part2" : "part1";
  } else if (raw.part !== undefined) {
    issues.push(`${path}.part 仅允许用于 TMUA 题目`);
  }
  const title = nonEmptyString(raw.title, `${path}.title`, issues);

  const imageIds = new Set<string>();
  const images: QuestionBankImage[] = [];
  if (!Array.isArray(raw.images)) {
    issues.push(`${path}.images 必须是数组，无图片时使用空数组`);
  } else {
    raw.images.forEach((item, imageIndex) => {
      const imagePath = `${path}.images[${imageIndex}]`;
      if (!isObject(item)) {
        issues.push(`${imagePath} 必须是对象`);
        return;
      }
      const type = nonEmptyString(item.type, `${imagePath}.type`, issues);
      const allowed =
        type === "svg"
          ? ["id", "type", "svg", "alt"]
          : ["id", "type", "src", "alt"];
      const required = type === "svg" ? allowed : allowed;
      assertKeys(item, allowed, required, imagePath, issues);
      const id = nonEmptyString(item.id, `${imagePath}.id`, issues);
      if (imageIds.has(id)) issues.push(`${imagePath}.id 在同一道题内重复`);
      imageIds.add(id);
      const alt = nonEmptyString(item.alt, `${imagePath}.alt`, issues);
      if (type === "svg") {
        images.push({
          id,
          type: "svg",
          svg: validateSvg(item.svg, `${imagePath}.svg`, issues),
          alt,
        });
      } else if (type === "image") {
        images.push({
          id,
          type: "image",
          src: validateImageSource(item.src, `${imagePath}.src`, issues),
          alt,
        });
      } else {
        issues.push(`${imagePath}.type 仅允许 svg 或 image`);
      }
    });
  }

  const contentBlocks: QuestionBankContentBlock[] = [];
  if (!Array.isArray(raw.contentBlocks) || raw.contentBlocks.length === 0) {
    issues.push(`${path}.contentBlocks 必须是非空数组`);
  } else {
    raw.contentBlocks.forEach((item, blockIndex) => {
      const blockPath = `${path}.contentBlocks[${blockIndex}]`;
      if (!isObject(item)) {
        issues.push(`${blockPath} 必须是对象`);
        return;
      }
      if (item.type === "paragraph") {
        assertKeys(
          item,
          ["type", "text", "align"],
          ["type", "text"],
          blockPath,
          issues,
        );
        const text = nonEmptyString(item.text, `${blockPath}.text`, issues);
        if (item.align !== undefined && item.align !== "center") {
          issues.push(`${blockPath}.align 仅允许 center`);
        }
        contentBlocks.push({
          type: "paragraph",
          text,
          ...(item.align === "center" ? { align: "center" as const } : {}),
        });
      } else if (item.type === "image_ref") {
        assertKeys(
          item,
          ["type", "image_id", "alt"],
          ["type", "image_id", "alt"],
          blockPath,
          issues,
        );
        const imageId = nonEmptyString(
          item.image_id,
          `${blockPath}.image_id`,
          issues,
        );
        if (!imageIds.has(imageId))
          issues.push(`${blockPath}.image_id 未匹配 images 中的资源`);
        contentBlocks.push({
          type: "image_ref",
          image_id: imageId,
          alt: nonEmptyString(item.alt, `${blockPath}.alt`, issues),
        });
      } else {
        issues.push(`${blockPath}.type 仅允许 paragraph 或 image_ref`);
      }
    });
  }
  if (contentBlocks[0]?.type !== "paragraph") {
    issues.push(`${path}.contentBlocks 第一项必须是 paragraph`);
  } else if (contentBlocks[0].text !== title) {
    issues.push(`${path}.title 必须与第一个 paragraph 的 text 完全一致`);
  }

  const optionLabels = new Set<string>();
  const options: QuestionBankQuestionInput["options"] = [];
  if (!Array.isArray(raw.options) || raw.options.length < 2) {
    issues.push(`${path}.options 必须至少包含两个选项`);
  } else {
    raw.options.forEach((item, optionIndex) => {
      const optionPath = `${path}.options[${optionIndex}]`;
      if (!isObject(item)) {
        issues.push(`${optionPath} 必须是对象`);
        return;
      }
      assertKeys(
        item,
        ["label", "text", "image_id"],
        ["label", "text"],
        optionPath,
        issues,
      );
      const label = nonEmptyString(item.label, `${optionPath}.label`, issues);
      if (!/^[A-Z]$/.test(label))
        issues.push(`${optionPath}.label 必须是单个大写英文字母`);
      if (optionLabels.has(label))
        issues.push(`${optionPath}.label 在同一道题内重复`);
      optionLabels.add(label);
      if (typeof item.text !== "string")
        issues.push(`${optionPath}.text 必须存在且为字符串`);
      const text = typeof item.text === "string" ? item.text : "";
      const imageId =
        item.image_id === undefined
          ? undefined
          : nonEmptyString(item.image_id, `${optionPath}.image_id`, issues);
      if (imageId && !imageIds.has(imageId))
        issues.push(`${optionPath}.image_id 未匹配 images 中的资源`);
      if (!text.trim() && !imageId)
        issues.push(`${optionPath} 必须提供文字或图片`);
      options.push({ label, text, ...(imageId ? { image_id: imageId } : {}) });
    });
  }

  let answer: [string] = [""];
  if (
    !Array.isArray(raw.answer) ||
    raw.answer.length !== 1 ||
    typeof raw.answer[0] !== "string"
  ) {
    issues.push(`${path}.answer 必须是只含一个选项标签的数组`);
  } else {
    answer = [raw.answer[0]];
    if (!optionLabels.has(answer[0]))
      issues.push(`${path}.answer 未匹配 options 中的标签`);
  }
  if (raw.questionType !== "single_choice")
    issues.push(`${path}.questionType 当前只能为 single_choice`);
  const difficulty = nonEmptyString(
    raw.difficulty,
    `${path}.difficulty`,
    issues,
  );
  if (!DIFFICULTIES.has(difficulty))
    issues.push(`${path}.difficulty 不在允许范围内`);
  let qualityTier: QualityTier | undefined;
  if (raw.qualityTier !== undefined) {
    const qualityTierValue = nonEmptyString(
      raw.qualityTier,
      `${path}.qualityTier`,
      issues,
    );
    if (!QUALITY_TIERS.has(qualityTierValue)) {
      issues.push(`${path}.qualityTier 仅允许 qualified 或 excellent`);
    } else {
      qualityTier = qualityTierValue as QualityTier;
    }
  }

  const classificationPath = `${path}.classification`;
  const classification = isObject(raw.classification) ? raw.classification : {};
  if (!isObject(raw.classification))
    issues.push(`${classificationPath} 必须是对象`);
  assertKeys(
    classification,
    ["subject", "subjectCode", "topic", "topicCode", "knowledgePoints"],
    ["subject", "subjectCode", "topic", "topicCode", "knowledgePoints"],
    classificationPath,
    issues,
  );
  const knowledgePoints: QuestionBankKnowledgePoint[] = [];
  if (
    !Array.isArray(classification.knowledgePoints) ||
    classification.knowledgePoints.length === 0
  ) {
    issues.push(`${classificationPath}.knowledgePoints 必须是非空数组`);
  } else {
    const pointCodes = new Set<string>();
    classification.knowledgePoints.forEach((item, pointIndex) => {
      const pointPath = `${classificationPath}.knowledgePoints[${pointIndex}]`;
      if (!isObject(item)) {
        issues.push(`${pointPath} 必须是对象`);
        return;
      }
      assertKeys(
        item,
        ["code", "label", "role"],
        ["code", "label", "role"],
        pointPath,
        issues,
      );
      const pointCode = nonEmptyString(item.code, `${pointPath}.code`, issues);
      if (pointCodes.has(pointCode))
        issues.push(`${pointPath}.code 在同一道题内重复`);
      pointCodes.add(pointCode);
      const role = nonEmptyString(item.role, `${pointPath}.role`, issues);
      if (role !== "primary" && role !== "secondary")
        issues.push(`${pointPath}.role 仅允许 primary 或 secondary`);
      knowledgePoints.push({
        code: pointCode,
        label: nonEmptyString(item.label, `${pointPath}.label`, issues),
        role: role === "secondary" ? "secondary" : "primary",
      });
    });
  }
  if (!knowledgePoints.some((point) => point.role === "primary")) {
    issues.push(`${classificationPath}.knowledgePoints 至少包含一个 primary`);
  }

  const analysisPath = `${path}.learningAnalysis`;
  const analysis = isObject(raw.learningAnalysis) ? raw.learningAnalysis : {};
  if (!isObject(raw.learningAnalysis))
    issues.push(`${analysisPath} 必须是对象`);
  assertKeys(
    analysis,
    ["correctSolution", "examFocus", "commonErrorCauses", "reviewGuidance"],
    ["correctSolution", "examFocus", "commonErrorCauses", "reviewGuidance"],
    analysisPath,
    issues,
  );
  const commonErrorCauses = Array.isArray(analysis.commonErrorCauses)
    ? analysis.commonErrorCauses.map((item, causeIndex) =>
        chineseText(
          item,
          `${analysisPath}.commonErrorCauses[${causeIndex}]`,
          issues,
        ),
      )
    : [];
  if (
    !Array.isArray(analysis.commonErrorCauses) ||
    commonErrorCauses.length === 0
  ) {
    issues.push(`${analysisPath}.commonErrorCauses 必须至少包含一项中文说明`);
  }

  let origin: QuestionBankQuestionInput["origin"];
  if (raw.origin !== undefined) {
    const originPath = `${path}.origin`;
    if (!isObject(raw.origin)) {
      issues.push(`${originPath} 必须是对象`);
    } else {
      const type = nonEmptyString(
        raw.origin.type,
        `${originPath}.type`,
        issues,
      );
      const adapted = type === "adapted";
      assertKeys(
        raw.origin,
        ["type", "referenceExamType", "referenceYear", "referenceQuestionCode"],
        adapted
          ? [
              "type",
              "referenceExamType",
              "referenceYear",
              "referenceQuestionCode",
            ]
          : ["type"],
        originPath,
        issues,
      );
      if (!ORIGIN_TYPES.has(type))
        issues.push(`${originPath}.type 不在允许范围内`);
      if (
        !adapted &&
        Object.keys(raw.origin).some((key) => key.startsWith("reference"))
      ) {
        issues.push(`${originPath} 只有 adapted 可以填写 reference 字段`);
      }
      const referenceYear = raw.origin.referenceYear;
      if (
        adapted &&
        (!Number.isInteger(referenceYear) || Number(referenceYear) < 1900)
      ) {
        issues.push(`${originPath}.referenceYear 必须是有效年份`);
      }
      origin = {
        type: ORIGIN_TYPES.has(type) ? (type as OriginType) : "manual",
        ...(adapted
          ? {
              referenceExamType: nonEmptyString(
                raw.origin.referenceExamType,
                `${originPath}.referenceExamType`,
                issues,
              ),
              referenceYear: Number(referenceYear),
              referenceQuestionCode: nonEmptyString(
                raw.origin.referenceQuestionCode,
                `${originPath}.referenceQuestionCode`,
                issues,
              ),
            }
          : {}),
      };
    }
  }

  return {
    code,
    examType: (EXAM_TYPES.has(examType)
      ? examType
      : "TMUA") as QuestionBankQuestionInput["examType"],
    ...(part ? { part } : {}),
    title,
    contentBlocks,
    options,
    answer,
    images,
    questionType: "single_choice",
    difficulty: (DIFFICULTIES.has(difficulty)
      ? difficulty
      : "medium") as Difficulty,
    ...(qualityTier ? { qualityTier } : {}),
    classification: {
      subject: nonEmptyString(
        classification.subject,
        `${classificationPath}.subject`,
        issues,
      ),
      subjectCode: nonEmptyString(
        classification.subjectCode,
        `${classificationPath}.subjectCode`,
        issues,
      ),
      topic: nonEmptyString(
        classification.topic,
        `${classificationPath}.topic`,
        issues,
      ),
      topicCode: nonEmptyString(
        classification.topicCode,
        `${classificationPath}.topicCode`,
        issues,
      ),
      knowledgePoints,
    },
    learningAnalysis: {
      correctSolution: chineseText(
        analysis.correctSolution,
        `${analysisPath}.correctSolution`,
        issues,
      ),
      examFocus: chineseText(
        analysis.examFocus,
        `${analysisPath}.examFocus`,
        issues,
      ),
      commonErrorCauses,
      reviewGuidance: chineseText(
        analysis.reviewGuidance,
        `${analysisPath}.reviewGuidance`,
        issues,
      ),
    },
    ...(origin ? { origin } : {}),
  };
}

// JSON-in-Markdown 只读取首个 fenced json 代码块，正文不参与结构推断。
export function parseQuestionBankDocumentText(content: string): unknown {
  const text = content.replace(/^\uFEFF/, "").trim();
  if (!text) throw new QuestionBankDocumentError(["上传文件不能为空"]);
  const jsonText = text.startsWith("{")
    ? text
    : /(```|~~~)json\s*([\s\S]*?)\1/i.exec(text)?.[2];
  if (!jsonText)
    throw new QuestionBankDocumentError([
      "Markdown 中未找到 fenced json 代码块",
    ]);
  try {
    return JSON.parse(jsonText);
  } catch (error) {
    throw new QuestionBankDocumentError([
      `JSON 解析失败：${error instanceof Error ? error.message : "格式错误"}`,
    ]);
  }
}

// 完整文件先通过结构、交叉引用和批次数量校验，再允许进入数据库事务。
export function validateQuestionBankDocument(
  raw: unknown,
): QuestionBankDocument {
  const issues: string[] = [];
  if (!isObject(raw)) throw new QuestionBankDocumentError(["根节点必须是对象"]);
  assertKeys(
    raw,
    ["metadata", "questions"],
    ["metadata", "questions"],
    "root",
    issues,
  );

  const metadata = isObject(raw.metadata) ? raw.metadata : {};
  if (!isObject(raw.metadata)) issues.push("metadata 必须是对象");
  assertKeys(
    metadata,
    ["title", "questionCount", "remarks"],
    ["title", "questionCount"],
    "metadata",
    issues,
  );
  const title = nonEmptyString(metadata.title, "metadata.title", issues);
  const questionCount = metadata.questionCount;
  if (!Number.isInteger(questionCount) || Number(questionCount) < 1) {
    issues.push("metadata.questionCount 必须是正整数");
  }
  const remarks =
    metadata.remarks === undefined
      ? undefined
      : nonEmptyString(metadata.remarks, "metadata.remarks", issues);

  const questions = Array.isArray(raw.questions)
    ? raw.questions.map((question, index) =>
        validateQuestion(question, index, issues),
      )
    : [];
  if (!Array.isArray(raw.questions) || questions.length === 0)
    issues.push("questions 必须是非空数组");
  if (Number.isInteger(questionCount) && questionCount !== questions.length) {
    issues.push(
      `metadata.questionCount=${questionCount} 与 questions.length=${questions.length} 不一致`,
    );
  }
  const codes = new Set<string>();
  questions.forEach((question, index) => {
    if (codes.has(question.code))
      issues.push(`questions[${index}].code 在本批次内重复`);
    codes.add(question.code);
  });

  if (issues.length) throw new QuestionBankDocumentError(issues);
  return {
    metadata: {
      title,
      questionCount: Number(questionCount),
      ...(remarks ? { remarks } : {}),
    },
    questions,
  };
}
