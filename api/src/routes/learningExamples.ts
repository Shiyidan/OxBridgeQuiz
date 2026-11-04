// 学习平台精选真题入口，不创建答卷、不消耗练习权益、不下发整份诊断卷。
import { optionalAuth } from "../middleware/auth.js";
import { createAsyncRouter } from "../utils/asyncRouter.js";
import { fail, success } from "../utils/response.js";
import { getBiologyLearningExample } from "../services/learningExamples.js";
import { learningSelfCheckRouter } from "./learningSelfCheck.js";
import { getChemistryLearningExample } from "../services/chemistryLearning.js";
import { getMathematicsLearningExample } from "../services/mathematicsLearning.js";
import { getMathematics2LearningExample } from "../services/mathematics2Learning.js";
import { getPhysicsLearningExample } from "../services/physicsLearning.js";
import { getTmuaLearningExample } from "../services/tmuaLearning.js";
import { prisma } from "../services/prisma.js";
import { getQuestionAnswer, solutionToLearningAnalysis } from "../utils/questionDocument.js";
import { learningExampleAnalysisSources } from "../constants/learningExampleAnalysisSources.js";
import { getLearningPatternExample, getLearningPatternSources } from "../services/learningPatternSources.js";
import { learningPatternExamples } from "../constants/learningPatternExamples.js";

export const learningExamplesRouter = createAsyncRouter();
learningExamplesRouter.use(learningSelfCheckRouter);

// 考法来源只返回已发布年度诊断卷的位置，不向学生下发题目解析。
learningExamplesRouter.post("/pattern-sources", optionalAuth, async (req, res) => {
  const { examType, codes } = req.body ?? {};
  if ((examType !== "ESAT" && examType !== "TMUA") || !Array.isArray(codes) || codes.length > 500 || codes.some((code) => typeof code !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(code))) {
    res.status(400).json(fail("题目来源参数不正确", "LEARNING_SOURCES_INVALID"));
    return;
  }
  res.json(success(await getLearningPatternSources(examType, [...new Set<string>(codes)])));
});

// 展开解析时先沿用精选题白名单与发布校验，再读取同一道题的原始解析。
learningExamplesRouter.get("/:subject/examples/:sourceCode/analysis", optionalAuth, async (req, res) => {
  const { subject, sourceCode } = req.params;
  const readers = {
    biology: getBiologyLearningExample,
    chemistry: getChemistryLearningExample,
    mathematics1: getMathematicsLearningExample,
    mathematics2: getMathematics2LearningExample,
    physics: getPhysicsLearningExample,
    tmua: getTmuaLearningExample,
    pattern: getLearningPatternExample,
  };
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(sourceCode) || !Object.hasOwn(readers, subject)) {
    res.status(400).json(fail("例题来源不正确", "LEARNING_EXAMPLE_INVALID"));
    return;
  }
  if (!(subject === 'pattern' ? Object.hasOwn(learningPatternExamples, sourceCode) : learningExampleAnalysisSources[subject]?.has(sourceCode))) {
    res.status(404).json(fail("这道精选题暂不可用", "LEARNING_EXAMPLE_UNAVAILABLE"));
    return;
  }
  const selected = await readers[subject as keyof typeof readers](sourceCode);
  if (!selected?.question.id) {
    res.status(404).json(fail("这道精选题暂不可用", "LEARNING_EXAMPLE_UNAVAILABLE"));
    return;
  }
  const row = await prisma.question.findUnique({
    where: { id: selected.question.id },
    select: { solution: true },
  });
  if (!row?.solution) {
    res.status(404).json(fail("题目原解析暂不可用", "LEARNING_ANALYSIS_UNAVAILABLE"));
    return;
  }
  res.json(success({ sourceCode, answer: getQuestionAnswer(row), analysis: solutionToLearningAnalysis(row.solution) }));
});

// 考法例题仅从已建立的年度题源映射读取，答题前不返回解析。
learningExamplesRouter.get("/pattern/examples/:sourceCode", optionalAuth, async (req, res) => {
  const code = req.params.sourceCode;
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(code)) {
    res.status(400).json(fail("例题编号不正确", "LEARNING_EXAMPLE_INVALID"));
    return;
  }
  const example = await getLearningPatternExample(code);
  if (!example) {
    res.status(404).json(fail("这道精选题暂不可用", "LEARNING_EXAMPLE_UNAVAILABLE"));
    return;
  }
  res.json(success(example));
});

