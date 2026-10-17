// 学习平台精选真题入口，不创建答卷、不消耗练习权益、不下发整份诊断卷。
import { optionalAuth } from "../middleware/auth.js";
import { createAsyncRouter } from "../utils/asyncRouter.js";
import { fail, success } from "../utils/response.js";
import { getBiologyLearningExample } from "../services/learningExamples.js";
import { learningSelfCheckRouter } from "./learningSelfCheck.js";

export const learningExamplesRouter = createAsyncRouter();
learningExamplesRouter.use(learningSelfCheckRouter);

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
