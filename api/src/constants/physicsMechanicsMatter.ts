// 物理力学与物质固定题源：真实题目正文由Question提供，例题拆解独立编写，自测保留原解析。
import type { PhysicsLearningSelection } from "./physicsLearningTypes.js";

export const physicsMechanicsMatterSources: Record<
  string,
  PhysicsLearningSelection
> = {
  "NSAA_2023_S1-Q025": {
    kind: "annual",
    questionCode: "NSAA_2023_S1-Q025",
    year: 2023,
    exam: "NSAA",
    reason: "先选正方向，再把图像的斜率、面积与运动过程对应起来。",
  },
  ESAT_LEGACY_2021_NSAA_Q034: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2021_NSAA_Q034",
    year: 2021,
    exam: "NSAA",
    reason: "先选正方向，再把图像的斜率、面积与运动过程对应起来。",
  },
  "ESAT-2020-PHYSICS-017": {
    kind: "annual",
    questionCode: "ESAT-2020-PHYSICS-017",
    year: 2020,
    exam: "NSAA",
    reason: "先确定研究对象，把真正作用在它上面的力画全，再求合力。",
  },
  ESAT_LEGACY_2018_ENGAA_Q16: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2018_ENGAA_Q16",
    year: 2018,
    exam: "ENGAA",
    reason: "先确定研究对象，把真正作用在它上面的力画全，再求合力。",
  },
  "NSAA_2019_S1-Q024": {
    kind: "annual",
    questionCode: "NSAA_2019_S1-Q024",
    year: 2019,
    exam: "NSAA",
    reason: "伸长不是总长；图下的面积给能量，卸载后能否恢复才判断弹性。",
  },
  "ESAT-PHY-MOCK-ADAPT-E16-026-R44": {
    kind: "bank",
    questionCode: "ESAT-PHY-MOCK-ADAPT-E16-026-R44",
    reason: "伸长不是总长；图下的面积给能量，卸载后能否恢复才判断弹性。",
  },
  ESAT_LEGACY_2021_NSAA_Q024: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2021_NSAA_Q024",
    year: 2021,
    exam: "NSAA",
    reason: "合力改变运动状态；质量反映惯性，第三定律的两股力作用在不同物体。",
  },
  "ESAT-2020-PHYSICS-020": {
    kind: "annual",
    questionCode: "ESAT-2020-PHYSICS-020",
    year: 2020,
    exam: "NSAA",
    reason: "合力改变运动状态；质量反映惯性，第三定律的两股力作用在不同物体。",
  },
  "NSAA_2023_S1-Q021": {
    kind: "annual",
    questionCode: "NSAA_2023_S1-Q021",
    year: 2023,
    exam: "NSAA",
    reason: "质量不随地点改变，重量取决于g；终端速度来自力平衡。",
  },
  "ENGAA_2017_S1-Q024": {
    kind: "annual",
    questionCode: "ENGAA_2017_S1-Q024",
    year: 2017,
    exam: "ENGAA",
    reason: "质量不随地点改变，重量取决于g；终端速度来自力平衡。",
  },
  "ENGAA_2017_S1-Q022": {
    kind: "annual",
    questionCode: "ENGAA_2017_S1-Q022",
    year: 2017,
    exam: "ENGAA",
    reason: "选定正方向，在系统边界内守恒；反弹时速度的符号不能丢。",
  },
  ESAT_LEGACY_2018_ENGAA_Q12: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2018_ENGAA_Q12",
    year: 2018,
    exam: "ENGAA",
    reason: "选定正方向，在系统边界内守恒；反弹时速度的符号不能丢。",
  },
  ESAT_LEGACY_2022_NSAA_Q026: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2022_NSAA_Q026",
    year: 2022,
    exam: "NSAA",
    reason: "画出能量从哪里来、到哪里去；输入功不一定全部变成动能。",
  },
  "ESAT-2020-PHYSICS-012": {
    kind: "annual",
    questionCode: "ESAT-2020-PHYSICS-012",
    year: 2020,
    exam: "NSAA",
    reason: "画出能量从哪里来、到哪里去；输入功不一定全部变成动能。",
  },
  "ESAT-2020-PHYSICS-003": {
    kind: "annual",
    questionCode: "ESAT-2020-PHYSICS-003",
    year: 2020,
    exam: "NSAA",
    reason: "用粒子间距、相互作用和运动方式，解释形状、体积与压缩性。",
  },
  "ESAT-PHY-MOCK-ADAPT-E03-017-V2": {
    kind: "bank",
    questionCode: "ESAT-PHY-MOCK-ADAPT-E03-017-V2",
    reason: "用粒子间距、相互作用和运动方式，解释形状、体积与压缩性。",
  },
  "NSAA_2019_S1-Q025": {
    kind: "annual",
    questionCode: "NSAA_2019_S1-Q025",
    year: 2019,
    exam: "NSAA",
    reason: "先检查定量、恒温，再用绝对压强乘体积保持不变。",
  },
  ESAT_LEGACY_2021_NSAA_Q022: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2021_NSAA_Q022",
    year: 2021,
    exam: "NSAA",
    reason: "先检查定量、恒温，再用绝对压强乘体积保持不变。",
  },
  "NSAA_2023_S1-Q033": {
    kind: "annual",
    questionCode: "NSAA_2023_S1-Q033",
    year: 2023,
    exam: "NSAA",
    reason: "先判断是否已经完成相变，再决定用潜热还是升温公式。",
  },
  ESAT_LEGACY_2021_NSAA_Q038: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2021_NSAA_Q038",
    year: 2021,
    exam: "NSAA",
    reason: "先判断是否已经完成相变，再决定用潜热还是升温公式。",
  },
  ESAT_LEGACY_2018_ENGAA_Q20: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2018_ENGAA_Q20",
    year: 2018,
    exam: "ENGAA",
    reason: "先取真正的材料体积和净质量，再用质量除体积。",
  },
  "ESAT-2020-PHYSICS-014": {
    kind: "annual",
    questionCode: "ESAT-2020-PHYSICS-014",
    year: 2020,
    exam: "NSAA",
    reason: "先取真正的材料体积和净质量，再用质量除体积。",
  },
  ESAT_LEGACY_2021_NSAA_Q039: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2021_NSAA_Q039",
    year: 2021,
    exam: "NSAA",
    reason: "固体看实际受力面积，液体看测点上方的竖直液柱。",
  },
  "NSAA_2023_S1-Q028": {
    kind: "annual",
    questionCode: "NSAA_2023_S1-Q028",
    year: 2023,
    exam: "NSAA",
    reason: "固体看实际受力面积，液体看测点上方的竖直液柱。",
  },
};

