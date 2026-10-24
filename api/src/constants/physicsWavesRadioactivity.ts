// ESAT物理波与放射性的固定例题及自测映射；年度真题与题库题分别标识，保留原始题干和解析。
import type { PhysicsLearningSelection } from "./physicsLearningTypes.js";

export const physicsWavesRadioactivitySources: Record<
  string,
  PhysicsLearningSelection
> = {
  "ENGAA_2016_S1-Q012": {
    kind: "annual",
    questionCode: "ENGAA_2016_S1-Q012",
    year: 2016,
    exam: "ENGAA",
    reason: "波长给了，却为什么不用？",
  },
  "NSAA_2019_S1-Q019": {
    kind: "annual",
    questionCode: "NSAA_2019_S1-Q019",
    year: 2019,
    exam: "NSAA",
    reason: "检验波的性质中的关键概念与条件，题干与解析读取现有题源。",
  },
  ESAT_LEGACY_2018_NSAA_Q32: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2018_NSAA_Q32",
    year: 2018,
    exam: "NSAA",
    reason: "用波长差读出速度差",
  },
  "ESAT-PHY-MOCK-ADAPT-E07-022": {
    kind: "bank",
    questionCode: "ESAT-PHY-MOCK-ADAPT-E07-022",
    reason: "检验波的行为中的关键概念与条件，题干与解析读取现有题源。",
  },
  "NSAA_2023_S1-Q029": {
    kind: "annual",
    questionCode: "NSAA_2023_S1-Q029",
    year: 2023,
    exam: "NSAA",
    reason: "两面镜怎样一起恢复水平出射？",
  },
  "ESAT-PHY-MOCK-ADAPT-E13-003": {
    kind: "bank",
    questionCode: "ESAT-PHY-MOCK-ADAPT-E13-003",
    reason: "检验光学中的关键概念与条件，题干与解析读取现有题源。",
  },
  ESAT_LEGACY_2021_NSAA_Q040: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2021_NSAA_Q040",
    year: 2021,
    exam: "NSAA",
    reason: "两个回波都往返，为什么最终不用再除2？",
  },
  "ESAT-PHY-MOCK-ADAPT-E01-011": {
    kind: "bank",
    questionCode: "ESAT-PHY-MOCK-ADAPT-E01-011",
    reason: "检验声波中的关键概念与条件，题干与解析读取现有题源。",
  },
  ESAT_LEGACY_2021_NSAA_Q033: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2021_NSAA_Q033",
    year: 2021,
    exam: "NSAA",
    reason: "红光、微波、热成像：三句话分别验算",
  },
  "ESAT-PHY-MOCK-ADAPT-E15-014": {
    kind: "bank",
    questionCode: "ESAT-PHY-MOCK-ADAPT-E15-014",
    reason: "检验电磁波谱中的关键概念与条件，题干与解析读取现有题源。",
  },
  "NSAA_2023_S1-Q027": {
    kind: "annual",
    questionCode: "NSAA_2023_S1-Q027",
    year: 2023,
    exam: "NSAA",
    reason: "核电荷翻倍、质量四倍：哪一个写上标？",
  },
  "ESAT-PHY-MOCK-ADAPT-E15-007-R44": {
    kind: "bank",
    questionCode: "ESAT-PHY-MOCK-ADAPT-E15-007-R44",
    reason: "检验原子结构中的关键概念与条件，题干与解析读取现有题源。",
  },
  "ESAT-2020-PHYSICS-005": {
    kind: "annual",
    questionCode: "ESAT-2020-PHYSICS-005",
    year: 2020,
    exam: "NSAA",
    reason: "铀到铅：为什么先算α，再算β−？",
  },
  "ESAT-PHY-MOCK-ADAPT-E04-010-V2": {
    kind: "bank",
    questionCode: "ESAT-PHY-MOCK-ADAPT-E04-010-V2",
    reason: "检验放射性衰变中的关键概念与条件，题干与解析读取现有题源。",
  },
  "ESAT-PHY-MOCK-ADAPT-E14-006": {
    kind: "bank",
    questionCode: "ESAT-PHY-MOCK-ADAPT-E14-006",
    reason: "题库题：穿透与偏转两条线索一起用",
  },
  "ENGAA_2017_S1-Q008": {
    kind: "annual",
    questionCode: "ENGAA_2017_S1-Q008",
    year: 2017,
    exam: "ENGAA",
    reason: "真题应用：γ探测的时间差对应多大偏移？",
  },
  "ESAT-PHY-MOCK-ADAPT-E08-008": {
    kind: "bank",
    questionCode: "ESAT-PHY-MOCK-ADAPT-E08-008",
    reason: "检验电离辐射中的关键概念与条件，题干与解析读取现有题源。",
  },
  "ENGAA_2017_S1-Q026": {
    kind: "annual",
    questionCode: "ENGAA_2017_S1-Q026",
    year: 2017,
    exam: "ENGAA",
    reason: "两个半衰期，不能混成一个平均值",
  },
  "ESAT-2020-PHYSICS-016": {
    kind: "annual",
    questionCode: "ESAT-2020-PHYSICS-016",
    year: 2020,
    exam: "NSAA",
    reason: "总计数不是净计数：先解本底",
  },
  "NSAA_2019_S1-Q036": {
    kind: "annual",
    questionCode: "NSAA_2019_S1-Q036",
    year: 2019,
    exam: "NSAA",
    reason: "检验半衰期中的关键概念与条件，题干与解析读取现有题源。",
  },
};

export const physicsWavesRadioactivitySelfChecks: Record<
  string,
  { title: string; selection: PhysicsLearningSelection | null }
> = {
  "130601": {
    title: "波的性质 · 自测",
    selection: physicsWavesRadioactivitySources["NSAA_2019_S1-Q019"]!,
  },
  "130602": {
    title: "波的行为 · 自测",
    selection: physicsWavesRadioactivitySources["ESAT-PHY-MOCK-ADAPT-E07-022"]!,
  },
  "130603": {
    title: "光学 · 自测",
    selection: physicsWavesRadioactivitySources["ESAT-PHY-MOCK-ADAPT-E13-003"]!,
  },
  "130604": {
    title: "声波 · 自测",
    selection: physicsWavesRadioactivitySources["ESAT-PHY-MOCK-ADAPT-E01-011"]!,
  },
  "130605": {
    title: "电磁波谱 · 自测",
    selection: physicsWavesRadioactivitySources["ESAT-PHY-MOCK-ADAPT-E15-014"]!,
  },
  "130701": {
    title: "原子结构 · 自测",
    selection:
      physicsWavesRadioactivitySources["ESAT-PHY-MOCK-ADAPT-E15-007-R44"]!,
  },
  "130702": {
    title: "放射性衰变 · 自测",
    selection:
      physicsWavesRadioactivitySources["ESAT-PHY-MOCK-ADAPT-E04-010-V2"]!,
  },
  "130703": {
    title: "电离辐射 · 自测",
    selection: physicsWavesRadioactivitySources["ESAT-PHY-MOCK-ADAPT-E08-008"]!,
  },
  "130704": {
    title: "半衰期 · 自测",
    selection: physicsWavesRadioactivitySources["NSAA_2019_S1-Q036"]!,
  },
};
