// 数学1几何的固定例题与自测题源；正文和答案只读取统一 Question 数据。
import type { MathematicsLearningSelection } from "./mathematicsLearningTypes.js";

export const mathsGeometrySources: Record<
  string,
  MathematicsLearningSelection
> = {
  "ESAT-TMUA-A20-M1-20260828-010-R4": {
    kind: "bank",
    questionCode: "ESAT-TMUA-A20-M1-20260828-010-R4",
    reason: "先找两条边的公共端点，再写夹角。",
  },
  "ESAT-M1-MOCK-ADAPT-E09-015": {
    kind: "bank",
    questionCode: "ESAT-M1-MOCK-ADAPT-E09-015",
    reason: "先找两条边的公共端点，再写夹角。",
  },
  "ENGAA_2017_S1-Q017": {
    kind: "annual",
    questionCode: "ENGAA_2017_S1-Q017",
    year: 2017,
    exam: "ENGAA",
    reason: "比较正多边形，先用外角 360°/n。",
  },
  ESAT_LEGACY_2022_NSAA_Q018: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2022_NSAA_Q018",
    year: 2022,
    exam: "NSAA",
    reason: "比较正多边形，先用外角 360°/n。",
  },
  "NSAA_2016_S1-Q017": {
    kind: "annual",
    questionCode: "NSAA_2016_S1-Q017",
    year: 2016,
    exam: "NSAA",
    reason: "先用图形性质造直角三角形，再求尺度。",
  },
  ESAT_LEGACY_2018_ENGAA_Q23: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2018_ENGAA_Q23",
    year: 2018,
    exam: "ENGAA",
    reason: "先用图形性质造直角三角形，再求尺度。",
  },
  "NSAA_2019_S1-Q011": {
    kind: "annual",
    questionCode: "NSAA_2019_S1-Q011",
    year: 2019,
    exam: "NSAA",
    reason: "全等先给对应关系，再按所求方向投影。",
  },
  "ESAT-TMUA-N40R9-M1-20260914-037": {
    kind: "bank",
    questionCode: "ESAT-TMUA-N40R9-M1-20260914-037",
    reason: "全等先给对应关系，再按所求方向投影。",
  },
  ESAT_LEGACY_2022_NSAA_Q016: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2022_NSAA_Q016",
    year: 2022,
    exam: "NSAA",
    reason: "比例先对齐整边，最后确认问的是哪一条。",
  },
  "ESAT-TMUA-A20-M1-20260828-006-R2": {
    kind: "bank",
    questionCode: "ESAT-TMUA-A20-M1-20260828-006-R2",
    reason: "比例先对齐整边，最后确认问的是哪一条。",
  },
  ESAT_LEGACY_2022_NSAA_Q019: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2022_NSAA_Q019",
    year: 2022,
    exam: "NSAA",
    reason: "先求终点减起点，再拆成分量方程。",
  },
  "NSAA_2019_S1-Q014": {
    kind: "annual",
    questionCode: "NSAA_2019_S1-Q014",
    year: 2019,
    exam: "NSAA",
    reason: "先求终点减起点，再拆成分量方程。",
  },
  ESAT_LEGACY_2022_NSAA_Q002: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2022_NSAA_Q002",
    year: 2022,
    exam: "NSAA",
    reason: "有公共边，优先用两个平方关系相减。",
  },
  ESAT_LEGACY_2021_NSAA_Q009: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2021_NSAA_Q009",
    year: 2021,
    exam: "NSAA",
    reason: "有公共边，优先用两个平方关系相减。",
  },
  ESAT_LEGACY_2018_ENGAA_Q07: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2018_ENGAA_Q07",
    year: 2018,
    exam: "ENGAA",
    reason: "先辨认直径，再做半径换算。",
  },
  "ESAT-M1-MOCK-ADAPT-E11-027": {
    kind: "bank",
    questionCode: "ESAT-M1-MOCK-ADAPT-E11-027",
    reason: "先辨认直径，再做半径换算。",
  },
  ESAT_LEGACY_2021_NSAA_Q014: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2021_NSAA_Q014",
    year: 2021,
    exam: "NSAA",
    reason: "大圆周角先处理反角，再平分弦与中心角。",
  },
  "ESAT-M1-MOCK-ADAPT-R2-E09-020-V2": {
    kind: "bank",
    questionCode: "ESAT-M1-MOCK-ADAPT-R2-E09-020-V2",
    reason: "大圆周角先处理反角，再平分弦与中心角。",
  },
  "NSAA_2017_S1-Q008": {
    kind: "annual",
    questionCode: "NSAA_2017_S1-Q008",
    year: 2017,
    exam: "NSAA",
    reason: "用几何性质减少未知，再让象限筛掉无效根。",
  },
  "NSAA_2016_S1-Q018": {
    kind: "annual",
    questionCode: "NSAA_2016_S1-Q018",
    year: 2016,
    exam: "NSAA",
    reason: "用几何性质减少未知，再让象限筛掉无效根。",
  },
  ESAT_LEGACY_2021_NSAA_Q017: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2021_NSAA_Q017",
    year: 2021,
    exam: "NSAA",
    reason: "先认清体对角线，再把三个方向一起平方。",
  },
  "ESAT-M1-MOCK-ADAPT-E03-023-V2": {
    kind: "bank",
    questionCode: "ESAT-M1-MOCK-ADAPT-E03-023-V2",
    reason: "先认清体对角线，再把三个方向一起平方。",
  },
  "ESAT-TMUA-R22-M1-20260827-004-V2": {
    kind: "bank",
    questionCode: "ESAT-TMUA-R22-M1-20260827-004-V2",
    reason: "先逐格套上界，再加总；不要只数轮廓。",
  },
  "ENGAA_2016_S1-Q011": {
    kind: "annual",
    questionCode: "ENGAA_2016_S1-Q011",
    year: 2016,
    exam: "ENGAA",
    reason: "每个地点各画一条北向线，先转成内角。",
  },
  ESAT_LEGACY_2018_ENGAA_Q19: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2018_ENGAA_Q19",
    year: 2018,
    exam: "ENGAA",
    reason: "每个地点各画一条北向线，先转成内角。",
  },
  "ENGAA_2016_S1-Q015": {
    kind: "annual",
    questionCode: "ENGAA_2016_S1-Q015",
    year: 2016,
    exam: "ENGAA",
    reason: "先写几何公式，再解代数，最后回到题目所求。",
  },
  "NSAA_2023_S1-Q005": {
    kind: "annual",
    questionCode: "NSAA_2023_S1-Q005",
    year: 2023,
    exam: "NSAA",
    reason: "先写几何公式，再解代数，最后回到题目所求。",
  },
  "NSAA_2023_S1-Q001": {
    kind: "annual",
    questionCode: "NSAA_2023_S1-Q001",
    year: 2023,
    exam: "NSAA",
    reason: "先算一件的所有外露面，再乘件数。",
  },
  ESAT_LEGACY_2022_NSAA_Q013: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2022_NSAA_Q013",
    year: 2022,
    exam: "NSAA",
    reason: "先算一件的所有外露面，再乘件数。",
  },
  "ESAT-2020-MATHS1-003": {
    kind: "annual",
    questionCode: "ESAT-2020-MATHS1-003",
    year: 2020,
    exam: "NSAA",
    reason: "同一段线在不同圆中，可能一次是半径、一次是直径。",
  },
  "ESAT-M1-MOCK-ADAPT-E05-003": {
    kind: "bank",
    questionCode: "ESAT-M1-MOCK-ADAPT-E05-003",
    reason: "同一段线在不同圆中，可能一次是半径、一次是直径。",
  },
  "NSAA_2023_S1-Q013": {
    kind: "annual",
    questionCode: "NSAA_2023_S1-Q013",
    year: 2023,
    exam: "NSAA",
    reason: "面积比先开方，再进入体积比。",
  },
  "ESAT-TMUA-N40-M1-20260910-005": {
    kind: "bank",
    questionCode: "ESAT-TMUA-N40-M1-20260910-005",
    reason: "面积比先开方，再进入体积比。",
  },
  "NSAA_2023_S1-Q010": {
    kind: "annual",
    questionCode: "NSAA_2023_S1-Q010",
    year: 2023,
    exam: "NSAA",
    reason: "三角比给边的比例，勾股给实际尺度。",
  },
  ESAT_LEGACY_2021_NSAA_Q013: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2021_NSAA_Q013",
    year: 2021,
    exam: "NSAA",
    reason: "三角比给边的比例，勾股给实际尺度。",
  },
  "NSAA_2023_S1-Q017": {
    kind: "annual",
    questionCode: "NSAA_2023_S1-Q017",
    year: 2023,
    exam: "NSAA",
    reason: "沿箭头加，逆箭头减；每一步都写起点与终点。",
  },
  "ESAT-M1-MOCK-ADAPT-E07-009": {
    kind: "bank",
    questionCode: "ESAT-M1-MOCK-ADAPT-E07-009",
    reason: "沿箭头加，逆箭头减；每一步都写起点与终点。",
  },
};

