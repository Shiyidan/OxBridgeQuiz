// 物理电学、磁学与热学固定题源：题目读取Question，讲义只保存来源与教学选择理由。
import type { PhysicsLearningSelection } from "./physicsLearningTypes.js";

export const physicsElectricityMagnetismThermalSources: Record<
  string,
  PhysicsLearningSelection
> = {
  "ESAT-PHY-MOCK-ADAPT-E03-008-R44": {
    kind: "bank",
    questionCode: "ESAT-PHY-MOCK-ADAPT-E03-008-R44",
    reason: "玻璃棒带正电：谁把电子交给了谁？",
  },
  "ENGAA_2016_S1-Q008": {
    kind: "annual",
    questionCode: "ENGAA_2016_S1-Q008",
    year: 2016,
    exam: "ENGAA",
    reason: "最大功率：先让串联电流最大",
  },
  "ENGAA_2017_S1-Q020": {
    kind: "annual",
    questionCode: "ENGAA_2017_S1-Q020",
    year: 2017,
    exam: "ENGAA",
    reason: "电热水壶：从功率走到电荷",
  },
  "ESAT-2025-CN-RECALL-PHY-Q19": {
    kind: "bank",
    questionCode: "ESAT-2025-CN-RECALL-PHY-Q19",
    reason: "线圈断电后：软铁会留下强磁性吗？",
  },
  "ESAT-PHY-MOCK-ADAPT-E03-003-V2": {
    kind: "bank",
    questionCode: "ESAT-PHY-MOCK-ADAPT-E03-003-V2",
    reason: "三个线圈：先统一电流，再比较匝密度",
  },
  "NSAA_2019_S1-Q029": {
    kind: "annual",
    questionCode: "NSAA_2019_S1-Q029",
    year: 2019,
    exam: "NSAA",
    reason: "202 g变198 g：为什么只取一半差值？",
  },
  "ESAT-PHY-MOCK-ADAPT-E11-016-V2": {
    kind: "bank",
    questionCode: "ESAT-PHY-MOCK-ADAPT-E11-016-V2",
    reason: "提高发电机峰值：逐项核对四个改变",
  },
  "NSAA_2019_S1-Q026": {
    kind: "annual",
    questionCode: "NSAA_2019_S1-Q026",
    year: 2019,
    exam: "NSAA",
    reason: "升压20倍后，电缆发热用哪个电流？",
  },
  ESAT_LEGACY_2018_NSAA_Q24: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2018_NSAA_Q24",
    year: 2018,
    exam: "NSAA",
    reason: "导热率公式：不记常数也能选出关系",
  },
  "ENGAA_2017_S1-Q004": {
    kind: "annual",
    questionCode: "ENGAA_2017_S1-Q004",
    year: 2017,
    exam: "ENGAA",
    reason: "固定质量与固定体积：三句话不能混着读",
  },
  "ENGAA_2016_S1-Q010": {
    kind: "annual",
    questionCode: "ENGAA_2016_S1-Q010",
    year: 2016,
    exam: "ENGAA",
    reason: "半径变100倍、温度减半：辐射如何变？",
  },
  "NSAA_2019_S1-Q023": {
    kind: "annual",
    questionCode: "NSAA_2019_S1-Q023",
    year: 2019,
    exam: "NSAA",
    reason: "初温−21°C：75°C是温升还是末温？",
  },
  "ESAT-PHY-MOCK-ADAPT-E11-014": {
    kind: "bank",
    questionCode: "ESAT-PHY-MOCK-ADAPT-E11-014",
    reason: "排斥证据辨认同号电荷，区别带电棒对中性导体的吸引。",
  },
  "NSAA_2017_S1-Q022": {
    kind: "annual",
    questionCode: "NSAA_2017_S1-Q022",
    year: 2017,
    exam: "NSAA",
    reason: "先从电荷流率计算电流，再用欧姆关系求电阻。",
  },
  "ESAT-PHY-MOCK-ADAPT-E16-015": {
    kind: "bank",
    questionCode: "ESAT-PHY-MOCK-ADAPT-E16-015",
    reason: "直接考软磁材料易磁化、易退磁的性质，以变压器铁芯为使用情境。",
  },
  "ESAT-PHY-MOCK-ADAPT-E13-014": {
    kind: "bank",
    questionCode: "ESAT-PHY-MOCK-ADAPT-E13-014",
    reason: "固定电流条件下比较匝密度和铁芯对磁场的影响。",
  },
  "ESAT-PHY-MOCK-ADAPT-E17-009": {
    kind: "bank",
    questionCode: "ESAT-PHY-MOCK-ADAPT-E17-009",
    reason: "将克换为千克，由重力确定磁力，再使用垂直导线的F=BIL。",
  },
  "ESAT-PHY-MOCK-ADAPT-E14-010": {
    kind: "bank",
    questionCode: "ESAT-PHY-MOCK-ADAPT-E14-010",
    reason: "区分磁场、匝数、转速与铁芯对峰值的影响。",
  },
  ESAT_LEGACY_2021_NSAA_Q023: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2021_NSAA_Q023",
    year: 2021,
    exam: "NSAA",
    reason: "由实际输出电流计算功率，辨别理想电压比与非理想功率效率。",
  },
  "NSAA_2016_S1-Q021": {
    kind: "annual",
    questionCode: "NSAA_2016_S1-Q021",
    year: 2016,
    exam: "NSAA",
    reason: "比较温差而不是单独端点温度，识别同升温对稳态导热率的影响。",
  },
  "ESAT-PHY-MOCK-ADAPT-E07-001": {
    kind: "bank",
    questionCode: "ESAT-PHY-MOCK-ADAPT-E07-001",
    reason: "直接检验热膨胀、密度下降与流体循环的因果链。",
  },
  "ESAT-2020-PHYSICS-006": {
    kind: "annual",
    questionCode: "ESAT-2020-PHYSICS-006",
    year: 2020,
    exam: "NSAA",
    reason: "把亮面与真空的隔热作用分别对应辐射和介质传热。",
  },
  "ESAT-2020-PHYSICS-001": {
    kind: "annual",
    questionCode: "ESAT-2020-PHYSICS-001",
    year: 2020,
    exam: "NSAA",
    reason: "从输入Pt减去铜头储存的mcΔT，计算散失能量。",
  },
};

