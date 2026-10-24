// 数学1概率固定题源：年度证据来自已发布年度卷，独立题库均为已发布数学1；正文与答案仍从Question读取。
import type { MathematicsLearningSelection } from "./mathematicsLearningTypes.js";

export const mathsProbabilitySources: Record<
  string,
  MathematicsLearningSelection
> = {
  ESAT_LEGACY_2018_ENGAA_Q01: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2018_ENGAA_Q01",
    year: 2018,
    exam: "ENGAA",
    reason: "先补双向表，再读所求频数",
  },
  "ESAT-M1-MOCK-ADAPT-E08-005": {
    kind: "bank",
    questionCode: "ESAT-M1-MOCK-ADAPT-E08-005",
    reason: "公平基本结果与重复试验的桥梁",
  },
  "ESAT-M1-DIRECT-031-LR3": {
    kind: "bank",
    questionCode: "ESAT-M1-DIRECT-031-LR3",
    reason: "把不同样本量的记录转成概率估计",
  },
  "ESAT-2020-MATHS1-015": {
    kind: "annual",
    questionCode: "ESAT-2020-MATHS1-015",
    year: 2020,
    exam: "NSAA",
    reason: "至少一个偶数：用零个偶数反推",
  },
  ESAT_LEGACY_2022_NSAA_Q017: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2022_NSAA_Q017",
    year: 2022,
    exam: "NSAA",
    reason: "按递增三元组系统筛选直角三角形",
  },
  ESAT_LEGACY_2022_NSAA_Q004: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2022_NSAA_Q004",
    year: 2022,
    exam: "NSAA",
    reason: "重复标签骰子：保留每个面的位置",
  },
  "NSAA_2019_S1-Q015": {
    kind: "annual",
    questionCode: "NSAA_2019_S1-Q015",
    year: 2019,
    exam: "NSAA",
    reason: "先选箱后抽球：两条路径分别加权",
  },
  "NSAA_2023_S1-Q020": {
    kind: "annual",
    questionCode: "NSAA_2023_S1-Q020",
    year: 2023,
    exam: "NSAA",
    reason: "转移后再抽：更新第二袋并反推数量",
  },
};

export const mathsProbabilitySelfChecks: Record<
  string,
  { title: string; selection: MathematicsLearningSelection | null }
> = {
  "110701": {
    title: "频数表与条件范围",
    selection: {
      kind: "annual",
      questionCode: "ENGAA_2016_S1-Q023",
      year: 2016,
      exam: "ENGAA",
      reason: "频数表与条件范围",
    },
  },
  "110702": {
    title: "公平骰子与独立重复",
    selection: {
      kind: "bank",
      questionCode: "ESAT-M1-DIRECT-008-LR3",
      reason: "公平骰子与独立重复",
    },
  },
  "110703": {
    title: "理论概率与重复扇区标签",
    selection: {
      kind: "annual",
      questionCode: "ESAT-2020-MATHS1-004",
      year: 2020,
      exam: "NSAA",
      reason: "理论概率与重复扇区标签",
    },
  },
  "110704": {
    title: "停止规则与互斥事件",
    selection: {
      kind: "annual",
      questionCode: "ESAT_LEGACY_2018_ENGAA_Q27",
      year: 2018,
      exam: "ENGAA",
      reason: "停止规则与互斥事件",
    },
  },
  "110705": {
    title: "维恩图中的仅有与重叠",
    selection: {
      kind: "annual",
      questionCode: "ESAT_LEGACY_2018_NSAA_Q14",
      year: 2018,
      exam: "NSAA",
      reason: "维恩图中的仅有与重叠",
    },
  },
  "110706": {
    title: "重复标签的面组合",
    selection: {
      kind: "bank",
      questionCode: "ESAT-M1-REM14-DIRECT-004",
      reason: "重复标签的面组合",
    },
  },
  "110707": {
    title: "不放回概率反推数量",
    selection: {
      kind: "annual",
      questionCode: "ESAT_LEGACY_2021_NSAA_Q015",
      year: 2021,
      exam: "NSAA",
      reason: "不放回概率反推数量",
    },
  },
};
