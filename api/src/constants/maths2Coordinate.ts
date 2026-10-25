// 数学2坐标几何章固定题源：年度来源限已发布年度卷，独立题库限已发布数学2；不复制题目正文和答案。
import type { MathematicsLearningSelection } from "./mathematicsLearningTypes.js";

export const maths2CoordinateSources: Record<
  string,
  MathematicsLearningSelection
> = {
  "ENGAA_2016_S1-Q041": {
    kind: "annual",
    questionCode: "ENGAA_2016_S1-Q041",
    year: 2016,
    exam: "ENGAA",
    reason: "垂直斜率与x轴截距长度联立解m+p",
  },
  "ESAT_LEGACY_2022_ENGAA_Q037": {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2022_ENGAA_Q037",
    year: 2022,
    exam: "ENGAA",
    reason: "两截距点写直线一般式后套点到直线距离",
  },
  "ESAT-2020-MATHS2-005": {
    kind: "annual",
    questionCode: "ESAT-2020-MATHS2-005",
    year: 2020,
    exam: "ESAT",
    reason: "垂线与截距构成三角形，面积条件反求斜率",
  },
  "ENGAA_2016_S1-Q031": {
    kind: "annual",
    questionCode: "ENGAA_2016_S1-Q031",
    year: 2016,
    exam: "ENGAA",
    reason: "正方形内切圆由圆心半径写方程再展开",
  },
  "ESAT_LEGACY_2021_NSAA_Q004": {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2021_NSAA_Q004",
    year: 2021,
    exam: "NSAA",
    reason: "半径作法向量写圆上点的切线方程",
  },
  "ESAT_LEGACY_2022_ENGAA_Q023": {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2022_ENGAA_Q023",
    year: 2022,
    exam: "ENGAA",
    reason: "由半圆方程解出纵坐标再算三角形面积",
  },
  "ESAT_LEGACY_2018_ENGAA_Q43": {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2018_ENGAA_Q43",
    year: 2018,
    exam: "ENGAA",
    reason: "切线长与半径求外点到圆心的距离再减半径",
  },
  "ESAT_LEGACY_2021_ENGAA_Q027": {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2021_ENGAA_Q027",
    year: 2021,
    exam: "ENGAA",
    reason: "弦心距求圆心角后用扇形减三角形",
  },
  "ESAT-M2-MOCK-ADAPT-E02-006": {
    kind: "bank",
    questionCode: "ESAT-M2-MOCK-ADAPT-E02-006",
    reason: "同弧圆周角与圆心角关系求等腰三角形底角",
  },
};

export const maths2CoordinateSelfChecks: Record<
  string,
  { title: string; selection: MathematicsLearningSelection | null }
> = {
  "120301": {
    title: "垂线与截距围成三角形，面积条件反求较大斜率",
    selection: {
      kind: "annual",
      questionCode: "ESAT-2020-MATHS2-005",
      year: 2020,
      exam: "ESAT",
      reason: "垂线与截距构成三角形，面积条件反求斜率",
    },
  },
  "120302": {
    title: "由半圆方程求纵坐标后算三角形面积",
    selection: {
      kind: "annual",
      questionCode: "ESAT_LEGACY_2022_ENGAA_Q023",
      year: 2022,
      exam: "ENGAA",
      reason: "由半圆方程解出纵坐标再算三角形面积",
    },
  },
  "120303": {
    title: "同弧圆周角与圆心角关系求等腰三角形底角",
    selection: {
      kind: "bank",
      questionCode: "ESAT-M2-MOCK-ADAPT-E02-006",
      reason: "同弧圆周角与圆心角关系求等腰三角形底角",
    },
  },
};