export const physicsMechanicsMatterSelfChecks: Record<
  string,
  { title: string; selection: PhysicsLearningSelection | null }
> = {
  "130301": {
    title: "加速、巡航、制动的总时间",
    selection: physicsMechanicsMatterSources["ESAT_LEGACY_2021_NSAA_Q034"]!,
  },
  "130302": {
    title: "下落但有空气阻力：由合力求质量",
    selection: physicsMechanicsMatterSources["ESAT_LEGACY_2018_ENGAA_Q16"]!,
  },
  "130303": {
    title: "同一弹簧的力与伸长比例",
    selection:
      physicsMechanicsMatterSources["ESAT-PHY-MOCK-ADAPT-E16-026-R44"]!,
  },
  "130304": {
    title: "恒推力、质量减少：加速度怎样变化",
    selection: physicsMechanicsMatterSources["ESAT-2020-PHYSICS-020"]!,
  },
  "130305": {
    title: "降落伞终端下落：动能、功率与力对",
    selection: physicsMechanicsMatterSources["ENGAA_2017_S1-Q024"]!,
  },
  "130306": {
    title: "已知动量与动能，反求质量",
    selection: physicsMechanicsMatterSources["ESAT_LEGACY_2018_ENGAA_Q12"]!,
  },
  "130307": {
    title: "黏合碰撞后，有多少动能转成其他形式",
    selection: physicsMechanicsMatterSources["ESAT-2020-PHYSICS-012"]!,
  },
  "130501": {
    title: "液体粒子：既接近，又可以相互换位",
    selection: physicsMechanicsMatterSources["ESAT-PHY-MOCK-ADAPT-E03-017-V2"]!,
  },
  "130502": {
    title: "恒温压缩后气体密度的变化",
    selection: physicsMechanicsMatterSources["ESAT_LEGACY_2021_NSAA_Q022"]!,
  },
  "130503": {
    title: "冰全部熔化后的共同温度",
    selection: physicsMechanicsMatterSources["ESAT_LEGACY_2021_NSAA_Q038"]!,
  },
  "130504": {
    title: "同体积钢块与混凝土块的总质量",
    selection: physicsMechanicsMatterSources["ESAT-2020-PHYSICS-014"]!,
  },
  "130505": {
    title: "由接触压强、体积反求材料密度",
    selection: physicsMechanicsMatterSources["NSAA_2023_S1-Q028"]!,
  },
};
