// 提供 standard2 独立试题的导入、审核、检索、统计与练习选题接口。
import { Prisma } from "@prisma/client";
import { requireAdmin } from "../middleware/admin.js";
import { requireAuth } from "../middleware/auth.js";
import { setOperationAuditContext } from "../middleware/operationAudit.js";
import {
    EXAM_TYPE,
    PRACTICE_SOURCE,
    QUESTION_BANK_DIRECT_PRACTICE_COUNT,
  QUESTION_STATUS,
  TMUA_PAPER,
  isExamType,
  isQuestionStatus,
} from "../constants/domain.js";
import { checkMemberAccess } from "../services/member.js";
import { prisma } from "../services/prisma.js";
import {
  signQuestionBankSelection,
  type QuestionBankPracticeSnapshot,
  type QuestionBankSelectionScopeNode,
} from "../services/questionBankSelection.js";
import {
  QUESTION_BANK_DIFFICULTIES,
  QuestionBankDocumentError,
  parseQuestionBankDocumentText,
  validateQuestionBankDocument,
} from "../services/questionBankDocument.js";
import { createAsyncRouter } from "../utils/asyncRouter.js";
import { formatQuestionRow } from "../utils/questionSync.js";
import { fail, success } from "../utils/response.js";
import {
  attemptQuestionSelect,
  formatQuestionForAttempt,
  parsePositiveInt,
} from "./papers-shared.js";

export const questionLibraryRouter = createAsyncRouter();

type DifficultyCount = Record<
  (typeof QUESTION_BANK_DIFFICULTIES)[number],
  number
>;

type BatchQuestionSummary = {
  status: string;
  examType: string;
  moduleCode: string | null;
  subject: string | null;
  subjectCode: string | null;
};

// 后台列表保留筛选、预览摘要和状态操作所需字段，不读取选项、答案及完整详情列。
const adminQuestionListSelect = {
  id: true,
  uniqueCode: true,
  sourceQuestionCode: true,
  title: true,
  examType: true,
  questionType: true,
  difficulty: true,
  qualityTier: true,
  subject: true,
  subjectCode: true,
  topic: true,
  topicCode: true,
  knowledgePoints: true,
  status: true,
  publishedAt: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
  importBatch: { select: { id: true, title: true } },
} satisfies Prisma.QuestionSelect;

// 各接口共享完整难度键，避免无题难度在响应中缺失。
const emptyDifficultyCount = (): DifficultyCount => ({
  easy: 0,
  medium: 0,
  hard: 0,
  composite: 0,
});