// TMUA 精选题
learningExamplesRouter.get(
  "/tmua/examples/:sourceCode",
  optionalAuth,
  async (req, res) => {
    const code = req.params.sourceCode;
    if (!/^[A-Za-z0-9_-]{1,100}$/.test(code)) {
      res.status(400).json(fail("例题编号不正确", "LEARNING_EXAMPLE_INVALID"));
      return;
    }
    const example = await getTmuaLearningExample(code);
    if (!example) {
      res
        .status(404)
        .json(
          fail(
            "这道精选题暂不可用，请稍后重试或选择其他例题。",
            "LEARNING_EXAMPLE_UNAVAILABLE",
          ),
        );
      return;
    }
    res.json(success(example));
  },
);

// 物理精选例题
learningExamplesRouter.get(
  "/physics/examples/:sourceCode",
  optionalAuth,
  async (req, res) => {
    const code = req.params.sourceCode;
    if (!/^[A-Za-z0-9_-]{1,100}$/.test(code)) {
      res.status(400).json(fail("例题编号不正确", "LEARNING_EXAMPLE_INVALID"));
      return;
    }
    const example = await getPhysicsLearningExample(code);
    if (!example) {
      res
        .status(404)
        .json(
          fail(
            "这道精选题暂不可用，请稍后重试或选择其他例题。",
            "LEARNING_EXAMPLE_UNAVAILABLE",
          ),
        );
      return;
    }
    res.json(success(example));
  },
);

// 数学1精选例题
learningExamplesRouter.get(
  "/mathematics1/examples/:sourceCode",
  optionalAuth,
  async (req, res) => {
    const code = req.params.sourceCode;
    if (!/^[A-Za-z0-9_-]{1,100}$/.test(code)) {
      res.status(400).json(fail("例题编号不正确", "LEARNING_EXAMPLE_INVALID"));
      return;
    }
    const example = await getMathematicsLearningExample(code);
    if (!example) {
      res
        .status(404)
        .json(
          fail(
            "这道精选题暂不可用，请稍后重试或选择其他例题。",
            "LEARNING_EXAMPLE_UNAVAILABLE",
          ),
        );
      return;
    }
    res.json(success(example));
  },
);

// 数学2精选例题
learningExamplesRouter.get(
  "/mathematics2/examples/:sourceCode",
  optionalAuth,
  async (req, res) => {
    const code = req.params.sourceCode;
    if (!/^[A-Za-z0-9_-]{1,100}$/.test(code)) {
      res.status(400).json(fail("例题编号不正确", "LEARNING_EXAMPLE_INVALID"));
      return;
    }
    const example = await getMathematics2LearningExample(code);
    if (!example) {
      res
        .status(404)
        .json(
          fail(
            "这道精选题暂不可用，请稍后重试或选择其他例题。",
            "LEARNING_EXAMPLE_UNAVAILABLE",
          ),
        );
      return;
    }
    res.json(success(example));
  },
);

// 化学精选例题
learningExamplesRouter.get(
  "/chemistry/examples/:sourceCode",
  optionalAuth,
  async (req, res) => {
    const code = req.params.sourceCode;
    if (!/^[A-Za-z0-9_-]{1,100}$/.test(code)) {
      res.status(400).json(fail("例题编号不正确", "LEARNING_EXAMPLE_INVALID"));
      return;
    }
    const example = await getChemistryLearningExample(code);
    if (!example) {
      res
        .status(404)
        .json(
          fail(
            "这道精选题暂不可用，请稍后重试或选择其他例题。",
            "LEARNING_EXAMPLE_UNAVAILABLE",
          ),
        );
      return;
    }
    res.json(success(example));
  },
);

// 生物真题例题
learningExamplesRouter.get(
  "/biology/examples/:sourceCode",
  optionalAuth,
  async (req, res) => {
    const code = req.params.sourceCode;
    if (!/^[A-Za-z0-9_-]{1,100}$/.test(code)) {
      res.status(400).json(fail("例题编号不正确", "LEARNING_EXAMPLE_INVALID"));
      return;
    }
    const example = await getBiologyLearningExample(code);
    if (!example) {
      res
        .status(404)
        .json(
          fail(
            "这道真题暂不可用，请稍后重试或选择其他例题。",
            "LEARNING_EXAMPLE_UNAVAILABLE",
          ),
        );
      return;
    }
    res.json(success(example));
  },
);
