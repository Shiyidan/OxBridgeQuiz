// TMUA 根式学习题白名单：年度题和独立自测题均从 Question 读取。
import type { MathematicsLearningSelection } from "./mathematicsLearningTypes.js";

export const tmuaSurdsSources: Record<string, MathematicsLearningSelection> = {
  "TMUA-2020-P1-Q009": {
    kind: "annual",
    questionCode: "TMUA-2020-P1-Q009",
    year: 2020,
    exam: "TMUA",
    paper: "paper1",
    questionNumber: 9,
    reason: "通过根的和与积构造根式对称式，并利用正性确定平方根符号。",
  },
  TMUA_2021_P2_Q05: {
    kind: "annual",
    questionCode: "TMUA_2021_P2_Q05",
    year: 2021,
    exam: "TMUA",
    paper: "paper2",
    questionNumber: 5,
    reason: "逐行辨析平方根与绝对值，发现论证中首次丢失符号的地方。",
  },
  "QB-TMUA-MATHEMATICS2-E886E2DE17C8": {
    kind: "bank",
    questionCode: "QB-TMUA-MATHEMATICS2-E886E2DE17C8",
    reason: "通过根式乘积与完全平方数判断充分与必要条件。",
  },
};

export const tmuaSurdsSelfChecks: Record<
  string,
  { title: string; selection: MathematicsLearningSelection }
> = {
  "221002": {
    title: "根式乘积为整数：哪些条件只是充分条件？",
    selection: tmuaSurdsSources["QB-TMUA-MATHEMATICS2-E886E2DE17C8"]!,
  },
};