// 批量知识点统计参数兼容逗号分隔和重复 query，并在数据库查询前统一去重。
function parseKnowledgePointCodes(value: unknown): string[] {
  const rawValues = Array.isArray(value) ? value : [value];
  return [
    ...new Set(
      rawValues
        .flatMap((item) => String(item || "").split(","))
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

// 父级考纲筛选先解析成节点 id，题目筛选和统计再通过关联表在数据库中完成。
async function collectDescendantNodeIds(
  code: string,
  examType: string,
): Promise<string[]> {
  if (!code) return [];
  const nodes = await prisma.syllabusNode.findMany({
    where: { examType },
    select: { id: true, code: true, parentCode: true },
  });
  if (!nodes.some((node) => node.code === code)) return [];
  const codes = new Set([code]);
  let expanded = true;
  while (expanded) {
    expanded = false;
    for (const node of nodes) {
      if (
        node.parentCode &&
        codes.has(node.parentCode) &&
        !codes.has(node.code)
      ) {
        codes.add(node.code);
        expanded = true;
      }
    }
  }
  return nodes.filter((node) => codes.has(node.code)).map((node) => node.id);
}

// 临时练习范围由服务端考纲和实际选题生成，随签名凭证冻结后再写入答卷快照。
async function buildDirectPracticeSnapshot(
  examType: string,
  code: string,
  difficulty: string,
  plannedQuestionCount: number,
  rows: Array<{
    subject: string | null;
    subjectCode: string | null;
  }>,
): Promise<QuestionBankPracticeSnapshot> {
  let subject: QuestionBankSelectionScopeNode | null = null;
  let knowledgePoint: QuestionBankPracticeSnapshot["knowledgePoint"] = null;
  if (code) {
    const nodes = await prisma.syllabusNode.findMany({
      where: { examType },
      select: { code: true, label: true, parentCode: true },
    });
    const nodeMap = new Map(nodes.map((node) => [node.code, node]));
    const requestedNode = nodeMap.get(code);
    if (requestedNode) {
      const lineage = [requestedNode];
      const visited = new Set([requestedNode.code]);
      let current = requestedNode.parentCode
        ? nodeMap.get(requestedNode.parentCode)
        : undefined;
      while (current && !visited.has(current.code)) {
        lineage.unshift(current);
        visited.add(current.code);
        current = current.parentCode ? nodeMap.get(current.parentCode) : undefined;
      }
      const scopedLineage =
        lineage.length > 1 && lineage[0]?.parentCode === null
          ? lineage.slice(1)
          : lineage;
      const path = (scopedLineage.length ? scopedLineage : [requestedNode]).map(
        (node) => ({ code: node.code, label: node.label }),
      );
      subject = path[0] || null;
      knowledgePoint = {
        code: requestedNode.code,
        label: requestedNode.label,
        path,
      };
    }
  }

  if (!subject) {
    const subjects = new Map<string, QuestionBankSelectionScopeNode>();
    for (const row of rows) {
      const label = String(row.subject || "").trim();
      if (!label) continue;
      const subjectCode = String(row.subjectCode || label).trim();
      subjects.set(subjectCode, { code: subjectCode, label });
    }
    if (subjects.size === 1) subject = [...subjects.values()][0] || null;
  }

  return {
    source: PRACTICE_SOURCE.DIRECT,
    subject,
    knowledgePoint,
    difficulty: difficulty || null,
    plannedQuestionCount,
    questionCount: rows.length,
  };
}

// 学生端查询只允许命中已发布的独立题目，并按可选考纲节点和难度缩小范围。
async function buildPublishedQuestionWhere(
  query: Record<string, unknown>,
): Promise<Prisma.QuestionWhereInput> {
  const examType = String(query.examType || EXAM_TYPE.TMUA).toUpperCase();
  const code = String(query.code || "").trim();
  const difficulty = String(query.difficulty || "").trim();
  const where: Prisma.QuestionWhereInput = {
    paperId: null,
    status: QUESTION_STATUS.PUBLISHED,
    examType,
  };
  if (difficulty) where.difficulty = difficulty;
  if (code) {
    const nodeIds = await collectDescendantNodeIds(code, examType);
    where.knowledgePointLinks = nodeIds.length
      ? { some: { syllabusNodeId: { in: nodeIds } } }
      : { some: { syllabusNodeId: "__missing__" } };
  }
  return where;
}

// 作答题号只属于本次返回顺序，不写回 Question.number。
function formatAttemptQuestions(rows: any[]): Array<Record<string, unknown>> {
  return rows.map((row, index) => ({
    ...formatQuestionForAttempt(row),
    number: index + 1,
  }));
}

// 管理列表使用普通列和展示快照，避免为列表加载大体积 SVG 与完整解析。
function formatAdminListItem(row: any): Record<string, unknown> {
  return {
    id: row.id,
    code: row.sourceQuestionCode || row.uniqueCode,
    title: row.title,
    examType: row.examType,
    questionType: row.questionType,
    difficulty: row.difficulty,
    qualityTier:
      row.qualityTier === "excellent" || row.qualityTier === "qualified"
        ? row.qualityTier
        : null,
    subject: row.subject,
    subjectCode: row.subjectCode,
    topic: row.topic,
    topicCode: row.topicCode,
    knowledgePoints: row.knowledgePoints,
    status: row.status,
    publishedAt: row.publishedAt,
    archivedAt: row.archivedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    importBatch: row.importBatch,
  };
}

// 上传文件名只保留末级名称，避免把浏览器或客户端路径写入数据库。
function normalizeUploadFileName(value: unknown): string | null {
  const fileName = String(value || "")
    .trim()
    .split(/[\\/]/)
    .pop()
    ?.trim();
  return fileName ? fileName.slice(0, 255) : null;
}

// 上传包状态由包内独立题目的实时状态汇总，不额外制造一套批次发布状态。
function formatImportBatch(row: any): Record<string, unknown> {
  const questions = (row.questions || []) as BatchQuestionSummary[];
  const subjectMap = new Map<
    string,
    { code: string; label: string; examType: string }
  >();
  const partMap = new Map<
    string,
    { code: string; label: string; subjectCode: string | null }
  >();
  const statusCounts = {
    draft: 0,
    published: 0,
    archived: 0,
  };
  for (const question of questions) {
    if (question.status in statusCounts) {
      statusCounts[question.status as keyof typeof statusCounts] += 1;
    }
    if (question.examType !== EXAM_TYPE.TMUA && question.subject) {
      const code = question.subjectCode || question.subject;
      subjectMap.set(`${question.examType}:${code}`, {
        code,
        label: question.subject,
        examType: question.examType,
      });
    }
    if (
      question.examType === EXAM_TYPE.TMUA &&
      (question.moduleCode === TMUA_PAPER.PAPER_1 ||
        question.moduleCode === TMUA_PAPER.PAPER_2)
    ) {
      partMap.set(question.moduleCode, {
        code: question.moduleCode,
        label:
          question.moduleCode === TMUA_PAPER.PAPER_1 ? "Paper 1" : "Paper 2",
        subjectCode: null,
      });
    }
  }
  return {
    id: row.id,
    title: row.title,
    fileName: row.fileName,
    declaredQuestionCount: row.declaredQuestionCount,
    actualQuestionCount: row.actualQuestionCount,
    currentQuestionCount: questions.length,
    remarks: row.remarks,
    createdAt: row.createdAt,
    statusCounts,
    examTypes: [...new Set(questions.map((question) => question.examType))],
    subjects: [...subjectMap.values()].sort((left, right) =>
      left.code.localeCompare(right.code),
    ),
    parts: [...partMap.values()].sort((left, right) =>
      left.code.localeCompare(right.code),
    ),
  };
}

// 学生端概览按数据库 groupBy 汇总难度，不读取完整题目内容。
questionLibraryRouter.get("/summary", async (req, res) => {
  const examType = String(req.query.examType || EXAM_TYPE.TMUA).toUpperCase();
  if (!isExamType(examType)) {
    res.status(422).json(fail("无效的考试类型"));
    return;
  }
  const where = await buildPublishedQuestionWhere(req.query);
  const groups = await prisma.question.groupBy({
    by: ["difficulty"],
    where,
    _count: { _all: true },
  });
  const difficultyCount = emptyDifficultyCount();
  for (const group of groups) {
    if (group.difficulty && group.difficulty in difficultyCount) {
      difficultyCount[group.difficulty as keyof DifficultyCount] =
        group._count._all;
    }
  }
  res.json(
    success({
      total: Object.values(difficultyCount).reduce(
        (sum, count) => sum + count,
        0,
      ),
      difficultyCount,
    }),
  );
});

// 练习本按一批叶子知识点返回各自题量及去重后的可选题目总数。
questionLibraryRouter.get(
  "/knowledge-point-counts",
  requireAuth,
  async (req, res) => {
    const examType = String(req.query.examType || EXAM_TYPE.TMUA).toUpperCase();
    if (!isExamType(examType)) {
      res.status(422).json(fail("无效的考试类型"));
      return;
    }
    const codes = parseKnowledgePointCodes(req.query.codes);
    if (codes.length > 200) {
      res.status(422).json(fail("单次最多统计 200 个知识点"));
      return;
    }
    if (!codes.length) {
      res.json(success({ counts: {}, total: 0 }));
      return;
    }

    const nodes = await prisma.syllabusNode.findMany({
      where: { examType, code: { in: codes } },
      select: { id: true, code: true },
    });
    const nodeIds = nodes.map((node) => node.id);
    const publishedQuestionWhere: Prisma.QuestionWhereInput = {
      paperId: null,
      status: QUESTION_STATUS.PUBLISHED,
      examType,
    };
    const [groups, total] = nodeIds.length
      ? await Promise.all([
          prisma.questionKnowledgePoint.groupBy({
            by: ["syllabusNodeId"],
            where: {
              syllabusNodeId: { in: nodeIds },
              question: publishedQuestionWhere,
            },
            _count: { questionId: true },
          }),
          prisma.question.count({
            where: {
              ...publishedQuestionWhere,
              knowledgePointLinks: {
                some: { syllabusNodeId: { in: nodeIds } },
              },
            },
          }),
        ])
      : [[], 0];
    const countByNodeId = new Map(
      groups.map((group) => [group.syllabusNodeId, group._count.questionId]),
    );
    const counts = Object.fromEntries(
      codes.map((code) => {
        const node = nodes.find((item) => item.code === code);
        return [code, node ? countByNodeId.get(node.id) || 0 : 0];
      }),
    );

    res.json(success({ counts, total }));
  },
);

// 开始练习前只从数据库限量选择候选题，额度最终仍在创建练习的事务内复核。
questionLibraryRouter.get("/selection", requireAuth, async (req, res) => {
  const examType = String(req.query.examType || EXAM_TYPE.TMUA).toUpperCase();
  if (!isExamType(examType)) {
    res.status(422).json(fail("无效的考试类型"));
    return;
  }
  const difficulty = String(req.query.difficulty || "").trim();
  if (difficulty && !QUESTION_BANK_DIFFICULTIES.includes(difficulty as any)) {
    res.status(422).json(fail("无效的难度"));
    return;
  }
  const where = await buildPublishedQuestionWhere(req.query);
  const total = await prisma.question.count({ where });
  const plannedCount = Math.min(total, QUESTION_BANK_DIRECT_PRACTICE_COUNT);
  let take = plannedCount;
  if (plannedCount > 0) {
    const entitlement = await checkMemberAccess(
      req.user!.userId,
      "question-bank",
      examType,
      plannedCount,
    );
    if (!entitlement.allowed) {
      take = Math.min(plannedCount, Math.max(0, entitlement.remaining ?? 0));
      if (take === 0) {
        res
          .status(403)
          .json(
            fail(
              "当前题库额度不足，请开通会员后继续",
              "QUESTION_BANK_ACCESS_DENIED",
            ),
          );
        return;
      }
    }
  }
  const skip = take > 0 ? Math.floor(Math.random() * (total - take + 1)) : 0;
  const rows =
    take > 0
      ? await prisma.question.findMany({
          where,
          orderBy: [{ id: "asc" }],
          skip,
          take,
          select: attemptQuestionSelect,
        })
      : [];
  const selectionToken = rows.length
    ? signQuestionBankSelection(
        req.user!.userId,
        examType,
        rows.map((row) => row.id),
        await buildDirectPracticeSnapshot(
          examType,
          String(req.query.code || "").trim(),
          difficulty,
          plannedCount,
          rows,
        ),
      )
    : null;
  res.json(
    success({ questions: formatAttemptQuestions(rows), total, selectionToken }),
  );
});

// standard2 文件先完成全量校验，再在单个事务内创建批次、题目和考纲关联。
questionLibraryRouter.post(
  "/admin/import",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const fileName = normalizeUploadFileName(req.body?.fileName);
      const raw =
        typeof req.body?.content === "string"
          ? parseQuestionBankDocumentText(req.body.content)
          : req.body?.document;
      const document = validateQuestionBankDocument(raw);
      const result = await prisma.$transaction(async (tx) => {
        const codes = document.questions.map((question) => question.code);
        const duplicate = await tx.question.findFirst({
          where: { uniqueCode: { in: codes } },
          select: { uniqueCode: true },
        });
        if (duplicate) {
          throw new QuestionBankDocumentError([
            `题目 code ${duplicate.uniqueCode} 已存在，整批导入已取消`,
          ]);
        }

        const examTypes = [
          ...new Set(document.questions.map((question) => question.examType)),
        ];
        const syllabusNodes = await tx.syllabusNode.findMany({
          where: { examType: { in: examTypes } },
          select: {
            id: true,
            examType: true,
            code: true,
            label: true,
            parentCode: true,
          },
        });
        const nodeMap = new Map(
          syllabusNodes.map((node) => [`${node.examType}:${node.code}`, node]),
        );
        // 分类层级必须沿当前考试考纲向上找到声明的主题或学科节点。
        const hasAncestor = (
          examType: string,
          nodeCode: string,
          ancestorCode: string,
        ): boolean => {
          let current = nodeMap.get(`${examType}:${nodeCode}`);
          const visited = new Set<string>();
          while (current?.parentCode && !visited.has(current.code)) {
            if (current.parentCode === ancestorCode) return true;
            visited.add(current.code);
            current = nodeMap.get(`${examType}:${current.parentCode}`);
          }
          return false;
        };
        const syllabusIssues: string[] = [];
        for (const question of document.questions) {
          const classification = question.classification;
          const subject = nodeMap.get(
            `${question.examType}:${classification.subjectCode}`,
          );
          const topic = nodeMap.get(
            `${question.examType}:${classification.topicCode}`,
          );
          if (!subject || subject.label !== classification.subject) {
            syllabusIssues.push(
              `${question.code}: subjectCode/subject 与当前 ${question.examType} 考纲不一致`,
            );
          }
          if (!topic || topic.label !== classification.topic) {
            syllabusIssues.push(
              `${question.code}: topicCode/topic 与当前 ${question.examType} 考纲不一致`,
            );
          } else if (
            !hasAncestor(
              question.examType,
              topic.code,
              classification.subjectCode,
            )
          ) {
            syllabusIssues.push(
              `${question.code}: topicCode 不属于所填 subjectCode`,
            );
          }
          for (const point of classification.knowledgePoints) {
            const node = nodeMap.get(`${question.examType}:${point.code}`);
            if (!node || node.label !== point.label) {
              syllabusIssues.push(
                `${question.code}: 知识点 ${point.code}/${point.label} 与当前考纲不一致`,
              );
            } else if (
              !hasAncestor(
                question.examType,
                node.code,
                classification.topicCode,
              )
            ) {
              syllabusIssues.push(
                `${question.code}: 知识点 ${point.code} 不属于所填 topicCode`,
              );
            }
          }
        }
        if (syllabusIssues.length)
          throw new QuestionBankDocumentError(syllabusIssues);

        const batch = await tx.questionImportBatch.create({
          data: {
            title: document.metadata.title,
            fileName,
            declaredQuestionCount: document.metadata.questionCount,
            actualQuestionCount: document.questions.length,
            remarks: document.metadata.remarks || null,
          },
        });
        for (const [questionIndex, question] of document.questions.entries()) {
          const classification = question.classification;
          const created = await tx.question.create({
            data: {
              uniqueCode: question.code,
              sourceQuestionCode: question.code,
              paperId: null,
              importBatchId: batch.id,
              examType: question.examType,
              number: questionIndex + 1,
              moduleCode:
                question.part === TMUA_PAPER.PAPER_1
                  ? TMUA_PAPER.PAPER_1
                  : question.part === TMUA_PAPER.PAPER_2
                    ? TMUA_PAPER.PAPER_2
                    : null,
              title: question.title,
              options: question.options as Prisma.InputJsonValue,
              answer: question.answer as Prisma.InputJsonValue,
              subject: classification.subject,
              subjectCode: classification.subjectCode,
              questionType: question.questionType,
              difficulty: question.difficulty,
              qualityTier: question.qualityTier || null,
              topic: classification.topic,
              topicCode: classification.topicCode,
              knowledgePoints:
                classification.knowledgePoints as unknown as Prisma.InputJsonValue,
              syllabusPoints: [] as Prisma.InputJsonValue,
              attemptPayload: {
                code: question.code,
                content_blocks: question.contentBlocks,
                images: question.images,
              } as Prisma.InputJsonValue,
              meta: {
                code: question.code,
                content_blocks: question.contentBlocks,
                images: question.images,
                learning_analysis: {
                  correct_solution: question.learningAnalysis.correctSolution,
                  exam_focus: question.learningAnalysis.examFocus,
                  common_error_causes:
                    question.learningAnalysis.commonErrorCauses,
                  review_guidance: question.learningAnalysis.reviewGuidance,
                },
                ...(question.qualityTier
                  ? { qualityTier: question.qualityTier }
                  : {}),
                ...(question.origin ? { origin: question.origin } : {}),
              } as Prisma.InputJsonValue,
              status: QUESTION_STATUS.DRAFT,
            },
          });
          await tx.questionKnowledgePoint.createMany({
            data: classification.knowledgePoints.map((point) => ({
              questionId: created.id,
              syllabusNodeId: nodeMap.get(`${question.examType}:${point.code}`)!
                .id,
              role: point.role,
            })),
          });
        }
        return batch;
      });
      setOperationAuditContext(req, {
        resourceId: result.id,
        summary: `导入题库批次“${result.title}”，共 ${result.actualQuestionCount} 题`,
      });
      res.status(201).json(
        success({
          batchId: result.id,
          title: result.title,
          fileName: result.fileName,
          questionCount: result.actualQuestionCount,
          status: QUESTION_STATUS.DRAFT,
        }),
      );
    } catch (error) {
      if (error instanceof QuestionBankDocumentError) {
        res
          .status(422)
          .json(
            fail(error.issues.join("\n"), "QUESTION_BANK_DOCUMENT_INVALID"),
          );
        return;
      }
      throw error;
    }
  },
);

// 后台入口以一次文件导入为上传包，包内题目状态仍保持独立。
questionLibraryRouter.get(
  "/admin/batches",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const page = parsePositiveInt(req.query.page, 1);
    const pageSize = parsePositiveInt(req.query.pageSize, 20, 100);
    const keyword = String(req.query.keyword || "").trim();
    const examType = String(req.query.examType || "")
      .trim()
      .toUpperCase();
    const status = String(req.query.status || "").trim();
    const questionFilter: Prisma.QuestionWhereInput = {
      paperId: null,
      ...(examType ? { examType } : {}),
      ...(status ? { status } : {}),
    };
    const where: Prisma.QuestionImportBatchWhereInput = {
      ...(keyword
        ? {
            OR: [
              { title: { contains: keyword } },
              { fileName: { contains: keyword } },
              { remarks: { contains: keyword } },
            ],
          }
        : {}),
      ...(examType || status ? { questions: { some: questionFilter } } : {}),
    };
    const [total, rows] = await Promise.all([
      prisma.questionImportBatch.count({ where }),
      prisma.questionImportBatch.findMany({
        where,
        include: {
          questions: {
            where: { paperId: null },
            select: {
              status: true,
              examType: true,
              moduleCode: true,
              subject: true,
              subjectCode: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    res.json(
      success({
        list: rows.map(formatImportBatch),
        pagination: { page, pageSize, total },
      }),
    );
  },
);

// 上传包详情只汇总元数据和题目状态，完整题目由包内分页接口单独读取。
questionLibraryRouter.get(
  "/admin/batches/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const row = await prisma.questionImportBatch.findUnique({
      where: { id: req.params.id },
      include: {
        questions: {
          where: { paperId: null },
          select: {
            status: true,
            examType: true,
            moduleCode: true,
            subject: true,
            subjectCode: true,
          },
        },
      },
    });
    if (!row) {
      res.status(404).json(fail("上传包不存在"));
      return;
    }
    res.json(success(formatImportBatch(row)));
  },
);

// 整包查看一次返回完整题目，供后台逐题导航复用前台解析组件，避免逐题请求造成 N+1。
questionLibraryRouter.get(
  "/admin/batches/:id/review",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const batch = await prisma.questionImportBatch.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });
    if (!batch) {
      res.status(404).json(fail("上传包不存在"));
      return;
    }
    const rows = await prisma.question.findMany({
      where: { importBatchId: batch.id, paperId: null },
      include: {
        importBatch: {
          select: {
            id: true,
            title: true,
            fileName: true,
            remarks: true,
            createdAt: true,
          },
        },
      },
      orderBy: [{ number: "asc" }, { id: "asc" }],
    });
    const invalidOrder = rows.some(
      (row) => !Number.isInteger(row.number) || Number(row.number) < 1,
    );
    const orderValues = rows.map((row) => Number(row.number));
    if (invalidOrder || new Set(orderValues).size !== orderValues.length) {
      res
        .status(409)
        .json(
          fail(
            "试题包缺少 standard2 原始题序，请使用原 JSON 重建题序后再查看",
            "QUESTION_BATCH_ORDER_MISSING",
          ),
        );
      return;
    }
    res.json(
      success({
        questions: rows.map((row) => ({
          ...formatAdminListItem(row),
          question: formatQuestionRow(row),
        })),
      }),
    );
  },
);

// 上传包级上线或归档会统一更新包内题目；归档题不再进入新练习，但历史作答关系保持不变。
questionLibraryRouter.put(
  "/admin/batches/:id/status",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const status = req.body?.status;
    if (
      status !== QUESTION_STATUS.PUBLISHED &&
      status !== QUESTION_STATUS.ARCHIVED
    ) {
      res.status(422).json(fail("上传包状态仅允许 published 或 archived"));
      return;
    }
    const batch = await prisma.questionImportBatch.findUnique({
      where: { id: req.params.id },
      select: { id: true, title: true },
    });
    if (!batch) {
      res.status(404).json(fail("上传包不存在"));
      return;
    }
    const questionWhere: Prisma.QuestionWhereInput = {
      importBatchId: batch.id,
      paperId: null,
    };
    const questionCount = await prisma.question.count({ where: questionWhere });
    if (!questionCount) {
      res.status(422).json(fail("上传包内没有可操作的题目"));
      return;
    }
    const updated = await prisma.question.updateMany({
      where: { ...questionWhere, status: { not: status } },
      data: {
        status,
        publishedAt:
          status === QUESTION_STATUS.PUBLISHED ? new Date() : undefined,
        archivedAt: status === QUESTION_STATUS.ARCHIVED ? new Date() : null,
      },
    });
    setOperationAuditContext(req, {
      resourceId: batch.id,
      summary: `${status === QUESTION_STATUS.PUBLISHED ? "上线" : "归档"}试题包“${batch.title}”，共影响 ${updated.count} 题`,
    });
    res.json(
      success({
        id: batch.id,
        status,
        questionCount,
        updatedQuestions: updated.count,
      }),
    );
  },
);

