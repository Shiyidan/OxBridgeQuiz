// 数学2指数与对数章固定题源：正文读取 Question，年度证据与题库自测保持来源分离。
import type { MathematicsLearningSelection } from "./mathematicsLearningTypes.js";

export const maths2ExponentialsSources: Record<
  string,
  MathematicsLearningSelection
> = {
  "NSAA_2023_S1-Q016": {
    kind: "annual",
    questionCode: "NSAA_2023_S1-Q016",
    year: 2023,
    exam: "NSAA",
    reason: "先配方确定指数下界，再利用底数10的递增性求函数最小值。",
  },
  "ENGAA_2017_S1-Q037": {
    kind: "annual",
    questionCode: "ENGAA_2017_S1-Q037",
    year: 2017,
    exam: "ENGAA",
    reason: "统一为2的幂，分清幂的幂、相除与负指数三层运算。",
  },
  ESAT_LEGACY_2018_ENGAA_Q41: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2018_ENGAA_Q41",
    year: 2018,
    exam: "ENGAA",
    reason: "先合并对数和，再识别连续分式的望远镜消去。",
  },
  "ENGAA_2023_S1-Q035": {
    kind: "annual",
    questionCode: "ENGAA_2023_S1-Q035",
    year: 2023,
    exam: "ENGAA",
    reason: "把常数变为同底对数，再用每个原真数的正性排除增根。",
  },
  "ENGAA_2017_S1-Q033": {
    kind: "annual",
    questionCode: "ENGAA_2017_S1-Q033",
    year: 2017,
    exam: "ENGAA",
    reason: "先提取始终为正的公共幂，再把合法分支转为对数。",
  },
  ESAT_LEGACY_2022_ENGAA_Q039: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2022_ENGAA_Q039",
    year: 2022,
    exam: "ENGAA",
    reason: "半指数换元后求两正根，并将根之和正确还原到x。",
  },
  "NSAA_2023_S1-Q019": {
    kind: "annual",
    questionCode: "NSAA_2023_S1-Q019",
    year: 2023,
    exam: "NSAA",
    reason: "先合成分数底数，再用正弦范围与递减性求最大值。",
  },
  "ESAT-TMUA-A20-M2-20260828-016-R2": {
    kind: "bank",
    questionCode: "ESAT-TMUA-A20-M2-20260828-016-R2",
    reason: "用同底对数的单射性得到u+v=uv，再以正性约束写全解集。",
  },
  "NSAA_2019_S1-Q081": {
    kind: "annual",
    questionCode: "NSAA_2019_S1-Q081",
    year: 2019,
    exam: "NSAA",
    reason: "指数换元时保留移位系数，解二次方程后只将正根还原。",
  },
};

export const maths2ExponentialsSelfChecks: Record<
  string,
  { title: string; selection: MathematicsLearningSelection }
> = {
  "120501": {
    title: "分数底数的指数函数：最大值对应哪个指数",
    selection: maths2ExponentialsSources["NSAA_2023_S1-Q019"]!,
  },
  "120502": {
    title: "对数的积法则：正数条件与全部解集",
    selection: maths2ExponentialsSources["ESAT-TMUA-A20-M2-20260828-016-R2"]!,
  },
  "120503": {
    title: "指数二次换元：舍去负根再取对数",
    selection: maths2ExponentialsSources["NSAA_2019_S1-Q081"]!,
  },
};
