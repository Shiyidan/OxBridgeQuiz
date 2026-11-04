// TMUA 不等式学习题白名单：从年度真题和独立题库读取审核通过的题目。
import type { MathematicsLearningSelection } from "./mathematicsLearningTypes.js";

export const tmuaInequalitiesSources: Record<
  string,
  MathematicsLearningSelection
> = {
  "TMUA-2017-P1-Q005": {
    kind: "annual",
    questionCode: "TMUA-2017-P1-Q005",
    year: 2017,
    exam: "TMUA",
    paper: "paper1",
    questionNumber: 5,
    reason: "求一次与二次不等式的交集，并写成一个等价二次式。",
  },
  TMUA_2023_P2_Q10: {
    kind: "annual",
    questionCode: "TMUA_2023_P2_Q10",
    year: 2023,
    exam: "TMUA",
    paper: "paper2",
    questionNumber: 10,
    reason: "判断平方不等式每一步是否等价，检查自动成立的范围。",
  },
  "QB-TMUA-TMUA-MATHS2-3C5BE3FC77AB": {
    kind: "bank",
    questionCode: "QB-TMUA-TMUA-MATHS2-3C5BE3FC77AB",
    reason: "由平方不等式的两个分支构造前件成立而结论不成立的反例。",
  },
};

export const tmuaInequalitiesSelfChecks: Record<
  string,
  { title: string; selection: MathematicsLearningSelection }
> = {
  "221005": {
    title: "平方不等式能推出单侧范围吗？",
    selection: tmuaInequalitiesSources["QB-TMUA-TMUA-MATHS2-3C5BE3FC77AB"]!,
  },
};
