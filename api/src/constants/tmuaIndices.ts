// TMUA 有理指数学习题白名单：年度真题和独立自测均从正式题库读取。
import type { MathematicsLearningSelection } from "./mathematicsLearningTypes.js";

export const tmuaIndicesSources: Record<string, MathematicsLearningSelection> =
  {
    "TMUA-2018-P1-Q015": {
      kind: "annual",
      questionCode: "TMUA-2018-P1-Q015",
      year: 2018,
      exam: "TMUA",
      paper: "paper1",
      questionNumber: 15,
      reason: "根号底数转为分数指数，换元求解并还原原变量。",
    },
    TMUA_2023_P2_Q03: {
      kind: "annual",
      questionCode: "TMUA_2023_P2_Q03",
      year: 2023,
      exam: "TMUA",
      paper: "paper2",
      questionNumber: 3,
      reason: "用指数律和反例检查根号作用于幂或指数的区别。",
    },
    "QB-TMUA-MATHEMATICS2-59893D1A2211": {
      kind: "bank",
      questionCode: "QB-TMUA-MATHEMATICS2-59893D1A2211",
      reason: "将不同底数写成同底，求解指数中的二次方程。",
    },
  };

export const tmuaIndicesSelfChecks: Record<
  string,
  { title: string; selection: MathematicsLearningSelection }
> = {
  "221001": {
    title: "统一底数后，如何求出全部解？",
    selection: tmuaIndicesSources["QB-TMUA-MATHEMATICS2-59893D1A2211"]!,
  },
};
