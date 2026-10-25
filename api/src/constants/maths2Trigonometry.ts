// 数学2三角章固定题源：区分年度真题与独立题库，原题及自测解析由 Question 读取。
import type { MathematicsLearningSelection } from "./mathematicsLearningTypes.js";

export const maths2TrigonometrySources: Record<
  string,
  MathematicsLearningSelection
> = {
  "ENGAA_2017_S1-Q041": {
    kind: "annual",
    questionCode: "ENGAA_2017_S1-Q041",
    year: 2017,
    exam: "ENGAA",
    reason: "用夹角面积公式建立二次函数，再用配方核对长度范围。",
  },
  ESAT_LEGACY_2021_ENGAA_Q027: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2021_ENGAA_Q027",
    year: 2021,
    exam: "ENGAA",
    reason: "由弦心距确定完整圆心角，再用扇形减三角形。",
  },
  "NSAA_2019_S1-Q087": {
    kind: "annual",
    questionCode: "NSAA_2019_S1-Q087",
    year: 2019,
    exam: "NSAA",
    reason: "先将三角函数值视作代数未知量，恢复角时检查三角形的补角分支。",
  },
  "ENGAA_2017_S1-Q051": {
    kind: "annual",
    questionCode: "ENGAA_2017_S1-Q051",
    year: 2017,
    exam: "ENGAA",
    reason: "按变换顺序替换自变量，检查整个相位都随横向伸缩改变。",
  },
  "NSAA_2023_S1-Q019": {
    kind: "annual",
    questionCode: "NSAA_2023_S1-Q019",
    year: 2023,
    exam: "NSAA",
    reason: "用正弦值域缩小参数范围，再判断指数函数的单调方向。",
  },
  "ENGAA_2016_S1-Q037": {
    kind: "annual",
    questionCode: "ENGAA_2016_S1-Q037",
    year: 2016,
    exam: "ENGAA",
    reason: "先保留正切的定义域，再用平方和将混合表达式变成二次方程。",
  },
  ESAT_LEGACY_2018_ENGAA_Q31: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2018_ENGAA_Q31",
    year: 2018,
    exam: "ENGAA",
    reason: "因式分解保留零因子，按给定闭区间逐个列解。",
  },
  "ENGAA_2017_S1-Q045": {
    kind: "annual",
    questionCode: "ENGAA_2017_S1-Q045",
    year: 2017,
    exam: "ENGAA",
    reason: "先求公比，再将复合角及其区间一起换元。",
  },
  "ESAT-TMUA-N60-M2-20260916-052": {
    kind: "bank",
    questionCode: "ESAT-TMUA-N60-M2-20260916-052",
    reason: "用最长边定位最大角，再以余弦定理计算带符号精确值。",
  },
  "ESAT-2025-CN-RECALL-M2-Q11": {
    kind: "bank",
    questionCode: "ESAT-2025-CN-RECALL-M2-Q11",
    reason:
      "2025回忆整理题：同弧圆心角为圆周角两倍，转弧度后求弧长；不是官方年度原卷。",
  },
  "ESAT-TMUA-A20-M2-20260828-015-R2": {
    kind: "bank",
    questionCode: "ESAT-TMUA-A20-M2-20260828-015-R2",
    reason: "联立tan与sin的线性关系，使用精确值及锐角条件求第三个角。",
  },
  ESAT_LEGACY_2021_ENGAA_Q031: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2021_ENGAA_Q031",
    year: 2021,
    exam: "ENGAA",
    reason: "利用第一象限单调性与余函数关系比较小数弧度下的三角函数值。",
  },
  "NSAA_2019_S1-Q077": {
    kind: "annual",
    questionCode: "NSAA_2019_S1-Q077",
    year: 2019,
    exam: "NSAA",
    reason: "用两条基本恒等式得到余弦二次方程，再按锐角条件求正切。",
  },
  "ESAT-2020-MATHS2-008": {
    kind: "annual",
    questionCode: "ESAT-2020-MATHS2-008",
    year: 2020,
    exam: "ENGAA",
    reason: "提取cos公因式，平方和降次后在指定闭区间内统计全部解。",
  },
};

export const maths2TrigonometrySelfChecks: Record<
  string,
  { title: string; selection: MathematicsLearningSelection | null }
> = {
  "120401": {
    title: "三边已知：最大角的余弦为什么为负",
    selection: {
      kind: "bank",
      questionCode: "ESAT-TMUA-N60-M2-20260916-052",
      reason: "用最长边定位最大角，再以余弦定理计算带符号精确值。",
    },
  },
  "120402": {
    title: "回忆整理题：从圆周角求圆弧长度",
    selection: {
      kind: "bank",
      questionCode: "ESAT-2025-CN-RECALL-M2-Q11",
      reason:
        "2025回忆整理题：同弧圆心角为圆周角两倍，转弧度后求弧长；不是官方年度原卷。",
    },
  },
  "120403": {
    title: "精确三角值联立后用锐角条件筛分支",
    selection: {
      kind: "bank",
      questionCode: "ESAT-TMUA-A20-M2-20260828-015-R2",
      reason: "联立tan与sin的线性关系，使用精确值及锐角条件求第三个角。",
    },
  },
  "120404": {
    title: "不用计算器比较第一象限的正弦与余弦",
    selection: {
      kind: "annual",
      questionCode: "ESAT_LEGACY_2021_ENGAA_Q031",
      year: 2021,
      exam: "ENGAA",
      reason: "利用第一象限单调性与余函数关系比较小数弧度下的三角函数值。",
    },
  },
  "120405": {
    title: "统一函数后，别把余弦当作题目要的正切",
    selection: {
      kind: "annual",
      questionCode: "NSAA_2019_S1-Q077",
      year: 2019,
      exam: "NSAA",
      reason: "用两条基本恒等式得到余弦二次方程，再按锐角条件求正切。",
    },
  },
  "120406": {
    title: "高次三角方程：零分支和两个周期都不能漏",
    selection: {
      kind: "annual",
      questionCode: "ESAT-2020-MATHS2-008",
      year: 2020,
      exam: "ENGAA",
      reason: "提取cos公因式，平方和降次后在指定闭区间内统计全部解。",
    },
  },
};
