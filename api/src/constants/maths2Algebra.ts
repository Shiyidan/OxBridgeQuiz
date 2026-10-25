// 数学2第1章代数固定题源：年度来源限已发布年度卷，独立题库限已发布数学2；不复制题目正文和答案。
import type { MathematicsLearningSelection } from "./mathematicsLearningTypes.js";

export const maths2AlgebraSources: Record<string, MathematicsLearningSelection> =
  {
    "ESAT-M2-DIRECT-006-LR3": {
      kind: "bank",
      questionCode: "ESAT-M2-DIRECT-006-LR3",
      reason: "指数律化简后约去正因式再解三次方程",
    },
    "ESAT-2026-CN-RECALL-M2-Q24": {
      kind: "bank",
      questionCode: "ESAT-2026-CN-RECALL-M2-Q24",
      reason: "先合并同类根式再整体立方",
    },
    "ENGAA_2019_S1-Q025": {
      kind: "annual",
      questionCode: "ENGAA_2019_S1-Q025",
      year: 2019,
      exam: "ENGAA",
      reason: "先有理化单层分母再取三次幂",
    },
    ESAT_LEGACY_2022_ENGAA_Q027: {
      kind: "annual",
      questionCode: "ESAT_LEGACY_2022_ENGAA_Q027",
      year: 2022,
      exam: "ENGAA",
      reason: "先约共享根式幂再有理化",
    },
    ESAT_LEGACY_2021_ENGAA_Q037: {
      kind: "annual",
      questionCode: "ESAT_LEGACY_2021_ENGAA_Q037",
      year: 2021,
      exam: "ENGAA",
      reason: "逐项有理化后错位抵消",
    },
    "ENGAA_2016_S1-Q039": {
      kind: "annual",
      questionCode: "ENGAA_2016_S1-Q039",
      year: 2016,
      exam: "ENGAA",
      reason: "两个不同实根用严格判别式",
    },
    "ENGAA_2023_S1-Q029": {
      kind: "annual",
      questionCode: "ENGAA_2023_S1-Q029",
      year: 2023,
      exam: "ENGAA",
      reason: "非首一配方比较系数后计算参数组合",
    },
    "NSAA_2023_S1-Q016": {
      kind: "annual",
      questionCode: "NSAA_2023_S1-Q016",
      year: 2023,
      exam: "NSAA",
      reason: "配方求最小指数再代回指数函数",
    },
    "ESAT-M2-MOCK-ADAPT-E02-014": {
      kind: "bank",
      questionCode: "ESAT-M2-MOCK-ADAPT-E02-014",
      reason: "把平方和整体代入消元",
    },
    "ESAT-M2-MOCK-ADAPT-E04-018": {
      kind: "bank",
      questionCode: "ESAT-M2-MOCK-ADAPT-E04-018",
      reason: "代入消元后用判别式定参数",
    },
    "ENGAA_2017_S1-Q049": {
      kind: "annual",
      questionCode: "ENGAA_2017_S1-Q049",
      year: 2017,
      exam: "ENGAA",
      reason: "偶重根不变号但要排除零点",
    },
    ESAT_LEGACY_2022_ENGAA_Q031: {
      kind: "annual",
      questionCode: "ESAT_LEGACY_2022_ENGAA_Q031",
      year: 2022,
      exam: "ENGAA",
      reason: "四次不等式换元后与非负条件取交",
    },
    "NSAA_2019_S1-Q089": {
      kind: "annual",
      questionCode: "NSAA_2019_S1-Q089",
      year: 2019,
      exam: "NSAA",
      reason: "完全因式分解后按重根做符号表",
    },
    "ENGAA_2023_S1-Q021": {
      kind: "annual",
      questionCode: "ENGAA_2023_S1-Q021",
      year: 2023,
      exam: "ENGAA",
      reason: "二次因式拆成两个根各给一条方程",
    },
    "ESAT-2020-MATHS2-001": {
      kind: "annual",
      questionCode: "ESAT-2020-MATHS2-001",
      year: 2020,
      exam: "ESAT",
      reason: "两个根代入得参数方程组",
    },
    "ESAT-M2-AI-V3-655314EABEC1": {
      kind: "bank",
      questionCode: "ESAT-M2-AI-V3-655314EABEC1",
      reason: "重根条件拆成函数值与导数值两条方程",
    },
    "ESAT-M2-AI-V3-8E33FB5BD33D": {
      kind: "bank",
      questionCode: "ESAT-M2-AI-V3-8E33FB5BD33D",
      reason: "复合分式化简后用根积并查定义域",
    },
    "ESAT-M2-MOCK-ADAPT-R2-E02-016": {
      kind: "bank",
      questionCode: "ESAT-M2-MOCK-ADAPT-R2-E02-016",
      reason: "复合函数方程化简后算两根乘积",
    },
  };

export const maths2AlgebraSelfChecks: Record<
  string,
  { title: string; selection: MathematicsLearningSelection | null }
> = {
  "120101": {
    title: "先合并同类根式再整体立方",
    selection: {
      kind: "bank",
      questionCode: "ESAT-2026-CN-RECALL-M2-Q24",
      reason: "先合并同类根式再整体立方",
    },
  },
  "120102": {
    title: "逐项有理化后错位抵消",
    selection: {
      kind: "annual",
      questionCode: "ESAT_LEGACY_2021_ENGAA_Q037",
      year: 2021,
      exam: "ENGAA",
      reason: "逐项有理化后错位抵消",
    },
  },
  "120103": {
    title: "配方求最小指数再代回指数函数",
    selection: {
      kind: "annual",
      questionCode: "NSAA_2023_S1-Q016",
      year: 2023,
      exam: "NSAA",
      reason: "配方求最小指数再代回指数函数",
    },
  },
  "120104": {
    title: "代入消元后用判别式定参数",
    selection: {
      kind: "bank",
      questionCode: "ESAT-M2-MOCK-ADAPT-E04-018",
      reason: "代入消元后用判别式定参数",
    },
  },
  "120105": {
    title: "完全因式分解后按重根做符号表",
    selection: {
      kind: "annual",
      questionCode: "NSAA_2019_S1-Q089",
      year: 2019,
      exam: "NSAA",
      reason: "完全因式分解后按重根做符号表",
    },
  },
  "120106": {
    title: "重根条件拆成函数值与导数值两条方程",
    selection: {
      kind: "bank",
      questionCode: "ESAT-M2-AI-V3-655314EABEC1",
      reason: "重根条件拆成函数值与导数值两条方程",
    },
  },
  "120107": {
    title: "复合函数方程化简后算两根乘积",
    selection: {
      kind: "bank",
      questionCode: "ESAT-M2-MOCK-ADAPT-R2-E02-016",
      reason: "复合函数方程化简后算两根乘积",
    },
  },
};
