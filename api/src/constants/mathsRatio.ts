// 数学 1 比与比例精选例题和自测：2026-10-23 审阅年度真题及已发布题库，正文由 Question 读取。
import type { MathematicsLearningSelection } from "./mathematicsLearningTypes.js";

export const mathsRatioSources: Record<string, MathematicsLearningSelection> = {
  "ESAT-M1-AI-20260809-5428590C118C-R3": {
    kind: "bank",
    questionCode: "ESAT-M1-AI-20260809-5428590C118C-R3",
    reason: "用真实题目检查比例的基准、对应量与倍率，保留原题条件和选项。",
  },
  ESAT_LEGACY_2018_NSAA_Q12: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2018_NSAA_Q12",
    year: 2018,
    exam: "NSAA",
    reason: "用真实题目检查比例的基准、对应量与倍率，保留原题条件和选项。",
  },
  "ENGAA_2016_S1-Q005": {
    kind: "annual",
    questionCode: "ENGAA_2016_S1-Q005",
    year: 2016,
    exam: "ENGAA",
    reason: "用真实题目检查比例的基准、对应量与倍率，保留原题条件和选项。",
  },
  "NSAA_2019_S1-Q012": {
    kind: "annual",
    questionCode: "NSAA_2019_S1-Q012",
    year: 2019,
    exam: "NSAA",
    reason: "用真实题目检查比例的基准、对应量与倍率，保留原题条件和选项。",
  },
  "ESAT-M1-REM14-DIRECT-006": {
    kind: "bank",
    questionCode: "ESAT-M1-REM14-DIRECT-006",
    reason: "用真实题目检查比例的基准、对应量与倍率，保留原题条件和选项。",
  },
  "ENGAA_2017_S1-Q009": {
    kind: "annual",
    questionCode: "ENGAA_2017_S1-Q009",
    year: 2017,
    exam: "ENGAA",
    reason: "用真实题目检查比例的基准、对应量与倍率，保留原题条件和选项。",
  },
  ESAT_LEGACY_2021_NSAA_Q009: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2021_NSAA_Q009",
    year: 2021,
    exam: "NSAA",
    reason: "用真实题目检查比例的基准、对应量与倍率，保留原题条件和选项。",
  },
  "ESAT-2020-MATHS1-014": {
    kind: "annual",
    questionCode: "ESAT-2020-MATHS1-014",
    year: 2020,
    exam: "NSAA",
    reason: "用真实题目检查比例的基准、对应量与倍率，保留原题条件和选项。",
  },
  "NSAA_2023_S1-Q014": {
    kind: "annual",
    questionCode: "NSAA_2023_S1-Q014",
    year: 2023,
    exam: "NSAA",
    reason: "用真实题目检查比例的基准、对应量与倍率，保留原题条件和选项。",
  },
  ESAT_LEGACY_2018_ENGAA_Q09: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2018_ENGAA_Q09",
    year: 2018,
    exam: "ENGAA",
    reason: "用真实题目检查比例的基准、对应量与倍率，保留原题条件和选项。",
  },
  "ESAT-2020-MATHS1-006": {
    kind: "annual",
    questionCode: "ESAT-2020-MATHS1-006",
    year: 2020,
    exam: "NSAA",
    reason: "用真实题目检查比例的基准、对应量与倍率，保留原题条件和选项。",
  },
  ESAT_LEGACY_2021_NSAA_Q018: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2021_NSAA_Q018",
    year: 2021,
    exam: "NSAA",
    reason: "用真实题目检查比例的基准、对应量与倍率，保留原题条件和选项。",
  },
  "ESAT-TMUA-N40R3-M1-20260913-006": {
    kind: "bank",
    questionCode: "ESAT-TMUA-N40R3-M1-20260913-006",
    reason: "用真实题目检查比例的基准、对应量与倍率，保留原题条件和选项。",
  },
};

export const mathsRatioSelfChecks: Record<
  string,
  { title: string; selection: MathematicsLearningSelection | null }
> = {
  "110301": {
    title: "比例因子、比例图与地图",
    selection: {
      kind: "bank",
      questionCode: "ESAT-M1-MOCK-ADAPT-E03-012",
      reason: "从立方体表面积变化反推线性比例因子，区分面积倍率与长度倍率。",
    },
  },
  "110302": {
    title: "一个量占另一个量的分数",
    selection: {
      kind: "annual",
      questionCode: "NSAA_2023_S1-Q009",
      year: 2023,
      exam: "NSAA",
      reason: "分别更新两人的薪资，再以球员新薪资为分母，避免一直沿用旧基数。",
    },
  },
  "110303": {
    title: "比的记号",
    selection: {
      kind: "annual",
      questionCode: "ESAT-2020-MATHS1-013",
      year: 2020,
      exam: "NSAA",
      reason: "把三组比统一为同一套量，不能直接比较各比中没有对齐的数字。",
    },
  },
  "110304": {
    title: "按比例分配",
    selection: {
      kind: "bank",
      questionCode: "ESAT-M1-AI-MOCK-ACA8CE2A2D5B",
      reason: "两级分配各有自己的总份数，第二次只能对上一层得到的份额分配。",
    },
  },
  "110305": {
    title: "实际情境中的比",
    selection: {
      kind: "bank",
      questionCode: "ESAT-M1-DIRECT-004-LR3",
      reason: "只加入糖浆时水量不变，用不变量连接变化前后的比。",
    },
  },
  "110306": {
    title: "比例与分数/函数",
    selection: {
      kind: "bank",
      questionCode: "ESAT-M1-DIRECT-023-LR3",
      reason: "把反比例写成乘积固定的等式，而不是误用正比例倍乘。",
    },
  },
  "110307": {
    title: "比例题中的分数",
    selection: {
      kind: "bank",
      questionCode: "ESAT-TMUA-N40FINAL-M1-20260916-026",
      reason: "先更新人数，再按票价求收入比，区分人数占比和票款占比。",
    },
  },
  "110308": {
    title: "百分比与百分比变化",
    selection: {
      kind: "bank",
      questionCode: "ESAT-M1-DIRECT-015-LR3",
      reason: "回到原值要取倍率的倒数，涨25%再跌25%并不抵消。",
    },
  },
  "110309": {
    title: "正比例与反比例",
    selection: {
      kind: "annual",
      questionCode: "ESAT-2020-MATHS1-011",
      year: 2020,
      exam: "NSAA",
      reason: "增长700%意味着变为8倍；反立方比例要对倍率开立方后取倒数。",
    },
  },
  "110310": {
    title: "长度、面积、体积比",
    selection: {
      kind: "bank",
      questionCode: "ESAT-M1-MOCK-ADAPT-R2-E11-022",
      reason: "体积比先开立方得到长度比，再平方得到表面积比。",
    },
  },
  "110311": {
    title: "增长、衰减与迭代",
    selection: {
      kind: "bank",
      questionCode: "ESAT-M1-MOCK-ADAPT-E06-016",
      reason: "折旧每年以当年的现值为基数，最后区分剩余价值和损失金额。",
    },
  },
};
