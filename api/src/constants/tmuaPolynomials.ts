// TMUA 多项式精选题白名单：真题与独立自测均读取正式 Question。
import type { MathematicsLearningSelection } from "./mathematicsLearningTypes.js";

export const tmuaPolynomialsSources: Record<
  string,
  MathematicsLearningSelection
> = {
  "TMUA-2018-P1-Q005": {
    kind: "annual",
    questionCode: "TMUA-2018-P1-Q005",
    year: 2018,
    exam: "TMUA",
    paper: "paper1",
    questionNumber: 5,
    reason: "利用余式定理计算余式差，再根据参数排列优化。",
  },
  TMUA_2022_P2_Q07: {
    kind: "annual",
    questionCode: "TMUA_2022_P2_Q07",
    year: 2022,
    exam: "TMUA",
    paper: "paper2",
    questionNumber: 7,
    reason: "区分多项式不可约和整数值是否为素数，定位推理错误。",
  },
  "TMUA-REMAINING-R4-DIRECT-020": {
    kind: "bank",
    questionCode: "TMUA-REMAINING-R4-DIRECT-020",
    reason: "对高次多项式换元并检查换元的非负范围及不同实根数。",
  },
};

export const tmuaPolynomialsSelfChecks: Record<
  string,
  { title: string; selection: MathematicsLearningSelection }
> = {
  "221006": {
    title: "高次方程换元后，如何统计实根？",
    selection: tmuaPolynomialsSources["TMUA-REMAINING-R4-DIRECT-020"]!,
  },
};
