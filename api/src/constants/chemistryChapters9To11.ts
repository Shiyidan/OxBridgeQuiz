// ESAT 化学第九至十一章固定题源：年度题限年份，独立题库限已发布；正文与答案仍由 Question 提供。
import type { ChemistryLearningSelection } from "./chemistryLearningSources.js";
import type { ChemistryLearningSelfCheck } from "./chemistryLearningSelfChecks.js";

// 同一年度来源始终带年份，避免与历史组合卷的同编号记录混淆。
function annual(
  questionCode: string,
  year: number,
  reason: string,
): ChemistryLearningSelection {
  return { kind: "annual", questionCode, year, exam: "NSAA", reason };
}

// 题库题明确作为迁移练习，不将其编号标成历年真题证据。
function bank(
  questionCode: string,
  reason: string,
): ChemistryLearningSelection {
  return { kind: "bank", questionCode, reason };
}

export const chemistryChapters9To11Sources: Record<
  string,
  ChemistryLearningSelection
> = {
  "NSAA_2016_S1-Q049": annual(
    "NSAA_2016_S1-Q049",
    2016,
    "区分强弱酸的离子浓度、导电性与完全中和总量。",
  ),
  "NSAA_2017_S1-Q042": annual(
    "NSAA_2017_S1-Q042",
    2017,
    "由钙的原子序数判断氧化物式、离子键与碱性。",
  ),
  ESAT_LEGACY_2021_NSAA_Q053: annual(
    "ESAT_LEGACY_2021_NSAA_Q053",
    2021,
    "弱二元酸完全中和按物质的量比计算，不按电离程度折减。",
  ),
  "NSAA_2017_S1-Q053": annual(
    "NSAA_2017_S1-Q053",
    2017,
    "先筛出能生成目标产量的实验，再比较浓度与表面积。",
  ),
  ESAT_LEGACY_2018_NSAA_Q50: annual(
    "ESAT_LEGACY_2018_NSAA_Q50",
    2018,
    "将气体体积读数按化学计量转换成镁的平均消耗速率。",
  ),
  "NSAA_2017_S1-Q048": annual(
    "NSAA_2017_S1-Q048",
    2017,
    "改变酸浓度后重新计算限制试剂，分别判断初始斜率与平台。",
  ),
  "NSAA_2023_S1-Q041": annual(
    "NSAA_2023_S1-Q041",
    2023,
    "恒温调压改变粒子数密度与碰撞频率，而非平均动能。",
  ),
  "NSAA_2016_S1-Q048": annual(
    "NSAA_2016_S1-Q048",
    2016,
    "用带符号的反应焓与正向能垒计算逆向活化能。",
  ),
  "CHEM-MOCK-ADAPT-E03-007-R8-FINAL-20260818": bank(
    "CHEM-MOCK-ADAPT-E03-007-R8-FINAL-20260818",
    "以表面吸附、反应和解吸解释催化循环，并排除改变平衡常数。",
  ),
  "CHEM-MOCK-ADAPT-E02-023-R8-FINAL-20260818": bank(
    "CHEM-MOCK-ADAPT-E02-023-R8-FINAL-20260818",
    "由能级图两端判断吸放热，检查催化不改变焓变。",
  ),
  "NSAA_2016_S1-Q040": annual(
    "NSAA_2016_S1-Q040",
    2016,
    "由温度和压强对平衡产率的不同作用反推热效应及气体系数。",
  ),
  "CHEM-MOCK-ADAPT-E04-024-R8-FINAL-20260818": bank(
    "CHEM-MOCK-ADAPT-E04-024-R8-FINAL-20260818",
    "分步活化能分别从各步起点量，总焓变只由反应两端确定。",
  ),
  "NSAA_2023_S1-Q055": annual(
    "NSAA_2023_S1-Q055",
    2023,
    "区分温升与末温，由水吸热和传热效率倒推甲醇质量。",
  ),
  "NSAA_2023_S1-Q050": annual(
    "NSAA_2023_S1-Q050",
    2023,
    "约去两侧共同键后，利用反应焓反推两根新增 C—H 的平均键能。",
  ),
};

