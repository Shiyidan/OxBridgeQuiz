// 数学2函数图像精选题映射：固定年度真题与独立题库来源，正文和自测解析统一读取 Question。
import type { MathematicsLearningSelection } from "./mathematicsLearningTypes.js";

export const maths2GraphsSources: Record<string, MathematicsLearningSelection> =
  {
    ESAT_LEGACY_2021_ENGAA_Q031: {
      kind: "annual",
      questionCode: "ESAT_LEGACY_2021_ENGAA_Q031",
      year: 2021,
      exam: "ENGAA",
      reason: "不用计算器比较六个三角函数值",
    },
    "ENGAA_2016_S1-Q045": {
      kind: "annual",
      questionCode: "ENGAA_2016_S1-Q045",
      year: 2016,
      exam: "ENGAA",
      reason: "先平移，再关于y = −1反射",
    },
    "ESAT-M2-MOCK-ADAPT-R2-E02-016": {
      kind: "bank",
      questionCode: "ESAT-M2-MOCK-ADAPT-R2-E02-016",
      reason: "复合函数先算哪一个？",
    },
    "ESAT-2020-MATHS2-005": {
      kind: "annual",
      questionCode: "ESAT-2020-MATHS2-005",
      year: 2020,
      exam: "ENGAA",
      reason: "两条垂线与y轴围成三角形",
    },
    "ENGAA_2023_S1-Q029": {
      kind: "annual",
      questionCode: "ENGAA_2023_S1-Q029",
      year: 2023,
      exam: "ENGAA",
      reason: "二次系数是根式，如何读出顶点形式？",
    },
    "ENGAA_2017_S1-Q039": {
      kind: "annual",
      questionCode: "ENGAA_2017_S1-Q039",
      year: 2017,
      exam: "ENGAA",
      reason: "从两个极值位置还原导函数",
    },
    "ENGAA_2016_S1-Q053": {
      kind: "annual",
      questionCode: "ENGAA_2016_S1-Q053",
      year: 2016,
      exam: "ENGAA",
      reason: "水平线在什么高度会有四个不同交点？",
    },
    ESAT_LEGACY_2021_ENGAA_Q025: {
      kind: "annual",
      questionCode: "ESAT_LEGACY_2021_ENGAA_Q025",
      year: 2021,
      exam: "ENGAA",
      reason: "四次方程为什么只有三个不同实根？",
    },
    "NSAA_2019_S1-Q089": {
      kind: "annual",
      questionCode: "NSAA_2019_S1-Q089",
      year: 2019,
      exam: "NSAA",
      reason: "双根为什么不会让图像换到另一侧？",
    },
    ESAT_LEGACY_2021_ENGAA_Q035: {
      kind: "annual",
      questionCode: "ESAT_LEGACY_2021_ENGAA_Q035",
      year: 2021,
      exam: "ENGAA",
      reason: "两条曲线有公共平方因子，能约掉吗？",
    },
    ESAT_LEGACY_2018_ENGAA_Q33: {
      kind: "annual",
      questionCode: "ESAT_LEGACY_2018_ENGAA_Q33",
      year: 2018,
      exam: "ENGAA",
      reason: "相切怎样变成判别式条件？",
    },
    "ESAT-M2-MOCK-ADAPT-R2-E04-011": {
      kind: "bank",
      questionCode: "ESAT-M2-MOCK-ADAPT-R2-E04-011",
      reason: "指数图像：准确定位与水平线的交点",
    },
    "ENGAA_2017_S1-Q051": {
      kind: "annual",
      questionCode: "ENGAA_2017_S1-Q051",
      year: 2017,
      exam: "ENGAA",
      reason: "水平压缩后再平移：按顺序变换",
    },
    "ESAT-2020-MATHS2-003": {
      kind: "annual",
      questionCode: "ESAT-2020-MATHS2-003",
      year: 2020,
      exam: "ENGAA",
      reason: "坐标反射：斜率倒数与负倒数的区别",
    },
    ESAT_LEGACY_2022_ENGAA_Q035: {
      kind: "annual",
      questionCode: "ESAT_LEGACY_2022_ENGAA_Q035",
      year: 2022,
      exam: "ENGAA",
      reason: "根与顶点：从图像求矩形宽高",
    },
    "ESAT-2020-MATHS2-007": {
      kind: "annual",
      questionCode: "ESAT-2020-MATHS2-007",
      year: 2020,
      exam: "ENGAA",
      reason: "两个不同转折点：导函数判别式边界",
    },
    "ESAT-2020-MATHS2-001": {
      kind: "annual",
      questionCode: "ESAT-2020-MATHS2-001",
      year: 2020,
      exam: "ENGAA",
      reason: "因式与零点：代入已知根反推系数",
    },
    "ESAT-M2-DIRECT-005-LR3": {
      kind: "bank",
      questionCode: "ESAT-M2-DIRECT-005-LR3",
      reason: "联立分式曲线：保留定义域并验证交点",
    },
  };

export const maths2GraphsSelfChecks: Record<
  string,
  { title: string; selection: MathematicsLearningSelection }
> = {
  "120801": {
    title: "指数图像：准确定位与水平线的交点",
    selection: maths2GraphsSources["ESAT-M2-MOCK-ADAPT-R2-E04-011"]!,
  },
  "120802": {
    title: "水平压缩后再平移：按顺序变换",
    selection: maths2GraphsSources["ENGAA_2017_S1-Q051"]!,
  },
  "120803": {
    title: "坐标反射：斜率倒数与负倒数的区别",
    selection: maths2GraphsSources["ESAT-2020-MATHS2-003"]!,
  },
  "120804": {
    title: "根与顶点：从图像求矩形宽高",
    selection: maths2GraphsSources["ESAT_LEGACY_2022_ENGAA_Q035"]!,
  },
  "120805": {
    title: "两个不同转折点：导函数判别式边界",
    selection: maths2GraphsSources["ESAT-2020-MATHS2-007"]!,
  },
  "120806": {
    title: "因式与零点：代入已知根反推系数",
    selection: maths2GraphsSources["ESAT-2020-MATHS2-001"]!,
  },
  "120807": {
    title: "联立分式曲线：保留定义域并验证交点",
    selection: maths2GraphsSources["ESAT-M2-DIRECT-005-LR3"]!,
  },
};