// 仅允许物理删除没有答题和错题历史的上传包，避免破坏学习记录中的题目关联。
questionLibraryRouter.delete(
  "/admin/batches/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const batch = await prisma.questionImportBatch.findUnique({
      where: { id: req.params.id },
      select: { id: true, title: true },
    });
    if (!batch) {
      res.status(404).json(fail("上传包不存在"));
      return;
    }
    const questionWhere: Prisma.QuestionWhereInput = {
      importBatchId: batch.id,
      paperId: null,
    };
    const [questionCount, answerRecordCount, wrongQuestionCount] =
      await Promise.all([
        prisma.question.count({ where: questionWhere }),
        prisma.answerRecord.count({ where: { question: questionWhere } }),
        prisma.wrongQuestionSummary.count({
          where: { question: questionWhere },
        }),
      ]);
    if (answerRecordCount > 0 || wrongQuestionCount > 0) {
      res
        .status(409)
        .json(
          fail(
            "试题包内已有学生作答或错题记录，不能删除；请改为归档",
            "QUESTION_BATCH_HAS_LEARNING_HISTORY",
          ),
        );
      return;
    }

    try {
      await prisma.$transaction([
        prisma.question.deleteMany({ where: questionWhere }),
        prisma.questionImportBatch.delete({ where: { id: batch.id } }),
      ]);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        res
          .status(409)
          .json(
            fail(
              "试题包已产生关联学习数据，不能删除；请刷新列表后改为归档",
              "QUESTION_BATCH_DELETE_CONFLICT",
            ),
          );
        return;
      }
      throw error;
    }
    setOperationAuditContext(req, {
      resourceId: batch.id,
      summary: `删除试题包“${batch.title}”，同时删除 ${questionCount} 题`,
    });
    res.json(success({ id: batch.id, deletedQuestions: questionCount }));
  },
);