export const chemistryChapters9To11SelfChecks: Record<
  string,
  ChemistryLearningSelfCheck
> = {
  "140901": {
    title: "酸",
    selection: annual(
      "NSAA_2023_S1-Q054",
      2023,
      "由两次实验分别推元数、摩尔质量，并识别气泡不足以判断酸强弱。",
    ),
  },
  "140902": {
    title: "碱",
    selection: bank(
      "ESAT-DIR-0824-CHEM-Q013-20260824-V11",
      "不溶 ZnO 也接受 H⁺；保留固体氧化物并消去旁观离子。",
    ),
  },
  "140903": {
    title: "中和",
    selection: annual(
      "ESAT_LEGACY_2022_NSAA_Q056",
      2022,
      "回滴先求剩余酸，作差后按碳酸盐与 H⁺ 的 1:2 比例换算。",
    ),
  },
  "141001": {
    title: "影响速率的因素",
    selection: bank(
      "CHEM-MOCK-ADAPT-E01-008-R8-FINAL-20260818",
      "用初始速率表逐对控制变量，避免默认浓度翻倍必然速率翻倍。",
    ),
  },
  "141002": {
    title: "测量反应速率",
    selection: annual(
      "ESAT_LEGACY_2021_NSAA_Q060",
      2021,
      "由敞口容器失重构建累计产气量，核对逐段增量与反应停止。",
    ),
  },
  "141003": {
    title: "速率图像数据",
    selection: annual(
      "ESAT-2020-CHEMISTRY-014",
      2020,
      "酸浓度改变后分别检查初始斜率和限制试剂决定的平台。",
    ),
  },
  "141004": {
    title: "碰撞理论",
    selection: bank(
      "CHEM-MOCK-ADAPT-E02-006-R8-FINAL-20260818",
      "从能量分布识别升温增加超过活化能门槛的粒子比例。",
    ),
  },
  "141005": {
    title: "活化能",
    selection: bank(
      "CHEM-MOCK-ADAPT-E03-018-R8-FINAL-20260818",
      "相同外部条件下，从各自反应物能级量门槛而非比较峰顶绝对高度。",
    ),
  },
  "141006": {
    title: "催化剂",
    selection: bank(
      "CHEM-MOCK-ADAPT-E02-011-R8-FINAL-20260818",
      "按正确倍数相加分步机理，识别先消耗后再生的催化剂。",
    ),
  },
  "141101": {
    title: "放热与吸热反应",
    selection: annual(
      "ESAT_LEGACY_2021_NSAA_Q045",
      2021,
      "中和放热使温度先升，过量酸加入后稀释降温，不是焓变反向。",
    ),
  },
  "141102": {
    title: "可逆反应能量方向",
    selection: bank(
      "CHEM-MOCK-ADAPT-E02-015-R8-FINAL-20260818",
      "将吸热方向、气体数和催化剂不改 K 三条规则分别应用。",
    ),
  },
  "141103": {
    title: "能级图",
    selection: bank(
      "CHEM-MOCK-ADAPT-E02-010-R8-FINAL-20260818",
      "比较同一反应有无催化的能垒与两端能量差。",
    ),
  },
  "141104": {
    title: "量热能量变化",
    selection: annual(
      "ESAT_LEGACY_2022_NSAA_Q057",
      2022,
      "用混合溶液总质量计算热，再除限制试剂的实际反应摩尔数。",
    ),
  },
  "141105": {
    title: "键能计算",
    selection: bank(
      "CHEM-MOCK-ADAPT-E03-012-R8-FINAL-20260818",
      "氢气与氯气反应中按两根 H—Cl 成键计数，用断减成求焓变。",
    ),
  },
};
