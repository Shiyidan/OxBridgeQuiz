// TMUA 二次函数样板的精选题白名单：年度题按卷发布，原题及解析始终从 Question 读取。
import type { MathematicsLearningSelection } from "./mathematicsLearningTypes.js";

export const tmuaQuadraticSources: Record<
  string,
  MathematicsLearningSelection
> = {
  "TMUA-2019-P1-Q001": {
    kind: "annual",
    questionCode: "TMUA-2019-P1-Q001",
    year: 2019,
    exam: "TMUA",
    paper: "paper1",
    questionNumber: 1,
    reason: "把顶点坐标直接写入配方形式，再用已知点决定开口与伸缩。",
  },
  TMUA_2023_P2_Q18: {
    kind: "annual",
    questionCode: "TMUA_2023_P2_Q18",
    year: 2023,
    exam: "TMUA",
    paper: "paper2",
    questionNumber: 18,
    reason: "将四次方程换元为二次方程，分别核实不同实根与正根条件。",
  },
  "TMUA-STARLIGHT-R4-DIRECT-021": {
    kind: "bank",
    questionCode: "TMUA-STARLIGHT-R4-DIRECT-021",
    reason: "先检查二次项是否退化，再以判别式求其余只有一个实解的参数。",
  },
};

export const tmuaQuadraticSelfChecks: Record<
  string,
  { title: string; selection: MathematicsLearningSelection }
> = {
  "221003": {
    title: "恰有一个实解：二次项消失时怎么办？",
    selection: tmuaQuadraticSources["TMUA-STARLIGHT-R4-DIRECT-021"]!,
  },
};
