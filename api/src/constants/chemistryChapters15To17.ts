// 化学第十五至十七章的审阅题源与逐点自测；保留原题编号，关联迁移不冒充直接考查。
import type { ChemistryLearningSelection } from "./chemistryLearningSources.js";
import type { ChemistryLearningSelfCheck } from "./chemistryLearningSelfChecks.js";

export const chemistryChapters15To17Sources: Record<
  string,
  ChemistryLearningSelection
> = {
  ESAT_LEGACY_2022_NSAA_Q043: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2022_NSAA_Q043",
    year: 2022,
    exam: "NSAA",
    reason:
      "联合熔沸点与固态、液态、水溶液的导电性，判断物态中的粒子及其可移动性。",
  },
  "CHEM-MOCK-ADAPT-E04-025-R8-FINAL-20260818": {
    kind: "bank",
    questionCode: "CHEM-MOCK-ADAPT-E04-025-R8-FINAL-20260818",
    reason: "用固态氯化镁检验“有离子”与“离子能自由移动”的区别。",
  },
  ESAT_LEGACY_2018_NSAA_Q46: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2018_NSAA_Q46",
    year: 2018,
    exam: "NSAA",
    reason: "辨别沸腾时克服分子间作用而非断开分子内共价键。",
  },
  "ESAT-CHEM-AI-20260809-F735FCDBAD3A-R4": {
    kind: "bank",
    questionCode: "ESAT-CHEM-AI-20260809-F735FCDBAD3A-R4",
    reason:
      "利用冷凝前后气体体积差确认水的物态，不能把液态水继续计入气体体积。",
  },
  "CHEM-MOCK-ADAPT-E01-004-R8-FINAL-20260818": {
    kind: "bank",
    questionCode: "CHEM-MOCK-ADAPT-E01-004-R8-FINAL-20260818",
    reason: "把碳酸盐产气、二氧化碳检验和碳酸钙沉淀三步证据闭合。",
  },
  "NSAA_2019_S1-Q045": {
    kind: "annual",
    questionCode: "NSAA_2019_S1-Q045",
    year: 2019,
    exam: "NSAA",
    reason: "酸化钡盐和NaOH两项观察分别锁定阴、阳离子，再由电荷写化学式。",
  },
  "CHEM-MOCK-ADAPT-E04-027-R8-FINAL-20260818": {
    kind: "bank",
    questionCode: "CHEM-MOCK-ADAPT-E04-027-R8-FINAL-20260818",
    reason: "区分氯化银、硫酸钡沉淀与两种可溶盐混合，检查真正的检验反应。",
  },
  ESAT_LEGACY_2021_NSAA_Q047: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2021_NSAA_Q047",
    year: 2021,
    exam: "NSAA",
    reason:
      "联用卤化银颜色、酸反应产物数和氢氧化物颜色，避免仅凭白色沉淀猜离子。",
  },
  "CHEM-MOCK-ADAPT-E02-003-R8-FINAL-20260818": {
    kind: "bank",
    questionCode: "CHEM-MOCK-ADAPT-E02-003-R8-FINAL-20260818",
    reason: "取砖红焰色与白色氢氧化物两条证据的交集，识别钙离子。",
  },
  "ESAT-2020-CHEMISTRY-004": {
    kind: "annual",
    questionCode: "ESAT-2020-CHEMISTRY-004",
    year: 2020,
    exam: "NSAA",
    reason: "判断一种方法能否独立区分全部样品，不把认出一个误当成区分三个。",
  },
  "CHEM-MOCK-ADAPT-E04-015-R8-FINAL-20260818": {
    kind: "bank",
    questionCode: "CHEM-MOCK-ADAPT-E04-015-R8-FINAL-20260818",
    reason: "独立核对深红色和蓝绿色焰色，区分锂、钙与铜的颜色。",
  },
  ESAT_LEGACY_2018_NSAA_Q47: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2018_NSAA_Q47",
    year: 2018,
    exam: "NSAA",
    reason:
      "结晶水关联迁移：辨认无水盐和水合盐，原题考配液计算，不直接考水检验的白蓝变化。",
  },
  "CHEM-MOCK-ADAPT-E04-008-R8-FINAL-20260818": {
    kind: "bank",
    questionCode: "CHEM-MOCK-ADAPT-E04-008-R8-FINAL-20260818",
    reason: "结晶水关联迁移：配液质量包含五个结晶水，不代替水的显色检验。",
  },
  ESAT_LEGACY_2022_NSAA_Q052: {
    kind: "annual",
    questionCode: "ESAT_LEGACY_2022_NSAA_Q052",
    year: 2022,
    exam: "NSAA",
    reason: "把粒子数、气体体积统一为摩尔分数，再与干空气组成比较。",
  },
  "ESAT-2020-CHEMISTRY-002": {
    kind: "annual",
    questionCode: "ESAT-2020-CHEMISTRY-002",
    year: 2020,
    exam: "NSAA",
    reason: "先选空气中含量最高的三种成分，再按沸点确定分馏收集顺序。",
  },
  "ESAT-2020-CHEMISTRY-012": {
    kind: "annual",
    questionCode: "ESAT-2020-CHEMISTRY-012",
    year: 2020,
    exam: "NSAA",
    reason:
      "温室气体生成量的关联迁移：计算燃烧生成CO₂和水蒸气；原题不考红外吸收或温室效应强弱。",
  },
  "ESAT-CHEM-AI-20260809-D04F697887D6-R4": {
    kind: "bank",
    questionCode: "ESAT-CHEM-AI-20260809-D04F697887D6-R4",
    reason:
      "温室气体关联计量：按摩尔比求CO₂与CH₄的质量，不能据质量比较温室效应。",
  },
  "CHEM-MOCK-ADAPT-E01-026-R8-FINAL-20260818": {
    kind: "bank",
    questionCode: "CHEM-MOCK-ADAPT-E01-026-R8-FINAL-20260818",
    reason:
      "在污染气体反应循环中区分单步氧化剂与整体催化剂，不按污染物名称猜反应角色。",
  },
  "CHEM-MOCK-ADAPT-E02-011-R8-FINAL-20260818": {
    kind: "bank",
    questionCode: "CHEM-MOCK-ADAPT-E02-011-R8-FINAL-20260818",
    reason: "从NO/NO₂参与SO₂氧化的循环识别催化剂，迁移污染物转化的化学关系。",
  },
  "NSAA_2023_S1-Q051": {
    kind: "annual",
    questionCode: "NSAA_2023_S1-Q051",
    year: 2023,
    exam: "NSAA",
    reason: "由饮用水消毒剂投加率计算Cl₂体积，兼顾毫克换算与双原子分子。",
  },
};

