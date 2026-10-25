// 数学2微分章固定题源：原题与自测解析从 Question 读取，年度真题和独立题库严格区分。
import type { MathematicsLearningSelection } from "./mathematicsLearningTypes.js";

export const maths2DifferentiationSources: Record<
  string,
  MathematicsLearningSelection
> = {
  "ENGAA_2023_S1-Q033": {
    kind: "annual",
    questionCode: "ENGAA_2023_S1-Q033",
    year: 2023,
    exam: "ENGAA",
    reason: "区分一阶与二阶导数条件，先求导再在不同位置代入联立。",
  },
  "ESAT-M2-MOCK-ADAPT-R2-E05-004": {
    kind: "bank",
    questionCode: "ESAT-M2-MOCK-ADAPT-R2-E05-004",
    reason: "用位移对时间的导数求瞬时速度，并保留方向与单位。",
  },
  ESAT_LEGACY_2021_ENGAA_Q021: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2021_ENGAA_Q021",
    year: 2021,
    exam: "ENGAA",
    reason: "先展开根式平方成为幂的和，再逐项求导和代入。",
  },
  "ENGAA_2017_S1-Q043": {
    kind: "annual",
    questionCode: "ENGAA_2017_S1-Q043",
    year: 2017,
    exam: "ENGAA",
    reason: "从原多项式的四次项得到导函数的三次项系数，无需引入链式法则。",
  },
  ESAT_LEGACY_2018_ENGAA_Q33: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2018_ENGAA_Q33",
    year: 2018,
    exam: "ENGAA",
    reason: "先使曲线导数等于已知切线斜率，再用切点求截距。",
  },
  "ENGAA_2016_S1-Q043": {
    kind: "annual",
    questionCode: "ENGAA_2016_S1-Q043",
    year: 2016,
    exam: "ENGAA",
    reason: "由导数的符号区间判断递增，并区分区间端点与处处正导数。",
  },
  ESAT_LEGACY_2021_ENGAA_Q039: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2021_ENGAA_Q039",
    year: 2021,
    exam: "ENGAA",
    reason: "从真实图形列矩形面积，展开为分数幂后求导并核验全区间最值。",
  },
  "ESAT-TMUA-A20-M2-20260828-014-R2": {
    kind: "bank",
    questionCode: "ESAT-TMUA-A20-M2-20260828-014-R2",
    reason: "以同一交点连接曲线、直线与法线，再由截距条件筛选参数。",
  },
  "ESAT-2020-MATHS2-010": {
    kind: "annual",
    questionCode: "ESAT-2020-MATHS2-010",
    year: 2020,
    exam: "ENGAA",
    reason: "先求斜率函数，再用正根换元求斜率的最大值，区分函数值与导数值。",
  },
  "NSAA_2019_S1-Q075": {
    kind: "annual",
    questionCode: "NSAA_2019_S1-Q075",
    year: 2019,
    exam: "NSAA",
    reason: "对三次式逐项求导，再用给定驻点作为导函数的根比较系数。",
  },
  "ESAT-2020-MATHS2-007": {
    kind: "annual",
    questionCode: "ESAT-2020-MATHS2-007",
    year: 2020,
    exam: "ENGAA",
    reason:
      "把两个不同转折点转为二次导函数的两个不同实根，严格排除判别式为零。",
  },
};

export const maths2DifferentiationSelfChecks: Record<
  string,
  { title: string; selection: MathematicsLearningSelection }
> = {
  "120601": {
    title: "最大斜率：先求导函数，再判断它的最大值",
    selection: maths2DifferentiationSources["ESAT-2020-MATHS2-010"]!,
  },
  "120602": {
    title: "幂函数求导：用驻点作为导函数的根比较系数",
    selection: maths2DifferentiationSources["NSAA_2019_S1-Q075"]!,
  },
  "120603": {
    title: "两个不同转折点：导函数判别式的严格边界",
    selection: maths2DifferentiationSources["ESAT-2020-MATHS2-007"]!,
  },
};
