// TMUA 函数学习题白名单：精选年度题与独立自测均从 Question 读取。
import type { MathematicsLearningSelection } from "./mathematicsLearningTypes.js";

export const tmuaFunctionsSources: Record<
  string,
  MathematicsLearningSelection
> = {
  TMUA_2023_P1_Q20: {
    kind: "annual",
    questionCode: "TMUA_2023_P1_Q20",
    year: 2023,
    exam: "TMUA",
    paper: "paper1",
    questionNumber: 20,
    reason: "利用内层函数值域求复合二次函数的最值差。",
  },
  TMUA_2022_P2_Q20: {
    kind: "annual",
    questionCode: "TMUA_2022_P2_Q20",
    year: 2022,
    exam: "TMUA",
    paper: "paper2",
    questionNumber: 20,
    reason: "逐层传递三角复合函数的值域与端点可达性。",
  },
  "TMUA-DIRECT-R12-P1-Q008": {
    kind: "bank",
    questionCode: "TMUA-DIRECT-R12-P1-Q008",
    reason: "先确定内层三角函数范围，再比较外层平方的最大值。",
  },
};

export const tmuaFunctionsSelfChecks: Record<
  string,
  { title: string; selection: MathematicsLearningSelection }
> = {
  "221007": {
    title: "复合函数的最大值在哪个端点？",
    selection: tmuaFunctionsSources["TMUA-DIRECT-R12-P1-Q008"]!,
  },
};