// 发布、撤回和归档均作用于单题，发布后才进入学生端查询范围。
questionLibraryRouter.put(
  "/admin/questions/:id/status",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const status = req.body?.status;
    if (!isQuestionStatus(status)) {
      res.status(422).json(fail("状态仅允许 draft、published 或 archived"));
      return;
    }
    const updated = await prisma.question.updateMany({
      where: { id: req.params.id, paperId: null },
      data: {
        status,
        publishedAt:
          status === QUESTION_STATUS.PUBLISHED ? new Date() : undefined,
        archivedAt: status === QUESTION_STATUS.ARCHIVED ? new Date() : null,
      },
    });
    if (!updated.count) {
      res.status(404).json(fail("题目不存在"));
      return;
    }
    setOperationAuditContext(req, {
      resourceId: req.params.id,
      summary: `更新试题库题目状态为 ${status}`,
    });
    res.json(success({ id: req.params.id, status }));
  },
);

// 无答题记录的草稿题可物理删除；有记录的题目必须归档以保持历史结果完整。
questionLibraryRouter.delete(
  "/admin/questions/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const row = await prisma.question.findFirst({
      where: { id: req.params.id, paperId: null },
      select: {
        id: true,
        sourceQuestionCode: true,
        _count: { select: { answerRecords: true } },
      },
    });
    if (!row) {
      res.status(404).json(fail("题目不存在"));
      return;
    }
    if (row._count.answerRecords > 0) {
      res
        .status(409)
        .json(
          fail(
            "题目已有答题记录，不能删除，请改为归档",
            "QUESTION_HAS_ANSWERS",
          ),
        );
      return;
    }
    await prisma.question.delete({ where: { id: row.id } });
    setOperationAuditContext(req, {
      resourceId: row.id,
      summary: `删除试题库题目 ${row.sourceQuestionCode || row.id}`,
    });
    res.json(success({ id: row.id }));
  },
);