export const mathsGeometrySelfChecks: Record<
  string,
  { title: string; selection: MathematicsLearningSelection | null }
> = {
  "110501": {
    title: "几何术语与记号",
    selection: {
      kind: "bank",
      questionCode: "ESAT-M1-MOCK-ADAPT-E09-015",
      reason: "先找两条边的公共端点，再写夹角。",
    },
  },
  "110502": {
    title: "角度性质",
    selection: {
      kind: "annual",
      questionCode: "ESAT_LEGACY_2022_NSAA_Q018",
      year: 2022,
      exam: "NSAA",
      reason: "比较正多边形，先用外角 360°/n。",
    },
  },
  "110503": {
    title: "四边形与三角形性质",
    selection: {
      kind: "annual",
      questionCode: "ESAT_LEGACY_2018_ENGAA_Q23",
      year: 2018,
      exam: "ENGAA",
      reason: "先用图形性质造直角三角形，再求尺度。",
    },
  },
  "110504": {
    title: "三角形全等",
    selection: {
      kind: "bank",
      questionCode: "ESAT-TMUA-N40R9-M1-20260914-037",
      reason: "全等先给对应关系，再按所求方向投影。",
    },
  },
  "110505": {
    title: "角、全等与相似推理",
    selection: {
      kind: "bank",
      questionCode: "ESAT-TMUA-A20-M1-20260828-006-R2",
      reason: "比例先对齐整边，最后确认问的是哪一条。",
    },
  },
  "110506": {
    title: "几何变换与平移向量",
    selection: {
      kind: "annual",
      questionCode: "NSAA_2019_S1-Q014",
      year: 2019,
      exam: "NSAA",
      reason: "先求终点减起点，再拆成分量方程。",
    },
  },
  "110507": {
    title: "勾股定理",
    selection: {
      kind: "annual",
      questionCode: "ESAT_LEGACY_2021_NSAA_Q009",
      year: 2021,
      exam: "NSAA",
      reason: "有公共边，优先用两个平方关系相减。",
    },
  },
  "110508": {
    title: "圆的术语",
    selection: {
      kind: "bank",
      questionCode: "ESAT-M1-MOCK-ADAPT-E11-027",
      reason: "先辨认直径，再做半径换算。",
    },
  },
  "110509": {
    title: "圆定理",
    selection: {
      kind: "bank",
      questionCode: "ESAT-M1-MOCK-ADAPT-R2-E09-020-V2",
      reason: "大圆周角先处理反角，再平分弦与中心角。",
    },
  },
  "110510": {
    title: "坐标几何问题",
    selection: {
      kind: "annual",
      questionCode: "NSAA_2016_S1-Q018",
      year: 2016,
      exam: "NSAA",
      reason: "用几何性质减少未知，再让象限筛掉无效根。",
    },
  },
  "110511": {
    title: "三维图形术语",
    selection: {
      kind: "bank",
      questionCode: "ESAT-M1-MOCK-ADAPT-E03-023-V2",
      reason: "先认清体对角线，再把三个方向一起平方。",
    },
  },
  "110512": {
    title: "平面图与立面图",
    selection: {
      kind: "bank",
      questionCode: "ESAT-TMUA-R22-M1-20260827-004-V2",
      reason: "先逐格套上界，再加总；不要只数轮廓。",
    },
  },
  "110513": {
    title: "地图、比例图与方位角",
    selection: {
      kind: "annual",
      questionCode: "ESAT_LEGACY_2018_ENGAA_Q19",
      year: 2018,
      exam: "ENGAA",
      reason: "每个地点各画一条北向线，先转成内角。",
    },
  },
  "110514": {
    title: "基础图形面积与体积",
    selection: {
      kind: "annual",
      questionCode: "NSAA_2023_S1-Q005",
      year: 2023,
      exam: "NSAA",
      reason: "先写几何公式，再解代数，最后回到题目所求。",
    },
  },
  "110515": {
    title: "圆、圆柱与复合立体",
    selection: {
      kind: "annual",
      questionCode: "ESAT_LEGACY_2022_NSAA_Q013",
      year: 2022,
      exam: "NSAA",
      reason: "先算一件的所有外露面，再乘件数。",
    },
  },
  "110516": {
    title: "弧长与扇形",
    selection: {
      kind: "bank",
      questionCode: "ESAT-M1-MOCK-ADAPT-E05-003",
      reason: "同一段线在不同圆中，可能一次是半径、一次是直径。",
    },
  },
  "110517": {
    title: "全等、相似与比例关系",
    selection: {
      kind: "bank",
      questionCode: "ESAT-TMUA-N40-M1-20260910-005",
      reason: "面积比先开方，再进入体积比。",
    },
  },
  "110518": {
    title: "直角三角形三角比",
    selection: {
      kind: "annual",
      questionCode: "ESAT_LEGACY_2021_NSAA_Q013",
      year: 2021,
      exam: "NSAA",
      reason: "三角比给边的比例，勾股给实际尺度。",
    },
  },
  "110519": {
    title: "向量与几何论证",
    selection: {
      kind: "bank",
      questionCode: "ESAT-M1-MOCK-ADAPT-E07-009",
      reason: "沿箭头加，逆箭头减；每一步都写起点与终点。",
    },
  },
};