export const chemistryChapters15To17SelfChecks: Record<
  string,
  ChemistryLearningSelfCheck
> = {
  "141501": {
    title: "物态中的粒子",
    selection:
      chemistryChapters15To17Sources[
        "CHEM-MOCK-ADAPT-E04-025-R8-FINAL-20260818"
      ]!,
  },
  "141502": {
    title: "状态变化与能量",
    selection:
      chemistryChapters15To17Sources["ESAT-CHEM-AI-20260809-F735FCDBAD3A-R4"]!,
  },
  "141601": {
    title: "气体检验",
    selection: {
      ...chemistryChapters15To17Sources[
        "CHEM-MOCK-ADAPT-E01-004-R8-FINAL-20260818"
      ]!,
      reason:
        "复盘：现有题库中该题直接考查CO₂检验；收起例题步骤后复做，独立解释浑浊来自CaCO₃，而非只记答案。",
    },
  },
  "141602": {
    title: "阴离子检验",
    selection:
      chemistryChapters15To17Sources[
        "CHEM-MOCK-ADAPT-E04-027-R8-FINAL-20260818"
      ]!,
  },
  "141603": {
    title: "氢氧化钠检验金属阳离子",
    selection:
      chemistryChapters15To17Sources[
        "CHEM-MOCK-ADAPT-E02-003-R8-FINAL-20260818"
      ]!,
  },
  "141604": {
    title: "焰色反应",
    selection:
      chemistryChapters15To17Sources[
        "CHEM-MOCK-ADAPT-E04-015-R8-FINAL-20260818"
      ]!,
  },
  "141605": {
    title: "水的检验",
    selection:
      chemistryChapters15To17Sources[
        "CHEM-MOCK-ADAPT-E04-008-R8-FINAL-20260818"
      ]!,
  },
  "141701": {
    title: "空气组成与分离",
    selection: chemistryChapters15To17Sources["ESAT-2020-CHEMISTRY-002"]!,
  },
  "141702": {
    title: "温室气体",
    selection:
      chemistryChapters15To17Sources["ESAT-CHEM-AI-20260809-D04F697887D6-R4"]!,
  },
  "141703": {
    title: "气态污染物",
    selection:
      chemistryChapters15To17Sources[
        "CHEM-MOCK-ADAPT-E02-011-R8-FINAL-20260818"
      ]!,
  },
  "141704": {
    title: "饮用水处理",
    selection: {
      ...chemistryChapters15To17Sources["NSAA_2023_S1-Q051"]!,
      reason:
        "复盘：当前收录的饮用水处理直接真题仅此一道，收起讲解后复做投药率→质量→Cl₂摩尔数→体积，避免用弱关联题凑数。",
    },
  },
};
