// 数学1统计固定题源：保留年度真题与题库回忆题的区别，缺直接题时显式标记迁移范围。
import type { MathematicsLearningSelection } from "./mathematicsLearningTypes.js";

export const mathsStatisticsSources: Record<
  string,
  MathematicsLearningSelection
> = {
  "ENGAA_2016_S1-Q023": {
    kind: "annual",
    questionCode: "ENGAA_2016_S1-Q023",
    year: 2016,
    exam: "ENGAA",
    reason: "将活动与性别的文字条件还原为双向表，再读取条件概率所需人数。",
  },
  ESAT_LEGACY_2018_ENGAA_Q01: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2018_ENGAA_Q01",
    year: 2018,
    exam: "ENGAA",
    reason: "用双向表的行列合计补全驾考通过人数，检验分类表阅读与补数。",
  },
  "ESAT-2026-CN-RECALL-M1-Q27": {
    kind: "bank",
    questionCode: "ESAT-2026-CN-RECALL-M1-Q27",
    reason:
      "独立题库收录的回忆题，非年度真题；以等组距累计频率增量判断直方图。",
  },
  "ESAT-TMUA-N60-M1-20260924-033-S1": {
    kind: "bank",
    questionCode: "ESAT-TMUA-N60-M1-20260924-033-S1",
    reason:
      "关联迁移：离散频数表中的累计位置与四分位数，不直接考连续分组直方图；按上下半组中位数约定解释。",
  },
  "ENGAA_2016_S1-Q007": {
    kind: "annual",
    questionCode: "ENGAA_2016_S1-Q007",
    year: 2016,
    exam: "ENGAA",
    reason: "由人数与均值恢复总量，求新增成员的平均年龄。",
  },
  "NSAA_2023_S1-Q004": {
    kind: "annual",
    questionCode: "NSAA_2023_S1-Q004",
    year: 2023,
    exam: "NSAA",
    reason: "结合均值、中位数与排序约束求未知数，再读取众数。",
  },
  ESAT_LEGACY_2022_NSAA_Q008: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2022_NSAA_Q008",
    year: 2022,
    exam: "NSAA",
    reason: "由已排序数据写出均值和中位数，检验中间位置及等式。",
  },
  "NSAA_2019_S1-Q017": {
    kind: "annual",
    questionCode: "NSAA_2019_S1-Q017",
    year: 2019,
    exam: "NSAA",
    reason:
      "关联迁移：不直接考散点图或相关性，用于练习证据与推断边界；区分必然结论与可能结论。",
  },
  "ESAT-2020-MATHS1-012": {
    kind: "annual",
    questionCode: "ESAT-2020-MATHS1-012",
    year: 2020,
    exam: "NSAA",
    reason:
      "关联迁移：不直接考散点图或相关性，用于练习证据与推断边界；只根据已知统计量作有依据的结论。",
  },
};

export const mathsStatisticsSelfChecks: Record<
  string,
  { title: string; selection: MathematicsLearningSelection | null }
> = {
  "110601": {
    title: "双向表：从总人数补全分类人数",
    selection: mathsStatisticsSources["ESAT_LEGACY_2018_ENGAA_Q01"]!,
  },
  "110602": {
    title: "关联自测：频数表中的累计位置与四分位数",
    selection: mathsStatisticsSources["ESAT-TMUA-N60-M1-20260924-033-S1"]!,
  },
  "110603": {
    title: "均值、中位数与众数：先确定排序位置",
    selection: mathsStatisticsSources["NSAA_2023_S1-Q004"]!,
  },
  "110604": {
    title: "关联自测：统计信息的推断边界（非散点图题）",
    selection: mathsStatisticsSources["ESAT-2020-MATHS1-012"]!,
  },
};