export const physicsElectricityMagnetismThermalSelfChecks: Record<
  string,
  { title: string; selection: PhysicsLearningSelection | null }
> = {
  "130101": {
    title: "静电排斥：能确定哪些电荷性质？",
    selection:
      physicsElectricityMagnetismThermalSources["ESAT-PHY-MOCK-ADAPT-E11-014"]!,
  },
  "130102": {
    title: "电荷、电压与电阻",
    selection: physicsElectricityMagnetismThermalSources["NSAA_2017_S1-Q022"]!,
  },
  "130201": {
    title: "软铁为什么适合变压器铁芯？",
    selection:
      physicsElectricityMagnetismThermalSources["ESAT-PHY-MOCK-ADAPT-E16-015"]!,
  },
  "130202": {
    title: "固定电流时怎样增强螺线管？",
    selection:
      physicsElectricityMagnetismThermalSources["ESAT-PHY-MOCK-ADAPT-E13-014"]!,
  },
  "130203": {
    title: "用质量测量磁力",
    selection:
      physicsElectricityMagnetismThermalSources["ESAT-PHY-MOCK-ADAPT-E17-009"]!,
  },
  "130204": {
    title: "哪些改变增加感应电压峰值？",
    selection:
      physicsElectricityMagnetismThermalSources["ESAT-PHY-MOCK-ADAPT-E14-010"]!,
  },
  "130205": {
    title: "输出电压理想，效率一定100%吗？",
    selection:
      physicsElectricityMagnetismThermalSources["ESAT_LEGACY_2021_NSAA_Q023"]!,
  },
  "130401": {
    title: "保持导热率不变",
    selection: physicsElectricityMagnetismThermalSources["NSAA_2016_S1-Q021"]!,
  },
  "130402": {
    title: "热水怎样形成对流循环？",
    selection:
      physicsElectricityMagnetismThermalSources["ESAT-PHY-MOCK-ADAPT-E07-001"]!,
  },
  "130403": {
    title: "真空瓶能阻止热辐射吗？",
    selection:
      physicsElectricityMagnetismThermalSources["ESAT-2020-PHYSICS-006"]!,
  },
  "130404": {
    title: "加热器输入能量去了哪里？",
    selection:
      physicsElectricityMagnetismThermalSources["ESAT-2020-PHYSICS-001"]!,
  },
};
