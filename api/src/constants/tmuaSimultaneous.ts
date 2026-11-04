// TMUA 代入法学习题白名单：题目与原始答案从已发布的年度题和独立题库读取。
import type { MathematicsLearningSelection } from "./mathematicsLearningTypes.js";

export const tmuaSimultaneousSources: Record<
  string,
  MathematicsLearningSelection
> = {
  TMUA_2023_P1_Q02: {
    kind: "annual",
    questionCode: "TMUA_2023_P1_Q02",
    year: 2023,
    exam: "TMUA",
    paper: "paper1",
    questionNumber: 2,
    reason: "将直线与抛物线不相交翻译为二次方程没有实根，并检查切点边界。",
  },
  TMUA_2021_P2_Q11: {
    kind: "annual",
    questionCode: "TMUA_2021_P2_Q11",
    year: 2021,
    exam: "TMUA",
    paper: "paper2",
    questionNumber: 11,
    reason: "通过和积联立理解实数解的存在条件，并区分原命题与逆命题。",
  },
  "QB-TMUA-MATHEMATICS2-2A4BC269187E": {
    kind: "bank",
    questionCode: "QB-TMUA-MATHEMATICS2-2A4BC269187E",
    reason: "联立直线与抛物线，逐个回代求纵坐标之和。",
  },
};

export const tmuaSimultaneousSelfChecks: Record<
  string,
  { title: string; selection: MathematicsLearningSelection }
> = {
  "221004": {
    title: "求出交点后，如何得到纵坐标之和？",
    selection: tmuaSimultaneousSources["QB-TMUA-MATHEMATICS2-2A4BC269187E"]!,
  },
};
