// 数学2积分章固定题源：年度与独立题库分开读取，自测保留原题解析并隔离作答前答案。
import type { MathematicsLearningSelection } from "./mathematicsLearningTypes.js";

export const maths2IntegrationSources: Record<
  string,
  MathematicsLearningSelection
> = {
  ESAT_LEGACY_2018_ENGAA_Q29: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2018_ENGAA_Q29",
    year: 2018,
    exam: "ENGAA",
    reason: "先找交点，再积上曲线减下曲线。",
  },
  "ENGAA_2016_S1-Q051": {
    kind: "annual",
    questionCode: "ENGAA_2016_S1-Q051",
    year: 2016,
    exam: "ENGAA",
    reason: "横向切片时用右边界减左边界，对y积分。",
  },
  "ESAT-2020-MATHS2-002": {
    kind: "annual",
    questionCode: "ESAT-2020-MATHS2-002",
    year: 2020,
    exam: "ENGAA",
    reason: "上下曲线位于横轴两侧时，面积仍由两曲线的高度差给出。",
  },
  ESAT_LEGACY_2022_ENGAA_Q021: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2022_ENGAA_Q021",
    year: 2022,
    exam: "ENGAA",
    reason: "把分式根式逐项写成幂，再计算端点差。",
  },
  ESAT_LEGACY_2018_ENGAA_Q49: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2018_ENGAA_Q49",
    year: 2018,
    exam: "ENGAA",
    reason: "两条幂函数定积分相除消去公共指数项，求参数后回代。",
  },
  "ENGAA_2023_S1-Q031": {
    kind: "annual",
    questionCode: "ENGAA_2023_S1-Q031",
    year: 2023,
    exam: "ENGAA",
    reason: "偶函数对称区间积分相加，保留根式端点的平方。",
  },
  ESAT_LEGACY_2018_ENGAA_Q51: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2018_ENGAA_Q51",
    year: 2018,
    exam: "ENGAA",
    reason: "把导数的积分变为原函数的端点增量。",
  },
  "NSAA_2019_S1-Q085": {
    kind: "annual",
    questionCode: "NSAA_2019_S1-Q085",
    year: 2019,
    exam: "NSAA",
    reason: "由积分后的幂次反推二项式中需要的项。",
  },
  "NSAA_2019_S1-Q083": {
    kind: "annual",
    questionCode: "NSAA_2019_S1-Q083",
    year: 2019,
    exam: "NSAA",
    reason: "把连续区间拆成两个未知积分，联立线性方程。",
  },
  "NSAA_2019_S1-Q073": {
    kind: "annual",
    questionCode: "NSAA_2019_S1-Q073",
    year: 2019,
    exam: "NSAA",
    reason: "直线是梯形法则精确成立的特例，以端点高度和区间宽度计算。",
  },
  "ESAT-M2-AI-V3-30EBB01A287D": {
    kind: "bank",
    questionCode: "ESAT-M2-AI-V3-30EBB01A287D",
    reason: "以区间可加性把面积比转成总量份额，再求移动分界点。",
  },
  "ESAT-M2-AI-V3-E52D83775726": {
    kind: "bank",
    questionCode: "ESAT-M2-AI-V3-E52D83775726",
    reason: "不同步长对应不同采样点，端点权重与内部点权重不能混用。",
  },
  "ESAT-M2-MOCK-ADAPT-E02-024": {
    kind: "bank",
    questionCode: "ESAT-M2-MOCK-ADAPT-E02-024",
    reason: "逐项积分后保留常数，用初值选出唯一曲线。",
  },
  "ESAT-TMUA-R22-M2-20260827-017-V2": {
    kind: "bank",
    questionCode: "ESAT-TMUA-R22-M2-20260827-017-V2",
    reason: "连续两次恢复函数，保留两个常数并用端点与积分约束核验。",
  },
};

export const maths2IntegrationSelfChecks: Record<
  string,
  { title: string; selection: MathematicsLearningSelection }
> = {
  "120701": {
    title: "上下曲线的差，才是每一条竖直切片的高度",
    selection: maths2IntegrationSources["ESAT-2020-MATHS2-002"]!,
  },
  "120702": {
    title: "偶函数与幂积分：根式端点不能约掉",
    selection: maths2IntegrationSources["ENGAA_2023_S1-Q031"]!,
  },
  "120703": {
    title: "变上限积分：积分前要找哪一个幂次？",
    selection: maths2IntegrationSources["NSAA_2019_S1-Q085"]!,
  },
  "120704": {
    title: "区间拆分：面积1∶3意味着总面积的几分之几？",
    selection: maths2IntegrationSources["ESAT-M2-AI-V3-30EBB01A287D"]!,
  },
  "120705": {
    title: "直线边界：梯形法则为什么给出精确值？",
    selection: maths2IntegrationSources["NSAA_2019_S1-Q073"]!,
  },
  "120706": {
    title: "连续恢复函数：两个积分常数都不能丢",
    selection: maths2IntegrationSources["ESAT-TMUA-R22-M2-20260827-017-V2"]!,
  },
};
