// 数学2数列与级数章固定题源：年度来源限已发布年度卷，独立题库限已发布数学2；不复制题目正文和答案。
import type { MathematicsLearningSelection } from "./mathematicsLearningTypes.js";

export const maths2SequencesSources: Record<string, MathematicsLearningSelection> =
  {
    "ENGAA_2017_S1-Q047": {
      kind: "annual",
      questionCode: "ENGAA_2017_S1-Q047",
      year: 2017,
      exam: "ENGAA",
      reason: "含参递推逐项展开，整数条件试根",
    },
    "ESAT-M2-AI-V3-0F833598F757": {
      kind: "bank",
      questionCode: "ESAT-M2-AI-V3-0F833598F757",
      reason: "连写递推各项，乘积逐项约分",
    },
    ESAT_LEGACY_2018_ENGAA_Q37: {
      kind: "annual",
      questionCode: "ESAT_LEGACY_2018_ENGAA_Q37",
      year: 2018,
      exam: "ENGAA",
      reason: "两条项关系联立解首项与公差",
    },
    "ESAT-2020-MATHS2-004": {
      kind: "annual",
      questionCode: "ESAT-2020-MATHS2-004",
      year: 2020,
      exam: "ESAT",
      reason: "“接下来20项”翻译为部分和之差",
    },
    "ENGAA_2023_S1-Q023": {
      kind: "annual",
      questionCode: "ENGAA_2023_S1-Q023",
      year: 2023,
      exam: "ENGAA",
      reason: "S9+S10=S11化为8a=−26d",
    },
    "ENGAA_2023_S1-Q025": {
      kind: "annual",
      questionCode: "ENGAA_2023_S1-Q025",
      year: 2023,
      exam: "ENGAA",
      reason: "前三项列方程，收敛条件筛分支",
    },
    ESAT_LEGACY_2021_ENGAA_Q033: {
      kind: "annual",
      questionCode: "ESAT_LEGACY_2021_ENGAA_Q033",
      year: 2021,
      exam: "ENGAA",
      reason: "偶数项子列公比为r²，先取比消首项",
    },
    "ENGAA_2016_S1-Q033": {
      kind: "annual",
      questionCode: "ENGAA_2016_S1-Q033",
      year: 2016,
      exam: "ENGAA",
      reason: "r⁴=1/4两支，第六项为正定号",
    },
    "ENGAA_2023_S1-Q037": {
      kind: "annual",
      questionCode: "ENGAA_2023_S1-Q037",
      year: 2023,
      exam: "ENGAA",
      reason: "一般项幂次定位常数项",
    },
    "NSAA_2019_S1-Q085": {
      kind: "annual",
      questionCode: "NSAA_2019_S1-Q085",
      year: 2019,
      exam: "NSAA",
      reason: "积分后幂次抬一次，先定位t³项",
    },
    ESAT_LEGACY_2018_ENGAA_Q47: {
      kind: "annual",
      questionCode: "ESAT_LEGACY_2018_ENGAA_Q47",
      year: 2018,
      exam: "ENGAA",
      reason: "共轭因式合并后只剩偶次幂",
    },
  };

export const maths2SequencesSelfChecks: Record<
  string,
  { title: string; selection: MathematicsLearningSelection | null }
> = {
  "120201": {
    title: "连写递推各项，乘积逐项约分",
    selection: {
      kind: "bank",
      questionCode: "ESAT-M2-AI-V3-0F833598F757",
      reason: "连写递推各项，乘积逐项约分",
    },
  },
  "120202": {
    title: "S9+S10=S11化为8a=−26d",
    selection: {
      kind: "annual",
      questionCode: "ENGAA_2023_S1-Q023",
      year: 2023,
      exam: "ENGAA",
      reason: "S9+S10=S11化为8a=−26d",
    },
  },
  "120203": {
    title: "r⁴=1/4两支，第六项为正定号",
    selection: {
      kind: "annual",
      questionCode: "ENGAA_2016_S1-Q033",
      year: 2016,
      exam: "ENGAA",
      reason: "r⁴=1/4两支，第六项为正定号",
    },
  },
  "120204": {
    title: "共轭因式合并后只剩偶次幂",
    selection: {
      kind: "annual",
      questionCode: "ESAT_LEGACY_2018_ENGAA_Q47",
      year: 2018,
      exam: "ENGAA",
      reason: "共轭因式合并后只剩偶次幂",
    },
  },
};
